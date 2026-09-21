const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/placeEvidence.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const compiledExports = {};
const rvExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../lib/rvCategories.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: rvExports, URL });
vm.runInNewContext(compiled, { exports: compiledExports, require: name => name === './rvCategories' ? rvExports : {}, Date, Map, RegExp, Number });
const { buildPlaceEvidence, coreForCategory, unavailablePlaceEvidence, currentEvidenceSignals } = compiledExports;
const now = new Date('2026-09-20T12:00:00Z');
const visit = (id, daysAgo, signals) => ({ reviewId: id, userId: id, visitedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(), signals });
const warning = { slug: 'restaurant_long_wait', label: 'Long Wait for Table', category: 'headsup' };
const food = { slug: 'restaurant_fresh_pasta', label: 'Fresh Pasta', category: 'good' };
const fast = { slug: 'restaurant_short_wait', label: 'Short Wait', category: 'good' };

test('unrelated praise fades an old isolated warning only after five newer independent visits', () => {
  const visits = [visit('old', 210, [warning]), ...[1, 2, 3, 4, 5].map((i) => visit(`new-${i}`, i * 15, [food]))];
  const evidence = buildPlaceEvidence(visits, 'restaurant', now);
  assert.equal(evidence.warnings[0].status, 'faded');
  assert.equal(evidence.warnings[0].directImprovementReports, 0);
  assert.equal(evidence.coreSignals[0].label, 'Fresh Pasta');
});

test('three direct counter reports allow an improved label after six months', () => {
  const visits = [visit('old', 210, [warning]), ...[1, 2, 3, 4, 5].map((i) => visit(`new-${i}`, i * 15, i < 4 ? [fast] : [food]))];
  assert.equal(buildPlaceEvidence(visits, 'restaurant', now).warnings[0].status, 'improved');
});

test('a repeat warning keeps the concern current', () => {
  const visits = [visit('old', 210, [warning]), visit('repeat-1', 22, [warning]), visit('repeat-2', 3, [warning])];
  assert.equal(buildPlaceEvidence(visits, 'restaurant', now).warnings[0].status, 'current');
});

test('one user cannot create five independent visits', () => {
  const visits = [visit('old', 210, [warning]), ...[1, 2, 3, 4, 5].map((i) => ({ ...visit(`new-${i}`, i * 15, [food]), userId: 'same-user' }))];
  assert.equal(buildPlaceEvidence(visits, 'restaurant', now).warnings[0].status, 'unconfirmed');
});

test('serious safety reports do not fade automatically', () => {
  const safety = { slug: 'restaurant_food_safety', label: 'Food Safety Concern', category: 'headsup' };
  const visits = [visit('old', 210, [safety]), ...[1, 2, 3, 4, 5].map(i => visit(`new-${i}`, i * 15, [food]))];
  assert.equal(buildPlaceEvidence(visits, 'restaurant', now).warnings[0].status, 'unconfirmed');
});

test('a hotel sleep concern appears in the core answer', () => {
  const noise = { slug: 'hotel_noisy_room', label: 'Noisy Room', category: 'headsup' };
  const evidence = buildPlaceEvidence([visit('guest-1', 4, [noise]), visit('guest-2', 2, [noise])], 'hotel', now);
  assert.equal(evidence.coreLabel, 'The sleep');
  assert.equal(evidence.coreConcerns[0].label, 'Noisy Room');
});


test('a same-user revisit preserves the original complaint without inflating reporters', () => {
  const original = { ...visit('old-review', 2, [warning]), userId: 'same-user' };
  const newer = { ...visit('new-review', 1, [food]), userId: 'same-user' };
  const evidence = buildPlaceEvidence([original, newer], 'restaurant', now);
  assert.equal(evidence.warnings.length, 1);
  assert.equal(evidence.warnings[0].reports, 1);
  assert.equal(evidence.warnings[0].laterVisits, 0);
  assert.equal(evidence.recentReviewers, 1);
});

test('179/181 day and four/five later-reviewer boundaries preserve the waiting period', () => {
  const newer = [1, 2, 3, 4, 5].map(i => visit(`positive-${i}`, i, [food]));
  assert.equal(buildPlaceEvidence([visit('old',179,[warning]), ...newer], 'restaurant', now).warnings[0].status, 'unconfirmed');
  assert.equal(buildPlaceEvidence([visit('old',181,[warning]), ...newer.slice(0,4)], 'restaurant', now).warnings[0].status, 'unconfirmed');
  assert.equal(buildPlaceEvidence([visit('old',181,[warning]), ...newer], 'restaurant', now).warnings[0].status, 'faded');
});

test('a new recurrence resets the clock even when five earlier positive visits exist', () => {
  const visits = [visit('old',210,[warning]), ...[1,2,3,4,5].map(i => visit(`good-${i}`,i*10,[food])), visit('repeat',1,[warning])];
  const current = buildPlaceEvidence(visits,'restaurant',now).warnings[0];
  assert.equal(current.status,'unconfirmed');
  assert.equal(current.laterVisits,0);
  assert.equal(current.reports,2);
  assert.equal(current.recentReports,1);
});

test('duplicate signals, repeat visits and future reviews cannot multiply account counts', () => {
  const visits = [visit('a',2,[food,food]),{...visit('b',1,[food]),userId:'a'},visit('future',-1,[food])];
  const evidence=buildPlaceEvidence(visits,'restaurant',now);
  assert.equal(evidence.coreSignals[0].reports,1);
  assert.equal(evidence.recentReviewers,1);
});

test('vibe-only, negative-only and stale later reviews do not qualify as improvement evidence', () => {
  const negative={slug:'loud',label:'Loud',category:'headsup'};
  const vibe={slug:'cozy',label:'Cozy',category:'vibe'};
  for(const later of [[negative],[vibe]]) {
    const evidence=buildPlaceEvidence([visit('old',210,[warning]), ...[1,2,3,4,5].map(i=>visit(`new-${i}`,i,later))],'restaurant',now);
    assert.equal(evidence.warnings.find(w=>w.slug===warning.slug).status,'unconfirmed');
  }
  assert.equal(buildPlaceEvidence([visit('old',400,[warning]), ...[1,2,3,4,5].map(i=>visit(`old-positive-${i}`,200+i,[food]))],'restaurant',now).warnings[0].status,'unconfirmed');
});

test('category keys support accents, plurals, underscores and category labels', () => {
  for(const category of ['café','Cafés','Coffee Shops']) assert.equal(coreForCategory(category).label,'The coffee & food');
  for(const category of ['rv_camping','RV Camping','RV Parks']) assert.equal(coreForCategory(category).label,'The campsite');
  for(const category of ['home_services','Home Services','Home-Service']) assert.equal(coreForCategory(category).label,'The work');
  for(const category of ['restaurant','Italian Restaurants','Pizzerias']) assert.equal(coreForCategory(category).label,'The food');
});

test('empty and unavailable are distinct, and search omits faded concerns', () => {
  assert.equal(buildPlaceEvidence([],'restaurant',now).dataStatus,'empty');
  const missing=unavailablePlaceEvidence('restaurant',undefined,now);
  assert.equal(missing.dataStatus,'unavailable');
  assert.equal(currentEvidenceSignals(missing).length,0);
  const evidence=buildPlaceEvidence([visit('old',210,[warning]),...[1,2,3,4,5].map(i=>visit(`new-${i}`,i,[food]))],'restaurant',now);
  assert.equal(currentEvidenceSignals(evidence).some(s=>s.category==='headsup'),false);
});

test('quiet and quick preferences penalize their opposing current reports', () => {
  const source=fs.readFileSync(require('node:path').join(__dirname,'../lib/discoveryEvidence.ts'),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const out={};vm.runInNewContext(js,{exports:out,require:name=>name==='./placeEvidence'?compiledExports:{},Date,Map});
  const quiet={slug:'quiet',label:'Quiet conversation',category:'vibe'};
  const loud={slug:'noisy',label:'Loud music',category:'headsup'};
  const baseline=buildPlaceEvidence([visit('quiet',1,[quiet,food])],'restaurant',now);
  const noisy=buildPlaceEvidence([visit('quiet',1,[quiet,food]),visit('loud',2,[loud]),visit('loud-2',3,[loud])],'restaurant',now);
  assert.ok(out.matchNeed(noisy,'quiet').score<out.matchNeed(baseline,'quiet').score);
  assert.match(out.matchNeed(noisy,'quiet').reason,/Loud music/);
  const speedy=buildPlaceEvidence([visit('quick',1,[fast])],'restaurant',now);
  const slow=buildPlaceEvidence([visit('quick',1,[fast]),visit('slow',2,[warning])],'restaurant',now);
  assert.ok(out.matchNeed(slow,'quick').score<out.matchNeed(speedy,'quick').score);
  assert.match(out.matchNeed(unavailablePlaceEvidence(),'quiet').reason,/unavailable/);
});
