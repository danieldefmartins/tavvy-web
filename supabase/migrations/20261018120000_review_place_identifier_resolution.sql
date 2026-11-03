-- Reviews must work for every place a user can open, whatever its status.
-- The apps pass display ids such as "fsq:<id>" (unpromoted Foursquare places) or
-- "tavvy:<uuid>" (Typesense results). The previous resolver only matched bare ids, so those
-- places failed with "Place not found" even though they were on screen.
BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_review_place(p_identifier text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE v_key text; v_id uuid; v_source public.fsq_places_raw%ROWTYPE;
BEGIN
  -- Live guard (signed-in, not deleted or banned). Keep it: removing it reopens reviews for banned accounts.
  PERFORM public.require_place_review_actor();
  IF p_identifier IS NULL OR length(btrim(p_identifier)) = 0 OR length(p_identifier) > 500 THEN
    RAISE EXCEPTION 'Invalid place identifier' USING ERRCODE='22023';
  END IF;
  -- Strip the display prefix so every id shape resolves through the same lookups.
  v_key := btrim(regexp_replace(btrim(p_identifier), '^(fsq|tavvy):', '', 'i'));
  IF length(v_key) = 0 THEN RAISE EXCEPTION 'Invalid place identifier' USING ERRCODE='22023'; END IF;

  IF v_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_id FROM public.places WHERE id = v_key::uuid;
    IF FOUND THEN RETURN v_id; END IF;
  END IF;

  -- Any canonical row for this source id is the same place, whatever its status.
  -- Prefer the Foursquare-sourced row, then the oldest, so the choice is deterministic.
  SELECT id INTO v_id FROM public.places WHERE source_id = v_key
    ORDER BY (source_type = 'fsq') DESC, created_at ASC NULLS LAST, id LIMIT 1;
  IF FOUND THEN RETURN v_id; END IF;

  SELECT * INTO v_source FROM public.fsq_places_raw WHERE fsq_place_id = v_key LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'We could not find this place. Go back, open it from search and try again.' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.places(source_type, source_id, name, street, city, region, country,
    postcode, latitude, longitude, location, phone, website, email)
  VALUES ('fsq', v_source.fsq_place_id, v_source.name, v_source.address, v_source.locality,
    v_source.region, v_source.country, v_source.postcode, v_source.latitude, v_source.longitude,
    CASE WHEN v_source.latitude BETWEEN -90 AND 90 AND v_source.longitude BETWEEN -180 AND 180 THEN public.st_setsrid(public.st_makepoint(v_source.longitude,v_source.latitude),4326)::public.geography ELSE NULL END,
    v_source.tel, v_source.website, v_source.email)
  ON CONFLICT (source_type, source_id) WHERE source_type IS NOT NULL AND source_id IS NOT NULL
  DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO STRICT v_id FROM public.places WHERE source_type = 'fsq' AND source_id = v_key;
  END IF;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_review_place(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_review_place(text) TO authenticated;

COMMIT;
