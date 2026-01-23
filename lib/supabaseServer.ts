import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client - uses env vars directly
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase Server] Missing credentials');
    console.error('[Supabase Server] URL:', supabaseUrl ? 'set' : 'missing');
    console.error('[Supabase Server] Key:', supabaseKey ? 'set' : 'missing');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
