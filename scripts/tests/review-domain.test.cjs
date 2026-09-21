const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts'))), exports);
  return exports;
}
const e = load('lib/placeEvidence.ts');
const summary = load('lib/placeReviewSummary.ts');
const now = new Date('2026-09-21T12:00:00Z');
const visit = signals => ({ reviewId: 'visit', userId: 'person', visitedAt: '2026-09-01', signals });
const tap = (slug, label, category = 'good') => ({ slug, label, category });

test('subcategory distinguishes dump stops, overnight stays and provider national parks', () => {
  assert.equal(e.coreForCategory('RV Resort').label, 'The campsite');
  assert.equal(e.coreForCategory('RV & Camping').label, 'The campsite');
  assert.equal(e.coreForCategory({ category: 'rv_camping', subcategory: 'dump_station' }).label, 'The dump stop');
  assert.equal(e.coreForCategory({ category: 'rv_camping', subcategory: 'boondocking' }).label, 'The overnight stay');
  assert.equal(e.coreForCategory({ category: 'attraction', subcategory: '[Landmarks and Outdoors > Park > National Park]' }).label, 'The outdoor experience');
  assert.equal(e.coreForCategory({ category: 'restaurant', subcategory: 'Italian' }).label, 'The food');
  assert.equal(e.coreForCategory('Beach Bar').label, 'The drinks');
});

test('site evidence uses core tap IDs and keeps conveniences in The Good', () => {
  const subject = { category: 'rv_camping', subcategory: 'rv_resort' };
  const result = e.buildPlaceEvidence([visit([tap('rv_level_sites', 'Level Sites'), tap('rv_camp_store', 'Camp Store'), tap('rv_potable_water', 'Potable Water Fill'), tap('rv_heads_up_tight_sites', 'Tight Sites', 'headsup')])], subject, now);
  assert.deepEqual(result.coreSignals.map(s => s.slug), ['rv_level_sites']);
  assert.equal(result.coreConcerns[0].slug, 'rv_heads_up_tight_sites');
  assert.deepEqual(e.secondaryGoodSignals(result, subject).map(s => s.slug).sort(), ['rv_camp_store', 'rv_potable_water']);
  assert.equal(e.isCoreSignal(subject, tap('rv_level_sites', 'Nivellierte Stellplätze')), true, 'translated labels keep the same classification');
});

test('dump convenience water is not inferred potable and hookups do not define boondocking', () => {
  const dump = e.buildPlaceEvidence([visit([tap('dump_easy_access', 'Easy Access'), tap('dump_water_available', 'Water Available')])], 'dump_station', now);
  assert.deepEqual(dump.coreSignals.map(s => s.slug), ['dump_easy_access']);
  assert.equal(e.isCoreSignal('boondocking', tap('rv_full_hookups', 'Full Hookups')), false);
  assert.equal(e.isCoreSignal('overnight_parking', tap('rv_quiet_nights', 'Quiet Nights')), true);
  assert.equal(e.isCoreSignal('overnight_parking', tap('rv_overnight_parking', 'Overnight Parking OK')), false, 'a guest tap does not establish current parking permission');
});

test('rides are attractions and restaurant food cannot become their core experience', () => {
  assert.equal(e.coreForCategory('Rides').label, 'The ride experience');
  assert.equal(e.isCoreSignal('Rides', tap('tp_smooth_ride', 'Smooth Ride')), true);
  assert.equal(e.isCoreSignal('Rides', tap('tp_great_food', 'Great Park Food')), false);
  assert.equal(e.isCoreSignal('Rides', tap('tp_short_wait', 'Short Wait')), false);
  assert.equal(e.isCoreSignal('theme_park', tap('tp_great_shows', 'Great Shows')), true);
});

test('summary has four distinct tiles with domain style and honest empty/error states', () => {
  const empty = e.buildPlaceEvidence([], 'realtor', now);
  const value = summary.buildPlaceReviewSummary(empty, 'realtor');
  assert.deepEqual(value.tiles.map(t => t.key), ['main', 'good', 'vibe', 'headsup']);
  assert.equal(value.tiles[2].title, 'Their Style');
  assert.equal(value.tiles.every(t => t.count === undefined), true);
  assert.equal(value.tiles[3].note, 'More recent reviews needed');
  const failed = summary.buildPlaceReviewSummary(e.unavailablePlaceEvidence('realtor'), 'realtor');
  assert.equal(failed.tiles[1].detail, 'Recent reviews unavailable');
});

test('aging needs independent later positive reports, never silence or a label change', () => {
  const old = { ...visit([tap('rv_noisy', 'Noisy', 'headsup')]), visitedAt: '2025-12-01' };
  const later = Array.from({ length: 5 }, (_, i) => ({ ...visit([tap('rv_level_sites', 'Level Sites')]), userId: 'later-' + i, reviewId: 'later-' + i }));
  assert.equal(e.buildPlaceEvidence([old], 'rv_camping', now).warnings[0].status, 'unconfirmed');
  assert.equal(e.buildPlaceEvidence([old, ...later], 'rv_camping', now).warnings[0].status, 'faded');
  assert.equal(e.buildPlaceEvidence([old, ...later, { ...visit([tap('rv_noisy', 'Still noisy', 'headsup')]), userId: 'repeat', reviewId: 'repeat' }], 'rv_camping', now).warnings[0].status, 'unconfirmed');
});


test('one shared summary keeps main/secondary signals distinct and concerns alongside positive evidence', () => {
  const subject = { category: 'rv_camping', subcategory: 'rv_resort' };
  const evidence = e.buildPlaceEvidence([visit([tap('rv_level_sites', 'Level Sites'), tap('rv_camp_store', 'Camp Store'), tap('rv_heads_up_tight_sites', 'Tight Sites', 'headsup')])], subject, now);
  const value = summary.buildPlaceReviewSummary(evidence, subject);
  assert.match(value.tiles[0].detail, /Level Sites/);
  assert.equal(value.tiles[0].note, 'Recent concerns reported');
  assert.equal(value.tiles[1].detail, 'Camp Store');
  assert.equal(value.tiles[3].detail, 'Tight Sites');
  for (const state of ['loading', 'unavailable']) {
    const unavailable = summary.buildPlaceReviewSummary(evidence, subject, state);
    assert.equal(unavailable.tiles.every(tile => tile.count === undefined), true);
    assert.equal(unavailable.tiles.some(tile => /Level Sites|Camp Store|Tight Sites/.test(tile.detail)), false);
  }
});


test('mobile businesses keep their actual service domain alongside cruise ships', () => {
  for (const category of ['Food Trucks','food_truck','Catering','Ice Cream']) assert.equal(e.coreForCategory(category).label, 'The food');
  for (const [category, label] of [['Mobile Coffee','The coffee & food'], ['Mobile Pet Grooming','The pet care'], ['Mobile Barber','The result'], ['Mobile Mechanic','The service'], ['cruise_ship','The onboard experience']]) assert.equal(e.coreForCategory(category).label, label);
});
