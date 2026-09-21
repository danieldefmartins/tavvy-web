-- Depends on 202609210001_restaurant_owner_onboarding.sql.
-- Publishing now requires authenticated RPCs. Old clients can still read stories,
-- but must update to publish: their inserts omit location and cannot be made safe.
-- No live story/media backfill or storage deletion is performed during installation.

CREATE TABLE IF NOT EXISTS public.story_publish_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  expiry_hours integer NOT NULL DEFAULT 72 CHECK(expiry_hours BETWEEN 1 AND 168),
  daily_limit integer NOT NULL DEFAULT 10 CHECK(daily_limit BETWEEN 1 AND 100),
  place_daily_limit integer NOT NULL DEFAULT 3 CHECK(place_daily_limit BETWEEN 1 AND 20),
  radius_meters integer NOT NULL DEFAULT 150 CHECK(radius_meters BETWEEN 1 AND 1000),
  max_media_bytes bigint NOT NULL DEFAULT 52428800 CHECK(max_media_bytes BETWEEN 1 AND 52428800),
  strike_threshold integer NOT NULL DEFAULT 2 CHECK(strike_threshold > 0),
  suspension_hours integer NOT NULL DEFAULT 168 CHECK(suspension_hours > 0),
  public_storage_origin text NOT NULL DEFAULT 'https://scasgwrikoqdwlwlwcff.supabase.co'
    CHECK(public_storage_origin ~ '^https://[a-z0-9.-]+(:[0-9]+)?$')
);
INSERT INTO public.story_publish_settings(singleton) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.story_publish_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.story_publish_settings FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.story_publish_settings TO service_role;

ALTER TABLE public.place_stories ADD COLUMN IF NOT EXISTS story_kind text NOT NULL DEFAULT 'customer';
ALTER TABLE public.place_stories ADD COLUMN IF NOT EXISTS media_path text;
ALTER TABLE public.place_stories ADD CONSTRAINT place_stories_kind_check CHECK(story_kind IN ('customer','owner_highlight'));
CREATE UNIQUE INDEX IF NOT EXISTS place_stories_media_path_unique ON public.place_stories(media_path) WHERE media_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS place_stories_author_created ON public.place_stories(user_id,created_at DESC);
ALTER TABLE public.place_story_highlights ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Remove the legacy first-story-is-permanent behavior, including differently named
-- deployments of those triggers. They must not extend customer stories indefinitely.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tg.tgname FROM pg_trigger tg JOIN pg_proc p ON p.oid=tg.tgfoid
    WHERE tg.tgrelid='public.place_stories'::regclass AND NOT tg.tgisinternal
      AND p.proname IN ('manage_story_permanence','check_story_expiration')
  LOOP EXECUTE format('DROP TRIGGER %I ON public.place_stories',t.tgname); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.assert_story_publish_access(
  p_place_id uuid DEFAULT NULL,p_story_kind text DEFAULT 'customer',
  p_latitude double precision DEFAULT NULL,p_longitude double precision DEFAULT NULL,
  p_require_location boolean DEFAULT true
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); cfg public.story_publish_settings%ROWTYPE;
  target public.places%ROWTYPE; daily integer; per_place integer;
  strikes integer; last_strike timestamptz; distance_m double precision;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  SELECT * INTO STRICT cfg FROM public.story_publish_settings WHERE singleton;
  -- auth.users is not writable by the client. Do not trust editable profile flags.
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor)
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
  SELECT * INTO target FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false;
  IF NOT FOUND THEN RAISE EXCEPTION 'STORY_PLACE_INVALID'; END IF;
  IF per_place>=cfg.place_daily_limit THEN RAISE EXCEPTION 'STORY_PLACE_LIMIT'; END IF;
  IF p_story_kind='owner_highlight' THEN
    IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'STORY_OWNER_REQUIRED'; END IF;
    RETURN;
  END IF;
  IF NOT p_require_location THEN RETURN; END IF;
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
END $$;
REVOKE ALL ON FUNCTION public.assert_story_publish_access(uuid,text,double precision,double precision,boolean) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_story_publish_access(
  p_place_id uuid DEFAULT NULL,p_story_kind text DEFAULT 'customer',
  p_latitude double precision DEFAULT NULL,p_longitude double precision DEFAULT NULL,
  p_require_location boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM public.assert_story_publish_access(p_place_id,p_story_kind,p_latitude,p_longitude,p_require_location);
  RETURN (SELECT jsonb_build_object('allowed',true,'expiry_hours',expiry_hours,
    'daily_limit',daily_limit,'place_daily_limit',place_daily_limit,'radius_meters',radius_meters,
    'max_media_bytes',max_media_bytes) FROM public.story_publish_settings WHERE singleton);
END $$;

CREATE OR REPLACE FUNCTION public.publish_place_story(
  p_place_id uuid,p_media_path text,p_media_type text,p_story_kind text DEFAULT 'customer',
  p_caption text DEFAULT NULL,p_tags text[] DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,p_longitude double precision DEFAULT NULL,
  p_universe_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); cfg public.story_publish_settings%ROWTYPE;
  asset storage.objects%ROWTYPE; result public.place_stories%ROWTYPE; mime text; bytes bigint;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  -- Serialize a user's posts so concurrent calls cannot exceed either rate limit.
  PERFORM pg_advisory_xact_lock(hashtextextended('story:'||actor::text,0));
  SELECT * INTO result FROM public.place_stories WHERE media_path=p_media_path AND user_id=actor;
  IF FOUND THEN
    IF result.place_id<>p_place_id OR result.story_kind<>p_story_kind OR result.media_type<>p_media_type
      OR coalesce(result.caption,'')<>coalesce(nullif(btrim(p_caption),''),'') OR coalesce(result.tags,'{}') IS DISTINCT FROM coalesce(p_tags,'{}') OR result.universe_id IS DISTINCT FROM p_universe_id
      THEN RAISE EXCEPTION 'STORY_RETRY_MISMATCH'; END IF;
    IF result.status<>'active' THEN RAISE EXCEPTION 'STORY_NO_LONGER_ACTIVE'; END IF;
    RETURN to_jsonb(result);
  END IF;
  PERFORM public.assert_story_publish_access(p_place_id,p_story_kind,p_latitude,p_longitude,true);
  SELECT * INTO STRICT cfg FROM public.story_publish_settings WHERE singleton;
  IF p_media_type NOT IN ('image','video') OR p_media_type IS NULL THEN RAISE EXCEPTION 'STORY_MEDIA_TYPE_INVALID'; END IF;
  IF length(coalesce(p_caption,''))>500 OR cardinality(coalesce(p_tags,'{}'))>20
    OR EXISTS(SELECT 1 FROM unnest(p_tags) tag WHERE length(tag)>40)
    THEN RAISE EXCEPTION 'STORY_TEXT_TOO_LONG'; END IF;
  IF p_universe_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.atlas_universe_places
      WHERE universe_id=p_universe_id AND place_id=p_place_id)
    THEN RAISE EXCEPTION 'STORY_UNIVERSE_INVALID'; END IF;
  IF p_media_path IS NULL OR p_media_path NOT LIKE actor::text||'/'||p_place_id::text||'/%'
    OR p_media_path !~ '^[a-f0-9-]+/[a-f0-9-]+/[A-Za-z0-9._-]+$'
    OR p_media_path LIKE '%..%' THEN RAISE EXCEPTION 'STORY_MEDIA_NOT_OWNED'; END IF;
  SELECT * INTO asset FROM storage.objects WHERE bucket_id='place-stories' AND name=p_media_path
    AND coalesce(nullif(owner_id,''),owner::text)=actor::text
    AND nullif(to_jsonb(objects)->>'archived_at','') IS NULL
    AND coalesce((to_jsonb(objects)->>'is_delete_marker')::boolean,false)=false;
  IF NOT FOUND THEN RAISE EXCEPTION 'STORY_MEDIA_NOT_OWNED'; END IF;
  mime:=asset.metadata->>'mimetype';
  IF coalesce(asset.metadata->>'size','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'STORY_MEDIA_METADATA_MISSING'; END IF;
  bytes:=(asset.metadata->>'size')::bigint;
  IF bytes<1 OR bytes>cfg.max_media_bytes THEN RAISE EXCEPTION 'STORY_MEDIA_TOO_LARGE'; END IF;
  IF (p_media_type='image' AND mime NOT IN ('image/jpeg','image/png','image/webp','image/heic'))
    OR (p_media_type='video' AND mime NOT IN ('video/mp4','video/quicktime','video/webm')) OR mime IS NULL
    THEN RAISE EXCEPTION 'STORY_MEDIA_TYPE_INVALID'; END IF;
  INSERT INTO public.place_stories(place_id,user_id,media_path,media_url,media_type,story_kind,
    caption,tags,status,is_permanent,created_at,updated_at,expires_at,universe_id,thumbnail_url)
  VALUES(p_place_id,actor,p_media_path,cfg.public_storage_origin||'/storage/v1/object/public/place-stories/'||p_media_path,
    p_media_type,p_story_kind,nullif(btrim(p_caption),''),coalesce(p_tags,'{}'),'active',p_story_kind='owner_highlight',
    now(),now(),now()+make_interval(hours=>cfg.expiry_hours),p_universe_id,
    CASE WHEN p_media_type='image' THEN cfg.public_storage_origin||'/storage/v1/object/public/place-stories/'||p_media_path ELSE NULL END)
  RETURNING * INTO result;
  RETURN to_jsonb(result);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_story_by_media(p_media_path text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT to_jsonb(s) FROM public.place_stories s WHERE s.user_id=auth.uid() AND s.media_path=p_media_path
$$;
CREATE OR REPLACE FUNCTION public.delete_my_place_story(p_story_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  UPDATE public.place_stories SET status='deleted',updated_at=now() WHERE id=p_story_id AND user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'STORY_AUTHOR_REQUIRED'; END IF;
  RETURN true;
END $$;

-- Reports reach Tavvy moderation. A report alone never hides customer content,
-- and restaurant ownership does not grant report approval or removal powers.
CREATE OR REPLACE FUNCTION public.report_place_story(p_story_id uuid,p_reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  IF p_reason NOT IN ('sexual','explicit','harassment','violent','spam','other') OR p_reason IS NULL
    THEN RAISE EXCEPTION 'STORY_REPORT_REASON_INVALID'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.place_stories WHERE id=p_story_id AND status='active'
    AND (expires_at>now() OR (story_kind='owner_highlight' AND is_permanent))) THEN RAISE EXCEPTION 'STORY_NO_LONGER_ACTIVE'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('story-report:'||auth.uid()::text||':'||p_story_id::text,0));
  IF NOT EXISTS(SELECT 1 FROM public.story_reports WHERE story_id=p_story_id AND reporter_user_id=auth.uid()) THEN
    INSERT INTO public.story_reports(story_id,reporter_user_id,reason) VALUES(p_story_id,auth.uid(),p_reason);
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.save_owner_story_highlight(
  p_place_id uuid,p_highlight_id uuid DEFAULT NULL,p_title text DEFAULT NULL,
  p_story_ids uuid[] DEFAULT NULL,p_is_active boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.place_story_highlights%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'STORY_OWNER_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false)
    THEN RAISE EXCEPTION 'STORY_PLACE_INVALID'; END IF;
  IF nullif(btrim(p_title),'') IS NULL OR length(p_title)>80 THEN RAISE EXCEPTION 'STORY_HIGHLIGHT_TITLE_INVALID'; END IF;
  IF cardinality(coalesce(p_story_ids,'{}'))>30 THEN RAISE EXCEPTION 'STORY_HIGHLIGHT_LIMIT'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(p_story_ids) wanted(id) WHERE NOT EXISTS(
    SELECT 1 FROM public.place_stories s WHERE s.id=wanted.id AND s.place_id=p_place_id
      AND s.story_kind='owner_highlight' AND s.status='active')) THEN RAISE EXCEPTION 'STORY_HIGHLIGHT_CONTENT_INVALID'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('story-highlight:'||p_place_id::text,0));
  IF p_highlight_id IS NULL THEN
    INSERT INTO public.place_story_highlights(place_id,title,position,is_active)
      SELECT p_place_id,btrim(p_title),coalesce(max(position),-1)+1,coalesce(p_is_active,true)
      FROM public.place_story_highlights WHERE place_id=p_place_id RETURNING * INTO result;
  ELSE
    UPDATE public.place_story_highlights SET title=btrim(p_title),is_active=coalesce(p_is_active,true),updated_at=now()
      WHERE id=p_highlight_id AND place_id=p_place_id RETURNING * INTO result;
    IF NOT FOUND THEN RAISE EXCEPTION 'STORY_HIGHLIGHT_NOT_FOUND'; END IF;
  END IF;
  IF p_story_ids IS NOT NULL THEN
    DELETE FROM public.place_story_highlight_items WHERE highlight_id=result.id;
    INSERT INTO public.place_story_highlight_items(highlight_id,story_id,position)
      SELECT result.id,id,min(n)::int-1 FROM unnest(p_story_ids) WITH ORDINALITY a(id,n) GROUP BY id;
    UPDATE public.place_story_highlights SET cover_story_id=p_story_ids[1] WHERE id=result.id RETURNING * INTO result;
  END IF;
  RETURN to_jsonb(result);
END $$;
CREATE OR REPLACE FUNCTION public.delete_owner_story_highlight(p_highlight_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target uuid;
BEGIN
  SELECT place_id INTO target FROM public.place_story_highlights WHERE id=p_highlight_id;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  IF target IS NULL OR NOT public.has_verified_restaurant_claim(target) THEN RAISE EXCEPTION 'STORY_OWNER_REQUIRED'; END IF;
  DELETE FROM public.place_story_highlights WHERE id=p_highlight_id;
  RETURN true;
END $$;

-- Table access cannot bypass server identity, rate limits, ownership or expiry.
DO $$ DECLARE t text; p record; BEGIN
  FOREACH t IN ARRAY ARRAY['place_stories','place_story_highlights','place_story_highlight_items','story_reports'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t
    LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t); END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE INSERT,UPDATE,DELETE ON public.%I FROM PUBLIC,anon,authenticated',t);
  END LOOP;
END $$;
REVOKE INSERT,UPDATE,DELETE ON public.user_strikes FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.place_stories,public.place_story_highlights,public.place_story_highlight_items TO anon,authenticated;
CREATE POLICY story_visible ON public.place_stories FOR SELECT TO anon,authenticated USING(
  status='active' AND (expires_at>now() OR (story_kind='owner_highlight' AND is_permanent)));
CREATE POLICY story_author_read ON public.place_stories FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY story_highlight_visible ON public.place_story_highlights FOR SELECT TO anon,authenticated USING(is_active);
CREATE POLICY story_highlight_owner_read ON public.place_story_highlights FOR SELECT TO authenticated USING(public.has_verified_restaurant_claim(place_id));
CREATE POLICY story_highlight_item_visible ON public.place_story_highlight_items FOR SELECT TO anon,authenticated USING(
  EXISTS(SELECT 1 FROM public.place_story_highlights h WHERE h.id=highlight_id));
CREATE POLICY story_report_author_read ON public.story_reports FOR SELECT TO authenticated USING(reporter_user_id=auth.uid());

-- Bound abandoned uploads too. A caller cannot fill the story bucket while
-- avoiding publish RPC limits. Count owned assets under the same per-user lock.
CREATE OR REPLACE FUNCTION public.can_upload_story_media(p_name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); target uuid; cfg public.story_publish_settings%ROWTYPE;
  daily integer; per_place integer;
BEGIN
  IF actor IS NULL OR p_name IS NULL OR split_part(p_name,'/',1)<>actor::text
    OR p_name !~ '^[a-f0-9-]+/[a-f0-9-]+/[A-Za-z0-9._-]+$' OR p_name LIKE '%..%' THEN RETURN false; END IF;
  BEGIN target:=split_part(p_name,'/',2)::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
  PERFORM pg_advisory_xact_lock(hashtextextended('story:'||actor::text,0));
  PERFORM public.assert_story_publish_access(target,'customer',NULL,NULL,false);
  SELECT * INTO STRICT cfg FROM public.story_publish_settings WHERE singleton;
  SELECT count(*),count(*) FILTER(WHERE split_part(name,'/',2)=target::text) INTO daily,per_place
    FROM storage.objects WHERE bucket_id='place-stories' AND split_part(name,'/',1)=actor::text
      AND created_at>now()-interval '24 hours';
  RETURN daily<cfg.daily_limit AND per_place<cfg.place_daily_limit;
END $$;
REVOKE ALL ON FUNCTION public.can_upload_story_media(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_upload_story_media(text) TO authenticated;

-- Existing Storage INSERT policy was any authenticated account, any path.
DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own stories" ON storage.objects;
CREATE POLICY story_media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(
  bucket_id='place-stories' AND public.can_upload_story_media(name));
CREATE POLICY story_media_delete ON storage.objects FOR DELETE TO authenticated USING(
  bucket_id='place-stories' AND split_part(name,'/',1)=auth.uid()::text
  AND coalesce(nullif(owner_id,''),owner::text)=auth.uid()::text);
-- Restrictive policies also protect this bucket against future broad permissive policies.
CREATE POLICY story_media_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(
  bucket_id<>'place-stories' OR public.can_upload_story_media(name));
CREATE POLICY story_media_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(bucket_id<>'place-stories') WITH CHECK(bucket_id<>'place-stories');
CREATE POLICY story_media_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(
  bucket_id<>'place-stories' OR (split_part(name,'/',1)=auth.uid()::text AND coalesce(nullif(owner_id,''),owner::text)=auth.uid()::text));

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('get_story_publish_access','publish_place_story','get_my_story_by_media',
   'delete_my_place_story','report_place_story','save_owner_story_highlight','delete_owner_story_highlight') LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature);
   EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
