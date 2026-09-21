import {useCallback,useEffect,useState} from 'react';
import {supabase} from '../lib/supabaseClient';
import {CONTENT_SAFETY_CHANGED} from '../components/ContentSafetyActions';
import {fetchPublicCardSafety,PublicEndorsement} from '../lib/ecard/publicSafety';
export function usePublicCardSafety(cardId:string|undefined,disabled:boolean,initial:PublicEndorsement[]=[]){
 const [state,setState]=useState<{status:'ready'|'loading'|'hidden'|'unavailable';endorsements:PublicEndorsement[]}>({status:'ready',endorsements:initial});
 const [revision,setRevision]=useState(0);const reload=useCallback(()=>setRevision(value=>value+1),[]);
 useEffect(()=>{
  if(disabled||!cardId)return;
  let active=true;let request=0;
  const read=async()=>{const current=++request;setState({status:'loading',endorsements:[]});try{const data=await fetchPublicCardSafety(supabase,cardId);if(active&&current===request)setState({status:data.visible?'ready':'hidden',endorsements:data.endorsements})}catch{if(active&&current===request)setState({status:'unavailable',endorsements:[]})}};
  void read();const changed=()=>{void read()};window.addEventListener(CONTENT_SAFETY_CHANGED,changed);
  const {data:listener}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{if(active)void read()},0)});
  return()=>{active=false;++request;window.removeEventListener(CONTENT_SAFETY_CHANGED,changed);listener.subscription.unsubscribe()};
 },[cardId,disabled,revision]);
 return {...state,reload};
}
