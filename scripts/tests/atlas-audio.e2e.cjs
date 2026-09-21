/** Isolated public article fixture; backend writes and nonlocal requests are intercepted. */
const puppeteer=require('puppeteer'); const fs=require('node:fs'); const assert=require('node:assert/strict');
const base=process.env.TAVVY_ATLAS_BASE||'http://127.0.0.1:3824';
const out=process.env.TAVVY_ATLAS_QA||'/private/tmp/tavvy-atlas-audio-browser-qa';
const female=process.env.TAVVY_ATLAS_FEMALE||'/private/tmp/tavvy-atlas-la-female-stage-20260920/narration.mp3';
const male=process.env.TAVVY_ATLAS_MALE||'/private/tmp/tavvy-atlas-la-male-stage-20260920/narration.mp3';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 const page=await browser.newPage();await page.bringToFront();const originalWait=page.waitForFunction.bind(page);page.waitForFunction=(fn,opts,...args)=>originalWait(fn,{polling:100,...opts},...args);await page.setBypassServiceWorker(true);await page.setViewport({width:390,height:844});
 let fixture={id:'0465d8e6-0990-472c-9826-8c0d3dc55067',slug:'atlas-audio-test',title:'Things to Do in Los Angeles With Kids',status:'published',excerpt:'A complete family guide.',content_blocks:[{type:'paragraph',text:'Explore this family guide and listen to the complete article.'}],audio_url:base+'/__audio_qa__/female.mp3',audio_url_male:base+'/__audio_qa__/male.mp3',audio_duration:1154,view_count:0,author_name:'Tavvy',read_time_minutes:20};
 const errors=[],writes=[],generation=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{localStorage.setItem('@tavvy_theme_mode','light');localStorage.setItem('tavvy-locale','en');});
 await page.setRequestInterception(true);
 page.on('request',r=>{const u=new URL(r.url());const reply=(v,status=200)=>r.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':r.headers()['access-control-request-headers']||'*','access-control-allow-methods':'*'},body:JSON.stringify(v)});
  if(u.pathname.includes('hyper-service')){generation.push(u.pathname);return reply({},409);}
  if(u.pathname.startsWith('/__audio_qa__/')){if(u.pathname.includes('failed'))return reply({},404);return r.respond({status:200,contentType:'audio/mpeg',headers:{'accept-ranges':'bytes'},body:fs.readFileSync(u.pathname.includes('female')?female:male)});}
  if(r.method()==='OPTIONS')return reply({});
  if(u.hostname.endsWith('.supabase.co')){if(!['GET','HEAD'].includes(r.method())){writes.push(u.pathname);return reply({});}if(u.pathname.endsWith('/atlas_articles'))return reply(fixture);return reply(null);}
  if(!['GET','HEAD'].includes(r.method())){writes.push(u.pathname);return reply({},409);}
  if(u.origin===base||u.protocol==='data:')return r.continue();return r.abort();
 });
 try{
  await page.goto(base+'/app/article/atlas-audio-test',{waitUntil:'networkidle2',timeout:90000});
  await page.waitForFunction(()=>document.querySelector('audio')?.duration>1100,{timeout:30000});
  const initial=await page.$eval('audio',a=>a.duration);assert(Math.abs(initial-1153.608)<1);
  await page.$eval('input[aria-label="Audio position"]',e=>{e.value='600';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
  const range=await page.$('input[aria-label="Audio position"]');await range.focus();await page.keyboard.press('End');await page.keyboard.press('PageDown');
  await page.waitForFunction(()=>document.querySelector('audio').currentTime>1000 && document.querySelector('audio').currentTime<1100);
  await page.click('button[aria-label="Play"]');await page.waitForFunction(()=>!document.querySelector('audio').paused);await page.waitForSelector('button[aria-label="Pause"]');await page.click('button[aria-label="Pause"]');
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Male').click());
  await page.waitForFunction(()=>document.querySelector('audio')?.src.includes('male.mp3')&&!document.querySelector('audio')?.src.includes('female.mp3')&&document.querySelector('audio').duration>1000);
  const second=await page.$eval('audio',a=>({duration:a.duration,current:a.currentTime,paused:a.paused}));assert(Math.abs(second.duration-1096.632)<1);assert(second.current>1000);assert.equal(second.paused,true);
  const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));assert(width.document<=width.viewport+1,JSON.stringify(width));
  await page.$eval('audio',e=>e.parentElement.scrollIntoView({block:'center'}));await page.screenshot({path:out+'/article-audio-mobile.png'});
  await page.setViewport({width:320,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const targetSizes=await page.$$eval('button[aria-label="Back 15 seconds"],button[aria-label="Forward 15 seconds"],button[aria-label="Playback speed"]',els=>els.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert(targetSizes.length===3&&targetSizes.every(x=>x.w>=44&&x.h>=44));await page.setViewport({width:1280,height:900});await page.screenshot({path:out+'/article-audio-desktop.png'});
  fixture={...fixture,audio_url:null,audio_url_male:null};await page.goto(base+'/app/article/atlas-audio-test',{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.innerText.includes('Audio is not available for this article yet.'));assert.equal(await page.$('audio'),null);
  fixture={...fixture,audio_url:base+'/__audio_qa__/failed.mp3'};await page.goto(base+'/app/article/atlas-audio-test',{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.innerText.includes('Audio could not play. Tap Play to try again.'));
  assert.equal(generation.length,0);assert.deepEqual(errors,[]);
  const result={passed:true,femaleDuration:initial,maleDuration:second.duration,keyboardSeek:true,voiceSwitchPreservesPausedPosition:true,unavailable:true,mediaError:true,generationRequests:0,interceptedViewWrites:writes.length,realWrites:0,pageErrors:errors};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
