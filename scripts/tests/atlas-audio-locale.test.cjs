const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const i18next = require('i18next');
const root = path.resolve(__dirname, '../..');
const web = fs.existsSync(path.join(root, 'public/locales/en/common.json'));
const ns = web ? 'common' : 'translation';
let context;
const maps = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(root, 'lib/releaseCopy.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(maps);
const hook = {};
new Function('require', 'exports', ts.transpileModule(fs.readFileSync(path.join(root, 'hooks/useReleaseCopy.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(name => {
  if (name === '../lib/releaseCopy') return maps;
  if (['next-i18next', 'react-i18next'].includes(name)) return { useTranslation: () => context };
  throw new Error('Unexpected import ' + name);
}, hook);

test('actual Atlas copy hook resolves every audio label and keeps voice identities distinct', async () => {
  const resources = Object.fromEntries(['en', 'pt', 'es'].map(lang => [lang, { [ns]: JSON.parse(fs.readFileSync(path.join(root, web ? 'public/locales' : 'i18n/locales', lang, web ? 'common.json' : 'translation.json'), 'utf8')) }]));
  const entries = Object.entries(maps.RELEASE_COPY_KEYS).filter(([, key]) => ['atlasListen','atlasUnavailable','atlasFemale','atlasMale','atlasPlay','atlasPause','atlasPosition','atlasBack','atlasSpeed','atlasForward','atlasPlayError'].includes(key));
  assert.equal(entries.length, 11);
  for (const lang of ['en', 'pt', 'es']) {
    const i18n = i18next.createInstance();
    await i18n.init({ lng: lang, fallbackLng: 'en', defaultNS: ns, resources });
    context = { t: i18n.t.bind(i18n), i18n };
    const copy = hook.useReleaseCopy();
    for (const [text, key] of entries) assert.equal(copy(text), resources[lang][ns].release[key]);
    assert.notEqual(copy('Female'), copy('Male'));
    assert.notEqual(copy('Play'), copy('Pause'));
    assert.equal(copy('female'), 'female', 'internal voice ID is not localized');
    assert.equal(copy('male'), 'male', 'internal voice ID is not localized');
  }
});
