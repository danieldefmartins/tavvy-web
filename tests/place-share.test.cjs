const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(name,cache=new Map()) {if(cache.has(name))return cache.get(name);const exports={};cache.set(name,exports);const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:specifier=>specifier==='@supabase/supabase-js'?{createClient(){throw Error('test must inject client')}}:load(specifier.replace('./',''),cache),URL,AbortSignal,process:{env:{}},console});return exports;}
const {placeShareUrl,normalizePlaceShareId}=load('placeShare');const {buildPlaceShareMetadata,DEMO_PLACE_SHARE}=load('placeShareMetadata');const {fetchPlaceShareMetadata}=load('placeShareLookup');
const id='00000000-0000-0000-0000-000000000001';
function client(tables){const calls=[];return {calls,from(table){const filters=[];const query={select(columns){calls.push({table,columns,filters});return this},eq(key,value){filters.push([key,value]);return this},limit(){return this},order(){return this},abortSignal(){return Promise.resolve({data:(tables[table]||[]).filter(row=>filters.every(([key,value])=>row[key]===value))})}};return query}}}
test('native and web always share supported canonical routes, including aliases and demo',()=>{
 for(const alias of [id,'tavvy:'+id,'places-'+id])assert.equal(placeShareUrl(alias),`https://tavvy.com/app/place/${id}`);
 assert.equal(placeShareUrl('fsq-abc'),'https://tavvy.com/app/place/fsq%3Aabc');assert.equal(normalizePlaceShareId('123456789012345678901234'),'fsq:123456789012345678901234');
 assert.equal(placeShareUrl('demo-trattoria'),'https://tavvy.com/app/demo/restaurant');assert.equal(placeShareUrl('../admin'),'https://tavvy.com/app');
 assert.equal(fs.readFileSync(path.join(__dirname,'../lib/placeShare.ts'),'utf8'),fs.readFileSync(path.join(__dirname,'../../tavvy-mobile/lib/placeShare.ts'),'utf8'));
});
test('two places have distinct truthful titles, locations, canonical URLs and actual photos',()=>{
 const a=buildPlaceShareMetadata({id,name:'Pasta & Co',city:'Boston',region:'MA',category:'Italian restaurant',cover_image_url:'https://images.example.com/pasta.jpg'});
 const b=buildPlaceShareMetadata({id:'second-place',name:'Blue Hotel',city:'Miami',category:'hotel',photos:[{url:'https://images.example.com/hotel.jpg'}]});
 assert.notEqual(a.title,b.title);assert.notEqual(a.url,b.url);assert.notEqual(a.image,b.image);assert.match(a.description,/Boston, MA/);assert.match(b.description,/Miami/);assert.equal(a.generatedImage,false);assert.equal(b.generatedImage,false);assert.doesNotMatch(a.description,/stars|rated|best|excellent/i);
});
test('missing or unsafe images yield a distinct place-name PNG fallback, local demo photo is composited in an absolute image URL',()=>{
 for(const photo of [undefined,'javascript:alert(1)','http://insecure.test/a.jpg','https://user:pass@example.com/a.jpg','//elsewhere.test/a.jpg','https://127.0.0.1/a.jpg','https://example.com/a.svg']){
  const result=buildPlaceShareMetadata({id,name:'No photo cafe',cover_image_url:photo});assert.equal(result.generatedImage,true);assert.match(result.image,new RegExp(`^https://tavvy.com/api/og/place/${id}\\?v=2-[a-f0-9]+$`));
 }
 assert.match(DEMO_PLACE_SHARE.image,/^https:\/\/tavvy.com\/api\/og\/place\/demo-trattoria\?v=2-/);assert.match(DEMO_PLACE_SHARE.description,/sample/i);
});
test('lean SSR resolves UUID aliases and uses a genuine public photo if the cover is missing',async()=>{
 const db=client({places:[{id,name:'Public cafe',status:'active',is_active:true}],place_photos:[{place_id:id,status:'live',url:'https://images.example.com/real.jpg'}]});
 const result=await fetchPlaceShareMetadata('tavvy:'+id,{client:db});assert.equal(result.metadata.name,'Public cafe');assert.equal(result.metadata.image,'https://images.example.com/real.jpg');assert.equal(result.status,'ready');assert.ok(db.calls.every(call=>!call.columns.includes('*')));assert.ok(db.calls.every(call=>!call.table.includes('review')));
});
test('FSQ aliases prefer a promoted canonical place and raw FSQ still gets its own preview',async()=>{
 const canonical=await fetchPlaceShareMetadata('fsq:abc',{client:client({places:[{id,source_id:'abc',source_type:'fsq',name:'Promoted restaurant',status:'active'}]})});assert.equal(canonical.metadata.id,id);
 const raw=await fetchPlaceShareMetadata('fsq-abc',{client:client({fsq_places_raw:[{fsq_place_id:'abc',name:'Provider cafe',locality:'Boston',region:'MA',fsq_category_labels:['Food > Café']}]})});assert.equal(raw.metadata.id,'fsq:abc');assert.equal(raw.metadata.category,'Food');assert.equal(raw.metadata.subcategory,'Café');assert.equal(raw.metadata.generatedImage,true);
});
test('missing and inactive places are distinct from unavailable metadata; demo needs no database',async()=>{
 assert.equal((await fetchPlaceShareMetadata('missing',{client:client({})})).status,'missing');
 assert.equal((await fetchPlaceShareMetadata(id,{client:client({places:[{id,is_active:false,name:'Hidden'}]})})).status,'missing');
 assert.equal((await fetchPlaceShareMetadata(id)).status,'unavailable');assert.equal((await fetchPlaceShareMetadata('demo-trattoria')).metadata.url,DEMO_PLACE_SHARE.url);
});
