import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

    // Listen for auth state changes — this is the PRIMARY mechanism
    // Supabase handles token refresh, session persistence, etc. automatically.
    // We should NOT interfere with localStorage — Supabase manages its own tokens.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      console.log('[Auth] onAuthStateChange:', event, newSession ? 'has session' : 'no session');

      switch (event) {
        case 'INITIAL_SESSION':
          // This fires once on page load with the current session state.
          // If newSession is null, the user is genuinely not logged in.
          // Do NOT clear localStorage — Supabase already checked and found nothing.
          resolve(newSession);
          break;

        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          // User just logged in or token was refreshed — update state
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          resolvedRef.current = true;
          break;

        case 'SIGNED_OUT':
          // User signed out (explicitly or token expired beyond recovery)
          setSession(null);
          setUser(null);
          setLoading(false);
          resolvedRef.current = true;
          break;
      }
    });

    // Safety timeout — if INITIAL_SESSION never fires (shouldn't happen, but just in case)
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[Auth] Init timed out after 8s — resolving with no session');
        resolve(null);
      }
    }, 8000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Do NOT clear localStorage before login — Supabase handles this.
    // Clearing tokens here would destroy a valid session if the user
    // is already logged in and accidentally hits the login page.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // After successful signIn, Supabase will fire SIGNED_IN event
    // which updates our state automatically via onAuthStateChange.
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Even if signOut API call fails, clear local state
      // so the user can attempt to log in again
      setSession(null);
      setUser(null);
      throw error;
    }
    // Supabase will fire SIGNED_OUT event which clears our state
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
