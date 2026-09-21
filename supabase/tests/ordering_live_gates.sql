-- Fixtures/assertions only. Embed after ordering003 inside BEGIN ... ROLLBACK.
-- Never execute this fixture file without its surrounding rollback transaction.
DO $$ BEGIN
 PERFORM set_config('test.order_owner',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_customer',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_other',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_place',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_other_place',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_dish',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_other_dish',gen_random_uuid()::text,true);
 PERFORM set_config('test.order_request',gen_random_uuid()::text,true);
END $$;
INSERT INTO auth.users(id,email,role,aud)
 SELECT current_setting(setting)::uuid,prefix||current_setting(setting)||'@example.invalid','authenticated','authenticated'
 FROM (VALUES ('test.order_owner','order-owner-'),('test.order_customer','order-customer-'),('test.order_other','order-other-')) x(setting,prefix);
INSERT INTO public.places(id,source_type,source_id,name,status,is_active)
 SELECT current_setting(setting)::uuid,'user',current_setting(setting),'Ordering rollback fixture','active',true
 FROM (VALUES ('test.order_place'),('test.order_other_place')) x(setting);
INSERT INTO public.menus(id,place_id,name,is_active)
 SELECT current_setting(setting)::uuid,current_setting(setting)::uuid,'Rollback menu',true
 FROM (VALUES ('test.order_place'),('test.order_other_place')) x(setting);
INSERT INTO public.menu_categories(id,menu_id,name)
 SELECT current_setting(setting)::uuid,current_setting(setting)::uuid,'Rollback dishes'
 FROM (VALUES ('test.order_place'),('test.order_other_place')) x(setting);
INSERT INTO public.menu_items(id,category_id,place_id,name,price,is_available) VALUES
 (current_setting('test.order_dish')::uuid,current_setting('test.order_place')::uuid,current_setting('test.order_place')::uuid,'Rollback pasta',12.34,true),
 (current_setting('test.order_other_dish')::uuid,current_setting('test.order_other_place')::uuid,current_setting('test.order_other_place')::uuid,'Other rollback dish',99,true);

-- Real onboarding contract, initially pending.
SET LOCAL ROLE authenticated;
DO $$ DECLARE c jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_owner'),'role','authenticated')::text,true);
 c:=public.submit_restaurant_claim(current_setting('test.order_place')::uuid,'Rollback Owner','Owner','order-owner@example.invalid','6175550100',true);
 PERFORM set_config('test.order_claim',c->>'id',true);
 BEGIN PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,true,825); RAISE EXCEPTION 'FAIL pending owner configured ordering';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 PERFORM public.review_restaurant_claim(current_setting('test.order_claim')::uuid,true,'Rollback test of ordering ownership; no account or approval survives.');
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_owner'),'role','authenticated')::text,true);
 IF NOT public.has_verified_restaurant_claim(current_setting('test.order_place')::uuid) THEN RAISE EXCEPTION 'FAIL actual owner helper'; END IF;
 BEGIN PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,true,825); RAISE EXCEPTION 'FAIL ordering enabled without table';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%active table%' THEN RAISE; END IF; END;
 PERFORM public.set_ordering_table(current_setting('test.order_place')::uuid,'7',true);
 BEGIN PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,true,NULL); RAISE EXCEPTION 'FAIL missing tax accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%tax rate%' THEN RAISE; END IF; END;
 PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,true,825);
 BEGIN PERFORM public.configure_place_ordering(current_setting('test.order_other_place')::uuid,true,825); RAISE EXCEPTION 'FAIL cross restaurant configuration';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF public.get_place_ordering_context(current_setting('test.order_place')::uuid,'7')->>'ready' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'FAIL ready context'; END IF;
END $$;

-- Anonymous reads and submission cannot see/create real orders.
SET LOCAL ROLE anon;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
 IF public.get_place_ordering_context(current_setting('test.order_place')::uuid,'7')->>'tableValid' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'FAIL public readiness context'; END IF;
 BEGIN PERFORM 1 FROM public.orders LIMIT 1; RAISE EXCEPTION 'FAIL anonymous order read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM 1 FROM public.order_items LIMIT 1; RAISE EXCEPTION 'FAIL anonymous item read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7','[]',NULL,NULL,gen_random_uuid(),0); RAISE EXCEPTION 'FAIL anonymous submission'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- Customer submission must snapshot server prices, notes, joined lines and explicit tax.
SET LOCAL ROLE authenticated;
DO $$ DECLARE o jsonb; again jsonb; lines jsonb; n int; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_customer'),'role','authenticated')::text,true);
 lines:=jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2,'notes','No cheese','price',0,'name','Forged name'));
 o:=public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,'Peanut allergy','Rollback customer',current_setting('test.order_request')::uuid,26.72);
 PERFORM set_config('test.order_id',o->>'id',true);
 IF (o->>'subtotal')::numeric<>24.68 OR (o->>'tax')::numeric<>2.04 OR (o->>'total')::numeric<>26.72 THEN RAISE EXCEPTION 'FAIL server totals'; END IF;
 IF o->>'customer_id'<>current_setting('test.order_customer') OR o->>'notes'<>'Peanut allergy' OR o->'items'->0->>'notes'<>'No cheese' OR o->'items'->0->>'name'<>'Rollback pasta' OR (o->'items'->0->>'price')::numeric<>12.34 THEN RAISE EXCEPTION 'FAIL server snapshots'; END IF;
 again:=public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,'Peanut allergy','Rollback customer',current_setting('test.order_request')::uuid,26.72);
 IF again->>'id'<>o->>'id' THEN RAISE EXCEPTION 'FAIL retry duplicate'; END IF;
 SELECT count(*) INTO n FROM public.order_items WHERE order_id=(o->>'id')::uuid; IF n<>1 THEN RAISE EXCEPTION 'FAIL scoped joined lines'; END IF;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,'Different notes','Rollback customer',current_setting('test.order_request')::uuid,26.72); RAISE EXCEPTION 'FAIL key reused for changed draft';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%different order%' THEN RAISE; END IF; END;
 BEGIN UPDATE public.orders SET status='served' WHERE id=(o->>'id')::uuid; RAISE EXCEPTION 'FAIL direct customer update'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.orders(place_id,table_number) VALUES(current_setting('test.order_place')::uuid,'7'); RAISE EXCEPTION 'FAIL direct insert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.order_items SET price=0 WHERE order_id=(o->>'id')::uuid; RAISE EXCEPTION 'FAIL direct line update'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,NULL,NULL,gen_random_uuid(),1); RAISE EXCEPTION 'FAIL client total accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%MENU_CHANGED%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'unknown',lines,NULL,NULL,gen_random_uuid(),26.72); RAISE EXCEPTION 'FAIL inactive table accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%active table%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_other_dish'),'quantity',1)),NULL,NULL,gen_random_uuid(),99); RAISE EXCEPTION 'FAIL cross place dish';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%unavailable%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',21)),NULL,NULL,gen_random_uuid(),0); RAISE EXCEPTION 'FAIL excessive quantity';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%1–20%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,repeat('x',1001),NULL,gen_random_uuid(),26.72); RAISE EXCEPTION 'FAIL long notes';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%too long%' THEN RAISE; END IF; END;
END $$;

-- Another authenticated user cannot see or change the order.
DO $$ BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_other'),'role','authenticated')::text,true);
 IF EXISTS(SELECT 1 FROM public.orders WHERE id=current_setting('test.order_id')::uuid) OR EXISTS(SELECT 1 FROM public.order_items WHERE order_id=current_setting('test.order_id')::uuid) THEN RAISE EXCEPTION 'FAIL another customer read order'; END IF;
 BEGIN PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'pending','confirmed',NULL); RAISE EXCEPTION 'FAIL unauthorized kitchen action'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- Real deployed menu triggers and ordering availability; retries remain resolvable.
RESET ROLE;
UPDATE public.menu_items SET is_available=false WHERE id=current_setting('test.order_dish')::uuid;
SET LOCAL ROLE authenticated;
DO $$ DECLARE lines jsonb; o jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_customer'),'role','authenticated')::text,true);
 lines:=jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2,'notes','No cheese','price',0,'name','Forged name'));
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,NULL,NULL,gen_random_uuid(),26.72); RAISE EXCEPTION 'FAIL unavailable dish accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%unavailable%' THEN RAISE; END IF; END;
 o:=public.submit_place_order(current_setting('test.order_place')::uuid,'7',lines,'Peanut allergy','Rollback customer',current_setting('test.order_request')::uuid,26.72);
 IF o->>'id'<>current_setting('test.order_id') THEN RAISE EXCEPTION 'FAIL retry after availability change'; END IF;
END $$;
RESET ROLE;
UPDATE public.menu_items SET is_available=true WHERE id=current_setting('test.order_dish')::uuid;
UPDATE public.menus SET is_active=false WHERE id=current_setting('test.order_place')::uuid;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2)),NULL,NULL,gen_random_uuid(),26.72); RAISE EXCEPTION 'FAIL inactive menu accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%unavailable%' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
UPDATE public.menus SET is_active=true WHERE id=current_setting('test.order_place')::uuid;

-- Force a late line failure, proving the header rolls back too.
CREATE FUNCTION pg_temp.order_gate_fail_line() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.menu_item_id=current_setting('test.order_dish')::uuid THEN RAISE EXCEPTION 'ORDER_GATE_LINE_FAILURE'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER order_gate_fail_line BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION pg_temp.order_gate_fail_line();
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2)),NULL,NULL,gen_random_uuid(),26.72); RAISE EXCEPTION 'FAIL forced line insert succeeded'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ORDER_GATE_LINE_FAILURE' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM public.orders WHERE place_id=current_setting('test.order_place')::uuid)<>1 THEN RAISE EXCEPTION 'FAIL orphan order after line failure'; END IF;
END $$;
RESET ROLE;
DROP TRIGGER order_gate_fail_line ON public.order_items;

-- The verified owner sees full orders and alone advances enforced transitions.
SET LOCAL ROLE authenticated;
DO $$ DECLARE o jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_owner'),'role','authenticated')::text,true);
 IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=current_setting('test.order_id')::uuid) OR NOT EXISTS(SELECT 1 FROM public.order_items WHERE order_id=current_setting('test.order_id')::uuid) THEN RAISE EXCEPTION 'FAIL verified kitchen read'; END IF;
 BEGIN PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'pending','ready',NULL); RAISE EXCEPTION 'FAIL skipped status'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%not allowed%' THEN RAISE; END IF; END;
 BEGIN PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'pending',NULL,NULL); RAISE EXCEPTION 'FAIL null status'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%not allowed%' THEN RAISE; END IF; END;
 o:=public.transition_place_order(current_setting('test.order_id')::uuid,'pending','confirmed',NULL);
 IF o->>'confirmed_at' IS NULL OR o->'items'->0->>'status'<>'confirmed' THEN RAISE EXCEPTION 'FAIL confirmation timestamp or item state'; END IF;
 BEGIN PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'pending','confirmed',NULL); RAISE EXCEPTION 'FAIL stale status'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%status changed%' THEN RAISE; END IF; END;
 PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'confirmed','preparing',NULL);
 PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'preparing','ready',NULL);
 o:=public.transition_place_order(current_setting('test.order_id')::uuid,'ready','served',NULL);
 IF o->>'served_at' IS NULL OR o->'items'->0->>'status'<>'served' THEN RAISE EXCEPTION 'FAIL served timestamp or item state'; END IF;
 BEGIN PERFORM public.transition_place_order(current_setting('test.order_id')::uuid,'served','cancelled','Late cancellation'); RAISE EXCEPTION 'FAIL terminal status changed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%not allowed%' THEN RAISE; END IF; END;
 PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,true,887.5);
END $$;
DO $$ DECLARE o jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_customer'),'role','authenticated')::text,true);
 o:=public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2)),NULL,NULL,gen_random_uuid(),26.87);
 IF (o->>'tax')::numeric<>2.19 THEN RAISE EXCEPTION 'FAIL fractional configured tax'; END IF;
 PERFORM set_config('test.order_cancel_id',o->>'id',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_owner'),'role','authenticated')::text,true);
 BEGIN PERFORM public.transition_place_order((o->>'id')::uuid,'pending','cancelled',NULL); RAISE EXCEPTION 'FAIL empty cancellation reason'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%reason%' THEN RAISE; END IF; END;
 PERFORM public.transition_place_order((o->>'id')::uuid,'pending','cancelled','Sold out');
 PERFORM public.configure_place_ordering(current_setting('test.order_place')::uuid,false,887.5);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.order_customer'),'role','authenticated')::text,true);
 IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=(o->>'id')::uuid AND cancel_reason='Sold out') THEN RAISE EXCEPTION 'FAIL customer cancellation reason'; END IF;
 BEGIN PERFORM public.submit_place_order(current_setting('test.order_place')::uuid,'7',jsonb_build_array(jsonb_build_object('menu_item_id',current_setting('test.order_dish'),'quantity',2)),NULL,NULL,gen_random_uuid(),26.87); RAISE EXCEPTION 'FAIL paused ordering'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%not available%' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
