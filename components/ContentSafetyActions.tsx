import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { blockContentAuthor, reportContent, CONTENT_BLOCK_SCOPE, ContentKind, ContentReportReason } from '../lib/contentSafety';

export const CONTENT_SAFETY_CHANGED = 'tavvy-content-safety-changed';
export function notifyContentSafetyChanged() { window.dispatchEvent(new Event(CONTENT_SAFETY_CHANGED)); }
const reasons: [ContentReportReason, string][] = [['spam','Spam'],['fake','Fake experience'],['offensive','Offensive content'],['harassment','Harassment'],['sexual','Sexual content'],['violent','Violence'],['wrong_place','Wrong place'],['conflict_of_interest','Conflict of interest'],['other','Other']];
export default function ContentSafetyActions({ kind, contentId, onChanged, compact = false }: { kind: ContentKind; contentId: string; onChanged?: () => void; compact?: boolean }) {
 const { user } = useAuth(); const router = useRouter(); const {theme} = useThemeContext(); const copy = useReleaseCopy();
 const [mode,setMode] = useState<'closed'|'menu'|'report'|'block'>('closed');
 const [reason,setReason] = useState<ContentReportReason>('spam'); const [busy,setBusy] = useState(false); const [message,setMessage] = useState(''); const [error,setError] = useState('');
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId)) return null;
 function choose(next:'report'|'block') {
  if(!user){void router.push(`/app/login?redirect=${encodeURIComponent(router.asPath)}`);return;}
  setError('');setMessage('');setMode(next);
 }
 async function submit() {
  if(busy)return;setBusy(true);setError('');
  try {
   if(mode==='report'){await reportContent(kind,contentId,reason);setMessage(copy('Report sent to Tavvy for review.'));setMode('closed');}
   else if(mode==='block'){await blockContentAuthor(kind,contentId);setMessage(copy('Author blocked.'));setMode('closed');notifyContentSafetyChanged();onChanged?.();}
  }catch(e){setError(e instanceof Error?e.message:copy('This action could not be completed. Please try again.'));}
  finally{setBusy(false);}
 }
 return <div className={compact?'safety compact':'safety'} onClick={event=>event.stopPropagation()}>
  <button type="button" className="trigger" aria-expanded={mode!=='closed'} onClick={()=>setMode(mode==='closed'?'menu':'closed')} disabled={busy}>{copy('Report or block')}</button>
  {mode==='menu'&&<div className="options"><button type="button" onClick={()=>choose('report')}>{copy('Report content')}</button><button type="button" onClick={()=>choose('block')}>{copy('Block author')}</button></div>}
  {mode==='report'&&<div className="panel"><label>{copy('Report reason')}<select value={reason} disabled={busy} onChange={e=>setReason(e.target.value as ContentReportReason)}>{reasons.map(([value,label])=><option key={value} value={value}>{copy(label)}</option>)}</select></label><p>{copy('Reports are reviewed by Tavvy. Reporting does not automatically remove content.')}</p><button type="button" disabled={busy} onClick={submit}>{copy(busy?'Sending…':'Send report')}</button><button type="button" disabled={busy} onClick={()=>setMode('closed')}>{copy('Cancel')}</button></div>}
  {mode==='block'&&<div className="panel"><p>{copy(CONTENT_BLOCK_SCOPE)}</p><p>{copy('You can unblock authors in Settings.')}</p><button type="button" disabled={busy} onClick={submit}>{copy(busy?'Blocking…':'Confirm block')}</button><button type="button" disabled={busy} onClick={()=>setMode('closed')}>{copy('Cancel')}</button></div>}
  {message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  <style jsx>{`.safety{margin-top:8px;color:${theme.text};font-size:13px}.options{display:flex;flex-wrap:wrap;gap:8px}.panel{background:${theme.surface};border:1px solid ${theme.border};border-radius:12px;padding:12px;max-width:480px}.safety button,.safety select{font:inherit;color:${theme.text};background:${theme.surface};border:1px solid ${theme.border};border-radius:9px;min-height:44px;padding:8px 12px;margin:2px}.safety select{display:block;max-width:100%}.safety button:disabled{opacity:.6}.safety.compact{margin-top:2px}.safety.compact .trigger{border:0;background:none;padding:0 2px;margin:0;font-size:12px;font-weight:600;color:${theme.textSecondary}}.safety p{line-height:1.5;white-space:normal}.safety button:focus-visible,.safety select:focus-visible{outline:3px solid ${theme.primary};outline-offset:2px}`}</style>
 </div>;
}
