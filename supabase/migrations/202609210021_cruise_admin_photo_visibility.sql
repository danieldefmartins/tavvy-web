-- Admin-uploaded cruise images can be included without attribution paperwork.
-- Existing evidence is retained; no images are activated and no ships are edited by this migration.
BEGIN;
SET LOCAL lock_timeout='2s';SET LOCAL statement_timeout='60s';
CREATE FUNCTION public.cruise_photo_projection_v1(p_ship uuid,p_photo jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE image public.cruise_ship_images;
BEGIN
 IF p_photo IS NULL THEN RETURN NULL;END IF;
 SELECT * INTO image FROM public.cruise_ship_images WHERE ship_id=p_ship AND url=p_photo->>'url';
 IF FOUND THEN
  IF NOT image.is_active OR (p_photo->>'origin'='admin_upload' AND p_photo->>'image_id' IS DISTINCT FROM image.id::text) THEN RETURN NULL;END IF;
  RETURN jsonb_build_object('origin','admin_upload','image_id',image.id,'url',image.url,'alt',image.alt,'permission_verified',image.permission_verified,'source_id',image.source_id);
 END IF;
 -- A forged admin marker or managed path must not fall through to external-photo eligibility.
 IF p_photo->>'origin'='admin_upload' OR strpos(coalesce(p_photo->>'url',''),'/storage/v1/object/public/universe-images/cruise-ships/')>0 THEN RETURN NULL;END IF;
 -- Preserve the historical rule for external photos; this change concerns admin uploads only.
 IF p_photo->>'permission_verified'='true' AND p_photo->>'url' ~ '^https://[^[:space:]@]+$' AND public.cruise_has_sources(p_ship,ARRAY[p_photo->>'source_id']) THEN RETURN p_photo;END IF;
 RETURN NULL;
END $f$;
CREATE OR REPLACE FUNCTION public.admin_update_cruise_ship_v1(p_actor uuid,p_ship uuid,p_expected_updated_at timestamptz,p_edit jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $f$
DECLARE previous public.cruise_ships;next_ship public.cruise_ships;patch jsonb;item jsonb;existing jsonb;cover public.cruise_ship_images;image public.cruise_ship_images;next_image public.cruise_ship_images;stamp timestamptz;old_state jsonb;
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
   IF jsonb_typeof(item)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE k NOT IN('id','alt','caption','source_id','permission_verified','rights_note','sort_order','is_active')) THEN RAISE EXCEPTION 'Unsupported image field' USING ERRCODE='22023';END IF;
   -- Legacy attribution is optional; omitted values preserve the exact historical record.
   SELECT * INTO next_image FROM jsonb_populate_record(image,item-'id');
   IF next_image.permission_verified AND (NOT public.cruise_has_sources(p_ship,ARRAY[next_image.source_id]) OR length(btrim(coalesce(next_image.rights_note,'')))=0) THEN RAISE EXCEPTION 'A verified permission claim still requires its evidence' USING ERRCODE='22023';END IF;
   UPDATE public.cruise_ship_images SET alt=next_image.alt,caption=next_image.caption,source_id=next_image.source_id,permission_verified=next_image.permission_verified,rights_note=next_image.rights_note,sort_order=next_image.sort_order,is_active=next_image.is_active,updated_at=clock_timestamp() WHERE id=image.id;
  END LOOP;
 END IF;
 SELECT * INTO next_ship FROM jsonb_populate_record(previous,patch-'description');
 IF p_edit ? 'coverImageId' THEN
  IF p_edit->'coverImageId'='null'::jsonb THEN next_ship.photo:=NULL;
  ELSE
   SELECT * INTO cover FROM public.cruise_ship_images WHERE id=(p_edit->>'coverImageId')::uuid AND ship_id=p_ship;
   IF NOT FOUND OR NOT cover.is_active THEN RAISE EXCEPTION 'Cover requires an active image registered for this ship' USING ERRCODE='22023';END IF;
   next_ship.photo:=jsonb_build_object('origin','admin_upload','image_id',cover.id,'url',cover.url,'alt',cover.alt,'permission_verified',cover.permission_verified,'source_id',cover.source_id);
  END IF;
 ELSIF previous.photo IS NOT NULL AND EXISTS(SELECT 1 FROM public.cruise_ship_images i WHERE i.ship_id=p_ship AND i.url=previous.photo->>'url') THEN
  SELECT * INTO cover FROM public.cruise_ship_images WHERE ship_id=p_ship AND url=previous.photo->>'url';
  IF cover.is_active THEN next_ship.photo:=jsonb_build_object('origin','admin_upload','image_id',cover.id,'url',cover.url,'alt',cover.alt,'permission_verified',cover.permission_verified,'source_id',cover.source_id);ELSE next_ship.photo:=NULL;END IF;
 END IF;
 UPDATE public.cruise_ships SET name=next_ship.name,operator_id=next_ship.operator_id,kind=next_ship.kind,operating_status=next_ship.operating_status,publication_status=next_ship.publication_status,official_url=next_ship.official_url,identity_verified=next_ship.identity_verified,overnight_public_cruise=next_ship.overnight_public_cruise,status_source_ids=next_ship.status_source_ids,photo=next_ship.photo WHERE id=p_ship RETURNING updated_at INTO stamp;
 UPDATE public.atlas_universes SET name=next_ship.name,description=CASE WHEN patch ? 'description' THEN patch->>'description' ELSE description END,status=CASE WHEN next_ship.publication_status='published' THEN 'published' WHEN next_ship.publication_status='archived' THEN 'archived' ELSE 'draft' END,updated_at=clock_timestamp() WHERE id=previous.universe_id AND universe_kind='cruise_ship';
 IF NOT FOUND THEN RAISE EXCEPTION 'Cruise Universe not found' USING ERRCODE='22023';END IF;
 INSERT INTO public.cruise_admin_audit(ship_id,actor_id,action,before_state,after_state) VALUES(p_ship,p_actor,'update',old_state,jsonb_build_object('submitted',p_edit,'updated_at',stamp));
 RETURN public.admin_cruise_detail_v1(p_actor,p_ship);
END $f$;
CREATE OR REPLACE FUNCTION public.get_cruise_ship_v1(p_slug text DEFAULT NULL,p_universe_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT jsonb_build_object('ship',jsonb_build_object(
 'id',s.id,'universe_id',s.universe_id,'slug',s.slug,'name',s.name,'operator_id',s.operator_id,'operator_name',o.name,
 'kind',s.kind,'operating_status',s.operating_status,'publication_status',s.publication_status,
 'overnight_public_cruise',s.overnight_public_cruise,'identity_verified',s.identity_verified,'status_source_ids',s.status_source_ids,
 'imo',s.imo,'eni',s.eni,'official_url',s.official_url,
 'photo',public.cruise_photo_projection_v1(s.id,s.photo),
 'facts',coalesce((SELECT jsonb_agg(jsonb_build_object('key',f.key,'value',f.value,'source_ids',f.source_ids,'as_of',f.as_of,'verification',f.verification,'note',f.note) ORDER BY f.key)
   FROM public.cruise_ship_facts f WHERE f.ship_id=s.id AND f.superseded_at IS NULL AND public.cruise_has_sources(s.id,f.source_ids)),'[]'::jsonb),
 'name_history',coalesce((SELECT jsonb_agg(jsonb_build_object('name',h.name,'operator_name',h.operator_name,'valid_from',h.valid_from,'valid_until',h.valid_until,'source_ids',h.source_ids) ORDER BY h.valid_from NULLS LAST,h.id)
   FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id AND public.cruise_has_sources(s.id,h.source_ids)),'[]'::jsonb),
 'cabin_categories',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description,'accessible',c.accessible,'source_ids',c.source_ids) ORDER BY c.name,c.id)
   FROM public.cruise_cabin_categories c WHERE c.ship_id=s.id AND public.cruise_has_sources(s.id,c.source_ids)),'[]'::jsonb)),
 'sources',coalesce((SELECT jsonb_agg(to_jsonb(src)-'ship_id' ORDER BY src.id) FROM public.cruise_ship_sources src WHERE src.ship_id=s.id AND src.checked_at<=current_date),'[]'::jsonb),
 'venues',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.name,v.id) FROM public.cruise_venues v WHERE v.ship_id=s.id AND v.verification='verified' AND public.cruise_has_sources(s.id,v.source_ids)),'[]'::jsonb),
 'programs',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name,p.id) FROM public.cruise_programs p WHERE p.ship_id=s.id AND p.verification='verified' AND p.as_of<=current_date AND public.cruise_has_sources(s.id,p.source_ids)),'[]'::jsonb))
 FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE ((p_slug IS NOT NULL AND s.slug=p_slug AND p_universe_id IS NULL) OR (p_universe_id IS NOT NULL AND s.universe_id=p_universe_id AND p_slug IS NULL))
 AND public.cruise_universe_is_public(s.universe_id);
$body$;
CREATE OR REPLACE FUNCTION public.get_cruise_ship_gallery_v1(p_ship_id uuid) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $f$
 SELECT jsonb_build_object('origin','admin_upload','id',i.id,'url',i.url,'alt',i.alt,'caption',i.caption,'source_id',i.source_id,'width',i.width,'height',i.height)
 FROM public.cruise_ship_images i JOIN public.cruise_ships s ON s.id=i.ship_id
 WHERE i.ship_id=p_ship_id AND public.cruise_universe_is_public(s.universe_id) AND i.is_active
 ORDER BY i.sort_order,i.id LIMIT 100;
$f$;
REVOKE ALL ON FUNCTION public.cruise_photo_projection_v1(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.admin_update_cruise_ship_v1(uuid,uuid,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_cruise_ship_v1(uuid,uuid,timestamptz,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.get_cruise_ship_gallery_v1(uuid),public.get_cruise_ship_v1(text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_cruise_ship_gallery_v1(uuid),public.get_cruise_ship_v1(text,uuid) TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
