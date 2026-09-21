-- Verified owners manage public identity/address and an explicitly chosen map pin.
CREATE OR REPLACE FUNCTION public.get_restaurant_owner_profile(p_place_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'Verified ownership required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT jsonb_build_object('name',name,'street',coalesce(street,''),'city',coalesce(city,''),'region',coalesce(region,''),'postcode',coalesce(postcode,''),'country',coalesce(country,''),'cuisine',coalesce(tavvy_subcategory,''),'latitude',latitude,'longitude',longitude) FROM public.places WHERE id=p_place_id);
END $$;
CREATE OR REPLACE FUNCTION public.save_restaurant_owner_profile(p_place_id uuid,p_profile jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE k text; v text; lat double precision; lng double precision; before_row public.places;
BEGIN
 IF NOT public.has_verified_restaurant_claim(p_place_id) THEN RAISE EXCEPTION 'Verified ownership required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_profile) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid restaurant profile' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['name','street','city','region','postcode','country','cuisine'] LOOP
  v:=p_profile->>k;
  IF jsonb_typeof(p_profile->k) IS DISTINCT FROM 'string' OR v ~ '[[:cntrl:]]' OR length(v)>(CASE WHEN k='street' THEN 300 WHEN k='postcode' THEN 20 ELSE 120 END) THEN RAISE EXCEPTION 'Invalid %',k USING ERRCODE='22023'; END IF;
 END LOOP;
 IF length(btrim(p_profile->>'name'))<2 THEN RAISE EXCEPTION 'Enter the restaurant name' USING ERRCODE='22023'; END IF;
 IF (p_profile->'latitude' IS NOT NULL AND p_profile->'latitude'<>'null'::jsonb AND jsonb_typeof(p_profile->'latitude')<>'number') OR (p_profile->'longitude' IS NOT NULL AND p_profile->'longitude'<>'null'::jsonb AND jsonb_typeof(p_profile->'longitude')<>'number') THEN RAISE EXCEPTION 'Invalid map pin' USING ERRCODE='22023'; END IF;
 lat:=(p_profile->>'latitude')::double precision; lng:=(p_profile->>'longitude')::double precision;
 IF (lat IS NULL)<>(lng IS NULL) OR lat NOT BETWEEN -90 AND 90 OR lng NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'Invalid map pin' USING ERRCODE='22023'; END IF;
 SELECT * INTO before_row FROM public.places WHERE id=p_place_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Restaurant unavailable' USING ERRCODE='22023'; END IF;
 -- An address change must not silently retain the previous location.
 IF ROW(coalesce(before_row.street,''),coalesce(before_row.city,''),coalesce(before_row.region,''),coalesce(before_row.postcode,''),coalesce(before_row.country,'')) IS DISTINCT FROM ROW(btrim(p_profile->>'street'),btrim(p_profile->>'city'),btrim(p_profile->>'region'),btrim(p_profile->>'postcode'),btrim(p_profile->>'country'))
 AND lat IS NOT DISTINCT FROM before_row.latitude AND lng IS NOT DISTINCT FROM before_row.longitude AND coalesce((p_profile->>'confirmLocation')::boolean,false) IS NOT TRUE THEN lat:=NULL;lng:=NULL; END IF;
 UPDATE public.places SET name=btrim(p_profile->>'name'),street=nullif(btrim(p_profile->>'street'),''),city=nullif(btrim(p_profile->>'city'),''),region=nullif(btrim(p_profile->>'region'),''),postcode=nullif(btrim(p_profile->>'postcode'),''),country=nullif(btrim(p_profile->>'country'),''),tavvy_subcategory=nullif(btrim(p_profile->>'cuisine'),''),latitude=lat,longitude=lng,location=CASE WHEN lat IS NULL THEN NULL ELSE public.st_setsrid(public.st_makepoint(lng,lat),4326)::public.geography END,updated_at=now() WHERE id=p_place_id;
 RETURN p_place_id;
END $$;
REVOKE ALL ON FUNCTION public.get_restaurant_owner_profile(uuid),public.save_restaurant_owner_profile(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_restaurant_owner_profile(uuid),public.save_restaurant_owner_profile(uuid,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
