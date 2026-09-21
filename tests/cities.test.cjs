const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../lib/cities.ts'), 'utf8');
function loadTs(file) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('exports', 'module', 'require', code)(mod.exports, mod, name => loadTs(path.join(path.dirname(file), name + '.ts')));
  return mod.exports;
}
const { matchesCity, cityPhotos, loadActiveCities, loadCity, loadCityPlaces, placeBelongsToCity } = loadTs(path.join(__dirname, '../lib/cities.ts'));
function client(results) {
  const calls = [];
  const query = new Proxy({}, { get(_, key) {
    if (key === 'then') return (resolve) => resolve(results.shift());
    return (...args) => { calls.push([key, ...args]); return query; };
  }});
  return { from: (...args) => { calls.push(['from', ...args]); return query; }, calls };
}
test('search includes state/country and ignores outer whitespace', () => {
  assert.ok(matchesCity({ name: 'Orlando', state: 'FL', country: 'US' }, ' fl '));
  assert.ok(matchesCity({ name: 'Orlando', country: 'US' }, 'us'));
  assert.equal(matchesCity({ name: 'Orlando' }, 'Miami'), false);
});
test('gallery handles URL objects, rejects invalid entries, and deduplicates cover', () => {
  assert.deepEqual(cityPhotos({ cover_image_url: 'https://x/a', gallery_images: ['https://x/a', { url: 'https://x/b' }, null, 4, 'javascript:bad'] }), ['https://x/a', 'https://x/b']);
});
test('browse reads all pages of active cities in stable order', async () => {
  const db = client([{ data: Array.from({ length: 500 }, (_, i) => ({ id: i })) }, { data: [{ id: 500 }] }]);
  assert.equal((await loadActiveCities(db)).length, 501);
  assert.ok(db.calls.some(c => c[0] === 'eq' && c[1] === 'is_active' && c[2] === true));
  assert.deepEqual(db.calls.filter(c => c[0] === 'range'), [['range', 0, 499], ['range', 500, 999]]);
});
test('missing and failed cities remain distinct; slug never filters UUID id', async () => {
  const db = client([{ data: null }]);
  assert.equal(await loadCity(db, 'missing-city'), null);
  assert.ok(db.calls.some(c => c[0] === 'eq' && c[1] === 'slug'));
  await assert.rejects(loadCity(client([{ error: new Error('offline') }]), 'missing-city'), /offline/);
});
test('places escape wildcard names and propagate failures', async () => {
  const db = client([{ data: [] }]);
  assert.deepEqual(await loadCityPlaces(db, { name: 'Test%_City', state: 'FL', country: 'US' }), []);
  assert.deepEqual(db.calls.filter(c => c[0] === 'ilike'), [['ilike', 'city', 'Test\\%\\_City']]);
  await assert.rejects(loadCityPlaces(client([{ error: new Error('denied') }]), { name: 'Orlando' }), /denied/);
});
test('mobile and web city query contracts remain identical', () => {
  assert.equal(fs.readFileSync(path.join(__dirname, '../../tavvy-mobile/lib/cities.ts'), 'utf8'), source);
});

test('real imported locations match full-name and ISO countries without continent-as-state filtering', () => {
  const amsterdam = { name: 'Amsterdam', country: 'Netherlands', state: 'North Holland', region: 'Europe', latitude: 52.37, longitude: 4.90 };
  for (const region of ['Noord-Holland', 'North Holland', null, 'Netherlands']) assert.ok(placeBelongsToCity({ country: 'NL', region }, amsterdam));
  assert.equal(placeBelongsToCity({ country: 'US', region: 'New York' }, amsterdam), false);
  assert.equal(placeBelongsToCity({ country: 'US', region: 'GA' }, { name: 'Athens', country: 'Greece' }), false);
  assert.ok(placeBelongsToCity({ country: 'US', region: 'GA' }, { name: 'Atlanta', country: 'United States' }));
  assert.equal(placeBelongsToCity({ country: 'NL', latitude: 50, longitude: 6 }, amsterdam), false);
});
