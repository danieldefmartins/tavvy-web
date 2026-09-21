const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),i18next=require('i18next');
const root=path.resolve(__dirname,'../..'),native=fs.existsSync(path.join(root,'i18n/locales/en/translation.json')),ns=native?'translation':'common';
const languages=['en','pt','es','fr','de','it','nl','ru','ar','tr','hi','id','th','vi','ja','ko','zh'];
const resources=Object.fromEntries(languages.map(lang=>[lang,{[ns]:JSON.parse(fs.readFileSync(path.join(root,native?`i18n/locales/${lang}/translation.json`:`public/locales/${lang}/common.json`)))}]));
let context;
function load(file){const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','exports',code)(id=>{if(['react-i18next','next-i18next'].includes(id))return{useTranslation:()=>context};if(id==='../lib/releaseCopy')return maps;throw Error(id)},exports);return exports;}
const maps=load('lib/releaseCopy.ts'),{useReleaseCopy}=load('hooks/useReleaseCopy.ts');
async function copyFor(lang){const i18n=i18next.createInstance();await i18n.init({lng:lang,defaultNS:ns,fallbackLng:'en',resources});context={t:i18n.t.bind(i18n),i18n};return useReleaseCopy();}
test('real copy hook resolves account, safety and eCard menu additions in EN/PT/ES',async()=>{
 const entries=Object.entries(maps.RELEASE_COPY_KEYS).filter(([,k])=>k.startsWith('accountFinish'));assert.ok(entries.length>75);
 for(const lang of ['en','pt','es']){const copy=await copyFor(lang);for(const[message,key]of entries){assert.equal(typeof resources[lang][ns].release[key],'string',lang+':'+key);assert.equal(copy(message),lang==='en'?message:resources[lang][ns].release[key]);}}
});
test('blocked-author scope retains all content categories and the place-summary distinction',async()=>{
 for(const [lang,word]of [['pt','resumos'],['es','resúmenes']]){const copy=await copyFor(lang);const message=Object.keys(maps.RELEASE_COPY_KEYS).find(k=>k.startsWith('Blocked authors are hidden'));const translated=copy(message);assert.ok(translated.includes(word));assert.ok(translated.includes('eCards'));assert.ok(!translated.includes('Blocked authors'));}
});
test('remaining supported languages retain fallback and user-provided text is untouched',async()=>{
 for(const lang of languages){const copy=await copyFor(lang);assert.equal(copy('Tavvy QA — client-provided name'),'Tavvy QA — client-provided name');if(!['en','pt','es'].includes(lang))assert.equal(copy('Blocked authors'),'Blocked authors');}
});
