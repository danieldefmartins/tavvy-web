BEGIN;
-- PREPARED ONLY. No row backfill, identity guessing or legacy user creation.
-- This migration must run in a reviewed outer transaction with exact metadata/body preconditions.
ALTER TABLE public.place_reviews ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE NO ACTION;
ALTER TABLE public.place_reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.place_reviews ADD CONSTRAINT place_reviews_actor_present CHECK(num_nonnulls(user_id,auth_user_id)=1) NOT VALID;
ALTER TABLE public.place_review_revisions ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE NO ACTION;
-- These IDs are server-written Auth actors already; NOT VALID preserves old rows without assuming their identity.
ALTER TABLE public.place_review_write_requests ADD CONSTRAINT place_review_requests_auth_actor_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE NO ACTION NOT VALID;
-- Ledger lookup uses its existing (user_id,request_key) PK.
-- One partial index scans existing reviews but indexes only new non-null Auth actors; no row rewrite.
CREATE INDEX place_reviews_auth_actor_idx ON public.place_reviews(auth_user_id,created_at DESC) WHERE auth_user_id IS NOT NULL;
CREATE TABLE public.legacy_review_author_blocks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 legacy_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(blocker_id,legacy_user_id)
);
ALTER TABLE public.legacy_review_author_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legacy_review_author_blocks FROM PUBLIC,anon,authenticated;
COMMENT ON TABLE public.legacy_review_author_blocks IS 'Private personal blocks for unresolved legacy review authors. Never interprets a legacy ID as an Auth ID.';

CREATE FUNCTION public.require_place_review_actor() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=now())) THEN
  RAISE EXCEPTION 'Sign in with an active account to save your review' USING ERRCODE='42501'; END IF;
 RETURN actor;
END $$;
REVOKE ALL ON FUNCTION public.require_place_review_actor() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.place_review_auth_author(p_review_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT CASE WHEN r.auth_user_id IS NOT NULL THEN r.auth_user_id
  -- This private ledger was written by v2 with auth.uid(), not by public clients.
  -- Matching legacy UUID alone is never accepted as ownership proof.
  WHEN EXISTS(SELECT 1 FROM public.place_review_write_requests q JOIN auth.users u ON u.id=q.user_id
    WHERE q.user_id=r.user_id AND q.review_id=r.id AND q.payload->>'place'=r.place_id::text
    AND q.payload->>'mode' IN('new_visit','edit')) THEN r.user_id ELSE NULL END
 FROM public.place_reviews r WHERE r.id=p_review_id
$$;
REVOKE ALL ON FUNCTION public.place_review_auth_author(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.owns_place_review(p_review_id uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=public.require_place_review_actor();
BEGIN RETURN public.place_review_auth_author(p_review_id)=actor; END $$;
REVOKE ALL ON FUNCTION public.owns_place_review(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owns_place_review(uuid) TO authenticated;

CREATE FUNCTION public.place_review_author_key(p_review_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT CASE WHEN public.place_review_auth_author(r.id) IS NOT NULL THEN 'auth:'||md5(public.place_review_auth_author(r.id)::text)
 WHEN r.user_id IS NOT NULL THEN 'legacy:'||md5(r.user_id::text) ELSE 'review:'||r.id::text END
 FROM public.place_reviews r WHERE r.id=p_review_id
$$;
REVOKE ALL ON FUNCTION public.place_review_author_key(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.place_review_author_is_blocked(p_review_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.uid() IS NOT NULL AND coalesce((SELECT
  CASE WHEN public.place_review_auth_author(r.id) IS NOT NULL THEN public.content_author_is_blocked(public.place_review_auth_author(r.id))
  ELSE EXISTS(SELECT 1 FROM public.legacy_review_author_blocks b WHERE b.blocker_id=auth.uid() AND b.legacy_user_id=r.user_id) END
 FROM public.place_reviews r WHERE r.id=p_review_id),false)
$$;
REVOKE ALL ON FUNCTION public.place_review_author_is_blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_review_author_is_blocked(uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.resolve_review_place(p_identifier text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_id uuid; v_source public.fsq_places_raw%ROWTYPE;
BEGIN
  PERFORM public.require_place_review_actor();
  IF p_identifier IS NULL OR length(btrim(p_identifier)) = 0 OR length(p_identifier) > 500 THEN
    RAISE EXCEPTION 'Invalid place identifier' USING ERRCODE='22023';
  END IF;
  IF p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_id FROM public.places WHERE id = p_identifier::uuid;
    IF FOUND THEN RETURN v_id; END IF;
  END IF;
  -- STRICT rejects ambiguous cross-source identifiers rather than choosing a place.
  BEGIN
    SELECT id INTO STRICT v_id FROM public.places WHERE source_id = p_identifier;
    RETURN v_id;
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  BEGIN
    SELECT * INTO STRICT v_source FROM public.fsq_places_raw WHERE fsq_place_id = p_identifier;
  EXCEPTION WHEN no_data_found THEN
    RAISE EXCEPTION 'Place not found. Open a verified place listing before reviewing.' USING ERRCODE='22023';
  END;
  INSERT INTO public.places(source_type, source_id, name, street, city, region, country,
    postcode, latitude, longitude, location, phone, website, email)
  VALUES ('fsq', v_source.fsq_place_id, v_source.name, v_source.address, v_source.locality,
    v_source.region, v_source.country, v_source.postcode, v_source.latitude, v_source.longitude,
    CASE WHEN v_source.latitude BETWEEN -90 AND 90 AND v_source.longitude BETWEEN -180 AND 180 THEN public.st_setsrid(public.st_makepoint(v_source.longitude,v_source.latitude),4326)::public.geography ELSE NULL END,
    v_source.tel, v_source.website, v_source.email)
  ON CONFLICT (source_type, source_id) WHERE source_type IS NOT NULL AND source_id IS NOT NULL
  DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN SELECT id INTO STRICT v_id FROM public.places WHERE source_type='fsq' AND source_id=p_identifier; END IF;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_place_review(p_place_identifier text, p_signals jsonb, p_public_note text DEFAULT NULL::text, p_private_note text DEFAULT NULL::text, p_review_id uuid DEFAULT NULL::uuid, p_source text DEFAULT 'app'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_user uuid := auth.uid(); v_place uuid; v_review uuid; v_signal jsonb; v_signal_id uuid;
BEGIN
  v_user:=public.require_place_review_actor();
  IF p_signals IS NULL OR jsonb_typeof(p_signals) <> 'array' THEN
    RAISE EXCEPTION 'Signals must be an array' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_signals) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Select between 1 and 100 signals' USING ERRCODE='22023';
  END IF;
  FOR v_signal IN SELECT value FROM jsonb_array_elements(p_signals) LOOP
    IF jsonb_typeof(v_signal->'intensity') IS DISTINCT FROM 'number'
      OR (v_signal->>'intensity') NOT IN ('1','2','3') THEN
      RAISE EXCEPTION 'Signal intensity must be 1, 2 or 3' USING ERRCODE='22023';
    END IF;
    v_signal_id := (v_signal->>'signal_id')::uuid;
    IF NOT EXISTS (SELECT 1 FROM public.review_items WHERE id=v_signal_id AND is_active=true AND signal_type IN ('best_for','vibe','heads_up')) THEN
      RAISE EXCEPTION 'A selected signal is no longer available' USING ERRCODE='22023';
    END IF;
  END LOOP;
  IF (SELECT count(DISTINCT (value->>'signal_id')::uuid) FROM jsonb_array_elements(p_signals)) <> jsonb_array_length(p_signals) THEN
    RAISE EXCEPTION 'Duplicate signal' USING ERRCODE='22023';
  END IF;
  IF length(COALESCE(p_public_note,'')) > 4000 OR length(COALESCE(p_private_note,'')) > 4000 THEN
    RAISE EXCEPTION 'Review notes must be 4000 characters or fewer' USING ERRCODE='22023';
  END IF;
  v_place := public.resolve_review_place(p_place_identifier);
  -- Serialize per-place writes so aggregate rebuild and repeat submits cannot race.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_place::text, 9283));
  IF p_review_id IS NOT NULL THEN
    SELECT id INTO v_review FROM public.place_reviews
      WHERE id=p_review_id AND place_id=v_place AND public.owns_place_review(id) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Review not found or not owned by you' USING ERRCODE='42501'; END IF;
  ELSE
    SELECT id INTO v_review FROM public.place_reviews WHERE place_id=v_place AND public.owns_place_review(id)
      ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
  END IF;
  IF v_review IS NULL THEN
    INSERT INTO public.place_reviews(place_id,auth_user_id,public_note,private_note_owner,source,status)
    VALUES(v_place,v_user,p_public_note,p_private_note,
      CASE WHEN p_source IN ('web_app','mobile_app','app') THEN p_source ELSE 'app' END,'live') RETURNING id INTO v_review;
  ELSE
    UPDATE public.place_reviews SET public_note=p_public_note, private_note_owner=p_private_note,
      updated_at=now() WHERE id=v_review;
    DELETE FROM public.place_review_signal_taps WHERE review_id=v_review;
  END IF;
  INSERT INTO public.place_review_signal_taps(review_id,place_id,signal_id,intensity)
  SELECT v_review,v_place,(value->>'signal_id')::uuid,(value->>'intensity')::smallint FROM jsonb_array_elements(p_signals);
  PERFORM public.aggregate_place_signals(ARRAY[v_place]);
  RETURN v_review;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_place_review_v2(p_place_identifier text, p_signals jsonb, p_mode text, p_request_key text, p_public_note text DEFAULT NULL::text, p_private_note text DEFAULT NULL::text, p_review_id uuid DEFAULT NULL::uuid, p_visited_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_source text DEFAULT 'app'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_user uuid:=auth.uid(); v_place uuid; v_review uuid; v_signal jsonb; v_signal_id uuid;
  v_payload jsonb; old_request public.place_review_write_requests%ROWTYPE;
BEGIN
  v_user:=public.require_place_review_actor();
  IF p_mode IS NULL OR p_mode NOT IN ('new_visit','edit') OR (p_mode='edit' AND p_review_id IS NULL)
    OR (p_mode='new_visit' AND p_review_id IS NOT NULL) THEN RAISE EXCEPTION 'Choose a new visit or an existing review to edit' USING ERRCODE='22023'; END IF;
  IF p_request_key IS NULL OR length(p_request_key) NOT BETWEEN 8 AND 128 THEN RAISE EXCEPTION 'A review request key is required' USING ERRCODE='22023'; END IF;
  IF p_visited_at IS NOT NULL AND (NOT isfinite(p_visited_at) OR p_visited_at>now() OR p_visited_at<'1900-01-01'::timestamptz) THEN
    RAISE EXCEPTION 'Choose a valid visit date that is not in the future' USING ERRCODE='22023'; END IF;
  IF p_signals IS NULL OR jsonb_typeof(p_signals)<>'array' OR jsonb_array_length(p_signals) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Select between 1 and 100 signals' USING ERRCODE='22023'; END IF;
  FOR v_signal IN SELECT value FROM jsonb_array_elements(p_signals) LOOP
    IF jsonb_typeof(v_signal->'intensity') IS DISTINCT FROM 'number' OR (v_signal->>'intensity') NOT IN ('1','2','3') THEN
      RAISE EXCEPTION 'Signal intensity must be 1, 2 or 3' USING ERRCODE='22023'; END IF;
    v_signal_id:=(v_signal->>'signal_id')::uuid;
    IF NOT EXISTS(SELECT 1 FROM public.review_items WHERE id=v_signal_id AND is_active=true AND signal_type IN ('best_for','vibe','heads_up')) THEN
      RAISE EXCEPTION 'A selected signal is no longer available' USING ERRCODE='22023'; END IF;
  END LOOP;
  IF (SELECT count(DISTINCT (value->>'signal_id')::uuid) FROM jsonb_array_elements(p_signals))<>jsonb_array_length(p_signals) THEN
    RAISE EXCEPTION 'Duplicate signal' USING ERRCODE='22023'; END IF;
  IF length(coalesce(p_public_note,''))>4000 OR length(coalesce(p_private_note,''))>4000 THEN
    RAISE EXCEPTION 'Review notes must be 4000 characters or fewer' USING ERRCODE='22023'; END IF;
  v_place:=public.resolve_review_place(p_place_identifier);
  PERFORM pg_advisory_xact_lock(hashtextextended(v_place::text,9283));
  -- Serialize a user's request across places as well as per-place review writes.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text||p_request_key,9284));
  v_payload:=jsonb_build_object('place',v_place,'signals',p_signals,'mode',p_mode,'review',p_review_id,
    'visited_at',p_visited_at,'public_note',p_public_note,'private_note',p_private_note);
  SELECT * INTO old_request FROM public.place_review_write_requests WHERE user_id=v_user AND request_key=p_request_key;
  IF FOUND THEN
    IF NOT public.owns_place_review(old_request.review_id) THEN RAISE EXCEPTION 'Review not owned by you' USING ERRCODE='42501'; END IF;
    IF old_request.payload<>v_payload THEN RAISE EXCEPTION 'This request key has already been used for different review content' USING ERRCODE='22023'; END IF;
    RETURN old_request.review_id;
  END IF;
  IF p_mode='edit' THEN
    SELECT id INTO v_review FROM public.place_reviews WHERE id=p_review_id AND place_id=v_place AND public.owns_place_review(id) AND status='live' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Review not found or not editable by you' USING ERRCODE='42501'; END IF;
    PERFORM public.capture_place_review_revision(v_review);
    UPDATE public.place_reviews SET public_note=p_public_note,private_note_owner=p_private_note,updated_at=now(),
      visited_at=coalesce(p_visited_at,visited_at),visit_date_source=CASE WHEN p_visited_at IS NULL THEN visit_date_source ELSE 'reported' END
      WHERE id=v_review;
    DELETE FROM public.place_review_signal_taps WHERE review_id=v_review;
  ELSE
    INSERT INTO public.place_reviews(place_id,auth_user_id,public_note,private_note_owner,source,status,visited_at,visit_date_source)
      VALUES(v_place,v_user,p_public_note,p_private_note,CASE WHEN p_source IN ('web_app','mobile_app','app') THEN p_source ELSE 'app' END,'live',
        coalesce(p_visited_at,now()),CASE WHEN p_visited_at IS NULL THEN 'review_created' ELSE 'reported' END) RETURNING id INTO v_review;
  END IF;
  INSERT INTO public.place_review_signal_taps(review_id,place_id,signal_id,intensity)
    SELECT v_review,v_place,(value->>'signal_id')::uuid,(value->>'intensity')::smallint FROM jsonb_array_elements(p_signals);
  PERFORM public.aggregate_place_signals(ARRAY[v_place]);
  PERFORM public.capture_place_review_revision(v_review);
  INSERT INTO public.place_review_write_requests(user_id,request_key,review_id,payload) VALUES(v_user,p_request_key,v_review,v_payload);
  RETURN v_review;
END $function$;

CREATE OR REPLACE FUNCTION public.update_place_stats()
 RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF NEW.place_id IS NOT NULL THEN
    INSERT INTO public.place_stats(place_id,total_reviews,last_review_at,updated_at)
    VALUES(NEW.place_id,1,NEW.created_at,now()) ON CONFLICT(place_id) DO UPDATE SET
      total_reviews=public.place_stats.total_reviews+1,last_review_at=NEW.created_at,updated_at=now();
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_place_stats() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.capture_place_review_revision(p_review_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE r public.place_reviews%ROWTYPE; v_signals jsonb; previous public.place_review_revisions%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.place_reviews WHERE id=p_review_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('slug',ri.slug,'label',ri.label,
    'category',CASE ri.signal_type WHEN 'best_for' THEN 'good' WHEN 'vibe' THEN 'vibe' ELSE 'headsup' END,
    'intensity',t.intensity) ORDER BY t.signal_id),'[]'::jsonb) INTO v_signals
  FROM public.place_review_signal_taps t JOIN public.review_items ri ON ri.id=t.signal_id
  WHERE t.review_id=r.id AND t.place_id=r.place_id AND ri.signal_type IN ('best_for','vibe','heads_up');
  IF v_signals='[]'::jsonb AND r.public_note IS NULL THEN RETURN; END IF;
  SELECT * INTO previous FROM public.place_review_revisions WHERE review_id=r.id ORDER BY id DESC LIMIT 1;
  IF FOUND AND previous.signals=v_signals AND previous.public_note IS NOT DISTINCT FROM r.public_note
    AND previous.private_note_owner IS NOT DISTINCT FROM r.private_note_owner
    AND previous.visited_at=coalesce(r.visited_at,r.created_at) AND previous.date_source=r.visit_date_source THEN RETURN; END IF;
  INSERT INTO public.place_review_revisions(review_id,place_id,user_id,auth_user_id,visited_at,date_source,public_note,private_note_owner,signals)
    VALUES(r.id,r.place_id,r.user_id,public.place_review_auth_author(r.id),coalesce(r.visited_at,r.created_at),r.visit_date_source,r.public_note,r.private_note_owner,v_signals);
END $function$;

CREATE OR REPLACE FUNCTION public.get_my_place_review(p_place_id uuid)
 RETURNS TABLE(id uuid, place_id uuid, user_id uuid, public_note text, private_note_owner text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, source text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
  SELECT r.id,r.place_id,public.place_review_auth_author(r.id),r.public_note,r.private_note_owner,r.created_at,r.updated_at,r.status,r.source
  FROM public.place_reviews r WHERE r.place_id=p_place_id AND public.owns_place_review(r.id)
  ORDER BY r.created_at DESC,r.id DESC LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.get_my_place_review_v2(p_place_id uuid)
 RETURNS TABLE(id uuid, place_id uuid, user_id uuid, public_note text, private_note_owner text, created_at timestamp with time zone, updated_at timestamp with time zone, status text, source text, visited_at timestamp with time zone, visit_date_source text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
  SELECT r.id,r.place_id,public.place_review_auth_author(r.id),r.public_note,r.private_note_owner,r.created_at,r.updated_at,r.status,r.source,
    coalesce(r.visited_at,r.created_at),r.visit_date_source
  FROM public.place_reviews r WHERE r.place_id=p_place_id AND public.owns_place_review(r.id) AND r.status='live'
  ORDER BY coalesce(r.visited_at,r.created_at) DESC,r.created_at DESC,r.id DESC LIMIT 1
$function$;

CREATE FUNCTION public.guard_place_review_actor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
 IF auth.role()='authenticated' THEN
  actor:=public.require_place_review_actor();
  IF TG_OP='INSERT' THEN
   IF(NEW.auth_user_id IS NOT NULL AND NEW.auth_user_id<>actor) OR(NEW.user_id IS NOT NULL AND NEW.user_id<>actor) THEN
    RAISE EXCEPTION 'Review author must be your signed-in account' USING ERRCODE='42501'; END IF;
   -- Compatibility for old direct clients sending user_id=auth.uid(): bind the
   -- NEW record to the actual Auth actor; never create or claim a legacy user.
   NEW.auth_user_id:=actor; NEW.user_id:=NULL;
  ELSE
   IF NOT coalesce(public.owns_place_review(OLD.id),false) THEN RAISE EXCEPTION 'Review not owned by you' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_place_review_actor() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_place_review_actor BEFORE INSERT OR UPDATE OR DELETE ON public.place_reviews FOR EACH ROW EXECUTE FUNCTION public.guard_place_review_actor();

CREATE OR REPLACE FUNCTION public.guard_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF auth.role()='authenticated' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
  OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id OR NEW.place_id IS DISTINCT FROM OLD.place_id) THEN
  RAISE EXCEPTION 'Review identity cannot be changed' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;

-- Replace every currently deployed permissive identity check; retain public reads and canonical integrity.
DROP POLICY "Authenticated users can insert reviews" ON public.place_reviews;
DROP POLICY "Users can create their own reviews" ON public.place_reviews;
DROP POLICY "Users can delete own reviews" ON public.place_reviews;
DROP POLICY "Users can delete their own reviews" ON public.place_reviews;
DROP POLICY "Users can update own reviews" ON public.place_reviews;
DROP POLICY "Users can update their own reviews" ON public.place_reviews;
CREATE POLICY review_auth_insert ON public.place_reviews FOR INSERT TO authenticated WITH CHECK(auth_user_id=auth.uid() AND user_id IS NULL);
CREATE POLICY review_auth_update ON public.place_reviews FOR UPDATE TO authenticated USING(public.owns_place_review(id)) WITH CHECK(public.owns_place_review(id));
CREATE POLICY review_auth_delete ON public.place_reviews FOR DELETE TO authenticated USING(public.owns_place_review(id));
CREATE POLICY review_auth_insert_guard ON public.place_reviews AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(auth_user_id=auth.uid() AND user_id IS NULL);
CREATE POLICY review_auth_update_guard ON public.place_reviews AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.owns_place_review(id)) WITH CHECK(public.owns_place_review(id));
CREATE POLICY review_auth_delete_guard ON public.place_reviews AS RESTRICTIVE FOR DELETE TO authenticated USING(public.owns_place_review(id));
DROP POLICY personal_review_blocks ON public.place_reviews;
CREATE POLICY personal_review_blocks ON public.place_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.place_review_author_is_blocked(id));
DROP POLICY "auth insert own review" ON public.place_review_signal_taps;
DROP POLICY "auth delete own review" ON public.place_review_signal_taps;
DROP POLICY tap_review_place_integrity ON public.place_review_signal_taps;
CREATE POLICY "auth insert own review" ON public.place_review_signal_taps FOR INSERT TO authenticated WITH CHECK(public.owns_place_review(review_id));
CREATE POLICY "auth delete own review" ON public.place_review_signal_taps FOR DELETE TO authenticated USING(public.owns_place_review(review_id));
CREATE POLICY tap_review_place_integrity ON public.place_review_signal_taps AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(
 EXISTS(SELECT 1 FROM public.place_reviews r WHERE r.id=review_id AND r.place_id=place_review_signal_taps.place_id AND public.owns_place_review(r.id)));
CREATE POLICY tap_auth_delete_guard ON public.place_review_signal_taps AS RESTRICTIVE FOR DELETE TO authenticated USING(public.owns_place_review(review_id));

CREATE OR REPLACE FUNCTION public.get_place_review_evidence(p_place_ids uuid[], p_cursor uuid DEFAULT NULL::uuid, p_snapshot text DEFAULT NULL::text, p_limit integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_snapshot text; v_rows jsonb; v_more boolean; v_limit integer;
BEGIN
  IF p_place_ids IS NULL OR cardinality(p_place_ids)>50 THEN RAISE EXCEPTION 'Request at most 50 places' USING ERRCODE='22023'; END IF;
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
    WHERE v.place_id=p_place_id AND NOT public.place_review_author_is_blocked(r.id)
    UNION ALL
    SELECT 'legacy:'||r.id::text,r.id,public.place_review_auth_author(r.id),coalesce(r.visited_at,r.created_at),r.visit_date_source,r.created_at,r.public_note,
      NULL::jsonb AS signals,false
    FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.status='live' AND NOT public.place_review_author_is_blocked(r.id)
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

CREATE OR REPLACE FUNCTION public.resolve_safety_content(p_kind text, p_content_id uuid)
 RETURNS TABLE(author_id uuid, place_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF p_kind='place_review' THEN
  RETURN QUERY SELECT public.place_review_auth_author(r.id),r.place_id FROM public.place_reviews r WHERE r.id=p_content_id AND r.status='live';
 ELSIF p_kind='story' THEN
  RETURN QUERY SELECT s.user_id,s.place_id FROM public.place_stories s WHERE s.id=p_content_id AND s.status='active' AND(s.expires_at>now() OR(s.story_kind='owner_highlight' AND s.is_permanent));
 ELSIF p_kind='universe_review' THEN
  RETURN QUERY SELECT r.user_id,NULL::uuid FROM public.universe_reviews r JOIN public.atlas_universes u ON u.id=r.universe_id WHERE r.id=p_content_id AND u.status='published';
 ELSIF p_kind='event_review' THEN
  RETURN QUERY SELECT r.user_id,NULL::uuid FROM public.event_reviews r WHERE r.id=p_content_id AND r.status='live';
 ELSIF p_kind='civic_question' THEN
  RETURN QUERY SELECT q.user_id,NULL::uuid FROM public.civic_questions q JOIN public.digital_cards c ON c.id=q.card_id WHERE q.id=p_content_id AND q.is_visible=true AND q.status='approved' AND c.is_published=true AND c.is_active=true;
 ELSIF p_kind='cruise_visit' THEN
  RETURN QUERY SELECT v.user_id,NULL::uuid FROM public.universe_visits v WHERE v.id=p_content_id AND v.status='live' AND public.cruise_universe_is_public(v.universe_id) AND public.community_content_visible('cruise_visit',v.id);
 ELSIF p_kind='place_photo' THEN
  RETURN QUERY SELECT coalesce(p.user_id,p.uploaded_by),p.place_id FROM public.place_photos p WHERE p.id=p_content_id AND p.status='live' AND public.community_content_visible('place_photo',p.id);
 ELSIF p_kind='ecard_endorsement' THEN
  RETURN QUERY SELECT e.endorser_id,NULL::uuid FROM public.ecard_endorsements e JOIN public.digital_cards c ON c.id=e.card_id WHERE e.id=p_content_id AND e.status IN('live','approved') AND c.is_published AND c.is_active AND public.community_content_visible('ecard',c.id) AND public.community_content_visible('ecard_endorsement',e.id);
 ELSIF p_kind='ecard' THEN
  RETURN QUERY SELECT c.user_id,NULL::uuid FROM public.digital_cards c WHERE c.id=p_content_id AND c.is_published AND c.is_active AND public.community_content_visible('ecard',c.id);
 ELSE RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='22023';
 END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.block_content_author_v1(p_kind text, p_content_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_uid uuid:=public.require_content_safety_actor();v_author uuid;v_block uuid;v_legacy uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';END IF;
 SELECT author_id INTO v_author FROM public.resolve_safety_content(p_kind,p_content_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 IF v_author IS NULL AND p_kind='place_review' THEN
  SELECT user_id INTO v_legacy FROM public.place_reviews WHERE id=p_content_id AND status='live';
  IF v_legacy IS NOT NULL THEN
   INSERT INTO public.legacy_review_author_blocks(blocker_id,legacy_user_id) VALUES(v_uid,v_legacy)
    ON CONFLICT(blocker_id,legacy_user_id) DO UPDATE SET blocker_id=EXCLUDED.blocker_id RETURNING id INTO v_block;
   RETURN jsonb_build_object('blocked',true,'blockId',v_block);
  END IF;
 END IF;
 IF v_author IS NULL THEN RAISE EXCEPTION 'SAFETY_AUTHOR_UNAVAILABLE' USING ERRCODE='22023';END IF;
 IF v_author=v_uid THEN RAISE EXCEPTION 'SAFETY_SELF_BLOCK' USING ERRCODE='22023';END IF;
 INSERT INTO public.blocked_users(blocker_id,blocked_id) VALUES(v_uid,v_author)
  ON CONFLICT(blocker_id,blocked_id) DO UPDATE SET blocker_id=EXCLUDED.blocker_id RETURNING id INTO v_block;
 RETURN jsonb_build_object('blocked',true,'blockId',v_block);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_content_blocks_v1() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM public.require_content_safety_actor();
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',b.id,'displayName',b.display_name,'createdAt',b.created_at) ORDER BY b.created_at DESC,b.id),'[]'::jsonb)
 FROM(
  SELECT b.id,coalesce(nullif(p.display_name,''),nullif(p.username,''),'Tavvy member') AS display_name,b.created_at
  FROM public.blocked_users b LEFT JOIN LATERAL(SELECT display_name,username FROM public.profiles WHERE user_id=b.blocked_id LIMIT 1)p ON true WHERE b.blocker_id=auth.uid()
  UNION ALL SELECT b.id,'Tavvy member'::text,b.created_at FROM public.legacy_review_author_blocks b WHERE b.blocker_id=auth.uid()
 )b);
END $$;
CREATE OR REPLACE FUNCTION public.unblock_content_author_v1(p_block_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM public.require_content_safety_actor();
 DELETE FROM public.blocked_users WHERE id=p_block_id AND blocker_id=auth.uid();
 IF FOUND THEN RETURN true; END IF;
 DELETE FROM public.legacy_review_author_blocks WHERE id=p_block_id AND blocker_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'SAFETY_BLOCK_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 RETURN true;
END $$;

CREATE FUNCTION public.get_place_recent_reviews(p_place_id uuid,p_limit integer DEFAULT 10,p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,user_id uuid,created_at timestamptz,public_note text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT r.id,public.place_review_auth_author(r.id),r.created_at,r.public_note FROM public.place_reviews r
 WHERE r.place_id=p_place_id AND r.status='live' AND NOT public.place_review_author_is_blocked(r.id)
 ORDER BY r.created_at DESC,r.id DESC LIMIT greatest(1,least(coalesce(p_limit,10),50)) OFFSET greatest(0,least(coalesce(p_offset,0),1000000))
$$;
REVOKE ALL ON FUNCTION public.get_place_recent_reviews(uuid,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_recent_reviews(uuid,integer,integer) TO anon,authenticated;

CREATE FUNCTION public.get_my_place_review_count() RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=public.require_place_review_actor(); result integer;
BEGIN
 SELECT count(*)::integer INTO result FROM public.place_reviews r
 WHERE r.auth_user_id=actor OR(r.user_id=actor AND public.place_review_auth_author(r.id)=actor);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_my_place_review_count() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_place_review_count() TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
