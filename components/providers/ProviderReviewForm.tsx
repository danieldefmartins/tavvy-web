import React,{useState,useRef} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabaseClient';
import {PROVIDER_TAPS,ProviderTapDimension,ProviderTapKind} from '../../lib/providerReviewTaps';
import {useThemeContext} from '../../contexts/ThemeContext';

export default function ProviderReviewForm({providerId,kind,signedIn,onSaved}:{providerId:string;kind:ProviderTapKind;signedIn:boolean;onSaved:()=>void}){
  const {theme}=useThemeContext();
  const saveLock=useRef(false);
  const [main,setMain]=useState(''),[good,setGood]=useState(''),[vibe,setVibe]=useState(''),[headsUp,setHeadsUp]=useState('');
  const [rating,setRating]=useState(0),[title,setTitle]=useState(''),[content,setContent]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const options=PROVIDER_TAPS[kind];
  const choose=(dimension:ProviderTapDimension,value:string)=>({main:setMain,good:setGood,vibe:setVibe,heads_up:setHeadsUp}[dimension])(value);
  const chipStyle=(selected:boolean):React.CSSProperties=>({border:`1px solid ${selected?theme.primary:theme.border}`,borderRadius:12,background:selected?'rgba(138,5,190,.10)':theme.background,color:theme.text,padding:'9px 13px',minHeight:44,cursor:'pointer',font:'inherit',fontWeight:selected?700:400});
  const field=(dimension:ProviderTapDimension,label:string,value:string,optional=false)=><fieldset style={{border:0,padding:'12px 0',margin:0}}><legend style={{fontWeight:700}}>{label}{optional?' (optional)':''}</legend><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{optional?<button type="button" style={chipStyle(!value)} aria-pressed={!value} onClick={()=>choose(dimension,'')}>Skip</button>:null}{options[dimension].map(option=><button key={option.code} type="button" style={chipStyle(value===option.code)} aria-pressed={value===option.code} disabled={busy} onClick={()=>choose(dimension,value===option.code?'':option.code)}>{option.label}</button>)}</div></fieldset>;
  async function submit(event:React.FormEvent){event.preventDefault();if(saveLock.current)return;setError('');setSaved(false);
    if(!main||!rating||content.trim().length<20){setError('Choose what mattered most, your overall experience, and describe your experience in at least 20 characters.');return;}
    saveLock.current=true;setBusy(true);try{const {data,error:rpcError}=await supabase.rpc('submit_pro_provider_review_v1',{p_provider_id:providerId,p_rating:rating,p_title:title.trim(),p_content:content.trim(),p_main_tap:main,p_good_tap:good||null,p_vibe_tap:vibe||null,p_heads_up_tap:headsUp||null});if(rpcError||typeof data!=='string')throw rpcError||new Error('Your review could not be confirmed.');setSaved(true);onSaved();}catch(e){setError(e instanceof Error?e.message:'Your review could not be saved. Please try again.');}finally{saveLock.current=false;setBusy(false);}}
  return <section aria-labelledby="write-provider-review"><h2 id="write-provider-review">Review this {kind==='realtor'?'Realtor':'professional'}</h2>{!signedIn?<p><Link href="/app/login">Sign in</Link> to share your experience.</p>:<form onSubmit={submit}>
    <p>Start with what mattered most. The Good, style and Heads Up are optional.</p>
    {field('main',kind==='realtor'?'The real estate service':'The work',main)}{field('good','The Good',good,true)}{field('vibe',kind==='realtor'?'Their Style':'The Vibe',vibe,true)}{field('heads_up','Heads Up',headsUp,true)}
    <label style={{display:'block',margin:'12px 0'}}>Overall experience <select required value={rating} onChange={e=>setRating(Number(e.target.value))}><option value={0}>Choose your experience</option>{(['Very poor','Poor','Mixed','Good','Excellent']).map((label,index)=><option value={index+1} key={label}>{label}</option>)}</select></label>
    <label style={{display:'block',margin:'12px 0'}}>Short title (optional) <input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)} style={{display:'block',width:'100%'}}/></label>
    <label style={{display:'block',margin:'12px 0'}}>What happened? (at least 20 characters) <textarea required minLength={20} maxLength={4000} value={content} onChange={e=>setContent(e.target.value)} rows={5} style={{display:'block',width:'100%'}}/></label>
    <p>You can update your review later. Only choose a concern if you experienced it.</p>
    <button type="submit" disabled={busy}>{busy?'Saving…':'Post review'}</button>{error?<p role="alert">{error}</p>:null}{saved?<p role="status">Your review was saved.</p>:null}
  </form>}
  <style jsx>{`fieldset button{border:1px solid #888;border-radius:12px;background:transparent;color:inherit;padding:9px 13px;min-height:42px;cursor:pointer}fieldset button[aria-pressed="true"]{border-color:${theme.primary};background:${theme.surface};color:${theme.text};font-weight:700}select,input,textarea{font:inherit;padding:10px;border:1px solid #888;border-radius:8px}form>button{min-height:44px;padding:10px 18px;border:0;border-radius:10px;background:${theme.primary};color:white;font:inherit;font-weight:700}`}</style>
  </section>;
}
