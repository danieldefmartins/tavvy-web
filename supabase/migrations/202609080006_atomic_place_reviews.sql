-- PREPARED ONLY. Apply with 005 before deploying the new review clients.
-- No existing review content is deleted or rewritten by this migration.
BEGIN;

-- The deployed review INSERT trigger used unqualified place_stats, which breaks
-- under the RPC's locked search_path. Keep its behavior with explicit schema.
CREATE OR REPLACE FUNCTION public.update_place_stats() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.place_id IS NOT NULL THEN
    INSERT INTO public.place_stats(place_id,total_reviews,last_review_at,updated_at)
    VALUES(NEW.place_id,1,NEW.created_at,now()) ON CONFLICT(place_id) DO UPDATE SET
      total_reviews=public.place_stats.total_reviews+1,last_review_at=NEW.created_at,updated_at=now();
  END IF;
  RETURN NEW;
END;
$$;

-- Qualify the canonical INSERT search-index trigger under the locked RPC path.
CREATE OR REPLACE FUNCTION public.sync_places_search()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path=pg_catalog
AS $function$
BEGIN
  INSERT INTO public.places_search (place_id, name, name_norm, city, region, category, subcategory, location, search_tsv)
  VALUES (
    NEW.id, 
    NEW.name, 
    lower(public.unaccent(COALESCE(NEW.name, ''))),
    NEW.city, 
    NEW.region, 
    NEW.tavvy_category, 
    NEW.tavvy_subcategory, 
    NEW.location,
    to_tsvector('simple', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.city, '') || ' ' || COALESCE(NEW.tavvy_category, ''))
  )
  ON CONFLICT (place_id) DO UPDATE SET
    name = EXCLUDED.name,
    name_norm = EXCLUDED.name_norm,
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    location = EXCLUDED.location,
    search_tsv = EXCLUDED.search_tsv;
  RETURN NEW;
END;
$function$;

-- Raw import provenance must be backend-owned before promotion is permitted.
-- Historical raw rows were publicly insertable: audit their provenance separately.
DROP POLICY IF EXISTS fsq_backend_insert_only ON public.fsq_places_raw;
CREATE POLICY fsq_backend_insert_only ON public.fsq_places_raw AS RESTRICTIVE
FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Narrow definer operation: source data is read from the import, never from client
-- names/addresses. Canonical author restrictions in 005 remain intact.
CREATE OR REPLACE FUNCTION public.resolve_review_place(p_identifier text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_id uuid; v_source public.fsq_places_raw%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to review a place' USING ERRCODE='42501'; END IF;
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
$$;
REVOKE ALL ON FUNCTION public.resolve_review_place(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_review_place(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_place_review(
  p_place_identifier text, p_signals jsonb, p_public_note text DEFAULT NULL,
  p_private_note text DEFAULT NULL, p_review_id uuid DEFAULT NULL, p_source text DEFAULT 'app'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_user uuid := auth.uid(); v_place uuid; v_review uuid; v_signal jsonb; v_signal_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to save your review' USING ERRCODE='42501'; END IF;
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
      WHERE id=p_review_id AND place_id=v_place AND user_id=v_user FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Review not found or not owned by you' USING ERRCODE='42501'; END IF;
  ELSE
    SELECT id INTO v_review FROM public.place_reviews WHERE place_id=v_place AND user_id=v_user
      ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
  END IF;
  IF v_review IS NULL THEN
    INSERT INTO public.place_reviews(place_id,user_id,public_note,private_note_owner,source,status)
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
$$;
REVOKE ALL ON FUNCTION public.save_place_review(text,jsonb,text,text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_place_review(text,jsonb,text,text,uuid,text) TO authenticated;

-- Rebuild removes absent signals and counts tap strength, not just selected rows.
CREATE OR REPLACE FUNCTION public.aggregate_place_signals(p_place_ids uuid[])
RETURNS integer LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.place_signal_aggregates WHERE place_id = ANY(p_place_ids);
  INSERT INTO public.place_signal_aggregates(place_id,signal_id,bucket,tap_total,review_count,last_tap_at)
  SELECT t.place_id,t.signal_id,
    CASE ri.signal_type WHEN 'best_for' THEN 'positive' WHEN 'pro_endorsement' THEN 'positive'
      WHEN 'heads_up' THEN 'negative' ELSE 'neutral' END,
    sum(t.intensity),count(DISTINCT t.review_id),max(t.created_at)
  FROM public.place_review_signal_taps t JOIN public.review_items ri ON ri.id=t.signal_id
  JOIN public.place_reviews r ON r.id=t.review_id AND r.place_id=t.place_id AND r.status='live'
  WHERE t.place_id=ANY(p_place_ids) GROUP BY t.place_id,t.signal_id,ri.signal_type;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_places_signal_counts(p_place_ids uuid[])
RETURNS TABLE(place_id uuid,signal_id uuid,tap_count bigint) LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT t.place_id,t.signal_id,sum(t.intensity)::bigint
  FROM public.place_review_signal_taps t JOIN public.place_reviews r ON r.id=t.review_id AND r.place_id=t.place_id
  WHERE t.place_id=ANY(p_place_ids) AND r.status='live' GROUP BY t.place_id,t.signal_id
$$;
-- Direct legacy writes must not attach an owned review's taps to another place.
DROP POLICY IF EXISTS tap_review_place_integrity ON public.place_review_signal_taps;
CREATE POLICY tap_review_place_integrity ON public.place_review_signal_taps AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM public.place_reviews r WHERE r.id=review_id AND r.place_id=place_review_signal_taps.place_id AND r.user_id=auth.uid()
));
DROP POLICY IF EXISTS review_canonical_place_integrity ON public.place_reviews;
CREATE POLICY review_canonical_place_integrity ON public.place_reviews AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.places p WHERE p.id=place_id));
CREATE OR REPLACE FUNCTION public.guard_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF auth.role()='authenticated' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.place_id IS DISTINCT FROM OLD.place_id) THEN
    RAISE EXCEPTION 'Review identity cannot be changed' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_review_identity_before_update ON public.place_reviews;
CREATE TRIGGER guard_review_identity_before_update BEFORE UPDATE ON public.place_reviews
FOR EACH ROW EXECUTE FUNCTION public.guard_review_identity();
COMMIT;
