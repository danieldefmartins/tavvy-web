-- Additive correction after authenticated story publishing002 (already deployed).
-- Treat explicit inactive/draft/etc. place statuses as unavailable for publishing.
-- Legacy NULL status still honors is_active, matching pre-status canonical rows.

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
  SELECT * INTO target FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active';
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

CREATE OR REPLACE FUNCTION public.save_owner_story_highlight(
  p_place_id uuid,p_highlight_id uuid DEFAULT NULL,p_title text DEFAULT NULL,
  p_story_ids uuid[] DEFAULT NULL,p_is_active boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.place_story_highlights%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'STORY_AUTH_REQUIRED'; END IF;
  IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'STORY_OWNER_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=p_place_id AND is_active IS DISTINCT FROM false AND coalesce(status,'active')='active')
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

NOTIFY pgrst,'reload schema';
