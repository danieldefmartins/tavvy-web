import Link from 'next/link';
import {useRouter} from 'next/router';
import RestaurantCreateForm from '../../../components/RestaurantCreateForm';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { claimStatusLabel, OWNER_CLAIM_COLUMNS, OwnerClaim, OwnerPlace } from '../../../lib/restaurantOwner';
import RestaurantOwnerLayout from '../../../components/RestaurantOwnerLayout';

export default function RestaurantLookup() {
  const { user } = useAuth();
  const router=useRouter();
  const creating=router.query.add==='1';
  useEffect(()=>{if(typeof router.query.name==='string')setQuery(router.query.name)},[router.query.name]);
  const [query, setQuery] = useState(''), [places, setPlaces] = useState<OwnerPlace[]>([]), [claimsData, setClaims] = useState<OwnerClaim[]>([]);
  const [claimsFor,setClaimsFor]=useState('');const claims=user?.id===claimsFor?claimsData:[];
  const [loading, setLoading] = useState(false), [searched, setSearched] = useState(false), [error, setError] = useState('');
  useEffect(() => { let active=true; if (!user) { setClaims([]); return; } supabase.from('pro_business_claims').select(OWNER_CLAIM_COLUMNS).eq('user_id',user.id).eq('claim_kind','restaurant').order('created_at',{ascending:false}).then(({ data,error })=>{ if(active){ if(error)setError('Your saved claims could not be loaded. Please refresh to retry.'); else {setClaims((data||[]) as OwnerClaim[]);setClaimsFor(user.id);} } }); return()=>{active=false;}; },[user?.id]);
  const search = async (event: React.FormEvent) => {
    event.preventDefault(); if(query.trim().length<2)return;
    setLoading(true);setError('');setSearched(false);setPlaces([]);
    const escaped=query.trim().replace(/[\\%_]/g,'\\$&');
    const {data,error}=await supabase.from('places').select('id,name,street,city,region').ilike('name',`%${escaped}%`).order('name').limit(30);
    if(error)setError('Restaurant lookup is unavailable. Please try again.');else {setPlaces(data||[]);setSearched(true);}setLoading(false);
  };
  return <RestaurantOwnerLayout title="Bring your restaurant to Tavvy"><h1>Bring your restaurant to Tavvy</h1><p>Find your place, verify that you represent it, then bring your menu, stories, and contact details together.</p>{claims.length>0&&<section className="panel"><h2>Your restaurants</h2>{claims.map(c=><Link className="result" key={c.id} href={`/app/business/${c.place_id}`}><strong>{c.business_name}</strong><small>{claimStatusLabel(c)} · Continue setup →</small></Link>)}</section>}{!creating&&<form className="panel" onSubmit={search}><h2>Find your restaurant</h2><label htmlFor="restaurant-search">Restaurant name<input id="restaurant-search" required minLength={2} maxLength={120} autoComplete="organization" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Start with your restaurant’s name" /></label><button disabled={loading}>{loading?'Searching…':'Find my restaurant'}</button>{error&&<p className="error" role="alert">{error}</p>}{places.map(p=><Link className="result" key={p.id} href={`/app/business/claim?placeId=${p.id}`}><strong>{p.name}</strong><small>{[p.street,p.city,p.region].filter(Boolean).join(', ')} · Select this place →</small></Link>)}{searched&&<div><p>{places.length?'Can’t see your restaurant at the right address?':'No matching place yet. Add it here and continue your ownership request.'}</p><button type="button" onClick={()=>router.push({pathname:'/app/business',query:{add:'1',name:query.trim()}},undefined,{shallow:true})}>Add my restaurant</button></div>}</form>}{creating&&<RestaurantCreateForm initialName={typeof router.query.name==='string'?router.query.name:query} onCancel={()=>router.push('/app/business',undefined,{shallow:true})}/>} <p className="muted">Already submitted a claim? Sign in with the same account to resume it.</p>{!user&&<Link href="/app/login?returnUrl=%2Fapp%2Fbusiness">Sign in →</Link>}</RestaurantOwnerLayout>;
}
