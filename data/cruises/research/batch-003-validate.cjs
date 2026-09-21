#!/usr/bin/env node
'use strict';
// Offline research/data checks only. Never contacts or imports into a database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../../..');
const stage='data/cruises/staged/verified-operating-batch-003.json',sidecar='data/cruises/research/batch-003-evidence.json',inventoryPath='data/cruises/research/batch-003-fleet-inventory.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const data=read(stage),evidence=read(sidecar),inventory=read(inventoryPath);
const {validate:catalogValidate}=require('../../../scripts/cruises/validate-catalog.cjs');
const renderer={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/cruises/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:renderer,URL});
const previous=evidence.bases.flatMap(b=>read(b.path).ships);
const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const hosts=new Set(['www.royalcaribbean.com','www.ncl.com','www.msccruisesusa.com','www.msccruises.com','www.msccruises.co.uk','www.celebritycruises.com','www.rclinvestor.com']);
const future=new Set(['hero-of-the-seas','norwegian-aura','msc-world-asia','msc-world-atlantic','celebrity-xcite','celebrity-boundless','celebrity-compass','celebrity-roamer','celebrity-seeker','celebrity-wanderer','norwegian-sky','cordelia-sky']);
function validate(d,e){
 const errors=[...catalogValidate(d).errors],check=(x,m)=>{if(!x)errors.push(m);};
 check(d.ships.length===84&&d.operators.length===4,'exact 84 ships / four operators');
 check(e.checked_at==='2026-09-21'&&e.ships.length===84,'dated per-ship evidence');
 const registry=new Set(read('data/cruises/research/operator-registry.json').operators.map(o=>o.id));
 const ids=new Set(),names=new Set();
 for(const row of d.ships){
  const s=row.ship,ev=e.ships.find(x=>x.ship_id===s.id),src=new Map(row.sources.map(x=>[x.id,x]));
  check(registry.has(s.operator_id),'known operator registry');
  check(!future.has(s.slug),'future/transition vessel excluded');
  check(!previous.some(p=>p.ship.id===s.id||p.ship.universe_id===s.universe_id||p.ship.slug===s.slug||normalized(p.ship.name)===normalized(s.name)||p.ship.official_url===s.official_url),'no collision with earlier 71 identities');
  check(!names.has(normalized(s.name)),'no normalized ship-name duplicate');names.add(normalized(s.name));
  check(s.publication_status==='draft'&&s.operating_status==='operating'&&s.identity_verified&&s.overnight_public_cruise,'only verified overnight operating drafts');
  check(s.imo===null&&s.eni===null&&s.photo===null&&s.name_history.length===0,'no invented identifiers, history or photos');
  check(!!ev&&ev.slug===s.slug&&!!ev.identity_basis,'matching identity evidence');if(!ev)continue;
  check(src.size===row.sources.length,'unique local source IDs');
  for(const source of row.sources){let valid=false;try{const u=new URL(source.url);valid=u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password;}catch{}
   check(valid&&source.source_type==='operator','primary official sources only');
   check(source.checked_at===e.checked_at&&!!source.publisher,'dated publisher provenance');
   const ob=ev.source_observations.find(x=>x.source_id===source.id);check(!!ob&&!!ob.locator&&!!ob.observation&&!!ob.access,'source locator/access boundary');
  }
  const identity=ev.field_evidence.find(x=>x.path==='ship.identity_and_operating_scope');
  check(!!identity&&identity.value.name===s.name&&identity.value.operator_id===s.operator_id&&identity.value.kind===s.kind,'identity fields match evidence');
  check(s.facts.length===19&&new Set(s.facts.map(f=>f.key)).size===19,'all 19 distinct fact keys');
  for(const f of s.facts){
   check(f.as_of===e.checked_at,'real as-of date');
   if(f.value===null){check(f.verification==='unverified'&&f.source_ids.length===0,'unknown remains null and unsourced');continue;}
   check(f.verification==='verified'||f.verification==='conflicting','explicit non-null verification state');
   check(f.source_ids.length>0&&f.source_ids.every(id=>src.has(id)),'fact source linkage');
   const proof=ev.field_evidence.filter(x=>x.path==='ship.facts.'+f.key).at(-1);
   check(!!proof&&JSON.stringify(proof.value)===JSON.stringify(f.value)&&proof.verification===f.verification&&JSON.stringify(proof.source_ids)===JSON.stringify(f.source_ids),'fact matches recorded observation');
  }
  const childNames=new Set();
  for(const child of [...row.venues,...row.programs,...s.cabin_categories]){
   check(!ids.has(child.id),'globally unique immutable IDs');ids.add(child.id);
   check(child.source_ids.length>0&&child.source_ids.every(id=>src.has(id)),'child source linkage');
   check(child.ship_id===s.id,'child belongs to this ship');
   const collection=row.venues.includes(child)?'venues':'programs';
   check(ev.field_evidence.some(x=>x.path===collection+'.'+child.id),'every child has explicit field evidence');
   if(collection==='venues'){check(child.place_id===null,'no invented canonical place links');check(!childNames.has(normalized(child.name)),'no normalized duplicate venue');childNames.add(normalized(child.name));}
   else check(child.as_of===e.checked_at&&/vary/.test(child.availability_note),'program does not guarantee a sailing schedule');
  }
  for(const id of [s.id,s.universe_id]){check(!ids.has(id),'globally unique immutable IDs');ids.add(id);}
  const pub=structuredClone(row);pub.ship.publication_status='published';check(catalogValidate({schemaVersion:1,operators:d.operators,ships:[pub]}).errors.length===0,'existing publication contract satisfied');
 }
 return errors;
}
const checks=[];function test(name,run){run();checks.push({name,status:'PASS'});}
test('Both prior identity batches remain hash-pinned and total 71',()=>{
 assert.equal(previous.length,71);
 for(const b of evidence.bases){assert.equal(hash(fs.readFileSync(path.join(root,b.path))),b.sha256);assert.equal(read(b.path).ships.length,b.ship_count);}
 assert.equal(evidence.bases[1].sha256,'3fd875b18bd5a0234502dae66256fa9081b3195e09431b962c67bd4e87d73dea');
});
test('84 staged ships pass actual catalog contract and recorded provenance',()=>assert.deepEqual(validate(data,evidence),[]));
test('Current fleet inventory reconciles every named entry exactly once',()=>{
 const expected={'royal-caribbean-international':[31,29],'norwegian-cruise-line':[21,19],'msc-cruises':[25,22],'celebrity-cruises':[16,14]};
 const seen=new Set();
 for(const op of inventory.operators){assert.deepEqual([op.listed_count,op.staged_count],expected[op.operator_id]);assert.equal(op.ships.length,op.listed_count);
  for(const s of op.ships){assert(!seen.has(s.slug));seen.add(s.slug);if(s.disposition==='staged_operating')assert(data.ships.some(d=>d.ship.slug===s.slug&&d.ship.id===s.ship_id));else if(s.disposition==='existing_pinned_identity')assert(previous.some(d=>d.ship.id===s.ship_id));else assert.equal(s.disposition,'excluded_future');}
 }
 assert.equal(inventory.withheld.length,2);assert.match(inventory.withheld[0].reason,/transition/);
});
function reject(name,mutate,reason){test(name,()=>{const d=structuredClone(data),e=structuredClone(evidence);mutate(d,e);assert(validate(d,e).some(x=>x.includes(reason)),reason);});}
reject('Reject collision with a prior published ship',d=>{d.ships[0].ship.id=previous[0].ship.id;},'collision');
reject('Reject an announced ship in operating batch',d=>{d.ships[0].ship.slug='hero-of-the-seas';},'future/transition');
reject('Reject silent publication',d=>{d.ships[0].ship.publication_status='published';},'drafts');
reject('Reject unreviewed photo or invented IMO',d=>{d.ships[0].ship.imo='1234567';},'invented identifiers');
reject('Reject unsourced scalar substitution',d=>{d.ships[0].ship.facts.find(f=>f.value!==null).value=123456;},'recorded observation');
reject('Reject a reseller disguised as primary source',d=>{d.ships[0].sources[0].url='https://reseller.invalid/fleet';},'primary official');
reject('Reject a venue linked to the ship as a place',d=>{d.ships[0].venues[0].place_id=d.ships[0].ship.id;},'canonical place');
const get=(slug,key)=>data.ships.find(d=>d.ship.slug===slug).ship.facts.find(f=>f.key===key);
test('Typed capacities retain explicit basis and Luna discrepancy is withheld',()=>{
 for(const row of data.ships){assert.equal(row.ship.facts.find(f=>f.key==='guests_maximum').value,null);assert.equal(row.ship.facts.find(f=>f.key==='guests_lower_berths').value,null);
  if(row.ship.operator_id==='msc-cruises')assert.equal(row.ship.facts.find(f=>f.key==='guests_double_occupancy').value,null);
 }
 assert.equal(get('norwegian-luna','guests_double_occupancy').verification,'conflicting');
 assert.equal(get('norwegian-aqua','guests_double_occupancy').value,3565);
 assert.equal(get('celebrity-apex','guests_double_occupancy').value,2910);
 assert.equal(get('celebrity-flora','guests_double_occupancy').value,null);
});
test('Actual display helper hides all 43 conflicting and all unknown facts',()=>{
 let conflicts=0;
 for(const row of data.ships){const shown=renderer.displayCruiseFacts(row.ship,row.sources);for(const f of row.ship.facts){if(f.verification!=='verified')assert(!shown.some(v=>v.key===f.key));if(f.verification==='conflicting')conflicts++;}}
 assert.equal(conflicts,43);assert.equal(get('msc-seascape','length_m').verification,'conflicting');assert.equal(get('msc-seascape','gross_tonnage').verification,'conflicting');
});
test('Construction, service, GRT and deck conventions are never conflated',()=>{
 assert.equal(get('norwegian-dawn','year_built').value,2002);assert.equal(get('norwegian-dawn','last_refurbished').value,null);
 assert.equal(get('legend-of-the-seas','entered_service').value,'2026');assert.equal(get('legend-of-the-seas','year_built').value,null);
 assert.equal(get('norwegian-luna','entered_service').value,'2026-03-11');
 assert.equal(get('anthem-of-the-seas','decks_passenger').value,null);assert.equal(get('anthem-of-the-seas','decks_total').value,null);
 for(const row of data.ships.filter(d=>d.ship.operator_id==='norwegian-cruise-line'))assert.equal(row.ship.facts.find(f=>f.key==='gross_tonnage').value,null);
});
test('No totals inferred from partial venue lists; only explicit Utopia counters',()=>{
 for(const row of data.ships)for(const key of ['restaurants','dining_outlets','bars','cafes','shops','pools']){
  const f=row.ship.facts.find(f=>f.key===key);if(row.ship.slug==='utopia-of-the-seas'&&['dining_outlets','bars','pools'].includes(key))assert(f.source_ids.includes('ship'));else assert.equal(f.value,null);
 }
 assert.equal(get('utopia-of-the-seas','dining_outlets').value,21);assert.equal(get('utopia-of-the-seas','pools').value,5);
 assert(!data.ships.find(d=>d.ship.slug==='norwegian-luna').venues.some(v=>v.name==='Planterie'));
});
test('Programs remain separate from physical venues with sailing variability',()=>{
 let count=0;for(const row of data.ships){assert.equal(renderer.visibleCruisePrograms(row).length,row.programs.length);count+=row.programs.length;for(const p of row.programs)assert(!row.venues.some(v=>v.id===p.id));}assert.equal(count,11);
});
const report={status:'PASS',checked_at:evidence.checked_at,scope:'Offline data/contract, identity reconciliation and actual display-function checks. No production collision query, rollback execution, import or publication performed.',worldwideComplete:false,checks_passed:checks.length,summary:evidence.summary,checks,files:Object.fromEntries([stage,sidecar,inventoryPath,'data/cruises/research/batch-003-validate.cjs'].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]))};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'batch-003-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
