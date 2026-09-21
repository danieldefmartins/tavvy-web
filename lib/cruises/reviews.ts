import {supabase} from '../supabaseClient';
import {buildPlaceEvidence,unavailablePlaceEvidence,PlaceEvidence,EvidenceVisit} from '../placeEvidence';
import {pendingReviewRequest,confirmReviewRequest} from '../reviewRequestStore';
export type CruiseSignal={id:string;slug:string;label:string;signal_type:'best_for'|'vibe'|'heads_up'};
export type CruiseReview={id:string;sailing_date:string;public_note:string|null;cabin_category_name:string|null;signals:{label:string;category:string;intensity:number}[]};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function fetchCruiseEvidence(universeId:string,client=supabase,retried=false):Promise<PlaceEvidence>{
 try{
  const visits:EvidenceVisit[]=[];let cursor='0',snapshot:string|null=null;
  for(let page=0;page<100;page++){
   const response: {data:unknown;error:any}=await client.rpc('get_cruise_universe_evidence_v1',{p_universe_id:universeId,p_cursor:cursor,p_snapshot:snapshot,p_limit:500});
   const data:any=response.data;const error:any=response.error;
   if(error?.code==='40001'&&!retried)return fetchCruiseEvidence(universeId,client,true);
   if(error||!data||!Array.isArray(data.visits)||typeof data.complete!=='boolean'||typeof data.snapshot!=='string')throw Error('Incomplete guest reports');
   for(const visit of data.visits){if(!visit.reviewId||!visit.userId||!Array.isArray(visit.signals)||!Number.isFinite(Date.parse(visit.visitedAt)))throw Error('Invalid guest report');visits.push(visit);}
   snapshot=data.snapshot;if(data.complete)return buildPlaceEvidence(visits,'cruise_ship');
   if(!data.next_cursor||data.next_cursor===cursor)throw Error('Incomplete guest reports');cursor=data.next_cursor;
  }
  throw Error('Guest history exceeds the complete-summary limit');
 }catch{return unavailablePlaceEvidence('cruise_ship','Guest reports are temporarily unavailable.');}
}
export async function fetchCruiseReviews(universeId:string,offset=0):Promise<{total:number;reviews:CruiseReview[]}>{
 const {data,error}=await supabase.rpc('get_cruise_universe_reviews_v1',{p_universe_id:universeId,p_offset:offset,p_limit:20});
 if(error||!data||!Array.isArray(data.reviews)||typeof data.total!=='number')throw Error('Guest reports are temporarily unavailable.');return data;
}
export async function fetchCruiseSignals():Promise<CruiseSignal[]>{
 const {data,error}=await supabase.from('review_items').select('id,slug,label,signal_type').eq('is_active',true).eq('category','cruise_ship').like('slug','cruise_%').order('sort_order').order('id');
 if(error||!data?.length)throw Error('Ship experience signals are temporarily unavailable.');return data as CruiseSignal[];
}
export async function saveCruiseVisit(input:{universeId:string;sailingDate:string;signals:{signalId:string;intensity:number}[];publicNote?:string;cabinCategoryId?:string|null}):Promise<string>{
 if(!UUID.test(input.universeId)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.sailingDate)||!Number.isFinite(Date.parse(input.sailingDate))||new Date(input.sailingDate).toISOString().slice(0,10)!==input.sailingDate||input.sailingDate>new Date().toISOString().slice(0,10))throw Error('Choose a valid sailing date that is not in the future.');
 if(!input.signals.length||input.signals.length>30||new Set(input.signals.map(s=>s.signalId)).size!==input.signals.length||input.signals.some(s=>!UUID.test(s.signalId)||!Number.isInteger(s.intensity)||s.intensity<1||s.intensity>3))throw Error('Choose valid signals with an intensity from 1 to 3.');
 if((input.publicNote?.length||0)>4000)throw Error('Keep your note under 4,000 characters.');
 const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw Error('Sign in to share your experience.');
 const signals=[...input.signals].sort((a,b)=>a.signalId.localeCompare(b.signalId));
 const identity=JSON.stringify(['cruise',user.id,input.universeId,input.sailingDate,signals,input.publicNote?.trim()||null,input.cabinCategoryId||null]);
 const requestKey=await pendingReviewRequest(identity);
 const {data,error}=await supabase.rpc('save_cruise_universe_visit_v1',{p_universe_id:input.universeId,p_sailing_date:input.sailingDate,p_signals:signals.map(s=>({signal_id:s.signalId,intensity:s.intensity})),p_request_key:requestKey,p_public_note:input.publicNote?.trim()||null,p_cabin_category_id:input.cabinCategoryId||null});
 if(error)throw Error(error.message||'Your experience could not be saved. Please try again.');if(typeof data!=='string'||!UUID.test(data))throw Error('The server did not confirm your experience was saved.');
 await confirmReviewRequest(identity);return data;
}
