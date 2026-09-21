import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAdminDisableHandler } from './handler.ts';
Deno.serve(createAdminDisableHandler({ caller: authorization => createClient(
 Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
 { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } },
) }));
