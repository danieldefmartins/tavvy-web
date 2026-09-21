import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Cache-Control':'private, no-store' };
/** A user JWT reaches the transactional RPC; ownership is checked there against tavvy_places.created_by. */
export async function handleOnTheGo(req: Request, action: string): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  const authorization = req.headers.get('Authorization');
  if (!authorization || !/^Bearer \S+$/.test(authorization)) return new Response(JSON.stringify({ error: 'Sign in required' }), { status: 401, headers });
  try {
    const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
    if(!url||!key)return new Response(JSON.stringify({error:'Service unavailable'}),{status:503,headers});
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Sign in required' }), { status: 401, headers });
    const payload = await req.json();
    const { data, error } = await client.rpc('onthego_session_action', { action_name: action, payload });
    if (error) return new Response(JSON.stringify({ error: error.message, retry_at: error.message?.startsWith('Please wait until') && Number.isFinite(Date.parse(error.details)) ? error.details : undefined }), { status: error.code === '42501' ? 403 : 400, headers });
    if(data?.success!==true)return new Response(JSON.stringify({error:'The session update could not be confirmed. Refresh its status before retrying.'}),{status:502,headers});
    return new Response(JSON.stringify(data), { status: action === 'start' ? 201 : 200, headers });
  } catch { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers }); }
}
