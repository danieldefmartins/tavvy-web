// Offline fixtures only. No customer data, API writes, or signing credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript'), path = require('node:path');
const root = path.resolve(__dirname,'..');
function load(file, deps={}) {
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('exports','require',code)(exports,n=>{if(n in deps)return deps[n]; throw Error(`Unexpected dependency ${n}`)});
 return exports;
}
const helper=load('lib/ecard/publicExport.ts');
const fixture={id:'fixture',slug:'public-test',is_active:true,is_published:true,full_name:'Ada; Test\nEND:VCARD',phone:'123',email:'test@example.invalid',address_1:'1 Street',city:'Town',state:'ST',zip_code:'12345',country:'US',profile_photo_url:'http://127.0.0.1/private',featured_socials:[{platform:'social\nINJECT:',url:'https://example.invalid'}]};
assert.equal(helper.publicExportCard({...fixture,is_published:false}),null);
assert.equal(helper.publicExportCard({...fixture,is_active:false}),null);
const visible=helper.buildPublicVCard(fixture);
assert(visible.includes('FN:Ada\\; Test\\nEND:VCARD\r\n'));
assert(visible.includes('ADR;TYPE=WORK:;;1 Street;Town;ST;12345;US'));
assert.equal(visible.split('\r\n').filter(l=>l==='END:VCARD').length,1);
assert(!visible.includes('127.0.0.1'));
const hidden=helper.buildPublicVCard({...fixture,show_contact_info:false,show_social_icons:false});
for(const field of ['TEL;','EMAIL;','ADR;','X-SOCIALPROFILE;'])assert(!hidden.includes(field));
let data=fixture,filters=[];
const mock={from(){return this},select(){return this},eq(...args){filters.push(args);return this},single:async()=>({data,error:null})};
const route=load('pages/api/ecard/wallet/vcard.ts',{'@supabase/supabase-js':{createClient:()=>mock},'../../../../lib/ecard/publicExport':helper}).default;
function response(){return{headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this},send(v){this.body=v;return this}}}
(async()=>{
 let res=response();await route({method:'POST',query:{}},res);assert.equal(res.code,405);
 res=response();await route({method:'GET',query:{slug:['a','b']}},res);assert.equal(res.code,400);
 data={...fixture,is_published:false};res=response();await route({method:'GET',query:{slug:'draft'}},res);assert.equal(res.code,404);
 data={...fixture,show_contact_info:false};filters=[];res=response();await route({method:'GET',query:{slug:'public-test'}},res);
 assert.equal(res.code,200);assert(!res.body.includes('test@example.invalid'));assert.equal(res.headers['Cache-Control'],'no-store');
 assert.deepEqual(filters,[['is_published',true],['is_active',true],['slug','public-test']]);
 for(const name of ['apple-pass','google-pass']){
 const source=fs.readFileSync(path.join(root,`pages/api/ecard/wallet/${name}.ts`),'utf8');
 assert(!source.includes('SUPABASE_SERVICE_ROLE_KEY'));assert(source.includes('publicExportCard(data)'));
 assert(source.includes(".eq('is_published', true).eq('is_active', true)"));
 if(name==='apple-pass')assert(!source.includes('fetch(card.profile_photo_url'));
 }
 console.log('PASS: eCard export visibility, hidden fields, escaping, address structure, API validation/filtering, no image fetch/service role.');
})().catch(e=>{console.error(e);process.exitCode=1});
