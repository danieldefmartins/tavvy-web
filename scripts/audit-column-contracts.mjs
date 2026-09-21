import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
const metadata=JSON.parse(fs.readFileSync('docs/schema-audit/public-schema.json','utf8'));
const columns=new Map();for(const row of metadata.columns){if(!columns.has(row.table))columns.set(row.table,new Set());columns.get(row.table).add(row.column);}
// Reviewed migrations applied during this audit; source snapshot is retained for RLS regression fixtures.
for(const c of ['dish_type','dish_aliases','food_search_document'])columns.get('menu_items').add(c);
const findings=[];let checked=0;
function literal(n){return n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))?n.text:null;}
function tableOf(n){
 if(!n)return null;
 if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){
  if(n.expression.name.text==='from'){
   if(n.expression.expression.getText().includes('.storage'))return null;
   return literal(n.arguments[0]);
  }
  return tableOf(n.expression.expression);
 }
 return null;
}
function topFields(s){let depth=0,start=0,out=[];for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(s[i]===','&&depth===0){out.push(s.slice(start,i));start=i+1;}}out.push(s.slice(start));return out.map(x=>x.trim());}
function files(dir){let out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git','dist','dist-audit','ios','android','docs','scripts','tests','supabase','.expo'].includes(entry.name))continue;const f=path.join(dir,entry.name);if(entry.isDirectory())out.push(...files(f));else if(/\.(tsx?|jsx?)$/.test(entry.name)&&!entry.name.endsWith('.d.ts'))out.push(f);}return out;}
for(const repo of ['tavvy-web','tavvy-mobile','tavvy-admin-portal','tavvy-pros-portal']){
 const root=path.resolve('..',repo);
 for(const file of files(root)){
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(n){
   if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){
    const method=n.expression.name.text;const table=tableOf(n.expression.expression);const known=columns.get(table);
    if(known?.size){let fields=[];
     if(method==='select'&&literal(n.arguments[0]))fields=topFields(literal(n.arguments[0])).filter(x=>!/[()*!]/.test(x)).map(x=>x.split(':').at(-1));
     if(['eq','neq','gt','gte','lt','lte','like','ilike','is','in','contains','containedBy','overlaps','order'].includes(method))fields=[literal(n.arguments[0])];
     if(['insert','update','upsert'].includes(method)&&n.arguments[0]&&ts.isObjectLiteralExpression(n.arguments[0]))fields=n.arguments[0].properties.filter(ts.isPropertyAssignment).map(p=>literal(p.name)||p.name.getText());
     for(const column of fields){if(!column||!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column))continue;checked++;if(!known.has(column)){const line=source.getLineAndCharacterOfPosition(n.getStart()).line+1;findings.push({repository:repo,file:path.relative(root,file),line,table,column,method});}}
    }
   }
   ts.forEachChild(n,visit);
  }visit(source);
 }
}
const unique=[...new Map(findings.map(x=>[JSON.stringify(x),x])).values()];
fs.writeFileSync('docs/schema-audit/column-contract-findings.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Literal public-table chain columns only; potential defects requiring source review. Excludes dynamic builders, relation projections, storage, deployed edge source and migrations.',checked,findings:unique},null,2)+'\n');
console.log(JSON.stringify({checked,findings:unique.length,examples:unique.slice(0,22)},null,2));
