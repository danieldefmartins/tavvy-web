import React, { useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Globe, Navigation, Phone } from 'lucide-react';
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
/**
 * Search card: the name and facts sit on a swipeable photo header, the review rows carry
 * their bars as row backgrounds, and the icon row keeps the same shortcuts as the place page.
 */
export default function SignalCard({place,onClick}:{place:SignalCardPlace;onClick?:()=>void}) {
  const {theme,isDark}=useThemeContext(); const copy=useReleaseCopy();
  const [failedPhotos,setFailedPhotos]=useState<string[]>([]);
  const [slide,setSlide]=useState(0);
  const trackRef=useRef<HTMLDivElement>(null);
  const actual=realPlacePhotos(place).filter(url=>!failedPhotos.includes(url));
  const isCategory=!actual.length;
  // Real photos swipe; a category illustration is a single labeled fallback, never a gallery.
  const photos=isCategory?[categoryImageForPlace(place)]:actual.slice(0,MAX_CARD_PHOTOS);
  const current=Math.min(slide,photos.length-1);
  const step=(direction:number)=>{const el=trackRef.current; if(!el) return; const next=Math.max(0,Math.min(photos.length-1,current+direction)); el.scrollTo({left:next*el.clientWidth,behavior:'smooth'}); setSlide(next);};
  const onScroll=(event:React.UIEvent<HTMLDivElement>)=>{const el=event.currentTarget; if(!el.clientWidth) return; const next=Math.round(el.scrollLeft/el.clientWidth); if(next!==slide) setSlide(next);};
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
  // Anywhere on the card opens the place; the inner links and photo arrows stop the click from bubbling.
  const stop=(event:React.SyntheticEvent)=>event.stopPropagation();
  return <article className={onClick?'card clickable':'card'} aria-label={place.name} onClick={onClick} onKeyDown={onClick?(event)=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onClick();}}:undefined} tabIndex={onClick?0:undefined} role={onClick?'link':undefined}>
    <header className="hero">
      <div className="track" ref={trackRef} onScroll={onScroll} role="region" aria-roledescription="carousel" aria-label={place.name+' · '+copy(isCategory?'Category illustration':'Photos')}>
        {photos.map((src,i)=><div className="slide" key={src+i} role="group" aria-roledescription="slide" aria-label={`${i+1} / ${photos.length}`}>
          <img src={src} loading={i<2?'eager':'lazy'} alt={isCategory?copy('Category illustration'):place.name} onError={()=>{if(!isCategory)setFailedPhotos(previous=>[...previous,src]);}}/>
        </div>)}
      </div>
      <div className="shade" aria-hidden="true"/>
      <button className="identity" onClick={onClick} type="button">
        <h3>{place.name}</h3>
        <p className="meta"><span>{category}</span>{distance&&<span title={place.distanceLabel||'Straight-line distance from the search location'}> · {distance}</span>}</p>
        {address&&<p className="address">{address}</p>}
      </button>
      {isCategory&&<span className="illustration">{copy('Illustration')}</span>}
      {photos.length>1&&<div className="photo-nav" aria-label={copy('Photos')} onClick={stop}>
        <button type="button" className="step" aria-label="Previous photo" disabled={current===0} onClick={()=>step(-1)}><ChevronLeft size={16}/></button>
        <span className="photo-count" aria-live="polite">{current+1} / {photos.length}</span>
        <button type="button" className="step" aria-label="Next photo" disabled={current===photos.length-1} onClick={()=>step(1)}><ChevronRight size={16}/></button>
      </div>}
    </header>
    <div className="reviews"><PlaceReviewGrid summary={summary} explain onOpen={onClick?()=>onClick():undefined} /></div>
    <nav className="actions" aria-label={copy('Place actions')} onClick={stop}>
      {phone&&<a href={'tel:'+phone}><span className="ic"><Phone size={18}/></span>{copy('Call')}</a>}
      {directions&&<a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(directions)} target="_blank" rel="noopener noreferrer"><span className="ic"><Navigation size={18}/></span>{copy('Directions')}</a>}
      {website&&<a href={website} target="_blank" rel="noopener noreferrer"><span className="ic"><Globe size={18}/></span>{copy('Website')}</a>}
      <button onClick={onClick} type="button"><span className="ic"><ArrowUpRight size={18}/></span>{copy('Details')}</button>
    </nav>
    <style jsx>{`
.card.clickable{cursor:pointer}.card.clickable:focus-visible{outline:3px solid #8a05be;outline-offset:2px}
.card{width:100%;overflow:hidden;background:${theme.cardBackground};color:${theme.text};border:1px solid ${theme.border};border-radius:20px;margin-bottom:12px;box-shadow:0 3px 14px ${isDark?"rgba(0,0,0,.18)":"rgba(23,1,58,.06)"}}
button{font:inherit;cursor:pointer;color:inherit}button:focus-visible,a:focus-visible{outline:3px solid #8a05be;outline-offset:-3px}
.hero{position:relative;height:172px;background:${theme.surface}}
.track{display:flex;height:100%;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}.track::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;min-width:0;height:100%;scroll-snap-align:start}.slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 57%}
.shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.74) 0%,rgba(0,0,0,.38) 46%,rgba(0,0,0,.10) 100%)}
.identity{position:absolute;left:14px;top:12px;max-width:calc(100% - 28px);text-align:left;padding:0;border:0;background:none;color:white;text-shadow:0 1px 8px rgba(0,0,0,.45)}
h3{font-size:21px;line-height:1.2;margin:0 0 4px;font-weight:700;letter-spacing:-.3px;overflow-wrap:anywhere}
.meta{margin:0;font-size:13px;line-height:1.4;color:rgba(255,255,255,.94)}.meta>span:first-child{text-transform:capitalize}
.address{margin:2px 0 0;font-size:12px;line-height:1.4;color:rgba(255,255,255,.88);overflow-wrap:anywhere}
.illustration{position:absolute;left:12px;bottom:12px;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.55);color:white;font-size:12px;font-weight:600}
.photo-nav{position:absolute;right:10px;bottom:10px;display:inline-flex;align-items:center;gap:2px;background:rgba(0,0,0,.55);border-radius:20px;padding:2px}
.step{width:32px;height:32px;border:0;border-radius:50%;background:none;color:white;display:inline-flex;align-items:center;justify-content:center}.step:disabled{opacity:.35;cursor:default}
.photo-count{color:white;font-size:12px;font-weight:600;padding:0 4px;font-variant-numeric:tabular-nums}
.reviews{padding:10px 14px 2px}
.actions{display:flex;gap:4px;overflow-x:auto;padding:6px 8px 10px;scrollbar-width:none}.actions::-webkit-scrollbar{display:none}
.actions a,.actions button{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;width:66px;border:0;background:none;padding:2px 0;color:${theme.textSecondary};font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap}
.ic{width:40px;height:40px;border-radius:50%;background:${theme.surface};color:${theme.text};display:inline-flex;align-items:center;justify-content:center}
    `}</style>
  </article>;
}
