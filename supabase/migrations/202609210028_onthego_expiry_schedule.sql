BEGIN;

-- The lifecycle function existed without a production scheduler. Keep the
-- business-before-session lock order for canonical businesses, then expire
-- independent legacy sessions that have no tavvy_place_id.
CREATE OR REPLACE FUNCTION public.expire_onthego_sessions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE affected integer := 0; changed integer; business_id uuid;
BEGIN
  FOR business_id IN
    SELECT id FROM public.tavvy_places WHERE place_type='on_the_go' FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.live_sessions
      SET status='ended', actual_end_at=scheduled_end_at, updated_at=now()
      WHERE tavvy_place_id=business_id AND status='active'
        AND (scheduled_end_at<=now() OR NOT public.onthego_business_available(business_id));
    GET DIAGNOSTICS changed=ROW_COUNT;
    affected := affected+changed;

    UPDATE public.tavvy_places p
      SET is_active_today=false, current_lat=null, current_lng=null,
          current_address='Business offline'
      WHERE id=business_id
        AND NOT EXISTS (
          SELECT 1 FROM public.live_sessions s
          WHERE s.tavvy_place_id=p.id AND s.status='active'
            AND s.address_confirmed AND s.scheduled_end_at>now()
        )
        AND (p.is_active_today OR p.current_lat IS NOT NULL OR p.current_lng IS NOT NULL);
  END LOOP;

  UPDATE public.live_sessions
    SET status='ended', actual_end_at=scheduled_end_at, updated_at=now()
    WHERE tavvy_place_id IS NULL AND status='active' AND scheduled_end_at<=now();
  GET DIAGNOSTICS changed=ROW_COUNT;
  RETURN affected+changed;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_onthego_sessions() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.expire_onthego_sessions() TO service_role;

SELECT cron.schedule(
  'expire-onthego-sessions',
  '* * * * *',
  $job$SELECT public.expire_onthego_sessions();$job$
);

COMMIT;
