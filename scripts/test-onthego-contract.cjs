/* Offline contract tests. All Supabase operations are mocked; no credentials/network. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function compile(file, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'exports', source)(name => { if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const contract = compile('lib/onthegoOwnerContract.ts');
const map = compile('lib/onthego.ts');
const future = new Date(Date.now() + 3600000).toISOString();
const fixture = { success: true, places: [{ id: 'business-1', name: 'Mobile Barber' }], sessions: [{ id: 'session-1', tavvy_place_id: 'business-1', session_lat: 0, session_lng: 0, status: 'active', scheduled_end_at: future, session_address: 'Public square', address_confirmed: true }] };
assert.equal(contract.parseOwnerData(fixture).sessions[0].id, 'session-1');
assert.deepEqual(contract.parseOwnerData({ success: true, places: [], active_sessions: [] }), { places: [], sessions: [] });
assert.equal(contract.parseOwnerData({ ...fixture, sessions: [{ ...fixture.sessions[0], scheduled_end_at: '2000-01-01' }] }).sessions.length, 0);
assert.equal(contract.parseOwnerData({ ...fixture, sessions: [{ ...fixture.sessions[0], tavvy_place_id: 'someone-else' }] }).sessions.length, 0);
assert.equal(contract.parseStartedSession({ success: true, session: fixture.sessions[0] }).id, 'session-1');
assert.throws(() => contract.parseStartedSession({ success: true, session_id: 'old-doc-shape' }));
assert.deepEqual(contract.ownerCategory('Mobile Barber'), { tavvy_category: 'Mobile Services', tavvy_subcategory: 'Mobile Barber' });
assert.deepEqual(contract.ownerCategory('Coffee'), { tavvy_category: 'Food Trucks', tavvy_subcategory: 'Coffee' });
assert(map.matchesBusiness({ tavvy_place_id: 'b', place_name: 'Zero', is_live: true, category: 'Mobile Services', subcategory: 'Mobile Barber' }, 'hair-beauty'));
assert(map.validCoordinates(0, 0)); assert(!map.validCoordinates(null, 0));
let slots = [], cursor = 0, calls = [], signedIn = true, server = structuredClone(fixture);
const react = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  useCallback(fn) { return fn; }, useEffect() {},
};
const supabase = {
  auth: { getSession: async () => ({ data: { session: signedIn ? { user: { id: 'owner' } } : null } }) },
  functions: { invoke: async (name, options) => {
    calls.push({ name, options });
    if (name === 'my-active-session') return { data: server };
    if (name === 'go-live-start') return { data: { success: true, session: { ...fixture.sessions[0], id: 'new-session', address_confirmed: false } } };
    if (name === 'go-live-update') return { data: { success: true, session: { ...fixture.sessions[0], ...options.body, id: 'new-session', address_confirmed: false } } };
    return { data: { success: true } };
  } },
};
const hooks = compile('lib/useOnTheGoOwner.ts', { react, './supabaseClient': { supabase }, './onthego': map, './onthegoOwnerContract': contract, './onthegoDetails': { enableMobilePlaceDetails:async()=> 'canonical-test' } });
const render = () => { cursor = 0; return hooks.useOnTheGoOwner(); };
(async () => {
  let owner = render(); assert.equal(calls.length, 0, 'render never publishes');
  await owner.recover(); owner = render(); assert.equal(owner.sessionId, 'session-1'); assert.equal(owner.address, 'Public square');
  assert.equal(calls[0].options.method, 'GET');
  await owner.end(); owner = render(); assert.equal(owner.sessionId, '');
  await owner.start(0, 0, 4, 'Open'); owner = render(); assert.equal(owner.sessionId, 'new-session');
  assert.deepEqual(calls.find(c => c.name === 'go-live-start').options.body, { tavvy_place_id: 'business-1', latitude: 0, longitude: 0, duration_hours: 4, today_note: 'Open' });
  await owner.update(1, 2, 'Moved'); owner = render(); assert.equal(owner.confirmed, false);
  assert.deepEqual(calls.find(c => c.name === 'go-live-update').options.body, { session_id: 'new-session', session_lat: 1, session_lng: 2, today_note: 'Moved' });
  owner.setAddress('New public square'); owner = render(); await owner.confirm(); owner = render(); assert(owner.confirmed);
  const before = calls.length; await owner.start(0, 0, 4, 'Duplicate'); assert.equal(calls.length, before, 'active session cannot start twice');
  signedIn = false; await owner.recover(); owner = render(); assert.equal(owner.sessionId, ''); assert.equal(owner.places.length, 0);
  const signedOutCalls = calls.length; await owner.register('Another', 'Coffee', 'Town'); assert.equal(calls.length, signedOutCalls, 'signed-out mutations blocked');
  global.Deno = { env: { get: name => name === 'SUPABASE_URL' ? 'https://example.test' : 'public-anon-key' } };
  let rpcCalls = [], validUser = true;
  const edge = compile('supabase/functions/_shared/onthego-lifecycle.ts', { 'https://esm.sh/@supabase/supabase-js@2': { createClient: () => ({ auth: { getUser: async () => ({ data: { user: validUser ? { id: 'owner' } : null } }) }, rpc: async (name, args) => { rpcCalls.push({ name, args }); return { data: { success: true } }; } }) } });
  assert.equal((await edge.handleOnTheGo(new Request('https://example.test', { method: 'GET' }), 'update')).status, 405);
  assert.equal((await edge.handleOnTheGo(new Request('https://example.test', { method: 'POST', body: '{}' }), 'update')).status, 401);
  validUser = false;
  assert.equal((await edge.handleOnTheGo(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer invalid' }, body: '{}' }), 'update')).status, 401);
  assert.equal(rpcCalls.length, 0);
  validUser = true;
  await edge.handleOnTheGo(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer owner-token' }, body: JSON.stringify({ session_id: 'session-1', session_lat: 0, session_lng: 0 }) }), 'update');
  assert.deepEqual(rpcCalls[0], { name: 'onthego_session_action', args: { action_name: 'update', payload: { session_id: 'session-1', session_lat: 0, session_lng: 0 } } });
  delete global.Deno;
  console.log('On The Go actual-contract recovery/lifecycle/privacy and authenticated edge tests passed (offline mocks).');
})().catch(error => { console.error(error); process.exitCode = 1; });
