const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const id = '611d15f7e0cf46e3ca6db6b0';
const source = fs.readFileSync(path.join(__dirname, '../pages/api/place/[id].ts'), 'utf8');

async function request(indexed) {
  const calls = [];
  const client = {
    from(table) {
      calls.push(table);
      assert.equal(table, 'fsq_places_raw');
      const chain = {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null, error: null }; },
      };
      return chain;
    },
  };
  const module = { exports: {} };
  const dependencies = {
    '@supabase/supabase-js': { createClient: () => client },
    '../../../lib/placeEvidenceService': {},
    '../../../lib/contentSafetyServer': { contentViewer: async () => ({ client }) },
    '../../../lib/placeHours': {},
    '../../../lib/cruises/venueContext': {},
    '../../../lib/typesenseService': { getPlaceById: async raw => {
      assert.equal(raw, id);
      return indexed;
    } },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module, exports: module.exports, process: { env: {} }, console, require(name) {
      assert.ok(name in dependencies, `Unexpected import ${name}`);
      return dependencies[name];
    } });
  const response = { setHeader() {}, status(status) { this.statusCode = status; return this; }, json(body) { this.body = body; return this; } };
  await module.exports.default({ query: { id: `fsq:${id}` } }, response);
  return { response, calls };
}

test('search-index result opens when the older raw FSQ row is absent', async () => {
  const { response, calls } = await request({ fsq_place_id: id, name: 'Immigration Desk', category: 'Government', locality: 'Boston' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.place.id, `fsq:${id}`);
  assert.equal(response.body.place.name, 'Immigration Desk');
  assert.equal(response.body.place.city, 'Boston');
  assert.deepEqual(calls, ['fsq_places_raw']);
});

test('a mismatched search document cannot become the requested place', async () => {
  const { response } = await request({ fsq_place_id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Wrong place' });
  assert.equal(response.statusCode, 404);
});
