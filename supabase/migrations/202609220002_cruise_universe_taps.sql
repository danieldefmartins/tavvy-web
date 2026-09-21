-- Genuine ship-level taps. Existing categorized-text universe_reviews are retained unchanged.
BEGIN;
CREATE TABLE public.universe_visits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), universe_id uuid NOT NULL REFERENCES public.atlas_universes(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, sailing_date date NOT NULL,
 cabin_category_id uuid REFERENCES public.cruise_cabin_categories(id) ON DELETE SET NULL,
 public_note text CHECK(length(public_note)<=4000), status text NOT NULL DEFAULT 'live' CHECK(status IN ('live','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(universe_id,user_id,sailing_date)
);
CREATE TABLE public.universe_visit_taps (
 visit_id uuid NOT NULL REFERENCES public.universe_visits(id) ON DELETE CASCADE,
 signal_id uuid NOT NULL REFERENCES public.review_items(id), intensity smallint NOT NULL CHECK(intensity BETWEEN 1 AND 3),
 PRIMARY KEY(visit_id,signal_id)
);
CREATE TABLE public.universe_visit_revisions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, visit_id uuid NOT NULL REFERENCES public.universe_visits(id) ON DELETE CASCADE,
 universe_id uuid NOT NULL REFERENCES public.atlas_universes(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, sailing_date date NOT NULL,
 signals jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX universe_visit_revision_page ON public.universe_visit_revisions(universe_id,id);
CREATE TABLE public.universe_visit_requests (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, request_key text NOT NULL,
 visit_id uuid NOT NULL REFERENCES public.universe_visits(id) ON DELETE CASCADE, payload jsonb NOT NULL,
 PRIMARY KEY(user_id,request_key)
);
DO $body$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['universe_visits','universe_visit_taps','universe_visit_revisions','universe_visit_requests'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $body$;
GRANT USAGE,SELECT ON SEQUENCE public.universe_visit_revisions_id_seq TO service_role;
INSERT INTO public.review_items(slug,label,signal_type,category,is_active,sort_order) VALUES
 ('cruise_restful_cabins','Restful cabins','best_for','cruise_ship',true,1),
 ('cruise_comfortable_beds','Comfortable beds','best_for','cruise_ship',true,2),
 ('cruise_quality_food','Quality food','best_for','cruise_ship',true,3),
 ('cruise_clean_well_kept','Clean and well kept','best_for','cruise_ship',true,4),
 ('cruise_engaging_shows','Engaging shows','best_for','cruise_ship',true,5),
 ('cruise_easy_boarding','Easy boarding','best_for','cruise_ship',true,6),
 ('cruise_helpful_crew','Helpful crew','best_for','cruise_ship',true,7),
 ('cruise_clear_inclusions','Clear inclusions and charges','best_for','cruise_ship',true,8),
 ('cruise_quiet_spaces','Quiet spaces','vibe','cruise_ship',true,10),
 ('cruise_lively_social','Lively and social','vibe','cruise_ship',true,11),
 ('cruise_family_friendly','Family friendly','vibe','cruise_ship',true,12),
 ('cruise_adult_focused','Adult focused','vibe','cruise_ship',true,13),
 ('cruise_relaxed_scenic','Relaxed and scenic','vibe','cruise_ship',true,14),
 ('cruise_exploration_focused','Exploration focused','vibe','cruise_ship',true,15),
 ('cruise_noisy_cabins','Noisy cabins','heads_up','cruise_ship',true,20),
 ('cruise_uncomfortable_beds','Uncomfortable beds','heads_up','cruise_ship',true,21),
 ('cruise_inconsistent_food','Inconsistent food','heads_up','cruise_ship',true,22),
 ('cruise_crowded_public_spaces','Crowded public spaces','heads_up','cruise_ship',true,23),
 ('cruise_long_queues','Long waits and queues','heads_up','cruise_ship',true,24),
 ('cruise_unclear_extra_charges','Unclear extra charges','heads_up','cruise_ship',true,25),
 ('cruise_upkeep_concerns','Upkeep concerns','heads_up','cruise_ship',true,26),
 ('cruise_accessibility_barriers','Accessibility barriers','heads_up','cruise_ship',true,27)
 ON CONFLICT(slug) DO NOTHING;
CREATE FUNCTION public.save_cruise_universe_visit_v1(p_universe_id uuid,p_sailing_date date,p_signals jsonb,p_request_key text,p_public_note text DEFAULT NULL,p_cabin_category_id uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE v_user uuid:=auth.uid(); v_visit uuid; v_payload jsonb; v_existing public.universe_visit_requests%ROWTYPE; v_count integer; v_signals jsonb;
BEGIN
 -- A still-valid JWT must not let a deleted or banned account write a new visit.
 IF v_user IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=v_user AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())) THEN
  RAISE EXCEPTION 'Sign in with an active account to share your experience' USING ERRCODE='42501';
 END IF;
 IF p_sailing_date IS NULL OR p_sailing_date>current_date THEN RAISE EXCEPTION 'Choose a sailing date that is not in the future'; END IF;
 IF NOT public.cruise_universe_is_public(p_universe_id) OR NOT EXISTS(SELECT 1 FROM public.cruise_ships WHERE universe_id=p_universe_id AND operating_status='operating') THEN RAISE EXCEPTION 'This ship is not accepting guest reports'; END IF;
 IF p_request_key IS NULL OR length(p_request_key) NOT BETWEEN 8 AND 200 OR length(p_public_note)>4000 THEN RAISE EXCEPTION 'Invalid review request'; END IF;
 IF jsonb_typeof(p_signals) IS DISTINCT FROM 'array' OR jsonb_array_length(p_signals) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Choose between 1 and 30 signals'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_signals) s WHERE jsonb_typeof(s) IS DISTINCT FROM 'object' OR s->>'signal_id' IS NULL OR s->>'signal_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' OR s->>'intensity' IS NULL OR s->>'intensity' NOT IN ('1','2','3')) THEN RAISE EXCEPTION 'Invalid signal or intensity'; END IF;
 SELECT count(DISTINCT (s->>'signal_id')::uuid),jsonb_agg(s ORDER BY s->>'signal_id') INTO v_count,v_signals FROM jsonb_array_elements(p_signals) s;
 IF v_count<>jsonb_array_length(p_signals) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_signals) s WHERE NOT EXISTS(SELECT 1 FROM public.review_items i WHERE i.id=(s->>'signal_id')::uuid AND i.is_active AND i.category='cruise_ship' AND i.slug LIKE 'cruise\_%' ESCAPE '\' AND i.signal_type IN ('best_for','vibe','heads_up'))) THEN RAISE EXCEPTION 'Choose active ship experience signals'; END IF;
 IF p_cabin_category_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.cruise_cabin_categories c JOIN public.cruise_ships s ON s.id=c.ship_id WHERE c.id=p_cabin_category_id AND s.universe_id=p_universe_id) THEN RAISE EXCEPTION 'Cabin category does not belong to this ship'; END IF;
 v_payload:=jsonb_build_object('universe',p_universe_id,'date',p_sailing_date,'signals',v_signals,'note',nullif(btrim(p_public_note),''),'cabin',p_cabin_category_id);
 PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 SELECT * INTO v_existing FROM public.universe_visit_requests WHERE user_id=v_user AND request_key=p_request_key;
 IF FOUND THEN IF v_existing.payload<>v_payload THEN RAISE EXCEPTION 'This request key was already used for different content'; END IF; RETURN v_existing.visit_id; END IF;
 SELECT id INTO v_visit FROM public.universe_visits WHERE universe_id=p_universe_id AND user_id=v_user AND sailing_date=p_sailing_date FOR UPDATE;
 IF FOUND THEN
  IF EXISTS(SELECT 1 FROM public.universe_visits WHERE id=v_visit AND status<>'live') THEN RAISE EXCEPTION 'This report cannot be edited'; END IF;
  UPDATE public.universe_visits SET public_note=nullif(btrim(p_public_note),''),cabin_category_id=p_cabin_category_id,updated_at=clock_timestamp() WHERE id=v_visit;
 ELSE
  INSERT INTO public.universe_visits(universe_id,user_id,sailing_date,public_note,cabin_category_id) VALUES(p_universe_id,v_user,p_sailing_date,nullif(btrim(p_public_note),''),p_cabin_category_id) RETURNING id INTO v_visit;
 END IF;
 DELETE FROM public.universe_visit_taps WHERE visit_id=v_visit;
 INSERT INTO public.universe_visit_taps(visit_id,signal_id,intensity) SELECT v_visit,(s->>'signal_id')::uuid,(s->>'intensity')::smallint FROM jsonb_array_elements(p_signals) s;
 INSERT INTO public.universe_visit_revisions(visit_id,universe_id,user_id,sailing_date,signals)
 SELECT v_visit,p_universe_id,v_user,p_sailing_date,jsonb_agg(jsonb_build_object('slug',i.slug,'label',i.label,'category',CASE i.signal_type WHEN 'best_for' THEN 'good' WHEN 'vibe' THEN 'vibe' ELSE 'headsup' END,'intensity',t.intensity) ORDER BY i.id)
 FROM public.universe_visit_taps t JOIN public.review_items i ON i.id=t.signal_id WHERE t.visit_id=v_visit;
 INSERT INTO public.universe_visit_requests(user_id,request_key,visit_id,payload) VALUES(v_user,p_request_key,v_visit,v_payload);
 RETURN v_visit;
END $body$;
REVOKE ALL ON FUNCTION public.save_cruise_universe_visit_v1(uuid,date,jsonb,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_cruise_universe_visit_v1(uuid,date,jsonb,text,text,uuid) TO authenticated;
CREATE FUNCTION public.get_cruise_universe_evidence_v1(p_universe_id uuid,p_cursor bigint DEFAULT 0,p_snapshot text DEFAULT NULL,p_limit integer DEFAULT 500) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE v_snapshot text; v_visits jsonb; v_cursor bigint; v_complete boolean;
BEGIN
 IF NOT public.cruise_universe_is_public(p_universe_id) THEN RAISE EXCEPTION 'Ship not available'; END IF;
 SELECT md5(coalesce(max(r.id)::text,'0')||':'||count(*)::text||':'||coalesce(max(v.updated_at)::text,'')) INTO v_snapshot FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live';
 IF p_snapshot IS NOT NULL AND p_snapshot<>v_snapshot THEN RAISE EXCEPTION 'Guest reports changed; retry the complete read' USING ERRCODE='40001'; END IF;
 WITH page AS (SELECT r.* FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live' AND r.id>greatest(0,coalesce(p_cursor,0)) ORDER BY r.id LIMIT greatest(1,least(coalesce(p_limit,500),500)))
 SELECT coalesce(jsonb_agg(jsonb_build_object('reviewId',visit_id,'userId',md5(user_id::text||':'||universe_id::text),'visitedAt',sailing_date::text||'T00:00:00.000Z','dateSource','reported','signals',signals) ORDER BY id),'[]'::jsonb),coalesce(max(id),p_cursor) INTO v_visits,v_cursor FROM page;
 v_complete:=NOT EXISTS(SELECT 1 FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live' AND r.id>v_cursor);
 RETURN jsonb_build_object('visits',v_visits,'next_cursor',v_cursor::text,'complete',v_complete,'snapshot',v_snapshot);
END $body$;
REVOKE ALL ON FUNCTION public.get_cruise_universe_evidence_v1(uuid,bigint,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_universe_evidence_v1(uuid,bigint,text,integer) TO anon,authenticated;
CREATE FUNCTION public.get_cruise_universe_reviews_v1(p_universe_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
 SELECT jsonb_build_object('total',(SELECT count(*) FROM public.universe_visits WHERE universe_id=p_universe_id AND status='live'),'reviews',coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (
 SELECT v.id,v.sailing_date,v.public_note,c.name AS cabin_category_name,(SELECT jsonb_agg(jsonb_build_object('label',i.label,'category',i.signal_type,'intensity',t.intensity) ORDER BY i.sort_order,i.id) FROM public.universe_visit_taps t JOIN public.review_items i ON i.id=t.signal_id WHERE t.visit_id=v.id) AS signals
 FROM public.universe_visits v LEFT JOIN public.cruise_cabin_categories c ON c.id=v.cabin_category_id WHERE v.universe_id=p_universe_id AND v.status='live' ORDER BY v.sailing_date DESC,v.id LIMIT greatest(1,least(coalesce(p_limit,20),50)) OFFSET greatest(0,coalesce(p_offset,0))) q),'[]'::jsonb)) WHERE public.cruise_universe_is_public(p_universe_id);
$body$;
REVOKE ALL ON FUNCTION public.get_cruise_universe_reviews_v1(uuid,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_universe_reviews_v1(uuid,integer,integer) TO anon,authenticated;
COMMIT;
