const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
const db=new PGlite(),base=path.join(__dirname,'../..');
const schema=JSON.parse(fs.readFileSync(path.join(process.env.TAVVY_SCHEMA_FIXTURE_DIR || path.join(base,'docs/schema-audit'),'public-schema.json')));
await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE DOMAIN geography AS text;CREATE FUNCTION st_makepoint(double precision,double precision) RETURNS text LANGUAGE sql AS $$ SELECT $1::text || ',' || $2::text $$;CREATE FUNCTION st_setsrid(text,integer) RETURNS text LANGUAGE sql AS $$ SELECT $1 $$;CREATE FUNCTION unaccent(text) RETURNS text LANGUAGE sql AS $$ SELECT $1 $$;CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
GRANT USAGE ON SCHEMA public,auth TO authenticated,anon;`);
const tables=['places','tavvy_places','atlas_universe_places','pro_business_claims','fsq_places_raw','place_reviews','place_review_signal_taps','review_items','place_signal_aggregates','place_stats','places_search','review_reports'];
for(const table of tables){
 const cols=schema.columns.filter(c=>c.table===table).map(c=>`"${c.column}" ${c.type==='_text'?'text[]':c.type}${c.default?' DEFAULT '+c.default:''}`);
 await db.exec(`CREATE TABLE ${table}(${cols.join(',')});ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;GRANT SELECT,INSERT,UPDATE,DELETE ON ${table} TO authenticated,anon;`);
}
await db.exec(`CREATE UNIQUE INDEX canonical_source ON places(source_type,source_id) WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
ALTER TABLE place_reviews ADD PRIMARY KEY(id);ALTER TABLE place_review_signal_taps ADD UNIQUE(review_id,signal_id);
ALTER TABLE place_review_signal_taps ADD CHECK(intensity BETWEEN 1 AND 3);
ALTER TABLE place_review_signal_taps ADD FOREIGN KEY(review_id) REFERENCES place_reviews(id);
ALTER TABLE place_signal_aggregates ADD PRIMARY KEY(place_id,signal_id);`);
for(const p of schema.policies.filter(p=>tables.includes(p.table))) {
 // Only deployed review/place/raw policies needed; auxiliary ownership tables have no rows.
 if(!['places','fsq_places_raw','place_reviews','place_review_signal_taps','place_signal_aggregates','review_items'].includes(p.table))continue;
 await db.exec(`CREATE POLICY "${p.name}" ON ${p.table} FOR ${p.command} TO ${p.roles.join(',')}${p.using?` USING (${p.using})`:''}${p.check?` WITH CHECK (${p.check})`:''}`);
}
const details=JSON.parse(fs.readFileSync(path.join(process.env.TAVVY_SCHEMA_FIXTURE_DIR || path.join(base,'docs/schema-audit'),'review-constraints.json')));
await db.exec('ALTER TABLE place_stats ADD PRIMARY KEY(place_id); ALTER TABLE places_search ADD PRIMARY KEY(place_id)');
await db.exec(JSON.parse(fs.readFileSync(path.join(process.env.TAVVY_SCHEMA_FIXTURE_DIR || path.join(base,'docs/schema-audit'),'place-search-trigger.json'))).rows[0].definition);
await db.exec('CREATE TRIGGER places_search_sync AFTER INSERT OR UPDATE ON places FOR EACH ROW EXECUTE FUNCTION sync_places_search()');
await db.exec(details.functions.find(f=>f.name==='update_place_stats').definition);
await db.exec('CREATE TRIGGER place_stats_update AFTER INSERT ON place_reviews FOR EACH ROW EXECUTE FUNCTION update_place_stats()');
for(const filename of ['202609080005_place_author_policies.sql','202609080006_atomic_place_reviews.sql'])await db.exec(fs.readFileSync(path.join(base,'supabase/migrations',filename),'utf8'));

const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
const good='00000000-0000-0000-0000-000000000003',bad='00000000-0000-0000-0000-000000000004';
await db.exec(`CREATE TABLE public.users(id uuid PRIMARY KEY);INSERT INTO public.users VALUES('${a}'),('${b}');
ALTER TABLE public.place_reviews ADD FOREIGN KEY(user_id) REFERENCES public.users(id);
INSERT INTO review_items(id,label,slug,signal_type,is_active) VALUES('${good}','Fresh Pasta','fresh_pasta','best_for',true),('${bad}','Slow Service','slow_service','heads_up',true);
INSERT INTO fsq_places_raw(fsq_place_id,name,address) VALUES('history-test','History Test','1 Main Street');
SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${a}',false);`);
const old=(await db.query(`SELECT save_place_review('history-test','[{"signal_id":"${bad}","intensity":1}]'::jsonb,'Original concern','PRIVATE',NULL,'mobile_app') AS id`)).rows[0].id;
const place=(await db.query(`SELECT place_id FROM place_reviews WHERE id='${old}'`)).rows[0].place_id;
await db.exec('RESET ROLE');
await db.exec(fs.readFileSync(path.join(base,'supabase/migrations/202609080007_review_private_fields.sql'),'utf8'));
await db.exec(fs.readFileSync(path.join(base,'supabase/migrations/20260920120000_review_visits_and_evidence.sql'),'utf8'));
assert.equal((await db.query('SELECT count(*)::int n FROM place_review_revisions')).rows[0].n,0,'deployment does not backfill millions of reviews');
const evidence=async(cursor=null,snapshot=null,limit=500)=>(await db.query('SELECT get_place_review_evidence($1::uuid[],$2::uuid,$3::text,$4::int) AS data',[[place],cursor,snapshot,limit])).rows[0].data;
const history=async()=>(await db.query('SELECT get_place_review_history($1::uuid,0,50) AS data',[place])).rows[0].data;
await db.exec('SET ROLE anon');
const legacy=await evidence();assert.equal(legacy.visits.length,1);assert.equal(legacy.visits[0].signals[0].label,'Slow Service');
assert.equal(legacy.visits[0].date_source,'review_created');assert.equal((await history()).reviews[0].id,`legacy:${old}`);
assert.equal(JSON.stringify(await history()).includes('PRIVATE'),false);
await assert.rejects(db.exec('SELECT * FROM place_review_revisions'),/permission denied/);
await assert.rejects(db.exec('SELECT * FROM place_review_write_requests'),/permission denied/);
await db.exec(`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${a}',false);`);
const save=async(mode,key,review=null,signal=good,note='New visit',date='2026-01-10T00:00:00Z')=>(await db.query(
  'SELECT save_place_review_v2($1,$2::jsonb,$3,$4,$5,$6,$7::uuid,$8::timestamptz,$9) AS id',
  [place,JSON.stringify([{signal_id:signal,intensity:1}]),mode,key,note,'PRIVATE',review,date,'web_app'])).rows[0].id;
const visit=await save('new_visit','visit-request-1');
assert.notEqual(visit,old,'new visit is separate from prior review');
assert.equal(await save('new_visit','visit-request-1'),visit,'retry is idempotent');
await assert.rejects(save('new_visit','visit-request-1',null,bad),/different review content/);
assert.equal((await evidence()).visits.length,2);
await assert.rejects(save('new_visit','future-visit-request',null,good,'Future','2999-01-01T00:00:00Z'),/future/);
const firstPage=await evidence(null,null,1);assert.equal(firstPage.complete,false);
const beforeDate=(await db.query('SELECT created_at FROM place_reviews WHERE id=$1',[old])).rows[0].created_at;
await save('edit','edit-request-1',old,good,'Corrected',null);
assert.equal((await db.query('SELECT created_at FROM place_reviews WHERE id=$1',[old])).rows[0].created_at.toISOString(),beforeDate.toISOString());
await assert.rejects(evidence(firstPage.next_cursor,firstPage.snapshot,1),/changed/);
const edited=await history();assert.equal(edited.total,3);assert.equal(edited.reviews.filter(r=>r.review_id===old).length,2);
assert.ok(edited.reviews.some(r=>r.public_note==='Original concern'&&r.signals[0].label==='Slow Service'));
assert.ok(edited.reviews.some(r=>r.public_note==='Corrected'&&r.is_edit));
assert.equal(JSON.stringify(edited).includes('PRIVATE'),false);
// Legacy client tap replacement still preserves before/after revisions.
await db.exec(`BEGIN;DELETE FROM place_review_signal_taps WHERE review_id='${visit}';INSERT INTO place_review_signal_taps(review_id,place_id,signal_id,intensity) VALUES('${visit}','${place}','${bad}',2);COMMIT;`);
assert.equal((await history()).reviews.filter(r=>r.review_id===visit).length,2);
await assert.rejects(db.exec(`UPDATE place_reviews SET created_at=now() WHERE id='${old}'`),/original review date/);
await db.exec(`SELECT set_config('request.jwt.claim.sub','${b}',false)`);
await assert.rejects(save('edit','foreign-edit-request',old),/not editable/);
await db.exec(`SELECT set_config('request.jwt.claim.sub','${a}',false);RESET ROLE;`);
// A failure after review/tap insertion rolls back revisions and idempotency state too.
await db.exec(`CREATE FUNCTION fail_history_rollup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced aggregate failure'; END $$;
CREATE TRIGGER fail_history_rollup BEFORE INSERT ON place_signal_aggregates FOR EACH ROW EXECUTE FUNCTION fail_history_rollup();SET ROLE authenticated;`);
await assert.rejects(save('new_visit','rollback-request'),/forced aggregate failure/);
await db.exec('RESET ROLE;DROP TRIGGER fail_history_rollup ON place_signal_aggregates');
assert.equal((await db.query("SELECT count(*)::int n FROM place_review_write_requests WHERE request_key='rollback-request'")).rows[0].n,0);
assert.equal((await evidence()).visits.length,2);
await db.exec(`UPDATE place_reviews SET status='rejected' WHERE id='${old}';SET ROLE anon;`);
assert.equal((await evidence()).visits.length,1,'moderation hides all revisions for that review');
assert.equal((await history()).reviews.some(r=>r.review_id===old),false);
await db.exec('RESET ROLE');
await db.exec(`DELETE FROM place_review_signal_taps WHERE review_id='${old}';DELETE FROM place_reviews WHERE id='${old}';`);
assert.equal((await db.query('SELECT count(*)::int n FROM place_review_revisions WHERE review_id=$1',[old])).rows[0].n,0,'deletion clears archived content');
await db.close();console.log('Review history SQL: lazy legacy reads, explicit revisits, immutable edits, legacy writes, idempotency, ownership, private-field protection, snapshots, moderation, rollback and deletion passed.');
})().catch(e=>{console.error(e);process.exit(1)});
