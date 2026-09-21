-- PREPARED ONLY: public review reads retain documented public columns.
-- Deploy with the own-review RPC client. SELECT * clients must migrate first.
BEGIN;
REVOKE SELECT ON public.place_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT(id,place_id,user_id,created_at,updated_at,public_note,source,status)
  ON public.place_reviews TO anon,authenticated;
-- Explicitly remove any pre-existing column grants on sensitive fields too.
REVOKE SELECT(private_note_owner,reviewer_zip,ip_address,ip_city,ip_state,ip_country,ip_zip)
  ON public.place_reviews FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_my_place_review(p_place_id uuid)
RETURNS TABLE(id uuid,place_id uuid,user_id uuid,public_note text,private_note_owner text,
  created_at timestamptz,updated_at timestamptz,status text,source text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT r.id,r.place_id,r.user_id,r.public_note,r.private_note_owner,r.created_at,r.updated_at,r.status,r.source
  FROM public.place_reviews r WHERE r.place_id=p_place_id AND r.user_id=auth.uid()
  ORDER BY r.created_at DESC,r.id DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_place_review(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_place_review(uuid) TO authenticated;

-- Legacy public card reader now uses the actual catalog and aggregate columns.
CREATE OR REPLACE FUNCTION public.get_top_signals_for_place(p_place_id uuid,p_category text DEFAULT NULL,p_limit integer DEFAULT 5)
RETURNS TABLE(signal_id uuid,signal_name text,signal_category text,tap_count bigint,unique_reviewers bigint)
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT a.signal_id,ri.label,a.bucket,a.tap_total::bigint,a.review_count::bigint
  FROM public.place_signal_aggregates a JOIN public.review_items ri ON ri.id=a.signal_id
  WHERE a.place_id=p_place_id AND (p_category IS NULL OR a.bucket=p_category)
  ORDER BY a.tap_total DESC,a.signal_id LIMIT greatest(0,least(p_limit,100))
$$;
COMMIT;
