/** Public fixture routes only. No customer data, account sign-in, or writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const base = process.env.TAVVY_HEADER_BASE || 'http://127.0.0.1:3824';
const out = process.env.TAVVY_HEADER_QA || '/private/tmp/tavvy-tool-header-qa';
(async () => {
 fs.mkdirSync(out, {recursive:true});
 const browser = await puppeteer.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const page = await browser.newPage(); await page.setBypassServiceWorker(true);
 const errors = [], writes = []; page.on('pageerror', e => errors.push(e.message));
 await page.evaluateOnNewDocument(() => {localStorage.setItem('@tavvy_theme_mode','light');localStorage.setItem('tavvy-locale','en');});
 await page.setRequestInterception(true);
 page.on('request', r => {
  const u = new URL(r.url());
  const reply = (v,status=200) => r.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(v)});
  if(r.method()==='OPTIONS') return reply({});
  if(!['GET','HEAD'].includes(r.method())) {writes.push(u.pathname);return reply({},403);}
  if(u.hostname==='example.test') return r.respond({status:200,contentType:'text/html',body:'<h1>Outside Tavvy</h1>'});
  if(u.hostname.endsWith('.supabase.co')) {
   if(u.pathname.endsWith('/tavvy_cities')) return reply([{id:'00000000-0000-4000-8000-000000000001',name:'Sample Boston',state:'Massachusetts',country:'US'},{id:'00000000-0000-4000-8000-000000000002',name:'Sample Chicago',state:'Illinois',country:'US'}]);
   if(u.pathname.includes('/auth/'))return reply({user:null});
   return reply([]);
  }
  if(u.origin===base && u.pathname.startsWith('/api/'))return reply({events:[],places:[],results:[],data:[]});
  if(u.origin===base||u.protocol==='data:')return r.continue();return r.abort();
 });
 try {
  await page.setViewport({width:390,height:844});
  const pages=[['explore','Universes'],['universes','Universes'],['cities','Cities'],['atlas','Atlas'],['rv-camping','RV & Camping'],['pros','Pros'],['realtors','Realtors'],['rides','Rides'],['happening-now','Happening Now'],['wallet','Wallet']];
  const layouts=[];
  for(const [route,title] of pages){
   await page.goto(base+'/app/'+route,{waitUntil:'networkidle2',timeout:90000});
   await page.waitForSelector('.tool-header h1',{timeout:15000});
   const m=await page.$eval('.tool-header',e=>{const h=e.querySelector('h1'), r=h.getBoundingClientRect(),head=e.getBoundingClientRect();return {title:h.textContent,font:getComputedStyle(h).fontSize,center:r.x+r.width/2,expected:head.x+head.width/2,buttons:[...e.querySelectorAll('.tool-header-row button')].map(b=>({label:b.getAttribute('aria-label'),width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor};});
   assert.equal(m.title,title);assert.equal(m.font,'18px');assert(Math.abs(m.center-m.expected)<1);assert(m.buttons.every(b=>b.width>=44&&b.height>=44));assert.equal(m.buttons.length,2);assert.equal(await page.$$eval('.tool-header',els=>els.length),1);
   layouts.push({route,...m});
   if(['cities','atlas','rv-camping','explore'].includes(route))await page.screenshot({path:out+'/'+route+'-light-mobile.png'});
   if(route==='cities'){await page.type('input[aria-label="Search cities"]','Boston');await page.waitForFunction(()=>!document.body.innerText.includes('Sample Chicago'));assert((await page.content()).includes('Sample Boston'));}
   if(route==='rides')assert((await page.content()).includes('Refresh rides'));
   if(route==='happening-now')assert((await page.content()).includes('Refresh events'));
  }
  // An unrelated previous browser entry must not take the user out of Tavvy.
  await page.goto('https://example.test');await page.goto(base+'/app/atlas',{waitUntil:'networkidle2'});await page.click('.tool-header button[aria-label="Go back"]');await page.waitForFunction(()=>location.pathname==='/app/apps');
  // Real Next Link navigation creates a trusted entry and Back restores Tools.
  await page.waitForSelector('a[href="/app/cities"]');await page.click('a[href="/app/cities"]');await page.waitForSelector('.tool-header');await page.click('.tool-header button[aria-label="Go back"]');await page.waitForFunction(()=>location.pathname==='/app/apps');
  await page.waitForSelector('a[href="/app/atlas"]');await page.click('a[href="/app/atlas"]');await page.waitForSelector('.tool-header');
  await page.keyboard.press('Tab');await page.focus('.tool-header button[aria-label="Go back"]');assert.equal(await page.$eval('.tool-header button',b=>getComputedStyle(b).outlineWidth),'3px');
  await page.click('.tool-header button[aria-label="Profile"]');await page.waitForFunction(()=>location.pathname==='/app/login');await page.waitForSelector('input[type="password"]');
  // Manual light overrides a dark device; manual dark overrides a light device.
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await page.goto(base+'/app/cities',{waitUntil:'networkidle2'});assert.equal(await page.$eval('.tool-header',e=>getComputedStyle(e).backgroundColor),layouts.find(x=>x.route==='cities').background);
  await page.evaluateOnNewDocument(()=>localStorage.setItem('@tavvy_theme_mode','dark'));await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
  for(const [width,height] of [[320,640],[1280,900]]){await page.setViewport({width,height});await page.goto(base+'/app/atlas',{waitUntil:'networkidle2'});const m=await page.$eval('.tool-header',e=>({bg:getComputedStyle(e).backgroundColor,width:e.scrollWidth,available:innerWidth}));assert(m.width<=m.available);assert.notEqual(m.bg,layouts.find(x=>x.route==='atlas').background);await page.screenshot({path:out+`/atlas-dark-${width}.png`});}
  assert.deepEqual(errors,[]);
  const result={passed:true,layouts,directExternalBackFallback:true,internalBack:true,profilePersonalLogin:true,keyboardFocus:true,themePreference:true,narrowAndDesktop:true,realWrites:0,interceptedWrites:writes.length,pageErrors:errors};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,routes:layouts.length,directExternalBackFallback:true,internalBack:true,profilePersonalLogin:true,realWrites:0}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
