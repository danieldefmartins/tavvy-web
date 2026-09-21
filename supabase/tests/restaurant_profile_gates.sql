-- Run only inside a transaction ending in ROLLBACK.
DO $$ BEGIN
 PERFORM set_config('test.profile_owner',gen_random_uuid()::text,true);
 PERFORM set_config('test.profile_other',gen_random_uuid()::text,true);
 PERFORM set_config('test.profile_place',gen_random_uuid()::text,true);
END $$;
INSERT INTO auth.users(id,email,role,aud) SELECT current_setting(s)::uuid,'profile-'||current_setting(s)||'@example.invalid','authenticated','authenticated' FROM (VALUES ('test.profile_owner'),('test.profile_other')) x(s);
INSERT INTO public.places(id,source_type,source_id,name,status,is_active) VALUES(current_setting('test.profile_place')::uuid,'user',current_setting('test.profile_place'),'Profile rollback fixture','active',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE c jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.profile_owner'),'role','authenticated')::text,true);
 c:=public.submit_restaurant_claim(current_setting('test.profile_place')::uuid,'Profile Owner','Owner','profile-owner@example.invalid','6175550100',true);PERFORM set_config('test.profile_claim',c->>'id',true);
 BEGIN PERFORM public.get_restaurant_owner_profile(current_setting('test.profile_place')::uuid);RAISE EXCEPTION 'FAIL pending owner got management';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT public.review_restaurant_claim(current_setting('test.profile_claim')::uuid,true,'Rollback profile management test, all fixtures are rolled back.');
SET LOCAL ROLE authenticated;
DO $$ DECLARE p jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.profile_owner'),'role','authenticated')::text,true);
 p:=jsonb_build_object('name','New profile name','street','123 Test Street','city','Boston','region','MA','postcode','02110','country','US','cuisine','Italian','latitude',42.36,'longitude',-71.05,'confirmLocation',true);
 PERFORM public.save_restaurant_owner_profile(current_setting('test.profile_place')::uuid,p);
 IF public.get_restaurant_owner_profile(current_setting('test.profile_place')::uuid)->>'name'<>'New profile name' THEN RAISE EXCEPTION 'FAIL identity not saved';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=current_setting('test.profile_place')::uuid AND latitude=42.36 AND longitude=-71.05 AND location IS NOT NULL) THEN RAISE EXCEPTION 'FAIL pin not saved';END IF;
 BEGIN PERFORM public.save_restaurant_owner_profile(current_setting('test.profile_place')::uuid,p||'{"latitude":100}'::jsonb);RAISE EXCEPTION 'FAIL invalid latitude accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 PERFORM public.save_restaurant_owner_profile(current_setting('test.profile_place')::uuid,p||'{"street":"456 New Street","confirmLocation":false}'::jsonb);
 IF EXISTS(SELECT 1 FROM public.places WHERE id=current_setting('test.profile_place')::uuid AND (latitude IS NOT NULL OR longitude IS NOT NULL OR location IS NOT NULL)) THEN RAISE EXCEPTION 'FAIL old pin retained after move';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.profile_other'),'role','authenticated')::text,true);
 BEGIN PERFORM public.save_restaurant_owner_profile(current_setting('test.profile_place')::uuid,p);RAISE EXCEPTION 'FAIL other user edited';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.get_restaurant_owner_profile(current_setting('test.profile_place')::uuid);RAISE EXCEPTION 'FAIL other user read management';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.get_restaurant_owner_profile(current_setting('test.profile_place')::uuid);RAISE EXCEPTION 'FAIL anon management';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
