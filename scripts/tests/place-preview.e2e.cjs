const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.TAVVY_PREVIEW_BASE || 'http://127.0.0.1:3851';
const out = '/private/tmp/tavvy-review-experience-20260922';
fs.mkdirSync(out, { recursive: true });
const summary = { status:'ready', recentReviewers:12, tiles:[
  {key:'main',title:'The Main Thing · Food',detail:'Fresh ingredients',count:9},
  {key:'good',title:'The Good',detail:'Friendly service',count:6},
  {key:'vibe',title:'The Vibe',detail:'Relaxed',count:5},
  {key:'headsup',title:'Heads Up',detail:'Can get busy',count:2},
]};
const places = [
  {id:'00000000-0000-4000-8000-000000000001',name:'Preview QA Restaurant',category:'Restaurant',subcategory:'Italian Restaurant',address:'69 Example Street',city:'Boston',region:'MA',latitude:42.36,longitude:-71.06,distance:16000,phone:'+16175550100',website:'https://example.test/menu',reviewSummary:summary,evidenceStatus:'ready'},
  {id:'00000000-0000-4000-8000-000000000002',name:'Preview QA Cafe',category:'Cafe',city:'Boston',distance:0,latitude:42.3601,longitude:-71.06,photos:['/qa-real-photo.webp'],reviewSummary:summary,evidenceStatus:'ready'},
];
(async () => {
  const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
  const page = await browser.newPage(); const errors = []; let realPhoto = false, unavailable = false;
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({width:390,height:844});
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = new URL(r.url());
    if(u.origin !== new URL(base).origin) return r.abort();
    if(u.pathname === '/api/search') return r.respond({status:200,contentType:'application/json',body:JSON.stringify({suggestions:places.map((p,i)=>({...p,...(i===0&&realPhoto?{cover_image_url:'/qa-real-photo.webp',photos:['/qa-real-photo-2.webp','/qa-real-photo-3.webp']}:{}),...(unavailable?{evidenceStatus:'unavailable',reviewSummary:{status:'unavailable',tiles:[]}}:{})})),location:{label:'Boston, MA',kind:'named'},dining:true})});
    if(u.pathname.startsWith('/qa-real-photo')) return r.respond({status:200,contentType:'image/webp',body:fs.readFileSync(path.join(__dirname,'../../public/images/place-categories/restaurant-1.webp'))});
    return r.continue();
  });
  try {
    for (const theme of ['light','dark']) {
      await page.evaluateOnNewDocument(value => localStorage.setItem('@tavvy_theme_mode',value), theme);
      await page.goto(base+'/app/search?q=Italian%20restaurants%20in%20Boston%2C%20MA',{waitUntil:'networkidle2'});
      await page.waitForSelector('article.card img');
      const first = await page.$eval('article.card', e => ({text:e.innerText,src:e.querySelector('img').getAttribute('src'),tiles:e.querySelectorAll('[data-review-section]').length,overflow:e.scrollWidth>e.clientWidth}));
      assert.match(first.text,/9.9 mi/); assert.doesNotMatch(first.text,/16000/);
      assert.match(first.text,/69 Example Street, Boston, MA/);
      assert.match(first.text,/12 reviewers/); assert.equal(first.tiles,2); assert.equal(first.overflow,false);
      assert.match(first.src,/restaurant-1.webp/);
      const second=await page.$$eval('article.card', cards=>({text:cards[1].innerText,src:cards[1].querySelector('img').getAttribute('src')}));
      assert.match(second.text,/Nearby/); assert.equal(second.src,'/qa-real-photo.webp');
      await page.screenshot({path:path.join(out,'cards-'+theme+'.png'),fullPage:true});
    }
    realPhoto=true;
    await page.reload({waitUntil:'networkidle2'});
    await page.waitForSelector('article.card img');
    assert.equal(await page.$eval('article.card img',e=>e.getAttribute('src')),'/qa-real-photo.webp');
    assert.equal(await page.$('article.card .illustration'),null);
    assert.equal(await page.$eval('article.card a[href^="tel:"]',e=>e.getAttribute('href')),'tel:+16175550100');
    assert.equal(await page.$eval('article.card a[href^="https://example.test"]',e=>e.getAttribute('href')),'https://example.test/menu');
    assert.equal(await page.$eval('article.card .photo',e=>Math.round(e.getBoundingClientRect().height)),76);
    assert.ok(await page.$eval('article.card',e=>e.getBoundingClientRect().height)<290);
    unavailable=true;
    await page.reload({waitUntil:'networkidle2'});
    await page.waitForSelector('article.card');
    assert.equal(await page.$eval('article.card',e=>(e.innerText.match(/Recent reviews unavailable/g)||[]).length),1);
    assert.equal(await page.$('article.card [data-review-section]'),null);
    await page.screenshot({path:path.join(out,'compact-unavailable.png'),fullPage:true});
    await page.goto(base+'/app/map?q=Restaurants%20in%20Boston%2C%20MA',{waitUntil:'networkidle2'});
    await page.waitForSelector('article.card');
    assert.equal(await page.$eval('article.card .photo-count',e=>e.innerText),'+2');
    assert.equal(await page.$eval('body',e=>e.innerText.includes('Edit location & filters')),false);
    await page.screenshot({path:path.join(out,'map-preview.png')});
    assert.deepEqual(errors,[]);
    console.log('PASS: light/dark cards, two compact review rows, real counts, address, meters conversion, zero distance, no overflow, real-photo replacement');
  } catch(error) { console.log('URL',page.url(),'ERRORS',errors,'PAGE',await page.$eval('body',e=>e.innerText.slice(0,1600))); await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}); throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
