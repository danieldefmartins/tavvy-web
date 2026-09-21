#!/usr/bin/env node
'use strict';
// Offline research/data checks only. Never contacts or imports into a database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../../..');
const stage='data/cruises/staged/verified-operating-batch-004.json',sidecar='data/cruises/research/batch-004-evidence.json',inventoryPath='data/cruises/research/batch-004-fleet-inventory.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const data=read(stage),evidence=read(sidecar),inventory=read(inventoryPath);
const {validate:catalogValidate}=require('../../../scripts/cruises/validate-catalog.cjs');
const renderer={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/cruises/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:renderer,URL});
const previous=evidence.bases.flatMap(b=>read(b.path).ships);
const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const hosts=new Set(['www.carnival.com','www.carnival-news.com','www.princess.com','www.costacruises.com','disneycruise.disney.go.com','disneyparksblog.com','disneyexperiences.com','www.meyerwerft.de','www.margaritavilleatsea.com','pancanal.com']);
const future=new Set(['carnival-festivale','carnival-tropicale','disney-believe','margaritaville-at-sea-beachcomber']);
function validate(d,e){
 const errors=[...catalogValidate(d).errors],check=(x,m)=>{if(!x)errors.push(m);};
 check(d.ships.length===63&&d.operators.length===4,'exact 63 ships / four operators');
 check(e.checked_at==='2026-09-21'&&e.ships.length===63,'dated per-ship evidence');
 const registry=new Set(read('data/cruises/research/operator-registry.json').operators.map(o=>o.id));
 const ids=new Set(),names=new Set();
 for(const row of d.ships){
  const s=row.ship,ev=e.ships.find(x=>x.ship_id===s.id),src=new Map(row.sources.map(x=>[x.id,x]));
  check(registry.has(s.operator_id),'known operator registry');
  check(!future.has(s.slug),'future/transition vessel excluded');
  check(!previous.some(p=>p.ship.id===s.id||p.ship.universe_id===s.universe_id||p.ship.slug===s.slug||normalized(p.ship.name)===normalized(s.name)||p.ship.official_url===s.official_url),'no collision with earlier 155 identities');
  check(!names.has(normalized(s.name)),'no normalized ship-name duplicate');names.add(normalized(s.name));
  check(s.publication_status==='draft'&&s.operating_status==='operating'&&s.identity_verified&&s.overnight_public_cruise,'only verified overnight operating drafts');
  check(s.imo===null&&s.eni===null&&s.photo===null&&s.name_history.length===0,'no invented identifiers, history or photos');
  check(!!ev&&ev.slug===s.slug&&!!ev.identity_basis,'matching identity evidence');if(!ev)continue;
  check(src.size===row.sources.length,'unique local source IDs');
  for(const source of row.sources){let valid=false;try{const u=new URL(source.url);valid=u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password;}catch{}
   check(valid&&['operator','shipyard','other'].includes(source.source_type),'primary official sources only');
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
test('All three prior identity batches remain hash-pinned and total 155',()=>{
 assert.equal(previous.length,155);
 for(const b of evidence.bases){assert.equal(hash(fs.readFileSync(path.join(root,b.path))),b.sha256);assert.equal(read(b.path).ships.length,b.ship_count);}
 assert.equal(evidence.bases[1].sha256,'3fd875b18bd5a0234502dae66256fa9081b3195e09431b962c67bd4e87d73dea');
});
test('63 staged ships pass actual catalog contract and recorded provenance',()=>assert.deepEqual(validate(data,evidence),[]));
test('Current fleet inventory reconciles every named entry exactly once',()=>{
 const expected={'carnival-cruise-line':[31,29],'princess-cruises':[17,17],'costa-cruises':[9,9],'disney-cruise-line':[9,8]};
 const seen=new Set();
 for(const op of inventory.operators){assert.deepEqual([op.listed_count,op.staged_count],expected[op.operator_id]);assert.equal(op.ships.length,op.listed_count);
  for(const s of op.ships){assert(!seen.has(s.slug));seen.add(s.slug);if(s.disposition==='staged_operating')assert(data.ships.some(d=>d.ship.slug===s.slug&&d.ship.id===s.ship_id));else if(s.disposition==='existing_pinned_identity')assert(previous.some(d=>d.ship.id===s.ship_id));else assert.equal(s.disposition,'excluded_future');}
 }
 assert.equal(inventory.withheld.length,1);assert.equal(inventory.withheld[0].current_slug,'costa-fortuna');
});
function reject(name,mutate,reason){test(name,()=>{const d=structuredClone(data),e=structuredClone(evidence);mutate(d,e);assert(validate(d,e).some(x=>x.includes(reason)),reason);});}
reject('Reject collision with a prior staged or published ship',d=>{d.ships[0].ship.id=previous[0].ship.id;},'collision');
reject('Reject an announced ship in operating batch',d=>{d.ships[0].ship.slug='disney-believe';},'future/transition');
reject('Reject silent publication',d=>{d.ships[0].ship.publication_status='published';},'drafts');
reject('Reject unreviewed photo or invented IMO',d=>{d.ships[0].ship.imo='1234567';},'invented identifiers');
reject('Reject unsourced scalar substitution',d=>{d.ships[0].ship.facts.find(f=>f.value!==null).value=123456;},'recorded observation');
reject('Reject a reseller disguised as primary source',d=>{d.ships[0].sources[0].url='https://reseller.invalid/fleet';},'primary official');
reject('Reject a venue linked to the ship as a place',d=>{d.ships[0].venues[0].place_id=d.ships[0].ship.id;},'canonical place');
const get=(slug,key)=>data.ships.find(d=>d.ship.slug===slug).ship.facts.find(f=>f.key===key);

test('Typed passenger capacity retains lower-berth, double-occupancy and maximum bases',()=>{
 assert.equal(get('caribbean-princess','guests_lower_berths').value,3140);
 assert.equal(get('caribbean-princess','guests_double_occupancy').value,null);
 assert.equal(get('carnival-elation','guests_double_occupancy').value,2190);
 assert.equal(get('carnival-firenze','guests_double_occupancy').value,null);
 assert.equal(get('disney-wish','guests_maximum').value,4000);
 assert.equal(get('disney-magic','guests_maximum').value,null);
 assert.equal(get('disney-adventure','guests_maximum').value,null);
 for(const row of data.ships.filter(r=>r.ship.operator_id==='costa-cruises'))for(const k of ['guests_maximum','guests_lower_berths','guests_double_occupancy'])assert.equal(get(row.ship.slug,k).value,null);
});
test('Actual renderer hides all conflicting and unknown facts',()=>{
 let count=0;for(const row of data.ships){const shown=renderer.displayCruiseFacts(row.ship,row.sources);for(const f of row.ship.facts){if(f.verification!=='verified')assert(!shown.some(v=>v.key===f.key));if(f.verification==='conflicting')count++;}}
 assert.equal(count,14);assert.equal(get('carnival-liberty','gross_tonnage').verification,'conflicting');
 assert.equal(get('disney-wish','gross_tonnage').verification,'conflicting');
});
test('No inferred build year, deck conventions, GT/GRT or relaunch year',()=>{
 for(const row of data.ships){assert.equal(get(row.ship.slug,'year_built').value,null);assert.equal(get(row.ship.slug,'decks_total').value,null);assert.equal(get(row.ship.slug,'decks_passenger').value,null);}
 assert.equal(get('carnival-radiance','entered_service').value,null);
 assert.equal(get('carnival-sunshine','entered_service').value,null);
 assert.equal(get('carnival-luminosa','entered_service').value,null);
 assert.equal(get('disney-dream','entered_service').value,'2011-01-26');
 assert.equal(get('disney-adventure','entered_service').value,'2026-03-10');
 assert.equal(get('star-princess','entered_service').value,'2025');
 assert.equal(get('star-princess','gross_tonnage').value,null);
});
test('Explicit Costa totals retain pool and dining scope; partial venues never become totals',()=>{
 assert.equal(get('costa-toscana','restaurants').value,11);
 assert.equal(get('costa-toscana','pools').value,4);
 assert.equal(get('costa-fortuna','dining_outlets').value,5);
 assert.equal(get('costa-fortuna','restaurants').value,null);
 for(const row of data.ships)for(const key of ['bars','shops','cafes'])assert.equal(get(row.ship.slug,key).value,null);
 for(const row of data.ships.filter(r=>r.ship.operator_id!=='costa-cruises'))for(const key of ['restaurants','dining_outlets','pools'])assert.equal(get(row.ship.slug,key).value,null);
});
test('Programs remain distinct from physical venues and are not guaranteed schedules',()=>{
 let count=0;for(const row of data.ships){assert.equal(renderer.visibleCruisePrograms(row).length,row.programs.length);count+=row.programs.length;for(const p of row.programs)assert(!row.venues.some(v=>v.id===p.id));}assert.equal(count,24);
});
test('Costa Fortuna keeps one identity and exact dated transition evidence',()=>{
 const row=data.ships.find(r=>r.ship.slug==='costa-fortuna');
 assert(row.ship.status_source_ids.includes('future-launch'));assert(row.ship.status_source_ids.includes('transfer-announcement'));
 assert.equal(inventory.withheld[0].current_ship_id,row.ship.id);
 assert(!data.ships.some(r=>/beachcomber/i.test(r.ship.name)));
 assert.match(evidence.ships.find(e=>e.slug==='costa-fortuna').identity_basis,/January 2027/);
});
test('Wrong-ship redirects rejected and every staged ship has real feature evidence',()=>{
 for(const slug of ['carnival-firenze','carnival-venezia','carnival-adventure','carnival-encounter']){
  assert(!data.ships.find(r=>r.ship.slug===slug).sources.some(s=>s.id==='press-facts'));
  assert(evidence.source_rejections.some(s=>s.url.includes(slug+'-fact-sheet')&&s.redirect.includes('mardi-gras')));
 }
 for(const row of data.ships)assert(row.venues.length>0);
});
const report={status:'PASS',checked_at:evidence.checked_at,scope:'Offline data/contract, identity reconciliation and actual display-function checks. No production collision query, rollback execution, import or publication performed.',worldwideComplete:false,checks_passed:checks.length,summary:evidence.summary,checks,files:Object.fromEntries([stage,sidecar,inventoryPath,'data/cruises/research/batch-004-validate.cjs'].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]))};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'batch-004-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
