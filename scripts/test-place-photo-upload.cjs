const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),path=require('node:path');
const place='00000000-0000-0000-0000-000000000001',user='00000000-0000-0000-0000-000000000002';
function setup(opts={}){
 const calls=[];const store={upload:async(name)=>{calls.push(['upload',name]);return {error:opts.uploadError?Error('upload failed'):null}},getPublicUrl:()=>({data:{publicUrl:'https://example.test/photo.jpg'}}),remove:async names=>{calls.push(['cleanup',names]);return {error:null}}};
 const db={rpc:async(name,args)=>{calls.push([name,args]);return {data:opts.invalidPlace?'invalid':place,error:opts.resolveError?Error('unavailable'):null}},storage:{from:()=>store},from:table=>({insert:row=>{calls.push([table,row]);return {select:()=>({single:async()=>({data:{id:place},error:opts.insertError?Error('details failed'):null})})}}})};
 const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../tavvy-mobile/lib/placePhotoUpload.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ex={};new Function('require','exports',code)(()=>({supabase:db}),ex);return {ex,calls};
}
(async()=>{
for(const opts of [{resolveError:true},{invalidPlace:true}]){const h=setup(opts);await assert.rejects(h.ex.uploadPlacePhoto('fsq:test',user,new Uint8Array(),'caption'));assert.equal(h.calls.length,1,'resolution failure cannot upload');}
const failed=setup({insertError:true});await assert.rejects(failed.ex.uploadPlacePhoto('fsq:test',user,new Uint8Array(),'caption'),/details could not be saved/);assert.ok(failed.calls.some(c=>c[0]==='cleanup'));
const good=setup();await good.ex.uploadPlacePhoto('fsq:test',user,new Uint8Array(),'caption');assert.equal(good.calls[0][1].p_identifier,'test');assert.ok(good.calls.find(c=>c[0]==='upload')[1].startsWith(user+'/'));assert.equal(good.calls.find(c=>c[0]==='place_photos')[1].place_id,place);
console.log('Photo upload: controlled promotion, unresolved-place rejection, metadata failure cleanup and uploader-owned storage path passed.');
})().catch(e=>{console.error(e);process.exit(1)});
