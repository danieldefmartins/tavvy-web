/** Prepare a rollback-only draft import. No network, credentials or database execution. */
'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const {validate} = require('./validate-catalog.cjs');

function prepareDraftImport(data) {
  const result = validate(data);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  if (!data.ships.length) throw new Error('At least one staged ship is required.');
  if (data.ships.some(d => d.ship.publication_status !== 'draft')) throw new Error('Only draft ships may enter this preparation tool.');
  if (data.ships.some(d => d.ship.photo !== null || d.venues.some(v => v.place_id !== null))) {
    throw new Error('This initial draft gate does not import photos or canonical venue-place links.');
  }
  const json = JSON.stringify(data);
  const digest = crypto.createHash('sha256').update(json).digest('hex');
  const delimiter = '$cruise_' + digest.slice(0,16) + '$';
  if (json.includes(delimiter)) throw new Error('Payload conflicts with SQL delimiter.');
  return `-- PREPARED ONLY: apply cruise catalog001 before reviewing/running this gate.
-- This file always ROLLBACKs. It never publishes, updates existing rows, or writes places.
-- Payload SHA256 ${digest}
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TEMP TABLE cruise_import_stage(payload jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO cruise_import_stage VALUES (${delimiter}${json}${delimiter}::jsonb);

-- Serializes cooperating import jobs; table locks protect collision checks from other writers.
SELECT pg_advisory_xact_lock(hashtextextended('tavvy-cruise-catalog-import',0));
LOCK TABLE public.cruise_ships,public.cruise_ship_name_history,public.cruise_operators,public.atlas_universes IN SHARE ROW EXCLUSIVE MODE;
DO $gate$
DECLARE staged jsonb; s jsonb; o jsonb; v jsonb;
BEGIN
 SELECT payload INTO staged FROM cruise_import_stage;
 FOR o IN SELECT value FROM jsonb_array_elements(staged->'operators') LOOP
  IF EXISTS(SELECT 1 FROM public.cruise_operators c WHERE c.id=o->>'id' AND
    (c.name IS DISTINCT FROM o->>'name' OR c.official_url IS DISTINCT FROM o->>'official_url')) THEN
   RAISE EXCEPTION 'Operator identity differs; reconcile before import: %',o->>'id';
  END IF;
 END LOOP;
 FOR v IN SELECT value FROM jsonb_array_elements(staged->'ships') LOOP
  s:=v->'ship';
  IF s->>'publication_status'<>'draft' THEN RAISE EXCEPTION 'Draft-only import'; END IF;
  IF EXISTS(SELECT 1 FROM public.cruise_ships c WHERE
    c.id=(s->>'id')::uuid OR c.universe_id=(s->>'universe_id')::uuid OR c.slug=s->>'slug'
    OR lower(regexp_replace(c.name,'[^[:alnum:]]','','g'))=lower(regexp_replace(s->>'name','[^[:alnum:]]','','g'))
    OR (s->>'imo' IS NOT NULL AND c.imo=s->>'imo') OR (s->>'eni' IS NOT NULL AND c.eni=s->>'eni')
    OR (s->>'official_url' IS NOT NULL AND c.official_url=s->>'official_url')) THEN
   RAISE EXCEPTION 'Existing canonical ship candidate; reconcile manually: %',s->>'slug';
  END IF;
  IF EXISTS(SELECT 1 FROM public.cruise_ship_name_history h WHERE
    lower(regexp_replace(h.name,'[^[:alnum:]]','','g'))=lower(regexp_replace(s->>'name','[^[:alnum:]]','','g'))) THEN
   RAISE EXCEPTION 'Existing historical ship name; reconcile manually: %',s->>'slug';
  END IF;
  IF EXISTS(SELECT 1 FROM public.atlas_universes u WHERE u.id=(s->>'universe_id')::uuid OR u.slug=s->>'slug'
    OR lower(regexp_replace(u.name,'[^[:alnum:]]','','g'))=lower(regexp_replace(s->>'name','[^[:alnum:]]','','g'))) THEN
   RAISE EXCEPTION 'Existing Universe candidate; preserve canonical identity: %',s->>'slug';
  END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v->'sources') x WHERE (x->>'checked_at')::date>current_date) THEN
   RAISE EXCEPTION 'Future source check date';
  END IF;
 END LOOP;
END $gate$;

INSERT INTO public.cruise_operators(id,name,official_url)
 SELECT o->>'id',o->>'name',o->>'official_url' FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'operators') o
 WHERE NOT EXISTS(SELECT 1 FROM public.cruise_operators c WHERE c.id=o->>'id');
INSERT INTO public.atlas_universes(id,name,slug,status,universe_kind,is_featured,published_at)
 SELECT (s->>'universe_id')::uuid,s->>'name',s->>'slug','draft','cruise_ship',false,NULL
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL (SELECT d->'ship' s) x;
INSERT INTO public.cruise_ships(id,universe_id,slug,name,operator_id,kind,operating_status,publication_status,overnight_public_cruise,identity_verified,status_source_ids,imo,eni,official_url,photo)
 SELECT (s->>'id')::uuid,(s->>'universe_id')::uuid,s->>'slug',s->>'name',s->>'operator_id',s->>'kind',s->>'operating_status','draft',
 (s->>'overnight_public_cruise')::boolean,(s->>'identity_verified')::boolean,ARRAY(SELECT jsonb_array_elements_text(s->'status_source_ids')),s->>'imo',s->>'eni',s->>'official_url',NULL
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL (SELECT d->'ship' s) x;
INSERT INTO public.cruise_ship_sources(ship_id,id,url,publisher,checked_at,source_type)
 SELECT (d->'ship'->>'id')::uuid,s->>'id',s->>'url',s->>'publisher',(s->>'checked_at')::date,s->>'source_type'
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(d->'sources') s;
INSERT INTO public.cruise_ship_facts(ship_id,key,value,source_ids,as_of,verification,note)
 SELECT (d->'ship'->>'id')::uuid,f->>'key',f->'value',ARRAY(SELECT jsonb_array_elements_text(f->'source_ids')),(f->>'as_of')::date,f->>'verification',f->>'note'
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(d->'ship'->'facts') f;
INSERT INTO public.cruise_ship_name_history(ship_id,name,operator_name,valid_from,valid_until,source_ids)
 SELECT (d->'ship'->>'id')::uuid,h->>'name',h->>'operator_name',(h->>'valid_from')::date,(h->>'valid_until')::date,ARRAY(SELECT jsonb_array_elements_text(h->'source_ids'))
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(d->'ship'->'name_history') h;
INSERT INTO public.cruise_cabin_categories(id,ship_id,name,description,accessible,source_ids)
 SELECT (c->>'id')::uuid,(d->'ship'->>'id')::uuid,c->>'name',c->>'description',(c->>'accessible')::boolean,ARRAY(SELECT jsonb_array_elements_text(c->'source_ids'))
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(d->'ship'->'cabin_categories') c;
INSERT INTO public.cruise_venues(id,ship_id,name,kind,place_id,description,deck_label,included,availability_note,source_ids,verification)
 SELECT (v->>'id')::uuid,(v->>'ship_id')::uuid,v->>'name',v->>'kind',NULL,v->>'description',v->>'deck_label',(v->>'included')::boolean,v->>'availability_note',ARRAY(SELECT jsonb_array_elements_text(v->'source_ids')),v->>'verification'
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(d->'venues') v;
INSERT INTO public.cruise_programs(id,ship_id,name,kind,venue_id,description,as_of,availability_note,source_ids,verification)
 SELECT (p->>'id')::uuid,(p->>'ship_id')::uuid,p->>'name',p->>'kind',(p->>'venue_id')::uuid,p->>'description',(p->>'as_of')::date,p->>'availability_note',ARRAY(SELECT jsonb_array_elements_text(p->'source_ids')),p->>'verification'
 FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') d CROSS JOIN LATERAL jsonb_array_elements(coalesce(d->'programs','[]'::jsonb)) p;

DO $verify$
DECLARE d jsonb; s jsonb;
BEGIN
 FOR d IN SELECT value FROM cruise_import_stage j CROSS JOIN LATERAL jsonb_array_elements(j.payload->'ships') LOOP
  s:=d->'ship';
  IF NOT EXISTS(SELECT 1 FROM public.cruise_ships c JOIN public.atlas_universes u ON u.id=c.universe_id WHERE c.id=(s->>'id')::uuid
   AND c.publication_status='draft' AND u.status='draft' AND u.universe_kind='cruise_ship' AND c.imo IS NOT DISTINCT FROM s->>'imo' AND c.eni IS NOT DISTINCT FROM s->>'eni') THEN RAISE EXCEPTION 'Draft identity mismatch'; END IF;
  IF public.get_cruise_ship_v1(s->>'slug',NULL) IS NOT NULL THEN RAISE EXCEPTION 'Draft became publicly readable'; END IF;
  IF (SELECT count(*) FROM public.cruise_ship_facts f WHERE f.ship_id=(s->>'id')::uuid)<>jsonb_array_length(s->'facts') THEN RAISE EXCEPTION 'Facts lost'; END IF;
  IF (SELECT count(*) FROM public.cruise_ship_sources f WHERE f.ship_id=(s->>'id')::uuid)<>jsonb_array_length(d->'sources') THEN RAISE EXCEPTION 'Sources lost'; END IF;
  IF (SELECT count(*) FROM public.cruise_cabin_categories c WHERE c.ship_id=(s->>'id')::uuid)<>jsonb_array_length(s->'cabin_categories') THEN RAISE EXCEPTION 'Cabin categories lost'; END IF;
  IF (SELECT count(*) FROM public.cruise_venues v WHERE v.ship_id=(s->>'id')::uuid)<>jsonb_array_length(d->'venues') THEN RAISE EXCEPTION 'Venues lost'; END IF;
  IF (SELECT count(*) FROM public.cruise_programs p WHERE p.ship_id=(s->>'id')::uuid)<>jsonb_array_length(coalesce(d->'programs','[]'::jsonb)) THEN RAISE EXCEPTION 'Programs lost'; END IF;
 END LOOP;
END $verify$;
SELECT jsonb_build_object('status','PASS','committed',false,'published',false,'ships',jsonb_array_length(payload->'ships'),'payload_sha256','${digest}') AS cruise_draft_import_gate FROM cruise_import_stage;
ROLLBACK;
`;
}

module.exports = {prepareDraftImport};
if (require.main === module) {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length) throw new Error('Usage: node prepare-draft-import.cjs staged.json output.sql');
  const sql = prepareDraftImport(JSON.parse(fs.readFileSync(input,'utf8')));
  fs.writeFileSync(output,sql,{flag:'wx'});
  console.log(JSON.stringify({prepared:true,executed:false,rollbackOnly:true,output,sha256:crypto.createHash('sha256').update(sql).digest('hex')}));
}
