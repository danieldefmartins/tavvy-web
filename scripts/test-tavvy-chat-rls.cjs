const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const schema = JSON.parse(fs.readFileSync('docs/schema-audit/public-schema.json'));
const u=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [customer,pro,outsider,provider,request,other,match]=[1,2,3,11,21,22,31].map(u);
const db=new PGlite();
(async()=>{
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('role',auth.role())$$;
create table auth.users(id uuid primary key);
create table pro_providers(id uuid primary key,user_id uuid not null references auth.users,is_active boolean default true);
create table project_requests(id uuid primary key,user_id uuid references auth.users);
create table pro_request_matches(id uuid primary key,request_id uuid references project_requests,pro_id uuid references pro_providers,pro_status text default 'pending');
create table pro_subscriptions(id uuid primary key,provider_id uuid references pro_providers,status text,end_date timestamptz);
create table blocked_users(id uuid default gen_random_uuid() primary key,blocker_id uuid references auth.users,blocked_id uuid references auth.users,unique(blocker_id,blocked_id));
create table pro_messages(id uuid default gen_random_uuid() primary key,match_id uuid not null references pro_request_matches,sender_type text not null check(sender_type in ('customer','pro')),sender_id uuid not null,message_type text default 'text',content text not null);
create function is_super_admin() returns boolean language sql stable as $$select false$$;
create function get_customer_request_ids(uid uuid) returns setof uuid language sql stable security definer as $$select id from public.project_requests where user_id=uid$$;
create function get_matched_request_ids_for_user(uid uuid) returns setof uuid language sql stable security definer as $$select m.request_id from public.pro_request_matches m join public.pro_providers p on p.id=m.pro_id where p.user_id=uid$$;
grant usage on schema public,auth to authenticated,anon; grant all on all tables in schema public to authenticated,anon;
insert into auth.users values ('${customer}'),('${pro}'),('${outsider}');
insert into pro_providers values ('${provider}','${pro}',true);
insert into project_requests values ('${request}','${customer}'),('${other}','${outsider}');
insert into pro_request_matches(id,request_id,pro_id) values ('${match}','${request}','${provider}');`);
const q=s=>'"'+s.replaceAll('"','""')+'"';
for(const table of ['pro_providers','project_requests','pro_request_matches','pro_subscriptions','blocked_users','pro_messages']) {
 await db.exec(`alter table ${q(table)} enable row level security`);
 for(const p of schema.policies.filter(p=>p.table===table)) await db.exec(`create policy ${q(p.name)} on ${q(table)} for ${p.command} to ${p.roles.map(q).join(',')} ${p.using?`using (${p.using})`:''} ${p.check?`with check (${p.check})`:''}`);
}
await db.exec(fs.readFileSync('supabase/migrations/202609080004_pro_messages_participants.sql','utf8'));
async function actor(user,sql){await db.exec('begin');try{await db.exec(`set local role authenticated;select set_config('request.jwt.claim.sub','${user}',true);select set_config('request.jwt.claim.role','authenticated',true)`);return await db.query(sql)}finally{await db.exec('rollback')}}
const rpc=f=>`select public.${f}('${match}') as result`;
for(const [id,role] of [[customer,'customer'],[pro,'pro'],[outsider,null]]) assert.equal((await actor(id,rpc('tavvy_chat_role'))).rows[0].result,role);
const send=(id,type='customer',content='hello')=>`insert into pro_messages(match_id,sender_id,sender_type,content) values ('${match}','${id}','${type}','${content}') returning id`;
assert.equal((await actor(customer,send(customer))).rows.length,1);
for(const [actorId,sender,type] of [[pro,pro,'pro'],[outsider,outsider,'customer'],[customer,pro,'pro'],[customer,customer,'pro']]) await assert.rejects(actor(actorId,send(sender,type)));
await assert.rejects(actor(customer,send(customer,'customer','  ')));
await db.exec(`insert into pro_subscriptions values ('${u(41)}','${provider}','active',now()+interval '1 day')`);
assert.equal((await actor(pro,send(pro,'pro'))).rows.length,1);
await db.exec(`update pro_subscriptions set end_date=now()-interval '1 day'`);await assert.rejects(actor(pro,send(pro,'pro')));
await db.exec(`update pro_subscriptions set end_date=now()+interval '1 day'`);
await db.exec(send(pro,'pro'));
for(const [id,count] of [[customer,1],[pro,1],[outsider,0]]) assert.equal((await actor(id,'select * from pro_messages')).rows.length,count);
for(const [a,b] of [[customer,pro],[pro,customer]]){await db.exec(`insert into blocked_users(blocker_id,blocked_id) values ('${a}','${b}')`);await assert.rejects(actor(customer,send(customer)));await assert.rejects(actor(pro,send(pro,'pro')));await db.exec('delete from blocked_users')}
for(const [column,value] of [['request_id',other],['pro_id',u(12)],['id',u(32)]]) await assert.rejects(actor(pro,`update pro_request_matches set ${column}='${value}' where id='${match}'`));
assert.equal((await actor(pro,`update pro_request_matches set pro_status='viewed' where id='${match}' returning id`)).rows.length,1);
assert.equal((await actor(outsider,`update pro_request_matches set pro_status='viewed' where id='${match}' returning id`)).rows.length,0);
assert.equal((await actor(customer,`update pro_messages set content='tampered' returning id`)).rows.length,0);
assert.equal((await actor(pro,`update pro_subscriptions set end_date=now()+interval '100 years' returning id`)).rows.length,0);
await assert.rejects(actor(pro,`update pro_providers set user_id='${outsider}' where id='${provider}'`));
await assert.rejects(actor(customer,`insert into blocked_users(blocker_id,blocked_id) values ('${pro}','${outsider}')`));
console.log('PASS offline PostgreSQL RLS: participant roles/reads, outsider isolation, sender/role spoofing, block both directions, active/expired subscription, immutable match identities, allowed status update, unauthorized message/subscription edits, provider transfer/blocker spoofing');
await db.close();
})().catch(async e=>{console.error(e);await db.close();process.exitCode=1});
