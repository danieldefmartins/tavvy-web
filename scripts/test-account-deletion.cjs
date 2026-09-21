const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, imports = {}) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(name => imports[name] ?? require(name), module, module.exports);
  return module.exports;
}
const { createDeleteAccountHandler } = load('supabase/functions/delete-account/handler.ts');
function fixture(failure, options = {}) {
  const calls = [];
  let manifests = 0;
  const caller = {
    auth: { getUser: async () => ({ data: { user: options.unauthenticated ? null : { id: 'verified-caller' } } }) },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === 'account_deletion_manifest') {
        manifests++;
        return { data: { objects: manifests === 1 || failure === 'storage_verification' ? [{ bucket: 'avatars', name: 'caller/avatar.jpg' }] : [], stripe_subscriptions: ['sub_123'] } };
      }
      if (name === 'stop_account_location_sharing') return { data: failure === 'location' ? null : { stopped: true } };
      return { data: failure === 'data' ? null : { cleaned: true }, error: failure === 'data' ? new Error('SQL confidential detail') : null };
    },
  };
  const handler = createDeleteAccountHandler({
    retentionPolicyApproved: options.approved !== false,
    caller: token => { calls.push(['caller', token]); return caller; },
    cancelSubscription: async id => { calls.push(['cancel', id]); if (failure === 'subscription') throw new Error('Secret Stripe detail'); },
    admin: {
      storage: { from: bucket => ({ remove: async names => { calls.push(['remove', bucket, names]); return { error: failure === 'storage' ? new Error('storage') : null }; } }) },
      auth: { admin: { deleteUser: async (...args) => { calls.push(['deleteUser', ...args]); return { error: failure === 'identity' ? new Error('FK') : null }; } } },
    },
  });
  return { handler, calls };
}
const request = (body = { confirmation: 'DELETE' }, auth = true, method = 'POST') => new Request('https://example.test/delete-account', {
  method, headers: auth ? { Authorization: 'Bearer caller-token', 'Content-Type': 'application/json' } : {},
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
});
(async () => {
  for (const [req, status, opts] of [
    [request({}, false),401,{}], [request({}),400,{}],
    [request({ confirmation:'DELETE', userId:'victim' }),400,{}],
    [request(undefined,true,'GET'),405,{}], [request(),401,{ unauthenticated:true }], [request(),503,{ approved:false }],
  ]) {
    const f = fixture(null,opts); assert.equal((await f.handler(req)).status,status);
    assert.ok(!f.calls.some(c => ['remove','cancel','deleteUser'].includes(c[0])));
  }
  const happy = fixture(); const response = await happy.handler(request());
  assert.equal(response.status,200); assert.deepEqual(await response.json(),{deleted:true});
  assert.deepEqual(happy.calls.map(c=>c[0]),['caller','account_deletion_manifest','stop_account_location_sharing','cancel','remove','delete_account_private_data','account_deletion_manifest','deleteUser']);
  assert.deepEqual(happy.calls.at(-1),['deleteUser','verified-caller',false]);
  assert.ok(happy.calls.filter(c=>c[0].includes('account_')).every(c=>JSON.stringify(c[1])==='{"p_confirmation":"DELETE"}'));
  for (const stage of ['location','subscription','storage','data','storage_verification','identity']) {
    const f=fixture(stage); const r=await f.handler(request()); const result=await r.json();
    assert.equal(r.status,500); assert.equal(result.deleted,false); assert.equal(result.stage,stage);
    assert.ok(!JSON.stringify(result).includes('confidential')); assert.ok(!JSON.stringify(result).includes('Stripe detail'));
    if(stage!=='identity') assert.ok(!f.calls.some(c=>c[0]==='deleteUser'));
  }
  for (const result of [{ data:{deleted:false} },{ error:{context:{json:async()=>({error:'Some data was removed. Retry.'})}} }]) {
    let signedOut=false;
    const client=load('lib/accountDeletion.ts',{'./supabaseClient':{supabase:{functions:{invoke:async()=>result},auth:{signOut:async()=>{signedOut=true;}}}}});
    await assert.rejects(client.deleteCurrentAccount()); assert.equal(signedOut,false);
  }
  let sent;
  const client=load('lib/accountDeletion.ts',{'./supabaseClient':{supabase:{functions:{invoke:async(...args)=>{sent=args;return {data:{deleted:true}};}},auth:{signOut:async()=>{throw new Error('local cache');}}}}});
  await client.deleteCurrentAccount(); assert.deepEqual(sent,['delete-account',{body:{confirmation:'DELETE'}}]);
  console.log('PASS account deletion: caller authentication, confirmation, ID injection rejection, release gate, operation ordering, all partial failures, exact identity, truthful client outcome. No network or live writes.');
})().catch(error => { console.error(error); process.exit(1); });
