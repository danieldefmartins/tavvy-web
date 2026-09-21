-- Approved Free offer: no plan-based link count; one Free choice in each browse category.
-- Existing card content/ownership, plan prices, paid extras and legacy palette rights stay intact.
CREATE OR REPLACE FUNCTION public.enforce_ecard_premium_design()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE n jsonb:=to_jsonb(new); o jsonb; premium_template boolean; premium_theme boolean; publishing boolean; mixed_template boolean;
BEGIN
 IF auth.uid() IS NULL THEN RETURN new; END IF;
 IF tg_op='UPDATE' THEN o:=to_jsonb(old); END IF;
 mixed_template:=coalesce(n->>'template_id','') IN ('pro-realtor','politician-generic');
 premium_template:=coalesce(n->>'template_id','') IN ('pro-card','cover-card','full-width','pro-creative','pro-corporate','premium-static','civic-card','civic-card-flag','civic-card-bold','civic-card-clean','civic-card-rally')
  OR (n->>'template_id'='pro-realtor' AND coalesce(n->>'color_scheme_id','')<>'warm-neutral')
  OR (n->>'template_id'='politician-generic' AND coalesce(n->>'color_scheme_id','')<>'classic-blue');
 premium_theme:=coalesce(n->>'theme','') IN ('elegant','ocean','sunset','forest');
 publishing:=coalesce((n->>'is_published')::boolean,false) AND NOT coalesce((o->>'is_published')::boolean,false);
 IF (premium_template AND (tg_op='INSERT' OR n->'template_id' IS DISTINCT FROM o->'template_id' OR (mixed_template AND n->'color_scheme_id' IS DISTINCT FROM o->'color_scheme_id') OR publishing))
 OR (premium_theme AND (tg_op='INSERT' OR n->'theme' IS DISTINCT FROM o->'theme' OR publishing)) THEN
  IF NOT coalesce((public.get_my_ecard_entitlement()->>'is_pro')::boolean,false) THEN
   RAISE EXCEPTION 'An active Pro plan is required for this design or color palette.' USING errcode='42501';
  END IF;
 END IF;
 RETURN new;
END $function$;
REVOKE ALL ON FUNCTION public.enforce_ecard_premium_design() FROM PUBLIC,anon,authenticated;

-- Single snapshot JSON avoids PostgREST row truncation without bypassing the caller's RLS.
-- Explicit fields include no ownership identifiers or private card content.
CREATE FUNCTION public.get_ecard_links_v1(p_card_id uuid,p_include_inactive boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.id,'card_id',l.card_id,'platform',l.platform,'title',l.title,'url',l.url,'value',l.value,'icon',l.icon,'sort_order',l.sort_order,'is_active',l.is_active) ORDER BY l.sort_order NULLS LAST,l.id),'[]'::jsonb)
 FROM public.digital_card_links l
 WHERE l.card_id=p_card_id AND (p_include_inactive IS TRUE OR l.is_active IS TRUE);
$function$;
REVOKE ALL ON FUNCTION public.get_ecard_links_v1(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ecard_links_v1(uuid,boolean) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.replace_ecard_links(p_card_id uuid,p_links jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE item jsonb; field_name text; max_length integer; normalized jsonb; updated_count integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING errcode='42501'; END IF;
 PERFORM 1 FROM public.digital_cards WHERE id=p_card_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Card not owned by caller' USING errcode='42501'; END IF;
 IF p_links IS NULL OR jsonb_typeof(p_links)<>'array' THEN RAISE EXCEPTION 'Links must be an array'; END IF;
 -- Resource budget applies equally to Free/Pro, includes hidden links, and is checked before mutation.
 IF octet_length(p_links::text)>1048576 THEN RAISE EXCEPTION 'This link update is too large to save at once. Shorten long link text or addresses and retry. Your saved links are unchanged.' USING errcode='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_links) LOOP
  IF jsonb_typeof(item)<>'object' THEN RAISE EXCEPTION 'Each link must be an object'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE k NOT IN('id','platform','title','url','value','icon','sort_order','is_active')) THEN RAISE EXCEPTION 'Unsupported link field'; END IF;
  IF jsonb_typeof(item->'platform') IS DISTINCT FROM 'string' OR length(trim(item->>'platform'))=0 THEN RAISE EXCEPTION 'Platform required'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(item) e WHERE e.key IN('id','title','url','value','icon') AND jsonb_typeof(e.value) NOT IN('string','null')) THEN RAISE EXCEPTION 'Invalid text field'; END IF;
  IF item?'is_active' AND jsonb_typeof(item->'is_active')<>'boolean' THEN RAISE EXCEPTION 'Invalid active flag'; END IF;
  FOR field_name,max_length IN SELECT * FROM (VALUES ('id',128),('platform',128),('title',1000),('url',8192),('value',8192),('icon',128)) limits(name,max_len) LOOP
   IF length(item->>field_name)>max_length THEN
    -- Keep unchanged historical long fields editable; new oversized fields fail before any delete.
    IF field_name='id' OR NOT EXISTS(SELECT 1 FROM public.digital_card_links l WHERE l.card_id=p_card_id AND l.id::text=item->>'id' AND to_jsonb(l)->>field_name=item->>field_name) THEN
     RAISE EXCEPTION 'A link % is too long. Shorten it and retry. Your saved links are unchanged.',field_name USING errcode='22023';
    END IF;
   END IF;
  END LOOP;
 END LOOP;
 -- Normalize once, without repeatedly concatenating a growing JSON array.
 SELECT coalesce(jsonb_agg(value || jsonb_build_object('id',CASE WHEN coalesce(value->>'id','')~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (value->>'id')::uuid ELSE gen_random_uuid() END,'sort_order',ordinality-1) ORDER BY ordinality),'[]'::jsonb)
 INTO normalized FROM jsonb_array_elements(p_links) WITH ORDINALITY;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(normalized) n JOIN public.digital_card_links l ON l.id=(n.value->>'id')::uuid WHERE l.card_id<>p_card_id) THEN RAISE EXCEPTION 'Link belongs to another card' USING errcode='42501'; END IF;
 IF (SELECT count(*)<>count(DISTINCT value->>'id') FROM jsonb_array_elements(normalized)) THEN RAISE EXCEPTION 'Duplicate link ID'; END IF;
 DELETE FROM public.digital_card_links l WHERE l.card_id=p_card_id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(normalized) n WHERE (n.value->>'id')::uuid=l.id);
 INSERT INTO public.digital_card_links(id,card_id,platform,title,url,value,icon,sort_order,is_active)
 SELECT (value->>'id')::uuid,p_card_id,value->>'platform',value->>'title',value->>'url',value->>'value',value->>'icon',(value->>'sort_order')::integer,coalesce((value->>'is_active')::boolean,true)
 FROM jsonb_array_elements(normalized)
 ON CONFLICT(id) DO UPDATE SET platform=excluded.platform,title=excluded.title,url=excluded.url,value=excluded.value,icon=excluded.icon,sort_order=excluded.sort_order,is_active=excluded.is_active,updated_at=now()
 WHERE digital_card_links.card_id=p_card_id;
 GET DIAGNOSTICS updated_count=ROW_COUNT;
 IF updated_count<>jsonb_array_length(normalized) THEN RAISE EXCEPTION 'Link ownership changed' USING errcode='42501'; END IF;
END $function$;
REVOKE ALL ON FUNCTION public.replace_ecard_links(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_ecard_links(uuid,jsonb) TO authenticated,service_role;
