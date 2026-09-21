BEGIN;

ALTER TABLE public.pro_reviews
  ADD COLUMN main_tap text,
  ADD COLUMN good_tap text,
  ADD COLUMN vibe_tap text,
  ADD COLUMN heads_up_tap text;

-- Existing review rows remain readable. A reviewer may have one review per
-- professional; the new action updates that review rather than duplicating it.
CREATE UNIQUE INDEX pro_reviews_one_per_author_provider
  ON public.pro_reviews(provider_id,user_id);

CREATE FUNCTION public.submit_pro_provider_review_v1(
  p_provider_id uuid, p_rating integer, p_title text, p_content text,
  p_main_tap text, p_good_tap text DEFAULT NULL, p_vibe_tap text DEFAULT NULL,
  p_heads_up_tap text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); owner_id uuid; kind text; review_id uuid;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Sign in to review this professional' USING ERRCODE='42501';END IF;
  PERFORM public.require_content_safety_actor();
  IF p_provider_id IS NULL OR p_rating NOT BETWEEN 1 AND 5
    OR length(btrim(coalesce(p_title,'')))>120
    OR length(btrim(coalesce(p_content,'')))>4000
    OR length(btrim(coalesce(p_content,'')))<20 THEN
    RAISE EXCEPTION 'Enter a rating and at least 20 characters about your experience' USING ERRCODE='22023';
  END IF;

  SELECT user_id,provider_type INTO owner_id,kind
    FROM public.pro_providers WHERE id=p_provider_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='P0002';END IF;
  IF owner_id=actor THEN RAISE EXCEPTION 'You cannot review your own profile' USING ERRCODE='42501';END IF;
  kind:=CASE WHEN kind='realtor' THEN 'realtor' ELSE 'pro' END;

  IF NOT (
    (kind='realtor' AND p_main_tap=ANY(ARRAY['market_guidance','negotiation','transaction_support','finding_home']))
    OR (kind='pro' AND p_main_tap=ANY(ARRAY['quality_of_work','problem_solved','reliability','service_result']))
  ) THEN RAISE EXCEPTION 'Choose what mattered most' USING ERRCODE='22023';END IF;
  IF p_good_tap IS NOT NULL AND NOT (
    (kind='realtor' AND p_good_tap=ANY(ARRAY['local_knowledge','communication','follow_through','attention_to_detail']))
    OR (kind='pro' AND p_good_tap=ANY(ARRAY['skill','communication','punctuality','follow_through']))
  ) THEN RAISE EXCEPTION 'Invalid strength' USING ERRCODE='22023';END IF;
  IF p_vibe_tap IS NOT NULL AND NOT (
    (kind='realtor' AND p_vibe_tap=ANY(ARRAY['hands_on','calm','direct','friendly','proactive']))
    OR (kind='pro' AND p_vibe_tap=ANY(ARRAY['friendly','careful','efficient','patient','professional']))
  ) THEN RAISE EXCEPTION 'Invalid working style' USING ERRCODE='22023';END IF;
  IF p_heads_up_tap IS NOT NULL AND NOT (
    (kind='realtor' AND p_heads_up_tap=ANY(ARRAY['slow_updates','availability','pressure','unexpected_costs']))
    OR (kind='pro' AND p_heads_up_tap=ANY(ARRAY['delays','availability','unexpected_costs','cleanup']))
  ) THEN RAISE EXCEPTION 'Invalid concern' USING ERRCODE='22023';END IF;

  INSERT INTO public.pro_reviews
    (provider_id,user_id,rating,title,content,main_tap,good_tap,vibe_tap,heads_up_tap)
  VALUES
    (p_provider_id,actor,p_rating,nullif(btrim(p_title),''),btrim(p_content),
     p_main_tap,p_good_tap,p_vibe_tap,p_heads_up_tap)
  ON CONFLICT (provider_id,user_id) DO UPDATE SET
    rating=EXCLUDED.rating,title=EXCLUDED.title,content=EXCLUDED.content,
    main_tap=EXCLUDED.main_tap,good_tap=EXCLUDED.good_tap,
    vibe_tap=EXCLUDED.vibe_tap,heads_up_tap=EXCLUDED.heads_up_tap,
    updated_at=now()
  RETURNING id INTO review_id;
  RETURN review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_pro_provider_review_v1(uuid,integer,text,text,text,text,text,text)
  FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.submit_pro_provider_review_v1(uuid,integer,text,text,text,text,text,text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_pro_provider_reviews_v1(
  p_provider_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NOT NULL THEN PERFORM public.require_content_safety_actor();END IF;
 IF p_provider_id IS NULL OR p_offset IS NULL OR p_limit IS NULL OR p_offset<0 OR p_offset>10000 OR p_limit<1 OR p_limit>50 THEN
   RAISE EXCEPTION 'Invalid review page' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.pro_providers WHERE id=p_provider_id AND is_active) THEN
   RAISE EXCEPTION 'Provider unavailable' USING ERRCODE='P0002';
 END IF;
 WITH visible AS(
   SELECT r.id,r.rating,r.title,r.content,r.created_at,r.updated_at,
     r.main_tap,r.good_tap,r.vibe_tap,r.heads_up_tap
   FROM public.pro_reviews r
   WHERE r.provider_id=p_provider_id
     AND public.community_content_visible('pro_review',r.id)
     AND NOT public.content_author_is_blocked(r.user_id)
   ORDER BY r.created_at DESC NULLS LAST,r.id LIMIT p_limit+1 OFFSET p_offset
 ),page AS(SELECT * FROM visible ORDER BY created_at DESC NULLS LAST,id LIMIT p_limit)
 SELECT jsonb_build_object(
   'reviews',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC NULLS LAST,id) FROM page),'[]'::jsonb),
   'hasMore',(SELECT count(*)>p_limit FROM visible)
 ) INTO result;
 RETURN result;
END;
$$;

COMMIT;
