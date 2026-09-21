-- Public profile projection and participant-only conversation identity. No customer backfill.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='60s';
-- Remove only the captured orphan counter. Never recreate the missing legacy table.
-- The original function is retained for inspection; no other trigger is removed.
LOCK TABLE public.pro_request_matches IN SHARE ROW EXCLUSIVE MODE;
DO $counter_guard$
BEGIN
 IF to_regclass('public.pro_service_requests') IS NOT NULL THEN
  RAISE EXCEPTION '017 counter repair refused: legacy counter table exists';
 END IF;
 IF to_regclass('public.project_requests') IS NULL OR EXISTS(
  SELECT 1 FROM pg_attribute WHERE attrelid='public.project_requests'::regclass
   AND attname='matched_pro_count' AND NOT attisdropped
 ) THEN RAISE EXCEPTION '017 counter repair refused: project counter schema changed'; END IF;
 IF to_regprocedure('public.update_matched_pro_count()') IS NULL OR
  encode(sha256(convert_to(pg_get_functiondef('public.update_matched_pro_count()'::regprocedure),'UTF8')),'hex')<>'b8153cba08bb69e943286deb592a86e62c696e1d66a75daca8a492a560cf017c'
 THEN RAISE EXCEPTION '017 counter repair refused: counter function changed'; END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgfoid='public.update_matched_pro_count()'::regprocedure)<>1 OR NOT EXISTS(
  SELECT 1 FROM pg_trigger WHERE tgrelid='public.pro_request_matches'::regclass
   AND tgname='trigger_update_matched_count' AND tgfoid='public.update_matched_pro_count()'::regprocedure
   AND NOT tgisinternal AND tgenabled='O' AND tgtype=13 AND tgnargs=0
   AND tgconstraint=0 AND NOT tgdeferrable AND NOT tginitdeferred
   AND tgqual IS NULL AND tgattr=''::int2vector AND tgargs=''::bytea
 ) THEN RAISE EXCEPTION '017 counter repair refused: counter trigger changed'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc f JOIN pg_namespace n ON n.oid=f.pronamespace
  WHERE n.nspname='public' AND f.oid<>'public.update_matched_pro_count()'::regprocedure
   AND f.prosrc ILIKE '%matched_pro_count%')
 THEN RAISE EXCEPTION '017 counter repair refused: additional counter consumer exists'; END IF;
END $counter_guard$;
DROP TRIGGER trigger_update_matched_count ON public.pro_request_matches;
CREATE VIEW public.pro_provider_public_profiles WITH(security_barrier=true,security_invoker=false) AS
 SELECT id,slug,business_name,first_name,last_name,brokerage_name,description,short_description,bio,phone,email,website,whatsapp_number,logo_url,profile_photo_url,cover_photo_url,cover_image_url,city,state,zip_code,service_areas,specialties,trade_category,years_experience,years_in_business,license_number,is_active,is_featured,provider_type,created_at FROM public.pro_providers WHERE is_active IS TRUE;
ALTER VIEW public.pro_provider_public_profiles OWNER TO postgres;
REVOKE ALL ON public.pro_provider_public_profiles FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.pro_provider_public_profiles TO anon,authenticated,service_role;
-- Raw owner rows retain all owner columns and the existing INSERT/UPDATE policies.
ALTER POLICY pro_providers_select ON public.pro_providers USING(user_id=auth.uid());
CREATE POLICY private_provider_rows ON public.pro_providers AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(user_id=auth.uid());
-- TRUNCATE bypasses RLS and is never an ordinary owner operation.
REVOKE ALL ON public.pro_providers FROM anon;
GRANT SELECT ON public.pro_providers TO anon; -- RLS returns no raw anonymous rows; needed by existing policy subqueries.
REVOKE TRUNCATE,TRIGGER,REFERENCES ON public.pro_providers FROM authenticated;
ALTER POLICY moderated_pro_reviews ON public.pro_reviews USING(
 public.community_content_visible('pro_review',id) AND EXISTS(SELECT 1 FROM public.pro_provider_public_profiles p WHERE p.id=pro_reviews.provider_id));
CREATE POLICY active_provider_photos ON public.pro_photos AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(
 EXISTS(SELECT 1 FROM public.pro_provider_public_profiles p WHERE p.id=pro_photos.provider_id)
 OR EXISTS(SELECT 1 FROM public.pro_providers p WHERE p.id=pro_photos.provider_id AND p.user_id=auth.uid()));

CREATE FUNCTION public.get_my_pro_match_summaries_v1(p_match_id uuid DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE actor uuid;result jsonb;
BEGIN
 actor:=public.require_content_safety_actor();
 IF p_offset IS NULL OR p_offset<0 OR p_offset>10000 OR p_limit IS NULL OR p_limit<1 OR p_limit>100 THEN
  RAISE EXCEPTION 'Invalid conversation page' USING ERRCODE='22023';
 END IF;
 SELECT coalesce(jsonb_agg(q.payload ORDER BY q.updated_at DESC NULLS LAST,q.id),'[]'::jsonb) INTO result FROM(
  SELECT m.id,m.updated_at,jsonb_build_object('id',m.id,'request_id',m.request_id,'pro_id',m.pro_id,
   'pro_status',m.pro_status,'updated_at',m.updated_at,
   'project',jsonb_build_object('user_id',pr.user_id,'customer_name',pr.customer_name,'description',pr.description),
   'provider',jsonb_build_object('user_id',pp.user_id,'business_name',pp.business_name)) AS payload
  FROM public.pro_request_matches m JOIN public.pro_providers pp ON pp.id=m.pro_id
  JOIN public.project_requests pr ON pr.id=m.request_id
  WHERE (pp.user_id=actor OR pr.user_id=actor) AND (p_match_id IS NULL OR m.id=p_match_id)
  ORDER BY m.updated_at DESC NULLS LAST,m.id LIMIT p_limit OFFSET p_offset
 )q;
 RETURN result;
END $body$;
REVOKE ALL ON FUNCTION public.get_my_pro_match_summaries_v1(uuid,integer,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_pro_match_summaries_v1(uuid,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.match_realtors_to_request(p_request_id uuid)
 RETURNS TABLE(realtor_id uuid, match_score integer, match_reasons text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$ DECLARE r_location TEXT; r_property_type TEXT; r_main_goal TEXT; r_languages TEXT[]; r_realtor_count TEXT; max_matches INTEGER; BEGIN SELECT location, property_type, main_goal, languages, realtor_count INTO r_location, r_property_type, r_main_goal, r_languages, r_realtor_count FROM public.realtor_match_requests WHERE id = p_request_id; max_matches := CASE WHEN r_realtor_count = '1' THEN 1 WHEN r_realtor_count = '2-3' THEN 3 WHEN r_realtor_count = '4-5' THEN 5 ELSE 3 END; IF NOT FOUND THEN RETURN; END IF; RETURN QUERY SELECT p.id as realtor_id, (CASE WHEN r_location IS NOT NULL AND (p.city ILIKE '%' || r_location || '%' OR r_location = ANY(p.service_areas)) THEN 40 ELSE 0 END + CASE WHEN r_property_type IS NOT NULL AND r_property_type = ANY(p.specialties) THEN 30 ELSE 0 END + CASE WHEN r_main_goal IS NOT NULL AND r_main_goal = ANY(p.specialties) THEN 20 ELSE 0 END) as match_score, ARRAY_REMOVE(ARRAY[ CASE WHEN r_location IS NOT NULL AND (p.city ILIKE '%' || r_location || '%' OR r_location = ANY(p.service_areas)) THEN 'Serves your area' ELSE NULL END, CASE WHEN r_property_type IS NOT NULL AND r_property_type = ANY(p.specialties) THEN 'Specializes in ' || r_property_type ELSE NULL END ], NULL) as match_reasons FROM public.pro_provider_public_profiles p WHERE p.provider_type = 'realtor' AND p.is_active = true ORDER BY match_score DESC, p.created_at ASC LIMIT max_matches; END; $function$;

CREATE OR REPLACE FUNCTION public.match_pros_to_project_request(p_request_id uuid)
 RETURNS TABLE(pro_id uuid, match_score integer, match_reasons text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$ DECLARE r_category_id TEXT; r_zip_code TEXT; r_city TEXT; r_state TEXT; r_dynamic_answers JSONB; r_branch TEXT; BEGIN SELECT category_id, zip_code, city, state, dynamic_answers INTO r_category_id, r_zip_code, r_city, r_state, r_dynamic_answers FROM public.project_requests WHERE id = p_request_id; IF NOT FOUND THEN RETURN; END IF; r_branch := (SELECT value FROM jsonb_each_text(r_dynamic_answers) LIMIT 1); RETURN QUERY SELECT p.id as pro_id, (CASE WHEN r_zip_code IS NOT NULL AND p.zip_code = r_zip_code THEN 40 WHEN r_city IS NOT NULL AND p.city ILIKE r_city THEN 30 WHEN r_state IS NOT NULL AND p.state ILIKE r_state THEN 20 ELSE 0 END + CASE WHEN r_category_id IS NOT NULL AND p.trade_category = r_category_id THEN 30 ELSE 0 END + CASE WHEN r_branch IS NOT NULL AND r_branch = ANY(p.specialties) THEN 20 ELSE 0 END) as match_score, ARRAY_REMOVE(ARRAY[ CASE WHEN r_zip_code IS NOT NULL AND p.zip_code = r_zip_code THEN 'Located in your zip code' WHEN r_city IS NOT NULL AND p.city ILIKE r_city THEN 'Serves your city' WHEN r_state IS NOT NULL AND p.state ILIKE r_state THEN 'Serves your state' ELSE NULL END, CASE WHEN r_category_id IS NOT NULL AND p.trade_category = r_category_id THEN 'Specializes in your project type' ELSE NULL END ], NULL) as match_reasons FROM public.pro_provider_public_profiles p WHERE p.is_active = true AND p.provider_type != 'realtor' ORDER BY match_score DESC, p.created_at ASC; END; $function$;

NOTIFY pgrst,'reload schema';
COMMIT;
