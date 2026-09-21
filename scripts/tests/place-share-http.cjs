// Requests actual Next.js initial HTML as a crawler: no browser or JavaScript execution.
// Fixture files may contain read-only public records or explicitly synthetic local QA records.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = process.env.PLACE_SHARE_HTTP_BASE || 'http://127.0.0.1:3048';
const records = JSON.parse(fs.readFileSync(process.env.PLACE_SHARE_FIXTURES || '/private/tmp/tavvy-share-fixtures.json', 'utf8')).rows;
const missing = JSON.parse(fs.readFileSync(process.env.PLACE_SHARE_NO_PHOTO || '/private/tmp/tavvy-share-missing-photo-fixture.json', 'utf8')).rows[0];
const output = process.env.PLACE_SHARE_HTTP_OUTPUT || '/private/tmp/tavvy-place-share-http';
const storageOrigin = process.env.PLACE_SHARE_TRUSTED_ORIGIN || 'https://scasgwrikoqdwlwlwcff.supabase.co';
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
function metadata(html, key) { return [...html.matchAll(/<meta\b[^>]*>/g)].filter(([tag]) => tag.includes(`property="${key}"`) || tag.includes(`name="${key}"`)).map(([tag]) => decode(tag.match(/content="([^"]*)"/)?.[1] || '')); }
async function page(route) { const response = await fetch(base + route, { headers: { 'user-agent': 'facebookexternalhit/1.1' } }); assert.equal(response.status, 200, route); return { html: await response.text(), response }; }
function generatedPhoto(record) {
  if (!record.cover_image_url) return true;
  const url = new URL(record.cover_image_url, 'https://tavvy.com');
  return url.href === 'https://tavvy.com/images/demo-trattoria/dining-room.jpg' || (url.protocol === 'https:' && url.origin === storageOrigin && url.pathname.startsWith('/storage/v1/object/public/') && /\.(?:png|jpe?g)$/i.test(url.pathname) && !url.search && !url.hash && !url.pathname.includes('%'));
}
function generatedUrl(value, id) {
  const url = new URL(value); assert.equal(url.origin, 'https://tavvy.com'); assert.equal(url.pathname, '/api/og/place/' + encodeURIComponent(id)); assert.match(url.search, /^\?v=2-[a-f0-9]+$/);
}
async function png(route, filename) {
  const response = await fetch(base + route); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /image\/png/);
  const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.subarray(1, 4).toString(), 'PNG'); assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 630); fs.writeFileSync(path.join(output, filename), bytes);
  const head = await fetch(base + route, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0); assert.equal(head.headers.get('etag'), response.headers.get('etag'));
  const cached = await fetch(base + route, { headers: { 'if-none-match': response.headers.get('etag') } }); assert.equal(cached.status, 304);
  return bytes.length;
}
(async () => {
  fs.mkdirSync(output, { recursive: true }); assert.ok(records.length >= 2, 'need two distinct place fixtures'); assert.ok(missing, 'need photo-free fixture');
  for (const record of records) {
    const { html } = await page('/app/place/' + record.id + '?tab=media');
    assert.deepEqual(metadata(html, 'og:title'), [`${record.name} — Tavvy`]); assert.deepEqual(metadata(html, 'og:url'), [`https://tavvy.com/app/place/${record.id}`]);
    assert.equal(metadata(html, 'og:image').length, 1); assert.deepEqual(metadata(html, 'twitter:image'), metadata(html, 'og:image')); assert.deepEqual(metadata(html, 'twitter:card'), ['summary_large_image']);
    if (generatedPhoto(record)) { generatedUrl(metadata(html, 'og:image')[0], record.id); assert.deepEqual(metadata(html, 'og:image:width'), ['1200']); }
    else { assert.deepEqual(metadata(html, 'og:image'), [record.cover_image_url]); assert.equal(metadata(html, 'og:image:width').length, 0, 'unknown external photo dimensions'); }
    assert.equal(metadata(html, 'og:description').length, 1); assert.ok(metadata(html, 'og:description')[0].includes(record.city));
    for (const expected of [record.expected_category, record.expected_subcategory].filter(Boolean)) assert.ok(metadata(html, 'og:description')[0].includes(expected));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://tavvy.com/app/place/${record.id}"`));
  }
  const { html: alias } = await page('/app/place/' + encodeURIComponent('tavvy:' + records[0].id)); assert.deepEqual(metadata(alias, 'og:url'), [`https://tavvy.com/app/place/${records[0].id}`]);
  const { html: legacy } = await page('/place/' + records[0].id); assert.deepEqual(metadata(legacy, 'og:title'), [`${records[0].name} — Tavvy`]);
  const { html: demo } = await page('/app/demo/restaurant'); assert.deepEqual(metadata(demo, 'og:title'), ['Trattoria Tavvy — Tavvy']); generatedUrl(metadata(demo, 'og:image')[0], 'demo-trattoria'); assert.match(metadata(demo, 'og:description')[0], /sample/);
  const demoUrl = new URL(metadata(demo, 'og:image')[0]); const demoBytes = await png(demoUrl.pathname + demoUrl.search, 'demo-http.png');
  const { html: fallback } = await page('/app/place/' + missing.id); assert.deepEqual(metadata(fallback, 'og:title'), [`${missing.name} — Tavvy`]); generatedUrl(metadata(fallback, 'og:image')[0], missing.id); assert.deepEqual(metadata(fallback, 'og:image:width'), ['1200']);
  const fallbackUrl = new URL(metadata(fallback, 'og:image')[0]); const fallbackBytes = await png(fallbackUrl.pathname + fallbackUrl.search, 'fallback-http.png');
  const noPlace = await fetch(base + '/app/place/nonexistent-tavvy-share-test'); assert.equal(noPlace.status, 404);
  const missingImage = await fetch(base + '/api/og/place/nonexistent-tavvy-share-test'); assert.equal(missingImage.status, 404); assert.equal(missingImage.headers.get('cache-control'), 'no-store');
  const result = { passed: true, checks: ['distinct place title/category/subcategory/location/canonical in initial HTML', 'single OG/Twitter image metadata', 'external photo preservation', 'Tavvy alias and legacy redirect', 'demo photograph composited with metadata', 'missing-photo 1200×630 PNG', 'GET/HEAD/ETag304', '404 missing place and image; errors not cached'], places: records.map(({ id, name }) => ({ id, name })), imageBytes: { demo: demoBytes, fallback: fallbackBytes }, fixtureMode: process.env.PLACE_SHARE_FIXTURE_MODE || 'public-read-only' };
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
