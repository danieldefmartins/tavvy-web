const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, overrides = {}, cache = new Map()) {
  file = path.resolve(__dirname, '../lib', file + '.ts');
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const requireLocal = name => overrides[name] || load(path.basename(name), overrides, cache);
  vm.runInNewContext(source, { exports, require: requireLocal, console, Date, Map, Set, Number, Math, Promise, Error });
  return exports;
}
const { parseSearchQuery } = load('smartQueryParser');
const { resolveSearchIntent, canonicalPlaceId, mergeSearchResults, isDiningSearch } = load('searchIntent');
const { searchAcrossProviders, searchDatabase } = load('placeSearch', { './supabaseClient': { supabase: {} }, './typesenseService': { searchPlaces() { throw new Error('mock required'); } } });
const id = 'e8136f8b-0445-41f7-bb00-2e4bc3a7d6b7';
const point = { latitude: 42.36, longitude: -71.06 };
const restaurant = (extra = {}) => ({ id, source:'places', name: 'Trattoria Tavvy', category:'Restaurant', city:'Boston',region:'MA',country:'US',...point,...extra });

test('near me and nearby are relative intent, never a city called me', () => {
  for (const text of ['Italian restaurants near me','coffee nearby','pizza near my current location']) {
    const parsed = parseSearchQuery(text); assert.equal(parsed.useCurrentLocation,true); assert.equal(parsed.city,undefined);
  }
  assert.equal(resolveSearchIntent('pizza near me').needsLocation,true);
  assert.equal(resolveSearchIntent('pizza near me',{coordinates:point}).kind,'current');
});
test('named city/state overrides device and saved location; changing map area remains explicit', () => {
  const intent=resolveSearchIntent('Italian Restaurants Near Boston, MA',{coordinates:{latitude:28,longitude:-81},location:'Miami, FL'});
  assert.equal(intent.city,'Boston');assert.equal(intent.region,'MA');assert.equal(intent.coordinates,undefined);
  const map=resolveSearchIntent('Italian restaurants',{mode:'map',coordinates:point,bounds:{minLat:42,maxLat:43,minLng:-72,maxLng:-70}});
  assert.equal(map.kind,'map');assert.equal(map.bounds.minLat,42);
});
test('denied location cannot silently become worldwide results or call providers', async () => {
  let called=false;
  await assert.rejects(searchAcrossProviders('pizza near me',10,{}, {database:async()=>{called=true;return[]},index:async()=>{called=true;return {places:[]}}}), /location|city/i);
  assert.equal(called,false);
  assert.equal(resolveSearchIntent('Italian restaurants',{mode:'anywhere'}).label,'Any location');
});
test('canonical identifiers retain Tavvy UUID identity and unify provider aliases', () => {
  assert.equal(canonicalPlaceId('tavvy:'+id),id);assert.equal(canonicalPlaceId(id),id);
  assert.equal(canonicalPlaceId('fsq-abc'),'fsq:abc');assert.equal(canonicalPlaceId('fsq:abc'),'fsq:abc');
});
test('joint ranking finds exact canonical merchant ahead of provider candidates without losing branches', () => {
  const places=mergeSearchResults([restaurant({id:'fsq:one',source:'fsq_raw',name:'Tavvy Italian'}),restaurant(),restaurant({id:'fsq:branch',source:'fsq_raw',longitude:-71.09})],resolveSearchIntent('Trattoria Tavvy'),10);
  assert.equal(places[0].id,id);assert.equal(places.length,3);
  const dedup=mergeSearchResults([restaurant({id:'fsq:source',source:'fsq_raw'}),restaurant({source_id:'source'})],resolveSearchIntent('Trattoria Tavvy'),10);
  assert.equal(dedup.length,1);assert.equal(dedup[0].id,id);
});
test('provider failure preserves city intent and still includes canonical merchants', async () => {
  const calls=[];
  const result=await searchAcrossProviders('Italian restaurants in Boston, MA',10,{coordinates:{latitude:28,longitude:-81}}, {
    database:async(intent,limit,includeFsq)=>{calls.push({intent,includeFsq});return [restaurant()]},
    index:async()=>{throw new Error('provider down')}
  });
  assert.equal(result.partial,true);assert.equal(result.places[0].id,id);assert.equal(calls.length,2);
  assert.equal(calls[1].intent.city,'Boston');assert.equal(calls[1].intent.coordinates,undefined);assert.equal(calls[1].includeFsq,true);
});
test('all providers failing reports unavailable, not no matches', async () => {
  await assert.rejects(searchAcrossProviders('pizza',10,{}, { database:async()=>{throw new Error('db')},index:async()=>{throw new Error('index')} }), /unavailable/);
});
test('database applies city and region before limit and preserves subcategory', async () => {
  const queries=[];
  const client={from(table){const actions=[];queries.push({table,actions});const q={};for(const method of ['select','is','eq','ilike','gte','lte','or','order','limit'])q[method]=(...args)=>{actions.push([method,...args]);return q};q.then=resolve=>resolve({data:[{...restaurant(),tavvy_category:'restaurant',tavvy_subcategory:'Italian Restaurant'}],error:null});return q;}};
  const result=await searchDatabase(resolveSearchIntent('Italian restaurants near Boston, MA'),8,false,client);
  for(const q of queries){assert.ok(q.actions.findIndex(a=>a[0]==='ilike'&&a[1]==='city')<q.actions.findIndex(a=>a[0]==='limit'));assert.ok(q.actions.some(a=>a[0]==='ilike'&&a[1]==='region'&&a[2]==='MA'));}
  assert.equal(result[0].subcategory,'Italian Restaurant');
});
test('current and map scopes exclude distant matches; coordinates at zero are valid', () => {
  assert.equal(mergeSearchResults([restaurant(),restaurant({id:'fsq:far',source:'fsq_raw',latitude:28,longitude:-81})],resolveSearchIntent('restaurants near me',{coordinates:point}),10).length,1);
  const map=resolveSearchIntent('restaurants',{mode:'map',coordinates:point,bounds:{minLat:42.35,maxLat:42.37,minLng:-71.07,maxLng:-71.05}});
  assert.equal(mergeSearchResults([restaurant(),restaurant({id:'fsq:out',source:'fsq_raw',latitude:42.4})],map,10).length,1);
  assert.equal(resolveSearchIntent('coffee near me',{coordinates:{latitude:0,longitude:0}}).needsLocation,false);
});
test('food preferences are contextual, not shown for hotels or auto repair',()=>{assert.equal(isDiningSearch('Italian restaurant'),true);assert.equal(isDiningSearch('hotel'),false);assert.equal(isDiningSearch('auto repair'),false)});

test('explicit near-me discards stale named and map context, using only actual device coordinates', () => {
 const { submittedSearchContext } = load('searchIntent');
 const old={mode:'map',coordinates:point,bounds:{minLat:42,maxLat:43,minLng:-72,maxLng:-70},location:'Boston, MA'};
 const device={latitude:28.54,longitude:-81.38};
 const context=submittedSearchContext('pizza near me',old,device,'Boston, MA');
 const intent=resolveSearchIntent('pizza near me',context);
 assert.equal(intent.kind,'current'); assert.equal(intent.coordinates.latitude,28.54); assert.equal(context.bounds,undefined); assert.equal(context.location,undefined);
 assert.equal(resolveSearchIntent('pizza near me',submittedSearchContext('pizza near me',old,undefined,'Boston, MA')).needsLocation,true);
 assert.equal(resolveSearchIntent('pizza near me',{coordinates:device,location:'Boston, MA'}).kind,'current');
});
test('only explicit demo aliases are shortcuts; canonical and unrelated Trattoria queries search normally',()=>{
 const {matchesDemoRestaurantQuery}=load('demoPlace');
 for(const q of ['Trattoria Tavvy','trattoria tavvy in Boston','Trattoria Roma','best trattoria']) assert.equal(matchesDemoRestaurantQuery(q),false,q);
 for(const q of ['Tavvy demo',' demo restaurant ']) assert.equal(matchesDemoRestaurantQuery(q),true,q);
});
test('Boston intent is passed to both real search adapters despite Orlando device coordinates',async()=>{
 const calls=[];
 const result=await searchAcrossProviders('Italian Restaurants Near Boston, MA',20,{coordinates:{latitude:28.54,longitude:-81.38},location:'Orlando, FL'}, {
 database:async intent=>{calls.push(intent); return[restaurant(),restaurant({id:'fsq:wrong',city:'Orlando',region:'FL'})]},
 index:async query=>{calls.push(query);return{places:[]}}
 });
 assert.equal(calls[0].city,'Boston'); assert.equal(calls[0].coordinates,undefined);
 assert.equal(calls[1].locality,'Boston'); assert.equal(calls[1].region,'MA'); assert.equal(calls[1].latitude,undefined);
 assert.equal(result.places.length,1); assert.equal(result.places[0].id,id);
});

test('named demo fallback requires an exact query and complete empty lookup, never a real match or partial failure',()=>{
 const {shouldOfferDemoRestaurant}=load('demoPlace');
 assert.equal(shouldOfferDemoRestaurant('Trattoria Tavvy',[]),true);
 assert.equal(shouldOfferDemoRestaurant('Trattoria Tavvy',[restaurant()]),false);
 assert.equal(shouldOfferDemoRestaurant('Trattoria Tavvy',[],true),false);
 assert.equal(shouldOfferDemoRestaurant('Trattoria Roma',[]),false);
 assert.equal(shouldOfferDemoRestaurant('Trattoria Tavvy in Boston, MA',[]),false);
});
