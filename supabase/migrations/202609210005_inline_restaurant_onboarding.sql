-- Atomic inline listing creation + private PENDING ownership request.
-- Depends on restaurant_owner_onboarding 001 and canonical search trigger 006.
BEGIN;
CREATE TABLE IF NOT EXISTS public.restaurant_onboarding_requests (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 request_hash text NOT NULL,
 place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,request_id)
);
ALTER TABLE public.restaurant_onboarding_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.restaurant_onboarding_requests FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.restaurant_onboarding_key(value text) RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT regexp_replace(lower(public.unaccent(trim(coalesce(value,'')))),'[^[:alnum:]]','','g');
$$;
REVOKE ALL ON FUNCTION public.restaurant_onboarding_key(text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.find_restaurant_onboarding_duplicates(p_details jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE n text:=trim(p_details->>'name'); c text:=trim(p_details->>'city'); s text:=trim(p_details->>'street');
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_details) IS DISTINCT FROM 'object' OR length(coalesce(n,'')) NOT BETWEEN 1 AND 160 OR length(coalesce(c,'')) NOT BETWEEN 1 AND 100 OR length(coalesce(s,'')) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Name and address required' USING ERRCODE='22023'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'street',p.street,'city',p.city,'region',p.region,'exactAddress',public.restaurant_onboarding_key(p.street)=public.restaurant_onboarding_key(s))) FROM (
  SELECT id,name,street,city,region FROM public.places
  WHERE is_active IS DISTINCT FROM false
    AND public.restaurant_onboarding_key(name)=public.restaurant_onboarding_key(n)
    AND public.restaurant_onboarding_key(city)=public.restaurant_onboarding_key(c)
    AND (nullif(region,'') IS NULL OR nullif(p_details->>'region','') IS NULL OR public.restaurant_onboarding_key(region)=public.restaurant_onboarding_key(p_details->>'region'))
    AND (nullif(country,'') IS NULL OR upper(country)=upper(p_details->>'country') OR length(country)>2)
  ORDER BY (public.restaurant_onboarding_key(street)=public.restaurant_onboarding_key(s)) DESC,created_at,id LIMIT 20
 ) p),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.find_restaurant_onboarding_duplicates(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.find_restaurant_onboarding_duplicates(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_restaurant_with_pending_claim(p_request_id uuid,p_details jsonb,p_claim jsonb,p_confirm_distinct boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u uuid:=auth.uid(); p uuid; existing public.restaurant_onboarding_requests; claim jsonb; candidates jsonb; fingerprint text; field text; n text:=trim(p_details->>'name');
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR jsonb_typeof(p_details) IS DISTINCT FROM 'object' OR jsonb_typeof(p_claim) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
 IF length(coalesce(n,'')) NOT BETWEEN 1 AND 160 OR n ~ '[[:cntrl:]]'
  OR length(trim(coalesce(p_details->>'street',''))) NOT BETWEEN 1 AND 200
  OR length(trim(coalesce(p_details->>'city',''))) NOT BETWEEN 1 AND 100
  OR length(coalesce(p_details->>'region',''))>100 OR length(coalesce(p_details->>'postcode',''))>20
  OR coalesce(p_details->>'country','') !~ '^[A-Z]{2}$'
  OR coalesce(p_details->>'kind','') NOT IN ('Restaurant','Cafe','Bakery','Bar')
  OR p_claim->'accepted' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Invalid restaurant details' USING ERRCODE='22023'; END IF;
 FOREACH field IN ARRAY ARRAY['name','street','city','region','postcode','country','kind'] LOOP
  IF jsonb_typeof(p_details->field) IS DISTINCT FROM 'string' OR p_details->>field ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Invalid address field' USING ERRCODE='22023'; END IF;
 END LOOP;
 fingerprint:=md5(jsonb_build_object('details',p_details,'claim',p_claim)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended('restaurant-request:'||u::text||':'||p_request_id::text,0));
 SELECT * INTO existing FROM public.restaurant_onboarding_requests WHERE user_id=u AND request_id=p_request_id;
 IF FOUND THEN
  IF existing.request_hash<>fingerprint THEN RAISE EXCEPTION 'Request details changed' USING ERRCODE='22023'; END IF;
  claim:=public.submit_restaurant_claim(existing.place_id,p_claim->>'name',p_claim->>'role',p_claim->>'email',p_claim->>'phone',true);
  RETURN jsonb_build_object('outcome','created','placeId',existing.place_id,'claim',claim);
 END IF;
 -- Serialize same-name/same-city submissions, including concurrent accounts.
 PERFORM pg_advisory_xact_lock(hashtextextended('restaurant-place:'||public.restaurant_onboarding_key(n)||':'||public.restaurant_onboarding_key(p_details->>'city'),0));
 candidates:=public.find_restaurant_onboarding_duplicates(p_details);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(candidates) x WHERE x->>'exactAddress'='true') OR (jsonb_array_length(candidates)>0 AND p_confirm_distinct IS DISTINCT FROM true) THEN
  RETURN jsonb_build_object('outcome','choose_existing','places',candidates);
 END IF;
 p:=gen_random_uuid();
 INSERT INTO public.places(id,source_type,source_id,name,street,city,region,country,postcode,tavvy_category,tavvy_subcategory,is_active,is_claimed,claimed_by,claimed_at)
 VALUES(p,'user',p::text,n,trim(p_details->>'street'),trim(p_details->>'city'),nullif(trim(p_details->>'region'),''),p_details->>'country',nullif(trim(p_details->>'postcode'),''),'restaurants',p_details->>'kind',true,false,NULL,NULL);
 -- Any claim failure rolls the listing INSERT back with this same statement.
 claim:=public.submit_restaurant_claim(p,p_claim->>'name',p_claim->>'role',p_claim->>'email',p_claim->>'phone',true);
 IF claim->>'status'<>'pending' OR claim->>'ownership_verified_at' IS NOT NULL THEN RAISE EXCEPTION 'Claim must remain pending' USING ERRCODE='42501'; END IF;
 INSERT INTO public.restaurant_onboarding_requests(user_id,request_id,request_hash,place_id) VALUES(u,p_request_id,fingerprint,p);
 RETURN jsonb_build_object('outcome','created','placeId',p,'claim',claim);
END; $$;
REVOKE ALL ON FUNCTION public.create_restaurant_with_pending_claim(uuid,jsonb,jsonb,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_restaurant_with_pending_claim(uuid,jsonb,jsonb,boolean) TO authenticated;
COMMIT;
