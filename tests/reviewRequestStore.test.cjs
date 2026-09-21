const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
for (const repo of ['tavvy-web','tavvy-mobile']) test(`${repo}: uncertain save keeps its request key across reload without storing note content`,async()=>{
  const storage=new Map();
  const adapter={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const code=ts.transpileModule(fs.readFileSync(path.join(repo === 'tavvy-web' ? path.resolve(__dirname,'..') : (process.env.TAVVY_MOBILE_ROOT || path.resolve(__dirname,'../../tavvy-mobile')), 'lib/reviewRequestStore.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const load=()=>{const out={};new Function('window','require','exports',code)({sessionStorage:adapter},()=>({default:adapter}),out);return out;};
  const identity='user-id|restaurant-id|PRIVATE NOTE CONTENT';
  const first=await load().pendingReviewRequest(identity);
  const reloaded=load();assert.equal(await reloaded.pendingReviewRequest(identity),first);
  assert.equal([...storage.keys()].join('').includes('PRIVATE'),false);
  await reloaded.confirmReviewRequest(identity);assert.equal(storage.size,0);
  assert.notEqual(await load().pendingReviewRequest(identity),first);
});
