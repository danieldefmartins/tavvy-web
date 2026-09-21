-- Service-only cruise editorial workflow. No ships, photos or publication are seeded.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='60s';
CREATE TABLE public.cruise_ship_images(
 id uuid PRIMARY KEY,ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE RESTRICT,
 storage_path text NOT NULL UNIQUE,url text NOT NULL,mime_type text NOT NULL CHECK(mime_type='image/webp'),
 width integer NOT NULL CHECK(width BETWEEN 1 AND 2400),height integer NOT NULL CHECK(height BETWEEN 1 AND 2400),
 alt text NOT NULL DEFAULT '' CHECK(length(alt)<=500),caption text CHECK(length(caption)<=2000),
 source_id text,permission_verified boolean NOT NULL DEFAULT false,rights_note text CHECK(length(rights_note)<=2000),
 sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 1000),is_active boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(ship_id,source_id) REFERENCES public.cruise_ship_sources(ship_id,id),
 CHECK(storage_path='cruise-ships/'||ship_id::text||'/'||id::text||'.webp'),
 CHECK(url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/universe-images/' AND right(url,length(storage_path))=storage_path),
 CHECK(NOT permission_verified OR (source_id IS NOT NULL AND length(btrim(coalesce(rights_note,'')))>0))
);
-- Browser keys must not overwrite or delete this server-managed storage prefix.
CREATE POLICY cruise_admin_storage_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(bucket_id<>'universe-images' OR name NOT LIKE 'cruise-ships/%');
CREATE POLICY cruise_admin_storage_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(bucket_id<>'universe-images' OR name NOT LIKE 'cruise-ships/%') WITH CHECK(bucket_id<>'universe-images' OR name NOT LIKE 'cruise-ships/%');
CREATE POLICY cruise_admin_storage_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(bucket_id<>'universe-images' OR name NOT LIKE 'cruise-ships/%');
CREATE INDEX cruise_ship_images_order ON public.cruise_ship_images(ship_id,sort_order,id);
CREATE TABLE public.cruise_admin_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL,action text NOT NULL CHECK(action IN('upload','update')),before_state jsonb,after_state jsonb,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cruise_ship_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cruise_admin_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cruise_ship_images,public.cruise_admin_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.cruise_ship_images,public.cruise_admin_audit TO service_role;
-- Mutations use functions below; direct service writes are not needed by the editor.
CREATE FUNCTION public.admin_cruise_require_actor_v1(p_actor uuid) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR p_actor IS NULL OR NOT EXISTS(
  SELECT 1 FROM auth.users u JOIN public.user_roles r ON r.user_id=u.id
  WHERE u.id=p_actor AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now())
   AND r.role='super_admin' AND (r.expires_at IS NULL OR r.expires_at>now())
 ) THEN RAISE EXCEPTION 'Active super admin session required' USING ERRCODE='42501';END IF;
END $f$;
CREATE FUNCTION public.admin_list_cruise_ships_v1(p_actor uuid,p_query text DEFAULT '',p_operator text DEFAULT NULL,p_kind text DEFAULT NULL,p_publication text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE result jsonb;
BEGIN
 PERFORM public.admin_cruise_require_actor_v1(p_actor);
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 OR p_limit IS NULL OR p_limit<1 OR p_limit>100 OR length(coalesce(p_query,''))>160 OR (p_kind IS NOT NULL AND p_kind NOT IN('ocean','river','expedition')) OR (p_publication IS NOT NULL AND p_publication NOT IN('draft','published','archived')) THEN RAISE EXCEPTION 'Invalid cruise filter' USING ERRCODE='22023';END IF;
 WITH filtered AS(SELECT s.*,o.name operator_name FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE (p_operator IS NULL OR s.operator_id=p_operator) AND(p_kind IS NULL OR s.kind=p_kind) AND(p_publication IS NULL OR s.publication_status=p_publication)
 AND(length(btrim(coalesce(p_query,'')))=0 OR strpos(lower(s.name),lower(btrim(p_query)))>0 OR strpos(lower(o.name),lower(btrim(p_query)))>0 OR EXISTS(SELECT 1 FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id AND strpos(lower(h.name),lower(btrim(p_query)))>0))),
 paged AS(SELECT * FROM filtered ORDER BY lower(name),id OFFSET p_offset LIMIT p_limit)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY lower(p.name),p.id) FROM paged p),'[]'),'total',(SELECT count(*) FROM filtered)) INTO result;
 RETURN result;
END $f$;
CREATE FUNCTION public.admin_cruise_operators_v1(p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
BEGIN
 PERFORM public.admin_cruise_require_actor_v1(p_actor);
 RETURN(SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY lower(name),id),'[]') FROM public.cruise_operators o);
END $f$;
CREATE FUNCTION public.admin_cruise_detail_v1(p_actor uuid,p_ship uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE result jsonb;
BEGIN
 PERFORM public.admin_cruise_require_actor_v1(p_actor);
 SELECT jsonb_build_object('ship',to_jsonb(s),'operator',to_jsonb(o),'universe',jsonb_build_object('id',u.id,'name',u.name,'description',u.description,'status',u.status),
 'sources',coalesce((SELECT jsonb_agg(to_jsonb(x)-'ship_id' ORDER BY x.id) FROM public.cruise_ship_sources x WHERE ship_id=s.id),'[]'),
 'facts',coalesce((SELECT jsonb_agg(to_jsonb(x)-'ship_id'-'superseded_at' ORDER BY x.key,x.id) FROM public.cruise_ship_facts x WHERE ship_id=s.id AND superseded_at IS NULL),'[]'),
 'gallery',coalesce((SELECT jsonb_agg(to_jsonb(x)-'created_by' ORDER BY x.sort_order,x.id) FROM public.cruise_ship_images x WHERE ship_id=s.id),'[]'),
 'venues',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name,x.id) FROM public.cruise_venues x WHERE ship_id=s.id),'[]'),
 'programs',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name,x.id) FROM public.cruise_programs x WHERE ship_id=s.id),'[]')) INTO result
 FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id JOIN public.atlas_universes u ON u.id=s.universe_id WHERE s.id=p_ship;
 IF result IS NULL THEN RAISE EXCEPTION 'Ship not found' USING ERRCODE='P0002';END IF;
 RETURN result;
END $f$;
CREATE FUNCTION public.admin_cruise_register_image_v1(p_actor uuid,p_ship uuid,p_image uuid,p_path text,p_url text,p_width integer,p_height integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE image public.cruise_ship_images;
BEGIN
 PERFORM public.admin_cruise_require_actor_v1(p_actor);
 PERFORM 1 FROM public.cruise_ships WHERE id=p_ship FOR KEY SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ship not found' USING ERRCODE='P0002';END IF;
 IF p_path IS DISTINCT FROM 'cruise-ships/'||p_ship::text||'/'||p_image::text||'.webp'
  OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='universe-images' AND name=p_path)
 THEN RAISE EXCEPTION 'Verified uploaded object required' USING ERRCODE='22023';END IF;
 INSERT INTO public.cruise_ship_images(id,ship_id,storage_path,url,mime_type,width,height,created_by)
 VALUES(p_image,p_ship,p_path,p_url,'image/webp',p_width,p_height,p_actor) RETURNING * INTO image;
 INSERT INTO public.cruise_admin_audit(ship_id,actor_id,action,after_state) VALUES(p_ship,p_actor,'upload',to_jsonb(image));
 RETURN to_jsonb(image)-'created_by';
END $f$;
CREATE FUNCTION public.admin_update_cruise_ship_v1(p_actor uuid,p_ship uuid,p_expected_updated_at timestamptz,p_edit jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE previous public.cruise_ships;next_ship public.cruise_ships;patch jsonb;item jsonb;existing jsonb;cover public.cruise_ship_images;image public.cruise_ship_images;stamp timestamptz;old_state jsonb;
BEGIN
 PERFORM public.admin_cruise_require_actor_v1(p_actor);
 IF jsonb_typeof(p_edit) IS DISTINCT FROM 'object' OR pg_column_size(p_edit)>262144 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_edit) k WHERE k NOT IN('patch','sources','facts','gallery','coverImageId')) THEN RAISE EXCEPTION 'Invalid editor payload' USING ERRCODE='22023';END IF;
 SELECT * INTO previous FROM public.cruise_ships WHERE id=p_ship FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ship not found' USING ERRCODE='P0002';END IF;
 IF p_expected_updated_at IS NULL OR previous.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'Ship changed. Reload before saving.' USING ERRCODE='40001';END IF;
 patch:=coalesce(p_edit->'patch','{}');
 IF jsonb_typeof(patch)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(patch) k WHERE k NOT IN('name','operator_id','kind','operating_status','publication_status','official_url','identity_verified','overnight_public_cruise','status_source_ids','description')) THEN RAISE EXCEPTION 'Unsupported ship field' USING ERRCODE='22023';END IF;
 old_state:=jsonb_build_object('ship',to_jsonb(previous),'universe',(SELECT to_jsonb(u) FROM public.atlas_universes u WHERE id=previous.universe_id),'facts',(SELECT coalesce(jsonb_agg(to_jsonb(f)),'[]') FROM public.cruise_ship_facts f WHERE ship_id=p_ship AND superseded_at IS NULL),'gallery',(SELECT coalesce(jsonb_agg(to_jsonb(i)),'[]') FROM public.cruise_ship_images i WHERE ship_id=p_ship));
 IF p_edit ? 'sources' THEN
  IF jsonb_typeof(p_edit->'sources')<>'array' OR jsonb_array_length(p_edit->'sources')>100 THEN RAISE EXCEPTION 'Invalid sources' USING ERRCODE='22023';END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_edit->'sources') LOOP
   IF jsonb_typeof(item)<>'object' OR (item->>'checked_at')::date>current_date OR item->>'checked_at' IS NULL THEN RAISE EXCEPTION 'Sources need a valid past checked date' USING ERRCODE='22023';END IF;
   SELECT to_jsonb(s)-'ship_id' INTO existing FROM public.cruise_ship_sources s WHERE ship_id=p_ship AND id=item->>'id';
   IF FOUND THEN IF existing IS DISTINCT FROM item THEN RAISE EXCEPTION 'Historical source is immutable. Add a new source ID.' USING ERRCODE='22023';END IF;
   ELSE INSERT INTO public.cruise_ship_sources(ship_id,id,url,publisher,checked_at,source_type) VALUES(p_ship,item->>'id',item->>'url',item->>'publisher',(item->>'checked_at')::date,item->>'source_type');END IF;
  END LOOP;
 END IF;
 IF p_edit ? 'facts' THEN
  IF jsonb_typeof(p_edit->'facts')<>'array' OR jsonb_array_length(p_edit->'facts')>100 THEN RAISE EXCEPTION 'Invalid facts' USING ERRCODE='22023';END IF;
  -- Preserve superseded evidence; submitted keys are the only keys replaced.
  UPDATE public.cruise_ship_facts SET superseded_at=clock_timestamp() WHERE ship_id=p_ship AND superseded_at IS NULL AND key IN(SELECT value->>'key' FROM jsonb_array_elements(p_edit->'facts'));
  FOR item IN SELECT value FROM jsonb_array_elements(p_edit->'facts') LOOP
   IF jsonb_typeof(item)<>'object' OR (item->>'as_of')::date>current_date OR item->>'as_of' IS NULL OR NOT public.cruise_has_sources(p_ship,ARRAY(SELECT jsonb_array_elements_text(item->'source_ids'))) THEN RAISE EXCEPTION 'Facts require dated ship sources' USING ERRCODE='22023';END IF;
   IF item->'value'<>'null'::jsonb AND ((item->>'key' IN('entered_service','last_refurbished','deck_plan_url','accessibility_url') AND jsonb_typeof(item->'value')<>'string') OR (item->>'key' NOT IN('entered_service','last_refurbished','deck_plan_url','accessibility_url') AND (jsonb_typeof(item->'value')<>'number' OR (item->>'value')::numeric<0))) THEN RAISE EXCEPTION 'Fact value type is invalid' USING ERRCODE='22023';END IF;
   IF item->>'key' IN('deck_plan_url','accessibility_url') AND item->'value'<>'null'::jsonb AND NOT(item->>'value' ~ '^https://[^[:space:]@]+$') THEN RAISE EXCEPTION 'Fact URL requires HTTPS' USING ERRCODE='22023';END IF;
   IF item->>'key' NOT IN('length_m','entered_service','last_refurbished','deck_plan_url','accessibility_url') AND jsonb_typeof(item->'value')='number' AND (item->>'value')::numeric<>trunc((item->>'value')::numeric) THEN RAISE EXCEPTION 'Fact requires an integer count or year' USING ERRCODE='22023';END IF;
   INSERT INTO public.cruise_ship_facts(ship_id,key,value,source_ids,as_of,verification,note) VALUES(p_ship,item->>'key',item->'value',ARRAY(SELECT jsonb_array_elements_text(item->'source_ids')),(item->>'as_of')::date,item->>'verification',item->>'note');
  END LOOP;
 END IF;
 IF p_edit ? 'gallery' THEN
  IF jsonb_typeof(p_edit->'gallery')<>'array' OR jsonb_array_length(p_edit->'gallery')>100 THEN RAISE EXCEPTION 'Invalid gallery' USING ERRCODE='22023';END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_edit->'gallery') LOOP
   SELECT * INTO image FROM public.cruise_ship_images WHERE id=(item->>'id')::uuid AND ship_id=p_ship FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Image does not belong to ship' USING ERRCODE='22023';END IF;
   IF (item->>'permission_verified')::boolean AND (NOT public.cruise_has_sources(p_ship,ARRAY[item->>'source_id']) OR length(btrim(coalesce(item->>'rights_note','')))=0) THEN RAISE EXCEPTION 'Image needs source and rights verification' USING ERRCODE='22023';END IF;
   UPDATE public.cruise_ship_images SET alt=item->>'alt',caption=item->>'caption',source_id=item->>'source_id',permission_verified=(item->>'permission_verified')::boolean,rights_note=item->>'rights_note',sort_order=(item->>'sort_order')::integer,is_active=(item->>'is_active')::boolean,updated_at=clock_timestamp() WHERE id=image.id;
  END LOOP;
 END IF;
 SELECT * INTO next_ship FROM jsonb_populate_record(previous,patch-'description');
 IF p_edit ? 'coverImageId' THEN
  IF p_edit->'coverImageId'='null'::jsonb THEN next_ship.photo:=NULL;
  ELSE
   SELECT * INTO cover FROM public.cruise_ship_images WHERE id=(p_edit->>'coverImageId')::uuid AND ship_id=p_ship;
   IF NOT FOUND OR NOT cover.is_active OR NOT cover.permission_verified OR NOT public.cruise_has_sources(p_ship,ARRAY[cover.source_id]) THEN RAISE EXCEPTION 'Cover requires an active rights-verified ship image' USING ERRCODE='22023';END IF;
   next_ship.photo:=jsonb_build_object('url',cover.url,'alt',cover.alt,'permission_verified',true,'source_id',cover.source_id);
  END IF;
 ELSIF previous.photo IS NOT NULL AND EXISTS(SELECT 1 FROM public.cruise_ship_images i WHERE i.ship_id=p_ship AND i.url=previous.photo->>'url') THEN
  SELECT * INTO cover FROM public.cruise_ship_images WHERE ship_id=p_ship AND url=previous.photo->>'url';
  IF cover.is_active AND cover.permission_verified AND public.cruise_has_sources(p_ship,ARRAY[cover.source_id]) THEN next_ship.photo:=jsonb_build_object('url',cover.url,'alt',cover.alt,'permission_verified',true,'source_id',cover.source_id);ELSE next_ship.photo:=NULL;END IF;
 END IF;
 UPDATE public.cruise_ships SET name=next_ship.name,operator_id=next_ship.operator_id,kind=next_ship.kind,operating_status=next_ship.operating_status,publication_status=next_ship.publication_status,official_url=next_ship.official_url,identity_verified=next_ship.identity_verified,overnight_public_cruise=next_ship.overnight_public_cruise,status_source_ids=next_ship.status_source_ids,photo=next_ship.photo WHERE id=p_ship RETURNING updated_at INTO stamp;
 UPDATE public.atlas_universes SET name=next_ship.name,description=CASE WHEN patch ? 'description' THEN patch->>'description' ELSE description END,status=CASE WHEN next_ship.publication_status='published' THEN 'published' WHEN next_ship.publication_status='archived' THEN 'archived' ELSE 'draft' END,updated_at=clock_timestamp() WHERE id=previous.universe_id AND universe_kind='cruise_ship';
 IF NOT FOUND THEN RAISE EXCEPTION 'Cruise Universe not found' USING ERRCODE='22023';END IF;
 INSERT INTO public.cruise_admin_audit(ship_id,actor_id,action,before_state,after_state) VALUES(p_ship,p_actor,'update',old_state,jsonb_build_object('submitted',p_edit,'updated_at',stamp));
 RETURN public.admin_cruise_detail_v1(p_actor,p_ship);
END $f$;
CREATE FUNCTION public.get_cruise_ship_gallery_v1(p_ship_id uuid) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
 SELECT jsonb_build_object('id',i.id,'url',i.url,'alt',i.alt,'caption',i.caption,'source_id',i.source_id,'width',i.width,'height',i.height)
 FROM public.cruise_ship_images i JOIN public.cruise_ships s ON s.id=i.ship_id
 WHERE i.ship_id=p_ship_id AND public.cruise_universe_is_public(s.universe_id) AND i.is_active AND i.permission_verified AND public.cruise_has_sources(s.id,ARRAY[i.source_id])
 ORDER BY i.sort_order,i.id LIMIT 100;
$f$;
REVOKE ALL ON FUNCTION public.admin_cruise_require_actor_v1(uuid),public.admin_cruise_register_image_v1(uuid,uuid,uuid,text,text,integer,integer),public.admin_update_cruise_ship_v1(uuid,uuid,timestamptz,jsonb),public.get_cruise_ship_gallery_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_cruise_require_actor_v1(uuid),public.admin_cruise_register_image_v1(uuid,uuid,uuid,text,text,integer,integer),public.admin_update_cruise_ship_v1(uuid,uuid,timestamptz,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cruise_ship_gallery_v1(uuid) TO anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.admin_list_cruise_ships_v1(uuid,text,text,text,text,integer,integer),public.admin_cruise_operators_v1(uuid),public.admin_cruise_detail_v1(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_cruise_ships_v1(uuid,text,text,text,text,integer,integer),public.admin_cruise_operators_v1(uuid),public.admin_cruise_detail_v1(uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
