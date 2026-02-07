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

// Timeout for session rehydration (5 seconds max)
const SESSION_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Get initial session with timeout protection
    // If getSession takes too long (e.g. JWT refresh hanging), resolve with null
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) => {
      setTimeout(() => {
        console.warn('[Auth] Session rehydration timed out after', SESSION_TIMEOUT_MS, 'ms');
        resolve({ data: { session: null } });
      }, SESSION_TIMEOUT_MS);
    });

    Promise.race([sessionPromise, timeoutPromise]).then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('[Auth] Error getting session:', err);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes (handles token refresh, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // If we were still loading (e.g. timeout fired but session came through), update
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle visibility change — refresh session when user comes back to the tab
  // In private browsing, localStorage can be cleared when backgrounded, so we need
  // to be careful not to log the user out just because getSession returns null
  useEffect(() => {
    const lastKnownUserRef = { user: user, session: session };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Try to refresh the session when tab becomes visible again
        supabase.auth.getSession().then(({ data: { session: refreshedSession } }) => {
          if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          } else if (lastKnownUserRef.session) {
            // Session was lost (likely private browsing cleared localStorage)
            // Try to use the refresh token if we still have it in memory
            console.warn('[Auth] Session lost on tab return, attempting recovery...');
            supabase.auth.refreshSession().then(({ data: { session: recoveredSession } }) => {
              if (recoveredSession) {
                setSession(recoveredSession);
                setUser(recoveredSession.user);
                console.log('[Auth] Session recovered successfully');
              } else {
                // Only log out if we truly can't recover
                console.warn('[Auth] Session recovery failed - user will need to log in again');
                // Don't immediately clear - give a grace period
                // The user might navigate to login page themselves
              }
            }).catch(() => {
              console.warn('[Auth] Session refresh failed on tab return');
            });
          }
        }).catch((err) => {
          console.warn('[Auth] Session refresh on visibility change failed:', err);
        });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [session, user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { 
          display_name: displayName 
        }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
