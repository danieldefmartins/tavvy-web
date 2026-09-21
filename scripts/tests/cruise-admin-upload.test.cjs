const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..'),platform=require('../../package.json').name==='tavvy-web'?'web':'native',sid='02700000-0000-4000-8000-000000000001',iid='02700000-0000-4000-8000-000000000002',other='02700000-0000-4000-8000-000000000003';
const url=`https://scasgwrikoqdwlwlwcff.supabase.co/storage/v1/object/public/universe-images/cruise-ships/${sid}/${iid}.webp`;
const photo={origin:'admin_upload',image_id:iid,url,alt:'',permission_verified:false,source_id:null};
const row={id:iid,url,alt:'Ship',caption:null,origin:'admin_upload',source_id:null,width:1600,height:900};
const source={id:'official',url:'https://example.invalid/facts',publisher:'Fixture operator',checked_at:'2026-09-20',source_type:'operator'};
const ship={id:sid,universe_id:other,name:'Fixture Ship',slug:'fixture-ship',operator_name:'Fixture Line',operator_id:'fixture',kind:'ocean',publication_status:'published',operating_status:'operating',identity_verified:true,overnight_public_cruise:true,status_source_ids:['official'],imo:null,eni:null,facts:[],name_history:[],cabin_categories:[],photo};
function loader(platform){const cache=new Map();return function load(rel){const file=path.resolve(root,rel);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','exports',code)(name=>{if(name.includes('supabaseClient'))return{supabase:{rpc(){throw Error('Unexpected network')}}};if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));return require(name)},exports);return exports}}
for(const platform of [require('../../package.json').name==='tavvy-web'?'web':'native']){const load=loader(platform),catalog=load('lib/cruises/catalog.ts'),gallery=load('lib/cruises/gallery.ts');
 test(platform+' registered unsourced admin cover is visible without falsifying provenance',()=>{const original=JSON.stringify(photo),visible=catalog.visibleCruisePhoto(ship);assert.equal(visible.url,url);assert.equal(visible.alt,'Fixture Ship');assert.equal(visible.permission_verified,false);assert.equal(visible.source_id,null);assert.equal(JSON.stringify(photo),original)});
 test(platform+' arbitrary/external/other ship/other image marker cannot bypass cover checks',()=>{for(const changed of [{url:'https://example.invalid/photo.webp'},{url:url.replace('scasgwrikoqdwlwlwcff','anotherproject')},{image_id:other},{url:url.replace(sid,other)},{url:url+'?download=1'},{url:url+'#x'},{url:url.replace('https:','http:')},{url:url.replace('https://','https://user:password@')},{url:url.replace('/public/','/sign/')},{url:url.replace('.webp','.svg')},{permission_verified:undefined},{source_id:{}}])assert.equal(catalog.visibleCruisePhoto({...ship,photo:{...photo,...changed}}),null,JSON.stringify(changed))});
 test(platform+' legacy approved external photo is preserved and unapproved external stays hidden',()=>{const legacy={url:'https://example.invalid/original.jpg',alt:'Original',source_id:'official',permission_verified:true};assert.equal(catalog.visibleCruisePhoto({...ship,photo:legacy}).url,legacy.url);assert.equal(catalog.visibleCruisePhoto({...ship,photo:{...legacy,permission_verified:false}}),null);assert.equal(catalog.visibleCruisePhoto({...ship,photo:{...legacy,origin:'other'}}),null)});
 test(platform+' registered unsourced gallery remains visible and cover deduplicates',async()=>{const rows=await gallery.readCruiseGallery(sid,{rpc:async()=>({data:[row],error:null})});assert.equal(rows.length,1);assert.equal(rows[0].source_id,null);assert.equal(rows[0].origin,'admin_upload');assert.equal(gallery.galleryWithCover(rows,{url,alt:'Ship'}).length,1)});
 test(platform+' malformed or unrelated admin gallery rejects honestly',async()=>{for(const changed of [{url:'https://example.invalid/a.webp'},{url:url.replace('scasgwrikoqdwlwlwcff','other')},{id:other},{url:url.replace(sid,other)},{source_id:undefined},{origin:'unknown'},{width:0},{height:2401},{alt:null},{caption:42},{url:url+'?x=1'}])await assert.rejects(()=>gallery.readCruiseGallery(sid,{rpc:async()=>({data:[{...row,...changed}],error:null})}),/Invalid ship photo/);await assert.rejects(()=>gallery.readCruiseGallery(sid,{rpc:async()=>({data:[row,row],error:null})}),/Invalid ship photo/)});
 test(platform+' legacy gallery with source still accepted, unmarked unsourced row rejected',async()=>{const legacy={...row,source_id:'official'};delete legacy.origin;assert.equal((await gallery.readCruiseGallery(sid,{rpc:async()=>({data:[legacy],error:null})})).length,1);await assert.rejects(()=>gallery.readCruiseGallery(sid,{rpc:async()=>({data:[{...legacy,source_id:null}],error:null})}),/Invalid ship photo/)});
 test(platform+' ship facts/status/venues still require sources',()=>{assert.equal(catalog.cruisePublicationProblems(ship,[source]).length,0);assert(catalog.cruisePublicationProblems(ship,[]).length);const fact={key:'year_built',value:2001,verification:'verified',as_of:'2026-09-20',source_ids:['official']};assert.equal(catalog.displayCruiseFacts({...ship,facts:[fact]},[]).length,0);assert.equal(catalog.displayCruiseFacts({...ship,facts:[fact]},[source]).length,1);assert.equal(catalog.visibleCruiseVenues({ship,sources:[],venues:[{ship_id:sid,verification:'verified',source_ids:['official']}]}).length,0)});
 if(platform==='web')test('web sharing uses registered unsourced cover; invalid marker keeps safe generated fallback',()=>{const {cruiseShareMetadata}=load('lib/cruises/share.ts');const share=cruiseShareMetadata({ship,sources:[source],venues:[]});assert.equal(share.image,url);assert.equal(share.imageAlt,'Fixture Ship');assert.equal(share.generatedImage,false);const hidden=cruiseShareMetadata({ship:{...ship,photo:{...photo,url:'https://example.invalid/a'}},sources:[source],venues:[]});assert.equal(hidden.generatedImage,true);assert(hidden.image.includes('/api/og/cruise/'))});
}

function renderPhotoSurface(relative,detailValue,stateOverrides){
 let stateIndex=0;const react={useState(initial){const i=stateIndex++;return[i in stateOverrides?stateOverrides[i]:typeof initial==='function'?initial():initial,()=>{}]},useEffect(){},useRef:initial=>({current:initial}),useMemo:fn=>fn(),Fragment:'Fragment'};
 const jsx=(type,props)=>({type,props}),exp={},file=path.join(root,relative),load=loader(platform);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','exports',code)(name=>{
  if(name==='react')return react;if(name==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'Fragment'};
  if(name==='react-native')return{...Object.fromEntries(['View','Text','Image','SafeAreaView','ScrollView','TouchableOpacity','ActivityIndicator','TextInput'].map(k=>[k,k])),StyleSheet:{create:s=>s},Keyboard:{dismiss(){}}};
  if(name==='next/router')return{useRouter:()=>({locale:'en',query:{},isReady:true,back(){},replace(){}})};
  if(name==='@react-navigation/native')return{useNavigation:()=>({goBack(){},navigate(){}})};
  if(name.includes('ThemeContext'))return{useThemeContext:()=>({isDark:false,theme:{}})};
  if(name.includes('useReleaseCopy'))return{useReleaseCopy:()=>x=>x};
  if(name.endsWith('/catalog'))return load('lib/cruises/catalog.ts');if(name.endsWith('/directoryState'))return load('lib/cruises/directoryState.ts');if(name.endsWith('/share'))return load('lib/cruises/share.ts');
  if(name.endsWith('/service'))return{};if(name==='react-icons/io5')return{IoBoatOutline:'IoBoatOutline',IoChevronDown:'IoChevronDown'};if(name==='@expo/vector-icons')return{Ionicons:'Ionicons'};
  if(name==='next-i18next/serverSideTranslations')return{serverSideTranslations(){}};
  if(name.includes('StoriesRow'))return{default:'StoriesRow',StoriesRow:'StoriesRow'};
  if(['next/head','next/link'].includes(name)||/AppLayout|ToolHeader|PlaceShareHead|CruiseReviewPanel|CruisePhotoGallery/.test(name))return{default:name};
  throw Error('Unhandled component dependency '+name);
 },exp);
 const tree=exp.default({detail:detailValue,reviews:null,universeId:detailValue.ship.universe_id,onBack(){}});
 const all=n=>Array.isArray(n)?n.flatMap(all):n&&typeof n==='object'?[n,...all(n.props?.children)]:[];
 return all(tree).filter(n=>n.type==='img'||n.type==='Image').map(n=>n.props.src||n.props.source?.uri);
}
test(platform+' actual directory and hero render an unsourced admin cover and reject malformed marker',()=>{
 const detail={ship,sources:[source],venues:[]};
 const directory=platform==='web'?'pages/app/cruises/index.tsx':'components/cruises/CruiseDirectory.tsx';
 const hero=platform==='web'?'components/cruises/CruiseShipView.tsx':'components/cruises/CruiseUniverse.tsx';
 const states=platform==='web'?{1:true,2:[detail],3:[],4:false}:{1:[detail],2:[],3:false};
 assert(renderPhotoSurface(directory,detail,states).includes(url));
 assert(renderPhotoSurface(hero,detail,platform==='native'?{0:detail,2:false}:{}).includes(url));
 const invalid={...detail,ship:{...ship,photo:{...photo,image_id:other}}};
 const invalidStates=platform==='web'?{1:true,2:[invalid],3:[],4:false}:{1:[invalid],2:[],3:false};
 assert(!renderPhotoSurface(directory,invalid,invalidStates).includes(url));
 assert(!renderPhotoSurface(hero,invalid,platform==='native'?{0:invalid,2:false}:{}).includes(url));
});

test(platform+' inactive upload absence from the public projection stays empty',async()=>{
 const load=loader(platform),catalog=load('lib/cruises/catalog.ts'),gallery=load('lib/cruises/gallery.ts'),calls=[];
 assert.equal(catalog.visibleCruisePhoto({...ship,photo:null}),null);
 const photos=await gallery.readCruiseGallery(sid,{rpc:async(name,args)=>{calls.push({name,args});return {data:[],error:null}}});
 assert.equal(photos.length,0);assert.equal(gallery.galleryWithCover(photos,null).length,0);
 assert.equal(calls[0].name,'get_cruise_ship_gallery_v1');assert.equal(calls[0].args.p_ship_id,sid);
});
