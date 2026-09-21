const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../../lib/ecard.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function api(client) {
 const module = { exports: {} };
 vm.runInNewContext(compiled, { module, exports: module.exports, require(name) {
  if (name === './supabaseClient') return { supabase: client };
  if (name === '../config/reservedUsernames') return { isReservedUsername: () => false };
  throw new Error('Unexpected dependency: '+name);
 }, console: { error() {}, warn() {}, log() {} }, Date, Math, setTimeout });
 return module.exports;
}
function readClient(result, calls) {
 const query = {};
 for (const name of ['select','eq','order','update']) query[name] = (...args) => { calls.push([name,...args]);return query; };
 query.then = (ok, bad) => Promise.resolve(result).then(ok,bad);
 query.single = () => Promise.resolve(result);
 return { from: table => { calls.push(['from',table]); return query; } };
}
test('saving preserves link identity, order, inactive state and values through the atomic RPC', async () => {
 const calls = [];
 const client = { from() { throw new Error('Non-atomic table write attempted'); }, async rpc(name,args) { calls.push([name,JSON.parse(JSON.stringify(args))]); return { error: null }; } };
 const links = [{ id:'e932d4ef-6c6c-4a11-931b-3427d16c5881', platform:'phone', title:'Call me', url:'tel:+15555550100', value:'+15555550100', icon:'call', sort_order:9, is_active:false, clicks:12, card_id:'card' }];
 links.push({ id:'1906a0fb-90f1-4b85-9c45-74d949a8fb5f', platform:'website', url:'', value:'https://example.invalid/old', is_active:null });
 const original=JSON.stringify(links);
 assert.equal(await api(client).saveCardLinks('card',links),true);
 assert.equal(calls[0][0],'replace_ecard_links');
 const saved=calls[0][1].p_links[0];
 assert.equal(saved.id,links[0].id);assert.equal(saved.is_active,false);assert.equal(saved.value,'+15555550100');assert.equal(saved.sort_order,0);
 assert.equal('card_id' in saved,false);assert.equal('clicks' in saved,false);assert.equal(JSON.stringify(links),original);
 assert.equal(calls[0][1].p_links[1].url,'','an explicit cleared URL must not revive the old value');
 assert.equal(calls[0][1].p_links[1].is_active,false,'legacy hidden links must remain hidden');
});
test('RPC failure is reported without a destructive delete/insert fallback', async () => {
 let rpcCalls=0;
 const client={ from(){throw new Error('Destructive fallback attempted');}, async rpc(){rpcCalls++;return {error:{message:'forced failure'}};} };
 assert.equal(await api(client).saveCardLinks('card',[]),false);assert.equal(rpcCalls,1);
});
test('strict editor link loading preserves inactive links and rejects read failure', async () => {
 const calls=[];
 const failed=api(readClient({data:null,error:{message:'offline'}},calls));
 await assert.rejects(()=>failed.getCardLinks('card',{includeInactive:true,throwOnError:true}),/could not be loaded/);
 assert.equal(calls.some(c=>c[0]==='eq'&&c[1]==='is_active'),false);
 const publicCalls=[];
 assert.equal((await api(readClient({data:[],error:null},publicCalls)).getCardLinks('card')).length,0);
 assert.equal(publicCalls.some(c=>c[0]==='eq'&&c[1]==='is_active'&&c[2]===true),true);
});
test('publish/unpublish cannot report success for an update that changed no owned row', async () => {
 assert.equal(await api(readClient({data:null,error:null},[])).publishCard('card','my-card'),false);
 assert.equal(await api(readClient({data:null,error:null},[])).unpublishCard('card'),false);
 assert.equal(await api(readClient({data:{id:'card',slug:'my-card',is_published:true},error:null},[])).publishCard('card','my-card'),true);
 assert.equal(await api(readClient({data:{id:'card',is_published:false},error:null},[])).unpublishCard('card'),true);
});
