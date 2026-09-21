-- Additive, read-only directory contracts. Keeps v1 for installed clients.
-- Requires the installed cruise_universe_catalog migration and its public identity gate.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_cruise_operators_v1() RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT jsonb_build_object('id',o.id,'name',o.name)
 FROM public.cruise_operators o
 WHERE EXISTS (SELECT 1 FROM public.cruise_ships s WHERE s.operator_id=o.id
   AND public.cruise_universe_is_public(s.universe_id))
 ORDER BY lower(o.name),o.id;
$body$;
REVOKE ALL ON FUNCTION public.get_cruise_operators_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_operators_v1() TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.search_cruise_ships_v2(
 p_query text DEFAULT '',p_kind text DEFAULT NULL,p_status text DEFAULT 'operating',
 p_operator_id text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25,
 p_ship_ids uuid[] DEFAULT NULL
) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT public.get_cruise_ship_v1(s.slug,NULL)
 FROM public.cruise_ships s JOIN public.cruise_operators o ON o.id=s.operator_id
 WHERE public.cruise_universe_is_public(s.universe_id)
 AND p_status IN ('operating','announced') AND s.operating_status=p_status
 AND (p_kind IS NULL OR s.kind=p_kind)
 AND (p_operator_id IS NULL OR s.operator_id=p_operator_id)
 -- Optional bounded editorial identity set. It never changes publication visibility.
 AND (p_ship_ids IS NULL OR (cardinality(p_ship_ids) BETWEEN 1 AND 12 AND s.id=ANY(p_ship_ids)))
 AND (length(btrim(coalesce(p_query,'')))=0
   OR s.name ILIKE '%'||left(btrim(p_query),160)||'%'
   OR o.name ILIKE '%'||left(btrim(p_query),160)||'%'
   OR EXISTS (SELECT 1 FROM public.cruise_ship_name_history h WHERE h.ship_id=s.id
     AND h.name ILIKE '%'||left(btrim(p_query),160)||'%' AND public.cruise_has_sources(s.id,h.source_ids)))
 -- All filters, including operator and editorial IDs, precede deterministic pagination.
 ORDER BY CASE WHEN p_ship_ids IS NOT NULL THEN array_position(p_ship_ids,s.id) END,
   lower(s.name),s.id
 OFFSET greatest(0,least(coalesce(p_offset,0),100000))
 LIMIT greatest(1,least(coalesce(p_limit,25),51));
$body$;
REVOKE ALL ON FUNCTION public.search_cruise_ships_v2(text,text,text,text,integer,integer,uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_cruise_ships_v2(text,text,text,text,integer,integer,uuid[]) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.get_cruise_operators_v1() IS 'Only operators with currently public, verified cruise ships; no private fleet or ranking data.';
COMMENT ON FUNCTION public.search_cruise_ships_v2(text,text,text,text,integer,integer,uuid[]) IS 'Public directory filters before pagination; bounded optional editorial IDs preserve caller order, never publication bypass.';
COMMIT;
