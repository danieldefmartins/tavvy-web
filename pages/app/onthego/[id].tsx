import {useEffect} from 'react';
import {useRouter} from 'next/router';
import Head from 'next/head';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import PlaceScreen,{PlaceConfig} from '../../../components/PreviewPlace';
import {OnTheGoStatusContent} from '../../../components/OnTheGoStatus';
import {useOnTheGoDetails} from '../../../lib/useOnTheGoDetails';
import {safeBusinessUrl} from '../../../lib/onthego';
import {unavailablePlaceEvidence} from '../../../lib/placeEvidence';
export default function MobileBusinessPage(){const router=useRouter();const id=typeof router.query.id==='string'?router.query.id:undefined;
 return id?<MobileBusinessContent id={id}/>:<p>Loading mobile business…</p>;
}
function MobileBusinessContent({id}:{id:string}){
 const router=useRouter(),state=useOnTheGoDetails({tavvyPlaceId:id});const place=state.data?.place;
 useEffect(()=>{if(place?.canonical_place_id)void router.replace(`/app/place/${place.canonical_place_id}?mobile=${encodeURIComponent(id)}`,undefined,{locale:router.locale});},[place?.canonical_place_id,id]);
 if(state.loading||place?.canonical_place_id)return <p role="status" style={{padding:24}}>Loading place details…</p>;
 if(state.error)return <main style={{padding:24}}><h1>Mobile business details unavailable</h1><p role="alert">{state.error}</p><button onClick={state.retry}>Retry</button> <a href="/app/onthego">Back to On The Go</a></main>;
 if(!place)return <main style={{padding:24}}><h1>This mobile business is no longer available.</h1><a href="/app/onthego">Back to On The Go</a></main>;
 const hrefs:Record<string,string>={};for(const key of ['website','instagram','facebook','tiktok'] as const){const url=safeBusinessUrl(place[key]);if(url)hrefs[key]=url;}const phone=safeBusinessUrl(place.phone,'phone');if(phone)hrefs.phone=phone;
 const category=/food|coffee|ice.?cream|cafe|catering/i.test(`${place.tavvy_category} ${place.tavvy_subcategory}`)?'restaurant':place.tavvy_category||'service';
 const config:PlaceConfig={type:category,name:place.name,photo:safeBusinessUrl(place.cover_image_url)||'',meta:[place.tavvy_subcategory||place.tavvy_category,place.service_area].filter(Boolean).join(' · '),openLine:state.data?.live?'Live now':'Mobile business',reviewsSub:'Reviews not available yet',actions:[],groups:[],description:place.description||'',popularLabel:'Known for',popular:[],info:[...(place.service_area?[{icon:'directions',main:`Service area: ${place.service_area}`}]:[]),...(place.hours_display?[{icon:'hours',main:place.hours_display}]:[])],reviews:[],reviewsStatus:'unavailable',cta:'Add Review',evidence:unavailablePlaceEvidence(category,'This business has not enabled its full Tavvy review page yet.'),gallery:[...new Set([place.cover_image_url,...(place.photos||[])].map(url=>safeBusinessUrl(url)).filter((url):url is string=>!!url))],overviewContent:<OnTheGoStatusContent data={state.data!} loadMore={state.loadMore}/>,reviewDisabledReason:'Reviews become available when this business enables its full Tavvy place page.',detailsContent:<><OnTheGoStatusContent data={state.data!} loadMore={state.loadMore}/><p>Tavvy Menu, stories and eCard appear on the full place page when this business enables them.</p>{Object.entries(hrefs).map(([key,url])=><p key={key}><a href={url} target={key==='phone'?undefined:'_blank'} rel="noopener noreferrer">{key==='phone'?place.phone:key} ↗</a></p>)}<a href="/app/onthego">Manage your mobile business in On The Go</a></>};
 return <><Head><title>{place.name} | On The Go · Tavvy</title></Head><PlaceScreen config={config} hrefs={hrefs} onBack={()=>router.back()}/></>;
}
export async function getServerSideProps({locale}:{locale:string}){return {props:{...(await serverSideTranslations(locale||'en',['common']))}};}
