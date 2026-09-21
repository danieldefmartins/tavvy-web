const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const base = process.env.TAVVY_SEARCH_BASE || 'http://127.0.0.1:3811';
(async () => {
 const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const page = await browser.newPage(); await page.setBypassServiceWorker(true); await page.setViewport({width:390,height:844});
 let releaseEvidence;
 const errors=[], searches=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(_ok,fail)=>fail({code:1})}}));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const url=new URL(request.url());
  // The place route now has server-rendered share metadata. Keep this navigation
  // test on its synthetic place instead of asking production for the fixture UUID.
  if (url.pathname.startsWith('/_next/data/') && url.pathname.includes('/app/place/')) {
   return request.respond({status:200,contentType:'application/json',body:JSON.stringify({pageProps:{placeShare:null},__N_SSP:true})});
  }
  if(url.pathname==='/api/search'){
   searches.push(Object.fromEntries(url.searchParams));
   const q=url.searchParams.get('q')||'', where=url.searchParams.get('where')||'';
   if(q==='progressive') {
    const full=url.searchParams.get('evidence')==='full';
    const send=()=>request.respond({status:200,contentType:'application/json',body:JSON.stringify({suggestions:[{id:'00000000-0000-4000-8000-000000000001',name:full?'Reviews ready restaurant':'Immediate restaurant',category:'restaurant',city:'Boston',signals:[],evidenceStatus:full?'ready':'loading'}],location:{label:'Boston, MA',kind:'named'},dining:true,evidencePending:!full})});
    if(full) { releaseEvidence=send; return; }
    return send();
   }
   const location=q.includes('Boston')?'Boston, MA':q.includes('Chicago')?'Chicago, IL':where||'Any location';
   const suggestions=Array.from({length:30},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name:`Restaurant ${i+1}`,city:location.split(',')[0],state_region:location.split(',')[1],category:q==='hotels'?'hotel':'restaurant',signals:[]}));
   return request.respond({status:200,contentType:'application/json',body:JSON.stringify({suggestions,location:{label:location,kind:'named'},dining:q!=='hotels'})});
  }
  if(url.pathname.startsWith('/api/place/')) return request.respond({status:200,contentType:'application/json',body:JSON.stringify({place:{id:url.pathname.split('/').pop(),name:'Restaurant 1',category:'restaurant',city:'Boston'},groups:{good:[],vibe:[],headsup:[]},recentReviews:[]})});
  request.continue();
 });
 const click=async text=>page.evaluate(text=>[...document.querySelectorAll('button,a')].find(el=>el.textContent.trim()===text)?.click(),text);
 const fill=async(selector,value)=>page.$eval(selector,(el,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 try{
  await page.goto(`${base}/app/search?q=progressive&where=Boston%2C%20MA`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.result-item');
  assert.match(await page.$eval('.result-item',el=>el.textContent),/Immediate restaurant/);
  assert.match(await page.$eval('.resolved-location',el=>el.textContent),/Checking guest reports/);
  assert.equal(typeof releaseEvidence,'function','full evidence requested after places are visible');
  await releaseEvidence();
  await page.waitForFunction(()=>document.querySelector('.result-item')?.textContent.includes('Reviews ready restaurant'));
  assert.equal(await page.$eval('.resolved-location',el=>el.textContent),'Boston, MA');
  await page.goto(`${base}/app/search?q=Italian%20Restaurants%20Near%20Boston%2C%20MA&location=current&lat=28.54&lng=-81.38`,{waitUntil:'networkidle2'});
  await page.waitForSelector('.result-item');
  assert.equal(await page.$eval('.resolved-location',el=>el.textContent),'Boston, MA');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile overflow');
  await fill('#search-location','Seattle, WA'); await click('Apply');
  await page.waitForFunction(()=>document.querySelector('.resolved-location')?.textContent==='Seattle, WA');
  assert.equal(searches.at(-1).q,'Italian Restaurants'); assert.equal(searches.at(-1).where,'Seattle, WA');
  await fill('.search-input-container input','Italian Restaurants in Chicago, IL'); await click('Search');
  await page.waitForFunction(()=>document.querySelector('.resolved-location')?.textContent==='Chicago, IL');
  assert.equal(searches.at(-1).where,undefined,'old Where should not override new typed city');
  await click('Near me'); await page.waitForFunction(()=>document.body.innerText.includes('Location access was not available'));
  assert.match(await page.$eval('.resolved-location',el=>el.textContent),/Chicago/,'denied GPS must not relabel existing results');
  await fill('.search-input-container input','restaurants'); await fill('#search-location','Boston, MA'); await click('Search');
  await page.waitForFunction(()=>document.querySelector('.resolved-location')?.textContent==='Boston, MA');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>window.scrollTo(0,900));
  const position=await page.evaluate(()=>window.scrollY); assert.ok(position>500);
  const link=await page.$('.result-item a');
  await page.evaluate(el=>el.click(),link); await page.waitForFunction(()=>location.pathname.startsWith('/app/place/'));
  await page.goBack({waitUntil:'networkidle2'}); await page.waitForSelector('.result-item');
  await page.waitForFunction(y=>Math.abs(window.scrollY-y)<30,{timeout:10000},position);
  assert.equal(new URL(page.url()).searchParams.get('where'),'Boston, MA');
  await page.screenshot({path:'/private/tmp/tavvy-search-mobile.png',fullPage:true});
  const mapHref=await page.$eval('a[href^="/app/map"]',el=>el.getAttribute('href'));
  assert.match(mapHref,/where=Boston/);
  await page.goto(`${base}/app/search?q=hotels&where=Boston%2C%20MA`,{waitUntil:'networkidle2'}); await page.waitForSelector('.result-item');
  assert.equal(await page.$('.dining-needs'),null,'dining filters on hotel search');
  assert.deepEqual(errors,[]);
  console.log('Search browser checks passed: progressive review loading, named location, edit, denied GPS, Back/scroll, map context, food-only filters');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
