const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(client={}) {
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/orderService.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:()=>({supabase:client}),URL,Set,Number,Math,Error,console});return exports;
}
const draft={placeId:'place',tableNumber:'7',items:[{menu_item_id:'dish',quantity:2,notes:'No cheese'}],notes:'Allergy',customerName:'Guest',expectedTotal:26.72};
const order={id:'order',place_id:'place',status:'pending',subtotal:'24.68',tax:'2.04',total:'26.72',notes:'Allergy',items:[{id:'line',name:'Pasta',price:'12.34',quantity:2,notes:'No cheese',status:'pending'}]};
test('configured tax rounds in cents, fractional rates work, missing tax never creates a total',()=>{
 const {orderEstimate}=load();let estimate=orderEstimate([{price:12.34,quantity:2}],825);assert.equal(estimate.total,26.72);assert.equal(estimate.tax,2.04);
 assert.equal(orderEstimate([{price:12.34,quantity:2}],887.5).total,26.87);
 assert.equal(orderEstimate([{price:1.005,quantity:2}],0).subtotal,2.02);
 assert.equal(orderEstimate([{price:12.34,quantity:2}],null).total,null);assert.equal(orderEstimate([{price:12.34,quantity:2}],0).total,24.68);
});
test('table QR requires the exact HTTPS host, restaurant order route and table',()=>{
 const {parseTableQR}=load();assert.equal(parseTableQR('https://tavvy.com/place/place/order?table=7','place'),'7');
 for(const bad of ['https://evil.example/place/place/order?table=7','https://tavvy.com.evil.example/place/place/order?table=7','http://tavvy.com/place/place/order?table=7','https://tavvy.com/place/other/order?table=7','https://tavvy.com/place/place/menu?table=7','https://tavvy.com/place/place/order'])assert.equal(parseTableQR(bad,'place'),null);
});
test('quantity, line, duplicate, notes and expected-total boundaries are checked',()=>{
 const {validateOrderDraft}=load();validateOrderDraft(draft);
 for(const changed of [{tableNumber:''},{items:[]},{items:[{...draft.items[0],quantity:21}]},{items:[...draft.items,...draft.items]},{notes:'x'.repeat(1001)},{items:[{...draft.items[0],notes:'x'.repeat(501)}]},{expectedTotal:NaN}])assert.throws(()=>validateOrderDraft({...draft,...changed}));
});
test('submission requires auth and sends only item identity/quantity/notes to the atomic RPC',async()=>{
 let call;
 const client={auth:{getUser:async()=>({data:{user:{id:'customer'}}})},rpc:async(name,args)=>{call={name,args};return{data:order}}};
 const result=await load(client).submitOrder({...draft,items:[{...draft.items[0],price:0,name:'Forged'}]},'request-key');
 assert.equal(call.name,'submit_place_order');assert.equal(call.args.p_idempotency_key,'request-key');assert.equal(call.args.p_expected_total,26.72);assert.equal(call.args.p_items[0].price,undefined);assert.equal(call.args.p_items[0].name,undefined);assert.equal(result.items[0].price,12.34);assert.equal(result.notes,'Allergy');
 client.auth.getUser=async()=>({data:{user:null}});await assert.rejects(load(client).submitOrder(draft,'key'),/Sign in/);
});
test('missing RPC and server rejection never report a successful order',async()=>{
 const client={auth:{getUser:async()=>({data:{user:{id:'customer'}}})},rpc:async()=>({error:{message:'MENU_CHANGED: Refresh and review your total'}})};
 await assert.rejects(load(client).submitOrder(draft,'key'),/^Error: Refresh/);await assert.rejects(load(client).getOrderingContext('place'),/not available/);
});
test('staff transition includes expected status and cancellation reason',async()=>{
 let request;const client={rpc:async(name,args)=>{request={name,args};return{data:{...order,status:'cancelled',cancel_reason:'Sold out'}}}};
 const updated=await load(client).transitionOrder(order,'cancelled','Sold out');assert.equal(request.name,'transition_place_order');assert.equal(request.args.p_expected_status,'pending');assert.equal(request.args.p_reason,'Sold out');assert.equal(updated.status,'cancelled');
});
test('kitchen requires verified ownership and loads joined active orders separately from bounded history',async()=>{
 const calls=[];const client={rpc:async()=>({data:true}),from(table){const q={table};calls.push(q);const builder={select(v){q.select=v;return this},eq(k,v){q[k]=v;return this},in(k,v){q[k]=v;return this},order(){return this},range(a,b){q.range=[a,b];return Promise.resolve({data:[order]})},limit(n){q.limit=n;return Promise.resolve({data:[{...order,id:'history',status:'served'}]})}};return builder}};
 const rows=await load(client).getKitchenOrders('place');assert.equal(rows.length,2);assert.equal(calls[0].select,'*,items:order_items(*)');assert.ok(calls[0].status.includes('pending'));assert.ok(!calls[1].status.includes('pending'));assert.equal(rows[0].items[0].notes,'No cheese');
 client.rpc=async()=>({data:false});await assert.rejects(load(client).getKitchenOrders('place'),/verified/);assert.equal(calls.length,2);
});
test('web and mobile share the exact runtime ordering contract and SQL',()=>{
 const mobile=path.resolve(__dirname,'../../tavvy-mobile');if(!fs.existsSync(mobile))return;
 for(const name of ['lib/orderService.ts','supabase/migrations/202609210003_ordering_integrity.sql'])assert.equal(fs.readFileSync(path.resolve(__dirname,'..',name),'utf8'),fs.readFileSync(path.join(mobile,name),'utf8'));
});
