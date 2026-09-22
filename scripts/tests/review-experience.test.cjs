const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function load(file, cache = {}) {
  if (cache[file]) return cache[file];
  const exports = {}; cache[file] = exports;
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => load(path.posix.join(path.posix.dirname(file), name + '.ts'), cache), exports);
  return exports;
}
const { buildPlaceEvidence, coreForCategory } = load('lib/placeEvidence.ts');
const { buildPlaceReviewSummary, compactReviewSections } = load('lib/placeReviewSummary.ts');
const { reviewComposerSections, toggleReviewChoice, visibleReviewChoices } = load('lib/reviewComposer.ts');
const now = new Date('2026-09-22T12:00:00Z');
const signal = (slug, label, category = 'good') => ({ slug, label, category, intensity: 3 });
const visit = (userId, signals, date = '2026-09-20T12:00:00Z', reviewId = userId) => ({ reviewId, userId, visitedAt: date, signals });
test('two comparison rows retain core concerns and independent people, not intensity or repeated visits', () => {
  const food = signal('restaurant_delicious_food', 'Delicious food');
  const cold = signal('restaurant_cold_food', 'Cold food', 'headsup');
  const evidence = buildPlaceEvidence([visit('one', [food, cold, signal('friendly', 'Friendly staff')]), visit('one', [food], undefined, 'repeat'), visit('two', [food, signal('slow_service', 'Slow service', 'headsup')])], 'restaurant', now);
  const summary = buildPlaceReviewSummary(evidence, 'restaurant'), rows = compactReviewSections(summary);
  assert.equal(summary.recentReviewers, 2); assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].topics.map(t => [t.label, t.count]), [['Delicious food', 2], ['Cold food', 1]]);
  assert.equal(rows[1].topics[0].label, 'Slow service');
  assert.equal(evidence.aspectSupport.food.positive, 2); assert.equal(evidence.aspectSupport.food.respondents, 2);
});
test('multiple positive tags from one person count once toward an aspect', () => {
  const evidence = buildPlaceEvidence([visit('one', [signal('food', 'Great food'), signal('fresh', 'Fresh ingredients'), signal('pasta', 'Great pasta')])], 'restaurant', now);
  assert.deepEqual(evidence.aspectSupport.food, { positive: 1, concerns: 0, respondents: 1 });
});
test('an old concern is explicitly historical and cannot silently borrow a recent count', () => {
  const evidence = buildPlaceEvidence([visit('old', [signal('unsafe', 'Unsafe access', 'headsup')], '2025-01-01T00:00:00Z')], 'park', now);
  const concern = buildPlaceReviewSummary(evidence, 'park').sections.find(s => s.key === 'headsup').topics[0];
  assert.equal(concern.older, true); assert.equal(concern.count, 1); assert.equal(concern.lastReportedAt, '2025-01-01T00:00:00Z');
  assert.equal(evidence.recentReviewers, 0);
});
test('missing and empty evidence do not manufacture good or negative reports', () => {
  for (const status of ['unavailable', 'empty', 'loading']) {
    const summary = buildPlaceReviewSummary(null, 'hotel', status);
    assert(summary.sections.every(section => section.topics.length === 0));
    assert.equal(summary.coreLabel, 'The sleep');
  }
});
test('core wording adapts across place types and hotel quiet reports can support sleep', () => {
  for (const [subject, expected] of [['restaurant', 'The food'], ['hotel', 'The sleep'], ['cruise_ship', 'The onboard experience'], ['realtor', 'The real estate service'], ['pets', 'The pet care'], ['restroom', 'The facilities'], [{category:'rv_camping',subcategory:'dump_station'}, 'The dump stop']]) assert.equal(coreForCategory(subject).label, expected);
  const hotel = buildPlaceEvidence([visit('one', [signal('quiet_rooms', 'Quiet rooms', 'vibe')])], 'hotel', now);
  assert.equal(hotel.coreSignals[0].reports, 1);
});
test('first review choices balance praise and concerns; all options remain reachable', () => {
  const signals = Array.from({ length: 12 }, (_, i) => ({ id: String(i), slug: `food_${i}`, label: `${i < 6 ? 'Delicious food' : 'Cold food'} ${i}`, signal_type: i < 6 ? 'best_for' : 'heads_up' }));
  const section = reviewComposerSections(signals, 'restaurant')[0];
  const shown = visibleReviewChoices(section, {}, false, 8);
  assert.equal(shown.filter(s => s.signal_type === 'heads_up').length, 4);
  assert.equal(visibleReviewChoices(section, {}, true).length, 12);
  assert(visibleReviewChoices(section, { '11': 3 }, false).some(s => s.id === '11'));
  assert.equal(reviewComposerSections(signals, 'restaurant', 'cold food')[0].signals.length, 6);
});
test('tap again removes directly and changing another word preserves saved emphasis', () => {
  assert.deepEqual(toggleReviewChoice({saved:3}, 'new'), { saved:3, new:1 });
  assert.deepEqual(toggleReviewChoice({saved:3, new:1}, 'new'), { saved:3 });
  assert.deepEqual(toggleReviewChoice({saved:3}, 'saved'), {});
});
test('older mobile/API summaries remain compatible without inventing people', () => {
  const rows = compactReviewSections({status:'ready',recentReviewers:3,tiles:[{key:'main',title:'The Main Thing',detail:'The food: Fresh pasta',count:2},{key:'headsup',title:'Heads Up',detail:'Slow service',count:1}]});
  assert.equal(rows[0].title, 'The food'); assert.equal(rows[0].topics[0].label, 'Fresh pasta');
  assert.equal(rows[1].topics[0].count, 1);
});

test('old core concerns retain their date and cannot look like recent food reports', () => {
  const evidence = buildPlaceEvidence([visit('old', [signal('cold_food', 'Cold food', 'headsup')], '2025-01-01T00:00:00Z')], 'restaurant', now);
  const core = compactReviewSections(buildPlaceReviewSummary(evidence, 'restaurant'))[0];
  assert.equal(core.topics[0].older, true);
  assert.equal(core.topics[0].lastReportedAt, '2025-01-01T00:00:00Z');
});
