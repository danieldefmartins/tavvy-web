const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),cache={};
function load(file){if(cache[file])return cache[file];const mod={exports:{}};cache[file]=mod.exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,module:mod,URL,require:n=>n==='./supabaseClient'?{supabase:{}}:load(path.resolve(path.dirname(file),n+'.ts'))});return mod.exports}
const lib=load(path.join(root,'lib/rvCatalog.ts'));
test('canonical subtype wins and provider leaves classify without unrelated substring matches',()=>{
 const bucket=(category,sub)=>lib.rvPlaceBucket({tavvy_category:category,tavvy_subcategory:sub});
 assert.equal(bucket('attraction','[Landmarks and Outdoors > Park > National Park]'),'national-parks');
 assert.equal(bucket('rv_camping','[Landmarks and Outdoors > Campground'),'campgrounds');
 assert.equal(bucket('hotel','RV Resort'),'rv-parks');
 assert.equal(bucket('rv_camping','dump_station'),'dump-stations');
 assert.equal(bucket('rv_camping','overnight_parking'),'overnight-parking');
 assert.equal(bucket('atlas','beach'),'beaches');
 assert.equal(bucket('restaurant','[Dining and Drinking > Bar > Beach Bar]'),null);
 assert.equal(bucket('other','Business and Professional Services'),null);
});
test('filters precede stable pagination; extra row determines hasMore and cursor retains canonical IDs',async()=>{
 const calls=[],rows=Array.from({length:4},(_,i)=>({id:'canonical-'+i,name:'Same name'}));
 const chain={};for(const method of ['select','eq','or','order','range'])chain[method]=(...args)=>{calls.push([method,...args]);return chain};chain.then=resolve=>resolve({data:rows,error:null});
 const client={from:table=>{assert.equal(table,'places');return chain}};
 const result=await lib.fetchRVCatalog({category:'national-parks',query:'Boston MA',offset:27,limit:3,client});
 assert.equal(calls[1][1],'status');assert.equal(calls[1][2],'active');assert(calls[2][1].includes('National Park'));assert(calls[2][1].includes('name.ilike."%Boston%"'));assert(calls[2][1].includes('region.ilike."%MA%"'));
 assert.deepEqual(calls.at(-1),['range',27,30]);assert.equal(calls[3][1],'name');assert.equal(calls[4][1],'id');assert.equal(result.places[0].id,'canonical-0');assert.equal(result.hasMore,true);assert.equal(result.nextOffset,30);
});
test('ambiguous or failed responses stay unavailable rather than empty',async()=>{
 for(const result of [{data:null,error:null},{data:[],error:{message:'failure'}}]){const chain={};for(const method of ['select','eq','or','order','range'])chain[method]=()=>chain;chain.then=resolve=>resolve(result);await assert.rejects(()=>lib.fetchRVCatalog({client:{from:()=>chain}}),/temporarily unavailable/)}
});
test('query punctuation is quoted and optional photos never become illustrative stock imagery',()=>{
 const filter=lib.rvCatalogFilter('campgrounds','(x),"%,name.eq.bad');assert(filter.includes('\\"'));assert(filter.includes('\\\\%'));assert.throws(()=>lib.rvCatalogFilter('not-a-category',''));
 assert.equal(lib.rvPlacePhoto({cover_image_url:null,photos:[]}),null);assert.equal(lib.rvPlacePhoto({cover_image_url:'javascript:alert(1)',photos:[{url:'https://example.invalid/real.jpg'}]}),'https://example.invalid/real.jpg');
});
