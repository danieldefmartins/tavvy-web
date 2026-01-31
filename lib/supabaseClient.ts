import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance - will be created on first use (at runtime, not build time)
let supabaseInstance: SupabaseClient | null = null;

// Create a chainable mock query builder for build time
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
const createMockClient = (): SupabaseClient => {
  console.warn('[Supabase] Using mock client - credentials not available');
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
};

// Get Supabase credentials from NEXT_PUBLIC_ env vars
// These are automatically inlined by Next.js at build time
const getSupabaseCredentials = (): { url: string; anonKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (url && anonKey) {
    console.log('[Supabase] Using credentials from NEXT_PUBLIC_ env vars');
  }
  
  return { url, anonKey };
};

// Get or create the Supabase client
// This function is called at runtime, ensuring env vars are available
const getSupabaseClient = (): SupabaseClient => {
  // If we already have an instance, return it
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Get credentials at runtime
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseCredentials();

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    console.log('[Supabase] Initializing client in browser...');
    console.log('[Supabase] URL available:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '');
    console.log('[Supabase] Key available:', !!supabaseAnonKey);
  }

  // If credentials are not available, return mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    // During SSR/build, return mock but don't cache it
    // This allows runtime to create a real client
    if (typeof window === 'undefined') {
      return createMockClient();
    }
    
    // In browser without credentials - this is a problem
    console.error('[Supabase] Credentials not available in browser!');
    console.error('[Supabase] Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    return createMockClient();
  }

  // Create the real client
  console.log('[Supabase] Creating real client');
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
};

// Export a proxy that lazily initializes the client
// This ensures the client is created at runtime, not at import time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
