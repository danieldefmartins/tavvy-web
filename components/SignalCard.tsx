import React, { useState } from 'react';
import { ArrowRight, Globe, Navigation, Phone } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import PlaceReviewGrid from './PlaceReviewGrid';
import { coreForCategory } from '../lib/placeEvidence';
import { categoryImageForPlace, realPlacePhotos } from '../lib/placePreviewImage';
import { formatPlaceDistance } from '../lib/placeDistance';
import { buildPlaceReviewSummary, PlaceReviewSummary, ReviewSummaryStatus } from '../lib/placeReviewSummary';

export type CardSignal = { label:string; emoji?:string; category:'good'|'vibe'|'headsup'; count:number };
export type SignalCardPlace = {
  id:string; name:string; category?:string; city?:string; state_region?:string; region?:string;
  address?:string; address_line1?:string; photos?:string[]; photo_url?:string; photo?:string; cover_image_url?:string;
  distance?:number; distanceLabel?:string; latitude?:number; longitude?:number; phone?:string; website?:string;
  tavvy_category?:string; subcategory?:string; reviewSummary?:PlaceReviewSummary; evidenceStatus?:ReviewSummaryStatus;
};
function safeWebsite(value?:string) {
  if (!value) return '';
  try { const url=new URL(/^https?:\/\//i.test(value)?value:'https://'+value); return ['https:','http:'].includes(url.protocol)?url.href:''; } catch { return ''; }
}
export default function SignalCard({place,onClick}:{place:SignalCardPlace;onClick?:()=>void}) {
  const {theme,isDark}=useThemeContext(); const copy=useReleaseCopy();
  const [failedPhotos,setFailedPhotos]=useState<string[]>([]);
  const actual=realPlacePhotos(place).filter(url=>!failedPhotos.includes(url));
  const isCategory=!actual.length;
  const photos=isCategory?[categoryImageForPlace(place)]:actual.slice(0,5);
  const candidateSummary=place.reviewSummary && (!place.evidenceStatus || place.reviewSummary.status===place.evidenceStatus)
    ? place.reviewSummary : buildPlaceReviewSummary(null,{category:place.tavvy_category||place.category,subcategory:place.subcategory},place.evidenceStatus||'unavailable');
  const summary={...candidateSummary,coreLabel:candidateSummary.coreLabel||coreForCategory({category:place.tavvy_category||place.category,subcategory:place.subcategory}).label};
  const distance=formatPlaceDistance(place.distance);
  const category=(place.subcategory||place.category||'').replace(/_/g,' ');
  const address=[place.address_line1||place.address,place.city,place.state_region||place.region].filter(Boolean).join(', ');
  const website=safeWebsite(place.website);
  const coordinates=Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude!)<=90&&Math.abs(place.longitude!)<=180;
  const directions=coordinates?place.latitude+','+place.longitude:address;
  const phone=place.phone?.replace(/[^+\d,;*#]/g,'');
  return <article className="card" aria-label={place.name}>
    <div className="identity-row"><button className="identity" onClick={onClick} type="button">
      <h3>{place.name}</h3>
      <div className="meta"><span>{category}</span>{distance&&<span title={place.distanceLabel||'Straight-line distance from the search location'}> · {distance}</span>}</div>
      {address&&<p className="address">{address}</p>}
    </button>
    <button className="photo" onClick={onClick} type="button" aria-label={place.name+' · '+copy(isCategory?'Category illustration':'Photos')}>
      <img src={photos[0]} loading="lazy" alt={isCategory?copy('Category illustration'):place.name} onError={()=>{if(!isCategory)setFailedPhotos(previous=>[...previous,photos[0]]);}}/>
      {isCategory ? <span className="illustration">{copy('Illustration')}</span> : actual.length > 1 && <span className="photo-count">+{actual.length - 1}</span>}
    </button></div>
    <button className="reviews" onClick={onClick} type="button"><PlaceReviewGrid summary={summary} explain /></button>
    <nav className="actions" aria-label={copy('Place actions')}>
      {directions&&<a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(directions)} target="_blank" rel="noopener noreferrer"><Navigation size={16}/>{copy('Directions')}</a>}
      {phone&&<a href={'tel:'+phone}><Phone size={16}/>{copy('Call')}</a>}
      {website&&<a href={website} target="_blank" rel="noopener noreferrer"><Globe size={16}/>{copy('Website')}</a>}
      <button onClick={onClick} type="button">{copy('Details')}<ArrowRight size={16}/></button>
    </nav>
    <style jsx>{`
.card{width:100%;overflow:hidden;background:${theme.cardBackground};color:${theme.text};border:1px solid ${theme.border};border-radius:18px;margin-bottom:10px;box-shadow:0 3px 14px ${isDark?"rgba(0,0,0,.18)":"rgba(23,1,58,.06)"}}
button{font:inherit;cursor:pointer;color:inherit}button:focus-visible,a:focus-visible{outline:3px solid #8a05be;outline-offset:-3px}
.identity{display:block;text-align:left;padding:0;flex:1;min-width:0;border:0;background:none}
h3{font-size:17px;line-height:1.3;margin:0 0 4px;font-weight:750;overflow-wrap:anywhere}
.meta{font-size:13px;line-height:1.5;color:${theme.textSecondary}}.meta>span:first-child{text-transform:capitalize}
.address{font-size:12px;line-height:1.5;margin:3px 0 0;color:${theme.textSecondary};overflow-wrap:anywhere}
.identity-row{display:flex;gap:12px;padding:14px 14px 8px;align-items:flex-start}.photo{position:relative;flex:none;width:76px;height:76px;padding:0;border:0;border-radius:12px;overflow:hidden;background:${theme.surface}}.photo img{display:block;width:100%;height:100%;object-fit:cover}.illustration,.photo-count{position:absolute;inset-inline-end:3px;bottom:3px;padding:2px 4px;border-radius:4px;background:rgba(0,0,0,.72);color:white;font-size:9px}
.reviews{display:block;width:100%;padding:3px 14px 8px;text-align:start;border:0;background:none}
.actions{display:flex;gap:8px;overflow-x:auto;padding:0 10px 7px;scrollbar-width:none}
.actions a,.actions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;border:0;border-radius:10px;padding:8px 9px;background:transparent;color:${isDark ? "#D9B6FF" : theme.primary};text-decoration:none;font-size:12px;font-weight:600;min-height:44px}
    `}</style>
  </article>;
}
