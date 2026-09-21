/** Isolated browser fixtures only. Every backend write is intercepted. */
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TAVVY_ECARD_BASE || 'http://127.0.0.1:3824';
const out = process.env.TAVVY_ECARD_QA || '/private/tmp/tavvy-phone-preview-qa';
const uid = '00000000-0000-4000-8000-000000000083', cid = '00000000-0000-4000-8000-000000000098';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  const errors = [], writes = [], checks = [];
  let card = { id: cid, user_id: uid, full_name: 'Alex Morgan', slug: 'preview-fixture', title: 'Design for everyday life', bio: 'Thoughtful work for local businesses. Explore recent projects and get in touch.', template_id: 'basic', color_scheme_id: 'blue', theme: 'classic', gradient_color_1: '#125c60', gradient_color_2: '#063d42', is_published: false, is_active: true, featured_socials: [], gallery_images: [], videos: [], profile_photo_url: base + '/__preview_test__/avatar.svg', banner_image_url: base + '/__preview_test__/banner.svg', phone: '+15555550100', email: 'alex@example.invalid', show_contact_info: true, show_social_icons: true };
  const links = Array.from({ length: 12 }, (_, index) => ({ id: 'fixture-' + index, card_id: cid, platform: 'website', title: index === 11 ? 'Last link on this long card' : ['See my recent work', 'Book an introduction', 'About the studio', 'Design journal'][index % 4], url: 'https://example.invalid/' + index, sort_order: index, is_active: true }));
  const user = { id: uid, email: 'preview@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  await page.evaluateOnNewDocument(session => {
    localStorage.setItem('sb-scasgwrikoqdwlwlwcff-auth-token', JSON.stringify(session));
    localStorage.setItem('@tavvy_theme_mode', 'light');
    localStorage.setItem('tavvy-locale', 'en');
  }, { access_token: 'qa.preview.token', refresh_token: 'qa-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user });
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const respond = (data, status = 200) => request.respond({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(data) });
    if (url.pathname.startsWith('/__preview_test__/')) return request.respond({ status: 200, contentType: 'image/svg+xml', body: url.pathname.includes('avatar') ? '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f3d4b7"/><circle cx="200" cy="165" r="75" fill="#494443"/><path d="M60 400V350a140 130 0 0 1 280 0v50" fill="#125c60"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><rect width="900" height="500" fill="#125c60"/><circle cx="730" cy="50" r="350" fill="#d9c5ab"/><path d="M-80 500L410 40l490 460" fill="#19484e"/></svg>' });
    if (request.method() === 'OPTIONS') return respond({});
    if (url.hostname.endsWith('.supabase.co')) {
      if (url.pathname === '/auth/v1/user') return respond(user);
      if (url.pathname.endsWith('/get_my_ecard_entitlement')) return respond({ is_pro: true, is_super_admin: false, ecard_active: true, status: 'active', plan_type: 'pro' });
      if (url.pathname.endsWith('/digital_cards') && request.method() === 'GET') return respond(card);
      if (url.pathname.endsWith('/digital_card_links') && request.method() === 'GET') return respond(links);
      if (!['GET', 'HEAD'].includes(request.method())) { writes.push(url.pathname); return respond({ message: 'All writes blocked in preview QA' }, 409); }
      return respond(null);
    }
    if (!['GET', 'HEAD'].includes(request.method())) { writes.push(url.pathname); return respond({ message: 'All writes blocked in preview QA' }, 409); }
    if (url.origin === base || url.protocol === 'data:') return request.continue();
    return request.abort();
  });
  async function openEditor(width, height, template) {
    card = { ...card, template_id: template };
    await page.setViewport({ width, height });
    await page.goto(base + `/app/ecard/${cid}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('.card-studio');
    if (width <= 800) await page.evaluate(() => [...document.querySelectorAll('.studio-actions button')].find(button => button.textContent.trim() === 'Preview').click());
    const handle = await page.waitForSelector('iframe[title="9:16 phone preview"]');
    const frame = await handle.contentFrame();
    await frame.waitForFunction(() => document.body.innerText.toLowerCase().includes('alex morgan'));
    await frame.waitForFunction(() => [...document.querySelectorAll('.link-btn')].length > 0 && [...document.querySelectorAll('.link-btn')].every(element => Number(getComputedStyle(element).opacity) > 0.99));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('iframe[title="9:16 phone preview"]')).visibility === 'visible');
    return frame;
  }
  try {
    for (const template of ['basic', 'biz-modern', 'pro-realtor', 'civic-card', 'full-width', 'church']) {
      const frame = await openEditor(1360, 940, template);
      const geometry = await page.$eval('[data-phone-screen]', element => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height }; });
      assert(Math.abs(geometry.width / geometry.height - 9 / 16) < 0.001, 'Visible screen must be9:16');
      assert.deepEqual(await frame.evaluate(() => [innerWidth, innerHeight]), [360, 640], 'Renderer has real phone viewport, not desktop viewport units');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      const scroll = await frame.evaluate(() => { const documentScroll = document.querySelector('[data-preview-scroll]'); document.querySelector('[data-preview-scroll]').scrollTo({ top: documentScroll.scrollHeight, behavior: 'instant' }); return { top: documentScroll.scrollTop, height: documentScroll.scrollHeight, viewport: innerHeight }; });
      assert(scroll.top > 0 && scroll.height > scroll.viewport, 'Long card must scroll inside the phone');
      assert(await frame.$eval('body', element => element.innerText.includes('Last link on this long card')));
      await frame.evaluate(() => document.querySelector('[data-preview-scroll]').scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: out + '/' + template + '-desktop.png' });
      checks.push({ template, geometry, viewport: [360, 640], innerScroll: scroll.top });
    }
    for (const width of [390, 320]) {
      const frame = await openEditor(width, 844, 'biz-modern');
      const geometry = await page.$eval('[data-phone-screen]', element => { const box = element.getBoundingClientRect(); return { x: box.x, right: box.right, width: box.width, height: box.height }; });
      assert(geometry.x >= 0 && geometry.right <= width, 'Phone fits narrow editor');
      assert(Math.abs(geometry.width / geometry.height - 9 / 16) < 0.001);
      assert.deepEqual(await frame.evaluate(() => [innerWidth, innerHeight]), [360, 640]);
      await frame.evaluate(() => document.querySelector('[data-preview-scroll]').scrollTo({ top: 100000, behavior: 'instant' }));
      const last = await frame.$eval('a[href="https://example.invalid/11"]', element => { const box = element.getBoundingClientRect(); return { top: box.top, bottom: box.bottom }; });
      assert(last.top >= 0 && last.bottom <= 640, 'Final link reachable inside screen');
      await page.screenshot({ path: out + '/long-card-bottom-' + width + '.png', fullPage: true });
      const before = frame.url();
      await frame.evaluate(() => document.querySelector('a[href="https://example.invalid/11"]').click());
      assert.equal(frame.url(), before, 'Preview actions cannot navigate');
      await frame.evaluate(() => document.querySelector('[data-preview-scroll]').scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: out + '/phone-' + width + '.png', fullPage: true });
      // In-memory bridge update represents unsaved editor changes. No backend writes.
      await page.evaluate(({ card, links }) => document.querySelector('iframe[title="9:16 phone preview"]').contentWindow.postMessage(JSON.stringify({ type: 'tavvy-ecard-preview', card: { ...card, full_name: 'Current unsaved preview' }, links }), location.origin), { card, links });
      await frame.waitForFunction(() => document.body.innerText.includes('Current unsaved preview'));
      checks.push({ width, geometry, lastLink: last, liveUpdate: true });
    }
    const wheelFrame = await openEditor(1360, 940, 'basic');
    const box = await page.$eval('[data-phone-screen]', element => { const box = element.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.wheel({ deltaY: 420 });
    await wheelFrame.waitForFunction(() => document.querySelector('[data-preview-scroll]').scrollTop > 50);
    await wheelFrame.evaluate(() => document.querySelector('[data-preview-scroll]').scrollTo({ top: 0, behavior: 'instant' }));
    await page.focus('iframe[title="9:16 phone preview"]'); await page.keyboard.press('PageDown');
    await wheelFrame.waitForFunction(() => document.querySelector('[data-preview-scroll]').scrollTop > 50);
    checks.push({ realWheelScroll: true, keyboardScroll: true });
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(base + `/app/ecard/${cid}/preview`, { waitUntil: 'networkidle2', timeout: 90000 });
    const separate = await (await page.waitForSelector('iframe[title="9:16 phone preview"]')).contentFrame();
    await separate.waitForFunction(() => document.body.innerText.toLowerCase().includes('alex morgan'));
    await separate.waitForFunction(() => [...document.querySelectorAll('.link-btn')].length > 0 && [...document.querySelectorAll('.link-btn')].every(element => Number(getComputedStyle(element).opacity) > 0.99));
    const separateGeometry = await page.$eval('[data-phone-screen]', element => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height }; });
    assert(Math.abs(separateGeometry.width / separateGeometry.height - 9 / 16) < 0.001);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.screenshot({ path: out + '/separate-preview-mobile.png', fullPage: true });
    checks.push({ separatePreview: true, geometry: separateGeometry });
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    fs.writeFileSync(out + '/result.json', JSON.stringify({ passed: true, checks, errors, writes }, null, 2));
    console.log(JSON.stringify({ passed: true, screenshots: out, templates: 6, phoneWidths: [390, 320], errors, writes }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
