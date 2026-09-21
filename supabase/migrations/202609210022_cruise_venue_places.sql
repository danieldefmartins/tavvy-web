-- Canonical onboard identities. Install only with reviewed dependency fingerprints.
-- No catalog/place/review backfill is part of installation.
BEGIN;
CREATE FUNCTION public.cruise_venue_place_source_key(p_ship_id uuid,p_venue_id uuid) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
 SELECT 'cruise-venue:'||p_ship_id::text||':'||p_venue_id::text
$$;
CREATE FUNCTION public.cruise_venue_review_category(p_kind text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE p_kind WHEN 'restaurant' THEN 'restaurant' WHEN 'cafe' THEN 'cafe'
 WHEN 'bar' THEN 'nightlife' WHEN 'shop' THEN 'shopping' WHEN 'spa' THEN 'beauty'
 WHEN 'fitness' THEN 'fitness' WHEN 'theatre' THEN 'entertainment'
 WHEN 'entertainment' THEN 'entertainment' WHEN 'kids_club' THEN 'entertainment'
 ELSE 'other' END
$$;
REVOKE ALL ON FUNCTION public.cruise_venue_place_source_key(uuid,uuid),public.cruise_venue_review_category(text) FROM PUBLIC,anon,authenticated;

-- PK lookup returns immediately for ordinary places. SECURITY DEFINER avoids
-- recursive places RLS; only a boolean escapes, never hidden ship metadata.
CREATE FUNCTION public.cruise_place_is_public(p_place_id uuid,p_accept_review boolean DEFAULT false) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE p public.places%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.places WHERE id=p_place_id;
 IF NOT FOUND OR p.source_type IS DISTINCT FROM 'cruise_venue' THEN RETURN true; END IF;
 IF p.is_active IS DISTINCT FROM true OR p.status IS DISTINCT FROM 'active' THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.cruise_venues v JOIN public.cruise_ships s ON s.id=v.ship_id
  WHERE v.place_id=p.id AND p.source_id=public.cruise_venue_place_source_key(s.id,v.id)
  AND p.tavvy_category IS NOT DISTINCT FROM public.cruise_venue_review_category(v.kind)
  AND v.verification='verified' AND public.cruise_has_sources(s.id,v.source_ids)
  AND public.cruise_universe_is_public(s.universe_id)
  AND (NOT p_accept_review OR s.operating_status='operating')
  AND EXISTS(SELECT 1 FROM public.atlas_universe_places m WHERE m.place_id=p.id AND m.universe_id=s.universe_id)
  AND NOT EXISTS(SELECT 1 FROM public.atlas_universe_places m WHERE m.place_id=p.id AND m.universe_id<>s.universe_id));
END $$;
REVOKE ALL ON FUNCTION public.cruise_place_is_public(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cruise_place_is_public(uuid,boolean) TO anon,authenticated,service_role;

CREATE FUNCTION public.get_cruise_venue_context_v1(p_place_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('venue_id',v.id,'venue_name',v.name,'place_id',p.id,'ship_id',s.id,
  'universe_id',s.universe_id,'ship_name',s.name,'ship_slug',s.slug,'operator_name',o.name,
  'kind',v.kind,'review_category',public.cruise_venue_review_category(v.kind),
  'deck_label',v.deck_label,'included',v.included,'availability_note',v.availability_note,'description',v.description,
  'official_url',CASE WHEN s.official_url ~ '^https://[^[:space:]@]+$' THEN s.official_url ELSE NULL END,
  'accepts_reviews',s.operating_status='operating',
  'sources',coalesce((SELECT jsonb_agg(jsonb_build_object('id',src.id,'url',src.url,'publisher',src.publisher,'checked_at',src.checked_at,'source_type',src.source_type) ORDER BY src.id)
    FROM public.cruise_ship_sources src WHERE src.ship_id=s.id AND src.id=ANY(v.source_ids) AND src.checked_at<=current_date),'[]'::jsonb))
 FROM public.places p JOIN public.cruise_venues v ON v.place_id=p.id
 JOIN public.cruise_ships s ON s.id=v.ship_id JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE p.id=p_place_id AND p.source_type='cruise_venue' AND public.cruise_place_is_public(p.id,false)
$$;
REVOKE ALL ON FUNCTION public.get_cruise_venue_context_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_venue_context_v1(uuid) TO anon,authenticated,service_role;

CREATE FUNCTION public.link_cruise_venue_places_v1(p_venue_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v public.cruise_venues%ROWTYPE; s public.cruise_ships%ROWTYPE; p public.places%ROWTYPE;
 source_key text; inserted boolean; result jsonb:='[]'::jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server catalog access required' USING ERRCODE='42501'; END IF;
 IF p_venue_ids IS NULL OR cardinality(p_venue_ids) NOT BETWEEN 1 AND 100
  OR array_position(p_venue_ids,NULL) IS NOT NULL
  OR cardinality(p_venue_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_venue_ids)x) THEN
  RAISE EXCEPTION 'Choose between 1 and 100 distinct venue IDs' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM public.cruise_venues WHERE id=ANY(p_venue_ids))<>cardinality(p_venue_ids) THEN
  RAISE EXCEPTION 'Venue identity not found' USING ERRCODE='22023'; END IF;
 FOR v IN SELECT * FROM public.cruise_venues WHERE id=ANY(p_venue_ids) ORDER BY id FOR UPDATE LOOP
  SELECT * INTO STRICT s FROM public.cruise_ships WHERE id=v.ship_id FOR SHARE;
  IF v.verification<>'verified' OR NOT public.cruise_has_sources(s.id,v.source_ids)
   OR NOT public.cruise_universe_is_public(s.universe_id) THEN
   RAISE EXCEPTION 'Venue requires a verified public ship and sources' USING ERRCODE='22023'; END IF;
  source_key:=public.cruise_venue_place_source_key(s.id,v.id); inserted:=false;
  IF v.place_id IS NULL THEN
   SELECT * INTO p FROM public.places WHERE source_type='cruise_venue' AND source_id=source_key FOR UPDATE;
   IF NOT FOUND THEN
    INSERT INTO public.places(source_type,source_id,name,description,tavvy_category,tavvy_subcategory,
     status,is_active,place_type,service_delivery,street,city,region,country,postcode,latitude,longitude,location)
    VALUES('cruise_venue',source_key,v.name,v.description,public.cruise_venue_review_category(v.kind),NULL,
     'active',true,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL)
    ON CONFLICT(source_type,source_id) WHERE source_id IS NOT NULL DO NOTHING RETURNING * INTO p;
    inserted:=FOUND;
    IF NOT inserted THEN SELECT * INTO STRICT p FROM public.places WHERE source_type='cruise_venue' AND source_id=source_key FOR UPDATE; END IF;
   END IF;
  ELSE
   SELECT * INTO STRICT p FROM public.places WHERE id=v.place_id FOR UPDATE;
  END IF;
  IF p.source_type IS DISTINCT FROM 'cruise_venue' OR p.source_id IS DISTINCT FROM source_key
   OR p.latitude IS NOT NULL OR p.longitude IS NOT NULL OR p.location IS NOT NULL
   OR p.street IS NOT NULL OR p.city IS NOT NULL OR p.region IS NOT NULL OR p.country IS NOT NULL OR p.postcode IS NOT NULL
   OR p.tavvy_category IS DISTINCT FROM public.cruise_venue_review_category(v.kind)
   OR p.place_type IS NOT NULL OR p.service_delivery IS NOT NULL THEN
   RAISE EXCEPTION 'Canonical venue identity conflicts with existing place data' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.cruise_venues other WHERE other.place_id=p.id AND other.id<>v.id)
   OR EXISTS(SELECT 1 FROM public.atlas_universe_places m WHERE m.place_id=p.id AND m.universe_id<>s.universe_id) THEN
   RAISE EXCEPTION 'Canonical venue belongs to another ship or Universe' USING ERRCODE='22023'; END IF;
  IF v.place_id IS NULL THEN UPDATE public.cruise_venues SET place_id=p.id WHERE id=v.id; END IF;
  INSERT INTO public.atlas_universe_places(universe_id,place_id) VALUES(s.universe_id,p.id)
   ON CONFLICT(universe_id,place_id) DO NOTHING;
  result:=result||jsonb_build_array(jsonb_build_object('venue_id',v.id,'ship_id',s.id,'place_id',p.id,
   'outcome',CASE WHEN inserted THEN 'created' ELSE 'already_linked' END));
 END LOOP;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.link_cruise_venue_places_v1(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.link_cruise_venue_places_v1(uuid[]) TO service_role;

-- Integrity protections apply even to server writes; trusted maintenance may
-- archive/unlink but must not repoint a venue or attach it to another ship.
CREATE FUNCTION public.guard_cruise_place_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.source_type='cruise_venue' OR (TG_OP='UPDATE' AND OLD.source_type='cruise_venue') THEN
  IF auth.role()='authenticated' THEN RAISE EXCEPTION 'Onboard identity is managed by the catalog' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.source_type IS DISTINCT FROM OLD.source_type OR NEW.source_id IS DISTINCT FROM OLD.source_id) THEN
   RAISE EXCEPTION 'Onboard canonical provenance is immutable' USING ERRCODE='22023'; END IF;
  IF NEW.source_type IS DISTINCT FROM 'cruise_venue' OR NEW.source_id IS NULL
   OR NOT EXISTS(SELECT 1 FROM public.cruise_venues v WHERE public.cruise_venue_place_source_key(v.ship_id,v.id)=NEW.source_id)
   OR NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL OR NEW.location IS NOT NULL
   OR NEW.street IS NOT NULL OR NEW.city IS NOT NULL OR NEW.region IS NOT NULL OR NEW.country IS NOT NULL OR NEW.postcode IS NOT NULL
   OR NEW.place_type IS NOT NULL OR NEW.service_delivery IS NOT NULL THEN
   RAISE EXCEPTION 'Onboard place requires exact venue provenance and no fixed geography' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_cruise_place_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_cruise_place_identity BEFORE INSERT OR UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.guard_cruise_place_identity();

CREATE FUNCTION public.guard_cruise_venue_relation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE p public.places%ROWTYPE; parent_universe uuid;
BEGIN
 IF TG_TABLE_NAME='cruise_venues' THEN
  IF TG_OP='UPDATE' AND OLD.place_id IS NOT NULL AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.ship_id IS DISTINCT FROM OLD.ship_id OR (NEW.place_id IS NOT NULL AND NEW.place_id IS DISTINCT FROM OLD.place_id)) THEN
   RAISE EXCEPTION 'Linked venue identity cannot be reassigned' USING ERRCODE='22023'; END IF;
  IF NEW.place_id IS NOT NULL THEN
   SELECT * INTO p FROM public.places WHERE id=NEW.place_id;
   IF NOT FOUND OR p.source_type IS DISTINCT FROM 'cruise_venue' OR p.source_id IS DISTINCT FROM public.cruise_venue_place_source_key(NEW.ship_id,NEW.id) THEN
    RAISE EXCEPTION 'Venue link must use its exact canonical provenance' USING ERRCODE='22023'; END IF;
  END IF;
 ELSE
  SELECT * INTO p FROM public.places WHERE id=NEW.place_id;
  IF p.source_type='cruise_venue' THEN
   SELECT s.universe_id INTO parent_universe FROM public.cruise_venues v JOIN public.cruise_ships s ON s.id=v.ship_id
    WHERE v.place_id=p.id AND p.source_id=public.cruise_venue_place_source_key(s.id,v.id);
   IF parent_universe IS NULL OR parent_universe<>NEW.universe_id THEN
    RAISE EXCEPTION 'Onboard membership must match the venue ship' USING ERRCODE='22023'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_cruise_venue_relation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_cruise_venue_relation BEFORE INSERT OR UPDATE ON public.cruise_venues FOR EACH ROW EXECUTE FUNCTION public.guard_cruise_venue_relation();
CREATE TRIGGER guard_cruise_venue_membership BEFORE INSERT OR UPDATE ON public.atlas_universe_places FOR EACH ROW EXECUTE FUNCTION public.guard_cruise_venue_relation();

CREATE FUNCTION public.cruise_venue_signal_allowed(p_place_id uuid,p_signal_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE source text; kind text; signal public.review_items%ROWTYPE; prefixes text[];
BEGIN
 SELECT source_type INTO source FROM public.places WHERE id=p_place_id;
 IF source IS DISTINCT FROM 'cruise_venue' THEN RETURN true; END IF;
 SELECT v.kind INTO kind FROM public.cruise_venues v WHERE v.place_id=p_place_id;
 SELECT * INTO signal FROM public.review_items WHERE id=p_signal_id;
 IF NOT FOUND OR signal.is_active IS DISTINCT FROM true OR coalesce(signal.signal_type NOT IN('best_for','vibe','heads_up'),true) OR signal.category='cruise_ship' OR signal.slug LIKE 'cruise\_%' ESCAPE '\' THEN RETURN false; END IF;
 prefixes:=CASE public.cruise_venue_review_category(kind)
  WHEN 'restaurant' THEN ARRAY['restaurant_','generic_'] WHEN 'cafe' THEN ARRAY['cafe_','generic_']
  WHEN 'nightlife' THEN ARRAY['bar_','generic_'] WHEN 'shopping' THEN ARRAY['shop_','laundry_','generic_']
  WHEN 'beauty' THEN ARRAY['beauty_','generic_'] WHEN 'fitness' THEN ARRAY['fitness_','generic_']
  WHEN 'entertainment' THEN ARRAY['tp_','ent_','generic_'] ELSE ARRAY['generic_'] END;
 RETURN EXISTS(SELECT 1 FROM unnest(prefixes)p WHERE left(signal.slug,length(p))=p);
END $$;
REVOKE ALL ON FUNCTION public.cruise_venue_signal_allowed(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.guard_cruise_venue_review_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE target uuid; actual_place uuid; source text;
BEGIN
 target:=NEW.place_id;
 SELECT source_type INTO source FROM public.places WHERE id=target;
 IF TG_OP='UPDATE' AND OLD.place_id IS DISTINCT FROM NEW.place_id AND (source='cruise_venue' OR EXISTS(SELECT 1 FROM public.places WHERE id=OLD.place_id AND source_type='cruise_venue')) THEN
  RAISE EXCEPTION 'Onboard review identity cannot be reassigned' USING ERRCODE='22023'; END IF;
 IF source IS DISTINCT FROM 'cruise_venue' THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='place_reviews' THEN
  -- Withdrawal/moderation preserves dated evidence; public visibility is handled
  -- separately. Never block an archival status transition because a ship retired.
  IF NEW.status IS DISTINCT FROM 'live' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND NEW.public_note IS NOT DISTINCT FROM OLD.public_note
   AND NEW.private_note_owner IS NOT DISTINCT FROM OLD.private_note_owner
   AND NEW.visited_at IS NOT DISTINCT FROM OLD.visited_at
   AND NEW.visit_date_source IS NOT DISTINCT FROM OLD.visit_date_source AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 ELSE
  SELECT place_id INTO actual_place FROM public.place_reviews WHERE id=NEW.review_id;
  IF actual_place IS DISTINCT FROM target OR (TG_OP='UPDATE' AND NEW.review_id IS DISTINCT FROM OLD.review_id) THEN
   RAISE EXCEPTION 'Venue tap must match its review' USING ERRCODE='22023'; END IF;
  IF NOT public.cruise_venue_signal_allowed(target,NEW.signal_id) THEN RAISE EXCEPTION 'Choose signals for this onboard venue, not the whole ship' USING ERRCODE='22023'; END IF;
 END IF;
 IF NOT public.cruise_place_is_public(target,true) THEN RAISE EXCEPTION 'This onboard venue is not accepting reviews' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_cruise_venue_review_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_cruise_venue_review_write BEFORE INSERT OR UPDATE ON public.place_reviews FOR EACH ROW EXECUTE FUNCTION public.guard_cruise_venue_review_write();
CREATE TRIGGER guard_cruise_venue_tap_write BEFORE INSERT OR UPDATE ON public.place_review_signal_taps FOR EACH ROW EXECUTE FUNCTION public.guard_cruise_venue_review_write();

-- Existing permissive/ownership/personal-block policies remain unchanged.
CREATE POLICY cruise_place_visibility ON public.places AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(id,false));
CREATE POLICY cruise_venue_review_visibility ON public.place_reviews AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
CREATE POLICY cruise_venue_tap_visibility ON public.place_review_signal_taps AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
CREATE POLICY cruise_venue_revision_visibility ON public.place_review_revisions AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
CREATE POLICY cruise_venue_aggregate_visibility ON public.place_signal_aggregates AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
CREATE POLICY cruise_venue_stats_visibility ON public.place_stats AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
CREATE POLICY cruise_venue_search_visibility ON public.places_search AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.cruise_place_is_public(place_id,false));
-- Preserve existing auth identities, personal blocks, dates and pagination.
CREATE OR REPLACE FUNCTION public.get_place_recent_reviews(p_place_id uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, created_at timestamp with time zone, public_note text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
 SELECT r.id,public.place_review_auth_author(r.id),r.created_at,r.public_note FROM public.place_reviews r
 WHERE r.place_id=p_place_id AND r.status='live' AND public.cruise_place_is_public(p_place_id,false) AND NOT public.place_review_author_is_blocked(r.id)
 ORDER BY r.created_at DESC,r.id DESC LIMIT greatest(1,least(coalesce(p_limit,10),50)) OFFSET greatest(0,least(coalesce(p_offset,0),1000000))
$function$;

CREATE OR REPLACE FUNCTION public.get_place_review_evidence(p_place_ids uuid[], p_cursor uuid DEFAULT NULL::uuid, p_snapshot text DEFAULT NULL::text, p_limit integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_snapshot text; v_rows jsonb; v_more boolean; v_limit integer;
BEGIN
  IF p_place_ids IS NULL OR cardinality(p_place_ids)>50 THEN RAISE EXCEPTION 'Request at most 50 places' USING ERRCODE='22023'; END IF;
  -- Preserve ordinary-place results; hidden onboard identities contribute no rows.
  p_place_ids:=ARRAY(SELECT p FROM unnest(p_place_ids)p WHERE public.cruise_place_is_public(p,false));
  v_limit:=greatest(1,least(coalesce(p_limit,500),500));
  -- Membership itself must change the snapshot: equal-count hide/restore swaps
  -- can leave max revision ID and count unchanged. Personal blocks are excluded.
  SELECT md5('review-auth-v2:'||coalesce(string_agg(r.id::text||':'||extract(epoch FROM r.updated_at)::text||':'||
    coalesce(v.id::text,'0')||':'||public.place_review_author_key(r.id),'|' ORDER BY r.id),'')) INTO v_snapshot
  FROM public.place_reviews r
  LEFT JOIN LATERAL(SELECT id FROM public.place_review_revisions WHERE review_id=r.id AND place_id=r.place_id ORDER BY id DESC LIMIT 1)v ON true
  WHERE r.place_id=ANY(p_place_ids) AND r.status='live';
  -- Legacy rows have no immutable snapshot yet. Never silently mix their data
  -- with pages read before an edit/new visit committed; callers retry from page 1.
  IF p_snapshot IS NOT NULL AND p_snapshot<>v_snapshot THEN RAISE EXCEPTION 'Review information changed; reload the summary' USING ERRCODE='40001'; END IF;
  WITH candidates AS (
    SELECT r.* FROM public.place_reviews r WHERE r.place_id=ANY(p_place_ids) AND r.status='live'
      AND (p_cursor IS NULL OR r.id>p_cursor) ORDER BY r.id LIMIT v_limit+1
  ), page AS (
    SELECT r.id AS review_id,r.place_id,public.place_review_author_key(r.id) AS user_id,coalesce(v.visited_at,r.visited_at,r.created_at) AS visited_at,
      coalesce(v.date_source,r.visit_date_source) AS date_source,
      coalesce(v.signals,legacy.signals,'[]'::jsonb) AS signals
    FROM candidates r
    LEFT JOIN LATERAL(SELECT visited_at,date_source,signals FROM public.place_review_revisions WHERE review_id=r.id AND place_id=r.place_id ORDER BY id DESC LIMIT 1) v ON true
    LEFT JOIN LATERAL(
      SELECT jsonb_agg(jsonb_build_object('slug',ri.slug,'label',ri.label,
        'category',CASE ri.signal_type WHEN 'best_for' THEN 'good' WHEN 'vibe' THEN 'vibe' ELSE 'headsup' END,
        'intensity',t.intensity) ORDER BY t.signal_id) AS signals
      FROM public.place_review_signal_taps t JOIN public.review_items ri ON ri.id=t.signal_id
      WHERE t.review_id=r.id AND t.place_id=r.place_id AND v.signals IS NULL AND ri.signal_type IN ('best_for','vibe','heads_up')
    ) legacy ON true
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('review_id',review_id,'place_id',place_id,'user_id',user_id,
    'visited_at',visited_at,'date_source',date_source,'signals',signals) ORDER BY review_id),'[]'::jsonb) INTO v_rows FROM page;
  v_more:=jsonb_array_length(v_rows)>v_limit;
  IF v_more THEN v_rows:=v_rows-(jsonb_array_length(v_rows)-1); END IF;
  RETURN jsonb_build_object('visits',v_rows,'snapshot',v_snapshot,'complete',NOT v_more,
    'next_cursor',CASE WHEN v_more THEN v_rows->(jsonb_array_length(v_rows)-1)->>'review_id' ELSE NULL END);
END $function$;

CREATE OR REPLACE FUNCTION public.get_place_review_history(p_place_id uuid, p_offset integer DEFAULT 0, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
  WITH revisions AS (
    SELECT v.id::text AS id,v.review_id,public.place_review_auth_author(r.id) AS user_id,v.visited_at,v.date_source,v.recorded_at,v.public_note,v.signals,
      row_number() OVER(PARTITION BY v.review_id ORDER BY v.id)>1 AS is_edit
    FROM public.place_review_revisions v JOIN public.place_reviews r ON r.id=v.review_id AND r.status='live'
    WHERE v.place_id=p_place_id AND public.cruise_place_is_public(p_place_id,false) AND NOT public.place_review_author_is_blocked(r.id)
    UNION ALL
    SELECT 'legacy:'||r.id::text,r.id,public.place_review_auth_author(r.id),coalesce(r.visited_at,r.created_at),r.visit_date_source,r.created_at,r.public_note,
      NULL::jsonb AS signals,false
    FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.status='live' AND public.cruise_place_is_public(p_place_id,false) AND NOT public.place_review_author_is_blocked(r.id)
      AND NOT EXISTS(SELECT 1 FROM public.place_review_revisions v WHERE v.review_id=r.id AND v.place_id=r.place_id)
  ), page AS (
    SELECT * FROM revisions ORDER BY visited_at DESC,recorded_at DESC,id DESC
    LIMIT greatest(1,least(coalesce(p_limit,20),50)) OFFSET greatest(0,coalesce(p_offset,0))
  )
  SELECT jsonb_build_object('total',(SELECT count(*) FROM revisions),'reviews',coalesce((SELECT jsonb_agg(
    jsonb_build_object('id',id,'review_id',review_id,'user_id',user_id,'visited_at',visited_at,
      'date_source',date_source,'recorded_at',recorded_at,'is_edit',is_edit,'public_note',public_note,'signals',
      coalesce(signals,(SELECT jsonb_agg(jsonb_build_object('slug',ri.slug,'label',ri.label,
        'category',CASE ri.signal_type WHEN 'best_for' THEN 'good' WHEN 'vibe' THEN 'vibe' ELSE 'headsup' END,'intensity',t.intensity) ORDER BY t.signal_id)
        FROM public.place_review_signal_taps t JOIN public.review_items ri ON ri.id=t.signal_id
        WHERE t.review_id=page.review_id AND t.place_id=p_place_id AND ri.signal_type IN ('best_for','vibe','heads_up')),'[]'::jsonb))
    ORDER BY visited_at DESC,recorded_at DESC,id DESC) FROM page),'[]'::jsonb))
$function$;

CREATE OR REPLACE FUNCTION public.get_place_public_review_count(p_place_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
 SELECT count(*)::integer FROM public.place_reviews WHERE place_id=p_place_id AND status='live' AND public.cruise_place_is_public(p_place_id,false);
$function$;
NOTIFY pgrst,'reload schema';
COMMIT;
