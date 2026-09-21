const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const moduleRef={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../lib/ecard/premiumContent.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:moduleRef,exports:moduleRef.exports});
const {getProExtras,hasProExtras,hasCredentialContent,hasEnabledForm}=moduleRef.exports;
const extras=card=>Array.from(getProExtras(card));
test('Free card defaults have no Pro extras; checks never mutate a card',()=>{
 const card={gallery_images:[],videos:[],youtube_video_id:'',form_block:{enabled:false,webhookUrl:'https://example.invalid/keep'},pro_credentials:{licensed:false,yearsInBusiness:0,serviceArea:''}};
 const before=JSON.stringify(card);assert.equal(hasProExtras(card),false);assert.deepEqual(extras(card),[]);assert.equal(JSON.stringify(card),before);
});
test('actual gallery and embedded video content counts including URI and historical aliases',()=>{
 for(const card of [{gallery_images:[{url:'https://example.invalid/photo'}]},{galleryImages:[{uri:'https://example.invalid/photo',caption:'Keep'}]},{gallery_images:JSON.stringify([{url:'https://example.invalid/photo'}])},{gallery_images:[{url:'https://example.invalid/photo',visible:false,enabled:false,is_active:false}]}])assert.deepEqual(extras(card),['gallery']);
 for(const card of [{videos:[{url:'https://example.invalid/video',type:'external'}]},{videos:[{uri:'https://example.invalid/video'}]},{videos:[{videoId:'abc'}]},{youtube_video_id:'abc'},{youtube_video_url:'https://youtube.com/watch?v=abc'},{youtubeVideoId:'abc'},{youtubeVideoUrl:'https://youtube.com/watch?v=abc'}])assert.deepEqual(extras(card),['video']);
 assert.deepEqual(extras({gallery_images:[{id:'placeholder',caption:'Only metadata'},{url:'  '}],videos:[{type:'youtube',title:'Not yet added'}]}),[]);
});
test('forms match public defaults; disabled integrations stay saved without requiring Pro',()=>{
 for(const value of [null,false,[],{enabled:false,formType:'webhook',webhookUrl:'https://example.invalid/keep'},{enabled:false,fields:[{label:'Email'}]}])assert.equal(hasEnabledForm(value),false);
 for(const value of [true,{},{enabled:true},{formType:'native'},{fields:[{label:'Message'}]},JSON.stringify({formType:'webhook',webhookUrl:'https://example.invalid'})])assert.equal(hasEnabledForm(value),true);
 // These are not supported form visibility switches in the public renderer.
 assert.equal(hasEnabledForm({formType:'native',is_active:false,visible:false}),true);
});
test('credentials ignore empty/default flags, metadata and numeric zero; textual license zero remains substantive',()=>{
 for(const value of [null,[],{},'',{id:'uuid',type:'credentials',enabled:true,isLicensed:false,yearsInBusiness:0},{enabled:false,licenseNumber:'1234'}])assert.equal(hasCredentialContent(value),false);
 for(const value of [{licenseNumber:'0'},{licensed:true},{yearsInBusiness:1},[{name:'Board certification'}],JSON.stringify({licenseNumber:'1234'})])assert.equal(hasCredentialContent(value),true);
});
test('legacy configured blocks use the same four categories and retain explicit disabled state',()=>{
 const card={blocks:[{type:'gallery',data:{images:[{url:'https://example.invalid/photo'}]}},{type:'youtube',content:{videoId:'abc'}},{type:'form',data:{enabled:true}},{type:'credentials',data:{licenseNumber:'0'}}]};
 assert.deepEqual(extras(card),['gallery','video','form','credentials']);
 assert.deepEqual(extras({blocks:JSON.stringify(card.blocks)}),['gallery','video','form','credentials']);
 assert.deepEqual(extras({blocks:card.blocks.map(block=>({...block,enabled:false}))}),[]);
 assert.deepEqual(extras({blocks:[{type:'gallery',data:[]},{type:'video',data:{}},{type:'form',data:{enabled:false}},{type:'credentials',data:{yearsInBusiness:0}}]}),[]);
});
