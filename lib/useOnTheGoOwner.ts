import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { enableMobilePlaceDetails } from './onthegoDetails';
import { validCoordinates } from './onthego';
import { ownerCategory, parseOwnerData, parseStartedSession, OwnerPlace, OwnerSession } from './onthegoOwnerContract';
export const OWNER_CATEGORIES = ['Food Trucks', 'Coffee', 'Ice Cream', 'Mobile Car Wash', 'Mobile Detailing', 'Mobile Mechanic', 'Mobile Tire Service', 'Mobile Pet Grooming', 'Mobile Dog Training', 'Mobile Vet', 'Mobile Hair Stylist', 'Mobile Barber', 'Mobile Nail Tech', 'Mobile Massage', 'Mobile Notary', 'Mobile DJ', 'Mobile Photo Booth', 'Mobile Services'];
export function useOnTheGoOwner() {
  const requestInFlight = useRef<symbol | null>(null);
  const actorId = useRef<string | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const selectedId = useRef('');
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [message, setMessage] = useState('');
  const [scheduleVersion,setScheduleVersion]=useState(0);
  const [places, setPlaces] = useState<OwnerPlace[]>([]);
  const [sessions, setSessions] = useState<OwnerSession[]>([]);
  const [placeId, setPlaceId] = useState('');
  const [address, setAddress] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const session = sessions.find(s => s.tavvy_place_id === placeId && Date.parse(s.scheduled_end_at) > Date.now());
  const sessionId = session?.id || '';
  const clear = useCallback(() => { selectedId.current = ''; setPlaceId(''); setPlaces([]); setSessions([]); setAddress(''); }, []);
  const recover = useCallback(async () => {
    if (!mounted.current) return;
    const current = ++generation.current;
    setRecovering(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (current !== generation.current) return;
      const nextActor = auth.session?.user?.id || null;
      if (actorId.current !== nextActor) { clear(); requestInFlight.current = null; setBusy(false); setMessage(''); }
      actorId.current = nextActor; setSignedIn(!!nextActor);
      if (!auth.session) { clear(); return; }
      const { data, error } = await supabase.functions.invoke('my-active-session', { method: 'GET' });
      if (error) throw error;
      const recovered = parseOwnerData(data);
      if (current !== generation.current) return;
      setPlaces(recovered.places); setSessions(recovered.sessions);
      const id = recovered.places.some(p => p.id === selectedId.current) ? selectedId.current : recovered.places[0]?.id || '';
      selectedId.current = id; setPlaceId(id);
      setAddress(recovered.sessions.find(s => s.tavvy_place_id === id)?.session_address || '');
    } catch { if (current === generation.current) setMessage('Unable to recover your businesses. Refresh before starting a new session.'); }
    finally { if (current === generation.current) setRecovering(false); }
  }, [clear]);
  useEffect(() => {
    mounted.current = true;
    void recover();
    const { data: listener } = supabase.auth.onAuthStateChange((event, authSession) => {
      const nextActor = authSession?.user?.id || null;
      if (nextActor !== actorId.current || event === 'SIGNED_OUT') {
        ++generation.current; actorId.current = nextActor; requestInFlight.current = null;
        clear(); setSignedIn(!!nextActor); setBusy(false); setMessage(''); setRecovering(!!nextActor);
        if (nextActor) setTimeout(() => { if (mounted.current && actorId.current === nextActor) void recover(); }, 0);
      }
    });
    return () => { mounted.current = false; ++generation.current; requestInFlight.current = null; listener.subscription.unsubscribe(); };
  }, [recover, clear]);
  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(() => { setSessions(current => current.filter(s => s.id !== session.id)); setMessage('Your live session has expired.'); void recover(); }, Math.max(0, Date.parse(session.scheduled_end_at) - Date.now()));
    return () => clearTimeout(timeout);
  }, [session, recover]);
  const run = async (name: string, body: Record<string, unknown>, success: (data: any) => void) => {
    if (requestInFlight.current || !mounted.current) return;
    const request = Symbol('owner request'), current = generation.current, actor = actorId.current;
    const valid = () => mounted.current && current === generation.current && actor === actorId.current;
    requestInFlight.current = request; setBusy(true); setMessage('');
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (!valid()) return;
      if (!actor || auth.session?.user?.id !== actor) throw new Error('Please sign in before managing your mobile business.');
      // Bind the write to the identity that initiated it, even if another account signs in mid-request.
      const { data, error } = await supabase.functions.invoke(name, { body, headers: { Authorization: `Bearer ${auth.session.access_token}` } });
      if (!valid()) return;
      if (error || !data?.success) {
        let detail = data?.error || data?.message;
        if (!detail && error?.context instanceof Response) { try { detail = (await error.context.clone().json()).error; } catch {} }
        throw new Error(detail || 'The request could not be completed. Refresh your status before retrying.');
      }
      if (valid()) success(data);
    } catch (e) { if (valid()) setMessage(e instanceof Error ? e.message : 'Request failed. Refresh your status before retrying.'); }
    finally { if (requestInFlight.current === request) { requestInFlight.current = null; if (mounted.current) setBusy(false); } }
  };
  const enableDetails = async () => {
    if (requestInFlight.current || !placeId || !mounted.current) return null;
    const request = Symbol('enable details'), current = generation.current, actor = actorId.current;
    const valid = () => mounted.current && current === generation.current && actor === actorId.current;
    requestInFlight.current = request; setBusy(true); setMessage('');
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (!valid()) return null;
      if (!actor || auth.session?.user?.id !== actor) throw new Error('Please sign in before managing your mobile business.');
      const id = await enableMobilePlaceDetails(placeId);
      if (!valid()) return null;
      setMessage('Your Tavvy place page is ready. Reviews, photos and other available features use this page.'); return id;
    } catch(e) { if (valid()) setMessage(e instanceof Error?e.message:'Unable to enable your place page. Please retry.'); return null; }
    finally { if (requestInFlight.current === request) { requestInFlight.current = null; if (mounted.current) setBusy(false); } }
  };
  return { enableDetails, scheduleVersion, busy: busy || recovering, message, placeId, sessionId, session, address, setAddress, confirmed: !!session?.address_confirmed, registered: !!placeId, places, signedIn, recover,
    selectPlace: (id: string) => { selectedId.current = id; setPlaceId(id); setAddress(sessions.find(s => s.tavvy_place_id === id)?.session_address || ''); setMessage(''); },
    register: (name: string, category: string, area: string) => {
      if (!name.trim() || !area.trim()) { setMessage('Enter your business name and service area.'); return; }
      return run('create-onthego-place', { name: name.trim(), ...ownerCategory(category), service_area: area.trim() }, data => {
        if (typeof data.place?.id !== 'string') { setMessage('Business created. Refresh your businesses to continue.'); void recover(); return; }
        setPlaces(current => [...current, data.place]); selectedId.current = data.place.id; setPlaceId(data.place.id);
        setMessage('Business registered. Choose your location to go live.');
      });
    },
    start: (lat: number, lng: number, hours: number, note: string) => {
      if (!placeId || sessionId || !validCoordinates(lat, lng) || !Number.isFinite(hours) || hours < 1 || hours > 8) { setMessage('Choose a valid location and duration from 1 to 8 hours.'); return; }
      return run('go-live-start', { tavvy_place_id: placeId, latitude: lat, longitude: lng, duration_hours: hours, today_note: note }, data => {
        const started = parseStartedSession(data);
        setSessions(current => [...current.filter(s => s.tavvy_place_id !== placeId), started]);
        setAddress(started.session_address || ''); setMessage('Session started. Confirm its public address below.');
      });
    },
    update: (lat: number, lng: number, note: string) => {
      if (!sessionId || !validCoordinates(lat, lng)) { setMessage('Select a valid location.'); return; }
      return run('go-live-update', { session_id: sessionId, session_lat: lat, session_lng: lng, today_note: note }, data => {
        setSessions(current => current.map(s => s.id === sessionId ? { ...s, ...data.session, address_confirmed: false, session_address: null } : s));
        setAddress(''); setMessage('Location updated. Confirm the new public address to show it on the map.');
      });
    },
    confirm: () => {
      if (!sessionId || !address.trim()) { setMessage('Enter the public address to confirm.'); return; }
      return run('go-live-confirm-address', { session_id: sessionId, confirmed_address: address.trim() }, () => { setSessions(current => current.map(s => s.id === sessionId ? { ...s, address_confirmed: true, session_address: address.trim() } : s)); setMessage('Address confirmed. Customers can see your live location.'); });
    },
    end: () => sessionId && run('go-live-end', { session_id: sessionId }, () => { setSessions(current => current.filter(s => s.id !== sessionId)); setMessage('Session ended. Your live location has been removed.'); }),
    schedule: (name: string, address: string, lat: number, lng: number, start: string, end: string) => {
      const a = Date.parse(start), b = Date.parse(end);
      if (!placeId || !name.trim() || !validCoordinates(lat, lng) || !Number.isFinite(a) || !Number.isFinite(b) || a <= Date.now() || b <= a) { setMessage('Choose a location and future start/end times. The end must follow the start.'); return; }
      return run('schedule-event', { tavvy_place_id: placeId, location_name: name.trim(), location_address: address, latitude: lat, longitude: lng, scheduled_start: new Date(a).toISOString(), scheduled_end: new Date(b).toISOString() }, () => {setMessage('Scheduled location published.');setScheduleVersion(v=>v+1);});
    },
  };
}
