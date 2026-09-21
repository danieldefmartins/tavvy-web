const fs = require('fs'), path = require('path'), ts = require('typescript'), assert = require('assert/strict');
function setup(repo) {
  const local = new Map(); const storage = {getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};global.localStorage=storage;
  const rows = { content_drafts: [], tavvy_places: [], places: [], atlas_universe_places: [] };
  let failure = null, lostResponse = false; const writes = [];
  const db = {storage:{from:()=>({upload:async()=>({error:{message:'upload denied'}})})},auth:{getUser:async()=>({data:{user:{id:'user'}}})},from(table) {
    let op='select', value, filters=[];
    const q={select(){return q},eq(k,v){filters.push([k,v]);return q},neq(){return q},is(){return q},order(){return q},limit(){return q},insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},upsert(v){op='upsert';value=v;return q},delete(){op='delete';return q},single(){return q},maybeSingle(){return q},then(resolve){
      if(failure && failure.table===table && failure.op===op) {failure=null;return Promise.resolve({data:null,error:{message:'mock failure'}}).then(resolve)}
      let data=rows[table].find(r=>filters.every(([k,v])=>r[k]===v))||null;
      if(op==='insert'){data={id:table+'-'+(rows[table].length+1),photos:[],...value};rows[table].push(data);writes.push({table,value});if(table==='tavvy_places')rows.places.push({id:'canonical',source_type:'user',source_id:data.id})}
      if(op==='update'&&data)Object.assign(data,value);
      if(op==='upsert'){rows[table]=[value];data=value;if(lostResponse){lostResponse=false;return Promise.resolve({data:null,error:{message:'response lost after commit'}}).then(resolve)}}
      return Promise.resolve({data,error:null}).then(resolve);
    }};return q;
  }};
  const react={useState:v=>[v,()=>{}],useRef:v=>({current:v}),useEffect:()=>{},useCallback:v=>v};
  const ex={}; const code=ts.transpileModule(fs.readFileSync(path.join(repo,'hooks/useDrafts.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','exports',code)(name=>name==='react'?react:name.includes('supabase')?{supabase:db}:name==='react-native'?{Alert:{}}:{default:storage},ex);
  return {ex,rows,writes,local,loseResponse:()=>lostResponse=true,fail:(table,op)=>failure={table,op}};
}
(async()=>{
for(const repo of [path.resolve(__dirname,'..'),path.resolve(__dirname,'../../tavvy-mobile')]) {
  const h=setup(repo), hook=h.ex.useDrafts({universe_id:'universe',universe_place_type:'ride'});
  await hook.createDraft({latitude:0,longitude:0});
  await hook.updateDraft({content_type:'business',data:{name:'Latest name'}},true);
  h.fail('content_drafts','update');
  assert.equal(await hook.updateDraft({data:{description:'Preserve me'}},true),false);
  h.fail('atlas_universe_places','upsert');
  assert.equal((await hook.submitDraft()).success,false);
  assert.equal(h.rows.tavvy_places.length,1);
  assert.equal((await hook.submitDraft()).success,true);
  assert.equal(h.rows.tavvy_places.length,1,'retry must reuse published place');
  assert.equal(h.rows.tavvy_places[0].name,'Latest name');
  assert.equal(h.rows.tavvy_places[0].description,'Preserve me');
  assert.equal(h.rows.tavvy_places[0].universe_id,'universe');
  assert.equal(h.rows.tavvy_places[0].place_subtype,'ride');
  assert.equal(h.rows.atlas_universe_places[0].place_id,'canonical');
  for(const latitude of [null,NaN,91]){const v=setup(repo),k=v.ex.useDrafts();await k.createDraft({latitude,longitude:0});await k.updateDraft({content_type:'business'},true);assert.equal((await k.submitDraft()).success,false);assert.equal(v.rows.tavvy_places.length,0)}
  const d=setup(repo),k=d.ex.useDrafts();await k.createDraft({latitude:1,longitude:1});d.fail('content_drafts','delete');assert.equal(await k.deleteDraft('content_drafts-1'),false);
  const off=setup(repo),ok=off.ex.useDrafts();
  const offline={id:'offline_123',user_id:'user',is_offline:true,status:'draft_review',latitude:0,longitude:0,content_type:'business',photos:[],data:{name:'Offline'},updated_at:new Date().toISOString()};
  ok.resumeDraft(offline);off.fail('content_drafts','upsert');
  assert.equal((await ok.submitDraft()).success,false);
  const retained=JSON.parse([...off.local.values()][0])[0];
  assert.match(retained.data._offline_sync_id,/^[0-9a-f-]{36}$/);
  assert.equal(retained.id,'offline_123');
  assert.equal(off.rows.tavvy_places.length,0);
  assert.equal((await ok.submitDraft()).success,true);
  assert.equal(off.rows.content_drafts.length,1);
  assert.equal(off.rows.content_drafts[0].id,retained.data._offline_sync_id);
  assert.equal(off.rows.tavvy_places[0].draft_id,retained.data._offline_sync_id);
  assert.equal(JSON.parse([...off.local.values()][0]).length,0);
  const lost=setup(repo),lk=lost.ex.useDrafts();lk.resumeDraft(offline);lost.loseResponse();
  assert.equal((await lk.submitDraft()).success,false);
  assert.equal(lost.rows.content_drafts.length,1);
  const resumed=JSON.parse([...lost.local.values()][0])[0];
  const restarted=lost.ex.useDrafts();restarted.resumeDraft(resumed);
  assert.equal((await restarted.submitDraft()).success,true);
  assert.equal(lost.rows.content_drafts.length,1,'lost response and app restart reuse same server draft');
  assert.equal(lost.rows.tavvy_places.length,1);
  const photo=setup(repo),pk=photo.ex.useDrafts();await pk.createDraft({latitude:1,longitude:1});await pk.updateDraft({content_type:'business',photos:['file:///photo.jpg']},true);const originalFetch=global.fetch;global.fetch=async()=>({arrayBuffer:async()=>new ArrayBuffer(8)});assert.equal((await pk.submitDraft()).success,false);assert.equal(photo.rows.tavvy_places.length,0);global.fetch=originalFetch;
  const schema=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/schema-audit/public-schema.json'),'utf8'));const columns=new Set(schema.columns.filter(c=>c.table==='tavvy_places').map(c=>c.column));for(const key of Object.keys(h.writes.find(w=>w.table==='tavvy_places').value))assert(columns.has(key),'unknown deployed column '+key);
  console.log('PASS',path.basename(repo),'zero coordinates, latest data, failed-save retry, universe canonical membership retry, invalid coordinates, delete errors');
}
})().catch(e=>{console.error(e);process.exitCode=1});
