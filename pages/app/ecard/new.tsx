/** Template first, with optional quick setup and the complete type/country path. */
import { useReleaseCopy } from '../../../hooks/useReleaseCopy';
import React, {useEffect,useRef,useState} from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {useThemeContext} from '../../../contexts/ThemeContext';
import {useAuth} from '../../../contexts/AuthContext';
import {useECardPlan} from '../../../hooks/useECardPlan';
import AppLayout from '../../../components/AppLayout';
import TypePicker from '../../../components/ecard/wizard/TypePicker';
import TemplateGallery from '../../../components/ecard/wizard/TemplateGallery';
import QuickSetup,{EMPTY_QUICK_SETUP,QuickSetupData} from '../../../components/ecard/wizard/QuickSetup';
import {createCard,generateSlug,uploadProfilePhoto} from '../../../lib/ecard';
import {getTemplateById,TEMPLATES} from '../../../config/eCardTemplates';
import {canUseTemplate,readTemplateSelection,templateCardType,templateSelectionPath} from '../../../lib/ecard/templateSelection';
import {templateDesignDefaults} from '../../../lib/ecard/templateExamples';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
type WizardStep='type'|'template'|'setup';
export default function ECardNewPage(){
  const copy = useReleaseCopy();
  const router=useRouter(),{isDark}=useThemeContext(),{user,loading}=useAuth(),plan=useECardPlan();
  const [step,setStep]=useState<WizardStep>('template'),[setup,setSetup]=useState<QuickSetupData>(EMPTY_QUICK_SETUP);
  const [cardType,setCardType]=useState('business'),[countryCode,setCountryCode]=useState<string|undefined>(),[countryTemplate,setCountryTemplate]=useState<string|undefined>();
  const [selectedTemplateId,setSelectedTemplateId]=useState<string|null>(TEMPLATES[0].id),[selectedColorSchemeId,setSelectedColorSchemeId]=useState<string|null>(TEMPLATES[0].colorSchemes[0].id);
  const [galleryFilter,setGalleryFilter]=useState('all');
  const queryApplied=useRef(false);const [presetReady,setPresetReady]=useState(false);
  useEffect(()=>{
    if(!router.isReady||queryApplied.current)return;queryApplied.current=true;
    const preset=readTemplateSelection(router.query.template,router.query.scheme);
    if(preset){setSelectedTemplateId(preset.template.id);setSelectedColorSchemeId(preset.scheme.id);setCardType(preset.cardType);setSetup(value=>({...value,primaryColor:preset.scheme.primary}));}
    else setSetup(value=>({...value,primaryColor:TEMPLATES[0].colorSchemes[0].primary}));
    setPresetReady(true);
  },[router.isReady,router.query.template,router.query.scheme]);
  const [templateAvailable,setTemplateAvailable]=useState(true);
  const [creating,setCreating]=useState(false),[error,setError]=useState(''); const creatingRef=useRef(false);
  const template=getTemplateById(selectedTemplateId||'basic');
  const go=(value:WizardStep)=>{setStep(value);setError('');window.scrollTo({top:0,behavior:'auto'});};
  const selectDesign=(id:string,color:string)=>{const selection=readTemplateSelection(id,color);if(!selection)return;setSelectedTemplateId(id);setSelectedColorSchemeId(selection.scheme.id);if(galleryFilter==='all'){setCardType(selection.cardType);if(selection.cardType!=='politician'){setCountryCode(undefined);setCountryTemplate(undefined);}}setSetup(value=>({...value,primaryColor:selection.scheme.primary}));};
  const selectType=(type:string,country?:string,countryTpl?:string)=>{setCardType(type);setGalleryFilter(type);setCountryCode(country);setCountryTemplate(countryTpl);const chosen=countryTpl?getTemplateById(countryTpl):TEMPLATES.find(item=>templateCardType(item.id)===type&&!item.isPremium);if(chosen){const color=chosen.colorSchemes.find(item=>plan.isPro||item.isFree)||chosen.colorSchemes[0];setSelectedTemplateId(chosen.id);setSelectedColorSchemeId(color.id);setSetup(value=>({...value,primaryColor:color.primary}));}go('template');};
  const quickStart=()=>{const basic=getTemplateById('basic')!;const color=basic.colorSchemes.find(item=>item.isFree)||basic.colorSchemes[0];setSelectedTemplateId(basic.id);setSelectedColorSchemeId(color.id);setCountryCode(undefined);setCountryTemplate(undefined);setCardType('business');setGalleryFilter('all');setSetup(value=>({...value,primaryColor:color.primary}));go('setup');};
  const create=async(data:QuickSetupData)=>{
    if(!user||creatingRef.current||plan.loading||plan.error)return;
    if(!template||!canUseTemplate(template,selectedColorSchemeId,plan.isPro)){setError('This design or color requires Pro. Choose an available option or review your plan.');return;}
    creatingRef.current=true;setCreating(true);setError('');
    try{
      let photoUrl:string|undefined;
      if(data.photoFile){const uploaded=await uploadProfilePhoto(user.id,data.photoFile);if(!uploaded)throw new Error('Your photo could not upload. Please retry; your details are still here.');photoUrl=uploaded;}
      const scheme=template.colorSchemes.find(item=>item.id===selectedColorSchemeId)!;
      const card=await createCard({...templateDesignDefaults(template),user_id:user.id,full_name:data.fullName.trim(),slug:generateSlug(data.fullName),template_id:selectedTemplateId||'basic',gradient_color_1:data.primaryColor,gradient_color_2:data.primaryColor===scheme.primary?(scheme.secondary||scheme.primary):data.primaryColor,card_type:cardType,is_published:false,is_active:true,...(data.title.trim()?{title:data.title.trim()}:{}),...(selectedColorSchemeId?{color_scheme_id:selectedColorSchemeId}:{}),...(photoUrl?{profile_photo_url:photoUrl}:{}),...(countryCode?{country_code:countryCode}:{})} as any);
      if(!card)throw new Error('Your draft could not be created. Please retry; your details are still here.');
      await router.push(`/app/ecard/${card.id}/edit`,undefined,{locale:router.locale});
    }catch(failure){setError((failure as Error).message);}finally{creatingRef.current=false;setCreating(false);}
  };
  return <><Head><title>{copy('Create eCard')} | Tavvy</title></Head><AppLayout hideTabBar><main className={`ecard-create ${isDark?'dark':''}`}>
    <header><button onClick={()=>step==='template'?void router.push('/app/ecard'):go('template')} disabled={creating}>← {step==='template'?copy('My cards'):copy('Choose a template')}</button><span>{step==='setup'?copy('New eCard'):step==='type'?copy('Choose a card type'):copy('Choose a template')}</span><button aria-label={copy('Close card creation')} onClick={()=>void router.push('/app/ecard')} disabled={creating}>✕</button></header>
    <div className="setup-content">
      {loading||!router.isReady||!presetReady?<p role="status">{copy('Loading your account…')}</p>:!user?<section><h1>{copy('Create your eCard')}</h1><p>{copy('Sign in to save your card as a private draft.')}</p><button className="primary" onClick={()=>void router.push('/app/login?redirect='+encodeURIComponent(selectedTemplateId&&selectedColorSchemeId?templateSelectionPath(selectedTemplateId,selectedColorSchemeId):'/app/ecard/new'))}>{copy('Sign in')}</button></section>:<>
        {(error||plan.error)&&<div className="error" role="alert"><p>{copy(error||plan.error||'')}</p>{plan.error&&<button onClick={plan.retry}>{copy('Retry plan check')}</button>}</div>}
        {step==='setup'&&<>
          <QuickSetup value={setup} onChange={setSetup} onCreate={create} creating={creating} disabled={plan.loading||!!plan.error||!template||!canUseTemplate(template,selectedColorSchemeId,plan.isPro)} isDark={isDark}/>
          <fieldset className="card-purpose" disabled={creating}><legend>{copy('Card for')}</legend>{['business','personal'].map(type=><label key={type}><input type="radio" name="purpose" checked={cardType===type} onChange={()=>{setCardType(type);if(cardType==='politician'){setCountryCode(undefined);setCountryTemplate(undefined);const basic=getTemplateById('basic')!;const color=basic.colorSchemes.find(item=>item.isFree)||basic.colorSchemes[0];setSelectedTemplateId(basic.id);setSelectedColorSchemeId(color.id);setSetup(value=>({...value,primaryColor:color.primary}));setGalleryFilter('all');}}}/>{type==='business'?copy('Business'):copy('Personal')}</label>)}{cardType==='politician'&&<span>{copy('Civic / Public Service')}{countryCode?` · ${countryCode}`:''}</span>}</fieldset>
          <section className="template-choice"><button type="button" onClick={()=>go('template')} disabled={creating}>{copy('Change design or color')}</button><div><strong>{copy('{{name}} template').replace('{{name}}',template?.name||'Basic')}</strong><p>{copy('All templates and card types are available to browse.')}</p></div><button onClick={()=>go('type')} disabled={creating}>{copy('Choose card type & template')}</button></section>
          {plan.loading&&<p role="status">{copy('Checking your plan…')}</p>}
        </>}
        {step==='type'&&<TypePicker onSelect={selectType} isDark={isDark}/>}
        {step==='template'&&<><div className="creation-paths"><button type="button" onClick={quickStart}>{copy('Quick setup')}</button><button type="button" onClick={()=>go('type')}>{copy('Choose card type & template')}</button></div><TemplateGallery key={`${galleryFilter}:${countryTemplate||''}`} cardType={galleryFilter} countryTemplate={countryTemplate} selectedTemplateId={selectedTemplateId} selectedColorSchemeId={selectedColorSchemeId} onSelect={selectDesign} onBack={()=>go('type')} onAvailabilityChange={setTemplateAvailable} isPro={plan.isPro} isDark={isDark}/><button className="primary continue" disabled={!selectedTemplateId||!templateAvailable||plan.loading||!!plan.error} onClick={()=>go('setup')}>{copy('Use this template')}</button></>}
      </>}
    </div>
    <style jsx>{`.ecard-create{--bg:#f7f7fa;--panel:#fff;--text:#202124;--muted:#596170;--border:#d1d5db;min-height:100vh;background:var(--bg);color:var(--text)}.ecard-create.dark{--bg:#111018;--panel:#1d1a26;--text:#f8fafc;--muted:#bcc5d3;--border:#475569}header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--panel)}header span{font-size:14px;text-align:center}.ecard-create button{min-height:44px;border:1px solid var(--border);border-radius:10px;padding:10px 14px;background:var(--panel);color:var(--text);cursor:pointer;font:inherit;font-size:14px}.ecard-create button:disabled{opacity:.5;cursor:default}.ecard-create button.primary{background:#6c2496;color:#fff;border-color:#6c2496}.setup-content{max-width:520px;margin:auto;padding:28px 20px 100px}.creation-paths{display:flex;justify-content:space-between;gap:10px;margin-bottom:22px}.creation-paths button{font-size:12px!important}.card-purpose{border:0;padding:0;margin:24px 0;font-size:14px}.card-purpose legend{margin-bottom:10px;font-weight:600}.card-purpose label{display:inline-flex;gap:8px;align-items:center;margin-right:24px;min-height:44px}.card-purpose input{width:18px;height:18px;accent-color:#6c2496}.template-choice{border:1px solid var(--border);border-radius:14px;padding:18px;background:var(--panel)}.template-choice p{font-size:13px;color:var(--muted);line-height:1.5}.template-choice button{width:100%}.continue{position:fixed;bottom:16px;left:20px;right:20px;z-index:20;width:calc(100% - 40px);max-width:480px;margin:0 auto;box-shadow:0 3px 18px #0003}.error{padding:14px;border:1px solid #bf3b3b;border-radius:12px;margin-bottom:20px}.error p{margin:0 0 10px;line-height:1.5}.ecard-create :global(:focus-visible){outline:3px solid #a368c8;outline-offset:3px}@media(prefers-reduced-motion:reduce){.ecard-create :global(*){scroll-behavior:auto!important}}`}</style>
  </main></AppLayout></>;
}
export const getServerSideProps=async({locale}:{locale:string})=>({props:{...(await serverSideTranslations(locale??'en',['common']))}});
