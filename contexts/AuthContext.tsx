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

// Session backup key for recovery when localStorage is cleared (private browsing)
const SESSION_BACKUP_KEY = 'tavvy_session_backup';

// Save session to sessionStorage as backup (survives tab switches in private browsing)
function backupSession(session: Session | null) {
  try {
    if (typeof window === 'undefined') return;
    if (session) {
      sessionStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
        expires_at: session.expires_at,
      }));
    }
  } catch (e) {
    // sessionStorage might not be available
  }
}

// Recover session from sessionStorage backup
function recoverSessionBackup(): { access_token: string; refresh_token: string } | null {
  try {
    if (typeof window === 'undefined') return null;
    const backup = sessionStorage.getItem(SESSION_BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (parsed.refresh_token) {
        return { access_token: parsed.access_token, refresh_token: parsed.refresh_token };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function clearSessionBackup() {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_BACKUP_KEY);
    }
  } catch (e) {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  // Track if user explicitly signed out — only then should we clear state
  const explicitSignOutRef = useRef(false);
  // Keep a ref to the latest session for use in event handlers
  const sessionRef = useRef<Session | null>(null);
  const userRef = useRef<User | null>(null);

  const updateSession = useCallback((newSession: Session | null) => {
    setSession(newSession);
    sessionRef.current = newSession;
    const newUser = newSession?.user ?? null;
    setUser(newUser);
    userRef.current = newUser;
    setLoading(false);
    
    // Backup session for recovery
    if (newSession) {
      backupSession(newSession);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initSession = async () => {
      try {
        // Try to get session from Supabase (reads from localStorage)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          updateSession(existingSession);
          return;
        }

        // If no session in localStorage, try to recover from sessionStorage backup
        // This handles the case where private browsing cleared localStorage
        const backup = recoverSessionBackup();
        if (backup) {
          console.log('[Auth] Attempting session recovery from backup...');
          const { data: { session: recoveredSession }, error } = await supabase.auth.setSession({
            access_token: backup.access_token,
            refresh_token: backup.refresh_token,
          });
          if (recoveredSession && !error) {
            console.log('[Auth] Session recovered from backup');
            updateSession(recoveredSession);
            return;
          }
        }

        // No session available
        setLoading(false);
      } catch (err) {
        console.error('[Auth] Error initializing session:', err);
        setLoading(false);
      }
    };

    // Initialize with a timeout
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Session init timed out, proceeding without session');
        setLoading(false);
      }
    }, 5000);

    initSession().finally(() => clearTimeout(timeout));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[Auth] Auth state change:', event);
      
      if (event === 'SIGNED_OUT') {
        // Only clear state if user explicitly signed out
        if (explicitSignOutRef.current) {
          updateSession(null);
          clearSessionBackup();
          explicitSignOutRef.current = false;
        } else {
          // This is likely a spurious sign-out from localStorage being cleared
          // Don't clear the user state — try to recover instead
          console.warn('[Auth] Unexpected SIGNED_OUT event, attempting recovery...');
          const backup = recoverSessionBackup();
          if (backup) {
            supabase.auth.setSession({
              access_token: backup.access_token,
              refresh_token: backup.refresh_token,
            }).then(({ data: { session: recovered } }) => {
              if (recovered) {
                console.log('[Auth] Session recovered after unexpected sign-out');
                updateSession(recovered);
              } else {
                // Truly lost — clear state
                console.warn('[Auth] Recovery failed, clearing session');
                updateSession(null);
                clearSessionBackup();
              }
            }).catch(() => {
              updateSession(null);
              clearSessionBackup();
            });
          } else {
            // No backup available — clear state
            updateSession(null);
          }
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        updateSession(newSession);
      } else if (event === 'INITIAL_SESSION') {
        if (newSession) {
          updateSession(newSession);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle visibility change — refresh session when user comes back to the tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      
      // If we have a user in state, try to refresh the session
      if (userRef.current) {
        try {
          const { data: { session: refreshed } } = await supabase.auth.getSession();
          if (refreshed) {
            updateSession(refreshed);
            return;
          }
          
          // Session gone from localStorage — try backup recovery
          const backup = recoverSessionBackup();
          if (backup) {
            console.log('[Auth] Tab returned: recovering session from backup...');
            const { data: { session: recovered } } = await supabase.auth.setSession({
              access_token: backup.access_token,
              refresh_token: backup.refresh_token,
            });
            if (recovered) {
              console.log('[Auth] Tab returned: session recovered');
              updateSession(recovered);
            }
          }
        } catch (err) {
          console.warn('[Auth] Tab return session refresh failed:', err);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [updateSession]);

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
    // Mark as explicit sign out so the listener knows to clear state
    explicitSignOutRef.current = true;
    clearSessionBackup();
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
