const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const renderRoot = process.env.PLACE_SHARE_RENDER_ROOT || path.resolve(require.resolve('next/package.json'), '../../..');
function load(file, overrides = {}, cache = new Map()) {
  const absolute = path.resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  cache.set(absolute, exports);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', js)(name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(absolute), name);
      return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx', overrides, cache);
    }
    return require(name);
  }, exports);
  return exports;
}
const metadata = load('lib/placeShareMetadata.ts');
const photo = load('lib/placeSharePhoto.ts');
const image = load('lib/placeShareImage.ts');
const storage = 'https://scasgwrikoqdwlwlwcff.supabase.co';
const trusted = storage + '/storage/v1/object/public/place-photos/qa.jpg';
const id = '77000500-0000-4000-8000-000000000001';
const record = { id, name: 'Harbor Table', tavvy_category: 'restaurant', tavvy_subcategory: 'Italian Restaurant', city: 'Boston', region: 'MA' };
const sample = metadata.buildPlaceShareMetadata(record);
const jpeg = fs.readFileSync(path.join(root, 'public/images/demo-trattoria/dining-room.jpg'));
const tiny = new (require('@resvg/resvg-js').Resvg)('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="red"/></svg>').render().asPng();

test('taxonomy keeps explicit category and qualifier without repeating equivalent labels', () => {
  assert.deepEqual(metadata.placeShareCategories(record), { category: 'Restaurant', subcategory: 'Italian' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_category: 'restaurants', tavvy_subcategory: 'Restaurant' }), { category: 'Restaurant', subcategory: '' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_category: 'cafe', tavvy_subcategory: 'Café' }), { category: 'Café', subcategory: '' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_category: 'rv_camping', tavvy_subcategory: 'rv_park' }), { category: 'RV & Camping', subcategory: 'RV Park' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_subcategory: 'Campground' }), { category: 'Campground', subcategory: '' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_category: '飲食店', tavvy_subcategory: '和食' }), { category: '飲食店', subcategory: '和食' });
  assert.deepEqual(metadata.placeShareCategories({ tavvy_category: 'Food (local)', tavvy_subcategory: 'Italian Food (local)' }), { category: 'Food (local)', subcategory: 'Italian' });
});

test('canonical metadata includes taxonomy/location and versions every visual input', () => {
  assert.equal(sample.url, 'https://tavvy.com/app/place/' + id);
  assert.equal(metadata.buildPlaceShareMetadata({ ...record, id: 'tavvy:' + id }).image, sample.image);
  assert.match(sample.description, /Restaurant · Italian · Boston, MA/);
  assert.match(sample.image, /\?v=2-[a-f0-9]+$/);
  for (const change of [{ name: 'New name' }, { tavvy_category: 'cafe' }, { tavvy_subcategory: 'Sicilian' }, { city: 'Cambridge' }, { region: 'Massachusetts' }, { cover_image_url: trusted }]) {
    assert.notEqual(metadata.buildPlaceShareMetadata({ ...record, ...change }).imageVersion, sample.imageVersion);
  }
  assert.notEqual(metadata.buildPlaceShareMetadata({ ...record, name: 'Place 😀' }).imageVersion, metadata.buildPlaceShareMetadata({ ...record, name: 'Place 😁' }).imageVersion);
  assert.equal(metadata.DEMO_PLACE_SHARE.generatedImage, true);
  assert.equal(metadata.DEMO_PLACE_SHARE.url, 'https://tavvy.com/app/demo/restaurant');
  const external = metadata.buildPlaceShareMetadata({ ...record, cover_image_url: 'https://images.example.com/real-photo.jpg' });
  assert.equal(external.image, 'https://images.example.com/real-photo.jpg');
  assert.equal(external.generatedImage, false);
});

test('server photo allowlist rejects external origins, credentials, ports, redirects, signed and encoded paths', () => {
  assert.deepEqual(photo.compositePlacePhotoSource(trusted, storage), { kind: 'storage', url: trusted });
  assert.deepEqual(photo.compositePlacePhotoSource('/images/demo-trattoria/dining-room.jpg', storage), { kind: 'local', path: 'images/demo-trattoria/dining-room.jpg' });
  for (const value of ['https://example.com/photo.jpg', storage.replace('.co', '.co.attacker.test') + '/storage/v1/object/public/a.jpg', 'http://127.0.0.1/a.jpg', 'https://169.254.169.254/a.jpg', storage.replace('https://', 'https://user:pass@') + '/storage/v1/object/public/a.jpg', storage + ':444/storage/v1/object/public/a.jpg', storage + '/storage/v1/object/sign/a.jpg', trusted + '?redirect=https://example.com', trusted + '#fragment', storage + '/storage/v1/object/public/%2Fetc.jpg', storage + '/storage/v1/object/public/a.svg', '/images/demo-trattoria/dining-room.jpg#fragment', '/images/demo-trattoria/../other.jpg']) {
    assert.equal(photo.compositePlacePhotoSource(value, storage), null, value);
  }
});

test('raster validation bounds bytes, decoded dimensions and supported formats', () => {
  assert.equal(image.checkedShareRaster(jpeg).mime, 'image/jpeg');
  assert.equal(image.checkedShareRaster(tiny).mime, 'image/png');
  for (const invalid of [Buffer.from('<svg onload="alert(1)"></svg>'), Buffer.alloc(4 * 1024 * 1024 + 1), Buffer.from([255, 216, 255, 192, 0, 1]), Buffer.alloc(30)]) assert.equal(image.checkedShareRaster(invalid), null);
  for (const [width, height] of [[0, 6], [9000, 6], [5000, 5000]]) {
    const invalid = Buffer.from(tiny); invalid.writeUInt32BE(width, 16); invalid.writeUInt32BE(height, 20);
    assert.equal(image.checkedShareRaster(invalid), null);
  }
});

test('photo fetch is bounded, sends no credentials, never follows redirects and falls back on failures', async () => {
  let calls = 0;
  const fetcher = async (url, options) => { calls++; assert.equal(url, trusted); assert.equal(options.redirect, 'manual'); assert.equal(options.credentials, undefined); assert.equal(Object.keys(options.headers).length, 1); return new Response(tiny, { headers: { 'content-type': 'image/png' } }); };
  assert.equal((await image.loadPlaceSharePhoto(trusted, { fetcher, storageOrigin: storage })).mime, 'image/png');
  assert.equal(await image.loadPlaceSharePhoto('https://example.com/a.jpg', { fetcher, storageOrigin: storage }), null);
  assert.equal(calls, 1);
  for (const response of [new Response(null, { status: 302, headers: { location: 'https://example.com/a.jpg' } }), new Response(tiny, { headers: { 'content-type': 'text/html' } }), new Response(tiny, { headers: { 'content-type': 'image/png', 'content-length': String(4 * 1024 * 1024 + 1) } }), new Response(Buffer.from('<svg/>'), { headers: { 'content-type': 'image/png' } })]) {
    assert.equal(await image.loadPlaceSharePhoto(trusted, { fetcher: async () => response, storageOrigin: storage }), null);
  }
  let cancelled = false;
  const oversized = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); }, cancel() { cancelled = true; } });
  assert.equal(await image.loadPlaceSharePhoto(trusted, { fetcher: async () => new Response(oversized, { headers: { 'content-type': 'image/png' } }), storageOrigin: storage }), null);
  assert.equal(cancelled, true);
  assert.equal(await image.loadPlaceSharePhoto(trusted, { fetcher: async (_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('timeout')))), storageOrigin: storage, timeoutMs: 5 }), null);
  assert.equal(await image.loadPlaceSharePhoto('/images/demo-trattoria/dining-room.jpg', { root: '/missing-qa-root' }), null);
});

test('image escapes text, wraps long names and renders actual 1200×630 PNGs with a required font', () => {
  const escaped = image.buildPlaceShareSvg(metadata.buildPlaceShareMetadata({ ...record, name: '<script>& "Place"', city: 'A&B' }), null);
  assert.ok(!escaped.includes('<script>'));
  assert.match(escaped, /&lt;script&gt;/);
  assert.match(escaped, /A&amp;B/);
  const lines = image.wrapShareText('A'.repeat(300), 900, 80, 3);
  assert.equal(lines.length, 3); assert.ok(lines[2].endsWith('…'));
  const png = image.renderPlaceSharePng(sample, null, renderRoot);
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
  assert.throws(() => image.renderPlaceSharePng(sample, null, '/missing-qa-font'));
});

function clientFor(responses, calls = []) {
  return { from(table) { const call = { table, filters: [] }; calls.push(call); const query = { select(value) { call.select = value; return query; }, eq(...args) { call.filters.push(args); return query; }, limit(value) { call.limit = value; return query; }, order() { return query; }, async abortSignal() { return responses.shift() || { data: [] }; } }; return query; } };
}
test('lookup preserves canonical IDs, uses public fallback photo and distinguishes missing from unavailable', async () => {
  const lookup = load('lib/placeShareLookup.ts'); const calls = [];
  const ready = await lookup.fetchPlaceShareMetadata('tavvy:' + id, { client: clientFor([{ data: [{ ...record, is_active: true, status: 'active' }] }, { data: [{ url: trusted }] }], calls) });
  assert.equal(ready.metadata.id, id); assert.equal(ready.metadata.photoUrl, trusted); assert.equal(ready.metadata.subcategory, 'Italian');
  assert.deepEqual(calls[1].filters, [['place_id', id], ['status', 'live']]);
  assert.equal((await lookup.fetchPlaceShareMetadata(id, { client: clientFor([{ data: [{ ...record, is_active: false }] }]) })).status, 'missing');
  assert.equal((await lookup.fetchPlaceShareMetadata(id, { client: clientFor([{ error: Error('unavailable') }]) })).status, 'unavailable');
  const provider = await lookup.fetchPlaceShareMetadata('fsq-abcdef0123456789abcdef01', { client: clientFor([{ data: [] }, { data: [{ fsq_place_id: 'abcdef0123456789abcdef01', name: 'Provider Place', fsq_category_labels: ['Dining and Drinking > Restaurant > Italian Restaurant'], locality: 'Boston', region: 'MA' }] }]) });
  assert.equal(provider.metadata.id, 'fsq:abcdef0123456789abcdef01'); assert.equal(provider.metadata.category, 'Restaurant'); assert.equal(provider.metadata.subcategory, 'Italian');
});

test('image API sends PNG/ETag, handles HEAD and cache revalidation, and never caches failures', async () => {
  let result = { status: 'ready', metadata: sample }, lookups = 0;
  const handler = load('pages/api/og/place/[id].tsx', { '../../../../lib/placeShareLookup': { fetchPlaceShareMetadata: async () => { lookups++; return result; } }, '../../../../lib/placeShareImage': { loadPlaceSharePhoto: async () => null, renderPlaceSharePng: (data, picture) => image.renderPlaceSharePng(data, picture, renderRoot) } }).default;
  const response = () => ({ statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, status(v) { this.statusCode = v; return this; }, end(v) { this.body = v; }, json(v) { this.body = v; }, send(v) { this.body = v; } });
  let res = response(); await handler({ method: 'POST', query: { id }, headers: {} }, res); assert.equal(res.statusCode, 405); assert.equal(lookups, 0);
  res = response(); await handler({ method: 'GET', query: { id }, headers: {} }, res); assert.equal(res.statusCode, 200); assert.equal(res.headers['content-type'], 'image/png'); const etag = res.headers.etag; assert.ok(Buffer.isBuffer(res.body));
  res = response(); await handler({ method: 'HEAD', query: { id }, headers: {} }, res); assert.equal(res.statusCode, 200); assert.equal(res.body, undefined); assert.equal(res.headers.etag, etag);
  res = response(); await handler({ method: 'GET', query: { id }, headers: { 'if-none-match': etag } }, res); assert.equal(res.statusCode, 304); assert.equal(res.body, undefined);
  for (const status of ['missing', 'unavailable']) { result = { status, metadata: null }; res = response(); await handler({ method: 'GET', query: { id }, headers: {} }, res); assert.equal(res.statusCode, status === 'missing' ? 404 : 503); assert.equal(res.headers['cache-control'], 'no-store'); }
});
