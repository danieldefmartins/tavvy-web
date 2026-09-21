const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',file+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});return exports;}
const {createOwnerRequestScope}=load('ownerRequestScope'),{menuAppearance}=load('menuAppearance');
const source=fs.readFileSync(path.join(__dirname,'../pages/place/[id]/menu-editor.tsx'),'utf8'),ast=ts.createSourceFile('menu-editor.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),handlers={};
function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){let value=node.initializer;if(ts.isCallExpression(value)&&value.expression.getText(ast)==='useCallback')value=value.arguments[0];if(ts.isArrowFunction(value))handlers[node.name.text]=value.getText(ast);}ts.forEachChild(node,visit)}visit(ast);
function harness(name,response={data:{id:'saved'},error:null},canEdit=true){
 const calls=[],toasts=[],scope=createOwnerRequestScope('ownerA:placeA');let reloads=0;
 const db={from(table){const query={};calls.push({table,steps:[]});const row=calls.at(-1);for(const step of ['insert','update','delete','eq','select'])query[step]=(...args)=>{row.steps.push([step,...args]);return query};query.single=()=>typeof response==='function'?response():Promise.resolve(response);return query;}};
 const context={scope,canEdit,saving:false,user:{id:'ownerA'},id:'placeA',placeName:'Restaurant',menu:{id:'menuA',name:'Menu',style:'elegant_ivory',photo_gallery_enabled:false},editingItem:{id:'itemA',name:'Pasta',category_id:'categoryA',meal_period:'dinner'},editingCategory:{id:'categoryA',name:'Dinner'},items:[],supabase:db,menuAppearance,showToast:m=>toasts.push(m),loadData:async()=>{reloads++}};
 for(const setter of ['setSaving','setEditingItem','setEditingCategory','setDeleteConfirm'])context[setter]=()=>{};
 vm.runInNewContext(ts.transpileModule('globalThis.run='+handlers[name],{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 return{run:context.run,calls,toasts,scope,get reloads(){return reloads}};
}
const actions=['createMenu','saveItem','deleteItem','saveCategory','deleteCategory','saveSettings','savePromotions'];
for(const name of actions){
 test(`${name} reports success only with a returned saved row`,async()=>{const h=harness(name);await h.run('id');assert.equal(h.calls.length,1);assert.ok(h.calls[0].steps.some(s=>s[0]==='select'&&s[1]==='id'));if(name!=='createMenu')assert.equal(h.toasts.length,1);});
 for(const response of [{data:null,error:{code:'42501'}},{data:null,error:null}])test(`${name} rejects ${response.error?'server rejection':'unconfirmed zero-row operation'}`,async()=>{const h=harness(name,response);await h.run('id');assert.equal(h.reloads,0);assert.equal(h.toasts.length,1);assert.match(h.toasts[0],/error|unable/i);assert.doesNotMatch(h.toasts[0],/saved|updated|added|deleted/i)});
 test(`${name} is inert without current verified UI access`,async()=>{const h=harness(name,undefined,false);await h.run('id');assert.equal(h.calls.length,0)});
 test(`${name} cannot publish old-account success after identity changes`,async()=>{let release;const h=harness(name,()=>new Promise(resolve=>{release=resolve}));const pending=h.run('id');h.scope.setIdentity('ownerB:placeA');release({data:{id:'saved'},error:null});await pending;assert.equal(h.reloads,0);assert.equal(h.toasts.length,0)});
}
test('the actual item save persists the selected meal period',async()=>{const h=harness('saveItem');await h.run();assert.equal(h.calls[0].steps.find(s=>s[0]==='update')[1].meal_period,'dinner')});
test('scope rejects A→B→A and unmounted callbacks, retaining fresh callbacks',()=>{const s=createOwnerRequestScope('A'),old=s.capture();s.setIdentity('B');s.setIdentity('A');assert.equal(old(),false);const current=s.capture();assert.equal(current(),true);s.close();assert.equal(current(),false);s.activate();assert.equal(s.capture()(),true);assert.equal(current(),false)});
