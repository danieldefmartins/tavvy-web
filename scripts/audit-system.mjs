// Read-only inventory of Tavvy's repositories and public database API.
// No rows are downloaded and no database writes are performed.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('..');
const names = ['tavvy-web', 'tavvy-mobile', 'tavvy-admin-portal', 'tavvy-pros-portal', 'tavvy-review-agent'];
const tables = new Map(), rpcs = new Map(), buckets = new Map();
const ignored = new Set(['node_modules', '.git', '.next', 'Pods', 'build', 'dist']);
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => ignored.has(e.name) ? [] : e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
const inventory = [];
for (const name of names) {
 const dir = path.join(root,name); if (!fs.existsSync(dir)) continue;
 const files=walk(dir).filter(f=>/\.(ts|tsx|js|jsx|sql)$/.test(f));
 inventory.push({repository:name,sourceFiles:files.length});
 for(const f of files) {
  const src=fs.readFileSync(f,'utf8');
  for(const [regex,map] of [[/\.from\(\s*['"]([\w-]+)['"]\s*\)/g,tables],[/\.rpc\(\s*['"]([\w-]+)['"]/g,rpcs]]) {
   for(const m of src.matchAll(regex)) {
    const target = map === tables && /\.storage\s*$/.test(src.slice(Math.max(0, m.index - 60), m.index)) ? buckets : map;
    const refs=target.get(m[1])||new Set();refs.add(path.relative(root,f));target.set(m[1],refs);
   }
  }
 }
}
const client=fs.readFileSync(path.join(root,'tavvy-web/lib/supabaseClient.ts'),'utf8');
const url=client.match(/const SUPABASE_URL = '([^']+)'/)[1];
const key=client.match(/const SUPABASE_ANON_KEY =\s*'([^']+)'/)[1];
const results=[];
// Small concurrent batches; HEAD requests validate relation availability only.
const entries=[...tables.entries()].sort(([a],[b])=>a.localeCompare(b));
for(let i=0;i<entries.length;i+=6) {
 await Promise.all(entries.slice(i,i+6).map(async ([name,refs])=>{
  let check;
  try {
   const res=await fetch(`${url}/rest/v1/${encodeURIComponent(name)}?select=*&limit=0`,{method:'HEAD',headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(12000)});
   check={httpStatus:res.status,status:res.ok?'public API relation reachable':'requires investigation'};
  } catch(e) {check={status:'network unavailable',error:e.cause?.code||e.name};}
  results.push({name,references:[...refs],...check});
 }));
}
const report={checkedAt:new Date().toISOString(),scope:'Static .from/.rpc inventory; anonymous HEAD only. Direct storage bucket references are inventoried separately. Does not verify columns, foreign keys, RLS isolation, data integrity, writes, RPC execution or authenticated flows.',repositories:inventory,storageBuckets:[...buckets].map(([name,refs])=>({name,references:[...refs],status:'not checked'})),tables:results.sort((a,b)=>a.name.localeCompare(b.name)),rpcs:[...rpcs].map(([name,refs])=>({name,references:[...refs]}))};
fs.writeFileSync('docs/system-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({repositories:inventory,relations:results.length,rpcs:rpcs.size,statuses:results.reduce((a,x)=>{const k=x.httpStatus??x.status;a[k]=(a[k]||0)+1;return a;},{})},null,2));
