import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { fetchUserReview, submitReview, updateReview, todayVisitDate, visitDateToIso } from '../lib/reviewPersistence';
import { restoreSignalTaps, selectedSignalTaps, SignalTapSelection } from '../lib/signalTapSelection';
import { getSignalsForCategory, SignalsByCategory } from '../lib/signalService';
import ReviewChoices from './ReviewChoices';
import { reviewChoiceCount } from '../lib/reviewComposer';

export interface AddReviewSheetProps { placeId: string; placeName: string; category?: string; subcategory?: string; open: boolean; onClose: () => void; onSubmitted?: () => void }
const EMPTY: SignalsByCategory = { best_for: [], vibe: [], heads_up: [] };
export default function AddReviewSheet({ placeId, placeName, category, subcategory, open, onClose, onSubmitted }: AddReviewSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const [signals, setSignals] = useState<SignalsByCategory>(EMPTY);
  const [selected, setSelected] = useState<SignalTapSelection>({});
  const [publicNote, setPublicNote] = useState('');
  const [editingPrevious, setEditingPrevious] = useState(false);
  const [previous, setPrevious] = useState<Awaited<ReturnType<typeof fetchUserReview>> | null>(null);
  const [visitDate, setVisitDate] = useState(todayVisitDate);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const loadedIdentity = useRef('');
  const identity = `${user?.id || 'guest'}:${placeId}:${category}:${subcategory}`;
  const total = reviewChoiceCount(Object.values(signals).flat(), selected);
  const close = () => { if (!busy.current) onClose(); };

  useEffect(() => {
    if (!open || loadedIdentity.current === identity) return;
    const request = ++generation.current;
    let active = true;
    busy.current = false; setSubmitting(false); setLoading(true); setLoadError(false); setError(null); setSelected({}); setPublicNote(''); setEditingPrevious(false); setPrevious(null); setVisitDate(todayVisitDate()); setSuccess(false);
    Promise.all([getSignalsForCategory(category || 'other', subcategory), user ? fetchUserReview(placeId) : Promise.resolve({ review: null, signals: [] })])
      .then(([catalog, saved]) => { if (active && request === generation.current) { setSignals(catalog); setPrevious(saved); loadedIdentity.current = identity; } })
      .catch(() => { if (active && request === generation.current) { setLoadError(true); setError(copy('Your review could not be loaded. Please try again.')); } })
      .finally(() => { if (active && request === generation.current) setLoading(false); });
    return () => { active = false; };
  }, [open, identity, reload]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy.current) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary, a[href]') || []).filter(element => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', keyboard); previousFocus?.focus(); };
  }, [open, onClose]);
  useEffect(() => () => { generation.current++; }, []);

  async function post() {
    if (busy.current || loading || loadError || !total || success) return;
    if (!user) { await router.push('/app/login?redirect=' + encodeURIComponent(router.asPath)); return; }
    busy.current = true; setSubmitting(true); setError(null);
    const request = generation.current;
    try {
      const taps = selectedSignalTaps(selected);
      const result = editingPrevious && previous?.review
        ? await updateReview(previous.review.id, placeId, taps, publicNote.trim(), previous.review.private_note_owner || undefined)
        : await submitReview(placeId, placeName, taps, publicNote.trim() || undefined, undefined, { visitedAt: visitDateToIso(visitDate) });
      if (!result.success) throw new Error(result.error || copy('Your review could not be saved. Please try again.'));
      if (request !== generation.current) return;
      setSuccess(true); loadedIdentity.current = ''; onSubmitted?.();
    } catch (cause) { if (request === generation.current) setError(cause instanceof Error ? cause.message : copy('Your review could not be saved. Please try again.')); }
    finally { if (request === generation.current) { busy.current = false; setSubmitting(false); } }
  }
  if (!open) return null;
  return <div className="overlay" onClick={close}>
    <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby="review-title" tabIndex={-1} onClick={event => event.stopPropagation()}>
      <header><div><h2 id="review-title">{copy(success ? 'Experience shared' : 'What stood out?')}</h2><p>{placeName}</p></div><button type="button" className="close" disabled={submitting} onClick={close} aria-label={copy('Close')}><X size={21}/></button></header>
      {success ? <div className="success" role="status"><Check size={40}/><h3>{copy('Thank you for sharing your experience.')}</h3><p>{copy('Your words help someone choose their next place.')}</p><button className="primary" type="button" onClick={close}>{copy('Done')}</button></div> : <>
        <div className="body">
          {loading ? <p role="status">{copy('Loading recent reviews…')}</p> : loadError ? <button type="button" className="secondary" onClick={() => setReload(value => value + 1)}>{copy('Try again')}</button> : <>
            <ReviewChoices key={identity} signals={Object.values(signals).flat()} subject={{ category, subcategory }} selected={selected} onChange={setSelected} disabled={submitting}/>
            <label className="note">{copy('Add context (optional)')}<textarea value={publicNote} disabled={submitting} onChange={event => setPublicNote(event.target.value)} maxLength={4000} rows={3} placeholder={copy('What would help someone decide? Your note will be public.')}/></label>
            <details className="visit"><summary>{copy(editingPrevious ? 'Editing your previous review' : 'Visit date')} · {editingPrevious ? copy('Original date kept') : visitDate}</summary><div className="visit-options">
              {previous?.review && <label><input type="checkbox" checked={editingPrevious} disabled={submitting} onChange={event => { setEditingPrevious(event.target.checked); setSelected(event.target.checked ? restoreSignalTaps(previous.signals) : {}); setPublicNote(event.target.checked ? previous.review?.public_note || '' : ''); }}/>{copy('Edit my previous review')}</label>}
              {!editingPrevious && <label>{copy('Visit date')}<input type="date" value={visitDate} disabled={submitting} max={todayVisitDate()} onChange={event => setVisitDate(event.target.value)}/></label>}
              <small>{copy('A new visit adds an experience. Editing keeps the original visit and its history.')}</small>
            </div></details>
          </>}
        </div>
        <footer>{error && <p className="error" role="alert">{error}</p>}<button type="button" className="primary" disabled={submitting || loading || loadError || !total} onClick={post}>{copy(submitting ? 'Saving…' : editingPrevious ? 'Update review' : 'Post review')}{total > 0 && !submitting && <span> · {total}</span>}</button><small>{copy('Choose at least one word. A written review is optional.')}</small></footer>
      </>}
    </div>
      <style jsx>{`
        .overlay{position:fixed;inset:0;z-index:2000;background:rgba(12,5,24,.5);display:flex;align-items:flex-end;justify-content:center}.sheet{width:100%;max-width:560px;max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;border-radius:24px 24px 0 0;background:${theme.background};color:${theme.text};outline:none;box-shadow:0 -10px 45px rgba(0,0,0,.12)}header{display:flex;justify-content:space-between;gap:12px;padding:22px 20px 16px;border-bottom:1px solid ${theme.border};flex-shrink:0}h2{margin:0;font-size:24px;letter-spacing:-.5px}header p{margin:5px 0 0;color:${theme.textSecondary};font-size:14px}.close{width:44px;height:44px;flex:none;display:grid;place-items:center;border:0;border-radius:50%;background:${theme.surface};color:${theme.text};cursor:pointer}.body{padding:18px 20px;overflow-y:auto;overscroll-behavior:contain}.note{display:block;font-size:14px;font-weight:600;margin-top:10px}textarea{display:block;box-sizing:border-box;width:100%;margin-top:9px;padding:12px;border:1px solid ${theme.border};border-radius:12px;resize:vertical;background:${theme.surface};color:${theme.text};font:inherit;font-weight:400;line-height:1.5}textarea::placeholder{color:${theme.textSecondary}}.visit{margin-top:18px;font-size:13px;color:${theme.textSecondary}}summary{cursor:pointer;min-height:36px}.visit-options{display:flex;flex-direction:column;gap:14px;padding:10px 0}.visit-options label{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.visit input{font:inherit;min-height:32px;background:${theme.surface};color:${theme.text};border:1px solid ${theme.border};border-radius:8px;padding:6px}.visit input[type=checkbox]{accent-color:${theme.primary};width:20px;height:20px}footer{flex-shrink:0;border-top:1px solid ${theme.border};padding:12px 20px max(14px,env(safe-area-inset-bottom));background:${theme.background}}.primary{width:100%;border:0;border-radius:14px;min-height:48px;background:${theme.primary};color:#fff;font:inherit;font-weight:650;cursor:pointer}.primary:disabled{opacity:.45;cursor:default}footer small{display:block;text-align:center;margin-top:8px;color:${theme.textSecondary};font-size:11px;line-height:16px}.error{font-size:13px;line-height:19px;color:${isDark ? '#FFB3B3' : '#A32131'};margin:0 0 10px}.secondary{min-height:44px;font:inherit;background:${theme.surface};color:${theme.text};border:1px solid ${theme.border};border-radius:10px;padding:10px 15px}.success{padding:40px 24px;text-align:center;color:${theme.text}}.success :global(svg){color:${theme.primary};margin:auto}.success p{color:${theme.textSecondary};line-height:1.5}.success .primary{margin-top:15px}button:focus-visible,summary:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid ${isDark ? '#D9B6FF' : theme.primary};outline-offset:2px}@media(min-width:700px){.overlay{align-items:center;padding:24px}.sheet{border-radius:24px;max-height:88dvh}}
      `}</style>
  </div>;
}
