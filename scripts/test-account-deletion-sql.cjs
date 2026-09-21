/** Synthetic local PostgreSQL fixtures derived from the actual schema snapshot. Never connects to Supabase. */
const fs=require('node:fs'), assert=require('node:assert/strict');
const {PGlite}=require(process.env.PGLITE_MODULE || '/tmp/tavvy-food-sql-test/node_modules/@electric-sql/pglite');
const snapshot=JSON.parse(fs.readFileSync('docs/schema-audit/public-schema.json','utf8'));
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const mapType=t=> ({uuid:'uuid',int2:'smallint',int4:'integer',int8:'bigint',bool:'boolean',float8:'double precision',numeric:'numeric',jsonb:'jsonb',json:'json',timestamptz:'timestamptz',timestamp:'timestamp',date:'date',inet:'inet',_text:'text[]'}[t]||'text');
(async()=>{
 const db=new PGlite();
 await db.exec(`CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text,name text,owner uuid,owner_id text);
 CREATE TABLE public.test_aggregate_calls(ids uuid[]);
 CREATE FUNCTION public.aggregate_place_signals(uuid[]) RETURNS integer LANGUAGE sql AS $$INSERT INTO public.test_aggregate_calls VALUES ($1) RETURNING 1$$;`);
 const tables=new Map();for(const c of snapshot.columns){if(!tables.has(c.table))tables.set(c.table,[]);tables.get(c.table).push(c);}
 for(const [t,cols] of tables) await db.exec(`CREATE TABLE public.${quote(t)} (${cols.map(c=>`${quote(c.column)} ${mapType(c.type)} ${c.nullable==='NO'?'NOT NULL':''}${c.column==='id'?' PRIMARY KEY':''}`).join(',')})`);
 // Auth FKs and single-column child FKs mirror actual ON DELETE behavior; no prod data is loaded.
 let fkCount=0;
 for(const f of snapshot.foreign_keys){
   let definition=f.definition.replace(/REFERENCES users\(/,'REFERENCES auth.users(');
   const ref=definition.match(/REFERENCES ([\w.]+)\(([^)]+)\)/);
   if(!ref || ref[2]!=='id')continue;
   const table=ref[1].replace('public.','');
   if(table!=='auth.users' && !tables.get(table)?.some(c=>c.column==='id'))continue;
   try{await db.exec(`ALTER TABLE public.${quote(f.table)} ADD CONSTRAINT ${quote(f.name)} ${definition}`);fkCount++;}
   catch(e){throw new Error(f.table+': '+e.message);}
 }
 // Actual unique conflict key used by the aggregate maintenance SQL.
 if(!tables.get('place_stats').some(c=>c.column==='id')) await db.exec('ALTER TABLE place_stats ADD PRIMARY KEY(place_id)');
 else await db.exec('ALTER TABLE place_stats ADD UNIQUE(place_id)');
 await db.exec(fs.readFileSync('supabase/migrations/202609080010_account_deletion.sql','utf8'));
 const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
 const ids={provider:'33333333-3333-4333-8333-333333333333',place:'44444444-4444-4444-8444-444444444444',review:'55555555-5555-4555-8555-555555555555',employee:'66666666-6666-4666-8666-666666666666'};
 await db.query('INSERT INTO auth.users VALUES ($1),($2)',[A,B]);
 let seq=10;
 async function insert(table,values){
   const cols=tables.get(table); const data={...values};
   for(const c of cols)if(c.nullable==='NO' && !(c.column in data)) {
     const typ=mapType(c.type);data[c.column]=typ==='uuid'?`aaaaaaaa-aaaa-4aaa-8aaa-${String(seq++).padStart(12,'0')}`:typ==='boolean'?false:typ.endsWith('[]')?[]:['json','jsonb'].includes(typ)?{}:['integer','smallint','bigint','numeric','double precision'].includes(typ)?0:typ==='inet'?'127.0.0.1':typ.includes('timestamp')?'2026-01-01T00:00:00Z':typ==='date'?'2026-01-01':'fixture';
   }
   const names=Object.keys(data);await db.query(`INSERT INTO ${quote(table)}(${names.map(quote)}) VALUES (${names.map((_,i)=>'$'+(i+1))})`,Object.values(data));
 }
 await insert('places',{id:ids.place});
 await insert('pro_providers',{id:ids.provider,user_id:A,is_active:true,email:'private@example.test',first_name:'Private'});
 await insert('pro_employees',{id:ids.employee,employer_id:ids.provider,auth_user_id:B,full_name:'Other employee'});
 await insert('place_reviews',{id:ids.review,user_id:A,place_id:ids.place,status:'live'});
 await insert('saved_places',{user_id:A,place_id:ids.place});
 await insert('saved_places',{user_id:B,place_id:ids.place});
 await insert('live_sessions',{started_by:A,place_id:ids.place});
 await insert('project_requests',{user_id:A,customer_name:'Private',customer_email:'private@example.test'});
 await insert('user_strikes',{user_id:B,issued_by:A});
 await db.query("INSERT INTO storage.objects VALUES (gen_random_uuid(),'avatars',$1,NULL,NULL),(gen_random_uuid(),'avatars',$2,NULL,$3),(gen_random_uuid(),'other','x',$3::uuid,$4)",[A+'/legacy.jpg',B+'/other.jpg',B,A]);
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[A]);
 await assert.rejects(db.query("SELECT account_deletion_manifest('DELETE')"),/policy is not approved/);
 await db.exec('UPDATE account_deletion_policy SET approved=true');
 const manifest=(await db.query("SELECT account_deletion_manifest('DELETE') AS m")).rows[0].m;
 assert.equal(manifest.objects.length,2);assert.ok(!manifest.objects.some(o=>o.name===B+'/other.jpg'));
 await assert.rejects(db.query("SELECT delete_account_private_data('NO')"));
 await db.exec('CREATE TABLE public.future_business_record(owner uuid NOT NULL REFERENCES auth.users(id));');
 await db.query('INSERT INTO future_business_record VALUES($1)',[A]);
 await assert.rejects(db.query("SELECT delete_account_private_data('DELETE')"),/Unresolved account reference/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM live_sessions')).rows[0].n,1,'failure rolls back live/location cleanup');
 await db.exec('DROP TABLE future_business_record');
 assert.equal((await db.query("SELECT delete_account_private_data('DELETE') AS r")).rows[0].r.cleaned,true);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM live_sessions')).rows[0].n,0);
 assert.deepEqual((await db.query('SELECT user_id,is_active,email,first_name FROM pro_providers')).rows[0],{user_id:null,is_active:false,email:null,first_name:null});
 assert.equal((await db.query('SELECT count(*)::int AS n FROM pro_employees')).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM saved_places')).rows[0].n,1);
 assert.equal((await db.query('SELECT user_id FROM saved_places')).rows[0].user_id,B);
 assert.equal((await db.query('SELECT total_reviews FROM place_stats')).rows[0].total_reviews,0);
 await db.query('DELETE FROM auth.users WHERE id=$1',[A]);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM pro_employees')).rows[0].n,1,'other employee payroll identity survives');
 await assert.rejects(db.query("SELECT delete_account_private_data('DELETE')"),/Authentication required/);
 await db.query("SELECT set_config('request.jwt.claim.sub','',false)");
 await assert.rejects(db.query("SELECT account_deletion_manifest('DELETE')"),/Authentication required/);
 console.log(`PASS local SQL: migration parses, ${fkCount} actual FK definitions, caller isolation, storage ownership, rollback on unknown FK, location deletion, review stats, detached business/employee preservation, auth cascade, stale/anonymous identity rejection.`);
 await db.close();
})().catch(error=>{console.error(error);process.exit(1)});
