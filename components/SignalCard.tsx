import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
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
/**
 * Comparison card: name and useful facts first with a substantial photo beside them, three
 * compact review rows, and one shortcut. The name and photo open the place; phone and website
 * stay on the place page so one result plus part of the next fits a phone screen.
 */
export default function SignalCard({place,onClick}:{place:SignalCardPlace;onClick?:()=>void}) {
  const {theme,isDark}=useThemeContext(); const copy=useReleaseCopy();
  const [failedPhotos,setFailedPhotos]=useState<string[]>([]);
  const actual=realPlacePhotos(place).filter(url=>!failedPhotos.includes(url));
  const isCategory=!actual.length;
  const photo=isCategory?categoryImageForPlace(place):actual[0];
  const candidateSummary=place.reviewSummary && (!place.evidenceStatus || place.reviewSummary.status===place.evidenceStatus)
    ? place.reviewSummary : buildPlaceReviewSummary(null,{category:place.tavvy_category||place.category,subcategory:place.subcategory},place.evidenceStatus||'unavailable');
  const summary={...candidateSummary,coreLabel:candidateSummary.coreLabel||coreForCategory({category:place.tavvy_category||place.category,subcategory:place.subcategory}).label};
  const distance=formatPlaceDistance(place.distance);
  const category=(place.subcategory||place.category||'').replace(/_/g,' ');
  const address=[place.address_line1||place.address,place.city,place.state_region||place.region].filter(Boolean).join(', ');
  const coordinates=Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)&&Math.abs(place.latitude!)<=90&&Math.abs(place.longitude!)<=180;
  const directions=coordinates?place.latitude+','+place.longitude:address;
  return <article className="card" aria-label={place.name}>
    <div className="top">
      <button className="identity" onClick={onClick} type="button">
        <h3>{place.name}</h3>
        <div className="meta"><span>{category}</span>{distance&&<span title={place.distanceLabel||'Straight-line distance from the search location'}> · {distance}</span>}</div>
        {address&&<p className="address">{address}</p>}
      </button>
      <button className="photo" onClick={onClick} type="button" aria-label={place.name+' · '+copy(isCategory?'Category illustration':'Photos')}>
        <img src={photo} loading="lazy" alt={isCategory?copy('Category illustration'):place.name} onError={()=>{if(!isCategory)setFailedPhotos(previous=>[...previous,photo]);}}/>
        {isCategory ? <span className="illustration">{copy('Illustration')}</span> : actual.length>1 && <span className="photo-count">+{actual.length-1}</span>}
      </button>
    </div>
    <button className="reviews" onClick={onClick} type="button"><PlaceReviewGrid summary={summary} explain /></button>
    {directions&&<nav className="actions" aria-label={copy('Place actions')}>
      <a href={'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(directions)} target="_blank" rel="noopener noreferrer"><Navigation size={15}/>{copy('Directions')}</a>
    </nav>}
    <style jsx>{`
.card{width:100%;overflow:hidden;background:${theme.cardBackground};color:${theme.text};border:1px solid ${theme.border};border-radius:18px;margin-bottom:10px;box-shadow:0 3px 14px ${isDark?"rgba(0,0,0,.18)":"rgba(23,1,58,.06)"}}
button{font:inherit;cursor:pointer;color:inherit}button:focus-visible,a:focus-visible{outline:3px solid #8a05be;outline-offset:-3px}
.top{display:flex;gap:12px;align-items:flex-start;padding:12px 12px 4px 14px}
.identity{display:block;flex:1;min-width:0;text-align:left;padding:2px 0 0;border:0;background:none}
h3{font-size:17px;line-height:1.25;margin:0 0 4px;font-weight:750;overflow-wrap:anywhere}
.meta{font-size:13px;line-height:1.45;color:${theme.textSecondary}}.meta>span:first-child{text-transform:capitalize}
.address{font-size:12px;line-height:1.45;margin:3px 0 0;color:${theme.textSecondary};overflow-wrap:anywhere}
.photo{position:relative;flex:none;width:38%;max-width:136px;aspect-ratio:1;padding:0;border:0;border-radius:14px;overflow:hidden;background:${theme.surface}}.photo img{display:block;width:100%;height:100%;object-fit:cover}
.illustration,.photo-count{position:absolute;inset-inline-end:6px;bottom:6px;padding:2px 6px;border-radius:5px;background:rgba(0,0,0,.66);color:white;font-size:10px;font-weight:700}
.reviews{display:block;width:100%;padding:6px 14px 4px;text-align:start;border:0;background:none}
.actions{display:flex;padding:0 8px 6px}
.actions a{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:10px;padding:8px 8px;background:transparent;color:${isDark ? "#D9B6FF" : theme.primary};text-decoration:none;font-size:12.5px;font-weight:650;min-height:40px}
      @media(max-width:360px){.photo{width:34%}}
    `}</style>
  </article>;
}
