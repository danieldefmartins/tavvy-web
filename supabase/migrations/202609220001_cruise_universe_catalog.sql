-- Cruise catalog. No fleet records or publication is performed by this migration.
BEGIN;
ALTER TABLE public.atlas_universes ADD COLUMN IF NOT EXISTS universe_kind text NOT NULL DEFAULT 'place_collection';
ALTER TABLE public.atlas_universes ADD CONSTRAINT atlas_universes_kind_check CHECK (universe_kind IN ('place_collection','cruise_ship'));
CREATE TABLE public.cruise_operators (
 id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
 official_url text CHECK (official_url IS NULL OR official_url ~ '^https://[^[:space:]@]+$')
);
CREATE TABLE public.cruise_ships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 universe_id uuid NOT NULL UNIQUE REFERENCES public.atlas_universes(id) ON DELETE RESTRICT,
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
 operator_id text NOT NULL REFERENCES public.cruise_operators(id),
 kind text NOT NULL CHECK (kind IN ('ocean','river','expedition')),
 operating_status text NOT NULL DEFAULT 'unknown' CHECK (operating_status IN ('operating','announced','laid_up','retired','unknown')),
 publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','archived')),
 overnight_public_cruise boolean NOT NULL DEFAULT false,
 identity_verified boolean NOT NULL DEFAULT false,
 status_source_ids text[] NOT NULL DEFAULT '{}',
 imo text UNIQUE CHECK (imo IS NULL OR imo ~ '^[0-9]{7}$'),
 eni text UNIQUE CHECK (eni IS NULL OR eni ~ '^[0-9]{8}$'),
 official_url text CHECK (official_url IS NULL OR official_url ~ '^https://[^[:space:]@]+$'),
 photo jsonb CHECK (photo IS NULL OR jsonb_typeof(photo)='object'),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cruise_ship_sources (
 ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 id text NOT NULL CHECK(length(id) BETWEEN 1 AND 100),
 url text NOT NULL CHECK (url ~ '^https://[^[:space:]@]+$'),
 publisher text NOT NULL CHECK(length(btrim(publisher)) BETWEEN 1 AND 200),
 checked_at date NOT NULL,
 source_type text NOT NULL CHECK(source_type IN ('operator','registry','shipyard','other')),
 PRIMARY KEY(ship_id,id)
);
CREATE TABLE public.cruise_ship_facts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 key text NOT NULL CHECK(key IN ('year_built','entered_service','last_refurbished','length_m','gross_tonnage','guests_double_occupancy','guests_lower_berths','guests_maximum','crew','decks_total','decks_passenger','restaurants','dining_outlets','cafes','bars','shops','pools','deck_plan_url','accessibility_url')),
 value jsonb,
 source_ids text[] NOT NULL DEFAULT '{}', as_of date NOT NULL,
 verification text NOT NULL DEFAULT 'unverified' CHECK(verification IN ('verified','conflicting','unverified')),
 note text CHECK(length(note)<=2000), superseded_at timestamptz,
 CHECK(value IS NULL OR jsonb_typeof(value) IN ('string','number','boolean','null'))
);
CREATE UNIQUE INDEX cruise_fact_current_verified ON public.cruise_ship_facts(ship_id,key) WHERE verification='verified' AND superseded_at IS NULL;
CREATE TABLE public.cruise_ship_name_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200), operator_name text,
 valid_from date, valid_until date, source_ids text[] NOT NULL DEFAULT '{}',
 CHECK(valid_from IS NULL OR valid_until IS NULL OR valid_until>=valid_from)
);
CREATE TABLE public.cruise_cabin_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200), description text CHECK(length(description)<=2000),
 accessible boolean, source_ids text[] NOT NULL DEFAULT '{}'
);
CREATE TABLE public.cruise_venues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
 kind text NOT NULL CHECK(kind IN ('restaurant','cafe','bar','shop','theatre','entertainment','pool','spa','fitness','kids_club','other')),
 place_id uuid UNIQUE REFERENCES public.places(id) ON DELETE SET NULL,
 description text CHECK(length(description)<=2000), deck_label text CHECK(length(deck_label)<=100),
 included boolean, availability_note text CHECK(length(availability_note)<=2000),
 source_ids text[] NOT NULL DEFAULT '{}', verification text NOT NULL DEFAULT 'unverified' CHECK(verification IN ('verified','unverified'))
);
ALTER TABLE public.cruise_venues ADD CONSTRAINT cruise_venue_ship_identity UNIQUE(id,ship_id);
CREATE TABLE public.cruise_programs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ship_id uuid NOT NULL REFERENCES public.cruise_ships(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200), kind text NOT NULL CHECK(kind IN ('show','music','enrichment','activity')),
 venue_id uuid, description text CHECK(length(description)<=2000), as_of date NOT NULL,
 availability_note text CHECK(length(availability_note)<=2000), source_ids text[] NOT NULL DEFAULT '{}',
 verification text NOT NULL DEFAULT 'unverified' CHECK(verification IN ('verified','unverified')),
 FOREIGN KEY(venue_id,ship_id) REFERENCES public.cruise_venues(id,ship_id)
);
CREATE INDEX cruise_program_ship ON public.cruise_programs(ship_id,name,id);
CREATE INDEX cruise_ship_search ON public.cruise_ships(publication_status,operating_status,kind,name,id);
CREATE INDEX cruise_venue_ship ON public.cruise_venues(ship_id,name,id);
CREATE INDEX cruise_history_ship ON public.cruise_ship_name_history(ship_id);
CREATE INDEX cruise_cabin_ship ON public.cruise_cabin_categories(ship_id);

-- Research/editorial data is service-managed. Clients have read RPCs only.
DO $body$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['cruise_operators','cruise_ships','cruise_ship_sources','cruise_ship_facts','cruise_ship_name_history','cruise_cabin_categories','cruise_venues','cruise_programs'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $body$;
CREATE FUNCTION public.cruise_has_sources(p_ship uuid,p_ids text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT coalesce(cardinality(p_ids)>0 AND NOT EXISTS(SELECT 1 FROM unnest(p_ids) x WHERE NOT EXISTS(
  SELECT 1 FROM public.cruise_ship_sources s WHERE s.ship_id=p_ship AND s.id=x AND s.checked_at<=current_date)),false);
$body$;
REVOKE ALL ON FUNCTION public.cruise_has_sources(uuid,text[]) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cruise_universe_is_public(p_universe uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT EXISTS(SELECT 1 FROM public.cruise_ships s JOIN public.atlas_universes u ON u.id=s.universe_id
 WHERE u.id=p_universe AND u.universe_kind='cruise_ship' AND u.status='published' AND s.publication_status='published'
 AND s.identity_verified AND s.overnight_public_cruise AND s.operating_status IN ('operating','announced')
 AND public.cruise_has_sources(s.id,s.status_source_ids));
$body$;
REVOKE ALL ON FUNCTION public.cruise_universe_is_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cruise_universe_is_public(uuid) TO anon,authenticated,service_role;
CREATE POLICY cruise_universe_visibility ON public.atlas_universes AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING(universe_kind<>'cruise_ship' OR public.cruise_universe_is_public(id));
CREATE FUNCTION public.cruise_universe_is_restricted(p_universe uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT EXISTS(SELECT 1 FROM public.atlas_universes WHERE id=p_universe AND universe_kind='cruise_ship') AND NOT public.cruise_universe_is_public(p_universe);
$body$;
REVOKE ALL ON FUNCTION public.cruise_universe_is_restricted(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cruise_universe_is_restricted(uuid) TO anon,authenticated,service_role;
CREATE POLICY cruise_membership_visibility ON public.atlas_universe_places AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(NOT public.cruise_universe_is_restricted(universe_id));
CREATE POLICY cruise_legacy_review_visibility ON public.universe_reviews AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(NOT public.cruise_universe_is_restricted(universe_id));

CREATE FUNCTION public.validate_cruise_ship_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $body$
BEGIN
 NEW.updated_at:=now();
 IF NEW.publication_status='published' THEN
  IF NOT NEW.identity_verified OR NOT NEW.overnight_public_cruise OR NEW.operating_status NOT IN ('operating','announced') OR NOT public.cruise_has_sources(NEW.id,NEW.status_source_ids) THEN
   RAISE EXCEPTION 'Published ships require verified overnight cruise identity, operating status and dated sources';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.atlas_universes u WHERE u.id=NEW.universe_id AND u.universe_kind='cruise_ship') THEN RAISE EXCEPTION 'Ship requires a cruise ship Universe'; END IF;
 END IF;
 RETURN NEW;
END $body$;
REVOKE ALL ON FUNCTION public.validate_cruise_ship_publication() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER cruise_ship_publication BEFORE INSERT OR UPDATE ON public.cruise_ships FOR EACH ROW EXECUTE FUNCTION public.validate_cruise_ship_publication();

CREATE FUNCTION public.get_cruise_ship_v1(p_slug text DEFAULT NULL,p_universe_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT jsonb_build_object('ship',jsonb_build_object(
 'id',s.id,'universe_id',s.universe_id,'slug',s.slug,'name',s.name,'operator_id',s.operator_id,'operator_name',o.name,
 'kind',s.kind,'operating_status',s.operating_status,'publication_status',s.publication_status,
 'overnight_public_cruise',s.overnight_public_cruise,'identity_verified',s.identity_verified,'status_source_ids',s.status_source_ids,
 'imo',s.imo,'eni',s.eni,'official_url',s.official_url,
 'photo',CASE WHEN s.photo->>'permission_verified'='true' AND s.photo->>'url' ~ '^https://[^[:space:]@]+$' AND public.cruise_has_sources(s.id,ARRAY[s.photo->>'source_id']) THEN s.photo ELSE NULL END,
 'facts',coalesce((SELECT jsonb_agg(jsonb_build_object('key',f.key,'value',f.value,'source_ids',f.source_ids,'as_of',f.as_of,'verification',f.verification,'note',f.note) ORDER BY f.key)
   FROM public.cruise_ship_facts f WHERE f.ship_id=s.id AND f.superseded_at IS NULL AND public.cruise_has_sources(s.id,f.source_ids)),'[]'::jsonb),
 'name_history',coalesce((SELECT jsonb_agg(jsonb_build_object('name',h.name,'operator_name',h.operator_name,'valid_from',h.valid_from,'valid_until',h.valid_until,'source_ids',h.source_ids) ORDER BY h.valid_from NULLS LAST,h.id)
   FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id AND public.cruise_has_sources(s.id,h.source_ids)),'[]'::jsonb),
 'cabin_categories',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description,'accessible',c.accessible,'source_ids',c.source_ids) ORDER BY c.name,c.id)
   FROM public.cruise_cabin_categories c WHERE c.ship_id=s.id AND public.cruise_has_sources(s.id,c.source_ids)),'[]'::jsonb)),
 'sources',coalesce((SELECT jsonb_agg(to_jsonb(src)-'ship_id' ORDER BY src.id) FROM public.cruise_ship_sources src WHERE src.ship_id=s.id AND src.checked_at<=current_date),'[]'::jsonb),
 'venues',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.name,v.id) FROM public.cruise_venues v WHERE v.ship_id=s.id AND v.verification='verified' AND public.cruise_has_sources(s.id,v.source_ids)),'[]'::jsonb),
 'programs',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name,p.id) FROM public.cruise_programs p WHERE p.ship_id=s.id AND p.verification='verified' AND p.as_of<=current_date AND public.cruise_has_sources(s.id,p.source_ids)),'[]'::jsonb))
 FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE ((p_slug IS NOT NULL AND s.slug=p_slug AND p_universe_id IS NULL) OR (p_universe_id IS NOT NULL AND s.universe_id=p_universe_id AND p_slug IS NULL))
 AND public.cruise_universe_is_public(s.universe_id);
$body$;
REVOKE ALL ON FUNCTION public.get_cruise_ship_v1(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_ship_v1(text,uuid) TO anon,authenticated,service_role;
CREATE FUNCTION public.search_cruise_ships_v1(p_query text DEFAULT '',p_kind text DEFAULT NULL,p_status text DEFAULT 'operating',p_offset integer DEFAULT 0,p_limit integer DEFAULT 25) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT public.get_cruise_ship_v1(s.slug,NULL) FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE public.cruise_universe_is_public(s.universe_id) AND p_status IN ('operating','announced') AND s.operating_status=p_status
 AND (p_kind IS NULL OR s.kind=p_kind)
 AND (length(btrim(coalesce(p_query,'')))=0 OR s.name ILIKE '%'||left(btrim(p_query),160)||'%' OR o.name ILIKE '%'||left(btrim(p_query),160)||'%' OR EXISTS(
 SELECT 1 FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id AND h.name ILIKE '%'||left(btrim(p_query),160)||'%' AND public.cruise_has_sources(s.id,h.source_ids)))
 ORDER BY lower(s.name),s.id OFFSET greatest(0,least(coalesce(p_offset,0),100000)) LIMIT greatest(1,least(coalesce(p_limit,25),51));
$body$;
REVOKE ALL ON FUNCTION public.search_cruise_ships_v1(text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_cruise_ships_v1(text,text,text,integer,integer) TO anon,authenticated,service_role;
COMMENT ON TABLE public.cruise_ships IS 'Stable ship identity linked to a Universe. Ports and sailings are separate. Only service-managed verified overnight public cruise ships can publish.';
COMMENT ON TABLE public.cruise_ship_facts IS 'Sourced specifications. Unknown remains null; conflicting and superseded facts never become inferred counts.';
COMMENT ON TABLE public.cruise_venues IS 'Onboard entities belong to one ship. No geographic position is stored or inferred; linked place identities use venue-specific reviews.';
COMMIT;
