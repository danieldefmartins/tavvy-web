const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, AbortSignal, process: {env: {NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-fixture'}}, console: {log(){},error(){}}, require(name) { if (name in dependencies) return dependencies[name]; if(name==='react/jsx-runtime') return require(name); throw new Error('Unexpected dependency '+name); } });
  return module.exports;
}
const api = load('lib/ecard/publicLookup.ts');
function client(results) {
  const calls = [];
  return {calls, from(table) {
    const entry = {table, filters: []}; calls.push(entry);
    const query = {select(value){entry.select=value;return query;},eq(...args){entry.filters.push(args);return query;},abortSignal(signal){assert.equal(signal.aborted,false);return query;},maybeSingle(){ const result=results.shift();assert.notEqual(result,undefined,'unexpected query');return result instanceof Error ? Promise.reject(result) : Promise.resolve(result); }};
    return query;
  }};
}
const empty={data:null,error:null,status:200};
const card={id:'public-card',slug:'example',is_active:true,is_published:true};
const failure={data:null,error:{code:'FETCH_FAILED'},status:503};
test('public successful card lookup retains both visibility filters and uses no writes', async()=>{
  const c=client([{data:card,error:null,status:200}]);const r=await api.lookupPublicCard(c,'example','tavvy.com');
  assert.equal(r.kind,'card');assert.equal(r.card.id,card.id);
  assert.deepEqual(c.calls[0].filters,[['is_published',true],['is_active',true],['slug','example']]);
  assert.equal(c.calls.length,1);
});
test('one transient transport error can recover without falling back to an unrelated place',async()=>{
  const c=client([new Error('connection interrupted'),{data:card,error:null,status:200}]);
  assert.equal((await api.lookupPublicCard(c,'example','tavvy.com')).kind,'card');
  assert.deepEqual(c.calls.map(x=>x.table),['digital_cards','digital_cards']);
});
test('persistent service failure is unavailable after exactly one retry, never missing',async()=>{
  const c=client([failure,failure]);const r=await api.lookupPublicCard(c,'example','custom.example');
  assert.equal(r.kind,'unavailable');assert.equal(r.stage,'slug');assert.equal(c.calls.length,2);
});
test('authorization and duplicate-row errors never select an arbitrary card or fall through',async()=>{
  for(const [status,code] of [[403,'42501'],[406,'PGRST116'],[400,'42703']]){
    const c=client([{data:null,error:{code},status}]);
    assert.equal((await api.lookupPublicCard(c,'example')).kind,'unavailable');assert.equal(c.calls.length,1);
  }
});
test('real empty visible result stays missing, including unpublished or inactive records hidden by the query',async()=>{
  const c=client([empty,empty]);assert.equal((await api.lookupPublicCard(c,'example','www.tavvy.com')).kind,'missing');
  assert.deepEqual(c.calls.map(x=>x.table),['digital_cards','places']);
});
test('verified custom domains and existing place redirects remain supported',async()=>{
  const custom=client([empty,{data:card,error:null,status:200}]);
  assert.equal((await api.lookupPublicCard(custom,'example','cards.example')).kind,'card');
  assert.ok(custom.calls[1].filters.some(x=>x[0]==='custom_domain_verified'&&x[1]===true));
  const place=client([empty,{data:{id:'place-id'},error:null,status:200}]);
  const result=await api.lookupPublicCard(place,'place-slug','tavvy.com');assert.equal(result.kind,'place');assert.equal(result.placeId,'place-id');
});
test('failed domain or place lookups are unavailable rather than a false 404',async()=>{
  for(const host of ['cards.example','tavvy.com']){
    const c=client([empty,failure,failure]);const r=await api.lookupPublicCard(c,'example',host);
    assert.equal(r.kind,'unavailable');assert.equal(r.stage,host==='tavvy.com'?'place':'domain');
  }
});
function page(c){return load('pages/[username].tsx',{
  '@supabase/supabase-js':{createClient:()=>c},'next-i18next/serverSideTranslations':{serverSideTranslations:async()=>({})},
  '../config/eCardTemplates':{},'../lib/ecard/publicCardMapping':{},
  '../components/ecard/PublicCardView':{default:()=>null},'../components/ecard/PublicCardUnavailable':{default:()=>null},
  '../lib/ecard/publicLookup':api,
});}
test('SSR returns actual 503 with Retry-After for unavailable and 404 only for confirmed missing',async()=>{
  for(const unavailable of [true,false]){
    const headers={};const res={statusCode:200,setHeader:(k,v)=>headers[k]=v};
    const p=await page(client(unavailable?[failure,failure]:[empty,empty])).getServerSideProps({params:{username:'example'},req:{headers:{host:'tavvy.com'}},res,query:{preview:'1'},locale:'en'});
    assert.equal(res.statusCode,unavailable?503:404);assert.equal(p.props.error,unavailable?api.PUBLIC_CARD_UNAVAILABLE:'Card not found');
    assert.match(headers['Cache-Control'],/no-store/);assert.equal(headers['Retry-After'],unavailable?'30':undefined);
  }
});
test('SSR retains canonical place redirect without fetching private card data',async()=>{
  const p=await page(client([empty,{data:{id:'place-id'},error:null,status:200}])).getServerSideProps({params:{username:'example'},req:{headers:{host:'tavvy.com'}},res:{},query:{preview:'1'}});
  assert.equal(p.redirect.destination,'/place/place-id');assert.equal(p.redirect.permanent,false);
});
test('unavailable page has a retry action and no missing-card claim or sample identity',()=>{
  const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
  const dict={'errors.generic':'Something went wrong','errors.serverError':'Server error. Please try again later.','common.retry':'Retry','navigation.home':'Home'};
  const Component=load('components/ecard/PublicCardUnavailable.tsx',{
    'next/head':{default:({children})=>React.createElement(React.Fragment,null,children)},
    'next/link':{default:({children,...props})=>React.createElement('a',props,children)},
    'next-i18next':{useTranslation:()=>({t:k=>dict[k]})},'../../contexts/ThemeContext':{useThemeContext:()=>({isDark:false})},
  }).default;
  const html=renderToStaticMarkup(React.createElement(Component));
  assert.match(html,/Something went wrong/);assert.match(html,/>Retry<\/button>/);assert.match(html,/noindex/);
  assert.doesNotMatch(html,/not found|removed|Your Name Here/i);
});
