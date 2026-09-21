import {useState} from 'react';
import {useRouter} from 'next/router';
import {useOnTheGoSchedule} from '../lib/useOnTheGoSchedule';
import {businessTime} from '../lib/onthego';
export default function OnTheGoSchedule({placeId,refreshVersion=0}:{placeId:string;refreshVersion?:number}){
 const state=useOnTheGoSchedule(placeId,refreshVersion),{locale}=useRouter();const [confirm,setConfirm]=useState<string|null>(null);
 return <section aria-label="Your scheduled stops"><h3>Your scheduled stops</h3><button type="button" disabled={state.loading||!!state.cancelling} onClick={state.refresh}>Refresh schedule</button>
  {state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}
  {state.loading&&<p role="status">Loading your schedule…</p>}{!state.signedIn?<p>Sign in to manage your scheduled stops.</p>:!state.loading&&!state.error&&!state.stops.length?<p>No upcoming stops have been published.</p>:null}
  {state.stops.map(stop=><article key={stop.id}><strong>{stop.event_title||stop.location_name}</strong><p>{businessTime(stop.scheduled_start,locale)} – {businessTime(stop.scheduled_end,locale)}</p>{stop.location_address&&<p>{stop.location_address}</p>}{confirm===stop.id?<div><p>Cancel this scheduled stop? Customers will no longer see it as upcoming.</p><button type="button" disabled={!!state.cancelling} onClick={()=>setConfirm(null)}>Keep stop</button><button type="button" disabled={!!state.cancelling} onClick={async()=>{if(await state.cancel(stop.id))setConfirm(null);}}>{state.cancelling===stop.id?'Cancelling…':'Confirm cancellation'}</button></div>:<button type="button" disabled={state.loading||!!state.cancelling} onClick={()=>setConfirm(stop.id)}>Cancel stop</button>}</article>)}
  {state.nextOffset!==null&&<button type="button" disabled={state.loading||!!state.cancelling} onClick={state.loadMore}>Show more stops</button>}
  <p>To change a stop, cancel it and publish the corrected details below.</p>
  <style jsx>{`section{margin:20px 0;border-top:1px solid var(--border,#ddd);padding-top:14px}article{padding:14px 0;border-bottom:1px solid var(--border,#ddd)}p{font-size:14px;line-height:1.5;color:var(--text-secondary,#625e70)}button{min-height:44px;padding:10px 12px;margin:4px 8px 4px 0;border-radius:10px;border:1px solid var(--border,#ccc);background:var(--surface,#fff);color:var(--text,#17013a);cursor:pointer}button:disabled{opacity:.55}button:focus-visible{outline:3px solid currentColor;outline-offset:2px}`}</style>
 </section>;
}
