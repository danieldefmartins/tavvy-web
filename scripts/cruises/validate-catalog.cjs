/** Read-only staging validation. Never imports research automatically or writes to Supabase. */
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript');
const exportsForModule={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../lib/cruises/catalog.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsForModule,URL});
const {cruisePublicationProblems,displayCruiseFacts,sameCruiseIdentity}=exportsForModule;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validate(data){const errors=[],warnings=[];if(data.schemaVersion!==1||!Array.isArray(data.operators)||!Array.isArray(data.ships))return{errors:['Expected schemaVersion 1, operators and ships arrays.'],warnings};const operators=new Set(data.operators.map(o=>o.id)),slugs=new Set(),universes=new Set();for(const [index,item]of data.ships.entries()){const at='ships['+index+']',s=item?.ship;if(!s||!Array.isArray(item.sources)||!Array.isArray(item.venues)){errors.push(at+': expected ship, sources, venues');continue;}if(!UUID.test(s.id)||!UUID.test(s.universe_id))errors.push(at+': ship and Universe UUID required');if(!operators.has(s.operator_id))errors.push(at+': unknown operator_id');if(slugs.has(s.slug)||universes.has(s.universe_id))errors.push(at+': duplicate slug or Universe');slugs.add(s.slug);universes.add(s.universe_id);if(data.ships.slice(0,index).some(i=>i.ship&&sameCruiseIdentity(s,i.ship)))errors.push(at+': duplicate ship identity or official identifier');for(const key of ['facts','name_history','cabin_categories','status_source_ids'])if(!Array.isArray(s[key]))errors.push(at+': '+key+' array required');if(!Array.isArray(s.facts)||!Array.isArray(s.status_source_ids))continue;try{if(s.publication_status==='published')errors.push(...cruisePublicationProblems(s,item.sources).map(e=>at+': '+e));const facts=displayCruiseFacts(s,item.sources);if(facts.length<s.facts.length)warnings.push(at+': '+(s.facts.length-facts.length)+' facts will remain hidden (unknown, conflicting, unverified or invalid)');}catch{errors.push(at+': malformed provenance or fact data');}for(const venue of item.venues){if(venue.ship_id!==s.id)errors.push(at+': venue belongs to another ship');if(!UUID.test(venue.id)||(venue.place_id!==null&&!UUID.test(venue.place_id)))errors.push(at+': venue identities must be UUIDs or explicit null place_id');}}
for(const [index,item] of data.ships.entries()) {
 if(!item?.ship) continue;
 if(item.programs!==undefined&&!Array.isArray(item.programs)){errors.push('ships['+index+']: programs must be an array');continue;}
 const seen=new Set();
 for(const program of item.programs||[]) {
  const at='ships['+index+']: program';
  if(!program||!UUID.test(program.id)||seen.has(program.id)){errors.push(at+' requires a unique UUID');continue;}
  seen.add(program.id);
  if(program.ship_id!==item.ship.id)errors.push(at+' belongs to another ship');
  if(program.venue_id!==null&&!(item.venues||[]).some(v=>v.id===program.venue_id&&v.ship_id===item.ship.id))errors.push(at+' venue must belong to this ship');
  if(!['show','music','enrichment','activity'].includes(program.kind)||typeof program.name!=='string'||!program.name.trim())errors.push(at+' requires a name and supported kind');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(program.as_of||'')||!Number.isFinite(Date.parse(program.as_of))||new Date(program.as_of).toISOString().slice(0,10)!==program.as_of)errors.push(at+' requires a valid as_of date');
  if(!Array.isArray(program.source_ids)||!program.source_ids.length||!program.source_ids.every(id=>(item.sources||[]).some(source=>source.id===id)))errors.push(at+' requires known source IDs');
 }
}
return{errors,warnings,ships:data.ships.length,operating:data.ships.filter(d=>d.ship?.operating_status==='operating').length,announced:data.ships.filter(d=>d.ship?.operating_status==='announced').length,worldwideComplete:false};}
module.exports={validate};if(require.main===module){const file=process.argv[2];if(!file)throw Error('Usage: node scripts/cruises/validate-catalog.cjs staged-catalog.json');const result=validate(JSON.parse(fs.readFileSync(file,'utf8')));console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
