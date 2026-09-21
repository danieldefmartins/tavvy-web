#!/usr/bin/env node
'use strict';
// Local artifact/contract checks. No network, database execution or source-verification claim.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { validate: catalogValidate } = require('../../../scripts/cruises/validate-catalog.cjs');
const root = path.resolve(__dirname, '../../..');
const stagePath = path.join(root, 'data/cruises/staged/verified-operating-batch-002.json');
const evidencePath = path.join(__dirname, 'batch-002-operating-evidence.json');
const data = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const leads = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch-002-fleet-inventory.json'), 'utf8'));
const first = JSON.parse(fs.readFileSync(path.join(root, 'data/cruises/staged/verified-operating-batch-001.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'operator-registry.json'), 'utf8'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const norm = s => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const keys = ['year_built','entered_service','last_refurbished','length_m','gross_tonnage','guests_double_occupancy','guests_lower_berths','guests_maximum','crew','decks_total','decks_passenger','restaurants','dining_outlets','cafes','bars','shops','pools','deck_plan_url','accessibility_url'];
const hosts = new Set(['www.cunard.com','www.hollandamerica.com','newsroom.arosa-cruises.com','www.arosa-cruises.com','www.avalonwaterways.com','www.virginvoyages.com','riverside-cruises.com','www.aurora-expeditions.com','www.swanhellenic.com','asia-pacific.swanhellenic.com']);
const expected = {cunard:4,'holland-america-line':11,'a-rosa':15,'avalon-waterways':16,'virgin-voyages':4,'riverside-luxury-cruises':3,'aurora-expeditions':3,'swan-hellenic':3};
function validate(d, e) {
 const errors = [...catalogValidate(d).errors];
 const check = (ok, why) => { if (!ok) errors.push(why); };
 check(d.ships.length===59 && d.operators.length===8, 'expected bounded batch size');
 check(e.worldwideComplete===false && e.publication_status==='draft', 'not published or worldwide complete');
 check(e.checked_at==='2026-09-21' && e.ships.length===d.ships.length, 'dated per-ship evidence');
 check(e.withheld_leads.length===10, 'ten withheld leads');
 const oldIds = new Set(first.ships.flatMap(x=>[x.ship.id,x.ship.universe_id]));
 const oldNames = new Set(first.ships.map(x=>norm(x.ship.name)));
 const oldUrls = new Set(first.ships.map(x=>x.ship.official_url));
 const ids = new Set(), names = new Set(), urls = new Set(), usedLeads = new Set();
 for (const o of d.operators) {
  const r=registry.operators.find(x=>x.id===o.id);
  check(!!r && o.name===r.name && o.official_url===r.officialWebsite, 'registry operator unchanged');
  check(d.ships.filter(x=>x.ship.operator_id===o.id).length===expected[o.id], 'exact operator counts');
 }
 for (const row of d.ships) {
  const s=row.ship, ev=e.ships.find(x=>x.ship_id===s.id), src=new Map(row.sources.map(x=>[x.id,x]));
  check(s.publication_status==='draft' && s.operating_status==='operating' && s.identity_verified && s.overnight_public_cruise, 'operating public overnight drafts only');
  const clone=structuredClone(row);clone.ship.publication_status='published';
  check(catalogValidate({schemaVersion:1,operators:d.operators,ships:[clone]}).errors.length===0, 'publication contract requires status sources');
  check(!oldNames.has(norm(s.name)) && !names.has(norm(s.name)), 'no existing or internal normalized name collision');names.add(norm(s.name));
  check(!oldUrls.has(s.official_url) && !urls.has(s.official_url), 'unique official ship URLs');urls.add(s.official_url);
  for (const id of [s.id,s.universe_id,...row.venues.map(x=>x.id),...s.cabin_categories.map(x=>x.id),...(row.programs||[]).map(x=>x.id)]) {
   check(!ids.has(id)&&!oldIds.has(id),'unique ship/universe/child identities');ids.add(id);
  }
  check(s.photo===null && s.imo===null && s.eni===null && s.name_history.length===0, 'no invented media/registry/history');
  check(src.size===row.sources.length, 'unique source IDs within ship');
  for (const source of row.sources) {
   let official=false;try {const u=new URL(source.url);official=u.protocol==='https:'&&hosts.has(u.hostname)&&!u.username&&!u.password;}catch{}
   check(official&&source.source_type==='operator','official sources only');
   check(source.checked_at===e.checked_at && !!source.publisher.trim(),'source date/publisher');
  }
  check(row.sources.some(x=>x.url===s.official_url),'official URL has provenance');
  check(!!ev && ev.checked_at===e.checked_at && ev.slug===s.slug && ev.gaps.length>0,'per-ship provenance/gaps');
  if(!ev)continue;
  const lead=leads.leads.find(x=>x.lead_id===ev.research_lead_id);
  check(!!lead && lead.name===s.name && lead.operator_registry_id===s.operator_id && lead.kind_candidate===s.kind,'verified rows reconcile to original leads');
  check(!usedLeads.has(ev.research_lead_id),'one row per original lead');usedLeads.add(ev.research_lead_id);
  const provenance=(where, refs)=>check(refs.length>0 && refs.every(id=>src.has(id)) && ev.field_evidence[where]?.checked_at===e.checked_at && ev.field_evidence[where]?.source_ids.join('|')===refs.join('|'),'field sources and dates resolve');
  for(const field of ['name','operator_id','operator_name','kind','official_url','operating_status','overnight_public_cruise','identity_verified'])provenance('ship.'+field,s.status_source_ids);
  check(s.facts.length===19 && new Set(s.facts.map(f=>f.key)).size===19 && s.facts.every(f=>keys.includes(f.key)),'every optional fact explicit once');
  for(const f of s.facts){
   check(f.as_of===e.checked_at,'fact as-of date');
   if(f.value===null)check(f.verification==='unverified'&&f.source_ids.length===0,'unknown stays null/unverified');
   else {
    check(f.verification==='verified','published values explicitly verified');
    provenance('ship.facts.'+f.key,f.source_ids);
    if(!['entered_service','last_refurbished','deck_plan_url','accessibility_url'].includes(f.key))check(typeof f.value==='number'&&Number.isFinite(f.value)&&f.value>0,'numeric facts positive and numeric');
   }
  }
  for(const v of row.venues){check(v.place_id===null&&v.ship_id===s.id,'no fabricated canonical venue place');provenance('venues.'+v.id,v.source_ids);}
  for(const c of s.cabin_categories)provenance('ship.cabin_categories.'+c.id,c.source_ids);
  for(const p of row.programs||[])provenance('programs.'+p.id,p.source_ids);
  check(!('reviews' in row)&&!('rating' in s),'no fabricated reviews');
 }
 for(const w of e.withheld_leads){check(!usedLeads.has(w.lead_id)&&leads.leads.some(l=>l.lead_id===w.lead_id),'withheld not published');check(w.canonical_ship_id===null&&w.operating_status==='unknown'&&!!w.reason,'withheld remains unknown');usedLeads.add(w.lead_id);}
 check(usedLeads.size===69,'all69 original leads accounted for');
 return errors;
}
const checks=[];
function test(name,run){run();checks.push({name,status:'PASS'});}
test('59 drafts meet contract, evidence, registry and original69 lead reconciliation',()=>assert.deepEqual(validate(data,evidence),[]));
function reject(name, mutate, fragment){test(name,()=>{const d=structuredClone(data),e=structuredClone(evidence);mutate(d,e);assert(validate(d,e).some(x=>x.includes(fragment)),fragment);});}
reject('Reject automatic publication',(d)=>d.ships[0].ship.publication_status='published','drafts only');
reject('Reject fake complete-world claim',(d,e)=>e.worldwideComplete=true,'worldwide');
reject('Reject duplicate identity',(d)=>d.ships[1].ship.id=d.ships[0].ship.id,'identities');
reject('Reject missing status source',(d)=>d.ships[0].ship.status_source_ids=['absent'],'status sources');
reject('Reject nonofficial source',(d)=>d.ships[0].sources[0].url='https://untrusted.example/ship','official sources');
reject('Reject made-up venue place UUID',(d)=>d.ships[0].venues[0].place_id=d.ships[0].ship.universe_id,'canonical venue');
reject('Reject zero from unknown capacity',(d)=>{const f=d.ships[0].ship.facts.find(f=>f.key==='guests_maximum');f.value=0;f.verification='verified';},'numeric facts');
reject('Reject undated verified field',(d,e)=>delete e.ships[0].field_evidence['ship.facts.crew'],'field sources');
reject('Reject missing withheld lead',(d,e)=>e.withheld_leads.pop(),'withheld leads');
test('Preserve built versus service and ambiguous capacity boundaries',()=>{
 const get=(slug,key)=>data.ships.find(d=>d.ship.slug===slug).ship.facts.find(f=>f.key===key).value;
 assert.equal(get('a-rosa-alva','year_built'),2018);assert.equal(get('a-rosa-alva','entered_service'),'2019');
 assert.equal(get('queen-mary-2','guests_maximum'),null);assert.equal(get('sh-diana','guests_maximum'),null);
 assert.equal(get('a-rosa-alea','guests_maximum'),null);assert.equal(get('brilliant-lady','deck_plan_url'),null);
 assert.equal(get('a-rosa-clea','last_refurbished'),'2026');assert.equal(get('douglas-mawson','guests_maximum'),154);
});
test('Prior four batch001 files and registry are byte-for-byte unchanged',()=>{
 for(const [file,sha] of Object.entries(leads.protected_batch001_inputs))assert.equal(hash(fs.readFileSync(path.join(root,file))),sha,file);
 assert.equal(hash(fs.readFileSync(path.join(__dirname,'operator-registry.json'))),leads.registry_snapshot.sha256);
});
const result={status:'PASS',scope:'Local contract, provenance linkage, dedupe and rejection tests. Official source research is documented separately; live collision/rollback gate NOT executed.',checked_at:evidence.checked_at,checks_passed:checks.length,ships:59,operators:8,withheld_leads:10,worldwideComplete:false,counts:{kinds:Object.fromEntries(['ocean','river','expedition'].map(k=>[k,data.ships.filter(d=>d.ship.kind===k).length])),verified_facts:data.ships.flatMap(d=>d.ship.facts).filter(f=>f.verification==='verified').length,unknown_facts:data.ships.flatMap(d=>d.ship.facts).filter(f=>f.value===null).length,venues:data.ships.flatMap(d=>d.venues).length,cabins:data.ships.flatMap(d=>d.ship.cabin_categories).length,programs:data.ships.flatMap(d=>d.programs).length,photos:0},checks,files:{'verified-operating-batch-002.json':hash(fs.readFileSync(stagePath)),'batch-002-operating-evidence.json':hash(fs.readFileSync(evidencePath)),'batch-002-verified-validate.cjs':hash(fs.readFileSync(__filename))}};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'batch-002-operating-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
