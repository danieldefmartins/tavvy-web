import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeMapData } from './onthego';

/** Refreshes never erase a useful result or revive an expired live location. */
export function useOnTheGoDiscovery(endpoint: string) {
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(false), inFlight = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    const controller = new AbortController(); inFlight.current = controller;
    setRefreshing(true);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {signal:controller.signal});
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json(); normalizeMapData(data);
      if (mounted.current) { setRaw(data); setUpdatedAt(Date.now()); setNow(Date.now()); setError(null); }
    } catch {
      if (mounted.current) setError('Unable to refresh mobile businesses. Please try again.');
    } finally {
      clearTimeout(timeout); inFlight.current = null;
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, [endpoint]);
  useEffect(() => {
    mounted.current = true; void refresh();
    const refreshTimer = setInterval(refresh, 30000);
    const expiryTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => { mounted.current = false; clearInterval(refreshTimer); clearInterval(expiryTimer); inFlight.current?.abort(); };
  }, [refresh]);
  const businesses = useMemo(() => {
    if (!raw) return [];
    const {sessions, scheduled} = normalizeMapData(raw,now); return [...sessions,...scheduled];
  },[raw,now]);
  return {businesses,loading,refreshing,error,updatedAt,refresh};
}
