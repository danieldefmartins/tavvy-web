-- Run against a reviewed test database or via a trusted SQL connection.
-- The transaction ALWAYS rolls back: no test account/place/claim survives.
BEGIN;
SELECT set_config('test.owner',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true),set_config('test.place',gen_random_uuid()::text,true);
INSERT INTO auth.users(id,email,role,aud) VALUES(current_setting('test.owner')::uuid,'owner-'||current_setting('test.owner')||'@example.invalid','authenticated','authenticated'),(current_setting('test.other')::uuid,'other-'||current_setting('test.other')||'@example.invalid','authenticated','authenticated');
INSERT INTO public.places(id,source_type,source_id,name,is_active) VALUES(current_setting('test.place')::uuid,'user',current_setting('test.place'),'Restaurant ownership rollback test',true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
DO $$ DECLARE a jsonb; b jsonb; BEGIN
 a:=public.submit_restaurant_claim(current_setting('test.place')::uuid,'Test Owner','Owner','owner@example.invalid','6175550100',true);
 b:=public.submit_restaurant_claim(current_setting('test.place')::uuid,'Test Owner','Owner','owner@example.invalid','6175550100',true);
 IF a->>'id' IS DISTINCT FROM b->>'id' OR a->>'status'<>'pending' THEN RAISE EXCEPTION 'Claim submission must be pending and idempotent'; END IF;
 PERFORM set_config('test.claim',a->>'id',true);
 IF public.has_verified_restaurant_claim(current_setting('test.place')::uuid) THEN RAISE EXCEPTION 'Pending claim granted management'; END IF;
 IF public.get_restaurant_owner_workspace(current_setting('test.place')::uuid)->>'canManage'<>'false' THEN RAISE EXCEPTION 'Pending workspace unlocked'; END IF;
 BEGIN PERFORM public.save_restaurant_owner_details(current_setting('test.place')::uuid,'{"phone":"6175550100","website":"https://example.com","description":"pending attack"}'); RAISE EXCEPTION 'Pending edit allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.review_restaurant_claim((a->>'id')::uuid,true,'Self approval must never work'); RAISE EXCEPTION 'Self approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.submit_restaurant_claim(current_setting('test.place')::uuid,'Test Owner','Owner','invalid','6175550100',true); RAISE EXCEPTION 'Invalid email accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;

-- Another account cannot read the private claim or see its management data.
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.pro_business_claims WHERE id=current_setting('test.claim')::uuid) THEN RAISE EXCEPTION 'Private claim leaked to another user'; END IF;
 IF public.get_restaurant_owner_workspace(current_setting('test.place')::uuid)->'claim' <> 'null'::jsonb THEN RAISE EXCEPTION 'Workspace leaked claim'; END IF;
END $$;

RESET ROLE;
-- A legacy verified Pros row alone does not count as ownership proof.
UPDATE public.pro_business_claims SET status='verified',verified_at=now() WHERE id=current_setting('test.claim')::uuid;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
DO $$ BEGIN IF public.has_verified_restaurant_claim(current_setting('test.place')::uuid) THEN RAISE EXCEPTION 'Legacy verified flag granted ownership'; END IF; END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT public.review_restaurant_claim(current_setting('test.claim')::uuid,true,'Test fixture approval, rolls back with this transaction.');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
DO $$ BEGIN
 IF NOT public.has_verified_restaurant_claim(current_setting('test.place')::uuid) THEN RAISE EXCEPTION 'Verified owner is still locked out'; END IF;
 IF public.get_restaurant_owner_workspace(current_setting('test.place')::uuid)->>'canManage'<>'true' THEN RAISE EXCEPTION 'Verified workspace is locked'; END IF;
 PERFORM public.save_restaurant_owner_details(current_setting('test.place')::uuid,'{"phone":"6175550100","website":"https://example.com","description":"Confirmed owner change"}');
 IF NOT EXISTS(SELECT 1 FROM public.places WHERE id=current_setting('test.place')::uuid AND description='Confirmed owner change') THEN RAISE EXCEPTION 'Confirmed edit not persisted'; END IF;
 BEGIN PERFORM public.save_restaurant_owner_details(current_setting('test.place')::uuid,'{"phone":"6175550100","website":"javascript:alert(1)","description":"bad link"}'); RAISE EXCEPTION 'Unsafe website accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'restaurant owner gates passed; fixture changes rolled back' AS result;
ROLLBACK;
