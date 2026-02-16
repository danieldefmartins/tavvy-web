import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string, zipCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const resolvedRef = useRef(false);

  // ── Helper: update state from a session ──────────────────────────────────
  const applySession = useCallback((s: Session | null) => {
    if (!mountedRef.current) return;
    setSession(s);
    setUser(s?.user ?? null);
    setLoading(false);
    resolvedRef.current = true;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    resolvedRef.current = false;

    // ── 1. Listen for auth state changes (PRIMARY mechanism) ──────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;

        switch (event) {
          case 'INITIAL_SESSION':
            // Fires once on page load with whatever Supabase found in storage
            applySession(newSession);
            break;

          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            applySession(newSession);
            break;

          case 'SIGNED_OUT':
            applySession(null);
            break;
        }
      }
    );

    // ── 2. Safety timeout — resolve with no session if nothing fires ──────
    const timeout = setTimeout(() => {
      if (!resolvedRef.current && mountedRef.current) {
        console.warn('[Auth] Init timed out after 6s — resolving with no session');
        applySession(null);
      }
    }, 6000);

    // ── 3. Visibility-change handler ──────────────────────────────────────
    // When the user returns to the tab after being away, re-check the session.
    // This catches cases where:
    //   • The JWT expired while the tab was hidden
    //   • iOS Safari purged memory and the in-memory state is stale
    //   • The token was refreshed in another tab via BroadcastChannel
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      if (!mountedRef.current) return;

      try {
        const { data: { session: freshSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] getSession on visibility change failed:', error.message);
          return;
        }
        // Only update if the session actually changed
        if (!mountedRef.current) return;
        const currentAccessToken = session?.access_token;
        const freshAccessToken = freshSession?.access_token;
        if (currentAccessToken !== freshAccessToken) {
          applySession(freshSession);
        }
      } catch (err) {
        // Network error — user is offline, don't log them out
        console.warn('[Auth] Could not re-check session (likely offline)');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // ── 4. Periodic token refresh check (every 4 minutes) ────────────────
    // Supabase auto-refreshes tokens, but this is a safety net in case
    // the auto-refresh timer was killed (e.g., iOS background suspension)
    const refreshInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      if (document.visibilityState !== 'visible') return;
      
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession && mountedRef.current) {
          // Check if token expires within the next 60 seconds
          const expiresAt = currentSession.expires_at;
          if (expiresAt && expiresAt * 1000 - Date.now() < 60000) {
            // Force a refresh
            await supabase.auth.refreshSession();
          }
        }
      } catch {
        // Silently ignore — auto-refresh will handle it
      }
    }, 4 * 60 * 1000); // every 4 minutes

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      clearInterval(refreshInterval);
      subscription.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Supabase fires SIGNED_IN → applySession updates state automatically
  };

  // ── Sign up ──────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, displayName?: string, zipCode?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;

    // Save ZIP code to profile if provided
    if (zipCode && data?.user?.id) {
      await supabase
        .from('profiles')
        .update({ zip_code: zipCode })
        .eq('user_id', data.user.id);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Even if the API call fails, clear local state so the user can re-login
      applySession(null);
      throw error;
    }
    // Supabase fires SIGNED_OUT → applySession clears state automatically
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
