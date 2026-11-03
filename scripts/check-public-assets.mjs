#!/usr/bin/env node
// Fails the build when a static file the site needs is missing from public/.
//
// Why: on 2026-10-09 tavvy.com was deployed from a checkout whose images had
// been hidden by `git sparse-checkout` (a disk-cleanup job). The build passed,
// and logos, favicon, wallet icons, e-card templates and e-card photos went
// 404 in production. This check makes that kind of deploy fail loudly instead.
//
// It checks two things:
//   1. every "/path/file.(png|jpg|svg|...)" literal in the source code exists in public/
//   2. every path listed in scripts/required-public-assets.txt exists in public/
//      (files referenced only from the database, e.g. e-card profile photos)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const publicDir = path.join(root, 'public');
const SOURCE_DIRS = ['pages', 'components', 'lib', 'constants', 'config', 'contexts', 'hooks', 'styles'];
const SOURCE_EXT = /\.(tsx?|jsx?|mjs|css)$/;
const ASSET_RE = /["'`(]((?:\/[A-Za-z0-9_\-.%]+)+\.(?:png|jpe?g|svg|webp|gif|ico|avif))(?=["'`)?#])/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.test(entry.name)) out.push(p);
  }
  return out;
}

const missing = new Map(); // asset -> first referencing file
const check = (asset, from) => {
  const rel = decodeURIComponent(asset.replace(/^\//, ''));
  if (!fs.existsSync(path.join(publicDir, rel)) && !missing.has(asset)) missing.set(asset, from);
};

let referenced = 0;
for (const dir of SOURCE_DIRS) {
  for (const file of walk(path.join(root, dir))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(ASSET_RE)) {
      const asset = m[1];
      if (asset.startsWith('//') || asset.startsWith('/_next/') || asset.startsWith('/api/')) continue;
      referenced++;
      check(asset, path.relative(root, file));
    }
  }
}

const requiredList = path.join(root, 'scripts', 'required-public-assets.txt');
let required = 0;
if (fs.existsSync(requiredList)) {
  for (const line of fs.readFileSync(requiredList, 'utf8').split('\n')) {
    const asset = line.trim();
    if (!asset || asset.startsWith('#')) continue;
    required++;
    check(asset.startsWith('/') ? asset : `/${asset}`, 'scripts/required-public-assets.txt');
  }
}

if (missing.size) {
  console.error(`\n✖ ${missing.size} static file(s) are missing from public/ — the deploy would show broken images:\n`);
  for (const [asset, from] of missing) console.error(`  ${asset}   (used in ${from})`);
  console.error('\nIf this checkout uses sparse-checkout, run `git sparse-checkout disable` and rebuild.');
  console.error('Deploy from GitHub (push), not `railway up` from a local folder.\n');
  process.exit(1);
}
console.log(`✓ public assets OK (${referenced} code references, ${required} required files)`);
