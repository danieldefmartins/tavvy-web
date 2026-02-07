import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Clear any stale Supabase auth tokens from localStorage.
 * This handles the case where expired/corrupted tokens prevent
 * fresh login from working properly.
 */
function clearStaleAuthTokens() {
  if (typeof window === 'undefined') return;
  try {
    // Supabase stores auth tokens with keys containing 'supabase' and 'auth'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('[Auth] Clearing stale token:', key);
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error('[Auth] Error clearing stale tokens:', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const explicitSignOutRef = useRef(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    resolvedRef.current = false;

    const resolve = (s: Session | null) => {
      if (resolvedRef.current || !mountedRef.current) return;
      resolvedRef.current = true;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      console.log('[Auth] onAuthStateChange:', event, newSession ? 'has session' : 'no session');

      if (event === 'INITIAL_SESSION') {
        if (newSession) {
          // Valid session found — use it
          resolve(newSession);
        } else {
          // No session found on init — this is normal for logged-out users
          // BUT if there are stale tokens in localStorage, Supabase may be
          // stuck trying to refresh them. Clear them so fresh login works.
          clearStaleAuthTokens();
          resolve(null);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        resolvedRef.current = true;
      } else if (event === 'SIGNED_OUT') {
        // Always handle SIGNED_OUT — whether explicit or from token expiry.
        // The old approach of ignoring non-explicit sign-outs was causing
        // stale state where the app thought the user was logged in but
        // the tokens were actually expired.
        setSession(null);
        setUser(null);
        setLoading(false);
        resolvedRef.current = true;
        
        // Clear any stale tokens to ensure fresh login works
        if (!explicitSignOutRef.current) {
          console.log('[Auth] Implicit sign-out detected (token expired?) — clearing stale tokens');
          clearStaleAuthTokens();
        }
        explicitSignOutRef.current = false;
      }
    });

    // Also call getSession() as a backup — whichever resolves first wins
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        resolve(s);
      }
      // If s is null, don't resolve yet — let INITIAL_SESSION handle it
      // (it will also clear stale tokens)
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      // getSession failed — likely corrupted tokens. Clear them.
      clearStaleAuthTokens();
      resolve(null);
    });

    // Hard timeout — NEVER let loading hang for more than 5 seconds
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[Auth] Init timed out after 5s — clearing stale tokens and proceeding');
        clearStaleAuthTokens();
        resolve(null);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Clear any stale tokens before attempting login
    // This ensures a fresh login even if old tokens are corrupted
    clearStaleAuthTokens();
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    explicitSignOutRef.current = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      explicitSignOutRef.current = false;
      // Even if signOut fails, clear local tokens so user can re-login
      clearStaleAuthTokens();
      throw error;
    }
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
