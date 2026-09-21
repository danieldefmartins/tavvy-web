-- Synthetic fixtures only; run after migration inside BEGIN ... ROLLBACK.
DO $$ BEGIN
 PERFORM set_config('test.extra_free',gen_random_uuid()::text,true);
 PERFORM set_config('test.extra_pro',gen_random_uuid()::text,true);
 PERFORM set_config('test.extra_draft',gen_random_uuid()::text,true);
 PERFORM set_config('test.extra_public',gen_random_uuid()::text,true);
 PERFORM set_config('test.extra_legacy',gen_random_uuid()::text,true);
 PERFORM set_config('test.extra_paid_card',gen_random_uuid()::text,true);
 IF (public.ecard_pro_extra_facts('{"pro_credentials":{"license":"","insured":false},"gallery_images":[],"videos":[],"form_block":{"enabled":false,"title":"Saved setup"}}')->>'has_extras')::boolean THEN RAISE EXCEPTION 'FAIL empty defaults treated as Pro content';END IF;
 IF NOT (public.ecard_pro_extra_facts('{"form_block":true}')->>'form')::boolean THEN RAISE EXCEPTION 'FAIL legacy enabled form not recognized';END IF;
 IF NOT (public.ecard_pro_extra_facts('{"pro_credentials":{"license":"ABC"}}')->>'credentials')::boolean THEN RAISE EXCEPTION 'FAIL credentials not recognized';END IF;
 IF (public.ecard_pro_extra_facts('{"pro_credentials":{"id":"metadata","enabled":true,"sort_order":1},"gallery_images":[{}],"videos":[{"id":"empty"}]}')->>'has_extras')::boolean THEN RAISE EXCEPTION 'FAIL metadata or empty media treated as Pro content';END IF;
 IF NOT (public.ecard_pro_extra_facts('{"form_block":{}}')->>'form')::boolean THEN RAISE EXCEPTION 'FAIL existing default form not recognized';END IF;
 IF NOT (public.ecard_pro_extra_facts('{"pro_credentials":{"license":"0"}}')->>'credentials')::boolean THEN RAISE EXCEPTION 'FAIL text license value lost';END IF;
END $$;
INSERT INTO auth.users(id,email,role,aud)
SELECT current_setting(s)::uuid,'ecard-extra-'||current_setting(s)||'@example.invalid','authenticated','authenticated'
FROM (VALUES('test.extra_free'),('test.extra_pro')) x(s);
INSERT INTO public.user_roles(user_id,role,notes,granted_at)
VALUES(current_setting('test.extra_pro')::uuid,'pro','Rollback eCard extras fixture',now());
INSERT INTO public.digital_cards(id,user_id,slug,full_name,is_active,is_published,template_id,theme)
SELECT current_setting(s)::uuid,current_setting('test.extra_free')::uuid,'extra-'||current_setting(s),'Free regression card',true,published,'basic','classic'
FROM (VALUES('test.extra_draft',false),('test.extra_public',true),('test.extra_legacy',true)) x(s,published);
INSERT INTO public.digital_cards(id,user_id,slug,full_name,is_active,is_published,template_id,theme)
VALUES(current_setting('test.extra_paid_card')::uuid,current_setting('test.extra_pro')::uuid,'extra-'||current_setting('test.extra_paid_card'),'Pro regression card',true,false,'basic','classic');
-- Trusted fixture setup represents content published before the new rule.
UPDATE public.digital_cards SET
 gallery_images='[{"id":"existing","uri":"https://example.invalid/existing.jpg","caption":"Before","retained":"metadata"}]',
 videos='[{"type":"youtube","url":"https://example.invalid/existing-video","title":"Before"}]',
 form_block='{"enabled":true,"formType":"native","title":"Before"}',
 pro_credentials='{"license":"Existing license"}'
WHERE id=current_setting('test.extra_legacy')::uuid;

SET LOCAL ROLE authenticated;
DO $$ DECLARE statement text; v_id uuid:=current_setting('test.extra_public')::uuid; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.extra_free'),'role','authenticated')::text,true);
 IF (public.get_my_ecard_entitlement()->>'is_pro')::boolean THEN RAISE EXCEPTION 'FAIL Free fixture unexpectedly entitled';END IF;
 UPDATE public.digital_cards SET pro_credentials='{"id":"metadata","enabled":true,"sort_order":1}',gallery_images='[{}]',videos='[{"id":"empty"}]' WHERE id=v_id;
 -- Existing published cards may not add a new paid feature through autosave.
 FOREACH statement IN ARRAY ARRAY[
  'UPDATE public.digital_cards SET gallery_images=''[{"url":"https://example.invalid/new.jpg"}]'' WHERE id=$1',
  'UPDATE public.digital_cards SET videos=''[{"url":"https://example.invalid/new-video"}]'' WHERE id=$1',
  'UPDATE public.digital_cards SET youtube_video_id=''newvideo123'' WHERE id=$1',
  'UPDATE public.digital_cards SET form_block=''true'' WHERE id=$1',
  'UPDATE public.digital_cards SET form_block=''{}'' WHERE id=$1',
  'UPDATE public.digital_cards SET pro_credentials=''{"license":"New license"}'' WHERE id=$1'
 ] LOOP
  BEGIN EXECUTE statement USING v_id;RAISE EXCEPTION 'FAIL Free published card added a Pro extra';
  EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 END LOOP;
 -- Private draft content remains saved, but publication must succeed only with Pro.
 UPDATE public.digital_cards SET gallery_images='[{"url":"https://example.invalid/draft.jpg"}]' WHERE id=current_setting('test.extra_draft')::uuid;
 BEGIN UPDATE public.digital_cards SET is_published=true WHERE id=current_setting('test.extra_draft')::uuid;
  RAISE EXCEPTION 'FAIL Free draft with extras published';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards WHERE id=current_setting('test.extra_draft')::uuid AND is_published=false AND jsonb_array_length(gallery_images)=1) THEN RAISE EXCEPTION 'FAIL rejected publication changed draft content';END IF;
 UPDATE public.digital_cards SET gallery_images='[]',pro_credentials='{"license":"","insured":false}',form_block='{"enabled":false,"title":"Preserved configuration"}' WHERE id=current_setting('test.extra_draft')::uuid;
 UPDATE public.digital_cards SET is_published=true WHERE id=current_setting('test.extra_draft')::uuid;
 -- Existing published content survives unrelated and metadata-only edits.
 UPDATE public.digital_cards SET full_name='Updated free name',
 gallery_images='[{"id":"existing","uri":"https://example.invalid/existing.jpg","caption":"After","retained":"metadata"}]',
 videos='[{"type":"youtube","url":"https://example.invalid/existing-video","title":"After"}]',
 form_block='{"enabled":true,"formType":"native","title":"After"}',
 pro_credentials='{"license":"Updated existing license"}'
 WHERE id=current_setting('test.extra_legacy')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards WHERE id=current_setting('test.extra_legacy')::uuid AND is_published=true AND gallery_images->0->>'caption'='After') THEN RAISE EXCEPTION 'FAIL existing published content could not be retained';END IF;
 BEGIN UPDATE public.digital_cards SET gallery_images=gallery_images||'[{"url":"https://example.invalid/addition.jpg"}]' WHERE id=current_setting('test.extra_legacy')::uuid;
  RAISE EXCEPTION 'FAIL added media to legacy Free gallery';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 UPDATE public.digital_cards SET gallery_images='[]',videos='[]',form_block=jsonb_set(form_block,'{enabled}','false'),pro_credentials='{}' WHERE id=current_setting('test.extra_legacy')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards WHERE id=current_setting('test.extra_legacy')::uuid AND is_published=true AND form_block->>'title'='After') THEN RAISE EXCEPTION 'FAIL hiding extras unpublished card or erased form setup';END IF;
 -- Paid owner can publish and add all four extras. Ownership restrictions remain.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.extra_pro'),'role','authenticated')::text,true);
 IF NOT (public.get_my_ecard_entitlement()->>'is_pro')::boolean THEN RAISE EXCEPTION 'FAIL Pro fixture not entitled';END IF;
 UPDATE public.digital_cards SET gallery_images='[{"url":"https://example.invalid/paid.jpg"}]',videos='[{"url":"https://example.invalid/paid-video"}]',youtube_video_id='paidvid1234',form_block='true',pro_credentials='{"license":"Paid license"}',is_published=true WHERE id=current_setting('test.extra_paid_card')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards WHERE id=current_setting('test.extra_paid_card')::uuid AND is_published=true) THEN RAISE EXCEPTION 'FAIL Pro extras publication failed';END IF;
 UPDATE public.digital_cards SET full_name='Wrong owner' WHERE id=current_setting('test.extra_public')::uuid;
 IF FOUND THEN RAISE EXCEPTION 'FAIL Pro owner edited another card';END IF;
END $$;
RESET ROLE;
