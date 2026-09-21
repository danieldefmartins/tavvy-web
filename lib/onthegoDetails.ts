import { supabase } from './supabaseClient';
import { validCoordinates } from './onthego';
export interface MobileStop { id:string; event_title?:string; event_description?:string; location_name:string; location_address?:string; latitude:number; longitude:number; scheduled_start:string; scheduled_end:string; }
export interface MobilePlaceProfile { id:string; canonical_place_id:string|null; name:string; description?:string; tavvy_category?:string; tavvy_subcategory?:string; service_area?:string; phone?:string; email?:string; website?:string; instagram?:string; facebook?:string; twitter?:string; tiktok?:string; hours_display?:string; hours_json?:unknown; cover_image_url?:string; photos?:string[]; }
export interface MobilePlaceDetails { place:MobilePlaceProfile; live: {id:string;session_lat:number;session_lng:number;session_address:string;location_label?:string;today_note?:string;scheduled_end_at:string;items?:{id:string;name:string;description?:string;price_cents?:number|null}[];specials?:{id:string;title:string;description?:string;valid_until?:string}[]}|null; events:MobileStop[];has_more:boolean; }
export const isBusinessUuid = (v: unknown): v is string => typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function validateMobileDetails(data:any, expected:{tavvyPlaceId?:string;canonicalPlaceId?:string}, now=Date.now()): MobilePlaceDetails | null {
  if (data===null) return null;
  if (!data?.place || !isBusinessUuid(data.place.id) || typeof data.place.name!=='string' || !Array.isArray(data.events) ||
    (expected.tavvyPlaceId && data.place.id!==expected.tavvyPlaceId) || (expected.canonicalPlaceId && data.place.canonical_place_id!==expected.canonicalPlaceId)) throw new Error('Mobile business details could not be verified.');
  const live = data.live && Date.parse(data.live.scheduled_end_at)>now && validCoordinates(data.live.session_lat,data.live.session_lng) && typeof data.live.session_address==='string' ? data.live : null;
  return {...data,live,events:data.events.filter((e:any) => Date.parse(e.scheduled_end)>now && Date.parse(e.scheduled_start)<Date.parse(e.scheduled_end)),has_more:data.has_more===true};
}
export async function fetchMobileDetails(reference:{tavvyPlaceId?:string;canonicalPlaceId?:string},offset=0):Promise<MobilePlaceDetails|null> {
  if ((!reference.tavvyPlaceId && !reference.canonicalPlaceId) || [reference.tavvyPlaceId,reference.canonicalPlaceId].some(v=>v!==undefined&&!isBusinessUuid(v))) throw new Error('Invalid mobile business.');
  const {data,error}=await supabase.rpc('get_onthego_place',{p_tavvy_place_id:reference.tavvyPlaceId||null,p_canonical_place_id:reference.canonicalPlaceId||null,p_offset:offset,p_limit:20});
  if(error) throw new Error('Mobile business details are unavailable. Please try again.');
  return validateMobileDetails(data,reference);
}
export async function enableMobilePlaceDetails(tavvyPlaceId:string):Promise<string> {
  if(!isBusinessUuid(tavvyPlaceId)) throw new Error('Choose a mobile business.');
  const {data,error}=await supabase.rpc('ensure_onthego_place_details',{p_tavvy_place_id:tavvyPlaceId,p_canonical_place_id:null});
  if(error) throw new Error(error.message||'Unable to enable your Tavvy place page.');
  if(!isBusinessUuid(data?.canonical_place_id)) throw new Error('Profile created. Refresh before trying again.');
  return data.canonical_place_id;
}

export const MOBILE_PROFILE_FIELDS = [
 ['name','Business name'],['description','About this business'],['service_area','Service area'],['phone','Phone'],['email','Business email'],['website','Website'],['instagram','Instagram URL'],['facebook','Facebook URL'],['twitter','X / Twitter URL'],['tiktok','TikTok URL'],['hours_display','Usual hours'],
] as const;
export async function saveMobileBusinessProfile(id:string, details:Record<string,string>) {
 if(!isBusinessUuid(id))throw new Error('Choose a mobile business.');
 const {error}=await supabase.rpc('save_onthego_business_profile',{p_tavvy_place_id:id,p_details:details});
 if(error)throw new Error(error.message||'Unable to save business details. Your changes are still here.');
}
