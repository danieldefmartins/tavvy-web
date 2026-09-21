import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3015';
const results=[];
for(const q of ['café','pizza near Orlando, FL','Riva Cucina']) {
 for(const run of ['first','repeat']) {
  const params=new URLSearchParams({q,userLat:'28.54',userLng:'-81.38',limit:'8'});
  const start=performance.now();
  const response=await fetch(`${base}/api/search?${params}`,{signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  assert.equal(response.status,200);assert.ok(Array.isArray(body.suggestions));assert.ok(body.suggestions.length<=8);
  const ids=body.suggestions.map(s=>String(s.id).replace(/^(tavvy:|places-|fsq-)/,''));
  assert.equal(new Set(ids).size,ids.length);
  results.push({query:q,run,durationMs:Math.round(performance.now()-start),results:ids.length});
 }
}
for(const [params,status,maxResults] of [
 [{q:''},200,0],
 [{q:'x'.repeat(201)},400,0],
 [{q:'coffee',limit:'-10',userLat:'NaN',userLng:'NaN'},200,1],
]){
 const r=await fetch(`${base}/api/search?${new URLSearchParams(params)}`,{signal:AbortSignal.timeout(15000)});
 const b=await r.json();assert.equal(r.status,status);assert.ok(b.suggestions.length<=maxResults);
}
fs.writeFileSync('docs/search-benchmark.json',JSON.stringify({testedAt:new Date().toISOString(),environment:'local production build; public data; three samples, not a production percentile benchmark',results,inputValidation:'passed'},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
