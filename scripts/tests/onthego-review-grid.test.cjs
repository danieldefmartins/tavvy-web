const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
function module(react,load){const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,'lib/useBusinessReviewSummaries.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const deps={react,'./onthegoDetails':{isBusinessUuid:uuid},'./reviewSummaryLoader':{loadReviewSummaries:load},'./placeReviewSummary':{buildPlaceReviewSummary:(_,subject,status)=>({status,subject,tiles:[]})}};new Function('require','exports',code)(n=>{assert(n in deps,n);return deps[n]},exports);return exports;}
test('mobile business IDs and session IDs never become review subjects; canonical subjects deduplicate',()=>{
 const {businessReviewSubjects}=module({},()=>{});
 const subjects=businessReviewSubjects([{tavvy_place_id:id,session_id:other},{tavvy_place_id:other,canonical_place_id:id,category:'Food Trucks'},{canonical_place_id:id,category:'Food Trucks'},{canonical_place_id:'bad'}]);
 assert.deepEqual(subjects,[{id,category:'Food Trucks',subcategory:undefined}]);
});
test('unlinked and failed reads remain unavailable; late results cannot replace a new business scope',async()=>{
 const slots=[],effects=[],pending=[];let index=0,dirty=true,current,rows=[{tavvy_place_id:other,canonical_place_id:id,category:'Food Trucks'}];
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const react={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{slots[i]=v;dirty=true}]},useEffect(fn,deps){const i=index++;if(!slots[i]||!same(slots[i].deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>slots[i].cleanup=fn());}}};
 const {useBusinessReviewSummaries}=module(react,subjects=>new Promise(resolve=>pending.push({subjects,resolve})));
 const render=()=>{for(let n=0;dirty&&n<10;n++){dirty=false;index=0;current=useBusinessReviewSummaries(rows);effects.splice(0).forEach(f=>f());}return current;};
 const tick=async()=>{await new Promise(r=>setImmediate(r));render();};
 render();assert.equal(current(rows[0]).status,'loading');assert.equal(current({tavvy_place_id:id}).status,'unavailable');
 rows=[{tavvy_place_id:id,canonical_place_id:other,category:'Mobile Notary'}];dirty=true;render();
 pending[1].resolve({[other]:{status:'unavailable',tiles:[]}});await tick();assert.equal(current(rows[0]).status,'unavailable');
 pending[0].resolve({[id]:{status:'ready',tiles:[{count:999}]}});await tick();assert.equal(current(rows[0]).status,'unavailable');
 rows=[];dirty=true;render();assert.equal(pending.length,2,'no request for unlinked or absent businesses');
});
