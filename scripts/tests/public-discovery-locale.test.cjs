const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),i18next=require('i18next');
const root=path.resolve(__dirname,'../..'),native=fs.existsSync(path.join(root,'i18n/locales/en/translation.json')),ns=native?'translation':'common';
const languages=['en','pt','es','fr','de','it','nl','ru','ar','tr','hi','id','th','vi','ja','ko','zh'];
const resources=Object.fromEntries(languages.map(lang=>[lang,{[ns]:JSON.parse(fs.readFileSync(path.join(root,native?`i18n/locales/${lang}/translation.json`:`public/locales/${lang}/common.json`)))}]));
let context;
function load(file){const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','exports',code)(id=>{if(['react-i18next','next-i18next'].includes(id))return{useTranslation:()=>context};if(id==='../lib/releaseCopy')return maps;throw Error(id)},exports);return exports;}
const maps=load('lib/releaseCopy.ts'),{useReleaseCopy}=load('hooks/useReleaseCopy.ts'),{reviewSummaryCopy,reviewMentionCopy}=load('lib/reviewSummaryCopy.ts');
async function copyFor(lang){const i18n=i18next.createInstance();await i18n.init({lng:lang,defaultNS:ns,fallbackLng:'en',resources});context={t:i18n.t.bind(i18n),i18n};return useReleaseCopy();}
test('41 explicit public discovery phrases resolve in all17 catalogs without fallback',async()=>{
 const entries=Object.entries(maps.RELEASE_COPY_KEYS).filter(([,k])=>k.startsWith('publicFinish'));assert.equal(new Set(entries.map(([,key])=>key)).size,41);
 for(const lang of languages){const copy=await copyFor(lang);for(const[message,key]of entries){const value=resources[lang][ns].release[key];assert.equal(typeof value,'string',lang+':'+key);assert.ok(value.trim());assert.equal(copy(message),lang==='en'?message:value);assert.deepEqual([...value.matchAll(/\{\{\w+\}\}/g)].map(m=>m[0]),[...message.matchAll(/\{\{\w+\}\}/g)].map(m=>m[0]));}}
});
test('review summary translates only fixed system phrases, never customer or signal text',async()=>{
 const copy=await copyFor('pt'),calls=[];const tracked=message=>{calls.push(message);return copy(message)};
 assert.equal(reviewSummaryCopy('Recent reviews unavailable',tracked),'Avaliações recentes indisponíveis');assert.equal(reviewSummaryCopy('The campsite',tracked),'O local de camping');
 for(const text of ['A customer named Read Article','The food: Great pasta','Fresh ingredients','<script>user text</script>'])assert.equal(reviewSummaryCopy(text,tracked),text);
 assert.deepEqual(calls,['Recent reviews unavailable','The campsite']);
});
test('review counts and empty/loading/unavailable states retain their distinct meaning',async()=>{
 for(const lang of languages){const copy=await copyFor(lang);assert.notEqual(reviewSummaryCopy('Loading recent reviews…',copy),reviewSummaryCopy('Recent reviews unavailable',copy));assert.notEqual(reviewSummaryCopy('No recent concerns reported',copy),reviewSummaryCopy('More recent reviews needed',copy));assert(!reviewMentionCopy(1,copy).includes('{{'));assert(reviewMentionCopy(5,copy).includes('5'));}
});
test('catalog IDs and data queries stay language-independent on screenshot paths',()=>{
 const rv=fs.readFileSync(path.join(root,native?'screens/RVCampingBrowseScreen.tsx':'pages/app/rv-camping.tsx'),'utf8');assert.match(rv,/RV_CATEGORIES\.map/);assert.match(rv,/copy\(item\.label\)/);assert(!rv.includes('setCategory(copy'));
 const atlas=fs.readFileSync(path.join(root,native?'screens/AtlasHomeScreen.tsx':'pages/app/atlas/index.tsx'),'utf8');assert.match(atlas,/handleCategorySelect\(category\.id\)/);assert.match(atlas,/\{featuredArticle\.title\}/);assert(!atlas.includes('copy(featuredArticle.title)'));assert.match(atlas,/placeholder=\{copy\("Search articles\.\.\."\)\}/);
});
