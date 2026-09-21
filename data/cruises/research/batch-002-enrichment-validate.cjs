#!/usr/bin/env node
'use strict';
// Offline preservation, evidence linkage and display-boundary checks; never imports data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const stage='data/cruises/staged/verified-operating-batch-002-enriched.json';
const sidecar='data/cruises/research/batch-002-enrichment-evidence.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const basePath='data/cruises/staged/verified-operating-batch-002.json';
const base=read(basePath),data=read(stage),evidence=read(sidecar);
const {validate:catalogValidate}=require('../../../scripts/cruises/validate-catalog.cjs');
const renderer={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/cruises/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:renderer,URL});
const protectedFiles={
 [basePath]:'cb052ee196c0987169efec31118cf8ebf0fdb80670eb2f99e971e45469083526',
 'data/cruises/research/batch-002-operating-evidence.json':'912fc17b4542461be74120640c9f056afdf824b6ed3fc7f9ace47a8ad9f50ecb',
 'data/cruises/research/batch-002-operating-verification.md':'e3ebe03199a7f75464a9dff614ab0561f73c2c55b319104f9b64b81392ed637d',
 'data/cruises/research/batch-002-operating-validation.json':'9a6236b18ad4275fca1d54a64a436501f8e4bf8a6d2ce949bd2cc2d3317f1b07',
 'data/cruises/research/batch-002-verified-validate.cjs':'edc43b02ec166de9361c2aa502e33ffb23044fb3afa50902aa8d0fddb9383431'
};
const primaryHosts=new Set(['www.breejen-shipyard.nl','west-sea.pt','www.arosa-cruises.com','newsroom.arosa-cruises.com','www.aurora-expeditions.com','ulstein.com','iaato.org','riverside-cruises.com','publish.flyeralarm.digital','www.hollandamerica.com','www.fincantieri.com','www.avalonwaterways.com','www.swanhellenic.com','www.cunard.com','www.virginvoyages.com']);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function validate(d,e){
 const errors=[...catalogValidate(d).errors];const check=(ok,why)=>{if(!ok)errors.push(why);};
 check(d.ships.length===59&&eq(d.operators,base.operators),'same 59 ships and eight operators');
 check(e.base.sha256===protectedFiles[basePath]&&e.base.ship_count===59,'base hash pinned');
 check(e.checked_at==='2026-09-21'&&e.ships.length===59,'dated evidence for each ship');
 const allIds=new Set();
 for(const old of base.ships){
  const row=d.ships.find(x=>x.ship.id===old.ship.id);check(!!row,'every base identity retained');if(!row)continue;
  const meta=x=>Object.fromEntries(Object.entries(x.ship).filter(([k])=>k!=='facts'));
  check(eq(meta(row),meta(old)),'all ship identity/status/history/cabin/photo fields preserved');
  check(row.ship.publication_status==='draft'&&row.ship.imo===null&&row.ship.eni===null&&row.ship.photo===null,'no publication or invented registry/media');
  const ev=e.ships.find(x=>x.ship_id===old.ship.id);check(!!ev&&ev.slug===old.ship.slug,'matching sidecar identity');if(!ev)continue;
  const src=new Map(row.sources.map(x=>[x.id,x]));check(src.size===row.sources.length,'unique source identifiers');
  for(const s of old.sources)check(eq(s,src.get(s.id)),'existing source unchanged');
  for(const s of row.sources.filter(x=>!old.sources.some(y=>y.id===x.id))){
   let valid=false;try{const u=new URL(s.url);valid=u.protocol==='https:'&&primaryHosts.has(u.hostname)&&!u.username&&!u.password;}catch{}
   check(valid&&['operator','shipyard','registry'].includes(s.source_type),'primary provenance required');
   check(s.checked_at===e.checked_at&&!!s.publisher,'source check date/publisher');
   const ob=ev.source_observations.find(o=>o.source_id===s.id);
   check(!!ob&&!!ob.locator&&!!ob.observation&&!!ob.access,'source locator and retrieval boundary');
   if(s.url.startsWith('https://publish.flyeralarm.digital/'))check(row.sources.some(x=>x.url==='https://riverside-cruises.com/en/brochures'),'third-party brochure must have direct operator link');
  }
  const replay=structuredClone(old),paths=new Set();
  for(const change of ev.changes){
   check(!paths.has(change.path),'one recorded change per field');paths.add(change.path);
   check(!!change.locator&&Array.isArray(change.after.source_ids)&&change.after.source_ids.length>0&&change.after.source_ids.every(id=>src.has(id)),'every change has dated source linkage');
   if(change.path.startsWith('ship.facts.')){
    const f=replay.ship.facts.find(f=>'ship.facts.'+f.key===change.path);check(!!f&&eq(f,change.before),'fact before-image matches base');
    if(f)Object.assign(f,change.after);
   }else{
    const collection=change.path.split('.')[0];check(['venues','programs'].includes(collection)&&change.before===null,'only additive child changes');
    if(['venues','programs'].includes(collection))replay[collection].push(change.after);
   }
  }
  check(eq(replay.ship,row.ship)&&eq(replay.venues,row.venues)&&eq(replay.programs,row.programs),'exact replay with no unrecorded changes');
  for(const collection of ['venues','programs'])for(const child of old[collection])check(eq(row[collection].find(c=>c.id===child.id),child),'existing child content and ID preserved');
  for(const child of [...row.venues,...row.programs,...row.ship.cabin_categories]){check(!allIds.has(child.id),'unique child IDs');allIds.add(child.id);}
  check(new Set(row.venues.map(v=>v.name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,''))).size===row.venues.length,'no normalized duplicate venues');
  check(row.venues.every(v=>v.place_id===null&&v.ship_id===row.ship.id),'no invented canonical place IDs');
  check(row.ship.facts.length===19&&new Set(row.ship.facts.map(f=>f.key)).size===19,'same explicit 19 fact keys');
  for(const f of row.ship.facts){
   check(f.as_of===e.checked_at,'as-of uses actual check date, no invented publication day');
   if(f.value===null)check(f.verification==='unverified'&&f.source_ids.length===0,'unknown remains null/unverified');
   else check(['verified','conflicting'].includes(f.verification)&&f.source_ids.every(id=>src.has(id)),'fact state and provenance');
  }
  const publish=structuredClone(row);publish.ship.publication_status='published';check(catalogValidate({schemaVersion:1,operators:d.operators,ships:[publish]}).errors.length===0,'identity publication contract');
 }
 return errors;
}
const checks=[];function test(name,run){run();checks.push({name,status:'PASS'});}
test('Original frozen batch002, batch001 and registry are unchanged',()=>{
 for(const [p,h]of Object.entries(protectedFiles))assert.equal(hash(fs.readFileSync(path.join(root,p))),h,p);
 const leads=read('data/cruises/research/batch-002-fleet-inventory.json');
 for(const [p,h]of Object.entries(leads.protected_batch001_inputs))assert.equal(hash(fs.readFileSync(path.join(root,p))),h,p);
 assert.equal(hash(fs.readFileSync(path.join(root,'data/cruises/research/operator-registry.json'))),leads.registry_snapshot.sha256);
});
test('Enriched59 retain exact identities and replay every sourced change',()=>assert.deepEqual(validate(data,evidence),[]));
function reject(name,mutate,why){test(name,()=>{const d=structuredClone(data),e=structuredClone(evidence);mutate(d,e);assert(validate(d,e).some(x=>x.includes(why)),why);});}
reject('Reject changed ship identity',(d)=>d.ships[0].ship.universe_id=d.ships[1].ship.universe_id,'identity/status');
reject('Reject silent publication',(d)=>d.ships[0].ship.publication_status='published','no publication');
reject('Reject removal of a prior venue',(d)=>d.ships[0].venues.shift(),'existing child');
reject('Reject an unsourced invented venue',(d)=>d.ships[0].venues.push({...d.ships[0].venues[0],id:'4c2eb3d0-2dbd-4a8a-a3e6-67775c632af1',name:'Unverified Restaurant'}),'unrecorded');
reject('Reject missing source provenance',(d)=>d.ships[0].sources=d.ships[0].sources.filter(s=>s.id!=='enrich-numbers'),'linkage');
reject('Reject third-party source masquerading as operator',(d)=>d.ships[0].sources.find(s=>s.id==='enrich-numbers').url='https://reseller.invalid/','primary');
reject('Reject guessed date on known-year brochure',(d)=>d.ships.find(d=>d.ship.slug==='a-rosa-flora').ship.facts.find(f=>f.key==='decks_total').as_of='2024-01-01','actual check date');
const get=(slug,key)=>data.ships.find(d=>d.ship.slug===slug).ship.facts.find(f=>f.key===key);
test('Capacity basis is explicit; ranges, staff and guest estimates remain observations',()=>{
 assert.equal(get('avalon-saigon','guests_maximum').value,36);
 assert.equal(get('greg-mortimer','guests_maximum').value,148);assert.match(get('greg-mortimer','guests_maximum').note,/130/);
 for(const slug of ['volendam','zaandam'])assert.equal(get(slug,'guests_double_occupancy').value,1432);
 for(const slug of ['sh-minerva','sh-vega','sh-diana','riverside-ravel','riverside-mozart','avalon-alegria','scarlet-lady'])assert.equal(get(slug,'guests_maximum').value,null);
 for(const slug of ['sh-minerva','greg-mortimer','scarlet-lady','avalon-alegria'])assert.equal(get(slug,'crew').value,null);
});
test('Actual public renderer omits three conflicting facts',()=>{
 for(const [slug,key]of [['greg-mortimer','year_built'],['sylvia-earle','year_built'],['koningsdam','length_m']]){
  const row=data.ships.find(d=>d.ship.slug===slug);assert.equal(get(slug,key).verification,'conflicting');
  assert(!renderer.displayCruiseFacts(row.ship,row.sources).some(f=>f.key===key));
 }
});
test('Builder construction year remains separate from delayed maiden voyage',()=>{
 assert.equal(get('avalon-envision','year_built').value,2018);assert.equal(get('avalon-view','year_built').value,2019);
 assert.equal(get('riverside-mozart','year_built').value,1987);assert.equal(get('riverside-mozart','last_refurbished').value,null);
});
test('Half-deck convention and approximate GT retain visible qualifications',()=>{
 assert.equal(get('a-rosa-flora','decks_total').value,3.5);assert.match(get('a-rosa-flora','decks_total').note,/2024/);
 assert.equal(get('a-rosa-sena','decks_total').value,5);assert.match(get('scarlet-lady','gross_tonnage').note,/Approximate/);
 for(const slug of ['greg-mortimer','sylvia-earle','douglas-mawson'])assert.equal(get(slug,'gross_tonnage').value,null);
});
test('Do not infer total restaurants, shops or pools from partial venue lists',()=>{
 for(const row of data.ships){const old=base.ships.find(d=>d.ship.id===row.ship.id);for(const k of ['restaurants','dining_outlets','cafes','bars','shops','pools'])assert.deepEqual(row.ship.facts.find(f=>f.key===k),old.ship.facts.find(f=>f.key===k));}
});
test('Music programs respect ship-specific columns and retain variable schedules',()=>{
 const names=slug=>data.ships.find(d=>d.ship.slug===slug).programs.map(p=>p.name);
 assert(names('koningsdam').includes('B.B. King All Star Band'));assert(!names('eurodam').includes('B.B. King All Star Band'));
 assert(names('noordam').includes('The DAM Band'));assert(!names('volendam').includes('Rolling Stone Lounge Band'));
 assert(!data.ships.find(d=>d.ship.slug==='noordam').venues.some(v=>v.name==='Tamarind'));
 for(const row of data.ships)for(const p of row.programs.filter(p=>p.source_ids.includes('enrich-venue-matrix')))assert.match(p.availability_note,/vary/);
});
const report={status:'PASS',checked_at:evidence.checked_at,scope:'Offline contract, preservation, provenance linkage and real display-function checks. Live collision/import/publication not executed here.',checks_passed:checks.length,worldwideComplete:false,summary:evidence.summary,checks,files:{[stage]:hash(fs.readFileSync(path.join(root,stage))),[sidecar]:hash(fs.readFileSync(path.join(root,sidecar))),'data/cruises/research/batch-002-enrichment-validate.cjs':hash(fs.readFileSync(__filename))}};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'batch-002-enrichment-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
