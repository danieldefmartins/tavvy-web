import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ECardEntitlement, fetchMyECardEntitlement } from '../lib/ecardEntitlement';
export function useECardEntitlement() {
  const { user } = useAuth();
  const [state, setState] = useState<{ userId: string; value: ECardEntitlement } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    if (!user) { setState(null); setLoading(false); return; }
    try { setState({ userId: user.id, value: await fetchMyECardEntitlement() }); }
    catch (e) { setState(null); setError((e as Error).message); }
    finally { setLoading(false); }
  }, [user?.id]);
  useEffect(() => { void refresh(); }, [refresh]);
  const value = state?.userId === user?.id ? state?.value : null;
  return { isPro: value?.is_pro === true, isSuperAdmin: value?.is_super_admin === true, loading, error, refresh, entitlement: value };
}
