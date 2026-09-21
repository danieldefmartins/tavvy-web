const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript');
const root=process.env.NATIVE_ROOT||path.resolve(__dirname,'../..');
function deferred(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j});return{promise,resolve,reject};}
function harness(){
 let user={id:'account-a'},slots=[],index=0,effects=[],tree,unmounted=false,lateSets=0,notified=0;const reads=[],writes=[];
 const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useState(initial){const i=index++;if(!slots[i])slots[i]={value:initial};return[slots[i].value,value=>{if(unmounted)lateSets++;slots[i].value=typeof value==='function'?value(slots[i].value):value;}];},useRef(value){const i=index++;if(!slots[i])slots[i]={value:{current:value}};return slots[i].value;},useEffect(fn,deps){const i=index++;const old=slots[i];if(!old||!equal(old.deps,deps)){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},createElement(type,props,...children){return{type,props:{...props,children}};},Fragment:'Fragment'};
 const jsx=(type,props)=>({type,props});const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,'components/BlockedAuthors.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','exports',code)(name=>{
  if(name==='react')return hooks;if(name==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'Fragment'};
  if(name==='react-native')return Object.fromEntries(['View','Text','TouchableOpacity','Modal','SafeAreaView','ScrollView'].map(x=>[x,x]));
  if(name.includes('AuthContext'))return{useAuth:()=>({user})};if(name.includes('ThemeContext'))return{useThemeContext:()=>({theme:{text:'#111',textSecondary:'#555',border:'#ddd',background:'#fff'}})};
  if(name.includes('useReleaseCopy'))return{useReleaseCopy:()=>s=>s};if(name.includes('ContentSafetyActions'))return{notifyContentSafetyChanged:()=>notified++};
  if(name.includes('contentSafety'))return{CONTENT_BLOCK_SCOPE:'Personal scope',listBlockedAuthors:()=>{const d=deferred();reads.push(d);return d.promise;},unblockAuthor:(...args)=>{const d=deferred();writes.push({...d,args});return d.promise;}};throw Error(name);
 },exports);
 function render(flush=true){index=0;tree=exports.default();if(flush){const pending=effects;effects=[];pending.forEach(fn=>fn());}return tree;}
 function nodes(n=tree){if(Array.isArray(n))return n.flatMap(x=>nodes(x));if(!n||typeof n!=='object')return[];if(n.type==='Modal'&&n.props.visible===false)return[];return[n,...nodes(n.props?.children)];}
 function text(n=tree){if(Array.isArray(n))return n.map(x=>text(x)).join(' ');if(n==null||typeof n==='boolean')return'';if(typeof n!=='object')return String(n);if(n.type==='Modal'&&n.props.visible===false)return'';return text(n.props?.children);}
 function click(label){const node=nodes().find(n=>(n.props?.onClick||n.props?.onPress)&&text(n).trim()===label);assert(node,'Missing '+label);(node.props.onClick||node.props.onPress)();}
 return{render,text,click,reads,writes,setUser:id=>{user=id?{id}:null},unmount(){unmounted=true;slots.forEach(x=>x?.cleanup?.());},get lateSets(){return lateSets},get notified(){return notified}};
}
const tick=async()=>{await Promise.resolve();await Promise.resolve();};const row=(name)=>({id:'77000300-0000-4000-8000-000000000021',displayName:name,createdAt:'2026-09-21'});
function start(){const h=harness();h.render();h.click('Blocked authors');h.render();return h;}
test('late account A list cannot replace B feed; existing A rows hide before auth effects run',async()=>{
 const h=start();h.setUser('account-b');h.render();h.reads[1].resolve([row('B private list')]);await tick();h.render();h.reads[0].resolve([row('A private list')]);await tick();h.render();assert(h.text().includes('B private list'));assert(!h.text().includes('A private list'));
 h.setUser('account-c');h.render(false);assert(!h.text().includes('B private list'));assert(h.text().includes('Loading…'));
});
test('late unblock from A cannot alter B rows, errors, busy state or refresh events',async()=>{
 const h=start();h.reads[0].resolve([row('A private list')]);await tick();h.render();h.click('Unblock');h.render();assert.deepEqual(h.writes[0].args,[row('').id]);
 h.setUser('account-b');h.render(false);assert(!h.text().includes('A private list'));h.render();h.reads[1].resolve([row('B private list')]);await tick();h.render();h.writes[0].resolve();await tick();h.render();assert(h.text().includes('B private list'));assert(!h.text().includes('Saving…'));assert.equal(h.notified,0);
});
test('failed old unblock cannot expose another account error',async()=>{
 const h=start();h.reads[0].resolve([row('A private list')]);await tick();h.render();h.click('Unblock');h.render();h.setUser('account-b');h.render();h.reads[1].resolve([row('B private list')]);await tick();h.writes[0].reject(Error('A private failure'));await tick();h.render();assert(!h.text().includes('A private failure'));assert(h.text().includes('B private list'));assert.equal(h.notified,0);
});
test('close and unmount invalidate pending list and unblock completions',async()=>{
 const h=start();h.click(fs.existsSync(path.join(root,'screens/PlaceDetailsScreen.tsx'))?'Close':'Blocked authors');h.render();h.reads[0].resolve([row('Closed private list')]);await tick();h.click('Blocked authors');h.render();assert(!h.text().includes('Closed private list'));h.unmount();h.reads[1].reject(Error('Unmounted request'));await tick();assert.equal(h.lateSets,0);
 const m=start();m.reads[0].resolve([row('A private list')]);await tick();m.render();m.click('Unblock');m.unmount();m.writes[0].resolve();await tick();assert.equal(m.lateSets,0);assert.equal(m.notified,0);
});
