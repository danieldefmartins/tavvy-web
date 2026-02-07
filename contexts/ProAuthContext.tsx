import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';

interface Pro {
  id: string;
  fsq_place_id: string;
  slug: string;
  headline?: string;
  bio?: string;
  profile_image_url?: string;
  contact_email?: string;
  contact_phone?: string;
  subscription_status?: string;
  subscription_plan?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProAuthContextType {
  user: User | null;
  pro: Pro | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, proData: Partial<Pro>) => Promise<void>;
  signOut: () => Promise<void>;
}

const ProAuthContext = createContext<ProAuthContextType | undefined>(undefined);

/**
 * ProAuthProvider — now piggybacks on AuthContext instead of creating
 * its own onAuthStateChange listener. This eliminates the competing
 * listener that was causing race conditions and session instability.
 */
export function ProAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading: authLoading, signOut: authSignOut } = useAuth();
  const [pro, setPro] = useState<Pro | null>(null);
  const [proLoading, setProLoading] = useState(false);

  // Fetch pro profile whenever the authenticated user changes
  useEffect(() => {
    let cancelled = false;

    if (!user?.email) {
      setPro(null);
      setProLoading(false);
      return;
    }

    setProLoading(true);
    fetchProProfile(user.email).then((proData) => {
      if (!cancelled) {
        setPro(proData);
        setProLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user?.email]);

  const fetchProProfile = async (email: string): Promise<Pro | null> => {
    try {
      const { data, error } = await supabase
        .from('pros')
        .select('*')
        .eq('contact_email', email)
        .single();

      if (error) {
        // Not every user is a pro — this is expected for regular users
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Verify the email belongs to a pro before authenticating
    const { data: proData, error: proError } = await supabase
      .from('pros')
      .select('*')
      .eq('contact_email', email)
      .single();

    if (proError || !proData) {
      throw new Error('Pro account not found. Please check your email or sign up.');
    }

    // Use the shared Supabase auth — AuthContext will pick up the SIGNED_IN event
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Pro profile will be fetched automatically when user state updates
  };

  const signUp = async (email: string, password: string, proData: Partial<Pro>) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { user_type: 'pro' } },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const { error: proError } = await supabase
      .from('pros')
      .insert({
        contact_email: email,
        ...proData,
        is_active: false,
        subscription_status: 'inactive',
      });

    if (proError) throw proError;
  };

  const signOut = async () => {
    setPro(null);
    await authSignOut();
  };

  const loading = authLoading || proLoading;

  return (
    <ProAuthContext.Provider value={{ user, pro, session, loading, signIn, signUp, signOut }}>
      {children}
    </ProAuthContext.Provider>
  );
}

export function useProAuth() {
  const context = useContext(ProAuthContext);
  if (context === undefined) {
    throw new Error('useProAuth must be used within a ProAuthProvider');
  }
  return context;
}
