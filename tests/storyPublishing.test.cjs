const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function load(repo = path.resolve(__dirname, '..')) {
  const exports = {};
  new Function('exports', ts.transpileModule(fs.readFileSync(path.join(repo, 'lib/storyPublishing.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(exports); return exports;
}
const service = load();
const input = { placeId: 'place', mediaPath: 'user/place/file.jpg', mediaType: 'image', kind: 'customer', caption: 'Lunch #pasta', location: { latitude: 42, longitude: -71 } };
const saved = { id: 'saved', place_id: 'place', media_type: 'image', story_kind: 'customer', status: 'active', caption: 'Lunch #pasta', tags: ['pasta'] };
function client(publish, reconcile = { data: null }, removeError = null) {
  const calls = [], removed = [];
  return { calls, removed, async rpc(name, args) {
    calls.push({ name, args }); const result = name === 'publish_place_story' ? publish : reconcile;
    if (result instanceof Error) throw result; return result;
  }, storage: { from: () => ({ remove: async paths => { removed.push(...paths); return { error: removeError }; } }) } };
}
test('successful shared contract sends identity-free server fields and deduplicated tags', async () => {
  const c = client({ data: saved }); assert.equal((await service.publishUploadedStory(c, input)).id, 'saved');
  assert.equal(c.calls[0].args.p_latitude, 42); assert.equal(c.calls[0].args.p_story_kind, 'customer');
  assert.deepEqual(c.calls[0].args.p_tags, ['pasta']);
  assert.equal('p_user_id' in c.calls[0].args, false); assert.equal('p_expires_at' in c.calls[0].args, false);
  assert.deepEqual(c.removed, []);
});
test('definite database rejection cleans the owned upload and gives consistent error', async () => {
  const c = client({ error: { code: 'P0001', message: 'STORY_OUTSIDE_RADIUS' } });
  await assert.rejects(service.publishUploadedStory(c, input), error => error instanceof service.StoryPublishError && !error.keepUpload && /closer/.test(error.message));
  assert.deepEqual(c.removed, [input.mediaPath]);
});
test('network failure after commit reconciles and preserves published media', async () => {
  const c = client(new Error('network lost'), { data: saved });
  assert.equal((await service.publishUploadedStory(c, input)).id, 'saved');assert.deepEqual(c.removed, []);
});
test('uncertain commit keeps original media for idempotent retry even when a later read is empty', async () => {
  for (const response of [{ data: null }, { error: { message: 'network' } }]) {
    const c = client(new Error('network lost'), response);
    await assert.rejects(service.publishUploadedStory(c, input), error => error.keepUpload && /safely retry/.test(error.message));
    assert.deepEqual(c.removed, []);
  }
});
test('a retry conflict never deletes media, including reconciliation failures', async () => {
  for (const reconcile of [{ data: { ...saved, caption: 'Different story' } }, { error: { message: 'network' } }]) {
    const c = client({ error: { code: 'P0001', message: 'STORY_RETRY_MISMATCH' } }, reconcile);
    await assert.rejects(service.publishUploadedStory(c, input), error => error.keepUpload && /different details/.test(error.message));
    assert.deepEqual(c.removed, []);
  }
});
test('failed cleanup is surfaced and unsupported media is rejected', async () => {
  const c = client({ error: { code: 'P0001', message: 'STORY_MEDIA_TOO_LARGE' } }, { data: null }, { message: 'storage unavailable' });
  await assert.rejects(service.publishUploadedStory(c, input), error => error.cleanupFailed === true);
  assert.equal(service.storyMediaDetails('payload.html', 'text/html'), null);
  assert.deepEqual(service.storyMediaDetails('clip.MOV'), { type: 'video', mime: 'video/quicktime', extension: 'mov' });
});
test('web/mobile publishing contract and messages are byte-for-byte identical', () => {
  const file = fs.readFileSync(path.join(__dirname, '../lib/storyPublishing.ts'), 'utf8');
  assert.equal(file, fs.readFileSync(path.join(__dirname, '../../tavvy-mobile/lib/storyPublishing.ts'), 'utf8'));
});
