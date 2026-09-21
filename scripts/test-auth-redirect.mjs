import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/authRedirect.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {safeAuthRedirect}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('preserves local destinations and rejects external/ambiguous login redirects',()=>{
 assert.equal(safeAuthRedirect('/app/saved?tab=places'),'/app/saved?tab=places');
 for(const value of [null,['/app'],'https://example.com','//example.com','/\\example.com','/\n/example.com','/auth/callback','/app/login']) assert.equal(safeAuthRedirect(value),'/app');
});
