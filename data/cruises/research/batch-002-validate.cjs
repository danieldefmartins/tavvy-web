#!/usr/bin/env node
'use strict';

// Research gate only. Does not import catalog records or call any network/database.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const inventoryPath = path.join(__dirname, 'batch-002-fleet-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'operator-registry.json'), 'utf8'));
const batch001 = JSON.parse(fs.readFileSync(path.join(root, 'data/cruises/staged/verified-operating-batch-001.json'), 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const normalize = name => name.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const expectedCounts = {
  cunard: 4, azamara: 4, 'virgin-voyages': 4, 'holland-america-line': 11,
  'a-rosa': 15, 'riverside-luxury-cruises': 3, 'avalon-waterways': 19,
  'aurora-expeditions': 3, 'swan-hellenic': 3, 'coral-expeditions': 3,
};
const hosts = new Set([
  'www.cunard.com', 'www.azamara.com', 'www.virginvoyages.com', 'www.hollandamerica.com',
  'newsroom.arosa-cruises.com', 'riverside-cruises.com', 'www.avalonwaterways.com',
  'www.aurora-expeditions.com', 'www.auroraexpeditions.com.au',
  'www.swanhellenic.com', 'media.coralexpeditions.com',
]);
const coverageValues = new Set(['complete_retrieved_fleet_page', 'complete_retrieved_full_fleet_statement', 'partial_access']);
const leadKeys = new Set(['lead_id', 'name', 'operator_registry_id', 'checked_at', 'kind_candidate', 'kind_verification',
  'fleet_section', 'listed_relationship', 'legal_operator_verified', 'source_ids', 'scope_source_ids',
  'fleet_listing_evidence', 'operating_status', 'operating_status_verified', 'scope_assessment',
  'identity_verified', 'canonical_ship_id', 'universe_id', 'imo', 'eni', 'prior_name_or_operator_match', 'identity_caution']);

function validate(d) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  const ids = new Set(registry.operators.map(o => o.id));
  const previousOperators = new Set(batch001.operators.map(o => o.id));
  const previousNames = new Set(batch001.ships.map(row => normalize(row.ship.name)));
  const sources = new Map(d.sources.map(s => [s.id, s]));
  const operators = new Map(d.operators.map(o => [o.operator_registry_id, o]));
  check(d.research_schema_version === 1 && d.batch_id === '002', 'research schema/batch');
  check(d.publishable === false && d.worldwide_complete === false && d.status === 'fleet_name_research_only', 'research/publication boundary');
  check(d.checked_at === '2026-09-21', 'checked date');
  check(d.operators.length === 10 && operators.size === 10, 'ten unique operators');
  check(d.leads.length === 69, '69 transcribed name leads');
  check(sources.size === d.sources.length, 'unique source IDs');
  for (const s of d.sources) {
    let safeUrl = false;
    try { const u = new URL(s.url); safeUrl = u.protocol === 'https:' && hosts.has(u.hostname) && !u.username && !u.password; } catch {}
    check(safeUrl, 'official source host');
    check(s.source_type === 'operator' && operators.has(s.operator_registry_id), 'source operator');
    check(s.checked_at === d.checked_at && !!s.locator && !!s.evidence_summary, 'source date/locator/evidence');
    check(s.published_at === null || /^\d{4}-\d{2}-\d{2}$/.test(s.published_at) && s.published_at <= d.checked_at, 'source publication date');
    check(['full_page_retrieved', 'indexed_excerpt_only', 'redirect_verified'].includes(s.access), 'source access state');
  }
  for (const o of d.operators) {
    check(ids.has(o.operator_registry_id) && !previousOperators.has(o.operator_registry_id), 'additional registry operator only');
    check(coverageValues.has(o.coverage), 'operator coverage enum');
    check(o.checked_at === d.checked_at && !!o.limitations && !!o.overnight_public_scope_basis, 'operator evidence/limits');
    const rows = d.leads.filter(l => l.operator_registry_id === o.operator_registry_id);
    check(rows.length === expectedCounts[o.operator_registry_id] && rows.length === o.transcribed_lead_count, 'per-operator source transcription count');
    check(o.advertised_fleet_count === null || o.advertised_fleet_count === rows.length, 'stated fleet count');
    check(o.source_ids.length > 0 && o.source_ids.every(id => sources.get(id)?.operator_registry_id === o.operator_registry_id), 'operator source resolution');
    if (o.coverage !== 'partial_access') {
      check(o.source_ids.some(id => sources.get(id)?.access === 'full_page_retrieved'), 'complete coverage requires retrieved evidence');
    }
  }
  const keys = new Set(), names = new Set();
  for (const l of d.leads) {
    check(Object.keys(l).every(k => leadKeys.has(k)), 'no catalog facts/photos or hidden publication payload');
    check(typeof l.name === 'string' && l.name.trim().length > 0, 'name required');
    check(l.lead_id.startsWith(`b002:${l.operator_registry_id}:`) && !keys.has(l.lead_id), 'stable unique research key'); keys.add(l.lead_id);
    const normalized = normalize(l.name);
    check(!names.has(normalized) && !previousNames.has(normalized), 'unique names with no batch001 exact overlap'); names.add(normalized);
    check(operators.has(l.operator_registry_id), 'lead operator');
    check(l.checked_at === d.checked_at, 'lead checked date');
    check(['ocean', 'river', 'expedition'].includes(l.kind_candidate) && l.kind_verification === 'research_classification_only', 'candidate kind only');
    check(l.listed_relationship === 'marketed_by_named_operator' && l.legal_operator_verified === false, 'marketing is not legal operation');
    check(l.scope_assessment === 'overnight_public_cruise_candidate', 'overnight public candidate scope');
    check(l.operating_status === 'unknown' && l.operating_status_verified === false, 'no unsupported operating status');
    check(l.identity_verified === false && ['canonical_ship_id','universe_id','imo','eni','prior_name_or_operator_match'].every(k => l[k] === null), 'no invented permanent identity');
    for (const field of ['source_ids', 'scope_source_ids']) {
      check(l[field].length > 0 && l[field].every(id => sources.get(id)?.operator_registry_id === l.operator_registry_id), 'lead sources resolve to same operator');
    }
    check(l.fleet_listing_evidence === (operators.get(l.operator_registry_id)?.coverage === 'partial_access' ? 'official_indexed_excerpt' : 'official_retrieved_page'), 'lead access honesty');
  }
  for (const id of ['azamara', 'coral-expeditions']) {
    check(operators.get(id)?.coverage === 'partial_access' && operators.get(id)?.access_attempts.length > 0, 'inaccessible operators remain partial');
    check(d.sources.filter(s => s.operator_registry_id === id).every(s => s.access === 'indexed_excerpt_only'), 'partial sources remain indexed-only');
  }
  check(sources.get('b002-coral-schedule')?.published_at === '2025-09-01', 'Coral historical schedule date preserved');
  check(operators.get('virgin-voyages')?.coverage === 'complete_retrieved_full_fleet_statement', 'Virgin alternate evidence distinguished');
  check(operators.get('holland-america-line')?.advertised_fleet_count === null && operators.get('avalon-waterways')?.advertised_fleet_count === null && operators.get('coral-expeditions')?.advertised_fleet_count === null, 'computed totals not operator claims');
  check(d.leads.find(l => l.name === 'MS Infinity')?.kind_candidate === 'expedition', 'Galapagos not mislabeled river');
  for (const name of ['Delfin III', 'MS Infinity', 'MS Farah']) check(!!d.leads.find(l => l.name === name)?.identity_caution, 'Avalon cross-marketing caution');
  const counts = {
    operators: operators.size, ship_name_leads: d.leads.length,
    exact_normalized_name_duplicates: d.leads.length - names.size,
    exact_batch001_name_overlaps: d.leads.filter(l => previousNames.has(normalize(l.name))).length,
    complete_retrieved_fleet_pages: d.operators.filter(o => o.coverage === 'complete_retrieved_fleet_page').length,
    complete_retrieved_full_fleet_statements: d.operators.filter(o => o.coverage === 'complete_retrieved_full_fleet_statement').length,
    partial_access_operators: d.operators.filter(o => o.coverage === 'partial_access').length,
    verified_operating_ships: 0, verified_physical_vessel_count: null, canonical_ship_ids_assigned: 0,
    candidate_kinds: Object.fromEntries(['ocean','river','expedition'].map(k => [k, d.leads.filter(l => l.kind_candidate === k).length])),
  };
  check(JSON.stringify(d.counts) === JSON.stringify(counts), 'summary counts agree with records');
  return errors;
}

const checks = [];
const test = (name, run) => { run(); checks.push({name, status: 'PASS'}); };
test('Inventory meets research-only contract and all source/count/identity boundaries', () => assert.deepEqual(validate(inventory), []));
const reject = (name, change, expected) => test(name, () => {
  const d = JSON.parse(JSON.stringify(inventory)); change(d);
  assert(validate(d).some(e => e.includes(expected)), `Expected rejection: ${expected}`);
});
reject('Reject an unsupported operating status', d => d.leads[0].operating_status = 'operating', 'operating status');
reject('Reject publication or global completeness claims', d => d.publishable = true, 'publication boundary');
reject('Reject invented permanent ship IDs', d => d.leads[0].canonical_ship_id = '00000000-0000-4000-8000-000000000001', 'permanent identity');
reject('Reject spec or photo payloads in research leads', d => d.leads[0].photo = {url:'https://example.com/ship.jpg'}, 'catalog facts/photos');
reject('Reject unknown/cross-operator source references', d => d.leads[0].source_ids = ['b002-arosa-fleet'], 'sources resolve');
reject('Reject nonofficial source domains', d => d.sources[0].url = 'https://not-the-operator.example/fleet', 'official source host');
reject('Reject duplicate normalized names', d => d.leads[1].name = '  QUEEN MARY 2  ', 'unique names');
reject('Reject names already present in batch001', d => d.leads[0].name = batch001.ships[0].ship.name, 'batch001 exact overlap');
reject('Reject operators already present in batch001', d => d.operators[0].operator_registry_id = batch001.operators[0].id, 'additional registry operator');
reject('Reject falsely complete Azamara coverage', d => d.operators.find(o => o.operator_registry_id === 'azamara').coverage = 'complete_retrieved_fleet_page', 'inaccessible operators');
reject('Reject falsely retrieved Coral evidence', d => d.sources.find(s => s.id === 'b002-coral-schedule').access = 'full_page_retrieved', 'partial sources');
reject('Reject omitted ships masked by a changed summary', d => { d.leads.pop(); d.counts.ship_name_leads--; }, 'transcription count');
reject('Reject stale or fabricated evidence-check dates', d => d.leads[0].checked_at = '2027-01-01', 'lead checked date');
reject('Reject treating Galapagos Infinity as a river ship', d => d.leads.find(l => l.name === 'MS Infinity').kind_candidate = 'river', 'Galapagos');
test('Preserve all four frozen batch001 files byte for byte', () => {
  assert.equal(Object.keys(inventory.protected_batch001_inputs).length, 4);
  for (const [file, expected] of Object.entries(inventory.protected_batch001_inputs)) assert.equal(sha(fs.readFileSync(path.join(root, file))), expected, file);
});

const result = {
  status: 'PASS', checked_at: inventory.checked_at, validation_scope: 'local research contract and rejection cases; does not re-fetch sources or verify operating status',
  checks_passed: checks.length, counts: inventory.counts, checks,
  files: {
    'batch-002-fleet-inventory.json': sha(fs.readFileSync(inventoryPath)),
    'batch-002-validate.cjs': sha(fs.readFileSync(__filename)),
  },
  batch001_preserved: true,
  registry_snapshot_still_matches: sha(fs.readFileSync(path.join(__dirname, 'operator-registry.json'))) === inventory.registry_snapshot.sha256,
};
if (process.argv.includes('--write')) fs.writeFileSync(path.join(__dirname, 'batch-002-validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
