const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(relative,dependencies={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>dependencies[name]||{supabase:{}},Date,Map,Set});return exports;}
const evidence=load('lib/placeEvidence.ts', {'./rvCategories':load('lib/rvCategories.ts')}),reviews=load('lib/cruises/reviews.ts',{'../placeEvidence':evidence});
const visit=(id,date,signals)=>({reviewId:id,userId:id,visitedAt:date,signals});
const signal=(slug,label,category='good')=>({slug,label,category});
const cabin=signal('cruise_noisy_cabins','Noisy cabins','headsup');
test('complete history requires every page; current cabin complaints enter the onboard experience',async()=>{
 const calls=[];const rows=[visit('a',new Date().toISOString(),[cabin]),visit('b',new Date().toISOString(),[signal('cruise_quality_food','Quality food')])];
 const result=await reviews.fetchCruiseEvidence('universe',{rpc:async(_,args)=>{calls.push(args);return{data:{visits:[rows[calls.length-1]],snapshot:'stable',complete:calls.length===2,next_cursor:String(calls.length)},error:null}}});
 assert.equal(calls.length,2);assert.equal(calls[1].p_snapshot,'stable');assert.equal(calls[1].p_cursor,'1');assert.equal(result.coreLabel,'The onboard experience');assert.equal(result.coreConcerns[0].label,'Noisy cabins');assert.equal(result.recentReviewers,2);
 const incomplete=await reviews.fetchCruiseEvidence('universe',{rpc:async()=>({data:{visits:[rows[0]],snapshot:'stable',complete:false,next_cursor:'0'},error:null})});assert.equal(incomplete.dataStatus,'unavailable');assert.equal(incomplete.coreConcerns.length,0);
});
test('a changed history snapshot restarts once; repeated changes remain unavailable',async()=>{
 let count=0;const result=await reviews.fetchCruiseEvidence('universe',{rpc:async()=>++count===1?{data:null,error:{code:'40001'}}:{data:{visits:[],snapshot:'new',complete:true},error:null}});assert.equal(count,2);assert.equal(result.dataStatus,'empty');
 let failures=0;const unavailable=await reviews.fetchCruiseEvidence('universe',{rpc:async()=>{failures++;return{data:null,error:{code:'40001'}}}});assert.equal(failures,2);assert.equal(unavailable.dataStatus,'unavailable');
});
test('quiet public spaces never imply that cabin noise improved',()=>{
 const complaint=visit('old','2025-12-01',[cabin]);const later=Array.from({length:5},(_,i)=>visit('later'+i,'2026-09-01',[signal('cruise_quality_food','Quality food'),signal('cruise_quiet_spaces','Quiet spaces','vibe')]));
 const ordinary=evidence.buildPlaceEvidence([complaint,...later],'cruise_ship',new Date('2026-09-20'));assert.equal(ordinary.warnings[0].status,'faded');assert.equal(ordinary.warnings[0].directImprovementReports,0);
 const direct=evidence.buildPlaceEvidence([complaint,...later.map(v=>({...v,signals:[signal('cruise_restful_cabins','Restful cabins')]}))],'cruise_ship',new Date('2026-09-20'));assert.equal(direct.warnings[0].status,'improved');assert.equal(direct.warnings[0].directImprovementReports,5);
});
