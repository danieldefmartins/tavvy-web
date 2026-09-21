/* Offline PostgreSQL execution with exact audited columns; geography is a text domain,
 * so real PostGIS casts/triggers and concurrent connections still need staging verification. */
const { PGlite } = require('@electric-sql/pglite');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const schema = require(path.join(root, 'docs/schema-audit/public-schema.json'));
const owner = '11111111-1111-4111-8111-111111111111';
const stranger = '22222222-2222-4222-8222-222222222222';
const business = '33333333-3333-4333-8333-333333333333';
(async () => {
 const db = new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create schema extensions; create domain public.geography as text; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 for (const table of ['tavvy_places', 'live_sessions']) {
  const columns = schema.columns.filter(c => c.table === table).map(c => `"${c.column}" ${c.type === 'geography' ? 'public.geography' : c.type === '_text' ? 'text[]' : c.type}${c.default ? ` default ${c.default}` : ''}${c.nullable === 'NO' ? ' not null' : ''}`);
  await db.exec(`create table public.${table} (${columns.join(',')}, primary key(id));`);
 }
 const metadata = require(path.join(root,'docs/schema-audit/onthego-live-constraints.json')).rows[0].metadata;
 assert.equal(metadata.geography_type[0].schema,'public');
 assert.equal(metadata.triggers,null,'test assumes no table triggers in audited live metadata');
 for (const constraint of metadata.constraints.filter(c=>c.definition.startsWith('CHECK'))) {
  await db.exec(`alter table public.${constraint.table} add constraint ${constraint.name} ${constraint.definition}`);
 }
 await db.exec(`alter table live_sessions enable row level security; grant usage on schema public,auth to anon,authenticated,service_role; grant select on live_sessions to anon,authenticated;`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20260909120000_onthego_lifecycle.sql'),'utf8'));
 await db.query(`insert into tavvy_places(id,name,tavvy_category,place_type,created_by) values ($1,'Offline test','Mobile Services','on_the_go',$2)`,[business,owner]);
 const actor = async id => db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[id]);
 const call = async (action,payload) => (await db.query(`select onthego_session_action($1,$2::jsonb) result`,[action,JSON.stringify(payload)])).rows[0].result;
 const start = {tavvy_place_id:business,latitude:0,longitude:0,duration_hours:4};
 await actor(''); await assert.rejects(call('start',start),/Sign in/);
 await actor(stranger); await assert.rejects(call('start',start),/own/);
 await actor(owner);
 await db.query(`update tavvy_places set place_type=null where id=$1`,[business]);
 await assert.rejects(call('start',start),/own/);
 await db.query(`update tavvy_places set place_type='on_the_go' where id=$1`,[business]);
 await assert.rejects(call('start',{...start,latitude:91}),/Invalid/);
 await assert.rejects(call('start',{...start,duration_hours:9}),/Invalid/);
 let response = await call('start',start), id = response.session_id;
 assert.equal(response.session.session_location,'SRID=4326;POINT(0 0)');
 assert.equal(response.session.place_id,null);
 assert.equal(response.session.address_confirmed,false);
 await assert.rejects(call('start',start),/already has/);
 const visible = async () => {await db.exec('set role anon'); const rows = (await db.query('select id from live_sessions')).rows; await db.exec('reset role'); return rows.length;};
 assert.equal(await visible(),0,'unconfirmed position hidden');
 await assert.rejects(call('confirm',{session_id:id,confirmed_address:''}),/public address/);
 response = await call('confirm',{session_id:id,confirmed_address:'Public square'});
 assert.equal(response.session.address_confirmed,true); assert.equal(await visible(),1);
 const publicBusiness = (await db.query('select current_lat,current_lng,is_active_today from tavvy_places')).rows[0];
 assert.deepEqual(publicBusiness,{current_lat:null,current_lng:null,is_active_today:true});
 await assert.rejects(call('update',{session_id:id,session_lat:1}),/Both coordinates/);
 await assert.rejects(call('update',{session_id:id,session_lat:1,session_lng:2,scheduled_end_at:'2000-01-01'}),/End time/);
 assert.equal(await visible(),1,'failed update rolls position and confirmation back');
 response = await call('update',{session_id:id,session_lat:1,session_lng:2});
 assert.equal(response.session.address_confirmed,false); assert.equal(response.session.session_address,null); assert.equal(await visible(),0);
 await actor(stranger); await assert.rejects(call('end',{session_id:id}),/own/); await actor(owner);
 await call('end',{session_id:id}); response = await call('end',{session_id:id}); assert.equal(response.session.status,'ended');
 await assert.rejects(call('confirm',{session_id:id,confirmed_address:'Square'}),/ended or expired/);
 response = await call('start',start); id=response.session_id;
 await call('confirm',{session_id:id,confirmed_address:'Square'});
 await db.query(`update live_sessions set scheduled_end_at=now()-interval '1 minute' where id=$1`,[id]);
 assert.equal(await visible(),0,'expired position hidden even before cleanup job');
 await db.exec('set role authenticated'); await assert.rejects(db.query('select expire_onthego_sessions()'),/permission denied/); await db.exec('reset role');
 await db.exec('set role service_role'); assert.equal((await db.query('select expire_onthego_sessions() count')).rows[0].count,1); await db.exec('reset role');
 assert.equal((await db.query('select is_active_today from tavvy_places')).rows[0].is_active_today,false);
 await db.exec('set role anon'); await assert.rejects(call('start',start),/permission denied/); await db.exec('reset role');
 await db.close();
 console.log('On The Go SQL lifecycle: auth, ownership, nullable type, coordinates, duplicate start, confirmation/RLS, atomic update rollback, idempotent end, expiry and grants passed. Geography cast stubbed; no live writes.');
})().catch(error=>{console.error(error);process.exitCode=1});
