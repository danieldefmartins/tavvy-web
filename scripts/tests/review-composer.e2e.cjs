const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer');
const base=process.env.TAVVY_PREVIEW_BASE||'http://127.0.0.1:3851',out='/private/tmp/tavvy-review-experience-20260922';fs.mkdirSync(out,{recursive:true});
const place='00000000-0000-4000-8000-000000000001',author='00000000-0000-4000-8000-000000000099',review='00000000-0000-4000-8000-000000000088';
const labels=[['restaurant_delicious_food','Delicious food','best_for'],['restaurant_cold_food','Food arrived cold','heads_up'],['generic_friendly_staff','Friendly staff','best_for'],['restaurant_lively','Lively atmosphere','vibe'],['restaurant_slow_service','Slow service','heads_up'],['hotel_quiet_rooms','Quiet rooms','best_for'],['hotel_noisy_rooms','Noisy rooms','heads_up']];
const catalog=labels.map(([slug,label,signal_type],i)=>({id:`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,slug,label,signal_type,icon_emoji:'',color:'#8A05BE',is_universal:slug.startsWith('generic_')}));
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();let past=false,fail=true,posts=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:390,height:844});await page.setBypassServiceWorker(true);
 await page.evaluateOnNewDocument(({author})=>{const user={id:author,aud:'authenticated',email:'review-fixture@example.invalid'};localStorage.setItem('sb-scasgwrikoqdwlwlwcff-auth-token',JSON.stringify({user,access_token:'fixture.token.only',refresh_token:'fixture',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600}));if(!localStorage.getItem('@tavvy_theme_mode'))localStorage.setItem('@tavvy_theme_mode','light');},{author});
 await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());
  if(u.origin===new URL(base).origin)return r.continue();
  if(!u.hostname.endsWith('.supabase.co'))return r.abort();
  const send=(v,status=200)=>r.respond({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':r.headers()['access-control-request-headers']||'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'},body:JSON.stringify(v)});
  if(r.method()==='OPTIONS')return send({});const name=u.pathname.split('/').at(-1);
  if(name==='user')return send({id:author,aud:'authenticated',email:'review-fixture@example.invalid'});
  if(name==='review_items')return send(catalog);
  if(name==='places')return send({id:place,tavvy_category:'restaurant'});
  if(name==='get_my_place_review_v2')return send(past?{id:review,place_id:place,user_id:author,public_note:'Previous public context',private_note_owner:'Private fixture kept',created_at:'2026-08-01T00:00:00Z',updated_at:'2026-08-01T00:00:00Z'}:null);
  if(name==='place_review_signal_taps')return send([{signal_id:catalog[0].id,intensity:3}]);
  if(name==='save_place_review_v2'){posts.push(JSON.parse(r.postData()));return fail?send({message:'Synthetic save failure'},503):send(review);}
  return send([]);
 });
 const visit=async(category='restaurant',locale='')=>{if(page.url().startsWith(base))await page.evaluate(value=>localStorage.setItem('tavvy-locale',value),locale.replace('/','')||'en');await page.goto(base+locale+'/app/add-review?'+new URLSearchParams({placeId:place,placeName:'Review QA Place',primaryCategory:category}),{waitUntil:'networkidle2'});await page.waitForSelector('.review-choices .choice');};
 const click=async(label,tag='button')=>{await page.evaluate(({label,tag})=>{const el=[...document.querySelectorAll(tag)].find(e=>e.textContent.trim()===label);if(!el)throw Error('Missing control: '+label);el.click();},{label,tag});};
 try{
  await visit();assert.equal(await page.$eval('footer .primary',e=>e.disabled),true);
  assert.equal(await page.$eval('.review-choices .main',e=>e.innerText.includes('Food arrived cold')),true);
  await click('Delicious food');assert.equal(await page.$$eval('.choice[aria-pressed=true]',a=>a.length),1);
  await click('Delicious food');assert.equal(await page.$$eval('.choice[aria-pressed=true]',a=>a.length),0);
  await click('Food arrived cold');await page.type('textarea','The food arrived cold during my visit.');
  await page.click('footer .primary');await page.waitForSelector('footer [role=alert]');assert.equal(await page.$eval('textarea',e=>e.value),'The food arrived cold during my visit.');assert.equal(posts[0].p_mode,'new_visit');assert.equal(posts[0].p_signals[0].signal_id,catalog[1].id);
  fail=false;await page.click('footer .primary');await page.waitForSelector('.success');assert.equal(posts.length,2);assert.equal(posts[0].p_request_key,posts[1].p_request_key);
  past=true;await visit();await click('Visit date · '+new Date().toLocaleDateString('en-CA'),'summary');await page.click('input[type=checkbox]');assert.equal(await page.$eval('textarea',e=>e.value),'Previous public context');assert.equal(await page.$$eval('.choice[aria-pressed=true]',a=>a.length),1);
  await page.click('footer .primary');await page.waitForSelector('.success');assert.equal(posts.at(-1).p_mode,'edit');assert.equal(posts.at(-1).p_signals[0].intensity,3);assert.equal(posts.at(-1).p_private_note,'Private fixture kept');assert.equal(posts.at(-1).p_visited_at,null);
  past=false;await visit('hotel');assert.match(await page.$eval('.main',e=>e.innerText),/The sleep/);assert.doesNotMatch(await page.$eval('.review-choices',e=>e.innerText),/Delicious food/);await page.screenshot({path:path.join(out,'composer-hotel-light.png')});
  await page.evaluate(()=>localStorage.setItem('@tavvy_theme_mode','dark'));await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.review-choices');assert.ok(Number((await page.$eval('.sheet',e=>getComputedStyle(e).backgroundColor)).match(/\d+/)[0])<80,'dark sheet uses dark background');await page.screenshot({path:path.join(out,'composer-hotel-dark.png')});
  await visit('restaurant','/pt');assert.match(await page.$eval('#review-title',e=>e.innerText),/atenção/);await page.screenshot({path:path.join(out,'composer-portuguese.png')});
  await visit('restaurant','/ar');assert.match(await page.$eval('#review-title',e=>e.innerText),/انتباهك/);assert.equal(await page.$eval('.sheet',e=>e.scrollWidth>e.clientWidth),false);await page.screenshot({path:path.join(out,'composer-arabic.png')});
  assert.deepEqual(errors,[]);console.log('PASS: balanced choices, single-tap removal, negative-only submission, failed-save retention, idempotent retry, original edit date/private note/intensity, hotel vocabulary, themes, PT/AR, no page errors; all requests intercepted.');
 }catch(e){await page.screenshot({path:path.join(out,'composer-failure.png'),fullPage:true});console.log(await page.$eval('body',e=>e.innerText.slice(-1800)),errors);throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
