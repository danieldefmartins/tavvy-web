// Run: NODE_PATH=/tmp/tavvy-food-sql-test/node_modules node scripts/tests/food-menu-sql.test.cjs
// Entirely synthetic, in-memory PostgreSQL fixtures. No network/database credentials.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const db = new PGlite();
 const migration = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/202609080001_food_menu_discovery.sql'), 'utf8');
 await db.exec(`
 CREATE ROLE anon; CREATE ROLE authenticated;
 CREATE TABLE places (id uuid PRIMARY KEY, name text, latitude double precision, longitude double precision, city text, region text, state text, postcode text, postal_code text, zip text, tavvy_category text);
 CREATE TABLE menus (id uuid PRIMARY KEY, place_id uuid REFERENCES places, is_published boolean, is_active boolean);
 CREATE TABLE menu_categories (id uuid PRIMARY KEY, menu_id uuid REFERENCES menus, name text);
 CREATE TABLE menu_items (id uuid PRIMARY KEY, category_id uuid REFERENCES menu_categories, name text, description text, price numeric, price_label text, image_url text, dietary_tags text[], is_available boolean);
 CREATE TABLE atlas_universe_places (universe_id uuid, place_id uuid REFERENCES places);
 INSERT INTO places VALUES
 ('00000000-0000-0000-0000-000000000001','A Restaurant',0,0,'Orlando','FL',null,'32801',null,null,'restaurant'),
 ('00000000-0000-0000-0000-000000000002','Far Restaurant',30,30,'Boston',null,'MA',null,null,'02108','restaurant'),
 ('00000000-0000-0000-0000-000000000003','Hidden Restaurant',0,0,'Orlando','FL',null,null,'32802',null,'restaurant');
 INSERT INTO menus SELECT id,id,true,true FROM places;
 INSERT INTO menu_categories SELECT id,id,'Main' FROM menus;
 INSERT INTO menu_items SELECT id,id,'The Big Surprise','Breaded chicken parmesan',12,null,null,'{}',true FROM menu_categories;
 INSERT INTO atlas_universe_places VALUES ('00000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-000000000001');
 `);
 await db.exec(`ALTER TABLE places ADD COLUMN status text DEFAULT 'active'; ALTER TABLE menu_items ADD COLUMN place_id uuid;`);
 await db.exec(migration);
 // Migration reruns safely, and derived backfill does not invent dish classification.
 await db.exec(migration);
 const rows = async (args='') => (await db.query(`SELECT * FROM search_food_menus(${args})`)).rows;
 assert.equal((await rows("search_text => 'chicken parmesan', location_text => 'Orlando, FL' ")).length,2);
 assert.equal((await rows("location_text => '32801'"))[0].state,'FL');
 assert.equal((await rows("location_text => '02108'"))[0].state,'MA');
 assert.equal((await rows("location_text => '32802'"))[0].place_name,'Hidden Restaurant');
 await db.exec(`UPDATE places SET region='Florida', state='FL', postal_code='32801-1234' WHERE id='00000000-0000-0000-0000-000000000001';`);
 assert.equal((await rows("location_text => 'Orlando, FL' ")).length,2);
 assert.equal((await rows("location_text => 'Orlando, Florida' ")).length,1);
 assert.equal((await rows("location_text => '32801' ")).length,1);
 assert.equal((await rows())[0].dish_type,null);
 assert.equal((await rows("center_lat => 0, center_lon => 0, radius_km => 5")).length,2);
 assert.equal((await rows("universe_filter => '00000000-0000-0000-0000-000000000099'")).length,1);
 for (const args of ["radius_km => null","page_offset => null","center_lat => 0","center_lat => 'NaN', center_lon => 0","center_lat => 0, center_lon => 'Infinity'","radius_km => 'NaN'","radius_km => 0","page_offset => -1","search_text => null","location_text => null"]) {
   await assert.rejects(rows(args), /Invalid search bounds/);
 }
 await db.exec(`UPDATE menu_items SET dish_type='chicken parmigiana',dish_aliases=ARRAY['chicken parm'] WHERE id='00000000-0000-0000-0000-000000000001';`);
 assert.equal((await rows("search_text => 'parmigiana'")).length,1);
 assert.equal((await rows("search_text => 'chicken parm'")).length,1);
 await db.exec(`UPDATE menu_items SET dish_aliases='{}',dish_type=null WHERE id='00000000-0000-0000-0000-000000000001';`);
 assert.equal((await rows("search_text => 'parmigiana'")).length,0);
 await db.exec(`UPDATE menu_items SET food_search_document=to_tsvector('fabricated');`);
 assert.equal((await rows("search_text => 'fabricated'")).length,0);
 await db.exec(`UPDATE menus SET is_published=false WHERE id='00000000-0000-0000-0000-000000000002';`);
 assert.equal((await rows()).length,2);
 await db.exec(`UPDATE menu_items SET is_available=false WHERE id='00000000-0000-0000-0000-000000000001';`);
 assert.equal((await rows()).length,1);
 await db.exec(`UPDATE menu_items SET is_available=true; UPDATE menus SET is_published=true;
 ALTER TABLE places ENABLE ROW LEVEL SECURITY;
 CREATE POLICY public_restaurants ON places FOR SELECT TO anon USING (name <> 'Hidden Restaurant');
 GRANT USAGE ON SCHEMA public TO anon;
 GRANT SELECT ON places,menus,menu_categories,menu_items,atlas_universe_places TO anon;
 SET ROLE anon;`);
 assert.equal((await rows()).length,2,'SECURITY INVOKER must respect place RLS');
 await db.exec(`RESET ROLE; SET enable_seqscan=off;`);
 const plan = await db.query(`EXPLAIN SELECT id FROM menu_items WHERE food_search_document @@ plainto_tsquery('simple', 'chicken parmesan')`);
 assert.match(JSON.stringify(plan.rows), /menu_items_food_search_document_gin/);
 await db.exec(`SET enable_seqscan=on;
 INSERT INTO menu_items(id,category_id,name,description,price,is_available)
 SELECT md5(n::text)::uuid,'00000000-0000-0000-0000-000000000001','Pagination dish '||n,'Test dish',10,true FROM generate_series(1,40) n;`);
 const first = await rows("search_text => 'pagination'");
 const second = await rows("search_text => 'pagination', page_offset => 30");
 assert.equal(first.length,30); assert.equal(second.length,10);
 assert.equal(new Set([...first,...second].map(x=>x.id)).size,40);
 // Also execute unchanged migration against exact relevant live column types,
 // without compatibility fixture columns such as menus.is_published or places.state.
 const live = new PGlite();
 const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/schema-audit/public-schema.json'), 'utf8'));
 const required = {
   places: ['id','name','latitude','longitude','city','region','postcode','tavvy_category','status'],
   menus: ['id','place_id','is_active'],
   menu_categories: ['id','menu_id','name'],
   menu_items: ['id','category_id','place_id','name','description','price','price_label','image_url','dietary_tags','is_available'],
   atlas_universe_places: ['universe_id','place_id'],
 };
 await live.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 for (const [table, names] of Object.entries(required)) {
   const columns = names.map(name => {
     const col = metadata.columns.find(c => c.table === table && c.column === name);
     assert.ok(col, `${table}.${name} must exist in live metadata`);
     return `"${name}" ${col.type === '_text' ? 'text[]' : col.type}`;
   });
   await live.exec(`CREATE TABLE ${table} (${columns.join(',')});`);
 }
 await live.exec(migration);
 assert.equal((await live.query('SELECT * FROM search_food_menus()')).rows.length,0);
 await live.close();
 await db.close();
 console.log('PASS: migration idempotency; vector backfill/updates; creative-name search; region/state/postal aliases; location/radius/universe; invalid/null/nonfinite bounds; publication/availability; invoker RLS; GIN eligibility; pagination.');
})().catch(e => { console.error(e); process.exitCode=1; });
