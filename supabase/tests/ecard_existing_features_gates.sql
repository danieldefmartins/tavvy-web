-- Synthetic fixtures only. Execute inside BEGIN ... ROLLBACK.
DO $$ BEGIN
 PERFORM set_config('test.ecard_owner',gen_random_uuid()::text,true);
 PERFORM set_config('test.ecard_other',gen_random_uuid()::text,true);
 PERFORM set_config('test.ecard_card',gen_random_uuid()::text,true);
 PERFORM set_config('test.ecard_other_card',gen_random_uuid()::text,true);
 PERFORM set_config('test.ecard_link',gen_random_uuid()::text,true);
 PERFORM set_config('test.ecard_other_link',gen_random_uuid()::text,true);
END $$;
INSERT INTO auth.users(id,email,role,aud) SELECT current_setting(s)::uuid,'ecard-gate-'||current_setting(s)||'@example.invalid','authenticated','authenticated' FROM (VALUES ('test.ecard_owner'),('test.ecard_other')) x(s);
INSERT INTO public.digital_cards(id,user_id,slug,full_name,is_active,is_published,template_id,theme) VALUES
(current_setting('test.ecard_card')::uuid,current_setting('test.ecard_owner')::uuid,'gate-'||current_setting('test.ecard_card'),'Rollback eCard',true,false,'basic','classic'),
(current_setting('test.ecard_other_card')::uuid,current_setting('test.ecard_other')::uuid,'gate-'||current_setting('test.ecard_other_card'),'Other rollback eCard',true,false,'basic','classic');
INSERT INTO public.digital_card_links(id,card_id,platform,title,url,sort_order,is_active) VALUES
(current_setting('test.ecard_link')::uuid,current_setting('test.ecard_card')::uuid,'website','Original link','https://example.invalid/original',0,false),
(current_setting('test.ecard_other_link')::uuid,current_setting('test.ecard_other_card')::uuid,'website','Other card link','https://example.invalid/other',0,true);
CREATE FUNCTION public.tavvy_ecard_atomic_rollback_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF new.card_id::text=current_setting('test.ecard_card',true) AND new.platform='force_rollback_fixture' THEN RAISE EXCEPTION 'forced insert failure for rollback proof'; END IF;RETURN new;
END $$;
CREATE TRIGGER tavvy_ecard_atomic_rollback_test BEFORE INSERT ON public.digital_card_links FOR EACH ROW EXECUTE FUNCTION public.tavvy_ecard_atomic_rollback_test();
SET LOCAL ROLE authenticated;
DO $$ DECLARE v_card_id uuid:=current_setting('test.ecard_card')::uuid; link_id uuid:=current_setting('test.ecard_link')::uuid; before_links jsonb; after_links jsonb; BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.ecard_owner'),'role','authenticated')::text,true);
 UPDATE public.digital_cards SET pronouns='they/them',description='Existing specialties',business_type='Bakery',background_type='solid',form_block='{"enabled":true,"title":"Contact me","fields":[{"id":"email","required":true}]}'::jsonb WHERE id=v_card_id;
 IF NOT EXISTS(SELECT 1 FROM public.digital_cards c WHERE c.id=v_card_id AND c.pronouns='they/them' AND c.description='Existing specialties' AND c.business_type='Bakery' AND c.form_block->>'title'='Contact me') THEN RAISE EXCEPTION 'FAIL existing profile fields not saved';END IF;
 PERFORM public.replace_ecard_links(v_card_id,jsonb_build_array(jsonb_build_object('id',link_id,'platform','website','title','Renamed link','url','https://example.invalid/renamed','value','https://example.invalid/renamed','is_active',false)));
 IF NOT EXISTS(SELECT 1 FROM public.digital_card_links l WHERE l.id=link_id AND l.title='Renamed link' AND l.is_active=false) THEN RAISE EXCEPTION 'FAIL stable ID or inactive state lost';END IF;
 SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) INTO before_links FROM public.digital_card_links l WHERE l.card_id=v_card_id;
 BEGIN
  PERFORM public.replace_ecard_links(v_card_id,'[{"platform":"force_rollback_fixture","title":"Should never replace","url":"https://example.invalid/fail"}]'::jsonb);
  RAISE EXCEPTION 'FAIL forced insert unexpectedly succeeded';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'forced insert failure for rollback proof' THEN RAISE;END IF;
 END;
 SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) INTO after_links FROM public.digital_card_links l WHERE l.card_id=v_card_id;
 IF before_links IS DISTINCT FROM after_links THEN RAISE EXCEPTION 'FAIL old links changed after insertion failed';END IF;
 BEGIN PERFORM public.replace_ecard_links(v_card_id,jsonb_build_array(jsonb_build_object('id',current_setting('test.ecard_other_link'),'platform','website')));RAISE EXCEPTION 'FAIL cross-card link accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.ecard_other'),'role','authenticated')::text,true);
 BEGIN PERFORM public.replace_ecard_links(v_card_id,'[]'::jsonb);RAISE EXCEPTION 'FAIL another owner edited links';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 UPDATE public.digital_cards SET pronouns='unauthorized' WHERE id=v_card_id;
 IF FOUND THEN RAISE EXCEPTION 'FAIL another user changed profile fields';END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
 BEGIN PERFORM public.replace_ecard_links(current_setting('test.ecard_card')::uuid,'[]'::jsonb);RAISE EXCEPTION 'FAIL anonymous edited links';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 IF EXISTS(SELECT 1 FROM public.digital_cards WHERE id=current_setting('test.ecard_card')::uuid) THEN RAISE EXCEPTION 'FAIL anonymous saw draft';END IF;
END $$;
RESET ROLE;
