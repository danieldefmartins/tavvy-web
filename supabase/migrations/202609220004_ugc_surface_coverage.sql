-- Dependencies: cruise catalog 001, cruise taps 002, UGC 003.
-- Reversible moderation: no deletion. Personal blocks preserve global evidence;
-- staff-hidden typed reports are excluded from public evidence until restored.
BEGIN;
ALTER TABLE public.community_reports DROP CONSTRAINT community_reports_content_kind_check;
ALTER TABLE public.community_reports ADD CONSTRAINT community_reports_content_kind_check CHECK(content_kind IN('universe_review','event_review','civic_question','cruise_visit','place_photo','ecard_endorsement','ecard'));
ALTER TABLE public.community_hidden_content DROP CONSTRAINT community_hidden_content_content_kind_check;
ALTER TABLE public.community_hidden_content ADD CONSTRAINT community_hidden_content_content_kind_check CHECK(content_kind IN('universe_review','event_review','civic_question','cruise_visit','place_photo','ecard_endorsement','ecard'));
CREATE OR REPLACE FUNCTION public.resolve_safety_content(p_kind text,p_content_id uuid)
RETURNS TABLE(author_id uuid,place_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF p_kind='place_review' THEN
  RETURN QUERY SELECT r.user_id,r.place_id FROM public.place_reviews r WHERE r.id=p_content_id AND r.status='live';
 ELSIF p_kind='story' THEN
  RETURN QUERY SELECT s.user_id,s.place_id FROM public.place_stories s WHERE s.id=p_content_id AND s.status='active' AND(s.expires_at>now() OR(s.story_kind='owner_highlight' AND s.is_permanent));
 ELSIF p_kind='universe_review' THEN
  RETURN QUERY SELECT r.user_id,NULL::uuid FROM public.universe_reviews r JOIN public.atlas_universes u ON u.id=r.universe_id WHERE r.id=p_content_id AND u.status='published';
 ELSIF p_kind='event_review' THEN
  RETURN QUERY SELECT r.user_id,NULL::uuid FROM public.event_reviews r WHERE r.id=p_content_id AND r.status='live';
 ELSIF p_kind='civic_question' THEN
  RETURN QUERY SELECT q.user_id,NULL::uuid FROM public.civic_questions q JOIN public.digital_cards c ON c.id=q.card_id WHERE q.id=p_content_id AND q.is_visible=true AND q.status='approved' AND c.is_published=true AND c.is_active=true;
 ELSIF p_kind='cruise_visit' THEN
  RETURN QUERY SELECT v.user_id,NULL::uuid FROM public.universe_visits v WHERE v.id=p_content_id AND v.status='live' AND public.cruise_universe_is_public(v.universe_id) AND public.community_content_visible('cruise_visit',v.id);
 ELSIF p_kind='place_photo' THEN
  RETURN QUERY SELECT coalesce(p.user_id,p.uploaded_by),p.place_id FROM public.place_photos p WHERE p.id=p_content_id AND p.status='live' AND public.community_content_visible('place_photo',p.id);
 ELSIF p_kind='ecard_endorsement' THEN
  RETURN QUERY SELECT e.endorser_id,NULL::uuid FROM public.ecard_endorsements e JOIN public.digital_cards c ON c.id=e.card_id WHERE e.id=p_content_id AND e.status IN('live','approved') AND c.is_published AND c.is_active AND public.community_content_visible('ecard',c.id) AND public.community_content_visible('ecard_endorsement',e.id);
 ELSIF p_kind='ecard' THEN
  RETURN QUERY SELECT c.user_id,NULL::uuid FROM public.digital_cards c WHERE c.id=p_content_id AND c.is_published AND c.is_active AND public.community_content_visible('ecard',c.id);
 ELSE RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='22023';
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_safety_content(text,uuid) FROM PUBLIC,anon,authenticated;


CREATE POLICY personal_photo_blocks ON public.place_photos AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(coalesce(user_id,uploaded_by)));
CREATE POLICY moderated_place_photos ON public.place_photos AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.community_content_visible('place_photo',id));
CREATE POLICY personal_endorsement_blocks ON public.ecard_endorsements AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(endorser_id));
CREATE POLICY moderated_endorsement_notes ON public.ecard_endorsements AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.community_content_visible('ecard_endorsement',id));
-- Owners retain private workspace access; public renderer separately checks visibility.
CREATE POLICY personal_ecard_blocks ON public.digital_cards AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));
CREATE POLICY moderated_ecards ON public.digital_cards AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(auth.uid()=user_id OR public.community_content_visible('ecard',id));

CREATE OR REPLACE FUNCTION public.get_cruise_universe_reviews_v1(p_universe_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 WITH visible AS(SELECT v.* FROM public.universe_visits v WHERE v.universe_id=p_universe_id AND v.status='live' AND NOT public.content_author_is_blocked(v.user_id) AND public.community_content_visible('cruise_visit',v.id)), page AS(
 SELECT v.id,v.sailing_date,v.public_note,c.name AS cabin_category_name,(SELECT jsonb_agg(jsonb_build_object('label',i.label,'category',i.signal_type,'intensity',t.intensity) ORDER BY i.sort_order,i.id) FROM public.universe_visit_taps t JOIN public.review_items i ON i.id=t.signal_id WHERE t.visit_id=v.id) AS signals
 FROM visible v LEFT JOIN public.cruise_cabin_categories c ON c.id=v.cabin_category_id ORDER BY v.sailing_date DESC,v.id LIMIT greatest(1,least(coalesce(p_limit,20),50)) OFFSET greatest(0,coalesce(p_offset,0)))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM visible),'reviews',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY sailing_date DESC,id) FROM page),'[]'::jsonb)) WHERE public.cruise_universe_is_public(p_universe_id);
$$;

-- Current viewer state with no private owner/endorser IDs or endorsement location metadata.
CREATE FUNCTION public.get_public_ecard_safety_v1(p_card_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE c public.digital_cards%ROWTYPE; notes jsonb;
BEGIN
 SELECT * INTO c FROM public.digital_cards WHERE id=p_card_id AND is_published AND is_active;
 IF NOT FOUND OR NOT public.community_content_visible('ecard',p_card_id) OR public.content_author_is_blocked(c.user_id) THEN RETURN jsonb_build_object('visible',false,'endorsements','[]'::jsonb);END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q."createdAt" DESC,q.id),'[]'::jsonb) INTO notes FROM(
  SELECT e.id,coalesce(nullif(p.display_name,''),nullif(p.username,''),'Tavvy member') AS "endorserName",e.public_note AS note,e.created_at AS "createdAt"
  FROM public.ecard_endorsements e LEFT JOIN LATERAL(SELECT display_name,username FROM public.profiles WHERE user_id=e.endorser_id LIMIT 1)p ON true
  WHERE e.card_id=p_card_id AND e.status IN('live','approved') AND nullif(btrim(e.public_note),'') IS NOT NULL AND NOT public.content_author_is_blocked(e.endorser_id) AND public.community_content_visible('ecard_endorsement',e.id)
  ORDER BY e.created_at DESC,e.id LIMIT 5)q;
 RETURN jsonb_build_object('visible',true,'endorsements',notes);
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_ecard_safety_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_ecard_safety_v1(uuid) TO anon,authenticated;

-- One service-only snapshot powers the queue. No record body is exposed by public RPCs.
CREATE FUNCTION public.admin_safety_content_snapshot(p_kind text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE item jsonb;
BEGIN
 IF p_kind='universe_review' THEN SELECT jsonb_build_object('text',text) INTO item FROM public.universe_reviews WHERE id=p_id;
 ELSIF p_kind='event_review' THEN SELECT jsonb_build_object('text',public_note) INTO item FROM public.event_reviews WHERE id=p_id;
 ELSIF p_kind='civic_question' THEN SELECT jsonb_build_object('text',question_text) INTO item FROM public.civic_questions WHERE id=p_id;
 ELSIF p_kind='cruise_visit' THEN SELECT jsonb_build_object('text',public_note,'context',sailing_date::text) INTO item FROM public.universe_visits WHERE id=p_id;
 ELSIF p_kind='place_photo' THEN SELECT jsonb_build_object('text',caption,'mediaUrl',url,'context','Place photo') INTO item FROM public.place_photos WHERE id=p_id;
 ELSIF p_kind='ecard_endorsement' THEN SELECT jsonb_build_object('text',public_note,'context','Public eCard endorsement') INTO item FROM public.ecard_endorsements WHERE id=p_id;
 ELSIF p_kind='ecard' THEN SELECT jsonb_build_object('text',full_name,'context','Entire public eCard, including owner-curated testimonials and media','publicPath','/'||slug) INTO item FROM public.digital_cards WHERE id=p_id;
 END IF;
 RETURN coalesce(item||jsonb_build_object('exists',true),jsonb_build_object('exists',false));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_safety_content_snapshot(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_safety_content_snapshot(text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_get_community_reports_v1(p_status text DEFAULT 'pending',p_offset integer DEFAULT 0,p_limit integer DEFAULT 50) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server administration required' USING ERRCODE='42501';END IF;
 IF p_status NOT IN('pending','reviewed','resolved','dismissed','all') OR p_status IS NULL THEN RAISE EXCEPTION 'Invalid report status';END IF;
 WITH selected AS(SELECT * FROM public.community_reports WHERE p_status='all' OR status=p_status ORDER BY created_at,id LIMIT greatest(1,least(coalesce(p_limit,50),100)) OFFSET greatest(0,coalesce(p_offset,0)))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM public.community_reports WHERE p_status='all' OR status=p_status),'reports',coalesce(jsonb_agg(to_jsonb(s)||public.admin_safety_content_snapshot(s.content_kind,s.content_id)||jsonb_build_object('hidden',NOT public.community_content_visible(s.content_kind,s.content_id)) ORDER BY s.created_at,s.id),'[]'::jsonb)) INTO result FROM selected s;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.admin_moderate_community_report_v1(p_report_id uuid,p_action text,p_actor text,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r public.community_reports%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server administration required' USING ERRCODE='42501';END IF;
 IF p_action IS NULL OR p_action NOT IN('hide','dismiss','restore') OR nullif(btrim(p_actor),'') IS NULL OR length(p_actor)>200 OR length(p_notes)>4000 THEN RAISE EXCEPTION 'Invalid moderation request' USING ERRCODE='22023';END IF;
 SELECT * INTO r FROM public.community_reports WHERE id=p_report_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002';END IF;
 IF p_action IN('hide','restore') AND (public.admin_safety_content_snapshot(r.content_kind,r.content_id)->>'exists')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Original content is no longer available' USING ERRCODE='P0002';END IF;
 IF p_action='hide' THEN
  INSERT INTO public.community_hidden_content(content_kind,content_id) VALUES(r.content_kind,r.content_id) ON CONFLICT DO NOTHING;
 ELSIF p_action='restore' THEN
  DELETE FROM public.community_hidden_content WHERE content_kind=r.content_kind AND content_id=r.content_id;
 END IF;
 UPDATE public.community_reports SET status=CASE WHEN p_action='hide' THEN 'resolved' ELSE 'dismissed' END,admin_notes=p_notes,updated_at=now()
 WHERE content_kind=r.content_kind AND content_id=r.content_id AND (p_action IN('hide','restore') OR status='pending' OR id=r.id);
 INSERT INTO public.community_moderation_actions(report_id,action,admin_actor,notes)VALUES(r.id,p_action,p_actor,p_notes);
 RETURN jsonb_build_object('updated',true,'reportId',r.id);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_moderate_community_report_v1(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_community_report_v1(uuid,text,text,text) TO service_role;

-- Keep a moderated/blocked uploaded photo from reappearing as a denormalized cover.
CREATE FUNCTION public.get_place_photo_safety_v1(p_place_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cover text; photos jsonb;
BEGIN
 SELECT cover_image_url INTO cover FROM public.places WHERE id=p_place_id;
 IF cover IS NOT NULL AND EXISTS(SELECT 1 FROM public.place_photos WHERE place_id=p_place_id AND url=cover)
 AND NOT EXISTS(SELECT 1 FROM public.place_photos p WHERE p.place_id=p_place_id AND p.url=cover AND p.status='live' AND public.community_content_visible('place_photo',p.id) AND NOT public.content_author_is_blocked(coalesce(p.user_id,p.uploaded_by))) THEN cover:=NULL;END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.is_cover DESC,q.created_at DESC,q.id),'[]'::jsonb) INTO photos FROM(
  SELECT p.id,p.url,p.caption,p.created_at,p.is_cover FROM public.place_photos p WHERE p.place_id=p_place_id AND p.status='live' AND public.community_content_visible('place_photo',p.id) AND NOT public.content_author_is_blocked(coalesce(p.user_id,p.uploaded_by))
  ORDER BY p.is_cover DESC,p.created_at DESC,p.id LIMIT 100)q;
 RETURN jsonb_build_object('cover',cover,'photos',photos);
END;
$$;
REVOKE ALL ON FUNCTION public.get_place_photo_safety_v1(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_photo_safety_v1(uuid) TO anon,authenticated;
-- Both existing API (service client) and legacy direct clients must submit a real,
-- active author to a currently public card. No provider call or paid action.
CREATE FUNCTION public.guard_public_endorsement_submission() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE owner_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=NEW.endorser_id AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())) THEN RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';END IF;
 IF auth.role()='authenticated' AND auth.uid() IS DISTINCT FROM NEW.endorser_id THEN RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';END IF;
 SELECT user_id INTO owner_id FROM public.digital_cards WHERE id=NEW.card_id AND is_published AND is_active AND public.community_content_visible('ecard',id);
 IF NOT FOUND OR owner_id IS NULL THEN RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 IF owner_id=NEW.endorser_id OR NEW.card_owner_id IS DISTINCT FROM owner_id OR length(NEW.public_note)>4000 THEN RAISE EXCEPTION 'Invalid endorsement' USING ERRCODE='22023';END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_public_endorsement_submission() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER public_endorsement_submission_guard BEFORE INSERT ON public.ecard_endorsements FOR EACH ROW EXECUTE FUNCTION public.guard_public_endorsement_submission();
CREATE OR REPLACE FUNCTION public.get_cruise_universe_evidence_v1(p_universe_id uuid,p_cursor bigint DEFAULT 0,p_snapshot text DEFAULT NULL,p_limit integer DEFAULT 500) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $body$
DECLARE v_snapshot text; v_visits jsonb; v_cursor bigint; v_complete boolean;
BEGIN
 IF NOT public.cruise_universe_is_public(p_universe_id) THEN RAISE EXCEPTION 'Ship not available'; END IF;
 SELECT md5(coalesce(string_agg(r.id::text,',' ORDER BY r.id),'')||':'||coalesce(max(v.updated_at)::text,'')) INTO v_snapshot FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live' AND public.community_content_visible('cruise_visit',v.id);
 IF p_snapshot IS NOT NULL AND p_snapshot<>v_snapshot THEN RAISE EXCEPTION 'Guest reports changed; retry the complete read' USING ERRCODE='40001'; END IF;
 WITH page AS (SELECT r.* FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live' AND public.community_content_visible('cruise_visit',v.id) AND r.id>greatest(0,coalesce(p_cursor,0)) ORDER BY r.id LIMIT greatest(1,least(coalesce(p_limit,500),500)))
 SELECT coalesce(jsonb_agg(jsonb_build_object('reviewId',visit_id,'userId',md5(user_id::text||':'||universe_id::text),'visitedAt',sailing_date::text||'T00:00:00.000Z','dateSource','reported','signals',signals) ORDER BY id),'[]'::jsonb),coalesce(max(id),p_cursor) INTO v_visits,v_cursor FROM page;
 v_complete:=NOT EXISTS(SELECT 1 FROM public.universe_visit_revisions r JOIN public.universe_visits v ON v.id=r.visit_id WHERE r.universe_id=p_universe_id AND v.status='live' AND public.community_content_visible('cruise_visit',v.id) AND r.id>v_cursor);
 RETURN jsonb_build_object('visits',v_visits,'next_cursor',v_cursor::text,'complete',v_complete,'snapshot',v_snapshot);
END $body$;
REVOKE ALL ON FUNCTION public.get_cruise_universe_evidence_v1(uuid,bigint,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cruise_universe_evidence_v1(uuid,bigint,text,integer) TO anon,authenticated;
-- Global endorsement totals ignore a viewer's personal blocks, but cannot count
-- an endorsement hidden by staff. A definer check avoids inheriting personal RLS.
CREATE FUNCTION public.ecard_endorsement_evidence_visible(p_endorsement_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM public.ecard_endorsements e JOIN public.digital_cards c ON c.id=e.card_id
 WHERE e.id=p_endorsement_id AND e.status IN('live','approved') AND c.is_published AND c.is_active
 AND public.community_content_visible('ecard_endorsement',e.id) AND public.community_content_visible('ecard',c.id));
$$;
REVOKE ALL ON FUNCTION public.ecard_endorsement_evidence_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ecard_endorsement_evidence_visible(uuid) TO anon,authenticated;
ALTER TABLE public.ecard_endorsement_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY moderated_endorsement_signal_evidence ON public.ecard_endorsement_signals AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.ecard_endorsement_evidence_visible(endorsement_id));
COMMIT;
