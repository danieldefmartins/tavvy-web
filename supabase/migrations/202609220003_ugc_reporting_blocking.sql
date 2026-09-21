-- Reviewed-source candidate only. No production application during preparation.
-- Personal blocks filter text/media feeds, never global place evidence.
BEGIN;
CREATE TABLE public.community_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 content_kind text NOT NULL CHECK(content_kind IN ('universe_review','event_review','civic_question')),
 content_id uuid NOT NULL,
 reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(reason IN ('spam','fake','offensive','harassment','wrong_place','conflict_of_interest','sexual','violent','other')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','resolved','dismissed')),
 admin_notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(content_kind,content_id,reporter_id)
);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_reports FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_reports TO service_role;

CREATE OR REPLACE FUNCTION public.content_author_is_blocked(p_author uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT auth.uid() IS NOT NULL AND p_author IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.blocked_users WHERE blocker_id=auth.uid() AND blocked_id=p_author
 );
$$;
REVOKE ALL ON FUNCTION public.content_author_is_blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.content_author_is_blocked(uuid) TO anon,authenticated,service_role;

-- Re-check server identity: a JWT can outlive a deleted or banned account.
CREATE OR REPLACE FUNCTION public.require_content_safety_actor()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid();
BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())) THEN
  RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';
 END IF;
 RETURN u;
END;
$$;
REVOKE ALL ON FUNCTION public.require_content_safety_actor() FROM PUBLIC,anon,authenticated;

-- Never accept a caller's assertion about a content author's identity.
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
 ELSE RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='22023';
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_safety_content(text,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.report_content_v1(p_kind text,p_content_id uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_uid uuid:=public.require_content_safety_actor();v_author uuid;v_place uuid;v_report uuid;v_reason text;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';END IF;
 IF p_reason IS NULL OR p_reason NOT IN ('spam','fake','offensive','harassment','wrong_place','conflict_of_interest','sexual','violent','other') THEN RAISE EXCEPTION 'SAFETY_REASON_INVALID' USING ERRCODE='22023';END IF;
 SELECT author_id,place_id INTO v_author,v_place FROM public.resolve_safety_content(p_kind,p_content_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('content-report:'||v_uid::text||':'||p_kind||':'||p_content_id::text,0));
 IF p_kind='place_review' THEN
  SELECT id INTO v_report FROM public.review_reports WHERE review_id=p_content_id::text AND reporter_id=v_uid ORDER BY created_at,id LIMIT 1;
  IF v_report IS NULL THEN
   v_reason:=CASE WHEN p_reason IN('sexual','violent') THEN 'offensive' ELSE p_reason END;
   INSERT INTO public.review_reports(review_id,place_id,reporter_id,reason,status) VALUES(p_content_id::text,v_place::text,v_uid,v_reason,'pending') RETURNING id INTO v_report;
  END IF;
 ELSIF p_kind='story' THEN
  SELECT id INTO v_report FROM public.story_reports WHERE story_id=p_content_id AND reporter_user_id=v_uid ORDER BY created_at,id LIMIT 1;
  IF v_report IS NULL THEN
   v_reason:=CASE WHEN p_reason='offensive' THEN 'explicit' WHEN p_reason IN('fake','wrong_place','conflict_of_interest') THEN 'other' ELSE p_reason END;
   INSERT INTO public.story_reports(story_id,reporter_user_id,reason) VALUES(p_content_id,v_uid,v_reason) RETURNING id INTO v_report;
  END IF;
 ELSE
  INSERT INTO public.community_reports(content_kind,content_id,reporter_id,reason) VALUES(p_kind,p_content_id,v_uid,p_reason)
   ON CONFLICT(content_kind,content_id,reporter_id) DO UPDATE SET reporter_id=EXCLUDED.reporter_id RETURNING id INTO v_report;
 END IF;
 RETURN jsonb_build_object('submitted',true,'reportId',v_report);
END;
$$;
REVOKE ALL ON FUNCTION public.report_content_v1(text,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.report_content_v1(text,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.block_content_author_v1(p_kind text,p_content_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_uid uuid:=public.require_content_safety_actor();v_author uuid;v_block uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'SAFETY_AUTH_REQUIRED' USING ERRCODE='42501';END IF;
 SELECT author_id INTO v_author FROM public.resolve_safety_content(p_kind,p_content_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'SAFETY_CONTENT_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 IF v_author IS NULL THEN RAISE EXCEPTION 'SAFETY_AUTHOR_UNAVAILABLE' USING ERRCODE='22023';END IF;
 IF v_author=v_uid THEN RAISE EXCEPTION 'SAFETY_SELF_BLOCK' USING ERRCODE='22023';END IF;
 INSERT INTO public.blocked_users(blocker_id,blocked_id) VALUES(v_uid,v_author)
  ON CONFLICT(blocker_id,blocked_id) DO UPDATE SET blocker_id=EXCLUDED.blocker_id RETURNING id INTO v_block;
 RETURN jsonb_build_object('blocked',true,'blockId',v_block);
END;
$$;
REVOKE ALL ON FUNCTION public.block_content_author_v1(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.block_content_author_v1(text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_content_blocks_v1()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM public.require_content_safety_actor();
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',b.id,'displayName',coalesce(nullif(p.display_name,''),nullif(p.username,''),'Tavvy member'),'createdAt',b.created_at) ORDER BY b.created_at DESC,b.id),'[]'::jsonb)
 FROM public.blocked_users b LEFT JOIN LATERAL(SELECT display_name,username FROM public.profiles WHERE user_id=b.blocked_id LIMIT 1)p ON true WHERE b.blocker_id=auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_content_blocks_v1() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_content_blocks_v1() TO authenticated;
CREATE OR REPLACE FUNCTION public.unblock_content_author_v1(p_block_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM public.require_content_safety_actor();
 DELETE FROM public.blocked_users WHERE id=p_block_id AND blocker_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'SAFETY_BLOCK_UNAVAILABLE' USING ERRCODE='P0002';END IF;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.unblock_content_author_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.unblock_content_author_v1(uuid) TO authenticated;

-- Restrictive read gates compose with existing visibility and ownership policies.
-- SECURITY DEFINER aggregate evidence reads remain global and untouched.
CREATE POLICY personal_review_blocks ON public.place_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));
CREATE POLICY personal_story_blocks ON public.place_stories AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));
CREATE POLICY personal_universe_review_blocks ON public.universe_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));
CREATE POLICY personal_event_review_blocks ON public.event_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));
CREATE POLICY personal_civic_question_blocks ON public.civic_questions AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.content_author_is_blocked(user_id));

-- History is a personal content feed, distinct from aggregate evidence.
CREATE OR REPLACE FUNCTION public.get_place_review_history(p_place_id uuid, p_offset integer DEFAULT 0, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
  WITH revisions AS (
    SELECT v.id::text AS id,v.review_id,v.user_id,v.visited_at,v.date_source,v.recorded_at,v.public_note,v.signals,
      row_number() OVER(PARTITION BY v.review_id ORDER BY v.id)>1 AS is_edit
    FROM public.place_review_revisions v JOIN public.place_reviews r ON r.id=v.review_id AND r.status='live'
    WHERE v.place_id=p_place_id AND NOT public.content_author_is_blocked(v.user_id)
    UNION ALL
    SELECT 'legacy:'||r.id::text,r.id,r.user_id,coalesce(r.visited_at,r.created_at),r.visit_date_source,r.created_at,r.public_note,
      NULL::jsonb AS signals,false
    FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.status='live' AND NOT public.content_author_is_blocked(r.user_id)
      AND NOT EXISTS(SELECT 1 FROM public.place_review_revisions v WHERE v.review_id=r.id AND v.place_id=r.place_id)
  ), page AS (
    SELECT * FROM revisions ORDER BY visited_at DESC,recorded_at DESC,id DESC
    LIMIT greatest(1,least(coalesce(p_limit,20),50)) OFFSET greatest(0,coalesce(p_offset,0))
  )
  SELECT jsonb_build_object('total',(SELECT count(*) FROM revisions),'reviews',coalesce((SELECT jsonb_agg(
    jsonb_build_object('id',id,'review_id',review_id,'user_id',user_id,'visited_at',visited_at,
      'date_source',date_source,'recorded_at',recorded_at,'is_edit',is_edit,'public_note',public_note,'signals',
      coalesce(signals,(SELECT jsonb_agg(jsonb_build_object('slug',ri.slug,'label',ri.label,
        'category',CASE ri.signal_type WHEN 'best_for' THEN 'good' WHEN 'vibe' THEN 'vibe' ELSE 'headsup' END,'intensity',t.intensity) ORDER BY t.signal_id)
        FROM public.place_review_signal_taps t JOIN public.review_items ri ON ri.id=t.signal_id
        WHERE t.review_id=page.review_id AND t.place_id=p_place_id AND ri.signal_type IN ('best_for','vibe','heads_up')),'[]'::jsonb))
    ORDER BY visited_at DESC,recorded_at DESC,id DESC) FROM page),'[]'::jsonb))
$function$
;
-- A count is global evidence; it must not change with a viewer's personal block list.
CREATE OR REPLACE FUNCTION public.get_place_public_review_count(p_place_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT count(*)::integer FROM public.place_reviews WHERE place_id=p_place_id AND status='live';
$$;
REVOKE ALL ON FUNCTION public.get_place_public_review_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_public_review_count(uuid) TO anon,authenticated,service_role;
-- Legacy direct clients may submit only a live parent review with its true place.
CREATE POLICY canonical_review_report_target ON public.review_reports AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(
 EXISTS(SELECT 1 FROM public.place_reviews r WHERE r.id::text=review_id AND r.place_id::text=review_reports.place_id AND r.status='live')
);
-- Moderated community text remains stored for review, but is not publicly displayed.
CREATE TABLE public.community_hidden_content(
 content_kind text NOT NULL CHECK(content_kind IN('universe_review','event_review','civic_question')),
 content_id uuid NOT NULL,hidden_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(content_kind,content_id)
);
ALTER TABLE public.community_hidden_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_hidden_content FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_hidden_content TO service_role;
CREATE TABLE public.community_moderation_actions(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,report_id uuid NOT NULL REFERENCES public.community_reports(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action IN('hide','dismiss','restore')),admin_actor text NOT NULL,notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_moderation_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_moderation_actions FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_moderation_actions TO service_role;
CREATE OR REPLACE FUNCTION public.community_content_visible(p_kind text,p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.community_hidden_content WHERE content_kind=p_kind AND content_id=p_id);
$$;
REVOKE ALL ON FUNCTION public.community_content_visible(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_content_visible(text,uuid) TO anon,authenticated,service_role;
CREATE POLICY moderated_universe_comments ON public.universe_reviews AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.community_content_visible('universe_review',id));
CREATE POLICY moderated_event_comments ON public.event_reviews AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.community_content_visible('event_review',id));
CREATE POLICY moderated_civic_comments ON public.civic_questions AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.community_content_visible('civic_question',id));
CREATE OR REPLACE FUNCTION public.admin_get_community_reports_v1(p_status text DEFAULT 'pending',p_offset integer DEFAULT 0,p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server administration required' USING ERRCODE='42501';END IF;
 IF p_status NOT IN('pending','reviewed','resolved','dismissed','all') OR p_status IS NULL THEN RAISE EXCEPTION 'Invalid report status';END IF;
 WITH selected AS(SELECT * FROM public.community_reports WHERE p_status='all' OR status=p_status ORDER BY created_at,id LIMIT greatest(1,least(coalesce(p_limit,50),100)) OFFSET greatest(0,coalesce(p_offset,0)))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM public.community_reports WHERE p_status='all' OR status=p_status),'reports',coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object(
 'hidden',NOT public.community_content_visible(s.content_kind,s.content_id),
 'text',CASE s.content_kind WHEN 'universe_review' THEN(SELECT text FROM public.universe_reviews WHERE id=s.content_id) WHEN 'event_review' THEN(SELECT public_note FROM public.event_reviews WHERE id=s.content_id) WHEN 'civic_question' THEN(SELECT question_text FROM public.civic_questions WHERE id=s.content_id) END
 ) ORDER BY s.created_at,s.id),'[]'::jsonb)) INTO result FROM selected s;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_community_reports_v1(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_community_reports_v1(text,integer,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_moderate_community_report_v1(p_report_id uuid,p_action text,p_actor text,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r public.community_reports%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server administration required' USING ERRCODE='42501';END IF;
 IF p_action IS NULL OR p_action NOT IN('hide','dismiss','restore') OR nullif(btrim(p_actor),'') IS NULL OR length(p_actor)>200 OR length(p_notes)>4000 THEN RAISE EXCEPTION 'Invalid moderation request' USING ERRCODE='22023';END IF;
 SELECT * INTO r FROM public.community_reports WHERE id=p_report_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002';END IF;
 IF p_action='hide' THEN
  INSERT INTO public.community_hidden_content(content_kind,content_id) VALUES(r.content_kind,r.content_id) ON CONFLICT DO NOTHING;
 ELSIF p_action='restore' THEN
  DELETE FROM public.community_hidden_content WHERE content_kind=r.content_kind AND content_id=r.content_id;
 END IF;
 UPDATE public.community_reports SET status=CASE WHEN p_action='hide' THEN 'resolved' ELSE 'dismissed' END,admin_notes=p_notes,updated_at=now()
 WHERE content_kind=r.content_kind AND content_id=r.content_id AND(status='pending' OR id=r.id);
 INSERT INTO public.community_moderation_actions(report_id,action,admin_actor,notes)VALUES(r.id,p_action,p_actor,p_notes);
 RETURN jsonb_build_object('updated',true,'reportId',r.id);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_moderate_community_report_v1(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_community_report_v1(uuid,text,text,text) TO service_role;

-- Existing admin queue requires this previously missing service-only RPC.
CREATE OR REPLACE FUNCTION public.admin_moderate_place_review(p_review_id uuid,p_action text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_place uuid; v_id uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server administration required' USING ERRCODE='42501'; END IF;
  IF p_action NOT IN ('live','pending','hidden','rejected','dismiss_reports') OR p_action IS NULL THEN
    RAISE EXCEPTION 'Invalid moderation action; use hidden to archive a review' USING ERRCODE='22023';
  END IF;
  SELECT place_id INTO v_place FROM public.place_reviews WHERE id=p_review_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Review not found' USING ERRCODE='P0002'; END IF;
  -- Same lock order as save_place_review: place, then review row.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_place::text,9283));
  SELECT id INTO v_id FROM public.place_reviews WHERE id=p_review_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Review not found' USING ERRCODE='P0002'; END IF;
  IF p_action='dismiss_reports' THEN
    UPDATE public.review_reports SET status='dismissed',updated_at=now() WHERE review_id=p_review_id::text;
  ELSE
    UPDATE public.place_reviews SET status=p_action,updated_at=now() WHERE id=p_review_id;
  END IF;
  PERFORM public.aggregate_place_signals(ARRAY[v_place]);
  INSERT INTO public.place_stats(place_id,total_reviews,last_review_at,updated_at)
    SELECT v_place,count(*),max(created_at),now() FROM public.place_reviews WHERE place_id=v_place AND status='live'
  ON CONFLICT(place_id) DO UPDATE SET total_reviews=EXCLUDED.total_reviews,last_review_at=EXCLUDED.last_review_at,updated_at=now();
  RETURN p_review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_moderate_place_review(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_place_review(uuid,text) TO service_role;

COMMIT;
