// Local visual fixtures only: never inserts places, publishes media, or fetches remote photos.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const renderRoot = process.env.PLACE_SHARE_RENDER_ROOT || path.resolve(require.resolve('next/package.json'), '../../..');
const output = process.env.PLACE_SHARE_RENDER_OUTPUT || '/private/tmp/tavvy-place-share-og-20260920';
const cache = new Map();
function load(file) {
  const absolute = path.resolve(root, file); if (cache.has(absolute)) return cache.get(absolute);
  const exports = {}; cache.set(absolute, exports);
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', js)(name => name.startsWith('.') ? load(path.resolve(path.dirname(absolute), name + '.ts')) : require(name), exports); return exports;
}
const { buildPlaceShareMetadata, DEMO_PLACE_SHARE } = load('lib/placeShareMetadata.ts');
const { renderPlaceSharePng, loadPlaceSharePhoto, buildPlaceShareSvg } = load('lib/placeShareImage.ts');
const fixtures = [
  ['demo-restaurant', DEMO_PLACE_SHARE],
  ['restaurant-no-photo', buildPlaceShareMetadata({ id: 'qa-restaurant', name: 'Harbor Table', tavvy_category: 'restaurant', tavvy_subcategory: 'Italian Restaurant', city: 'Boston', region: 'MA' })],
  ['rv-no-photo', buildPlaceShareMetadata({ id: 'qa-rv', name: 'Pine & Shore RV Resort', tavvy_category: 'rv_camping', tavvy_subcategory: 'rv_park', city: 'Orlando', region: 'Florida' })],
  ['long-name', buildPlaceShareMetadata({ id: 'qa-long-name', name: 'The Conservatory at Willow Creek — Kitchen, Bakery & Wine Bar', tavvy_category: 'restaurant', tavvy_subcategory: 'Contemporary American Restaurant', city: 'Charleston', region: 'South Carolina' })],
];
(async () => {
  fs.mkdirSync(output, { recursive: true }); const results = [];
  for (const [name, metadata] of fixtures) {
    const photo = metadata.id === 'demo-trattoria' ? await loadPlaceSharePhoto(metadata.photoUrl, { root }) : null;
    const png = renderPlaceSharePng(metadata, photo, renderRoot);
    if (name === 'demo-restaurant' && !photo) throw Error('Demo photo missing');
    fs.writeFileSync(path.join(output, name + '.png'), png);
    fs.writeFileSync(path.join(output, name + '.svg'), buildPlaceShareSvg(metadata, photo));
    results.push({ name, syntheticQaFixture: metadata.id !== 'demo-trattoria', demo: metadata.id === 'demo-trattoria', place: metadata.name, category: metadata.category, subcategory: metadata.subcategory, photoComposited: Boolean(photo), width: png.readUInt32BE(16), height: png.readUInt32BE(20), bytes: png.length, file: path.join(output, name + '.png') });
  }
  fs.writeFileSync(path.join(output, 'render-result.json'), JSON.stringify({ passed: true, fixtures: results }, null, 2));
  console.log(JSON.stringify({ passed: true, fixtures: results }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
