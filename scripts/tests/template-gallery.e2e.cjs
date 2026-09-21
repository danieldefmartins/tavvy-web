/** Creation-picker regression. All authentication/data responses are fixtures; writes are blocked. */
const puppeteer = require('puppeteer'), fs = require('node:fs'), assert = require('node:assert/strict');
const base = process.env.TAVVY_ECARD_BASE || 'http://127.0.0.1:3825';
const out = process.env.TAVVY_ECARD_QA || '/private/tmp/tavvy-picker-qa';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage(), errors = [], writes = [], checks = [];
  const user = { id: '00000000-0000-4000-8000-000000000083', email: 'picker@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  await page.setBypassServiceWorker(true);
  await page.evaluateOnNewDocument(session => {
    localStorage.setItem('sb-scasgwrikoqdwlwlwcff-auth-token', JSON.stringify(session));
    localStorage.setItem('tavvy-locale', 'en'); localStorage.setItem('@tavvy_theme_mode', 'light');
    window.addEventListener('message', event => { try { const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; if (data?.type === 'tavvy-ecard-preview') window.__pickerPreview = data; } catch {} });
  }, { access_token: 'fixture.picker.token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user });
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const reply = value => request.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(value) });
    if (request.method() === 'OPTIONS') return reply({});
    if (url.hostname.endsWith('.supabase.co') && url.pathname.endsWith('/get_my_ecard_entitlement')) return reply({ is_pro: false, is_super_admin: false, ecard_active: true, status: 'free', plan_type: 'free' });
    if (!['GET', 'HEAD'].includes(request.method())) { writes.push(url.pathname); return request.abort(); }
    if (url.hostname.endsWith('.supabase.co')) {
      if (url.pathname === '/auth/v1/user') return reply(user);
      if (url.pathname.endsWith('/get_my_ecard_entitlement')) return reply({ is_pro: false, is_super_admin: false, ecard_active: true, status: 'free', plan_type: 'free' });
      if (url.pathname.endsWith('/profiles')) return reply({ user_id: user.id, display_name: 'Fixture user' });
      return reply([]);
    }
    return request.continue();
  });
  const click = async text => { await page.waitForFunction(text => [...document.querySelectorAll('button')].some(element => element.textContent.includes(text)), {}, text); await page.evaluate(text => [...document.querySelectorAll('button')].find(element => element.textContent.includes(text)).click(), text); };
  const frameFor = async template => {
    await page.waitForFunction(template => [...document.querySelectorAll('iframe')].some(frame => frame.contentWindow?.__pickerPreview?.card?.template_id === template), {}, template);
    await page.waitForFunction(template => { const iframe=[...document.querySelectorAll('iframe')].find(frame=>frame.contentWindow?.__pickerPreview?.card?.template_id===template); const slide=iframe?.closest('[data-index]'), container=document.querySelector('.template-gallery-scroll'); if(!slide||!container)return false; const a=slide.getBoundingClientRect(),b=container.getBoundingClientRect();return Math.abs(a.left+a.width/2-b.left-b.width/2)<2; },{},template);
    for (const frame of page.frames()) if (await frame.evaluate(template => window.__pickerPreview?.card?.template_id === template, template).catch(() => false)) return frame;
    throw Error('Missing live template frame ' + template);
  };
  try {
    const viewport = { width: Number(process.env.TAVVY_ECARD_WIDTH || 390), height: Number(process.env.TAVVY_ECARD_HEIGHT || 740) };
    await page.setViewport(viewport);
    await page.goto(base + '/app/ecard/new', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name=fullName]');
    await page.type('input[name=fullName]', 'Keep my entered name');
    await click('Choose card type & template'); await click('For your company');
    for (const [name, id] of [['Classic Card', 'biz-traditional'], ['Cover Card', 'cover-card'], ['Bold Card', 'pro-creative']]) {
      await page.click(`[aria-label="Preview ${name}"]`);
      const frame = await frameFor(id);
      await frame.waitForFunction(() => document.body.innerText.includes('Jane Smith'));
      await page.waitForFunction(id => [...document.querySelectorAll('iframe')].some(iframe => iframe.contentWindow?.__pickerPreview?.card?.template_id === id && getComputedStyle(iframe).visibility === 'visible' && iframe.closest('[data-phone-screen]')?.getAttribute('aria-busy') === 'false'), {}, id);
      await frame.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
      assert.deepEqual(await frame.evaluate(() => [innerWidth, innerHeight]), [360, 640]);
      const geometry = await page.evaluate(id => { const iframe = [...document.querySelectorAll('iframe')].find(frame => frame.contentWindow?.__pickerPreview?.card?.template_id === id); const rect = iframe.closest('[data-phone-screen]').getBoundingClientRect(); return { width: rect.width, height: rect.height }; }, id);
      assert(Math.abs(geometry.width / geometry.height - 9 / 16) < 0.001);
      assert(geometry.height <= Math.min(520, Math.max(260, viewport.height - 350)) + 1, 'Picker must fit the available phone screen');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `${out}/${id}.png`, fullPage: false });
      const rendered = await page.evaluate(id => [...document.querySelectorAll('iframe')].map(iframe => ({ template: iframe.contentWindow?.__pickerPreview?.card?.template_id, visible: getComputedStyle(iframe).visibility, busy: iframe.closest('[data-phone-screen]')?.getAttribute('aria-busy'), loading: iframe.closest('[data-phone-screen]')?.innerText, index: iframe.closest('[data-index]')?.getAttribute('data-index') })).filter(frame=>frame.template===id), id);
      assert(rendered.every(frame => frame.visible === 'visible' && frame.busy === 'false'), 'Preview must remain visible during capture');
      checks.push({ name, geometry, viewport: [360, 640], rendered });
    }
    await page.click('[aria-label="Preview Classic Card"]');
    const frame = await frameFor('biz-traditional');
    const options = await page.$$eval('button[title][aria-pressed]', elements => elements.filter(element => !element.getAttribute('aria-label').includes('Pro')).map(element => element.getAttribute('title')));
    if (options.length > 1) { const before=await frame.evaluate(()=>window.__pickerPreview.card.color_scheme_id); await page.click(`button[title="${options[1]}"]`); await frame.waitForFunction(before => window.__pickerPreview.card.color_scheme_id !== before,{},before); }
    await click('Use this template');
    assert.equal(await page.$eval('input[name=fullName]', element => element.value), 'Keep my entered name');
    await click('Choose card type & template'); await click('For your company');
    await page.click('[aria-label="Preview Pro Card"]');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === 'Use this template')?.disabled);
    for (const route of ['/app/apps', '/app/profile']) {
      await page.goto(base + route, { waitUntil: 'networkidle2' });
      await page.waitForSelector('input[value="light"]');
      const position = await page.$eval('.appearance-selector', element => element.getBoundingClientRect().top);
      assert(position < 550, 'Appearance should be easy to find near the top');
      await page.$eval('input[value="dark"]', element => element.scrollIntoView({block:'center',behavior:'instant'}));
      await page.waitForFunction(() => { const element=document.querySelector('input[value="dark"]');const rect=element.getBoundingClientRect();return document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2)===element; });
      await page.click('input[value="dark"]'); await page.waitForFunction(() => document.documentElement.style.colorScheme === 'dark');
      await page.click('input[value="light"]');
      await page.waitForFunction(() => document.documentElement.style.colorScheme === 'light');
    }
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
    fs.writeFileSync(out + '/result.json', JSON.stringify({ passed: true, checks, preservedSetup: true, proGate: true, appearanceLocations: ['Tools', 'Profile'], writes, errors }, null, 2));
    console.log(JSON.stringify({ passed: true, checks: checks.length, writes, errors }));
  } catch (error) { await page.screenshot({ path: out + '/failure.png', fullPage: true }); fs.writeFileSync(out + '/failure.json', JSON.stringify({ error: String(error), body: await page.$eval('body', element => element.innerText), writes, errors }, null, 2)); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
