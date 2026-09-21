const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

for (const name of ['pros-providers-search', 'pros-providers-featured', 'pros-providers-get-by-slug']) {
  test(`${name} forwards user JWTs but never a publishable key as bearer auth`, async () => {
    let serveHandler;
    const clientOptions = [];
    const dependencies = {
      'https://deno.land/std@0.168.0/http/server.ts': { serve: fn => { serveHandler = fn; } },
      'https://esm.sh/@supabase/supabase-js@2': { createClient: (_url, _key, options) => { clientOptions.push(options); return {}; } },
      '../_shared/providerPublicHandler.ts': { createProviderPublicHandler: () => () => new Response('{}') },
    };
    const source = fs.readFileSync(path.join(__dirname, `../supabase/functions/${name}/index.ts`), 'utf8');
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
      { module, exports: module.exports, Response, Deno: { env: { get: key => key === 'SUPABASE_URL' ? 'https://example.invalid' : 'sb_publishable_test' } },
        require: key => { assert.ok(key in dependencies, `Unexpected import ${key}`); return dependencies[key]; } });
    assert.equal(typeof serveHandler, 'function');
    await serveHandler(new Request('https://example.invalid', { method: 'POST', headers: { Authorization: 'Bearer sb_publishable_test' } }));
    await serveHandler(new Request('https://example.invalid', { method: 'POST', headers: { Authorization: 'Bearer aaa.bbb.ccc' } }));
    assert.deepEqual(JSON.parse(JSON.stringify(clientOptions[0].global.headers)), {});
    assert.deepEqual(JSON.parse(JSON.stringify(clientOptions[1].global.headers)), { Authorization: 'Bearer aaa.bbb.ccc' });
  });
}
