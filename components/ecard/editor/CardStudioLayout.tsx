import { useReleaseCopy } from '../../../hooks/useReleaseCopy';
/** Accessible content-first editor. Existing sections, templates and public tools remain available. */
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import { publishCard, unpublishCard, THEMES } from '../../../lib/ecard';
import { getTemplateById } from '../../../config/eCardTemplates';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useECardPlan } from '../../../hooks/useECardPlan';
import CardPreview from '../CardPreview';
import { ecardDesignRequiresPro } from '../../../lib/ecard/designAccess';
import {hasProExtras} from '../../../lib/ecard/premiumContent';
import StyledQRCode from '../StyledQRCode';
import ProfileSection from './sections/ProfileSection';
import ContactSection from './sections/ContactSection';
import SocialSection from './sections/SocialSection';
import LinksSection from './sections/LinksSection';
import MediaSection from './sections/MediaSection';
import TemplateColorSection from './sections/TemplateColorSection';
import ImagesLayoutSection from './sections/ImagesLayoutSection';
import TypographySection from './sections/TypographySection';
import CivicSection from './sections/CivicSection';
import MobileBusinessSection from './sections/MobileBusinessSection';
import AdvancedSection from './sections/AdvancedSection';

type Section = 'content' | 'design' | 'more';
export default function CardStudioLayout() {
  const copy = useReleaseCopy();
  const router = useRouter(), { user } = useAuth(), { isDark } = useThemeContext();
  const plan = useECardPlan();
  const { state, dispatch } = useEditor();
  const latest = useRef(state); latest.current = state;
  const { isSaving, isDirty, lastSaved, saveError, saveNow } = useAutoSave({ userId: user?.id, isPro: plan.isPro, enabled: !plan.loading && !plan.error });
  const [section, setSection] = useState<Section>("content"), [view, setView] = useState<'edit' | 'preview'>("edit");
  const [publishing, setPublishing] = useState(false), publishingRef = useRef(false);
  const [message, setMessage] = useState(''), [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState<'share' | 'premium' | null>(null);
  const card = state.card, cardId = card.id, templateId = card.template_id || 'basic';
  const published = card.is_published === true;
  const url = `https://tavvy.com/${encodeURIComponent(card.slug || cardId || '')}`;
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProfessional = templateId.startsWith('pro-') || templateId === 'business-card' || templateId === 'cover-card';
  const unavailable = plan.loading || !!plan.error;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (latest.current.isDirty || latest.current.isSaving) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const goBack = () => { if ((!isDirty && !isSaving) || window.confirm('You have unsaved changes. Leave the editor?')) void router.push('/app/ecard'); };
  const paidFeatures = () => !!(ecardDesignRequiresPro(card) || hasProExtras(card));
  const publish = async () => {
    if (!cardId || publishingRef.current || isSaving || unavailable) return;
    if (!plan.isPro && paidFeatures()) { setDialog("premium"); return; }
    publishingRef.current = true; setPublishing(true); setActionError(''); setMessage('');
    try {
      if ((latest.current.isDirty || latest.current.saveError) && !await saveNow()) { setActionError("Your latest changes have not saved. Retry saving before publishing."); return; }
      if (!await publishCard(cardId, latest.current.card.slug || cardId)) throw new Error('Your card could not be published. Your saved content is still here.');
      dispatch({ type: 'SET_PUBLICATION', published: true }); setMessage("Your card is published and ready to share.");
    } catch (failure) { setActionError((failure as Error).message); }
    finally { publishingRef.current = false; setPublishing(false); }
  };
  const unpublish = async () => {
    if (!cardId || publishingRef.current || !window.confirm('Unpublish this card? You can publish it again later.')) return;
    publishingRef.current = true; setPublishing(true); setActionError('');
    try { if (!await unpublishCard(cardId)) throw new Error('Your card could not be unpublished. Please try again.'); dispatch({type:'SET_PUBLICATION',published:false}); setMessage('Your card is now a draft.'); }
    catch (failure) { setActionError((failure as Error).message); }
    finally { publishingRef.current = false; setPublishing(false); }
  };
  const copyCardLink = async () => { try { await navigator.clipboard.writeText(url); setMessage("Card link copied."); } catch { setActionError('The link could not be copied. Select the address shown in Share.'); } };
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: card.full_name || 'My Tavvy card', url }); else await copyCardLink(); }
    catch (failure) { if ((failure as Error).name !== 'AbortError') setActionError('Sharing was unavailable. You can copy the card link.'); }
  };
  const fullPreview = async () => { if (isSaving || unavailable) return; if (isDirty && !await saveNow()) { setActionError('Save your changes before opening the separate full preview.'); return; } void router.push(`/app/ecard/${cardId}/preview`); };
  const status = saveError ? "Could not save" : isSaving ? "Saving…" : isDirty ? "Unsaved changes" : lastSaved ? "All changes saved" : "Saved";
  const previewCard = { ...card, title: card.title_role ?? card.title };
  return <main className={`card-studio ${isDark ? "dark" : "light"}`} data-editor-theme={isDark ? "dark" : "light"}>
    <header className="studio-toolbar">
      <button className="quiet back" onClick={goBack} disabled={publishing} aria-label="Back to my cards">← {copy('My cards')}</button>
      <div className="studio-heading"><h1>{card.full_name || 'Your eCard'}</h1><span className="publication">{published ? copy("Published") : copy("Draft")}</span></div>
      <div className="studio-actions"><button className="quiet" onClick={()=>setDialog("share")}>{copy("Share & QR")}</button><button className="quiet" onClick={()=>setView(view==='preview'?"edit":"preview")}>{view==='preview'?copy("Edit"):copy("Preview")}</button><button onClick={()=>void saveNow()} disabled={isSaving || publishing || !isDirty || unavailable}>{copy("Save")}</button>{!published&&<button className={"primary"} onClick={publish} disabled={isSaving || publishing || unavailable}>{publishing?copy("Publishing…"):copy("Publish")}</button>}</div>
    </header>
    <div className="studio-status" aria-live="polite"><span>{copy(status)}</span><span>{published?copy("Saved changes update your published card."):copy("Your draft is private until you publish.")}</span></div>
    {(plan.error || saveError || actionError) && <div className="studio-alert" role="alert"><p>{plan.error || saveError || actionError}</p>{plan.error ? <button onClick={plan.retry}>{copy("Retry plan check")}</button> : saveError ? <button disabled={isSaving||publishing||unavailable} onClick={()=>void saveNow()}>{copy("Retry saving")}</button> : <button onClick={()=>setActionError('')}>{copy("Dismiss")}</button>}</div>}
    {message&&<p className="studio-message" role="status">{copy(message)}</p>}
    <div className="studio-grid" data-view={view}>
      <section className="studio-controls" aria-label="Edit card content">
        <nav className="studio-tabs" aria-label="Card editor sections">{([{id:"content",label:"Content"},{id:"design",label:"Design"},{id:"more",label:"More features"}] as const).map(item=><button key={item.id} aria-current={section===item.id?'page':undefined} onClick={()=>setSection(item.id)}>{copy(item.label)}</button>)}</nav>
        <fieldset className="studio-fields" disabled={publishing}>
          {section==='content'&&<><LinksSection isDark={isDark} isPro={plan.isPro}/><ProfileSection isDark={isDark} isPro={plan.isPro}/><ContactSection isDark={isDark} isPro={plan.isPro}/><SocialSection isDark={isDark} isPro={plan.isPro}/></>}
          {section==='design'&&<><details className="studio-group" open><summary>{copy("Templates & colors")}</summary><TemplateColorSection isDark={isDark} isPro={plan.isPro}/></details><details className="studio-group"><summary>{copy("Typography & buttons")}</summary><TypographySection isDark={isDark} isPro={plan.isPro}/></details><details className="studio-group"><summary>{copy("Images & layout")}</summary><ImagesLayoutSection isDark={isDark} isPro={plan.isPro}/></details></>}
          {section==='more'&&<><MediaSection isDark={isDark} isPro={plan.isPro}/>{isProfessional&&<details className="studio-group"><summary>{copy("Professional details & contact form")}</summary><AdvancedSection isDark={isDark} isPro={plan.isPro}/></details>}{isCivic&&<details className="studio-group"><summary>{copy("Civic details")}</summary><CivicSection isDark={isDark} isPro={plan.isPro}/></details>}{isMobileBiz&&<details className="studio-group"><summary>{copy("Mobile business")}</summary><MobileBusinessSection isDark={isDark} isPro={plan.isPro}/></details>}<details className="studio-group"><summary>{copy("Publication & sharing")}</summary><p>{published?'Your card is public.':'Your card is a private draft.'}</p><div className="group-actions"><button onClick={()=>setDialog("share")}>{copy("Share & QR")}</button>{published?<button onClick={unpublish} disabled={publishing||isSaving}>{copy("Unpublish card")}</button>:<button onClick={publish} disabled={publishing||isSaving||unavailable}>Publish card</button>}</div></details></>}
        </fieldset>
      </section>
      <aside className="studio-preview" aria-label={copy("Card preview")}><div className="preview-heading"><h2>{copy("Card preview")}</h2><button className="quiet" onClick={fullPreview} disabled={isSaving||publishing||unavailable}>Open full preview ↗</button></div><p className="preview-note">{copy("Updates as you edit. Preview actions do not contact anyone.")}</p><div className="preview-frame" onClickCapture={event=>{ if ((event.target as HTMLElement).closest('a,button,input,form')) event.preventDefault(); }}><CardPreview card={previewCard as any} links={state.links.filter(link=>link.is_active!==false&&link.is_active!==null)}/></div><button className="mobile-edit" onClick={()=>setView("edit")}>{copy("Back to editing")}</button></aside>
    </div>
    {dialog&&<StudioDialog title={dialog==='share'?copy("Share your card"):copy("Pro features")} onClose={()=>setDialog(null)}>
      {dialog==='share'?<>{!published&&<p className="draft-note">This card is a draft. Its link and QR code will work for visitors after you publish.</p>}<div className="share-qr"><StyledQRCode url={url} style={{size:210}}/></div><label className="share-url">Card link<input readOnly value={url} onFocus={event=>event.target.select()}/></label><div className="group-actions"><button onClick={copyCardLink}>{copy("Copy link")}</button><button className={"primary"} onClick={share}>{copy("Share")}</button></div></>:<><p>{copy('Requires Pro')}. {copy('Gallery photos, embedded videos, contact forms and professional credentials are Pro extras.')} {copy('Your existing content stays on your card.')}</p><div className="group-actions"><button onClick={()=>{setDialog(null);setView("edit");}}>{copy("Keep editing")}</button><button className={"primary"} onClick={()=>void router.push('/app/ecard/premium')}>{copy("View Pro plan")}</button></div></>}
    </StudioDialog>}
    <style jsx>{`
      .card-studio{--studio-bg:#f5f5f7;--studio-panel:#fff;--studio-text:#202124;--studio-muted:#626a76;--studio-border:#dce0e5;--studio-accent:#6c2496;min-height:100vh;background:var(--studio-bg);color:var(--studio-text);padding-bottom:28px}.card-studio.dark{--studio-bg:#111018;--studio-panel:#1d1a26;--studio-text:#f5f3f7;--studio-muted:#b8b1c3;--studio-border:#433a50;--studio-accent:#d1a1f1}.studio-toolbar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 24px;background:var(--studio-panel);border-bottom:1px solid var(--studio-border)}.studio-heading{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.studio-heading h1{font-size:20px;line-height:1.3;margin:0;overflow-wrap:anywhere;min-width:0}.publication{padding:4px 8px;border:1px solid var(--studio-border);border-radius:8px;font-size:12px;white-space:nowrap}.studio-actions{display:flex;gap:8px;flex-wrap:wrap}.card-studio button{min-height:44px;border:1px solid var(--studio-border);border-radius:10px;padding:10px 14px;background:var(--studio-panel);color:var(--studio-text);font:inherit;font-size:14px;cursor:pointer}.card-studio button:disabled{opacity:.5;cursor:default}.card-studio button.primary{background:#6c2496;color:#fff;border-color:#6c2496}.card-studio button.quiet{background:transparent}.studio-status{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;max-width:1320px;margin:auto;padding:12px 24px;font-size:13px;color:var(--studio-muted)}.studio-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,1fr);gap:24px;max-width:1320px;margin:0 auto;padding:0 24px}.studio-grid[data-view=preview]{grid-template-columns:1fr}.studio-grid[data-view=preview] .studio-controls{display:none}.studio-grid[data-view=preview] .studio-preview{width:100%;max-width:540px;margin:0 auto}.studio-controls{min-width:0;background:var(--studio-panel);border:1px solid var(--studio-border);border-radius:18px;overflow:hidden}.studio-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:10px;border-bottom:1px solid var(--studio-border)}.studio-tabs button[aria-current=page]{background:#6c2496;color:white;border-color:#6c2496}.studio-fields{border:0;padding:0;margin:0;min-width:0}.studio-group{padding:0 20px 20px;border-bottom:1px solid var(--studio-border)}.studio-group summary{padding:20px 0;min-height:48px;cursor:pointer;font-size:16px;font-weight:650}.studio-preview{min-width:0;position:sticky;top:16px;align-self:start}.preview-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.preview-heading h2{font-size:17px;margin:0}.preview-note{color:var(--studio-muted);font-size:12px;line-height:1.5}.preview-frame{margin:18px auto;min-width:0}.group-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.studio-alert,.studio-message{max-width:1272px;margin:8px auto 18px;padding:14px 18px;border:1px solid var(--studio-border);border-radius:12px;background:var(--studio-panel)}.studio-alert{border-left:4px solid #b64037}.studio-alert p{margin:0 0 10px}.studio-message{color:var(--studio-text)}.mobile-edit{display:none}.share-qr{display:flex;justify-content:center;padding:20px}.share-url{display:block;font-size:13px}.share-url input{box-sizing:border-box;display:block;width:100%;padding:12px;border:1px solid var(--studio-border);border-radius:8px;color:var(--studio-text);background:var(--studio-bg);margin-top:6px}.draft-note{line-height:1.6}.card-studio :global(:focus-visible){outline:3px solid var(--studio-accent);outline-offset:3px}.card-studio :global(input),.card-studio :global(textarea){max-width:100%;box-sizing:border-box}
      @media(max-width:800px){.studio-toolbar{padding:12px;gap:10px}.studio-heading h1{font-size:17px}.studio-actions{width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.studio-actions button{padding:9px 5px;font-size:13px}.studio-grid{display:block;padding:0 12px}.studio-status{padding:12px;font-size:12px}.studio-grid[data-view=edit] .studio-preview{display:none}.studio-grid[data-view=preview] .studio-controls{display:none}.studio-preview{position:static}.preview-frame{margin:16px auto}.mobile-edit{display:block!important;width:100%;margin:16px 0}.studio-tabs{position:sticky;top:0}.studio-alert,.studio-message{margin-left:12px;margin-right:12px}.back{font-size:12px!important}.studio-group{padding-left:16px;padding-right:16px}}
    `}</style>
  </main>;
}
function StudioDialog({ title, onClose, children }: {title:string;onClose:()=>void;children:React.ReactNode}) {
  const copy = useReleaseCopy();
  const dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){const items=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href]')||[]);if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};},[]);
  return <div className="studio-overlay" onClick={onClose}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="studio-dialog-title" className="studio-dialog" onClick={event=>event.stopPropagation()}><button className={"close"} onClick={onClose} aria-label="Close dialog">✕</button><h2 id="studio-dialog-title">{title}</h2>{children}</div><style jsx>{`.studio-overlay{position:fixed;inset:0;background:#0009;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}.studio-dialog{position:relative;background:var(--studio-panel);color:var(--studio-text);border:1px solid var(--studio-border);width:100%;max-width:420px;max-height:90vh;overflow:auto;border-radius:20px;padding:24px}.studio-dialog h2{font-size:22px;margin:0 44px 12px 0}.close{position:absolute;right:16px;top:14px;border:1px solid var(--studio-border);background:transparent;color:inherit;border-radius:8px;min-width:44px;min-height:44px}`}</style></div>;
}
