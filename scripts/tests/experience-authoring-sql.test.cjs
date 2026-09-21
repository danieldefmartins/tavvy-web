// Synthetic in-memory database only. No live writes.
const {PGlite}=require('@electric-sql/pglite');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
const db=new PGlite(), owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;create table places(id uuid primary key,name text);grant select on places to authenticated;insert into auth.users values('${owner}'),('${other}');insert into places values('${owner}','Place one'),('${other}','Place two');`);
await db.exec(fs.readFileSync('supabase/migrations/202609080003_experience_paths.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/202609080008_experience_path_authoring.sql','utf8'));
await db.exec(`set role authenticated;set request.jwt.claim.sub='${owner}';`);
const save=async(id,title,publish,stops)=>(await db.query('select save_experience_path($1,$2,null,null,null,null,$3,$4::jsonb) as id',[id,title,publish,JSON.stringify(stops)])).rows[0].id;
const id=await save(null,'Private draft',false,[]);
assert.equal((await db.query('select owner_id from experience_paths where id=$1',[id])).rows[0].owner_id,owner);
await assert.rejects(save(id,'Cannot publish empty',true,[]),/at least one/);
assert.equal((await db.query('select title from experience_paths where id=$1',[id])).rows[0].title,'Private draft');
await save(id,'Published route',true,[{place_id:other,note:'First'},{place_id:owner,note:'Second'}]);
assert.deepEqual((await db.query('select place_id,position from experience_path_stops where path_id=$1 order by position',[id])).rows,[{place_id:other,position:0},{place_id:owner,position:1}]);
await assert.rejects(save(id,'Must roll back',false,[{place_id:owner},{place_id:'33333333-3333-4333-8333-333333333333'}]),/no longer available/);
assert.equal((await db.query('select title,is_published from experience_paths where id=$1',[id])).rows[0].title,'Published route');
assert.equal((await db.query('select count(*)::integer as n from experience_path_stops where path_id=$1',[id])).rows[0].n,2);
await db.exec(`set request.jwt.claim.sub='${other}';`);
await assert.rejects(save(id,'Hijack',false,[]),/not its owner/);
await db.exec(`reset role;set role anon;set request.jwt.claim.sub='';`);
assert.equal((await db.query('select id from experience_paths')).rows.length,1);
await assert.rejects(save(null,'Anonymous',false,[]),/permission denied/);
await db.exec(`reset role;set role authenticated;set request.jwt.claim.sub='${owner}';`);
await save(id,'Private again',false,[{place_id:owner}]);
await db.exec(`reset role;set role anon;set request.jwt.claim.sub='';`);
assert.equal((await db.query('select id from experience_paths')).rows.length,0);
await db.close();console.log('PASS: draft/publish/unpublish, ordered real stops, cross-owner protection, anonymous denial, atomic rollback');
})().catch(e=>{console.error(e);process.exitCode=1;});
