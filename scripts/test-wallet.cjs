const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const moduleObject = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/wallet.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: moduleObject.exports, module: moduleObject, require });
const { readWallet, saveWalletCard, removeWalletCard, walletCard, filterWallet, GUEST_WALLET_KEY } = moduleObject.exports;
const card = walletCard({ id: 'card-1', company_name: 'Acme Plumbing', city: 'Miami' });
function storage(initial = {}) { const data = { ...initial }; return { data, async getItem(key) { return data[key] || null; }, async setItem(key, value) { data[key] = value; } }; }
function client(userId, responses = []) {
  const calls = [];
  return { calls, auth: { async getSession() { return { data: { session: userId ? { user: { id: userId } } : null }, error: null }; } }, from(table) {
    const call = { table, filters: [] }; calls.push(call);
    const query = { select(value) { call.select = value; return query; }, eq(key, value) { call.filters.push([key, value]); return query; }, order() { return query; }, insert(value) { call.insert = value; return query; }, delete() { call.delete = true; return query; }, maybeSingle() { return query; }, then(resolve, reject) { return Promise.resolve(responses.shift() || { data: [], error: null }).then(resolve, reject); } }; return query;
  } };
}
test('guest ignores unsafe legacy cache and never migrates into account wallet', async () => {
  const cache = storage({ '@tavvy_wallet_cards': JSON.stringify([card]) });
  assert.equal((await readWallet(client(null), null, cache)).length, 0);
  await saveWalletCard(client(null), null, card, cache);
  assert.equal(JSON.parse(cache.data[GUEST_WALLET_KEY]).length, 1);
  assert.equal((await readWallet(client('other'), 'other', cache)).length, 0);
});
test('account mismatch rejects read/save/remove before any database access', async () => {
  const db = client('B');
  for (const operation of [() => readWallet(db, 'A'), () => saveWalletCard(db, 'A', card), () => removeWalletCard(db, 'A', card.id)]) await assert.rejects(operation, /Account changed/);
  assert.equal(db.calls.length, 0);
});
test('wallet query scopes account and maps joined Pro cards; search is case insensitive', async () => {
  const db = client('A', [{ data: [{ saved_at: 'today', pro_cards: { id: card.id, company_name: 'Acme Plumbing', city: 'Miami' } }, { pro_cards: null }] }]);
  const cards = await readWallet(db, 'A');
  assert.equal(cards.length, 1); assert.equal(cards[0].savedAt, 'today');
  assert.equal(filterWallet(cards, ' MIAMI ').length, 1); assert.equal(filterWallet(cards, 'roof').length, 0);
  assert.equal(db.calls[0].filters[0][1], 'A');
});
test('server save errors and unacknowledged writes are rejected', async () => {
  await assert.rejects(() => saveWalletCard(client('A', [{ data: null }, { error: new Error('RLS denied') }]), 'A', card), /RLS denied/);
  await assert.rejects(() => saveWalletCard(client('A', [{ data: null }, { data: [] }]), 'A', card), /could not be saved/);
  const db = client('A', [{ data: null }, { data: [{ pro_card_id: card.id }] }]);
  await saveWalletCard(db, 'A', card); assert.equal(db.calls[1].insert.user_id, 'A');
});
test('already saved card is idempotent without another insertion', async () => {
  const db = client('A', [{ data: { pro_card_id: card.id } }]); await saveWalletCard(db, 'A', card); assert.equal(db.calls.length, 1);
});
test('removal checks both account and card and rejects RLS/zero-row responses', async () => {
  await assert.rejects(() => removeWalletCard(client('A', [{ error: new Error('Denied') }]), 'A', card.id), /Denied/);
  await assert.rejects(() => removeWalletCard(client('A'), 'A', card.id), /not removed/);
  const db = client('A', [{ data: [{ pro_card_id: card.id }] }]); await removeWalletCard(db, 'A', card.id);
  assert.equal(db.calls[0].filters[0][1], 'A'); assert.equal(db.calls[0].filters[1][1], card.id);
});
test('guest persistence failure is not acknowledged as success', async () => {
  const cache = storage(); cache.setItem = async () => { throw new Error('Disk full'); };
  await assert.rejects(() => saveWalletCard(client(null), null, card, cache), /Disk full/);
  await assert.rejects(() => removeWalletCard(client(null), null, card.id, cache), /Disk full/);
});
