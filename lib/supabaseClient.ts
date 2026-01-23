import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a chainable mock query builder
const createMockQueryBuilder = () => {
  const mockResult = { data: [], error: null };
  const chainable: any = {
    select: () => chainable,
    eq: () => chainable,
    neq: () => chainable,
    gte: () => chainable,
    lte: () => chainable,
    gt: () => chainable,
    lt: () => chainable,
    is: () => chainable,
    in: () => chainable,
    or: () => chainable,
    ilike: () => chainable,
    like: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    range: () => chainable,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve(mockResult),
    data: [],
    error: null,
  };
  return chainable;
};

// Create a mock client for build time when env vars aren't available
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a minimal mock for build time
    // This allows the build to complete without env vars
    console.warn('Supabase credentials not found. Using mock client.');
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      },
      from: () => createMockQueryBuilder(),
    } as unknown as SupabaseClient;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabase = createSupabaseClient();
