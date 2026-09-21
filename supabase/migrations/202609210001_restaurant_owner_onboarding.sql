-- Prepared, not applied. Requires the existing menu-owner policies (202609080002).
-- Legacy Pros OTP verification is NOT proof of restaurant ownership.
BEGIN;
ALTER TABLE public.pro_business_claims
  ADD COLUMN IF NOT EXISTS claim_kind text,
  ADD COLUMN IF NOT EXISTS claimant_name text,
  ADD COLUMN IF NOT EXISTS claimant_role text,
  ADD COLUMN IF NOT EXISTS ownership_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_notes text;
ALTER TABLE public.place_external_profiles ADD COLUMN IF NOT EXISTS owner_confirmed_at timestamptz, ADD COLUMN IF NOT EXISTS confirmed_by uuid;
CREATE INDEX IF NOT EXISTS restaurant_claim_lookup ON public.pro_business_claims(user_id,place_id,created_at DESC) WHERE claim_kind='restaurant';

ALTER TABLE public.pro_business_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurant_claim_private_read ON public.pro_business_claims;
CREATE POLICY restaurant_claim_private_read ON public.pro_business_claims AS RESTRICTIVE FOR SELECT TO public USING(user_id=auth.uid());

-- Every direct client insertion is still pending and cannot assign proof.
DROP POLICY IF EXISTS restaurant_claim_proof_guard ON public.pro_business_claims;
CREATE POLICY restaurant_claim_proof_guard ON public.pro_business_claims AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (status='pending' AND ownership_verified_at IS NULL
  AND verified_at IS NULL AND reviewed_by IS NULL AND review_notes IS NULL
  AND verification_code IS NULL AND verification_code_expires_at IS NULL
  AND coalesce(verification_attempts,0)=0);
DROP POLICY IF EXISTS restaurant_claim_no_client_update ON public.pro_business_claims;
CREATE POLICY restaurant_claim_no_client_update ON public.pro_business_claims AS RESTRICTIVE
FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS restaurant_claim_no_client_delete ON public.pro_business_claims;
CREATE POLICY restaurant_claim_no_client_delete ON public.pro_business_claims AS RESTRICTIVE
FOR DELETE TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.has_verified_restaurant_claim(p_place_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.pro_business_claims
 WHERE place_id=p_place_id AND user_id=auth.uid() AND claim_kind='restaurant'
 AND status='verified' AND ownership_verified_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.has_verified_restaurant_claim(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_verified_restaurant_claim(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_restaurant_claim(p_place_id uuid,p_claimant_name text,p_claimant_role text,p_email text,p_phone text,p_authorized boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u uuid:=auth.uid(); p public.places; c public.pro_business_claims;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_authorized IS DISTINCT FROM true OR length(trim(coalesce(p_claimant_name,''))) NOT BETWEEN 1 AND 120
 OR length(trim(coalesce(p_claimant_role,''))) NOT BETWEEN 1 AND 80 OR length(coalesce(p_email,''))>254
 OR coalesce(p_claimant_name,'') ~ '[[:cntrl:]]' OR coalesce(p_claimant_role,'') ~ '[[:cntrl:]]'
 OR coalesce(p_email,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 OR length(coalesce(p_phone,''))>32 OR coalesce(p_phone,'') !~ '^\+?[0-9 ().-]+$'
 OR length(regexp_replace(coalesce(p_phone,''),'[^0-9]','','g')) NOT BETWEEN 7 AND 15
 THEN RAISE EXCEPTION 'Invalid claim details' USING ERRCODE='22023'; END IF;
 SELECT * INTO p FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false;
 IF NOT FOUND THEN RAISE EXCEPTION 'Place not found' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(u::text||':'||p_place_id::text,0));
 SELECT * INTO c FROM public.pro_business_claims WHERE user_id=u AND place_id=p_place_id AND claim_kind='restaurant'
 ORDER BY (ownership_verified_at IS NOT NULL) DESC,created_at DESC LIMIT 1;
 IF c.id IS NULL THEN
  INSERT INTO public.pro_business_claims(user_id,place_id,business_name,business_phone,business_email,business_address,claim_kind,claimant_name,claimant_role,status)
  VALUES(u,p.id,p.name,trim(p_phone),lower(trim(p_email)),concat_ws(', ',p.street,p.city,p.region),'restaurant',trim(p_claimant_name),trim(p_claimant_role),'pending') RETURNING * INTO c;
 END IF;
 RETURN to_jsonb(c)-'verification_code'-'verification_code_expires_at';
END; $$;
REVOKE ALL ON FUNCTION public.submit_restaurant_claim(uuid,text,text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_restaurant_claim(uuid,text,text,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_restaurant_owner_workspace(p_place_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE u uuid:=auth.uid(); c public.pro_business_claims; p jsonb; result jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('id',id,'name',name,'street',street,'city',city,'region',region,'phone',phone,'website',website,'description',description,'hours',hours) INTO p FROM public.places WHERE id=p_place_id;
 IF p IS NULL THEN RAISE EXCEPTION 'Place not found' USING ERRCODE='22023'; END IF;
 SELECT * INTO c FROM public.pro_business_claims WHERE user_id=u AND place_id=p_place_id AND claim_kind='restaurant'
 ORDER BY (ownership_verified_at IS NOT NULL) DESC,created_at DESC LIMIT 1;
 result:=jsonb_build_object('place',p,'claim',CASE WHEN c.id IS NULL THEN NULL ELSE to_jsonb(c)-'verification_code'-'verification_code_expires_at' END,'canManage',public.has_verified_restaurant_claim(p_place_id));
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RETURN result; END IF;
 RETURN result||jsonb_build_object(
  'menu',(SELECT jsonb_build_object('id',id,'is_active',is_active,'view_count',view_count,'share_count',share_count) FROM public.menus WHERE place_id=p_place_id ORDER BY is_active DESC,created_at DESC LIMIT 1),
  'cards',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'full_name',full_name,'slug',slug,'place_id',place_id,'is_published',is_published)) FROM public.digital_cards WHERE user_id=u),'[]'::jsonb),
  'links',coalesce((SELECT jsonb_object_agg(provider,external_url) FROM public.place_external_profiles WHERE place_id=p_place_id AND provider IN ('instagram','tiktok','youtube','facebook','doordash','uber_eats','grubhub')),'{}'::jsonb),
  'storyCount',(SELECT count(*) FROM public.place_stories WHERE place_id=p_place_id AND user_id=u AND status='active' AND (is_permanent OR expires_at>now())));
END; $$;
REVOKE ALL ON FUNCTION public.get_restaurant_owner_workspace(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_restaurant_owner_workspace(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_restaurant_owner_details(p_place_id uuid,p_details jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_phone text:=trim(p_details->>'phone'); v_website text:=trim(p_details->>'website'); v_description text:=trim(p_details->>'description'); d text; v text; k text; v_domain text;
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'Verified ownership required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_details) IS DISTINCT FROM 'object' OR jsonb_typeof(p_details->'phone') IS DISTINCT FROM 'string' OR jsonb_typeof(p_details->'website') IS DISTINCT FROM 'string' OR jsonb_typeof(p_details->'description') IS DISTINCT FROM 'string' OR v_phone IS NULL OR v_website IS NULL OR v_description IS NULL
 OR length(v_phone)>32 OR length(v_website)>2048 OR length(v_description)>2000
 OR (v_phone<>'' AND (v_phone !~ '^\+?[0-9 ().-]+$' OR length(regexp_replace(v_phone,'[^0-9]','','g')) NOT BETWEEN 7 AND 15))
 OR (v_website<>'' AND (v_website !~ '^https://[^/@[:space:]]+([/:?#]|$)' OR v_website ~ '[[:cntrl:]]'))
 THEN RAISE EXCEPTION 'Invalid restaurant details' USING ERRCODE='22023'; END IF;
 IF p_details ? 'hours' THEN
  IF jsonb_typeof(p_details->'hours') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid weekly hours' USING ERRCODE='22023'; END IF;
  FOREACH d IN ARRAY ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] LOOP
   v:=p_details->'hours'->>d;
   IF v IS NULL OR length(v)>120 OR v !~ '^(|Closed|Open 24 hours|([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9](,([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9])*)$' THEN RAISE EXCEPTION 'Invalid hours for %',d USING ERRCODE='22023'; END IF;
  END LOOP;
 END IF;
 IF p_details ? 'links' THEN
  IF jsonb_typeof(p_details->'links') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid links' USING ERRCODE='22023'; END IF;
  FOREACH k IN ARRAY ARRAY['instagram','tiktok','youtube','facebook','doordash','uber_eats','grubhub'] LOOP
   v:=trim(p_details->'links'->>k); v_domain:=CASE k WHEN 'uber_eats' THEN 'ubereats.com' ELSE k||'.com' END;
   IF v IS NULL OR length(v)>2048 OR (v<>'' AND (v !~ ('^https://([a-zA-Z0-9-]+\.)*'||replace(v_domain,'.','\.')||'([/?#]|$)') OR v ~ '[[:space:][:cntrl:]]')) THEN RAISE EXCEPTION 'Invalid % URL',k USING ERRCODE='22023'; END IF;
   IF v='' THEN DELETE FROM public.place_external_profiles WHERE place_id=p_place_id AND provider=k;
   ELSE INSERT INTO public.place_external_profiles(place_id,provider,external_place_id,external_url,owner_confirmed_at,confirmed_by) VALUES(p_place_id,k,v,v,now(),auth.uid()) ON CONFLICT(place_id,provider) DO UPDATE SET external_place_id=excluded.external_place_id,external_url=excluded.external_url,owner_confirmed_at=now(),confirmed_by=auth.uid(); END IF;
  END LOOP;
 END IF;
 UPDATE public.places SET phone=nullif(v_phone,''),website=nullif(v_website,''),description=nullif(v_description,''),hours=CASE WHEN p_details ? 'hours' THEN p_details->'hours' ELSE hours END,updated_at=now() WHERE id=p_place_id;
 RETURN p_place_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_restaurant_owner_details(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_restaurant_owner_details(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_restaurant_owner_card(p_place_id uuid,p_card_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'Verified ownership required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards WHERE id=p_card_id AND user_id=auth.uid() AND (place_id IS NULL OR place_id=p_place_id)) THEN RAISE EXCEPTION 'Choose an unlinked card you own' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('restaurant-card:'||p_place_id::text,0));
 UPDATE public.digital_cards SET place_id=NULL,updated_at=now() WHERE place_id=p_place_id AND user_id=auth.uid() AND id<>p_card_id;
 UPDATE public.digital_cards SET place_id=p_place_id,updated_at=now() WHERE id=p_card_id AND user_id=auth.uid() AND (place_id IS NULL OR place_id=p_place_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Choose an unlinked card you own' USING ERRCODE='42501'; END IF;
 RETURN p_card_id;
END; $$;
REVOKE ALL ON FUNCTION public.link_restaurant_owner_card(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.link_restaurant_owner_card(uuid,uuid) TO authenticated;

-- Trusted operational review only. No public/client role may approve a claim.
-- The operator must verify independent ownership evidence before calling this.
CREATE OR REPLACE FUNCTION public.review_restaurant_claim(p_claim_id uuid,p_approved boolean,p_notes text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.pro_business_claims;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Trusted review required' USING ERRCODE='42501'; END IF;
 IF p_approved IS NULL OR length(trim(coalesce(p_notes,''))) NOT BETWEEN 10 AND 2000 THEN RAISE EXCEPTION 'Document the verification decision' USING ERRCODE='22023'; END IF;
 SELECT * INTO c FROM public.pro_business_claims WHERE id=p_claim_id AND claim_kind='restaurant' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Claim not found' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('restaurant-owner:'||c.place_id::text,0));
 IF p_approved AND EXISTS(SELECT 1 FROM public.pro_business_claims WHERE place_id=c.place_id AND user_id<>c.user_id AND ownership_verified_at IS NOT NULL AND status='verified') THEN RAISE EXCEPTION 'Existing verified owner requires an ownership transfer review' USING ERRCODE='23505'; END IF;
 UPDATE public.pro_business_claims SET status=CASE WHEN p_approved THEN 'verified' ELSE 'rejected' END,
 ownership_verified_at=CASE WHEN p_approved THEN now() ELSE NULL END,verified_at=CASE WHEN p_approved THEN now() ELSE NULL END,review_notes=trim(p_notes)
 WHERE id=c.id;
 RETURN c.id;
END; $$;
REVOKE ALL ON FUNCTION public.review_restaurant_claim(uuid,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_restaurant_claim(uuid,boolean,text) TO service_role;

-- Supplement the existing menu policies: an old Pros OTP cannot grant edits.
CREATE POLICY restaurant_menu_verified_insert ON public.menus AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.has_verified_restaurant_claim(place_id));
CREATE POLICY restaurant_menu_verified_update ON public.menus AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.has_verified_restaurant_claim(place_id)) WITH CHECK(public.has_verified_restaurant_claim(place_id));
CREATE POLICY restaurant_menu_verified_delete ON public.menus AS RESTRICTIVE FOR DELETE TO authenticated USING(public.has_verified_restaurant_claim(place_id));
CREATE POLICY restaurant_category_verified_insert ON public.menu_categories AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.menus WHERE id=menu_id AND public.has_verified_restaurant_claim(place_id)));
CREATE POLICY restaurant_category_verified_update ON public.menu_categories AS RESTRICTIVE FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.menus WHERE id=menu_id AND public.has_verified_restaurant_claim(place_id))) WITH CHECK(EXISTS(SELECT 1 FROM public.menus WHERE id=menu_id AND public.has_verified_restaurant_claim(place_id)));
CREATE POLICY restaurant_category_verified_delete ON public.menu_categories AS RESTRICTIVE FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.menus WHERE id=menu_id AND public.has_verified_restaurant_claim(place_id)));
CREATE POLICY restaurant_item_verified_insert ON public.menu_items AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.menu_categories c JOIN public.menus m ON m.id=c.menu_id WHERE c.id=category_id AND public.has_verified_restaurant_claim(m.place_id)));
CREATE POLICY restaurant_item_verified_update ON public.menu_items AS RESTRICTIVE FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.menu_categories c JOIN public.menus m ON m.id=c.menu_id WHERE c.id=category_id AND public.has_verified_restaurant_claim(m.place_id))) WITH CHECK(EXISTS(SELECT 1 FROM public.menu_categories c JOIN public.menus m ON m.id=c.menu_id WHERE c.id=category_id AND public.has_verified_restaurant_claim(m.place_id)));
CREATE POLICY restaurant_item_verified_delete ON public.menu_items AS RESTRICTIVE FOR DELETE TO authenticated USING(EXISTS(SELECT 1 FROM public.menu_categories c JOIN public.menus m ON m.id=c.menu_id WHERE c.id=category_id AND public.has_verified_restaurant_claim(m.place_id)));
-- Contact profile writes go through the validated owner RPC. Public reads remain.
ALTER TABLE public.place_external_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY restaurant_profiles_public_read ON public.place_external_profiles FOR SELECT USING(true);
CREATE POLICY restaurant_profiles_write_guard ON public.place_external_profiles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(false);
CREATE POLICY restaurant_profiles_update_guard ON public.place_external_profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY restaurant_profiles_delete_guard ON public.place_external_profiles AS RESTRICTIVE FOR DELETE TO authenticated USING(false);
CREATE POLICY canonical_restaurant_owner_guard ON public.places AS RESTRICTIVE FOR UPDATE TO authenticated
USING(public.has_verified_restaurant_claim(id) OR (source_type='user' AND EXISTS(SELECT 1 FROM public.tavvy_places tp WHERE tp.id::text=places.source_id AND tp.created_by=auth.uid())))
WITH CHECK(public.has_verified_restaurant_claim(id) OR (source_type='user' AND EXISTS(SELECT 1 FROM public.tavvy_places tp WHERE tp.id::text=places.source_id AND tp.created_by=auth.uid())));
CREATE POLICY restaurant_ecard_link_insert_guard ON public.digital_cards AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(place_id IS NULL OR public.has_verified_restaurant_claim(place_id));
CREATE POLICY restaurant_ecard_link_update_guard ON public.digital_cards AS RESTRICTIVE FOR UPDATE TO authenticated USING(place_id IS NULL OR public.has_verified_restaurant_claim(place_id)) WITH CHECK(place_id IS NULL OR public.has_verified_restaurant_claim(place_id));
DO $$ BEGIN
 IF to_regprocedure('public.approve_business_claim(uuid,uuid,text)') IS NOT NULL THEN
  REVOKE ALL ON FUNCTION public.approve_business_claim(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
  GRANT EXECUTE ON FUNCTION public.approve_business_claim(uuid,uuid,text) TO service_role;
 END IF;
 IF to_regprocedure('public.reject_business_claim(uuid,uuid,text)') IS NOT NULL THEN
  REVOKE ALL ON FUNCTION public.reject_business_claim(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
  GRANT EXECUTE ON FUNCTION public.reject_business_claim(uuid,uuid,text) TO service_role;
 END IF;
END $$;
COMMIT;
