/* Offline component and payload tests; no reviews are sent to any server. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','exports','setTimeout',code)(name=>{if(name in dependencies)return dependencies[name];throw Error(`Unexpected import ${name}`)},exports,()=>0);
  return exports;
}
const selection = load('lib/signalTapSelection.ts');
let values = {};
for(const expected of [1,2,3,0,1]) { values=selection.cycleSignalTap(values,'a'); assert.equal(values.a||0,expected); }
assert.deepEqual(selection.restoreSignalTaps([{signalId:'a',intensity:3},{signalId:'bad',intensity:5}]),{a:3});
assert(selection.matchesSignalSearch({label:'Easy parking',slug:'restaurant_parking'},'easy parking'));
assert(selection.matchesSignalSearch({label:'Clean',slug:'bathroom_clean'},'bathroom'));
assert(!selection.matchesSignalSearch({label:'Clean',slug:'bathroom_clean'},'coffee'));
const catalog={best_for:[{id:'a',label:'Clean',slug:'clean',icon_emoji:'✨'},{id:'b',label:'Easy parking',slug:'parking',icon_emoji:'🚗'}],vibe:[],heads_up:[]};
let stored={review:{id:'review-1',public_note:'Keep note',private_note_owner:'Keep private note'},signals:[{signalId:'a',intensity:2}]};
let slots=[],cursor=0,effects=[],calls=[];
const react={
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}]},
 useMemo(fn){return fn()},
 useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i][j])){slots[i]=deps;effects.push(fn)}}
};
const Component=load('components/AddReviewSheet.tsx',{
 react,'react/jsx-runtime':require('react/jsx-runtime'),'next/router':{useRouter:()=>({asPath:'/app/place/place-1',push(){}})},
 '../contexts/AuthContext':{useAuth:()=>({user:{id:'user-1'}})},'../contexts/ThemeContext':{useThemeContext:()=>({isDark:false})},
 '../lib/signalService':{getSignalsForCategory:async()=>catalog},'../lib/signalTapSelection':selection,
 '../lib/reviewPersistence':{fetchUserReview:async()=>stored,submitReview:async(...args)=>{calls.push({kind:'create',args});return{success:true}},updateReview:async(...args)=>{calls.push({kind:'update',args});return{success:true}}}}).default;
const render=()=>{cursor=0;return Component({placeId:'place-1',placeName:'Place',open:true,onClose(){}})};
function nodes(tree){if(!tree)return[];if(Array.isArray(tree))return tree.flatMap(nodes);return typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[]}
const find=(tree,predicate)=>{const node=nodes(tree).find(predicate);assert(node,'Expected UI control');return node};
const chip=(tree,id)=>find(tree,n=>n.key===id&&n.type==='button');
async function mount(){render();for(const f of effects.splice(0))f();await new Promise(setImmediate);return render()}
(async()=>{
 let tree=await mount();assert(chip(tree,'a').props['aria-label'].includes('2 of 3 taps'));
 chip(tree,'a').props.onClick();tree=render();assert(chip(tree,'a').props['aria-label'].includes('3 of 3 taps'));
 chip(tree,'a').props.onClick();tree=render();assert.equal(chip(tree,'a').props['aria-pressed'],false);
 chip(tree,'a').props.onClick();tree=render();chip(tree,'a').props.onClick();tree=render();chip(tree,'a').props.onClick();tree=render();
 find(tree,n=>n.type==='input').props.onChange({target:{value:'parking'}});tree=render();assert(!nodes(tree).some(n=>n.key==='a'&&n.type==='button'));
 chip(tree,'b').props.onClick();tree=render();find(tree,n=>n.type==='input').props.onChange({target:{value:'no-such-signal'}});tree=render();assert.equal(find(tree,n=>n.props?.className==='empty').props.role,'status');await find(tree,n=>n.props?.className==='post').props.onClick();
 assert.deepEqual(calls[0],{kind:'update',args:['review-1','place-1',[{signalId:'a',intensity:3},{signalId:'b',intensity:1}],'Keep note','Keep private note']});
 slots=[];effects=[];stored={review:null,signals:[]};tree=await mount();for(let i=0;i<3;i++){chip(tree,'a').props.onClick();tree=render()}
 await find(tree,n=>n.props?.className==='post').props.onClick();assert.deepEqual(calls[1],{kind:'create',args:['place-1','Place',[{signalId:'a',intensity:3}]]});
 let rpc;
 const reviewId='11111111-1111-4111-8111-111111111111', signalId='22222222-2222-4222-8222-222222222222';
 const adapter=load('lib/reviewPersistence.ts',{'./supabaseClient':{supabase:{auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async(name,args)=>{rpc={name,args};return{data:reviewId}}}}});
 const result=await adapter.submitReview('place-id','Place',selection.selectedSignalTaps({[signalId]:3}));
 assert.equal(result.success,true);assert.deepEqual(rpc.args.p_signals,[{signal_id:signalId,intensity:3}]);
 assert.equal(rpc.name,'save_place_review');
 assert.equal(fs.readFileSync(path.join(root,'lib/signalTapSelection.ts'),'utf8'),fs.readFileSync(path.join(root,'../tavvy-mobile/lib/signalTapSelection.ts'),'utf8'));
 console.log('PASS: actual sheet cycle/restoration/accessible strength/search retention/create-update payloads; all offline mocks.');
})().catch(e=>{console.error(e);process.exitCode=1});
