-- Transactional mobile lifecycle with a default-off rollout gate and legacy actor preservation.
-- No migration-time customer row modifications. Deployment must include the four edge wrappers.
begin;
-- Preserve legacy fixed-place sessions and their original public.users identities.
ALTER TABLE public.live_sessions ALTER COLUMN started_by DROP NOT NULL;
ALTER TABLE public.live_sessions ADD COLUMN started_by_auth uuid REFERENCES auth.users(id);
ALTER TABLE public.live_sessions ADD CONSTRAINT live_sessions_actor_reference CHECK(started_by IS NOT NULL OR started_by_auth IS NOT NULL) NOT VALID;
CREATE TABLE public.onthego_lifecycle_settings(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),starts_enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.onthego_lifecycle_settings(singleton,starts_enabled) VALUES(true,false);
REVOKE ALL ON public.onthego_lifecycle_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON public.onthego_lifecycle_settings TO service_role;

CREATE OR REPLACE FUNCTION public.onthego_actor_active() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid();BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())) THEN
  RAISE EXCEPTION 'Sign in with an active account' USING ERRCODE='42501';
 END IF;RETURN actor;END;$$;
REVOKE ALL ON FUNCTION public.onthego_actor_active() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.onthego_actor_active() TO authenticated;

CREATE OR REPLACE FUNCTION public.onthego_business_available(p_business uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.tavvy_places b JOIN auth.users a ON a.id=b.created_by
 WHERE b.id=p_business AND b.place_type='on_the_go' AND NOT coalesce(b.is_deleted,false)
 AND a.deleted_at IS NULL AND (a.banned_until IS NULL OR a.banned_until<=now()));
$$;
REVOKE ALL ON FUNCTION public.onthego_business_available(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onthego_business_available(uuid) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.guard_onthego_session_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE b public.tavvy_places%rowtype;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.tavvy_place_id IS DISTINCT FROM OLD.tavvy_place_id OR NEW.started_by IS DISTINCT FROM OLD.started_by OR NEW.started_by_auth IS DISTINCT FROM OLD.started_by_auth OR NEW.place_id IS DISTINCT FROM OLD.place_id) THEN
  RAISE EXCEPTION 'A session identity cannot be changed' USING ERRCODE='42501';
 END IF;
 IF NEW.tavvy_place_id IS NOT NULL THEN
  SELECT * INTO b FROM public.tavvy_places WHERE id=NEW.tavvy_place_id;
  IF b.id IS NULL OR b.place_type IS DISTINCT FROM 'on_the_go' OR NEW.started_by_auth IS DISTINCT FROM b.created_by OR NEW.started_by_auth IS NULL OR NEW.started_by IS NOT NULL THEN
   RAISE EXCEPTION 'An authenticated mobile business owner is required' USING ERRCODE='42501';
  END IF;
  IF NEW.place_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.places p WHERE p.id=NEW.place_id AND p.source_type='user' AND p.source_id=b.id::text) THEN
   RAISE EXCEPTION 'A proven business place association is required' USING ERRCODE='42501';
  END IF;
  IF TG_OP='INSERT' THEN
   IF NOT public.onthego_business_available(b.id) OR NOT EXISTS(SELECT 1 FROM public.onthego_lifecycle_settings WHERE singleton AND starts_enabled) THEN
    RAISE EXCEPTION 'Live location is not available yet. Please try again later.' USING ERRCODE='42501';
   END IF;
   IF NEW.address_confirmed IS TRUE THEN RAISE EXCEPTION 'Confirm the public address after starting' USING ERRCODE='22023';END IF;
  END IF;
 ELSIF TG_OP='INSERT' AND EXISTS(SELECT 1 FROM public.tavvy_places b JOIN public.places p ON p.source_type='user' AND p.source_id=b.id::text WHERE p.id=NEW.place_id AND b.place_type='on_the_go') THEN
  RAISE EXCEPTION 'Use the mobile business lifecycle for this place' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION public.guard_onthego_session_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_onthego_session_identity BEFORE INSERT OR UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.guard_onthego_session_identity();

-- Mobile changes use the owner-checked transaction, never a permissive legacy policy.
CREATE POLICY onthego_session_insert_guard ON public.live_sessions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(tavvy_place_id IS NULL);
CREATE POLICY onthego_session_update_guard ON public.live_sessions AS RESTRICTIVE FOR UPDATE TO authenticated USING(tavvy_place_id IS NULL) WITH CHECK(tavvy_place_id IS NULL);
CREATE POLICY onthego_session_delete_guard ON public.live_sessions AS RESTRICTIVE FOR DELETE TO authenticated USING(tavvy_place_id IS NULL);
CREATE POLICY onthego_session_public_guard ON public.live_sessions AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(
 tavvy_place_id IS NULL OR (status='active' AND scheduled_end_at>now() AND address_confirmed IS TRUE AND public.onthego_business_available(tavvy_place_id))
);
CREATE POLICY onthego_business_public_guard ON public.tavvy_places AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(place_type IS DISTINCT FROM 'on_the_go' OR public.onthego_business_available(id));
-- Existing fixed-business schedule access is unchanged; only mobile schedules
-- inherit the live-account and ownership boundaries.
CREATE OR REPLACE FUNCTION public.onthego_schedule_visible(p_business uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.tavvy_places b WHERE b.id=p_business AND(b.place_type IS DISTINCT FROM 'on_the_go' OR public.onthego_business_available(b.id)));
$$;
CREATE OR REPLACE FUNCTION public.onthego_schedule_actor_allowed(p_business uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.tavvy_places b WHERE b.id=p_business AND(b.place_type IS DISTINCT FROM 'on_the_go' OR (b.created_by=auth.uid() AND public.onthego_business_available(b.id))));
$$;
REVOKE ALL ON FUNCTION public.onthego_schedule_visible(uuid),public.onthego_schedule_actor_allowed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onthego_schedule_visible(uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.onthego_schedule_actor_allowed(uuid) TO authenticated;
CREATE POLICY onthego_schedule_public_guard ON public.scheduled_events AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.onthego_schedule_visible(tavvy_place_id));
CREATE POLICY onthego_schedule_insert_guard ON public.scheduled_events AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.onthego_schedule_actor_allowed(tavvy_place_id));
CREATE POLICY onthego_schedule_update_guard ON public.scheduled_events AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.onthego_schedule_actor_allowed(tavvy_place_id)) WITH CHECK(public.onthego_schedule_actor_allowed(tavvy_place_id));
DROP POLICY IF EXISTS "Public can view scheduled events" ON public.scheduled_events;
CREATE POLICY "Public can view scheduled events" ON public.scheduled_events FOR SELECT USING(status='scheduled' AND (scheduled_start>now() OR (scheduled_end>now() AND public.onthego_business_available(tavvy_place_id))));
-- Preserve fixed-place content policies while restricting mobile children.
CREATE OR REPLACE FUNCTION public.onthego_session_content_visible(p_session uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.live_sessions s WHERE s.id=p_session AND
  (s.tavvy_place_id IS NULL OR (s.status='active' AND s.address_confirmed IS TRUE AND s.scheduled_end_at>now() AND public.onthego_business_available(s.tavvy_place_id))));
$$;
REVOKE ALL ON FUNCTION public.onthego_session_content_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onthego_session_content_visible(uuid) TO anon,authenticated;
CREATE POLICY onthego_menu_public_guard ON public.live_session_menu_items AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.onthego_session_content_visible(session_id));
CREATE POLICY onthego_specials_public_guard ON public.live_session_specials AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.onthego_session_content_visible(session_id));

CREATE OR REPLACE FUNCTION public.guard_onthego_profile_location() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.place_type='on_the_go' THEN
  -- Ephemeral positions belong only to live_sessions, even for old producers.
  NEW.current_lat:=NULL;NEW.current_lng:=NULL;
  NEW.is_active_today:=NOT coalesce(NEW.is_deleted,false) AND EXISTS(SELECT 1 FROM public.live_sessions s WHERE s.tavvy_place_id=NEW.id AND s.status='active' AND s.address_confirmed IS TRUE AND s.scheduled_end_at>now());
  NEW.current_address:=CASE WHEN NEW.is_active_today THEN 'See live map for current location' ELSE 'Business offline' END;
 END IF;RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION public.guard_onthego_profile_location() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_onthego_profile_location BEFORE INSERT OR UPDATE ON public.tavvy_places FOR EACH ROW EXECUTE FUNCTION public.guard_onthego_profile_location();

create or replace function public.onthego_session_action(action_name text, payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  actor uuid := public.onthego_actor_active();
  business public.tavvy_places%rowtype;
  live public.live_sessions%rowtype;
  target uuid;
  latitude double precision;
  longitude double precision;
  duration numeric;
  ends timestamptz;
  address text;
  canonical uuid; candidates uuid[]; cooldown_at timestamptz; item jsonb; ordinal integer;
begin
  if actor is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if action_name is null or action_name not in ('start','update','confirm','end') then raise exception 'Invalid action'; end if;
  if jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid request'; end if;
  if action_name = 'start' then target := (payload->>'tavvy_place_id')::uuid;
  else
    select tavvy_place_id into target from public.live_sessions where id=(payload->>'session_id')::uuid;
  end if;
  -- Serialize all actions for the same business, including concurrent starts.
  select * into business from public.tavvy_places where id=target for update;
  if not found or business.created_by is distinct from actor or business.place_type is distinct from 'on_the_go' or coalesce(business.is_deleted,false) then
    raise exception 'You do not own this mobile business' using errcode='42501';
  end if;
  if action_name = 'start' then
    update public.live_sessions set status='ended', actual_end_at=scheduled_end_at, updated_at=now()
      where tavvy_place_id=target and status='active' and scheduled_end_at<=now();
    if exists(select 1 from public.live_sessions where tavvy_place_id=target and status='active') then raise exception 'This business already has an active session. Refresh to recover it.'; end if;
    select max(actual_end_at)+interval '30 minutes' into cooldown_at from public.live_sessions where tavvy_place_id=target and status='ended';
    if cooldown_at>now() then raise exception 'Please wait until % UTC before going live again',to_char(cooldown_at at time zone 'UTC','YYYY-MM-DD HH24:MI') using detail=cooldown_at::text; end if;
    latitude := (payload->>'latitude')::double precision; longitude := (payload->>'longitude')::double precision;
    duration := coalesce((payload->>'duration_hours')::numeric,4);
    if latitude is null or longitude is null or not (latitude between -90 and 90) or not (longitude between -180 and 180) or duration is null or not (duration between 1 and 12) then raise exception 'Invalid coordinates or duration (1–12 hours)'; end if;
    if not exists(select 1 from public.onthego_lifecycle_settings where singleton and starts_enabled) then raise exception 'Live location is not available yet. Please try again later.' using errcode='42501'; end if;
    select array_agg(id) into candidates from public.places where source_type='user' and source_id=target::text and coalesce(is_active,true) and coalesce(status,'active')='active';
    if cardinality(candidates)>1 then raise exception 'Multiple place records need support review'; end if;
    canonical:=candidates[1];
    insert into public.live_sessions(place_id,tavvy_place_id,started_by_auth,session_lat,session_lng,session_location,location_label,session_address,address_confirmed,started_at,scheduled_end_at,status,today_note)
      values(canonical,target,actor,latitude,longitude,format('SRID=4326;POINT(%s %s)',longitude,latitude)::geography,left(nullif(payload->>'location_label',''),500),left(nullif(payload->>'session_address',''),500),false,now(),now()+duration*interval '1 hour','active',left(payload->>'today_note',2000)) returning * into live;
    -- Optional existing start content is part of the same transaction, using real columns.
    if payload?'menu_items' then
      if jsonb_typeof(payload->'menu_items')<>'array' or jsonb_array_length(payload->'menu_items')>100 then raise exception 'Invalid menu items'; end if;
      if jsonb_array_length(payload->'menu_items')>0 and canonical is null then raise exception 'Enable the Tavvy place page before adding session items'; end if;
      ordinal:=0;
      for item in select value from jsonb_array_elements(payload->'menu_items') loop
        if jsonb_typeof(item)<>'object' or nullif(trim(item->>'name'),'') is null or length(item->>'name')>200 or length(coalesce(item->>'description',''))>2000 then raise exception 'Invalid menu item'; end if;
        if item->>'price_cents' is not null and ((item->>'price_cents')::numeric<0 or (item->>'price_cents')::numeric>100000000 or (item->>'price_cents')::numeric<>trunc((item->>'price_cents')::numeric)) then raise exception 'Invalid item price'; end if;
        insert into public.live_session_menu_items(session_id,place_id,name,description,price_cents,sort_order,is_available) values(live.id,canonical,trim(item->>'name'),nullif(item->>'description',''),(item->>'price_cents')::integer,coalesce((item->>'sort_order')::integer,ordinal),true);
        ordinal:=ordinal+1;
      end loop;
    end if;
    if payload?'specials' then
      if jsonb_typeof(payload->'specials')<>'array' or jsonb_array_length(payload->'specials')>50 then raise exception 'Invalid specials'; end if;
      if jsonb_array_length(payload->'specials')>0 and canonical is null then raise exception 'Enable the Tavvy place page before adding specials'; end if;
      for item in select value from jsonb_array_elements(payload->'specials') loop
        if jsonb_typeof(item)<>'object' or nullif(trim(item->>'title'),'') is null or length(item->>'title')>200 or length(coalesce(item->>'description',''))>2000 or length(coalesce(item->>'urgency_label',''))>100 then raise exception 'Invalid special'; end if;
        ends:=nullif(item->>'valid_until','')::timestamptz;
        if ends is not null and (ends<=now() or ends>live.scheduled_end_at) then raise exception 'Special expiry must be within the live session'; end if;
        insert into public.live_session_specials(session_id,place_id,title,description,valid_until,urgency_label) values(live.id,canonical,trim(item->>'title'),nullif(item->>'description',''),ends,nullif(item->>'urgency_label',''));
      end loop;
    end if;
  else
    select * into live from public.live_sessions where id=(payload->>'session_id')::uuid and tavvy_place_id=target for update;
    if not found then raise exception 'Session not found'; end if;
    if action_name = 'end' then
      -- Idempotent end allows safe retries after a lost network response.
      update public.live_sessions set status='ended',actual_end_at=coalesce(actual_end_at,now()),updated_at=now() where id=live.id and status='active';
      select * into live from public.live_sessions where id=(payload->>'session_id')::uuid;
    else
      if live.status <> 'active' or live.scheduled_end_at<=now() then raise exception 'Session has ended or expired'; end if;
      if action_name = 'confirm' then
        address := trim(payload->>'confirmed_address');
        if address is null or length(address)=0 or length(address)>500 then raise exception 'Enter a public address (up to 500 characters)'; end if;
        update public.live_sessions set session_address=address,address_confirmed=true,updated_at=now() where id=live.id returning * into live;
      else
        if (payload ? 'session_lat') <> (payload ? 'session_lng') then raise exception 'Both coordinates are required'; end if;
        if payload ? 'session_lat' then
          latitude := (payload->>'session_lat')::double precision; longitude := (payload->>'session_lng')::double precision;
          if latitude is null or longitude is null or not (latitude between -90 and 90) or not (longitude between -180 and 180) then raise exception 'Invalid coordinates'; end if;
          -- Every explicit position update requires a new public-address confirmation.
          update public.live_sessions set session_lat=latitude,session_lng=longitude,session_location=format('SRID=4326;POINT(%s %s)',longitude,latitude)::geography,address_confirmed=false,session_address=null where id=live.id;
        end if;
        if payload ? 'scheduled_end_at' then
          ends := (payload->>'scheduled_end_at')::timestamptz;
          if ends is null or ends<=now() or ends>live.started_at+interval '12 hours' then raise exception 'End time must be future and within 12 hours of session start'; end if;
          update public.live_sessions set scheduled_end_at=ends where id=live.id;
        end if;
        update public.live_sessions set today_note=case when payload ? 'today_note' then left(payload->>'today_note',2000) else today_note end, location_label=case when payload ? 'location_label' then left(payload->>'location_label',500) else location_label end,updated_at=now() where id=live.id returning * into live;
      end if;
    end if;
  end if;
  -- Precise live positions live only in the expiring, RLS-protected session row.
  -- Do not copy them into a generally visible business profile with no expiry predicate.
  update public.tavvy_places set is_active_today=(live.status='active' and live.address_confirmed and live.scheduled_end_at>now()),current_lat=null,current_lng=null,current_address='See live map for current location',last_live_at=case when action_name='start' then now() else last_live_at end where id=target;
  return jsonb_build_object('success',true,'session',(to_jsonb(live)-'started_by'-'started_by_auth'-'disabled_by'-'disabled_reason'),'session_id',live.id,'confirmed_address',live.session_address);
end;
$$;
revoke all on function public.onthego_session_action(text,jsonb) from public,anon;
grant execute on function public.onthego_session_action(text,jsonb) to authenticated;

-- Public raw reads must respect confirmation as well as end time. Owners recover via authenticated edge.
drop policy if exists "Anyone can view active live sessions" on public.live_sessions;
create policy "Anyone can view active live sessions" on public.live_sessions for select using
  (status='active' and scheduled_end_at>now() and (tavvy_place_id is null or address_confirmed=true));

-- Called by a periodic server job; no public execute permission.
create or replace function public.expire_onthego_sessions()
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer := 0; changed integer; business_id uuid;
begin
  -- Same business-before-session lock order as the lifecycle RPC.
  for business_id in select id from public.tavvy_places where place_type='on_the_go' for update skip locked loop
    update public.live_sessions set status='ended', actual_end_at=scheduled_end_at,updated_at=now()
      where tavvy_place_id=business_id and status='active' and (scheduled_end_at<=now() or not public.onthego_business_available(business_id));
    get diagnostics changed=row_count; affected := affected+changed;
    update public.tavvy_places p set is_active_today=false,current_lat=null,current_lng=null,current_address='Business offline'
      where id=business_id and not exists(select 1 from public.live_sessions s where s.tavvy_place_id=p.id and s.status='active' and s.address_confirmed and s.scheduled_end_at>now())
      and (p.is_active_today or p.current_lat is not null or p.current_lng is not null);
  end loop;
  return affected;
end;
$$;
revoke all on function public.expire_onthego_sessions() from public,anon,authenticated;
grant execute on function public.expire_onthego_sessions() to service_role;
commit;
