/** The caller JWT reaches the atomic database RPC; no service-role bypass or actor parameter. */
export interface AdminDisableDependencies { caller: (authorization: string) => any }
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createAdminDisableHandler(deps: AdminDisableDependencies) {
 return async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'Use POST.' });
  const authorization = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return reply(401, { error: 'Sign in with an administrator account.' });
  if (Number(req.headers.get('Content-Length') || 0) > 12000) return reply(413, { error: 'Request is too large.' });
  let body: any;
  try { const raw = await req.text(); if (raw.length > 12000) return reply(413, { error: 'Request is too large.' }); body = JSON.parse(raw); }
  catch { return reply(400, { error: 'Provide a session and reason.' }); }
  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(k => !['session_id', 'reason'].includes(k)) || typeof body.session_id !== 'string' || !UUID.test(body.session_id) || typeof body.reason !== 'string' || !body.reason.trim() || [...body.reason.trim()].length > 2000) return reply(400, { error: 'Provide a valid session and a reason of up to 2000 characters.' });
  try {
   const client = deps.caller(authorization);
   const { data: identity, error: authError } = await client.auth.getUser();
   if (authError || !identity?.user?.id) return reply(401, { error: 'Sign in with an administrator account.' });
   const { data, error } = await client.rpc('admin_disable_onthego_session', { p_session_id: body.session_id, p_reason: body.reason.trim() });
   if (error) {
    if (error.code === '42501') return reply(403, { error: 'Active administrator access required.' });
    if (error.code === '22023' || error.code === '22P02') return reply(400, { error: 'Provide a valid session and reason.' });
    if (error.code === 'P0002') return reply(404, { error: 'Session not found.' });
    if (['40001', '40P01', '55P03'].includes(error.code)) return reply(409, { error: 'Session or access changed. Refresh before trying again.' });
    return reply(503, { error: 'Could not confirm the session was disabled. Refresh and retry.' });
   }
   const session = data?.session;
   if (data?.success !== true || session?.id !== body.session_id || session?.status !== 'admin_disabled' || typeof session?.disabled_at !== 'string' || !Number.isFinite(Date.parse(session.disabled_at)) || typeof session?.disabled_reason !== 'string') return reply(503, { error: 'Could not confirm the session was disabled. Refresh and retry.' });
   return reply(200, { success: true, already_disabled: data.already_disabled === true, session: { id: session.id, status: session.status, disabled_at: session.disabled_at, disabled_reason: session.disabled_reason } });
  } catch { return reply(503, { error: 'Could not confirm the session was disabled. Refresh and retry.' }); }
 };
}
