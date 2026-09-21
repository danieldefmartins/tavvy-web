import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { getCruiseShip } from '../../../../lib/cruises/service';
import { cruiseShareMetadata } from '../../../../lib/cruises/share';

const escape = (value:string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
function lines(value:string):string[] {
  const chunks:string[]=[];let current='';
  for(const word of value.split(' ')){if((current+' '+word).length>29&&current){chunks.push(current);current=word}else current=current?current+' '+word:word;}
  if(current)chunks.push(current);
  return chunks.slice(0,3).map((line,i)=>line.length>35?line.slice(0,34)+'…':i===2&&chunks.length>3?line+'…':line);
}
let fontPath:string | undefined;
export default async function handler(req:NextApiRequest,res:NextApiResponse) {
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  if(typeof req.query.slug!=='string'){return res.status(400).end();}
  let detail;try{detail=await getCruiseShip({slug:req.query.slug})}catch{res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Ship preview unavailable'});}
  if(!detail){res.setHeader('Cache-Control','no-store');return res.status(404).json({error:'Ship preview unavailable'});}
  const {name,category,location}=cruiseShareMetadata(detail);
  // No arbitrary remote fetches: real photos are linked directly in page metadata.
  // Reuse the existing Resvg dependency and Next's bundled font for a distinct text fallback.
  if(!fontPath){
    fontPath=path.join(process.cwd(),'node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf');
    // next.config.js explicitly includes this asset in standalone file tracing.
    readFileSync(fontPath);
  }
  const title=lines(name),start=title.length===3?245:title.length===2?280:315;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#F7F4FC"/><rect x="0" y="0" width="16" height="630" fill="#8A05BE"/><circle cx="1130" cy="80" r="260" fill="#EDE4F7"/><text x="80" y="115" font-family="Noto Sans" font-size="28" fill="#65516E">${escape(category.slice(0,65))}</text>${title.map((line,i)=>`<text x="80" y="${start+i*84}" font-family="Noto Sans" font-size="68" fill="#21162A">${escape(line)}</text>`).join('')}<text x="80" y="535" font-family="Noto Sans" font-size="30" fill="#65516E">${escape(location.slice(0,65)||'Explore this place')}</text><text x="1090" y="576" text-anchor="end" font-family="Noto Sans" font-size="28" fill="#8A05BE">Tavvy</text></svg>`;
  const png=new Resvg(svg,{font:{fontFiles:[fontPath],loadSystemFonts:false,defaultFontFamily:'Noto Sans'}}).render().asPng();
  res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');res.setHeader('X-Content-Type-Options','nosniff');
  return req.method==='HEAD'?res.status(200).end():res.status(200).send(png);
}
