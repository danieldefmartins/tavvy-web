#!/usr/bin/env node
'use strict';
// Offline research/data checks only. Never contacts or imports into a database.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../../..');
const stage='data/cruises/staged/verified-operating-batch-005.json',sidecar='data/cruises/research/batch-005-evidence.json',inventoryPath='data/cruises/research/batch-005-fleet-inventory.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const data=read(stage),evidence=read(sidecar),inventory=read(inventoryPath);
const {validate:catalogValidate}=require('../../../scripts/cruises/validate-catalog.cjs');
const renderer={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/cruises/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:renderer,URL});
const previous=evidence.bases.flatMap(b=>read(b.path).ships);
const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const hosts=new Set(['www.vikingrivercruises.com','www.vikingrivercruises.com.au','www.vikingcruises.com','www.viking.com','ir.viking.com','aem-prod-publish.viking.com','docs.vikingcruises.com','www.amawaterways.com']);
const withheld=new Set(inventory.withheld.map(r=>r.slug));
function validate(d,e){
 const errors=[...catalogValidate(d).errors],check=(x,m)=>{if(!x)errors.push(m);};
 check(d.ships.length===124&&d.operators.length===2,'exact 124 ships / two operators');
 check(e.checked_at==='2026-09-21'&&e.ships.length===124,'dated per-ship evidence');
 const registry=new Set(read('data/cruises/research/operator-registry.json').operators.map(o=>o.id));
 const ids=new Set(),names=new Set();
 for(const row of d.ships){
  const s=row.ship,ev=e.ships.find(x=>x.ship_id===s.id),src=new Map(row.sources.map(x=>[x.id,x]));
  check(registry.has(s.operator_id),'known operator registry');
  check(!withheld.has(s.slug),'future, suspended or unresolved vessel excluded');
  check(!previous.some(p=>p.ship.id===s.id||p.ship.universe_id===s.universe_id||p.ship.slug===s.slug||normalized(p.ship.name)===normalized(s.name)||p.ship.official_url===s.official_url),'no collision with earlier 218 identities');
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
const get=(slug,key)=>data.ships.find(d=>d.ship.slug===slug).ship.facts.find(f=>f.key===key);
test('All four prior identity batches remain hash-pinned and total 218',()=>{
 assert.equal(previous.length,218);assert.equal(evidence.bases.length,4);
 for(const b of evidence.bases){assert.equal(hash(fs.readFileSync(path.join(root,b.path))),b.sha256);assert.equal(read(b.path).ships.length,b.ship_count);}
 assert.equal(evidence.bases[3].sha256,'e95de3c3be495a46c09622144b513cd27f94a2fc050b8f088f58e243ce710212');
});
test('124 operating drafts satisfy real catalog contract and per-field evidence',()=>assert.deepEqual(validate(data,evidence),[]));
test('Official fleet URL union and all observed Ama ship pages are reconciled',()=>{
 const expected={viking:[128,97],amawaterways:[37,27]},seen=new Set();
 for(const op of inventory.operators){assert.deepEqual([op.listed_count,op.staged_count],expected[op.operator_id]);assert.equal(op.ships.length,op.listed_count);
  for(const row of op.ships){assert(!seen.has(row.slug));seen.add(row.slug);if(row.disposition==='staged_operating')assert(data.ships.some(d=>d.ship.slug===row.slug&&d.ship.id===row.ship_id));else if(row.disposition==='existing_pinned_identity')assert(previous.some(d=>d.ship.id===row.ship_id));else assert(inventory.withheld.some(w=>w.slug===row.slug&&w.reason&&w.source_url));}
 }
 assert.equal(inventory.duplicate_pages.length,1);assert.equal(inventory.duplicate_pages[0].canonical_slug,'amavida');
});
test('Kara, Octantis, AmaMagna, AmaDouro and AmaLea retain earlier IDs only',()=>{
 for(const slug of ['viking-kara','viking-octantis','amamagna','amadouro','amalea']){assert(previous.some(d=>d.ship.slug===slug));assert(!data.ships.some(d=>d.ship.slug===slug));}
});
function reject(name,mutate,reason){test(name,()=>{const d=structuredClone(data),e=structuredClone(evidence);mutate(d,e);assert(validate(d,e).some(x=>x.includes(reason)),reason);});}
reject('Reject collision with previously published identity',d=>{d.ships[0].ship.id=previous[0].ship.id;},'collision');
reject('Reject future AmaMaya despite stale current-tense ship marketing',d=>{d.ships[0].ship.slug='amamaya';},'unresolved vessel');
reject('Reject silent publication of staged research',d=>{d.ships[0].ship.publication_status='published';},'drafts');
reject('Reject invented registry identifier or photo',d=>{d.ships[0].ship.imo='1234567';},'invented identifiers');
reject('Reject unsourced scalar replacement',d=>{d.ships[0].ship.facts.find(f=>f.value!==null).value=999999;},'recorded observation');
reject('Reject reseller masquerading as official source',d=>{d.ships[0].sources[0].url='https://reseller.invalid/fleet';},'primary official');
reject('Reject a ship UUID used as a venue place ID',d=>{d.ships[0].venues[0].place_id=d.ships[0].ship.id;},'canonical place');
test('Explicit maximum basis is retained, untyped guest labels are not relabeled',()=>{
 assert.equal(get('viking-aegir','guests_maximum').value,190);assert.match(get('viking-aegir','guests_maximum').note,/2025-12-31/);
 assert.equal(get('viking-astrild','guests_maximum').value,98);assert.equal(get('viking-polaris','guests_maximum').value,378);
 assert.equal(get('amareina','guests_maximum').value,162);assert.equal(get('amasintra','guests_maximum').value,102);
 for(const slug of ['viking-mira','viking-annar','viking-eldir','amabella','amadara'])assert.equal(get(slug,'guests_maximum').value,null);
 for(const d of data.ships)for(const k of ['guests_double_occupancy','guests_lower_berths'])assert.equal(get(d.ship.slug,k).value,null);
});
test('Actual renderer hides all six unresolved factual discrepancies',()=>{
 let conflicts=0;for(const d of data.ships){const shown=renderer.displayCruiseFacts(d.ship,d.sources);for(const f of d.ship.facts){if(f.verification!=='verified')assert(!shown.some(x=>x.key===f.key));if(f.verification==='conflicting')conflicts++;}}
 assert.equal(conflicts,6);for(const slug of ['amasofia','amasonata'])assert.equal(get(slug,'guests_maximum').verification,'conflicting');
 for(const slug of ['viking-egdir','viking-embla','viking-gymir'])assert.equal(get(slug,'year_built').verification,'conflicting');
 assert.equal(get('viking-ra','last_refurbished').verification,'conflicting');
});
test('Combined build/refurbishment and maiden seasons do not become construction years',()=>{
 for(const d of data.ships.filter(d=>d.ship.operator_id==='amawaterways'))assert.equal(get(d.ship.slug,'year_built').value,null);
 assert.equal(get('viking-ra','year_built').value,null);assert.equal(get('ms-antares','year_built').value,null);
 assert.equal(get('viking-saturn','year_built').value,2023);assert.equal(get('viking-saturn','entered_service').value,null);
 assert.equal(get('amamagdalena','entered_service').value,'2025');assert.equal(get('amabella','last_refurbished').value,null);
});
test('GRT diagrams and numbered deck labels never imply GT or total decks',()=>{
 for(const d of data.ships){for(const k of ['decks_total','decks_passenger'])assert.equal(get(d.ship.slug,k).value,null);if(d.ship.slug!=='viking-mira')assert.equal(get(d.ship.slug,'gross_tonnage').value,null);}
 assert.equal(get('viking-mira','gross_tonnage').value,54300);assert(get('viking-mira','gross_tonnage').source_ids.includes('2026-milestone'));
});
test('Partial venues do not become inferred counts or scheduled shows',()=>{
 for(const d of data.ships){assert.equal(d.programs.length,0);for(const k of ['bars','shops','cafes','pools'])assert.equal(get(d.ship.slug,k).value,null);}
 for(const d of data.ships.filter(d=>d.ship.operator_id==='viking'))for(const k of ['restaurants','dining_outlets'])assert.equal(get(d.ship.slug,k).value,null);
 assert.equal(get('amabella','dining_outlets').value,3);assert.equal(get('amabella','restaurants').value,null);assert.equal(get('amacello','restaurants').value,2);
 assert.equal(data.ships.find(d=>d.ship.slug==='viking-mira').venues.length,0);
});
test('Suspended fleets and dated transition uncertainty stay outside operating batch',()=>{
 for(const slug of ['viking-sekhmet','viking-libra','viking-ptah','viking-haki','viking-halogi','viking-rota','viking-sjofn','viking-yi-dun','viking-sineus','viking-akun','viking-prestige','amanubia','amarudi','amacleo','amagaia','amamaria']){assert(withheld.has(slug));assert(!data.ships.some(d=>d.ship.slug===slug));}
 assert(inventory.identity_aliases_not_imported.some(r=>r.aliases.includes('Viking Sun')));
});
test('Previously published Octantis discrepancy is reported without replacing its row',()=>{
 assert.equal(evidence.prior_record_discrepancies.length,1);assert.equal(evidence.prior_record_discrepancies[0].slug,'viking-octantis');assert(!data.ships.some(d=>d.ship.slug==='viking-octantis'));
});
test('MS Antares annual spelling cannot silently create a second prior identity',()=>{
 const aliases=inventory.identity_aliases_not_imported.find(r=>r.canonical_observed_name==='MS Antares');assert(aliases.aliases.includes('Viking Antares'));
 assert.equal(data.ships.filter(d=>['msantares','vikingantares'].includes(normalized(d.ship.name))).length,1);
 assert(!previous.some(d=>['msantares','vikingantares'].includes(normalized(d.ship.name))||d.ship.name_history.some(h=>['msantares','vikingantares'].includes(normalized(h.name)))));
});
const report={status:'PASS',checked_at:evidence.checked_at,scope:'Offline identity, actual catalog/display contract and evidence checks only. No database collision query, import, rollback execution or publication performed.',worldwideComplete:false,checks_passed:checks.length,summary:evidence.summary,checks,files:Object.fromEntries([stage,sidecar,inventoryPath,'data/cruises/research/batch-005-validate.cjs'].map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]))};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'batch-005-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
