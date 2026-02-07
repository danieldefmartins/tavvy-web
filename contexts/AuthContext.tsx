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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const explicitSignOutRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Simple init: get session, set user, done.
    // If it fails or times out, we just proceed with no user.
    let resolved = false;

    const resolve = (s: Session | null) => {
      if (resolved || !mountedRef.current) return;
      resolved = true;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Hard timeout — NEVER let loading hang for more than 3 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[Auth] Init timed out after 3s — proceeding without session');
        resolve(null);
      }
    }, 3000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      resolve(s);
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      resolve(null);
    });

    // Listen for auth state changes AFTER init
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        if (explicitSignOutRef.current) {
          // User explicitly clicked sign out
          setSession(null);
          setUser(null);
          setLoading(false);
          explicitSignOutRef.current = false;
        }
        // If not explicit, IGNORE the sign-out event.
        // This prevents spurious logouts from localStorage clearing,
        // tab backgrounding, or Railway deploys.
        // The user stays "logged in" with stale data until they
        // refresh or navigate — which will trigger a fresh getSession().
      } else if (event === 'INITIAL_SESSION') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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
