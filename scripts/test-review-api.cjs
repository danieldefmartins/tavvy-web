const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const id='00000000-0000-0000-0000-000000000001',sid='00000000-0000-0000-0000-000000000002';
const transpile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const persist={};new Function('require','exports',transpile('lib/reviewPersistence.ts'))(()=>({supabase:{}}),persist);
async function run(body,opts={}) {
 const calls=[]; const client={auth:{getUser:async()=>({data:{user:{id}},error:opts.badAuth?Error('bad token'):null})},rpc:async(name,args)=>{calls.push({name,args});return opts.fail?{error:{code:'PGRST202'}}:{data:id,error:null}}};
 const ex={};new Function('require','exports',transpile('lib/reviewApi.ts'))(name=>name.includes('supabase')?{createClient:()=>client}:persist,ex);
 const res={code:0,body:null,setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
 await ex.default({method:'POST',body,headers:opts.noToken?{}:{authorization:'Bearer test'},cookies:{}},res);return {res,calls};
}
(async()=>{
const body={placeId:'fsq-id',signals:[{signalId:sid,intensity:3}]};
for(const [opts,code] of [[{noToken:true},401],[{badAuth:true},401],[{fail:true},503]]){const {res}=await run(body,opts);assert.equal(res.code,code);assert.notEqual(res.body.success,true)}
assert.equal((await run({...body,userId:sid})).res.code,403);
assert.equal((await run({...body,signals:[{signalId:sid,intensity:4}]})).res.code,400);
for(const payload of [body,{placeId:id,signalIds:[sid],intensities:{[sid]:2}}]) {
 const {res,calls}=await run(payload);assert.equal(res.code,200);assert.equal(res.body.success,true);assert.equal(calls.length,1);assert.equal(calls[0].name,'save_place_review_v2');
}
console.log('Both review API shapes: auth, spoofed user rejection, validation, RPC failure and confirmed success passed.');
})().catch(e=>{console.error(e);process.exit(1)});
