import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from './supabaseClient';
import {isBusinessUuid,MobileStop} from './onthegoDetails';
export interface OwnerStop extends MobileStop {tavvy_place_id:string;status:string;}
/** Every read/write result is bound to both the authenticated owner and the selected business. */
export function useOnTheGoSchedule(placeId:string,refreshVersion=0){
 const {user}=useAuth();const scope=user?.id&&isBusinessUuid(placeId)?`${user.id}|${placeId}`:'';
 const identity=useRef(scope),generation=useRef(0),mounted=useRef(true),cancelRequest=useRef<symbol|null>(null);
 if(identity.current!==scope){identity.current=scope;++generation.current;cancelRequest.current=null;}
 const [loadedScope,setLoadedScope]=useState(''),[statusScope,setStatusScope]=useState(''),[stops,setStops]=useState<OwnerStop[]>([]),[loading,setLoading]=useState(false),[cancelling,setCancelling]=useState<string|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[nextOffset,setNextOffset]=useState<number|null>(null);
 const load=useCallback(async(offset=0)=>{
  if(!scope||!mounted.current)return;const current=++generation.current;const valid=()=>mounted.current&&identity.current===scope&&generation.current===current;
  setStatusScope(scope);setLoading(true);setError('');
  try{
   const {data:auth}=await supabase.auth.getSession();if(!valid())return;
   if(!auth.session||!user||auth.session.user.id!==user.id)throw Error('Sign in again to view your schedule.');
   const {data,error:failure}=await supabase.functions.invoke(`my-scheduled-events?tavvy_place_id=${encodeURIComponent(placeId)}&offset=${offset}&limit=20`,{method:'GET',headers:{Authorization:`Bearer ${auth.session.access_token}`}});
   if(!valid())return;
   if(failure||data?.success!==true||!Array.isArray(data.upcoming_events)||data.upcoming_events.some((s:any)=>!isBusinessUuid(s.id)||s.tavvy_place_id!==placeId||s.status!=='scheduled'||!Number.isFinite(Date.parse(s.scheduled_end))))throw Error('Your scheduled stops could not be loaded. Please retry.');
   if(data.has_more===true&&(!Number.isInteger(data.next_offset)||data.next_offset!==offset+20))throw Error('The next schedule page could not be verified. Refresh your schedule.');
   setLoadedScope(scope);setStops(old=>offset?[...new Map([...old,...data.upcoming_events].map(s=>[s.id,s])).values()]:data.upcoming_events);setNextOffset(data.has_more===true?data.next_offset:null);
  }catch(e){if(valid())setError(e instanceof Error?e.message:'Your schedule is unavailable.');}
  finally{if(valid())setLoading(false);}
 },[scope,placeId,user?.id]);
 useEffect(()=>{mounted.current=true;setLoadedScope('');setStops([]);setNextOffset(null);setError('');setMessage('');setCancelling(null);void load();return()=>{mounted.current=false;++generation.current;cancelRequest.current=null;};},[load,refreshVersion]);
 const cancel=async(id:string)=>{
  if(!scope||loadedScope!==scope||cancelRequest.current||!stops.some(s=>s.id===id))return false;
  const request=Symbol('cancel stop');cancelRequest.current=request;const valid=()=>mounted.current&&identity.current===scope&&cancelRequest.current===request;
  setCancelling(id);setMessage('');setError('');
  try{
   const {data:auth}=await supabase.auth.getSession();if(!valid())return false;
   if(!auth.session||!user||auth.session.user.id!==user.id)throw Error('Sign in again to manage your schedule.');
   const {data,error:failure}=await supabase.functions.invoke('cancel-scheduled-event',{body:{event_id:id},headers:{Authorization:`Bearer ${auth.session.access_token}`}});
   if(!valid())return false;
   if(failure||data?.success!==true||data.event_id!==id)throw Error('The stop could not be cancelled. Refresh its status before retrying.');
   // Invalidate any older list response before removing the acknowledged row.
   ++generation.current;setStops(old=>old.filter(s=>s.id!==id));setNextOffset(null);setMessage(data.warning||'Scheduled stop cancelled.');void load();return true;
  }catch(e){if(valid())setError(e instanceof Error?e.message:'Unable to cancel this stop.');return false;}
  finally{if(valid()){cancelRequest.current=null;setCancelling(null);}}
 };
 const current=loadedScope===scope,currentError=statusScope===scope?error:'';
 return{stops:current?stops:[],loading:!!scope&&(!current&&!currentError||loading),cancelling:current?cancelling:null,error:currentError,message:current?message:'',nextOffset:current?nextOffset:null,signedIn:!!scope,refresh:()=>load(),loadMore:()=>nextOffset!==null&&!loading?load(nextOffset):Promise.resolve(),cancel};
}
