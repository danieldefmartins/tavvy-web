import React from 'react';
import type {GetServerSideProps} from 'next';
import {cruiseShareMetadata} from '../../../lib/cruises/share';
import {useRouter} from 'next/router';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import CruiseUniverseEntry from '../../../components/cruises/CruiseUniverseEntry';
import {getCruiseShip} from '../../../lib/cruises/service';
import {CruiseShipDetail} from '../../../lib/cruises/catalog';
export default function CruiseShipPage({initialDetail,initialError}:{initialDetail:CruiseShipDetail|null;initialError:string}){const router=useRouter();return <CruiseUniverseEntry slug={typeof router.query.slug==='string'?router.query.slug:undefined} initialDetail={initialDetail} initialError={initialError}/>;}
export const getServerSideProps:GetServerSideProps=async({locale,params,res})=>{
 const translations=await serverSideTranslations(locale||'en',['common']);
 if(typeof params?.slug!=='string')return{notFound:true};
 try{
  const initialDetail=await getCruiseShip({slug:params.slug});
  if(!initialDetail)return{notFound:true};
  return{props:{...translations,initialDetail,initialError:'',placeShare:cruiseShareMetadata(initialDetail)}};
 }catch{
  res.statusCode=503;
  res.setHeader('Cache-Control','no-store');
  return{props:{...translations,initialDetail:null,initialError:'Cruise information is temporarily unavailable. Please try again.'}};
 }
};
