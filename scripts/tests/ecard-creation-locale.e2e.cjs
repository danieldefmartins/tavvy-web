/** Local mocked browser only. No remote mutations or real user data. */
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const base = process.env.TAVVY_ECARD_BASE || 'http://127.0.0.1:3841';
const out = process.env.TAVVY_ECARD_QA || '/private/tmp/tavvy-web-locale-browser';
const maps = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(root, 'lib/releaseCopy.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(maps);
const catalogs = Object.fromEntries(['en','pt','es'].map(lang => [lang, JSON.parse(fs.readFileSync(path.join(root, 'public/locales', lang, 'common.json'), 'utf8'))]));
function copy(lang, text) {
  if (lang === 'en') return text;
  const key = maps.RELEASE_COPY_KEYS[text] ? 'release.' + maps.RELEASE_COPY_KEYS[text] : maps.EXISTING_COPY_KEYS[text.toLowerCase()];
  return key?.split('.').reduce((obj, part) => obj?.[part], catalogs[lang]) || text;
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setBypassServiceWorker(true);
  const errors = [], blockedWrites = [];
  const user = { id: '00000000-0000-4000-8000-000000000083', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === base || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
    const respond = (data, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(data) });
    if (request.method() === 'OPTIONS') return respond({});
    if (url.pathname === '/auth/v1/user') return respond(user);
    if (url.pathname.endsWith('/get_my_ecard_entitlement')) return respond({ is_pro: false, status: 'free', plan_type: 'free' });
    if (request.method() !== 'GET') { blockedWrites.push(url.pathname); return respond({}, 403); }
    if (url.pathname.endsWith('/digital_card_links')) return respond([]);
    return respond(null);
  });
  const visit = route => page.goto(base + route, { waitUntil: 'networkidle2', timeout: 90000 });
  const button = async text => {
    await page.waitForFunction(text => [...document.querySelectorAll('button,summary')].some(e => e.textContent.trim() === text), {}, text);
    await page.evaluate(text => [...document.querySelectorAll('button,summary')].find(e => e.textContent.trim() === text).click(), text);
  };
  const fits = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal page overflow');
  let checks = 0;
  try {
    for (const lang of ['en', 'pt', 'es']) {
      const prefix = lang === 'en' ? '' : '/' + lang;
      const c = text => copy(lang, text);
      if (page.url().startsWith(base)) await page.evaluate(lang => localStorage.setItem('tavvy-locale', lang), lang);
      await visit(prefix + '/ecard/templates');
      assert.equal(await page.$eval('h1', el => el.textContent), c('Find your look.'));
      assert.equal(await page.$$eval('[data-catalog-template]', els => els.length), 21);
      assert.equal(await page.$$eval('[data-catalog-scheme]', els => els.length), 123);
      assert.equal(await page.$eval('.section-heading h2', el => el.textContent), 'Classic Card');
      assert.equal(await page.$eval('.section-heading p', el => el.textContent), c('Traditional business card. Logo, photo, name, title, company, and all contact details.'));
      await fits();
      await page.screenshot({ path: `${out}/${lang}-gallery.png` }); checks++;
      await page.evaluate(user => localStorage.setItem('sb-scasgwrikoqdwlwlwcff-auth-token', JSON.stringify({ access_token: 'qa.fixture.token', refresh_token: 'qa-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user })), user);
      await visit(prefix + '/app/ecard/new?template=biz-traditional&scheme=forest-cream');
      await page.waitForSelector('.template-gallery');
      assert.equal(await page.$eval('.gallery-heading h1', el => el.textContent), c('Choose your look'));
      assert(await page.$eval('button.continue', el => el.disabled));
      assert.equal(await page.$eval('.example-note', el => el.textContent), c('This design or color requires Pro. Choose a Free option to continue.'));
      await fits(); await page.screenshot({ path: `${out}/${lang}-locked-design.png` }); checks++;
      await page.click('[aria-label="Navy & Gold"]');
      await page.waitForFunction(() => !document.querySelector('button.continue').disabled);
      await button(c('Use this template'));
      await page.type('input[name="fullName"]', 'Locale QA'); await page.type('input[name="title"]', 'Private typed text');
      assert.equal(await page.$eval('input[name="title"]', el => el.placeholder), c('e.g. Designer, Founder, Agent'));
      assert.equal(await page.$eval('.card-purpose legend', el => el.textContent), c('Card for'));
      assert.equal(await page.$eval('.card-purpose label', el => el.textContent), c('Business'));
      await button(c('Change design or color')); await button(c('Use this template'));
      assert.equal(await page.$eval('input[name="fullName"]', el => el.value), 'Locale QA');
      assert.equal(await page.$eval('input[name="title"]', el => el.value), 'Private typed text');
      await fits(); await page.screenshot({ path: `${out}/${lang}-setup.png` }); checks++;
      await button(c('Choose card type & template'));
      assert.equal(await page.$eval('h2', el => el.textContent), c('What kind of card?'));
      await page.evaluate(text => [...document.querySelectorAll('.typeCardAnim')].find(el => el.textContent.includes(text)).click(), c('Politician'));
      await page.type('input[placeholder]', lang === 'pt' ? 'Alemanha' : lang === 'es' ? 'Alemania' : 'Germany');
      assert.equal(await page.$$eval('button', (els, text) => els.filter(el => el.textContent.includes(text)).length, c('Germany')), 1);
      await fits(); await page.screenshot({ path: `${out}/${lang}-country-search.png` });
      await page.evaluate(text => [...document.querySelectorAll('button')].find(el => el.textContent.includes(text)).click(), c('Germany'));
      await page.waitForSelector('.template-gallery');
      assert(await page.$eval('.gallery-navigation', el => el.textContent.includes('Politician Card')));
      checks++;
      await button(c('Quick setup')); await page.waitForSelector('input[name="fullName"]');
      assert.equal(await page.$eval('input[name="fullName"]', el => el.value), 'Locale QA');
      assert.equal(await page.$eval('input[name="title"]', el => el.value), 'Private typed text'); checks++;
    }
    assert.deepEqual(errors, []); assert.deepEqual(blockedWrites, []);
    const result = { status: 'PASS', checks, languages: ['en','pt','es'], layouts: 21, palettes: 123, realWrites: 0, blockedWrites, errors };
    fs.writeFileSync(out + '/result.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
  } catch (error) {
    await page.screenshot({ path: out + '/failure.png' });
    fs.writeFileSync(out + '/failure.json', JSON.stringify({ error: String(error), url: page.url(), body: await page.$eval('body', el => el.innerText), errors, blockedWrites }, null, 2));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
