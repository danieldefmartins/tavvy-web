-- Run only inside the parent BEGIN / ROLLBACK gate; uses an existing auth identity without modifying it.
CREATE TEMP TABLE cruise_gate_state(k text PRIMARY KEY,v text);
INSERT INTO cruise_gate_state VALUES('user',(SELECT id::text FROM auth.users WHERE deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now()) ORDER BY id LIMIT 1));
DO $$ BEGIN IF (SELECT v FROM cruise_gate_state WHERE k='user') IS NULL THEN RAISE EXCEPTION 'Gate requires an existing auth fixture identity'; END IF; END $$;
CREATE FUNCTION pg_temp.assert_ok(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Cruise gate failed: %',label; END IF; END $$;
-- No auth record is inserted, updated or deleted for this stale-JWT boundary.
SELECT pg_temp.assert_ok(NOT EXISTS(SELECT 1 FROM auth.users WHERE id='dcac0000-0000-4000-8000-000000000099'),'reserved missing actor does not exist');
SELECT set_config('request.jwt.claims','{"sub":"dcac0000-0000-4000-8000-000000000099","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE denied boolean:=false; BEGIN
 BEGIN PERFORM public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,'[]','rollback-stale-account',NULL,NULL);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 PERFORM pg_temp.assert_ok(denied,'stale JWT with no auth account cannot save');
END $$;
RESET ROLE;
INSERT INTO public.atlas_universes(id,name,slug,status,universe_kind) VALUES
 ('dcac0000-0000-4000-8000-000000000001','Rollback Ship A','rollback-cruise-ship-a','draft','cruise_ship'),
 ('dcac0000-0000-4000-8000-000000000002','Rollback Ship B','rollback-cruise-ship-b','published','cruise_ship');
INSERT INTO public.cruise_operators(id,name,official_url) VALUES('rollback-cruise-line','Rollback Line','https://example.invalid/fleet');
INSERT INTO public.cruise_ships(id,universe_id,slug,name,operator_id,kind) VALUES
 ('dcac0000-0000-4000-8000-000000000011','dcac0000-0000-4000-8000-000000000001','rollback-cruise-ship-a','Rollback Ship A','rollback-cruise-line','ocean'),
 ('dcac0000-0000-4000-8000-000000000012','dcac0000-0000-4000-8000-000000000002','rollback-cruise-ship-b','Rollback Ship B','rollback-cruise-line','river');
SET LOCAL ROLE anon;
SELECT pg_temp.assert_ok(public.get_cruise_ship_v1('rollback-cruise-ship-a',NULL) IS NULL,'draft ship hidden');
SELECT pg_temp.assert_ok(NOT EXISTS(SELECT 1 FROM public.atlas_universes WHERE id='dcac0000-0000-4000-8000-000000000001'),'draft Universe hidden despite permissive baseline policy');
DO $$ DECLARE denied boolean:=false; BEGIN BEGIN PERFORM 1 FROM public.cruise_ships; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;PERFORM pg_temp.assert_ok(denied,'raw research data inaccessible');END $$;
RESET ROLE;
DO $$ DECLARE denied boolean:=false; BEGIN BEGIN UPDATE public.cruise_ships SET publication_status='published' WHERE slug='rollback-cruise-ship-a'; EXCEPTION WHEN raise_exception THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'unsourced unknown ship cannot publish');END $$;
INSERT INTO public.cruise_ship_sources(ship_id,id,url,publisher,checked_at,source_type) SELECT id,'official','https://example.invalid/ship','Rollback Operator',current_date,'operator' FROM public.cruise_ships WHERE operator_id='rollback-cruise-line';
UPDATE public.cruise_ships SET identity_verified=true,overnight_public_cruise=true,operating_status=CASE kind WHEN 'ocean' THEN 'operating' ELSE 'announced' END,status_source_ids=ARRAY['official'],publication_status='published',photo='{"url":"https://example.invalid/photo.jpg","permission_verified":false,"source_id":"official"}' WHERE operator_id='rollback-cruise-line';
UPDATE public.atlas_universes SET status='published' WHERE id='dcac0000-0000-4000-8000-000000000001';
INSERT INTO public.cruise_ship_facts(ship_id,key,value,source_ids,as_of,verification) VALUES
 ('dcac0000-0000-4000-8000-000000000011','guests_double_occupancy','2200',ARRAY['official'],current_date,'verified'),
 ('dcac0000-0000-4000-8000-000000000011','guests_maximum','2700',ARRAY['official'],current_date,'verified');
INSERT INTO public.cruise_ship_name_history(ship_id,name,source_ids) VALUES('dcac0000-0000-4000-8000-000000000011','Rollback Former Name',ARRAY['official']);
INSERT INTO public.cruise_cabin_categories(id,ship_id,name,source_ids) VALUES('dcac0000-0000-4000-8000-000000000021','dcac0000-0000-4000-8000-000000000012','Other ship cabin',ARRAY['official']);
INSERT INTO public.cruise_venues(id,ship_id,name,kind,source_ids,verification) VALUES
 ('dcac0000-0000-4000-8000-000000000061','dcac0000-0000-4000-8000-000000000011','Rollback Theatre','theatre',ARRAY['official'],'verified'),
 ('dcac0000-0000-4000-8000-000000000062','dcac0000-0000-4000-8000-000000000012','Other Theatre','theatre',ARRAY['official'],'verified');
INSERT INTO public.cruise_programs(ship_id,name,kind,venue_id,as_of,source_ids,verification,availability_note) VALUES
 ('dcac0000-0000-4000-8000-000000000011','Rollback Show','show','dcac0000-0000-4000-8000-000000000061',current_date,ARRAY['official'],'verified','May vary by sailing');
DO $$ DECLARE denied boolean:=false; BEGIN BEGIN INSERT INTO public.cruise_programs(ship_id,name,kind,venue_id,as_of) VALUES('dcac0000-0000-4000-8000-000000000011','Wrong venue','show','dcac0000-0000-4000-8000-000000000062',current_date);EXCEPTION WHEN foreign_key_violation THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'program cannot link another ship venue');END $$;
SET LOCAL ROLE anon;
SELECT pg_temp.assert_ok((public.get_cruise_ship_v1('rollback-cruise-ship-a',NULL)->'ship'->'photo')='null'::jsonb,'unlicensed image omitted');
SELECT pg_temp.assert_ok(jsonb_array_length(public.get_cruise_ship_v1('rollback-cruise-ship-a',NULL)->'programs')=1,'programs distinct from physical venues');
SELECT pg_temp.assert_ok(jsonb_array_length(public.get_cruise_ship_v1('rollback-cruise-ship-a',NULL)->'ship'->'facts')=2,'capacity definitions separate');
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.search_cruise_ships_v1('Rollback',NULL,'operating',0,25))=1,'operating separate from announced');
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.search_cruise_ships_v1('Rollback','river','announced',0,25))=1,'kind/status applied before pagination');
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.search_cruise_ships_v1('Former',NULL,'operating',0,25))=1,'historical name resolves stable ship');
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',(SELECT v FROM cruise_gate_state WHERE k='user'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE denied boolean:=false; BEGIN BEGIN INSERT INTO public.universe_visits(universe_id,user_id,sailing_date) VALUES('dcac0000-0000-4000-8000-000000000001',auth.uid(),current_date);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'direct review writes denied');END $$;
SELECT public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,jsonb_build_array(jsonb_build_object('signal_id',(SELECT id FROM public.review_items WHERE slug='cruise_noisy_cabins'),'intensity',2)),'rollback-request-one','Fixture note',NULL);
SELECT public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,jsonb_build_array(jsonb_build_object('signal_id',(SELECT id FROM public.review_items WHERE slug='cruise_noisy_cabins'),'intensity',2)),'rollback-request-one','Fixture note',NULL);
DO $$ DECLARE denied boolean:=false; BEGIN BEGIN PERFORM public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,'[{"signal_id":"dcac0000-0000-4000-8000-000000000099","intensity":1}]','rollback-invalid','Invalid',NULL);EXCEPTION WHEN raise_exception THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'unknown signal rejects atomically');END $$;
DO $$ DECLARE denied boolean:=false;BEGIN BEGIN PERFORM public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000002',current_date,jsonb_build_array(jsonb_build_object('signal_id',(SELECT id FROM public.review_items WHERE slug='cruise_noisy_cabins'),'intensity',1)),'rollback-announced',NULL,NULL);EXCEPTION WHEN raise_exception THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'announced ship cannot receive sailing reviews');END $$;
DO $$ DECLARE denied boolean:=false;BEGIN BEGIN PERFORM public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,jsonb_build_array(jsonb_build_object('signal_id',(SELECT id FROM public.review_items WHERE slug='cruise_noisy_cabins'),'intensity',1)),'rollback-cabin',NULL,'dcac0000-0000-4000-8000-000000000021');EXCEPTION WHEN raise_exception THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'cross-ship cabin spoof rejected');END $$;
RESET ROLE;
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.universe_visits WHERE universe_id='dcac0000-0000-4000-8000-000000000001')=1,'idempotent retry does not duplicate visit');
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.universe_visit_revisions WHERE universe_id='dcac0000-0000-4000-8000-000000000001')=1,'idempotent retry does not duplicate revision');
INSERT INTO cruise_gate_state VALUES('snapshot',public.get_cruise_universe_evidence_v1('dcac0000-0000-4000-8000-000000000001')->>'snapshot');
SET LOCAL ROLE authenticated;
SELECT public.save_cruise_universe_visit_v1('dcac0000-0000-4000-8000-000000000001',current_date,jsonb_build_array(jsonb_build_object('signal_id',(SELECT id FROM public.review_items WHERE slug='cruise_restful_cabins'),'intensity',1)),'rollback-request-two','Updated fixture note',NULL);
RESET ROLE;
SELECT pg_temp.assert_ok((SELECT count(*) FROM public.universe_visits WHERE universe_id='dcac0000-0000-4000-8000-000000000001')=1,'same sailing edits one visit');
SELECT pg_temp.assert_ok(jsonb_array_length(public.get_cruise_universe_evidence_v1('dcac0000-0000-4000-8000-000000000001')->'visits')=2,'old concern remains in evidence history');
DO $$ DECLARE denied boolean:=false;BEGIN BEGIN PERFORM public.get_cruise_universe_evidence_v1('dcac0000-0000-4000-8000-000000000001',0,(SELECT v FROM cruise_gate_state WHERE k='snapshot'));EXCEPTION WHEN serialization_failure THEN denied:=true;END;PERFORM pg_temp.assert_ok(denied,'mixed snapshot rejected');END $$;
SELECT pg_temp.assert_ok(public.get_cruise_universe_reviews_v1('dcac0000-0000-4000-8000-000000000001')->>'total'='1','public feed counts visits, not edits');
UPDATE public.universe_visits SET status='hidden' WHERE universe_id='dcac0000-0000-4000-8000-000000000001';
SET LOCAL ROLE anon;
SELECT pg_temp.assert_ok(jsonb_array_length(public.get_cruise_universe_evidence_v1('dcac0000-0000-4000-8000-000000000001')->'visits')=0,'moderated visit excluded from all evidence');
SELECT pg_temp.assert_ok(public.get_cruise_universe_reviews_v1('dcac0000-0000-4000-8000-000000000001')->>'total'='0','moderated visit excluded from feed');
RESET ROLE;
