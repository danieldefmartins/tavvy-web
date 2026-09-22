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
const MAX_CARD_PHOTOS = 5;
function safeWebsite(value?:string) {
  if (!value) return '';
  try { const url=new URL(/^https?:\/\//i.test(value)?value:'https://'+value); return ['https:','http:'].includes(url.protocol)?url.href:''; } catch { return ''; }
}
export default function SignalCard({place,onClick}:{place:SignalCardPlace;onClick?:()=>void}) {
  const {theme,isDark}=useThemeContext(); const copy=useReleaseCopy();
  const [failedPhotos,setFailedPhotos]=useState<string[]>([]);
  const [slide,setSlide]=useState(0);
  const actual=realPlacePhotos(place).filter(url=>!failedPhotos.includes(url));
  const isCategory=!actual.length;
  // Real photos swipe; a category illustration is a single labeled fallback, never a gallery.
  const photos=isCategory?[categoryImageForPlace(place)]:actual.slice(0,MAX_CARD_PHOTOS);
  const current=Math.min(slide,photos.length-1);
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
  const onStripScroll=(event:React.UIEvent<HTMLDivElement>)=>{const el=event.currentTarget; if(!el.clientWidth) return; const next=Math.round(el.scrollLeft/el.clientWidth); if(next!==slide) setSlide(next);};
  return <article className="card" aria-label={place.name}>
    <div className={`gallery ${isCategory?'category':''}`}>
      <div className="strip" role="group" aria-label={place.name+' · '+copy(isCategory?'Category illustration':'Photos')} onScroll={onStripScroll}>
        {photos.map((src,i)=><button className="slide photo" key={src+i} onClick={onClick} type="button" aria-label={isCategory?copy('Category illustration'):`${place.name} · ${i+1}/${photos.length}`} tabIndex={i===current?0:-1}>
          <img src={src} loading={i<2?'eager':'lazy'} alt={isCategory?copy('Category illustration'):place.name} onError={()=>{if(!isCategory)setFailedPhotos(previous=>[...previous,src]);}}/>
        </button>)}
      </div>
      {isCategory ? <span className="illustration">{copy('Illustration')}</span> : photos.length>1 && <><span className="photo-count" aria-live="polite">{current+1}/{photos.length}</span>
        <span className="dots" aria-hidden="true">{photos.map((_,i)=><i key={i} className={i===current?'on':''}/>)}</span></>}
    </div>
    <button className="identity" onClick={onClick} type="button">
      <h3>{place.name}</h3>
      <div className="meta"><span>{category}</span>{distance&&<span title={place.distanceLabel||'Straight-line distance from the search location'}> · {distance}</span>}</div>
      {address&&<p className="address">{address}</p>}
    </button>
    <button className="reviews" onClick={onClick} type="button"><PlaceReviewGrid summary={summary} explain /></button>
    <nav className="actions" aria-label={copy('Place actions')}>
      {directions&&<a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(directions)} target="_blank" rel="noopener noreferrer"><Navigation size={16}/>{copy('Directions')}</a>}
      {phone&&<a href={'tel:'+phone}><Phone size={16}/>{copy('Call')}</a>}
      {website&&<a href={website} target="_blank" rel="noopener noreferrer"><Globe size={16}/>{copy('Website')}</a>}
      <button onClick={onClick} type="button">{copy('Details')}<ArrowRight size={16}/></button>
    </nav>
    <style jsx>{`
.card{width:100%;overflow:hidden;background:${theme.cardBackground};color:${theme.text};border:1px solid ${theme.border};border-radius:18px;margin-bottom:12px;box-shadow:0 3px 14px ${isDark?"rgba(0,0,0,.18)":"rgba(23,1,58,.06)"}}
button{font:inherit;cursor:pointer;color:inherit}button:focus-visible,a:focus-visible{outline:3px solid #8a05be;outline-offset:-3px}
.gallery{position:relative;width:100%;aspect-ratio:16/9;min-height:168px;max-height:212px;background:${theme.surface};overflow:hidden}
.strip{display:flex;height:100%;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}.strip::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;width:100%;height:100%;padding:0;border:0;background:none;scroll-snap-align:start;scroll-snap-stop:always}.slide img{display:block;width:100%;height:100%;object-fit:cover}
.illustration,.photo-count{position:absolute;inset-inline-end:10px;bottom:10px;padding:3px 8px;border-radius:7px;background:rgba(0,0,0,.66);color:white;font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}
.dots{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:5px;pointer-events:none}.dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 2px rgba(0,0,0,.4)}.dots i.on{background:white}
.identity{display:block;width:100%;text-align:left;padding:12px 14px 4px;border:0;background:none}
h3{font-size:17px;line-height:1.3;margin:0 0 3px;font-weight:750;overflow-wrap:anywhere}
.meta{font-size:13px;line-height:1.5;color:${theme.textSecondary}}.meta>span:first-child{text-transform:capitalize}
.address{font-size:12px;line-height:1.5;margin:2px 0 0;color:${theme.textSecondary};overflow-wrap:anywhere}
.reviews{display:block;width:100%;padding:8px 14px 8px;text-align:start;border:0;background:none;border-top:1px solid ${theme.border};margin-top:8px}
.actions{display:flex;gap:8px;overflow-x:auto;padding:0 10px 7px;scrollbar-width:none}
.actions a,.actions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;border:0;border-radius:10px;padding:8px 9px;background:transparent;color:${isDark ? "#D9B6FF" : theme.primary};text-decoration:none;font-size:12px;font-weight:600;min-height:44px}
    `}</style>
  </article>;
}
