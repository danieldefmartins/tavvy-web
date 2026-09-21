-- Curated recognizable ships first in the unsearched directory; all filters still precede pagination.
BEGIN;
CREATE OR REPLACE FUNCTION public.search_cruise_ships_v3(
 p_query text DEFAULT '',p_kind text DEFAULT NULL,p_status text DEFAULT 'operating',
 p_operator_id text DEFAULT NULL,p_length text DEFAULT NULL,p_year text DEFAULT NULL,
 p_audience text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25,
 p_ship_ids uuid[] DEFAULT NULL
) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT public.get_cruise_ship_v1(s.slug,NULL)
 FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE public.cruise_universe_is_public(s.universe_id)
 AND p_status IN ('operating','announced') AND s.operating_status=p_status
 AND (p_kind IS NULL OR s.kind=p_kind)
 AND (p_operator_id IS NULL OR s.operator_id=p_operator_id)
 AND (p_length IS NULL OR (p_length IN ('under150','150to250','over250') AND EXISTS (
   SELECT 1 FROM public.cruise_ship_facts f WHERE f.ship_id=s.id AND f.key='length_m'
   AND f.superseded_at IS NULL AND f.verification='verified'
   AND jsonb_typeof(f.value)='number' AND public.cruise_has_sources(s.id,f.source_ids)
   AND CASE p_length WHEN 'under150' THEN (f.value #>> '{}')::numeric<150
     WHEN '150to250' THEN (f.value #>> '{}')::numeric>=150 AND (f.value #>> '{}')::numeric<=250
     ELSE (f.value #>> '{}')::numeric>250 END)))
 AND (p_year IS NULL OR (p_year IN ('2020plus','2010s','before2010') AND EXISTS (
   SELECT 1 FROM public.cruise_ship_facts f WHERE f.ship_id=s.id AND f.key='year_built'
   AND f.superseded_at IS NULL AND f.verification='verified'
   AND jsonb_typeof(f.value)='number' AND public.cruise_has_sources(s.id,f.source_ids)
   AND CASE p_year WHEN '2020plus' THEN (f.value #>> '{}')::integer>=2020
     WHEN '2010s' THEN (f.value #>> '{}')::integer BETWEEN 2010 AND 2019
     ELSE (f.value #>> '{}')::integer<2010 END)))
 AND (p_audience IS NULL OR (p_audience IN ('family_activities','adults_only') AND EXISTS (
   SELECT 1 FROM public.cruise_operator_audience_evidence e
   WHERE e.operator_id=s.operator_id AND e.audience=p_audience
   AND e.checked_at>=current_date-interval '18 months')))
 AND (p_ship_ids IS NULL OR (cardinality(p_ship_ids) BETWEEN 1 AND 12 AND s.id=ANY(p_ship_ids)))
 AND (length(btrim(coalesce(p_query,'')))=0
   OR s.name ILIKE '%'||left(btrim(p_query),160)||'%'
   OR o.name ILIKE '%'||left(btrim(p_query),160)||'%'
   OR EXISTS (SELECT 1 FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id
     AND h.name ILIKE '%'||left(btrim(p_query),160)||'%' AND public.cruise_has_sources(s.id,h.source_ids)))
 ORDER BY CASE WHEN p_ship_ids IS NOT NULL THEN array_position(p_ship_ids,s.id) END,
   CASE WHEN p_ship_ids IS NULL AND length(btrim(coalesce(p_query,'')))=0 THEN
     CASE s.id
       WHEN 'df0fda09-7eb9-5a84-b6a0-30e309490456'::uuid THEN 1  -- Icon of the Seas
       WHEN 'e85fe7b0-e064-58fb-9551-7ebcaab0869a'::uuid THEN 2  -- MSC World America
       WHEN '2aa9e45d-8331-51ef-a800-1ba7547fa6d0'::uuid THEN 3  -- Disney Wish
       WHEN '2b39fc3d-e069-50ec-9159-30d5aeb11814'::uuid THEN 4  -- Carnival Celebration
       WHEN 'daa9d529-d06e-5d5b-8e29-8d56b5238a33'::uuid THEN 5  -- Norwegian Prima
       WHEN '655d958e-d185-53b7-a12b-b6fc54091a2c'::uuid THEN 6  -- Wonder of the Seas
       ELSE 100 END
   ELSE 100 END,
   lower(s.name),s.id
 OFFSET greatest(0,least(coalesce(p_offset,0),100000))
 LIMIT greatest(1,least(coalesce(p_limit,25),51));
$body$;
COMMENT ON FUNCTION public.search_cruise_ships_v3(text,text,text,text,text,text,text,integer,integer,uuid[]) IS 'Verified cruise facets; curated familiar ships first for the unsearched directory, with exact editorial order retained for Featured. Not a popularity claim.';
COMMIT;
