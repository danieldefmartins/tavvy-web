import { useReleaseCopy } from '../../../hooks/useReleaseCopy';
/** Short setup. Its parent owns values so choosing a template never erases them. */
import React, { useEffect, useRef, useState } from 'react';
import { IoCamera } from 'react-icons/io5';
export interface QuickSetupData { fullName: string; title: string; photoFile: File | null; primaryColor: string; }
export const EMPTY_QUICK_SETUP: QuickSetupData = {fullName:'',title:'',photoFile:null,primaryColor:'#8A05BE'};
const QUICK_COLORS=['#8A05BE','#00C2CB','#00C853','#EF4444','#F59E0B','#EC4899','#14B8A6','#1E40AF','#D4AF37','#17013A'];
interface QuickSetupProps {
  value: QuickSetupData; onChange:(value:QuickSetupData)=>void;
  onCreate:(data:QuickSetupData)=>void; creating:boolean; disabled?:boolean; isDark:boolean;
}
export default function QuickSetup({value,onChange,onCreate,creating,disabled=false,isDark}:QuickSetupProps) {
  const copy = useReleaseCopy();
  const [photoPreview,setPhotoPreview]=useState<string|null>(null),photoInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(!value.photoFile){setPhotoPreview(null);return;}const url=URL.createObjectURL(value.photoFile);setPhotoPreview(url);return()=>URL.revokeObjectURL(url);},[value.photoFile]);
  const update=(part:Partial<QuickSetupData>)=>onChange({...value,...part});
  const text=isDark?'#F8FAFC':'#202124',muted=isDark?'#BCC5D3':'#596170',border=isDark?'#475569':'#D1D5DB';
  const input:React.CSSProperties={boxSizing:'border-box',width:'100%',padding:'13px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:16,background:isDark?'#1E293B':'#fff',color:text,marginTop:6};
  const canCreate=value.fullName.trim().length>=2&&!creating&&!disabled;
  return <form onSubmit={event=>{event.preventDefault();if(canCreate)onCreate(value);}} style={{color:text}}>
    <h1 style={{fontSize:26,margin:'0 0 8px'}}>{copy("Create your eCard")}</h1><p style={{fontSize:15,lineHeight:1.5,color:muted,margin:'0 0 24px'}}>{copy("Start with your name. Add links and customize your card next.")}</p>
    <input ref={photoInput} type="file" accept="image/*" aria-label={copy('Profile photo file')} hidden onChange={event=>{const file=event.target.files?.[0];if(file)update({photoFile:file});}}/>
    <button type="button" aria-label={copy('Choose optional profile photo')} onClick={()=>photoInput.current?.click()} style={{width:88,height:88,borderRadius:'50%',border:`1px dashed ${border}`,background:isDark?'#1E293B':'#F3F4F6',color:muted,overflow:'hidden',padding:0,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:8}}>{photoPreview?<img src={photoPreview} alt={copy('Selected profile')} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<IoCamera size={30}/>}</button>
    <p style={{fontSize:12,color:muted,margin:'0 0 22px'}}>{copy("Photo is optional")}</p>
    <label style={{display:'block',fontSize:14,marginBottom:18}}>{copy("Full name")}<span aria-hidden="true">*</span><input name="fullName" autoComplete={"name"} required minLength={2} maxLength={200} value={value.fullName} onChange={event=>update({fullName:event.target.value})} placeholder={copy("Your full name")} style={input}/></label>
    <label style={{display:'block',fontSize:14,marginBottom:18}}>{copy("Title / role")} <span style={{color:muted}}>{copy("(optional)")}</span><input name={"title"} value={value.title} onChange={event=>update({title:event.target.value})} placeholder={copy('e.g. Designer, Founder, Agent')} style={input}/></label>
    <details style={{margin:'0 0 24px',borderTop:`1px solid ${border}`,borderBottom:`1px solid ${border}`}}><summary style={{padding:'16px 0',cursor:'pointer',fontSize:14}}>{copy("Primary color")}</summary><div style={{display:'flex',gap:10,flexWrap:'wrap',paddingBottom:18}}>{QUICK_COLORS.map(color=><button type="button" key={color} aria-label={copy('Use {{color}} as primary color').replace('{{color}}',color)} aria-pressed={value.primaryColor===color} onClick={()=>update({primaryColor:color})} style={{width:44,height:44,borderRadius:12,border:`3px solid ${value.primaryColor===color?text:"transparent"}`,background:color,cursor:'pointer',boxShadow:value.primaryColor===color?`0 0 0 2px ${border}`:"none"}}/>)}</div></details>
    <button type={"submit"} disabled={!canCreate} style={{width:'100%',minHeight:48,padding:'14px 20px',border:0,borderRadius:12,fontSize:16,fontWeight:650,background:'#6C2496',color:'#fff',opacity:canCreate?1:.5,cursor:canCreate?'pointer':'default'}}>{creating?copy("Creating draft…"):copy("Create draft")}</button>
    <p style={{textAlign:'center',fontSize:12,lineHeight:1.5,color:muted}}>{copy("Your card stays private until you publish.")}</p>
  </form>;
}
