import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

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

export function ProAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pro, setPro] = useState<Pro | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If user is logged in, fetch their pro profile
      if (session?.user) {
        await fetchProProfile(session.user.email!);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch pro profile when user logs in
      if (session?.user) {
        await fetchProProfile(session.user.email!);
      } else {
        setPro(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('pros')
        .select('*')
        .eq('contact_email', email)
        .single();

      if (error) {
        console.error('Error fetching pro profile:', error);
        return;
      }

      setPro(data);
    } catch (err) {
      console.error('Error fetching pro profile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    // First, check if this email exists in the pros table
    const { data: proData, error: proError } = await supabase
      .from('pros')
      .select('*')
      .eq('contact_email', email)
      .single();

    if (proError || !proData) {
      throw new Error('Pro account not found. Please check your email or sign up.');
    }

    // Authenticate with Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) throw error;

    // Pro profile will be fetched automatically by the auth state change listener
  };

  const signUp = async (email: string, password: string, proData: Partial<Pro>) => {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { 
          user_type: 'pro'
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create pro profile
    const { error: proError } = await supabase
      .from('pros')
      .insert({
        contact_email: email,
        ...proData,
        is_active: false, // Needs verification
        subscription_status: 'inactive'
      });

    if (proError) {
      // If pro creation fails, we should clean up the auth user
      // But for now, just throw the error
      throw proError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setPro(null);
  };

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
