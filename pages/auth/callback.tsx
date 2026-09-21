import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { safeAuthRedirect } from '../../lib/authRedirect';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    const complete = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.slice(1));
        if (url.searchParams.has('error') || hash.has('error')) throw new Error('Sign in was not completed. Please try again.');
        // The shared Supabase client detects and validates the implicit OAuth callback.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error('We could not complete sign in. Please try again.');
        if (!cancelled) {
          sessionStorage.setItem('tavvy_login_ts', Date.now().toString());
          await router.replace(safeAuthRedirect(url.searchParams.get('redirect')));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to complete sign in.');
      }
    };
    complete();
    return () => { cancelled = true; };
  }, [router.isReady]);
  return <main style={{ maxWidth: 480, margin: '15vh auto', padding: 24, fontFamily: 'system-ui' }}>
    <h1>{error ? 'Sign in needs another try' : 'Finishing sign in…'}</h1>
    {error && <><p role="alert">{error}</p><Link href={`/app/login?returnUrl=${encodeURIComponent(safeAuthRedirect(router.query.redirect))}`}>Back to sign in</Link></>}
  </main>;
}
