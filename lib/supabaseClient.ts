import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client — Singleton with robust session persistence
 *
 * Key fixes for session logout issues:
 * 1. Explicit storageKey so it never changes between env-var vs fallback URLs
 * 2. True singleton — created once, never re-created
 * 3. Uses localStorage (default) for session persistence
 */

// Hardcoded fallback credentials (public anon keys, safe to include)
const SUPABASE_URL = 'https://scasgwrikoqdwlwlwcff.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYXNnd3Jpa29xZHdsd2x3Y2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODUxODEsImV4cCI6MjA4MjU2MTE4MX0.83ARHv2Zj6oJpbojPCIT0ljL8Ze2JqMBztLVueGXXhs';

// Fixed storage key — never changes regardless of how the URL is resolved.
// This prevents the "lost session" bug where env-var URL vs fallback URL
// would produce different auto-generated storage keys.
const STORAGE_KEY = 'sb-scasgwrikoqdwlwlwcff-auth-token';

// Resolve credentials: prefer env vars (inlined at build time by Next.js),
// fall back to hardcoded values so the app always works.
function getUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  return SUPABASE_URL;
}

function getAnonKey(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return SUPABASE_ANON_KEY;
}

// ── Singleton ────────────────────────────────────────────────────────────────
let _instance: SupabaseClient | null = null;

function getInstance(): SupabaseClient {
  if (_instance) return _instance;

  const url = getUrl();
  const key = getAnonKey();

  _instance = createClient(url, key, {
    auth: {
      // Explicit, fixed storage key — the most important fix
      storageKey: STORAGE_KEY,
      // Keep the session in localStorage and auto-refresh the JWT
      persistSession: true,
      autoRefreshToken: true,
      // Detect OAuth redirects with tokens in the URL hash
      detectSessionInUrl: true,
      // Default flowType is 'implicit' which works for SPA
      flowType: 'implicit',
    },
  });

  return _instance;
}

// Export a lazy proxy so imports at the module level (SSR / build time)
// don't crash — the real client is only created on first property access
// in the browser.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getInstance();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
