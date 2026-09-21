const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const roots=['tavvy-web','tavvy-mobile','tavvy-admin-portal','tavvy-pros-portal','tavvy-review-agent'].map(repo=>[repo,path.resolve(__dirname,'../..',repo)]);
roots.push(['deployed-edge','/private/tmp/tavvy-edge-audit/supabase/functions']);
const findings=[];let filesScanned=0;
function walk(dir,fn){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','.next','dist','dist-audit','build','coverage'].includes(ent.name))continue;const file=path.join(dir,ent.name);if(ent.isDirectory())walk(file,fn);else if(/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(ent.name))fn(file)}}
function sourceTable(node){if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){if(node.expression.name.text==='from')return node.arguments[0]?.text;return sourceTable(node.expression.expression)}return null}
for(const [repo,root] of roots){walk(root,file=>{if(file.includes('/scripts/')||file.includes('/tests/')||file.includes('/__tests__/'))return;filesScanned++;const text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);function visit(node){if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='select'){
const arg=node.arguments[0],projection=arg&&(ts.isStringLiteralLike(arg)||ts.isNoSubstitutionTemplateLiteral(arg))?arg.text:arg?'<dynamic>':'*';const table=sourceTable(node.expression.expression);
if(table==='place_reviews'||/place_reviews[\s!:(]/.test(projection)){
const runtime=repo==='tavvy-admin-portal'&&file.includes('/server/')?'admin service-role':repo==='tavvy-review-agent'?'backend agent':'public/client';
findings.push({repo,file:path.relative(root,file),line:tree.getLineAndCharacterOfPosition(node.getStart()).line+1,table,projection:projection.trim().replace(/\s+/g,' '),runtime});
}}ts.forEachChild(node,visit)}visit(tree)})}
const unsafe=findings.filter(f=>f.runtime==='public/client'&&((f.table==='place_reviews'&&f.projection.split(',').some(x=>x.trim()==='*'))||/place_reviews[!\w:]*\s*\(\s*\*/.test(f.projection)));
const report={filesScanned,queryCount:findings.length,unsafePublicWildcardCount:unsafe.length,findings};
fs.writeFileSync(path.resolve(__dirname,'../docs/schema-audit/review-reader-compatibility.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({filesScanned,queryCount:findings.length,unsafePublicWildcardCount:unsafe.length}));
if(unsafe.length){console.error(unsafe);process.exitCode=1}
