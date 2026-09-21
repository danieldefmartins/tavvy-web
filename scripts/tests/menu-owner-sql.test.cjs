// Synthetic local-only tests of the actual audited permissive policies plus hardening.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
(async()=>{
 const db = new PGlite();
 const schema = JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/schema-audit/public-schema.json'),'utf8'));
 await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA public,auth TO authenticated,anon;
 CREATE TABLE pro_business_claims(id uuid DEFAULT gen_random_uuid(),user_id uuid NOT NULL,place_id uuid,status text DEFAULT 'pending',verified_at timestamptz,verification_code text,verification_code_expires_at timestamptz,verification_attempts int DEFAULT 0);
 CREATE TABLE menus(id uuid PRIMARY KEY,place_id uuid,name text);
 CREATE TABLE menu_categories(id uuid PRIMARY KEY,menu_id uuid REFERENCES menus,name text);
 CREATE TABLE menu_items(id uuid PRIMARY KEY,category_id uuid REFERENCES menu_categories,place_id uuid,name text);
 GRANT SELECT,INSERT,UPDATE,DELETE ON pro_business_claims,menus,menu_categories,menu_items TO authenticated,anon;`);
 const tables = ['pro_business_claims','menus','menu_categories','menu_items'];
 for(const t of tables) await db.exec(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`);
 for(const p of schema.policies.filter(p=>tables.includes(p.table))) {
   await db.exec(`CREATE POLICY "${p.name}" ON ${p.table} FOR ${p.command} TO ${p.roles.join(',')}${p.using ? ` USING (${p.using})`:''}${p.check ? ` WITH CHECK (${p.check})`:''};`);
 }
 const sql = fs.readFileSync(path.join(__dirname,'../../supabase/migrations/202609080002_menu_owner_policies.sql'),'utf8');
 await db.exec(sql); await db.exec(sql);
 const a='00000000-0000-0000-0000-000000000001', b='00000000-0000-0000-0000-000000000002';
 await db.exec(`INSERT INTO menus VALUES('${a}','${a}','A'),('${b}','${b}','B');
 INSERT INTO menu_categories VALUES('${a}','${a}','A'),('${b}','${b}','B');
 INSERT INTO menu_items VALUES('${a}','${a}','${a}','A'),('${b}','${b}','${b}','B');
 SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${a}',false);`);
 await assert.rejects(db.exec(`INSERT INTO pro_business_claims(user_id,place_id,status) VALUES('${a}','${a}','verified');`),/row-level security/);
 await assert.rejects(db.exec(`INSERT INTO pro_business_claims(user_id,place_id,verification_code) VALUES('${a}','${a}','123456');`),/row-level security/);
 await assert.rejects(db.exec(`INSERT INTO pro_business_claims(user_id,place_id) VALUES('${b}','${a}');`),/row-level security/);
 await db.exec(`INSERT INTO pro_business_claims(user_id,place_id) VALUES('${a}','${a}');`);
 assert.equal((await db.query(`UPDATE menu_items SET name='attack' RETURNING id`)).rows.length,0,'pending claims grant no menu write');
 await db.exec(`RESET ROLE;
 -- A future broad update policy still cannot override restrictive claim hardening.
 CREATE POLICY accidental_claim_update ON pro_business_claims FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
 SET ROLE authenticated;`);
 assert.equal((await db.query(`UPDATE pro_business_claims SET status='verified' RETURNING id`)).rows.length,0);
 // Trusted backend verifies, without relying on profiles.is_admin or places.claimed_by.
 await db.exec(`RESET ROLE; UPDATE pro_business_claims SET status='verified',verified_at=now(); SET ROLE authenticated;`);
 assert.equal((await db.query(`UPDATE menu_items SET name='owner edit' WHERE id='${a}' RETURNING id`)).rows.length,1);
 assert.equal((await db.query(`UPDATE menu_items SET name='attack' WHERE id='${b}' RETURNING id`)).rows.length,0);
 assert.equal((await db.query(`DELETE FROM menu_items WHERE id='${b}' RETURNING id`)).rows.length,0);
 await assert.rejects(db.exec(`UPDATE menu_items SET category_id='${b}',place_id='${b}' WHERE id='${a}'`),/row-level security/);
 await assert.rejects(db.exec(`UPDATE menu_items SET place_id='${b}' WHERE id='${a}'`),/row-level security/);
 await assert.rejects(db.exec(`INSERT INTO menu_items VALUES(gen_random_uuid(),'${b}','${b}','attack')`),/row-level security/);
 await assert.rejects(db.exec(`UPDATE menu_categories SET menu_id='${b}' WHERE id='${a}'`),/row-level security/);
 await assert.rejects(db.exec(`UPDATE menus SET place_id='${b}' WHERE id='${a}'`),/row-level security/);
 assert.equal((await db.query(`UPDATE menus SET name='owner' WHERE id='${a}' RETURNING id`)).rows.length,1);
 assert.equal((await db.query(`UPDATE menu_categories SET name='owner' WHERE id='${a}' RETURNING id`)).rows.length,1);
 assert.equal((await db.query('SELECT * FROM menus')).rows.length,2,'authenticated public reads preserved');
 await db.exec(`SET ROLE anon; SELECT set_config('request.jwt.claim.sub','',false);`);
 assert.equal((await db.query('SELECT * FROM menu_items')).rows.length,2,'anonymous public reads preserved');
 await assert.rejects(db.exec(`INSERT INTO menu_items VALUES(gen_random_uuid(),'${a}','${a}','attack')`),/row-level security/);
 await db.close(); console.log('PASS: actual audited policy overlay; pending-only claim creation; no self-verification; trusted verification; owner edits; cross-tenant writes/deletes/moves blocked; public reads unchanged; idempotency.');
})().catch(e=>{console.error(e);process.exitCode=1;});
