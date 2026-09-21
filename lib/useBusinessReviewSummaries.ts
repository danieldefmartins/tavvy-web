import {useEffect,useState} from 'react';
import {MobileBusiness} from './onthego';
import {isBusinessUuid} from './onthegoDetails';
import {loadReviewSummaries} from './reviewSummaryLoader';
import {buildPlaceReviewSummary,PlaceReviewSummary} from './placeReviewSummary';

/** Reviews belong to a canonical place, never to a mobile-business or session ID. */
export function businessReviewSubjects(businesses:MobileBusiness[]){
 return Array.from(new Map(businesses.filter(b=>isBusinessUuid(b.canonical_place_id)).map(b=>[b.canonical_place_id!,{id:b.canonical_place_id!,category:b.category,subcategory:b.subcategory}])).values());
}
export function useBusinessReviewSummaries(businesses:MobileBusiness[]){
 const key=JSON.stringify(businessReviewSubjects(businesses));
 const [result,setResult]=useState<{key:string;values:Record<string,PlaceReviewSummary>}>({key:'',values:{}});
 useEffect(()=>{
  let active=true;const subjects=JSON.parse(key);
  if(subjects.length)void loadReviewSummaries(subjects).then(values=>{if(active)setResult({key,values});});
  return()=>{active=false;};
 },[key]);
 return(b:MobileBusiness)=>{
  const id=b.canonical_place_id;
  return isBusinessUuid(id)&&result.key===key&&result.values[id!]||buildPlaceReviewSummary(null,{category:b.category,subcategory:b.subcategory},isBusinessUuid(id)?'loading':'unavailable');
 };
}
