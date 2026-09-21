BEGIN;
-- Alias-only repair in existing legacy fixed-session INSERT guard.
CREATE OR REPLACE FUNCTION public.guard_onthego_session_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
 ELSIF TG_OP='INSERT' AND EXISTS(SELECT 1 FROM public.tavvy_places fixed_business JOIN public.places p ON p.source_type='user' AND p.source_id=fixed_business.id::text WHERE p.id=NEW.place_id AND fixed_business.place_type='on_the_go') THEN
  RAISE EXCEPTION 'Use the mobile business lifecycle for this place' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;$function$;

-- Add Auth administrator attribution without modifying independent legacy identities/history.
ALTER TABLE public.live_sessions ADD COLUMN disabled_by_auth uuid REFERENCES auth.users(id);

CREATE FUNCTION public.require_onthego_admin_actor() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid:=auth.uid(); valid uuid;
BEGIN
 -- Lock the actual role/auth records so revocation cannot race an authorized mutation.
 SELECT u.id INTO valid FROM auth.users u JOIN public.user_roles r ON r.user_id=u.id
 WHERE u.id=actor AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp())
 AND r.role='super_admin' AND (r.expires_at IS NULL OR r.expires_at>clock_timestamp())
 FOR SHARE OF u,r;
 IF valid IS NULL THEN RAISE EXCEPTION 'Active administrator access required' USING ERRCODE='42501';END IF;
 RETURN valid;
END;$$;
REVOKE ALL ON FUNCTION public.require_onthego_admin_actor() FROM PUBLIC,anon,authenticated,service_role;

-- Invoker trigger distinguishes a reviewed definer operation from direct client UPDATE.
-- Existing legacy disabled rows remain unchanged; no restored/reactivated state is introduced.
CREATE FUNCTION public.guard_onthego_admin_disable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE actor uuid; disabled_time timestamptz;
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.status='admin_disabled' OR NEW.disabled_by_auth IS NOT NULL OR NEW.disabled_by IS NOT NULL OR NEW.disabled_at IS NOT NULL OR NEW.disabled_reason IS NOT NULL THEN
   RAISE EXCEPTION 'Start a session before disabling it' USING ERRCODE='42501';
  END IF;RETURN NEW;
 END IF;
 IF OLD.status='admin_disabled' THEN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.disabled_by IS DISTINCT FROM OLD.disabled_by OR NEW.disabled_by_auth IS DISTINCT FROM OLD.disabled_by_auth OR NEW.disabled_at IS DISTINCT FROM OLD.disabled_at OR NEW.disabled_reason IS DISTINCT FROM OLD.disabled_reason OR NEW.actual_end_at IS DISTINCT FROM OLD.actual_end_at OR NEW.address_confirmed IS DISTINCT FROM OLD.address_confirmed THEN
   RAISE EXCEPTION 'Disabled session history cannot be changed' USING ERRCODE='42501';
  END IF;RETURN NEW;
 END IF;
 IF NEW.status='admin_disabled' THEN
  IF current_user IN('anon','authenticated','service_role') THEN RAISE EXCEPTION 'Use the administrator disable action' USING ERRCODE='42501';END IF;
  actor:=public.require_onthego_admin_actor();disabled_time:=clock_timestamp();
  IF OLD.status<>'active' OR OLD.scheduled_end_at<=disabled_time THEN RAISE EXCEPTION 'Session is not active' USING ERRCODE='40001';END IF;
  IF NEW.disabled_by IS DISTINCT FROM OLD.disabled_by OR NEW.disabled_by_auth IS DISTINCT FROM actor OR length(btrim(coalesce(NEW.disabled_reason,''))) NOT BETWEEN 1 AND 2000 THEN
   RAISE EXCEPTION 'Invalid administrative attribution or reason' USING ERRCODE='22023';END IF;
  NEW.disabled_at:=disabled_time;NEW.actual_end_at:=coalesce(OLD.actual_end_at,disabled_time);NEW.updated_at:=disabled_time;
  IF NEW.tavvy_place_id IS NOT NULL THEN NEW.address_confirmed:=false;END IF;
  INSERT INTO public.audit_log(user_id,action,resource_type,resource_id,details,success)
   VALUES(actor,'onthego.session.disable','live_session',NEW.id::text,jsonb_build_object('from_status',OLD.status,'to_status','admin_disabled','reason',NEW.disabled_reason,'place_id',NEW.place_id,'tavvy_place_id',NEW.tavvy_place_id,'disabled_at',disabled_time,'actor_domain','auth'),true);
 ELSIF NEW.disabled_by IS DISTINCT FROM OLD.disabled_by OR NEW.disabled_by_auth IS DISTINCT FROM OLD.disabled_by_auth OR NEW.disabled_at IS DISTINCT FROM OLD.disabled_at OR NEW.disabled_reason IS DISTINCT FROM OLD.disabled_reason THEN
  RAISE EXCEPTION 'Administrative attribution cannot be changed' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION public.guard_onthego_admin_disable() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_onthego_admin_disable BEFORE INSERT OR UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.guard_onthego_admin_disable();

CREATE FUNCTION public.admin_disable_onthego_session(p_session_id uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions,pg_temp AS $$
DECLARE actor uuid:=public.require_onthego_admin_actor();live public.live_sessions%rowtype;business_id uuid;reason text:=btrim(p_reason);repeated boolean:=false;
BEGIN
 IF p_session_id IS NULL OR reason IS NULL OR length(reason) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Choose a session and a reason (up to 2000 characters)' USING ERRCODE='22023';END IF;
 SELECT tavvy_place_id INTO business_id FROM public.live_sessions WHERE id=p_session_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session not found' USING ERRCODE='P0002';END IF;
 -- Same business-before-session ordering as owner actions and expiry cleanup.
 IF business_id IS NOT NULL THEN PERFORM id FROM public.tavvy_places WHERE id=business_id FOR UPDATE;END IF;
 SELECT * INTO live FROM public.live_sessions WHERE id=p_session_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session not found' USING ERRCODE='P0002';END IF;
 IF live.tavvy_place_id IS DISTINCT FROM business_id THEN RAISE EXCEPTION 'Session changed; refresh and try again' USING ERRCODE='40001';END IF;
 -- Recheck time-limited permissions after a potentially blocking lock acquisition.
 PERFORM public.require_onthego_admin_actor();
 IF live.status='admin_disabled' AND live.disabled_by_auth=actor AND live.disabled_reason=reason THEN
  repeated:=true;
 ELSIF live.status<>'active' OR live.scheduled_end_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'Session is no longer active; refresh to see its current state' USING ERRCODE='40001';
 ELSE
  UPDATE public.live_sessions SET status='admin_disabled',disabled_by_auth=actor,disabled_reason=reason WHERE id=p_session_id AND status='active' RETURNING * INTO live;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session changed; refresh and try again' USING ERRCODE='40001';END IF;
  IF business_id IS NOT NULL THEN
   UPDATE public.tavvy_places SET is_active_today=false,current_lat=null,current_lng=null,current_address='Business offline' WHERE id=business_id;
  END IF;
 END IF;
 RETURN jsonb_build_object('success',true,'already_disabled',repeated,'session',jsonb_build_object('id',live.id,'status',live.status,'disabled_at',live.disabled_at,'disabled_reason',live.disabled_reason));
END;$$;
REVOKE ALL ON FUNCTION public.admin_disable_onthego_session(uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.admin_disable_onthego_session(uuid,text) TO authenticated;

-- Keep newly added administrative attribution out of the existing owner serializer.
CREATE OR REPLACE FUNCTION public.onthego_session_action(action_name text, payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  return jsonb_build_object('success',true,'session',(to_jsonb(live)-'started_by'-'started_by_auth'-'disabled_by'-'disabled_by_auth'-'disabled_reason'),'session_id',live.id,'confirmed_address',live.session_address);
end;
$function$;

NOTIFY pgrst,'reload schema';
COMMIT;
