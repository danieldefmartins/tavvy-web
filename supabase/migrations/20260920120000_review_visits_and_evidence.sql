-- PREPARED ONLY. Requires 202609080005/006/007 review migrations.
-- Adds immutable revisions and explicit new-visit/edit writes. Historical dates
-- are labeled review_created; no visit dates are invented and no history is deleted.
BEGIN;

ALTER TABLE public.place_reviews ADD COLUMN IF NOT EXISTS visited_at timestamptz;
ALTER TABLE public.place_reviews ADD COLUMN IF NOT EXISTS visit_date_source text NOT NULL DEFAULT 'review_created'
  CHECK (visit_date_source IN ('reported','review_created'));
GRANT SELECT(visited_at,visit_date_source) ON public.place_reviews TO anon,authenticated;

CREATE TABLE IF NOT EXISTS public.place_review_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.place_reviews(id) ON DELETE CASCADE,
  place_id uuid NOT NULL,
  user_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  visited_at timestamptz NOT NULL,
  date_source text NOT NULL CHECK (date_source IN ('reported','review_created')),
  public_note text,
  private_note_owner text,
  signals jsonb NOT NULL CHECK (jsonb_typeof(signals)='array')
);
CREATE INDEX IF NOT EXISTS place_review_revisions_latest ON public.place_review_revisions(place_id,review_id,id DESC);
ALTER TABLE public.place_review_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.place_review_revisions FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.place_review_write_requests (
  user_id uuid NOT NULL,
  request_key text NOT NULL,
  review_id uuid NOT NULL REFERENCES public.place_reviews(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,request_key)
);
ALTER TABLE public.place_review_write_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.place_review_write_requests FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.capture_place_review_revision(p_review_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
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
  INSERT INTO public.place_review_revisions(review_id,place_id,user_id,visited_at,date_source,public_note,private_note_owner,signals)
    VALUES(r.id,r.place_id,r.user_id,coalesce(r.visited_at,r.created_at),r.visit_date_source,r.public_note,r.private_note_owner,v_signals);
END $$;
REVOKE ALL ON FUNCTION public.capture_place_review_revision(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.capture_place_review_revision_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME='place_reviews' THEN
    PERFORM public.capture_place_review_revision(NEW.id);
  ELSE
    PERFORM public.capture_place_review_revision(CASE WHEN TG_OP='DELETE' THEN OLD.review_id ELSE NEW.review_id END);
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.capture_place_review_revision_trigger() FROM PUBLIC,anon,authenticated;
-- Deferred triggers see the transaction's complete tap set, including legacy writes.
DROP TRIGGER IF EXISTS snapshot_place_review ON public.place_reviews;
CREATE CONSTRAINT TRIGGER snapshot_place_review AFTER INSERT OR UPDATE ON public.place_reviews
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.capture_place_review_revision_trigger();
DROP TRIGGER IF EXISTS snapshot_place_review_taps ON public.place_review_signal_taps;
CREATE CONSTRAINT TRIGGER snapshot_place_review_taps AFTER INSERT OR UPDATE OR DELETE ON public.place_review_signal_taps
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.capture_place_review_revision_trigger();

-- Existing millions of reviews are read lazily. Deploy performs no full-table backfill.
-- Before a legacy client first edits taps, preserve the previous complete content.
CREATE OR REPLACE FUNCTION public.capture_legacy_review_before_taps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_review uuid;
BEGIN
  v_review:=CASE WHEN TG_OP='DELETE' THEN OLD.review_id ELSE NEW.review_id END;
  IF EXISTS(SELECT 1 FROM public.place_reviews WHERE id=v_review AND created_at<transaction_timestamp())
    AND NOT EXISTS(SELECT 1 FROM public.place_review_revisions WHERE review_id=v_review) THEN
    PERFORM public.capture_place_review_revision(v_review);
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_legacy_review_before_taps() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS snapshot_legacy_before_taps ON public.place_review_signal_taps;
CREATE TRIGGER snapshot_legacy_before_taps BEFORE INSERT OR UPDATE OR DELETE ON public.place_review_signal_taps
  FOR EACH ROW EXECUTE FUNCTION public.capture_legacy_review_before_taps();

CREATE OR REPLACE FUNCTION public.save_place_review_v2(
  p_place_identifier text, p_signals jsonb, p_mode text, p_request_key text,
  p_public_note text DEFAULT NULL, p_private_note text DEFAULT NULL,
  p_review_id uuid DEFAULT NULL, p_visited_at timestamptz DEFAULT NULL, p_source text DEFAULT 'app'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_user uuid:=auth.uid(); v_place uuid; v_review uuid; v_signal jsonb; v_signal_id uuid;
  v_payload jsonb; old_request public.place_review_write_requests%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to save your review' USING ERRCODE='42501'; END IF;
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
    IF old_request.payload<>v_payload THEN RAISE EXCEPTION 'This request key has already been used for different review content' USING ERRCODE='22023'; END IF;
    RETURN old_request.review_id;
  END IF;
  IF p_mode='edit' THEN
    SELECT id INTO v_review FROM public.place_reviews WHERE id=p_review_id AND place_id=v_place AND user_id=v_user AND status='live' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Review not found or not editable by you' USING ERRCODE='42501'; END IF;
    PERFORM public.capture_place_review_revision(v_review);
    UPDATE public.place_reviews SET public_note=p_public_note,private_note_owner=p_private_note,updated_at=now(),
      visited_at=coalesce(p_visited_at,visited_at),visit_date_source=CASE WHEN p_visited_at IS NULL THEN visit_date_source ELSE 'reported' END
      WHERE id=v_review;
    DELETE FROM public.place_review_signal_taps WHERE review_id=v_review;
  ELSE
    INSERT INTO public.place_reviews(place_id,user_id,public_note,private_note_owner,source,status,visited_at,visit_date_source)
      VALUES(v_place,v_user,p_public_note,p_private_note,CASE WHEN p_source IN ('web_app','mobile_app','app') THEN p_source ELSE 'app' END,'live',
        coalesce(p_visited_at,now()),CASE WHEN p_visited_at IS NULL THEN 'review_created' ELSE 'reported' END) RETURNING id INTO v_review;
  END IF;
  INSERT INTO public.place_review_signal_taps(review_id,place_id,signal_id,intensity)
    SELECT v_review,v_place,(value->>'signal_id')::uuid,(value->>'intensity')::smallint FROM jsonb_array_elements(p_signals);
  PERFORM public.aggregate_place_signals(ARRAY[v_place]);
  PERFORM public.capture_place_review_revision(v_review);
  INSERT INTO public.place_review_write_requests(user_id,request_key,review_id,payload) VALUES(v_user,p_request_key,v_review,v_payload);
  RETURN v_review;
END $$;
REVOKE ALL ON FUNCTION public.save_place_review_v2(text,jsonb,text,text,text,text,uuid,timestamptz,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_place_review_v2(text,jsonb,text,text,text,text,uuid,timestamptz,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_place_review_v2(p_place_id uuid)
RETURNS TABLE(id uuid,place_id uuid,user_id uuid,public_note text,private_note_owner text,
  created_at timestamptz,updated_at timestamptz,status text,source text,visited_at timestamptz,visit_date_source text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT r.id,r.place_id,r.user_id,r.public_note,r.private_note_owner,r.created_at,r.updated_at,r.status,r.source,
    coalesce(r.visited_at,r.created_at),r.visit_date_source
  FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.user_id=auth.uid() AND r.status='live'
  ORDER BY coalesce(r.visited_at,r.created_at) DESC,r.created_at DESC,r.id DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_place_review_v2(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_place_review_v2(uuid) TO authenticated;

-- Public output excludes private notes, IP/location metadata and revision internals.
-- A revision snapshot keeps pagination stable if reviews are edited while loading.
CREATE OR REPLACE FUNCTION public.get_place_review_evidence(
  p_place_ids uuid[],p_cursor uuid DEFAULT NULL,p_snapshot text DEFAULT NULL,p_limit integer DEFAULT 500
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_snapshot text; v_rows jsonb; v_more boolean; v_limit integer;
BEGIN
  IF p_place_ids IS NULL OR cardinality(p_place_ids)>50 THEN RAISE EXCEPTION 'Request at most 50 places' USING ERRCODE='22023'; END IF;
  v_limit:=greatest(1,least(coalesce(p_limit,500),500));
  SELECT md5(coalesce((SELECT max(id)::text FROM public.place_review_revisions WHERE place_id=ANY(p_place_ids)),'0')||':'||
    (SELECT count(*)::text FROM public.place_reviews WHERE place_id=ANY(p_place_ids) AND status='live')) INTO v_snapshot;
  -- Legacy rows have no immutable snapshot yet. Never silently mix their data
  -- with pages read before an edit/new visit committed; callers retry from page 1.
  IF p_snapshot IS NOT NULL AND p_snapshot<>v_snapshot THEN RAISE EXCEPTION 'Review information changed; reload the summary' USING ERRCODE='40001'; END IF;
  WITH candidates AS (
    SELECT r.* FROM public.place_reviews r WHERE r.place_id=ANY(p_place_ids) AND r.status='live'
      AND (p_cursor IS NULL OR r.id>p_cursor) ORDER BY r.id LIMIT v_limit+1
  ), page AS (
    SELECT r.id AS review_id,r.place_id,r.user_id,coalesce(v.visited_at,r.visited_at,r.created_at) AS visited_at,
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
END $$;
REVOKE ALL ON FUNCTION public.get_place_review_evidence(uuid[],uuid,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_review_evidence(uuid[],uuid,text,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_place_review_history(p_place_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  WITH revisions AS (
    SELECT v.id::text AS id,v.review_id,v.user_id,v.visited_at,v.date_source,v.recorded_at,v.public_note,v.signals,
      row_number() OVER(PARTITION BY v.review_id ORDER BY v.id)>1 AS is_edit
    FROM public.place_review_revisions v JOIN public.place_reviews r ON r.id=v.review_id AND r.status='live'
    WHERE v.place_id=p_place_id
    UNION ALL
    SELECT 'legacy:'||r.id::text,r.id,r.user_id,coalesce(r.visited_at,r.created_at),r.visit_date_source,r.created_at,r.public_note,
      NULL::jsonb AS signals,false
    FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.status='live'
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
$$;
REVOKE ALL ON FUNCTION public.get_place_review_history(uuid,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_review_history(uuid,integer,integer) TO anon,authenticated;

-- Old apps may still write rows directly. Preserve identity and validate dated
-- input at the table boundary; deferred revision triggers archive those writes.
CREATE OR REPLACE FUNCTION public.guard_place_review_dates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF TG_OP='UPDATE' AND auth.uid() IS NOT NULL AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'The original review date cannot be changed' USING ERRCODE='42501'; END IF;
  IF NEW.visited_at IS NOT NULL AND (NOT isfinite(NEW.visited_at) OR NEW.visited_at>now() OR NEW.visited_at<'1900-01-01'::timestamptz) THEN
    RAISE EXCEPTION 'Choose a valid visit date that is not in the future' USING ERRCODE='22023'; END IF;
  IF TG_OP='UPDATE' THEN PERFORM public.capture_place_review_revision(OLD.id); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_place_review_dates ON public.place_reviews;
CREATE TRIGGER guard_place_review_dates BEFORE INSERT OR UPDATE ON public.place_reviews
  FOR EACH ROW EXECUTE FUNCTION public.guard_place_review_dates();

COMMIT;
