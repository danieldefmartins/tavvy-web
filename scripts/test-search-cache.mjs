import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/searchCache.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createSearchCache}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('coalesces concurrent requests, preserves keys and caches success',async()=>{
 const cache=createSearchCache();let calls=0;
 const fetcher=async()=>{calls++;return ['result']};
 const [a,b]=await Promise.all([cache('coffee:8',fetcher),cache('coffee:8',fetcher)]);
 assert.equal(calls,1);assert.deepEqual(a,b);
 await cache('coffee:8',fetcher);assert.equal(calls,1);
 await cache('coffee:20',fetcher);assert.equal(calls,2);
});
test('retries failures and evicts oldest result',async()=>{
 const cache=createSearchCache(30000,1);let calls=0;
 await assert.rejects(cache('a',async()=>{throw Error('offline')}));
 const load=async()=>++calls;
 assert.equal(await cache('a',load),1);
 assert.equal(await cache('b',load),2);
 assert.equal(await cache('a',load),3);
});
test('expired entries refresh',async()=>{
 const cache=createSearchCache(-1);let calls=0;
 await cache('a',async()=>++calls);await cache('a',async()=>++calls);assert.equal(calls,2);
});

const categorySource=ts.transpileModule(fs.readFileSync('lib/placeCategories.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {getPlaceCategories}=await import('data:text/javascript;base64,'+Buffer.from(categorySource).toString('base64'));
test('normalizes current and legacy category representations',()=>{
 for(const value of [['Food','Cafe'],'["Food","Cafe"]',"['Food', 'Cafe']"]) assert.deepEqual(getPlaceCategories(value),['Food','Cafe']);
 assert.deepEqual(getPlaceCategories(['[Dining and Drinking', 'Restaurant]']),['Dining and Drinking','Restaurant']);
 assert.deepEqual(getPlaceCategories(null),[]);
 assert.deepEqual(getPlaceCategories('  '),[]);
 assert.deepEqual(getPlaceCategories('Food > Cafe'),['Food > Cafe']);
 assert.deepEqual(getPlaceCategories('[malformed]'),['malformed']);
});
test('web and mobile share identical category and cache behavior',()=>{
 for(const file of ['placeCategories.ts','searchCache.ts']) assert.equal(fs.readFileSync('lib/'+file,'utf8'),fs.readFileSync('../tavvy-mobile/lib/'+file,'utf8'));
});

test('both platforms preserve business names and parse explicit locations',async()=>{
 for(const root of ['.','../tavvy-mobile']){
  const source=ts.transpileModule(fs.readFileSync(root+'/lib/smartQueryParser.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const {parseSearchQuery}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for(const name of ['Riva Cucina','Whole Foods','Blue Bottle Coffee']) {const result=parseSearchQuery(name);assert.equal(result.placeName,name);assert.equal(result.isParsed,false);}
  const result=parseSearchQuery('pizza near Orlando, FL');assert.equal(result.placeName,'pizza');assert.equal(result.city,'Orlando');assert.equal(result.region,'FL');
  const boston=parseSearchQuery('Italian Restaurants Near Boston, MA');assert.equal(boston.placeName,'Italian Restaurants');assert.equal(boston.city,'Boston');assert.equal(boston.region,'MA');
  const fullState=parseSearchQuery('Italian restaurants near Boston, Massachusetts');assert.equal(fullState.city,'Boston');assert.equal(fullState.region,'MA');
 }
});
