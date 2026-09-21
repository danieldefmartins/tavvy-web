import fs from 'node:fs';
import path from 'node:path';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const routes=walk('pages').filter(f=>/\.tsx?$/.test(f)&&!f.includes('/api/')&&!path.basename(f).startsWith('_')).map(f=>'/'+f.replace(/^pages\//,'').replace(/\.(tsx?|jsx?)$/,'').replace(/(^|\/)index$/,''));
const patterns=routes.filter(r=>r!=='/[username]').map(r=>new RegExp('^'+r.replace(/\[\.\.\.[^\]]+\]/g,'.+').replace(/\[[^\]]+\]/g,'[^/]+').replace(/\/$/,'')+'/?$'));
const missing=[];
for(const file of [...walk('pages'),...walk('components')].filter(f=>/\.[jt]sx?$/.test(f)&&!f.includes('/api/'))) {
 const source=fs.readFileSync(file,'utf8');
 for(const m of source.matchAll(/(?:href\s*=\s*|(?:router\.(?:push|replace)|location\.assign)\(\s*)["'](\/[^"'`{}]*)["']/g)){
  const route=m[1].split(/[?#]/)[0];
  if(route.startsWith('//')||/\.[a-z0-9]+$/i.test(route)||route.startsWith('/api/'))continue;
  if(!patterns.some(p=>p.test(route)))missing.push({file,line:source.slice(0,m.index).split('\n').length,target:m[1]});
 }
}
fs.writeFileSync('docs/link-inventory.json',JSON.stringify({scope:'Static literal links and router calls; dynamic data links and auth-dependent navigation still require runtime checks.',routes,missing},null,2)+'\n');
console.log(JSON.stringify({routes:routes.length,missing},null,2));
