const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), puppeteer=require('puppeteer');
const base=process.env.TAVVY_SEARCH_BASE||'http://127.0.0.1:3834';
const output=process.env.TAVVY_SEARCH_OUTPUT||'/private/tmp/tavvy-search-journey-20260921/browser';fs.mkdirSync(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();await page.setBypassServiceWorker(true);await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 const checks=[], requests=[], errors=[];let held=[], canonicalMode='found';
 const pass=name=>checks.push(name);page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:ok=>ok({coords:{latitude:28.54,longitude:-81.38}})}}));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const u=new URL(request.url());
  if(u.hostname==='fixture.supabase.co')return request.respond({status:200,contentType:'application/json',body:'[]'});
  if(u.pathname.startsWith('/_next/data/')&&u.pathname.includes('/app/place/'))return request.respond({status:200,contentType:'application/json',body:JSON.stringify({pageProps:{placeShare:null},__N_SSP:true})});
  if(u.pathname==='/api/search'){
   const params=Object.fromEntries(u.searchParams);requests.push(params);const q=params.q||'', city=/Chicago/i.test(q)?'Chicago':/near me/i.test(q)?'Orlando':'Boston';
   if(q==='Trattoria Tavvy' && canonicalMode==='failed') return request.respond({status:503,contentType:'application/json',body:'{"error":"Search unavailable"}'});
   const full=params.evidence==='full', pending=/delayed/i.test(q)&&!full;
   const suggestions=Array.from({length:q==='Trattoria Tavvy'&&canonicalMode!=='found'?0:30},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name:i===0&&q==='Trattoria Tavvy'?'Trattoria Tavvy':`${city} restaurant ${i+1}`,category:'restaurant',city,region:city==='Chicago'?'IL':city==='Boston'?'MA':'FL',latitude:city==='Boston'?42.36:city==='Chicago'?41.88:28.54,longitude:city==='Boston'?-71.06:city==='Chicago'?-87.63:-81.38,signals:[],evidenceStatus:pending?'loading':'ready'}));
   const send=()=>request.respond({status:200,contentType:'application/json',body:JSON.stringify({suggestions,partial:q==='Trattoria Tavvy'&&canonicalMode==='partial',evidencePending:pending,location:{label:`${city}, ${city==='Chicago'?'IL':city==='Boston'?'MA':'FL'}`,kind:'named'},dining:true})});
   if(/delayed/i.test(q)&&full){held.push(send);return;}return send();
  }
  if(u.pathname==='/api/places')return request.respond({status:200,contentType:'application/json',body:'{"places":[]}'});
  if(u.pathname.startsWith('/api/place/'))return request.respond({status:200,contentType:'application/json',body:JSON.stringify({place:{id:u.pathname.split('/').pop(),name:'Synthetic restaurant',category:'restaurant'},groups:{good:[],vibe:[],headsup:[]},recentReviews:[]})});
  if(u.hostname==='unpkg.com')return request.respond({status:200,contentType:'text/css',body:fs.readFileSync(require.resolve('leaflet/dist/leaflet.css'),'utf8')});
  if(u.origin!==new URL(base).origin)return request.abort();
  return request.continue();
 });
 const fill=async(selector,value)=>page.$eval(selector,(el,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const mapSearch=async q=>{await page.click('.search-placeholder-text');await page.waitForSelector('.overlay-search-bar input');await fill('.overlay-search-bar input',q);await page.keyboard.press('Enter');};
 const height=()=>page.$eval('.bottom-sheet',e=>e.getBoundingClientRect().height);
 const scroll=()=>page.$eval('.places-list',e=>e.scrollTop);
 const city=async name=>page.waitForFunction(name=>document.querySelector('.search-scope')?.textContent.includes(name)&&document.querySelector('.places-list')?.textContent.includes(name),{},name);
 const cdp=await page.createCDPSession();
 const swipe=async(delta,selector='.places-list',cancel=false)=>{
  const p=await page.$eval(selector,e=>{const r=e.getBoundingClientRect();return{x:r.x+Math.min(100,r.width/2),y:r.y+Math.min(100,r.height/2)}});
  if(delta<0)p.y=Math.max(p.y,160);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
  for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x,y:p.y-delta*i/8}]});await delay(24);}
  await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await delay(550);
 };
 try{
  await page.goto(`${base}/app/search?q=Italian%20Restaurants%20Near%20Boston%2C%20MA&location=current&lat=28.54&lng=-81.38`,{waitUntil:'networkidle2'});await page.waitForSelector('.result-item');
  assert.match(await page.$eval('.resolved-location',e=>e.textContent),/Boston/);assert.equal(requests.at(-1).userLat,'28.54');assert.equal(requests.at(-1).q,'Italian Restaurants Near Boston, MA');pass('explicit Boston destination retained with Orlando device scope');
  await page.goto(base+'/app/search?q=Trattoria%20Tavvy',{waitUntil:'networkidle2'});await page.waitForSelector('.result-item');
  assert.equal(await page.$$eval('.demo-result',els=>els.length),0);assert.equal(await page.$$eval('.result-item',els=>els.filter(el=>el.textContent.includes('Trattoria Tavvy')).length),1);pass('one real canonical Trattoria result, no injected demo');
  canonicalMode='missing';await page.goto(base+'/app/search?q=Trattoria%20Tavvy',{waitUntil:'networkidle2'});await page.waitForSelector('.demo-result');assert.match(await page.$eval('.demo-result',el=>el.textContent),/Illustrative demo/);assert.equal(await page.$$eval('.result-item',els=>els.length),0);pass('empty exact-name lookup offers an explicitly illustrative demo');
  for(const mode of ['partial','failed']){canonicalMode=mode;await page.goto(base+'/app/search?q=Trattoria%20Tavvy',{waitUntil:'networkidle2'});assert.equal(await page.$$eval('.demo-result',els=>els.length),0);}pass('partial or failed canonical lookup never substitutes the demo');
  canonicalMode='missing';await page.goto(base+'/app/map?q=Trattoria%20Tavvy',{waitUntil:'networkidle2'});await page.waitForSelector('.demo-fallback');assert.match(await page.$eval('.demo-fallback',el=>el.textContent),/Illustrative demo/);assert.equal(await page.$$eval('.places-list button.card',els=>els.length),0);pass('map fallback is a labeled demo link, with no fake map pin or review evidence');canonicalMode='found';
  await page.goto(base+'/app/search?q=demo%20restaurant',{waitUntil:'networkidle2'});assert.equal(await page.$$eval('.demo-result',els=>els.length),1);pass('explicit demo shortcut remains available');
  await page.goto(base+'/app/map?q=restaurants%20in%20Boston%2C%20MA',{waitUntil:'networkidle2'});await city('Boston');const half=await height();
  await swipe(220);const expanded=await height();assert.ok(expanded>half+100);assert.equal(await scroll(),0);assert.ok(page.url().includes('/app/map'));pass('content swipe expands sheet without accidental card navigation');
  const accessible=await page.$eval('.search-row',el=>{const r=el.getBoundingClientRect();const sheet=document.querySelector('.bottom-sheet').getBoundingClientRect();return r.bottom<sheet.top});assert.equal(accessible,true);pass('expanded sheet leaves search and Back accessible');
  await swipe(200);assert.ok(await scroll()>70);assert.ok(Math.abs(await height()-expanded)<2);pass('expanded sheet gives subsequent swipe to native list scrolling');
  const savedScroll=await scroll();await delay(200);await mapSearch('restaurants in Chicago, IL');await city('Chicago');assert.match(page.url(),/Chicago/);
  await page.goBack({waitUntil:'networkidle2'});await city('Boston');await delay(500);assert.ok(Math.abs(await height()-expanded)<2);assert.ok(Math.abs(await scroll()-savedScroll)<5);pass('Back restores prior query, results, list offset and expanded height');
  await page.goForward({waitUntil:'networkidle2'});await city('Chicago');pass('Forward restores next map search');
  await page.goBack({waitUntil:'networkidle2'});await city('Boston');
  const link=await page.$('.places-list button.card');assert.ok(link);await page.evaluate(el=>el.click(),link);await page.waitForFunction(()=>location.pathname.startsWith('/app/place/'));await page.goBack({waitUntil:'networkidle2'});await city('Boston');assert.ok(Math.abs(await scroll()-savedScroll)<5);pass('place detail Back restores map list position');
  await page.$eval('.places-list',el=>{el.scrollTop=0});await swipe(-200);assert.ok(await height()<expanded-80);pass('downward swipe at list top collapses sheet');
  await page.focus('.sheet-handle');await page.keyboard.press('Home');await delay(480);assert.ok(Math.abs(await height()-120)<2);await page.keyboard.press('End');await delay(480);assert.ok(await height()>half+100);pass('keyboard Home/End resizes results');
  await swipe(-100,'.sheet-handle',true);assert.ok(Number.isFinite(await height()));await page.focus('.sheet-handle');await page.keyboard.press('End');await delay(480);assert.ok(await height()>half+100);pass('touch cancellation releases drag state');
  await page.setViewport({width:844,height:390,isMobile:true,hasTouch:true});await delay(600);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.$eval('.bottom-sheet',el=>el.getBoundingClientRect().top>=0),true);pass('landscape resize remains bounded without horizontal overflow');
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await delay(500);
  await mapSearch('delayed restaurants in Boston, MA');await city('Boston');while(!held.length)await delay(20);await swipe(220);const beforeFull=await height();await held.shift()();await delay(600);assert.ok(Math.abs(await height()-beforeFull)<2);pass('delayed evidence never resets a user-expanded sheet');
  await mapSearch('delayed restaurants in Boston, MA second');await city('Boston');while(!held.length)await delay(20);await mapSearch('restaurants in Chicago, IL');await city('Chicago');await held.shift()();await delay(500);assert.match(await page.$eval('.places-list',e=>e.textContent),/Chicago/);assert.doesNotMatch(await page.$eval('.places-list',e=>e.textContent),/Boston restaurant/);pass('obsolete evidence cannot replace a newer destination');
  await page.goto(base+'/app/map?q=restaurants&where=Boston%2C%20MA&location=map&lat=42.36&lng=-71.06&minLat=42&maxLat=43&minLng=-72&maxLng=-70',{waitUntil:'networkidle2'});await city('Boston');await mapSearch('pizza near me');await city('Orlando');
  const relative=requests.at(-1);assert.equal(relative.userLat,'28.54');assert.equal(relative.where,undefined);assert.equal(relative.minLat,undefined);assert.equal(relative.location,'current');pass('typed near-me clears stale city/map bounds and uses actual device position');
  await page.screenshot({path:path.join(output,'map-mobile.png')});
  // Ordinary current-location lookup must not require an extra geolocation promise.
  await page.goto(base+'/app/map?q=restaurants%20in%20Boston%2C%20MA',{waitUntil:'networkidle2'});await city('Boston');await page.click('.search-placeholder-text');await fill('.overlay-search-bar input','Boston restaurant');await page.waitForSelector('.overlay-suggestion-item');await page.click('.overlay-suggestion-item');await page.waitForFunction(()=>new URL(location.href).searchParams.has('selected'));await page.waitForFunction(()=>document.querySelectorAll('.places-list button.card').length===1);assert.equal(await page.$$eval('.places-list button.card',els=>els.length),1);pass('autocomplete selection remains a single place on map with its own history entry');
  await mapSearch('restaurants in Chicago, IL');await city('Chicago');const countBeforeRetry=requests.length, historyBeforeRetry=await page.evaluate(()=>history.length);await mapSearch('restaurants in Chicago, IL');await page.waitForFunction(()=>!document.querySelector('.places-list .loading'));assert.ok(requests.length>countBeforeRetry);assert.equal(await page.evaluate(()=>history.length),historyBeforeRetry);pass('resubmitting the same search refreshes without another history entry');
  await page.click('.back-btn');await page.waitForFunction(()=>new URL(location.href).searchParams.has('selected'));await page.waitForFunction(()=>document.querySelectorAll('.places-list button.card').length===1);pass('map Back button follows the previous Tavvy entry');
  assert.deepEqual(errors,[]);pass('no browser runtime exceptions');
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,checks,requestCount:requests.length,metrics:{half,expanded,savedScroll}},null,2));console.log(JSON.stringify({passed:true,checks}));
 }catch(error){await page.screenshot({path:path.join(output,'failure.png')});fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:false,checks,error:error.stack,errors,requests},null,2));throw error;}finally{for(const send of held)try{await send()}catch{}await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
