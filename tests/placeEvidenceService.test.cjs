const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const id='00000000-0000-0000-0000-000000000001';
const signal='00000000-0000-0000-0000-000000000002';
const now=new Date('2026-09-20T12:00:00Z');
function modules(repo=root) {
  const exports={};
  function load(name){if(exports[name]) return exports[name];const out={};exports[name]=out;
    const js=ts.transpileModule(fs.readFileSync(path.join(repo,'lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','exports',js)(request=>request==='./supabaseClient'?{supabase:{}}:load(request.slice(2)),out);return out;
  }
  return load('placeEvidenceService');
}
function legacyClient(rows,{tapError=false,catalogError=false,total,shorten=false}={}) {
  const requests=[];
  return {requests,rpc:async()=>({error:{code:'PGRST202'}}),from(table){
    let from=0,to=499;
    const chain={select(){return chain},in(){return chain},eq(){return chain},lte(){return chain},order(){return chain},range(a,b){from=a;to=b;return chain},then(resolve){
      requests.push({table,from,to});
      if(table==='review_items') return Promise.resolve({data:catalogError?null:[{id:signal,slug:'fresh_pasta',label:'Fresh Pasta',signal_type:'best_for'}],error:catalogError?{message:'failed'}:null}).then(resolve);
      if(table==='place_review_signal_taps') return Promise.resolve({data:tapError?null:rows.map(r=>({id:r.id,review_id:r.id,signal_id:signal,intensity:3})).slice(from,to+1),error:tapError?{message:'failed'}:null,count:rows.length}).then(resolve);
      return Promise.resolve({data:rows.slice(from,shorten?from+1:to+1),error:null,count:total??rows.length}).then(resolve);
    }};return chain;
  }};
}

test('both platforms paginate more than 500 reviews without losing accounts',async()=>{
  const rows=Array.from({length:501},(_,i)=>({id:`r-${i}`,place_id:id,user_id:`u-${i}`,created_at:'2026-09-19T00:00:00Z'}));
  for(const repo of [root,process.env.TAVVY_MOBILE_TEST_ROOT || path.resolve(root,'../tavvy-mobile')]) {
    const client=legacyClient(rows);const result=await modules(repo).fetchPlaceEvidence(id,'restaurant',{client,now});
    assert.equal(result.dataStatus,'ready');assert.equal(result.recentReviewers,501);assert.equal(result.coreSignals[0].reports,501);
    assert.ok(client.requests.some(r=>r.table==='place_reviews'&&r.from===500));
  }
});

test('empty source differs from failed reads and capped summaries',async()=>{
  const load=modules().fetchPlaceEvidence;
  assert.equal((await load(id,'restaurant',{client:legacyClient([]),now})).dataStatus,'empty');
  const rows=[{id:'r',place_id:id,user_id:'u',created_at:'2026-09-19T00:00:00Z'}];
  for(const option of [{tapError:true},{catalogError:true},{total:20001},{total:5,shorten:true}]) assert.equal((await load(id,'restaurant',{client:legacyClient(rows,option),now})).dataStatus,'unavailable');
});

test('unavailable revision RPC never silently falls back after a server failure',async()=>{
  const client={rpc:async()=>({error:{code:'XX000'}}),from(){throw Error('Must not fall back');}};
  assert.equal((await modules().fetchPlaceEvidence(id,'restaurant',{client,now})).dataStatus,'unavailable');
});

test('snapshot changes restart pagination once; repeated changes remain unavailable',async()=>{
  let calls=0;
  const visit={review_id:'r',place_id:id,user_id:'u',visited_at:'2026-09-19T00:00:00Z',signals:[{slug:'fresh_pasta',label:'Fresh Pasta',category:'good'}]};
  const client={rpc:async()=>++calls===1?{error:{code:'40001'}}:{data:{snapshot:'new',complete:true,visits:[visit]}},from(){throw Error('unexpected');}};
  const result=await modules().fetchPlaceEvidence(id,'restaurant',{client,now});
  assert.equal(result.dataStatus,'ready');assert.equal(calls,2);
  assert.equal((await modules().fetchPlaceEvidence(id,'restaurant',{client:{...client,rpc:async()=>({error:{code:'40001'}})},now})).dataStatus,'unavailable');
});

test('malformed or non-advancing RPC pages cannot produce an empty-success summary',async()=>{
  const client={rpc:async()=>({data:{snapshot:'one',complete:false,visits:[],next_cursor:null}}),from(){throw Error('unexpected');}};
  assert.equal((await modules().fetchPlaceEvidence(id,'restaurant',{client,now})).dataStatus,'unavailable');
});
