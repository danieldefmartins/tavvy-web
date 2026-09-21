-- On The Go -> canonical Tavvy place association. No read-time writes or row backfill.
-- Requires existing authored-place policies (005/006). Live lifecycle migration is
-- required first for account-aware visibility and the live story proximity guard.
BEGIN;
ALTER TABLE public.tavvy_places ADD COLUMN IF NOT EXISTS canonical_place_id uuid;
ALTER TABLE public.tavvy_places ADD CONSTRAINT tavvy_places_canonical_place_fkey FOREIGN KEY(canonical_place_id) REFERENCES public.places(id) NOT VALID;
CREATE UNIQUE INDEX IF NOT EXISTS tavvy_places_canonical_place_unique ON public.tavvy_places(canonical_place_id) WHERE canonical_place_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_onthego_place_association() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.canonical_place_id IS NOT NULL AND NEW.canonical_place_id IS DISTINCT FROM OLD.canonical_place_id THEN
  RAISE EXCEPTION 'An established mobile business association cannot be replaced' USING ERRCODE='42501';
 END IF;
 IF NEW.canonical_place_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.canonical_place_id IS DISTINCT FROM OLD.canonical_place_id) THEN
  IF NEW.place_type IS DISTINCT FROM 'on_the_go' OR coalesce(NEW.is_deleted,false) OR NOT EXISTS(
   SELECT 1 FROM public.places p WHERE p.id=NEW.canonical_place_id AND coalesce(p.is_active,true) AND coalesce(p.status,'active')='active'
   AND NOT EXISTS(SELECT 1 FROM public.tavvy_places other WHERE other.id<>NEW.id AND p.source_type='user' AND p.source_id=other.id::text)
   AND p.source_type='user' AND p.source_id=NEW.id::text
  ) THEN RAISE EXCEPTION 'A verified place association is required' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_onthego_place_association BEFORE INSERT OR UPDATE OF canonical_place_id ON public.tavvy_places FOR EACH ROW EXECUTE FUNCTION public.guard_onthego_place_association();
REVOKE ALL ON FUNCTION public.guard_onthego_place_association() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ensure_onthego_place_details(p_tavvy_place_id uuid,p_canonical_place_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); b public.tavvy_places%rowtype; target uuid; candidates uuid[];
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND banned_until>now()) THEN RAISE EXCEPTION 'Sign in with an active account' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.tavvy_places WHERE id=p_tavvy_place_id FOR UPDATE;
 IF NOT FOUND OR b.created_by IS DISTINCT FROM actor OR b.place_type IS DISTINCT FROM 'on_the_go' OR coalesce(b.is_deleted,false) THEN RAISE EXCEPTION 'You do not own this mobile business' USING ERRCODE='42501'; END IF;
 IF b.canonical_place_id IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=b.canonical_place_id AND coalesce(is_active,true) AND coalesce(status,'active')='active') THEN RAISE EXCEPTION 'Your Tavvy place page needs support review' USING ERRCODE='22023'; END IF;
  IF p_canonical_place_id IS NOT NULL AND p_canonical_place_id<>b.canonical_place_id THEN RAISE EXCEPTION 'This business already has a Tavvy place page' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('canonical_place_id',b.canonical_place_id);
 END IF;
 SELECT array_agg(id) INTO candidates FROM public.places WHERE source_type='user' AND source_id=b.id::text;
 IF cardinality(candidates)>1 THEN RAISE EXCEPTION 'Multiple place records need support review before linking' USING ERRCODE='22023'; END IF;
 target:=candidates[1];
 IF p_canonical_place_id IS NOT NULL THEN
  IF target IS NOT NULL AND target<>p_canonical_place_id THEN RAISE EXCEPTION 'An existing source association must be preserved' USING ERRCODE='22023'; END IF;
  IF target IS NULL THEN RAISE EXCEPTION 'Support must review an existing place without this business source association' USING ERRCODE='22023'; END IF;
  target:=p_canonical_place_id;
 END IF;
 IF target IS NULL THEN
  INSERT INTO public.places(source_type,source_id,name,description,tavvy_category,tavvy_subcategory,place_type,service_area,phone,email,website,cover_image_url,photos,hours,is_active,status)
   VALUES('user',b.id::text,b.name,b.description,b.tavvy_category,b.tavvy_subcategory,'on_the_go',b.service_area,b.phone,b.email,b.website,b.cover_image_url,to_jsonb(b.photos),b.hours_json,true,'active') RETURNING id INTO target;
 END IF;
 -- Trigger checks active state and provenance. Neither source creation nor this
 -- association grants a verified merchant badge or fabricates an ownership claim.
 UPDATE public.tavvy_places SET canonical_place_id=target WHERE id=b.id;
 RETURN jsonb_build_object('canonical_place_id',target);
END; $$;
REVOKE ALL ON FUNCTION public.ensure_onthego_place_details(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_onthego_place_details(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_onthego_business_profile(p_tavvy_place_id uuid,p_details jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); b public.tavvy_places%rowtype; key text; value text; target uuid; candidates uuid[];
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND banned_until>now()) THEN RAISE EXCEPTION 'Sign in with an active account' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.tavvy_places WHERE id=p_tavvy_place_id FOR UPDATE;
 IF NOT FOUND OR b.created_by IS DISTINCT FROM actor OR b.place_type IS DISTINCT FROM 'on_the_go' OR coalesce(b.is_deleted,false) THEN RAISE EXCEPTION 'You do not own this mobile business' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_details) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid business details' USING ERRCODE='22023'; END IF;
 FOR key,value IN SELECT k,v FROM jsonb_each_text(p_details) x(k,v) LOOP
  IF key NOT IN ('name','description','phone','email','website','instagram','facebook','twitter','tiktok','hours_display','service_area') OR (value IS NOT NULL AND jsonb_typeof(p_details->key)<>'string') THEN RAISE EXCEPTION 'Unsupported business field' USING ERRCODE='22023'; END IF;
  IF length(coalesce(value,''))>(CASE WHEN key='description' THEN 4000 WHEN key='hours_display' THEN 2000 ELSE 500 END) THEN RAISE EXCEPTION 'Business field is too long' USING ERRCODE='22023'; END IF;
  IF key IN ('name','service_area') AND length(trim(coalesce(value,'')))=0 THEN RAISE EXCEPTION 'Business name and service area are required' USING ERRCODE='22023'; END IF;
  IF key IN ('website','instagram','facebook','twitter','tiktok') AND length(trim(coalesce(value,'')))>0 AND value !~* '^https?://[^[:space:]]+$' THEN RAISE EXCEPTION 'Use a full https website or social link' USING ERRCODE='22023'; END IF;
 END LOOP;
 UPDATE public.tavvy_places SET
  name=CASE WHEN p_details?'name' THEN trim(p_details->>'name') ELSE name END,
  description=CASE WHEN p_details?'description' THEN nullif(trim(p_details->>'description'),'') ELSE description END,
  phone=CASE WHEN p_details?'phone' THEN nullif(trim(p_details->>'phone'),'') ELSE phone END,
  email=CASE WHEN p_details?'email' THEN nullif(trim(p_details->>'email'),'') ELSE email END,
  website=CASE WHEN p_details?'website' THEN nullif(trim(p_details->>'website'),'') ELSE website END,
  instagram=CASE WHEN p_details?'instagram' THEN nullif(trim(p_details->>'instagram'),'') ELSE instagram END,
  facebook=CASE WHEN p_details?'facebook' THEN nullif(trim(p_details->>'facebook'),'') ELSE facebook END,
  twitter=CASE WHEN p_details?'twitter' THEN nullif(trim(p_details->>'twitter'),'') ELSE twitter END,
  tiktok=CASE WHEN p_details?'tiktok' THEN nullif(trim(p_details->>'tiktok'),'') ELSE tiktok END,
  hours_display=CASE WHEN p_details?'hours_display' THEN nullif(trim(p_details->>'hours_display'),'') ELSE hours_display END,
  service_area=CASE WHEN p_details?'service_area' THEN trim(p_details->>'service_area') ELSE service_area END,updated_at=now()
  WHERE id=b.id RETURNING * INTO b;
 -- Preserve all unedited fields and every membership/verification flag. Only the
 -- unique authored source association is supported; no cross-record merge.
 target:=b.canonical_place_id;
 IF target IS NULL THEN
  SELECT array_agg(id) INTO candidates FROM public.places WHERE source_type='user' AND source_id=b.id::text;
  IF cardinality(candidates)>1 THEN RAISE EXCEPTION 'Multiple place records need support review' USING ERRCODE='22023'; END IF;
  target:=candidates[1];
 END IF;
 IF target IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM public.places p WHERE p.id=target AND p.source_type='user' AND p.source_id=b.id::text) THEN RAISE EXCEPTION 'Place ownership needs review' USING ERRCODE='42501'; END IF;
  UPDATE public.places SET
   name=CASE WHEN p_details?'name' THEN b.name ELSE name END,
   description=CASE WHEN p_details?'description' THEN b.description ELSE description END,
   phone=CASE WHEN p_details?'phone' THEN b.phone ELSE phone END,
   email=CASE WHEN p_details?'email' THEN b.email ELSE email END,
   website=CASE WHEN p_details?'website' THEN b.website ELSE website END,
   service_area=CASE WHEN p_details?'service_area' THEN b.service_area ELSE service_area END,updated_at=now()
   WHERE id=target;
 END IF;
 RETURN jsonb_build_object('success',true);
END; $$;
REVOKE ALL ON FUNCTION public.save_onthego_business_profile(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_onthego_business_profile(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_onthego_place(p_tavvy_place_id uuid DEFAULT NULL,p_canonical_place_id uuid DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b public.tavvy_places%rowtype; target uuid; candidates uuid[]; profile jsonb; live jsonb; upcoming jsonb; more boolean;
BEGIN
 IF (p_tavvy_place_id IS NULL AND p_canonical_place_id IS NULL) OR p_offset<0 OR p_limit<1 OR p_limit>100 THEN RAISE EXCEPTION 'Invalid mobile business request' USING ERRCODE='22023'; END IF;
 IF p_tavvy_place_id IS NOT NULL THEN SELECT * INTO b FROM public.tavvy_places WHERE id=p_tavvy_place_id;
 ELSE
  SELECT * INTO b FROM public.tavvy_places t WHERE t.canonical_place_id=p_canonical_place_id
    OR (t.canonical_place_id IS NULL AND EXISTS(SELECT 1 FROM public.places p WHERE p.id=p_canonical_place_id AND p.source_type='user' AND p.source_id=t.id::text));
 END IF;
 IF b.id IS NULL OR NOT public.onthego_business_available(b.id) THEN RETURN NULL; END IF;
 target:=b.canonical_place_id;
 IF target IS NULL THEN
  SELECT array_agg(id) INTO candidates FROM public.places WHERE source_type='user' AND source_id=b.id::text AND coalesce(is_active,true) AND coalesce(status,'active')='active';
  IF cardinality(candidates)=1 THEN target:=candidates[1]; END IF;
 END IF;
 IF target IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.places WHERE id=target AND coalesce(is_active,true) AND coalesce(status,'active')='active') THEN target:=NULL; END IF;
 IF p_canonical_place_id IS NOT NULL AND target IS DISTINCT FROM p_canonical_place_id THEN RETURN NULL; END IF;
 profile:=jsonb_build_object('id',b.id,'canonical_place_id',target,'name',b.name,'description',b.description,'tavvy_category',b.tavvy_category,'tavvy_subcategory',b.tavvy_subcategory,'service_area',b.service_area,'phone',b.phone,'email',b.email,'website',b.website,'instagram',b.instagram,'facebook',b.facebook,'twitter',b.twitter,'tiktok',b.tiktok,'hours_display',b.hours_display,'hours_json',b.hours_json,'cover_image_url',b.cover_image_url,'photos',b.photos);
 SELECT jsonb_build_object('id',s.id,'session_lat',s.session_lat,'session_lng',s.session_lng,'session_address',s.session_address,'location_label',s.location_label,'today_note',s.today_note,'scheduled_end_at',s.scheduled_end_at) INTO live
  FROM public.live_sessions s WHERE s.tavvy_place_id=b.id AND s.status='active' AND s.address_confirmed=true AND s.scheduled_end_at>now() ORDER BY s.started_at DESC LIMIT 1;
 IF live IS NOT NULL THEN
  live:=live || jsonb_build_object(
   'items',(SELECT coalesce(jsonb_agg(to_jsonb(i)),'[]'::jsonb) FROM (SELECT id,name,description,price_cents,is_available FROM public.live_session_menu_items WHERE session_id=(live->>'id')::uuid AND is_available=true ORDER BY sort_order,id) i),
   'specials',(SELECT coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) FROM (SELECT id,title,description,valid_until,urgency_label FROM public.live_session_specials WHERE session_id=(live->>'id')::uuid AND (valid_until IS NULL OR valid_until>now()) ORDER BY created_at,id) s)
  );
 END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) INTO upcoming FROM (
  SELECT id,event_title,event_description,location_name,location_address,latitude,longitude,scheduled_start,scheduled_end FROM public.scheduled_events
  WHERE tavvy_place_id=b.id AND status='scheduled' AND scheduled_end>now() ORDER BY scheduled_start,id OFFSET p_offset LIMIT p_limit
 ) e;
 SELECT EXISTS(SELECT 1 FROM public.scheduled_events WHERE tavvy_place_id=b.id AND status='scheduled' AND scheduled_end>now() ORDER BY scheduled_start,id OFFSET p_offset+p_limit LIMIT 1) INTO more;
 RETURN jsonb_build_object('place',profile,'live',live,'events',upcoming,'has_more',more);
END; $$;
REVOKE ALL ON FUNCTION public.get_onthego_place(uuid,uuid,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_onthego_place(uuid,uuid,integer,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.assert_story_publish_access(p_place_id uuid DEFAULT NULL::uuid, p_story_kind text DEFAULT 'customer'::text, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision, p_require_location boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE actor uuid:=auth.uid(); cfg public.story_publish_settings%ROWTYPE;
  target public.places%ROWTYPE; daily integer; per_place integer;
  strikes integer; last_strike timestamptz; distance_m double precision; mobile_business uuid;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  SELECT * INTO STRICT cfg FROM public.story_publish_settings WHERE singleton;
  -- auth.users is not writable by the client. Do not trust editable profile flags.
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND deleted_at IS NULL)
    OR EXISTS(SELECT 1 FROM auth.users u WHERE u.id=actor
      AND nullif(to_jsonb(u)->>'banned_until','')::timestamptz > now())
    THEN RAISE EXCEPTION 'STORY_ACCOUNT_RESTRICTED'; END IF;
  SELECT count(*),max(created_at) INTO strikes,last_strike FROM public.user_strikes
    WHERE user_id=actor AND (expires_at IS NULL OR expires_at>now());
  IF strikes>=cfg.strike_threshold AND last_strike+make_interval(hours=>cfg.suspension_hours)>now()
    THEN RAISE EXCEPTION 'STORY_ACCOUNT_RESTRICTED'; END IF;
  IF p_story_kind NOT IN ('customer','owner_highlight') OR p_story_kind IS NULL
    THEN RAISE EXCEPTION 'STORY_KIND_INVALID'; END IF;
  -- Rolling 24 hours is identical in both clients and avoids local-midnight bypass.
  SELECT count(*),count(*) FILTER(WHERE place_id=p_place_id) INTO daily,per_place
    FROM public.place_stories WHERE user_id=actor AND created_at>now()-interval '24 hours';
  IF daily>=cfg.daily_limit THEN RAISE EXCEPTION 'STORY_DAILY_LIMIT'; END IF;
  IF p_place_id IS NULL THEN
    IF p_require_location THEN RAISE EXCEPTION 'STORY_PLACE_INVALID'; END IF;
    RETURN;
  END IF;
  SELECT * INTO target FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'STORY_PLACE_INVALID'; END IF;
  IF per_place>=cfg.place_daily_limit THEN RAISE EXCEPTION 'STORY_PLACE_LIMIT'; END IF;
  IF p_story_kind='owner_highlight' THEN
    IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'STORY_OWNER_REQUIRED'; END IF;
    RETURN;
  END IF;
  IF NOT p_require_location THEN RETURN; END IF;
  -- A mobile place's fixed profile coordinates never prove where it is now.
  SELECT b.id INTO mobile_business FROM public.tavvy_places b
    WHERE b.place_type='on_the_go' AND target.source_type='user' AND target.source_id=b.id::text;
  IF mobile_business IS NOT NULL OR target.place_type='on_the_go' THEN
    SELECT s.session_lat,s.session_lng INTO target.latitude,target.longitude FROM public.live_sessions s
      WHERE s.tavvy_place_id=mobile_business AND s.status='active' AND s.address_confirmed IS TRUE
      AND s.scheduled_end_at>now() AND public.onthego_business_available(s.tavvy_place_id)
      ORDER BY s.started_at DESC,s.id LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'STORY_PLACE_LOCATION_MISSING'; END IF;
  END IF;
  IF target.latitude IS NULL OR target.longitude IS NULL
    OR target.latitude NOT BETWEEN -90 AND 90 OR target.longitude NOT BETWEEN -180 AND 180
    THEN RAISE EXCEPTION 'STORY_PLACE_LOCATION_MISSING'; END IF;
  IF p_latitude IS NULL OR p_longitude IS NULL OR p_latitude NOT BETWEEN -90 AND 90
    OR p_longitude NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'STORY_LOCATION_REQUIRED'; END IF;
  distance_m:=2*6371000*asin(sqrt(least(1.0,greatest(0.0,
    power(sin(radians(p_latitude-target.latitude)/2),2)
    +cos(radians(target.latitude))*cos(radians(p_latitude))*power(sin(radians(p_longitude-target.longitude)/2),2)))));
  IF distance_m>cfg.radius_meters THEN RAISE EXCEPTION 'STORY_OUTSIDE_RADIUS'; END IF;
  -- Supplied GPS is client location evidence, not verified attendance or identity.
END $function$
;
COMMIT;
