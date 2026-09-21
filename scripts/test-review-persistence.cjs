const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const id='00000000-0000-0000-0000-000000000001',sid='00000000-0000-0000-0000-000000000002';
function setup(repo,opts={}) {
 const calls=[];
 const db={auth:{getUser:async()=>({data:{user:opts.signedOut?null:{id}},error:null})},
 rpc:(name,args)=>{calls.push({name,args}); const response=Promise.resolve(opts.rpcError?{error:opts.rpcError}:{data:opts.noResult?null:id,error:null});return response;},
 from:()=>{throw Error('Unexpected client-side table write');}};
 const code=ts.transpileModule(fs.readFileSync(path.join(repo,'lib/reviewPersistence.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const store={};const storeCode=ts.transpileModule(fs.readFileSync(path.join(repo,'lib/reviewRequestStore.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',storeCode)(()=>({default:{getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{}}}),store);
 const ex={};new Function('require','exports',code)(name=>name==='./reviewRequestStore'?store:{supabase:db},ex);return {ex,calls};
}
(async()=>{
for(const repo of [path.resolve(__dirname,'..'),path.resolve(__dirname,'../../tavvy-mobile')]) {
 const {ex,calls}=setup(repo);
 for(const values of [[],[{signalId:sid,intensity:0}],[{signalId:sid,intensity:4}],[{signalId:sid,intensity:1.5}],[{signalId:'bad',intensity:1}],[{signalId:sid,intensity:1},{signalId:sid,intensity:2}]])assert.equal((await ex.submitReview('fsq-id','Place',values)).success,false);
 assert.equal(calls.length,0,'invalid input never reaches backend');
 assert.equal((await ex.submitReview('fsq-id','Airport bathroom',[{signalId:sid,intensity:3}])).success,true);
 assert.equal(calls[0].name,'save_place_review_v2');assert.equal(calls[0].args.p_signals[0].intensity,3);assert.equal(calls[0].args.p_mode,'new_visit');assert.ok(calls[0].args.p_request_key);
 assert.equal((await ex.updateReview(id,'fsq-id',[{signalId:sid,intensity:2}])).success,true);assert.equal(calls[1].args.p_review_id,id);assert.equal(calls[1].args.p_mode,'edit');
 for(const opts of [{signedOut:true},{noResult:true},{rpcError:{code:'PGRST202',message:'missing function'}},{rpcError:{message:'write failed'}}]){
  const h=setup(repo,opts);assert.equal((await h.ex.submitReview(id,'Place',[{signalId:sid,intensity:1}])).success,false);
 }
}
console.log('Web/mobile review persistence: validation, authentication, atomic RPC, updates, missing migration, failed/unconfirmed write cases passed.');
})().catch(e=>{console.error(e);process.exit(1)});
