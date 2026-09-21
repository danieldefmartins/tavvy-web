import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ECardEntitlement, fetchMyECardEntitlement } from '../lib/ecardEntitlement';
/** One authoritative plan read for creation, template selection, saving and publishing. */
export function useECardPlan() {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<ECardEntitlement | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false; setPlan(null); setError('');
    if (authLoading) { setLoading(true); return; }
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetchMyECardEntitlement().then(value => { if (!cancelled) setPlan(value); })
      .catch(() => { if (!cancelled) setError('Your plan could not be checked. Try again before saving or publishing.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, authLoading, retry]);
  return { isPro: plan?.is_pro === true || plan?.is_super_admin === true, loading, error, retry: useCallback(() => setRetry(value => value + 1), []) };
}
