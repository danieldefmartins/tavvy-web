import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import AppLayout from '../AppLayout';
import CruiseShipView from './CruiseShipView';
import CruiseReviewPanel from './CruiseReviewPanel';
import {getCruiseShip} from '../../lib/cruises/service';
import {CruiseShipDetail} from '../../lib/cruises/catalog';
export default function CruiseUniverseEntry({slug,universeId,initialDetail=null,initialError=''}:{slug?:string;universeId?:string;initialDetail?:CruiseShipDetail|null;initialError?:string}){
 const[detail,setDetail]=useState<CruiseShipDetail|null>(initialDetail),[error,setError]=useState(initialError),[loading,setLoading]=useState(!initialDetail&&!initialError),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!slug&&!universeId)return;if(retry===0&&initialDetail&&(initialDetail.ship.slug===slug||initialDetail.ship.universe_id===universeId)){setDetail(initialDetail);setLoading(false);return;}let active=true;setLoading(true);setError('');void getCruiseShip(universeId?{universeId}:{slug:slug!}).then(d=>{if(active)setDetail(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[slug,universeId,retry,initialDetail]);
 if(loading||error||!detail)return <AppLayout><main style={{padding:24}}><Link href="/app/cruises">← Cruise ships</Link><h1>{loading?'Loading ship…':error||'Ship not found'}</h1>{error&&<button onClick={()=>setRetry(v=>v+1)}>Try again</button>}</main></AppLayout>;
 return <CruiseShipView detail={detail} reviews={<CruiseReviewPanel ship={detail.ship}/>}/>;
}
