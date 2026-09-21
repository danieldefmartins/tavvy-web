import {useCallback,useEffect,useRef,useState} from 'react';
import {fetchMobileDetails,MobilePlaceDetails,validateMobileDetails} from './onthegoDetails';
export function useOnTheGoDetails(reference:{tavvyPlaceId?:string;canonicalPlaceId?:string}) {
 const [data,setData]=useState<MobilePlaceDetails|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[now,setNow]=useState(Date.now());
 const generation=useRef(0),busy=useRef<number|null>(null),mounted=useRef(false);
 const {tavvyPlaceId,canonicalPlaceId}=reference;
 const load=useCallback(async(more=false)=>{
  const current=generation.current;if(busy.current===current)return;busy.current=current;
  try {const next=await fetchMobileDetails({tavvyPlaceId,canonicalPlaceId},more?data?.events.length||0:0);
   if(mounted.current&&generation.current===current){setData(old=>more&&old&&next?{...next,events:Array.from(new Map([...old.events,...next.events].map(e=>[e.id,e])).values())}:next);setError(null);}
  }catch(e){if(mounted.current&&generation.current===current)setError(e instanceof Error?e.message:'Unable to load this mobile business.');}
  finally{if(busy.current===current)busy.current=null;if(mounted.current&&generation.current===current)setLoading(false);}
 },[tavvyPlaceId,canonicalPlaceId,data?.events.length]);
 const latest=useRef(load);latest.current=load;
 useEffect(()=>{mounted.current=true;++generation.current;setLoading(true);setData(null);setError(null);void latest.current();const timer=setInterval(()=>void latest.current(),30000),expiry=setInterval(()=>setNow(Date.now()),1000);return()=>{mounted.current=false;++generation.current;clearInterval(timer);clearInterval(expiry);};},[tavvyPlaceId,canonicalPlaceId]);
 return {data:data?validateMobileDetails(data,{tavvyPlaceId,canonicalPlaceId},now):null,loading,error,retry:()=>load(),loadMore:()=>load(true)};
}
