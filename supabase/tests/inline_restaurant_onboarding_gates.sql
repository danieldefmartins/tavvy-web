-- No fixtures survive this gate. Run with the migration body in one transaction.
BEGIN;
SELECT set_config('test.inline_owner',gen_random_uuid()::text,true),set_config('test.inline_other',gen_random_uuid()::text,true),set_config('test.inline_request',gen_random_uuid()::text,true);
INSERT INTO auth.users(id,email,role,aud) VALUES(current_setting('test.inline_owner')::uuid,'inline-'||current_setting('test.inline_owner')||'@example.invalid','authenticated','authenticated'),(current_setting('test.inline_other')::uuid,'inline-'||current_setting('test.inline_other')||'@example.invalid','authenticated','authenticated');
SELECT set_config('test.inline_details',jsonb_build_object('name','Rollback restaurant '||current_setting('test.inline_request'),'kind','Restaurant','street','101 Rollback Avenue','city','Rollback Test City','region','FL','country','US','postcode','00000')::text,true);
SELECT set_config('test.inline_contact','{"name":"Rollback Owner","role":"Owner","email":"private@example.invalid","phone":"6175550100","accepted":true}',true);
SET LOCAL ROLE anon;
DO $$ BEGIN BEGIN PERFORM public.create_restaurant_with_pending_claim(current_setting('test.inline_request')::uuid,current_setting('test.inline_details')::jsonb,current_setting('test.inline_contact')::jsonb,true);RAISE EXCEPTION 'Anonymous creation allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.inline_owner'),'role','authenticated')::text,true);
DO $$ DECLARE a jsonb;b jsonb;d jsonb:=current_setting('test.inline_details')::jsonb;c jsonb:=current_setting('test.inline_contact')::jsonb;BEGIN
 a:=public.create_restaurant_with_pending_claim(current_setting('test.inline_request')::uuid,d,c,true);
 IF a->>'outcome'<>'created' OR a->'claim'->>'status'<>'pending' OR a->'claim'->>'ownership_verified_at' IS NOT NULL THEN RAISE EXCEPTION 'Creation must yield pending ownership';END IF;
 PERFORM set_config('test.inline_place',a->>'placeId',true);PERFORM set_config('test.inline_claim',a->'claim'->>'id',true);
 b:=public.create_restaurant_with_pending_claim(current_setting('test.inline_request')::uuid,d,c,true);
 IF b->>'placeId' IS DISTINCT FROM a->>'placeId' OR b->'claim'->>'id' IS DISTINCT FROM a->'claim'->>'id' THEN RAISE EXCEPTION 'Retry duplicated listing/claim';END IF;
 IF public.has_verified_restaurant_claim((a->>'placeId')::uuid) OR public.get_restaurant_owner_workspace((a->>'placeId')::uuid)->>'canManage'<>'false' THEN RAISE EXCEPTION 'Creation granted management';END IF;
 IF EXISTS(SELECT 1 FROM public.places WHERE id=(a->>'placeId')::uuid AND (is_claimed OR claimed_by IS NOT NULL OR phone IS NOT NULL OR email IS NOT NULL)) THEN RAISE EXCEPTION 'Private contact or ownership leaked to place';END IF;
 BEGIN PERFORM public.create_restaurant_with_pending_claim(current_setting('test.inline_request')::uuid,d||'{"street":"Different"}',c,true);RAISE EXCEPTION 'Idempotency key accepted changed input';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.create_restaurant_with_pending_claim(gen_random_uuid(),d||jsonb_build_object('name','Invalid contact rollback '||current_setting('test.inline_request')),c||'{"email":"invalid"}',true);RAISE EXCEPTION 'Invalid contact accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 IF EXISTS(SELECT 1 FROM public.places WHERE name='Invalid contact rollback '||current_setting('test.inline_request')) THEN RAISE EXCEPTION 'Claim failure left a place behind';END IF;
 BEGIN PERFORM public.create_restaurant_with_pending_claim(gen_random_uuid(),d||'{"kind":"Unsupported"}',c,true);RAISE EXCEPTION 'Unsupported kind accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 b:=public.create_restaurant_with_pending_claim(gen_random_uuid(),d,c,true);
 IF b->>'outcome'<>'choose_existing' THEN RAISE EXCEPTION 'Same address duplicate bypassed check';END IF;
END $$;
-- More than20 older branches must not hide an exact street match behind the limit.
RESET ROLE;
INSERT INTO public.places(id,source_type,source_id,name,street,city,region,country,created_at)
SELECT gen_random_uuid(),'user',gen_random_uuid()::text,(current_setting('test.inline_details')::jsonb)->>'name',n::text||' Older Branch Avenue','Rollback Test City','FL','US',now()-interval '1 day' FROM generate_series(1,21) n;
SET LOCAL ROLE authenticated;
-- Another caller sees only public duplicate details, cannot read private claims/requests.
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.inline_other'),'role','authenticated')::text,true);
DO $$ DECLARE a jsonb;d jsonb:=current_setting('test.inline_details')::jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.pro_business_claims WHERE id=current_setting('test.inline_claim')::uuid) THEN RAISE EXCEPTION 'Private owner contact leaked';END IF;
 BEGIN PERFORM 1 FROM public.restaurant_onboarding_requests;RAISE EXCEPTION 'Private idempotency table readable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 a:=public.create_restaurant_with_pending_claim(gen_random_uuid(),d,current_setting('test.inline_contact')::jsonb,true);
 IF a->>'outcome'<>'choose_existing' OR a->'places'->0 ? 'business_email' THEN RAISE EXCEPTION 'Cross-account duplicate guard failed';END IF;
 -- Another physical branch requires an explicit distinct-location choice.
 a:=public.create_restaurant_with_pending_claim(gen_random_uuid(),d||'{"street":"202 Other Avenue"}',current_setting('test.inline_contact')::jsonb,false);
 IF a->>'outcome'<>'choose_existing' THEN RAISE EXCEPTION 'Possible duplicate created before choice';END IF;
 a:=public.create_restaurant_with_pending_claim(gen_random_uuid(),d||'{"street":"202 Other Avenue"}',current_setting('test.inline_contact')::jsonb,true);
 IF a->>'outcome'<>'created' OR a->'claim'->>'status'<>'pending' OR a->>'placeId'=current_setting('test.inline_place') THEN RAISE EXCEPTION 'Distinct branch creation failed';END IF;
END $$;
RESET ROLE;
SELECT 'inline restaurant onboarding live-schema rollback gate passed' AS result;
ROLLBACK;
