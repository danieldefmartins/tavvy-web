import { supabase } from './supabaseClient';
import { safeAuthRedirect } from './authRedirect';

export async function startOAuth(provider: 'apple' | 'google', redirect: unknown) {
  const callback = new URL('/auth/callback', window.location.origin);
  callback.searchParams.set('redirect', safeAuthRedirect(redirect));
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callback.toString() } });
  if (error) throw error;
}
