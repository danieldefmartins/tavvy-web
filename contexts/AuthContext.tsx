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

    // Listen for auth state changes — this fires INITIAL_SESSION first,
    // then SIGNED_IN on login, TOKEN_REFRESHED on refresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      if (event === 'INITIAL_SESSION') {
        // This is the most reliable way to get the initial session.
        // It fires even if getSession() is slow or times out.
        resolve(newSession);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        resolvedRef.current = true;
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
      }
    });

    // Also call getSession() as a backup — whichever resolves first wins
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      resolve(s);
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      // Don't resolve to null here — wait for INITIAL_SESSION or timeout
    });

    // Hard timeout — NEVER let loading hang for more than 5 seconds
    // Increased from 3s to 5s to give slow connections more time
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[Auth] Init timed out after 5s — proceeding without session');
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
