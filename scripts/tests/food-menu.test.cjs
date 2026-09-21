const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../../lib/foodMenu.ts'), 'utf8');
function service(rpc) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: () => ({ supabase: { rpc } }), Error });
  return exports.searchFoodMenus;
}
test('browse includes all existing menus without inventing classifications', async () => {
  const search = service(async (name, args) => {
    assert.equal(name, 'search_food_menus');
    assert.equal(args.search_text, ''); assert.equal(args.location_text, '');
    assert.equal(args.center_lat, null); assert.equal(args.universe_filter, null);
    return { data: [{ id: 'dish', item_name: 'The Big Surprise', dish_type: null }], error: null };
  });
  const rows = await search({});
  assert.equal(rows[0].dish_type, null);
});
test('search preserves zero coordinates, chosen radius, universe, and page offset', async () => {
  const search = service(async (_, args) => {
    assert.equal(args.search_text, 'chicken parmesan');
    assert.equal(args.center_lat, 0); assert.equal(args.center_lon, 0);
    assert.equal(args.radius_km, 10); assert.equal(args.page_offset, 30);
    assert.equal(args.universe_filter, 'universe');
    return { data: [], error: null };
  });
  await search({ query: ' chicken parmesan ', latitude: 0, longitude: 0, radiusKm: 10, universeId: 'universe', offset: 30 });
});
test('service/schema failures never masquerade as zero dishes', async () => {
  const search = service(async () => ({ data: null, error: { message: 'missing function' } }));
  await assert.rejects(search({ query: 'tacos' }), /temporarily unavailable/);
});
test('web and mobile share exactly the same query contract', () => {
  assert.equal(source, fs.readFileSync(path.join(__dirname, '../../../tavvy-mobile/lib/foodMenu.ts'), 'utf8'));
});
