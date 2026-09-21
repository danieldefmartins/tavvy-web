import {useRouter} from 'next/router';
import {useOnTheGoDetails} from '../lib/useOnTheGoDetails';
import {businessTime,safeBusinessUrl,validCoordinates} from '../lib/onthego';
import type {MobilePlaceDetails} from '../lib/onthegoDetails';
/** Can be placed in any canonical place overview; null means it is not mobile. */
export default function OnTheGoStatus({canonicalPlaceId,tavvyPlaceId}:{canonicalPlaceId?:string;tavvyPlaceId?:string}) {
 const state=useOnTheGoDetails({canonicalPlaceId,tavvyPlaceId});
 if(state.loading)return <p role="status">Checking live location…</p>;
 if(!state.data&&!state.error)return null;
 return <section aria-label="Mobile business location and schedule">
  {state.error&&<p role="alert">{state.error} <button onClick={state.retry}>Retry</button></p>}
  {state.data&&<OnTheGoStatusContent data={state.data} loadMore={state.loadMore}/>}
 </section>;
}
export function OnTheGoStatusContent({data,loadMore}:{data:MobilePlaceDetails;loadMore?:()=>void}) {
 const {locale}=useRouter();const {place,live,events}=data;
 const directions=(lat:number,lng:number)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
 return <div className="mobile-status"><h3>{live?'Live now':'Mobile business'}</h3>
  {live?<><p><strong>{live.session_address||live.location_label}</strong></p><p>Live until {businessTime(live.scheduled_end_at,locale)} · reported by the business</p>{live.today_note&&<p>{live.today_note}</p>}<a href={directions(live.session_lat,live.session_lng)} target="_blank" rel="noopener noreferrer">Directions to current stop ↗</a></>:<p>No live location is being shared right now. Scheduled stops are plans; confirm with the business before travelling.</p>}
  {place.service_area&&<p>Service area: {place.service_area}</p>}
  {place.hours_display&&<p>Usual hours: {place.hours_display}</p>}
  {safeBusinessUrl(place.phone,'phone')&&<p><a href={safeBusinessUrl(place.phone,'phone')!}>Call {place.phone}</a></p>}
  {['website','instagram','facebook','twitter','tiktok'].some(key=>safeBusinessUrl(place[key as keyof typeof place] as string))&&<details><summary>Website & social links</summary>{['website','instagram','facebook','twitter','tiktok'].map(key=>{const url=safeBusinessUrl(place[key as keyof typeof place] as string);return url?<p key={key}><a href={url} target="_blank" rel="noopener noreferrer">{key==='twitter'?'X / Twitter':key.charAt(0).toUpperCase()+key.slice(1)} ↗</a></p>:null;})}</details>}
  {!!live?.specials?.length&&<details><summary>Today’s specials</summary>{live.specials.filter(s=>!s.valid_until||Date.parse(s.valid_until)>Date.now()).map(s=><article key={s.id}><strong>{s.title}</strong>{s.description&&<p>{s.description}</p>}{s.valid_until&&<p>Until {businessTime(s.valid_until,locale)}</p>}</article>)}</details>}
  {!!live?.items?.length&&<details><summary>Available at this stop</summary>{live.items.map(item=><article key={item.id}><strong>{item.name}</strong>{item.description&&<p>{item.description}</p>}</article>)}</details>}
  <details open={!live}><summary>Scheduled stops{events.length?` (${events.length}${data.has_more?'+':''})`:''}</summary>
   {!events.length?<p>No upcoming stops have been published.</p>:events.map(e=><article key={e.id}><strong>{e.event_title||e.location_name}</strong><p>{businessTime(e.scheduled_start,locale)} – {businessTime(e.scheduled_end,locale)}</p><p>{e.location_name}{e.location_address?` · ${e.location_address}`:''}</p>{e.event_description&&<p>{e.event_description}</p>}{validCoordinates(e.latitude,e.longitude)&&<a href={directions(e.latitude,e.longitude)} target="_blank" rel="noopener noreferrer">Directions to this stop ↗</a>}</article>)}
   {data.has_more&&loadMore&&<button onClick={loadMore}>Show more stops</button>}
  </details>
  <style jsx>{`.mobile-status{background:var(--surface,#f6f4f8);color:var(--text,#17013a);border:1px solid var(--border,#dedbe4);border-radius:18px;padding:18px;margin:16px 0}.mobile-status h3{margin:0 0 10px;font-size:18px}.mobile-status p{font-size:14px;line-height:1.5;color:var(--text-secondary,#625e70)}a{color:var(--link,#70059b);font-weight:600}summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}article{border-top:1px solid var(--border,#dedbe4);padding:14px 0}button{padding:12px;border:1px solid var(--border,#dedbe4);background:var(--surface,#fff);color:inherit;border-radius:10px}`}</style>
 </div>;
}
