/**
 * AddReviewSheet — bottom-sheet modal for the "Add Review" signal-tapping flow.
 *
 * A Tavvy review uses tapped signals with an optional public note. Signals come from
 * the review_items catalog and are grouped into three buckets by signal_type:
 *   - best_for  -> "The Good"   (teal   #00C2CB)
 *   - vibe      -> "The Vibe"   (purple #8A05BE)
 *   - heads_up  -> "Heads Up"   (amber  #F5A623)
 *
 * Signals are filtered to the place's category via getSignalsForCategory()
 * (slug-prefix match + generic_), the same filter the iOS app and the existing
 * /app/add-review page use.
 *
 * Submission uses the atomic review adapter to preserve signal intensity and
 * record a new dated visit or explicitly edit a previous review. On success, onSubmitted() is called so the
 * parent place page can re-fetch its signals.
 *
 * Props: { placeId, placeName, category, open, onClose, onSubmitted }
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { fetchUserReview, submitReview, updateReview, todayVisitDate, visitDateToIso } from '../lib/reviewPersistence';
import { cycleSignalTap, matchesSignalSearch, restoreSignalTaps, selectedSignalTaps, SignalTapSelection } from '../lib/signalTapSelection';
import { getSignalsForCategory, Signal, SignalsByCategory } from '../lib/signalService';
import { coreForCategory, isCoreSignal } from '../lib/placeEvidence';

type BucketId = 'best_for' | 'vibe' | 'heads_up';

const BUCKETS: { id: BucketId; title: string; accent: string; onAccent: string }[] = [
  { id: 'best_for', title: 'The Good', accent: '#00C2CB', onAccent: '#17013A' },
  { id: 'vibe', title: 'The Vibe', accent: '#8A05BE', onAccent: '#FFFFFF' },
  { id: 'heads_up', title: 'Heads Up', accent: '#F5A623', onAccent: '#17013A' },
];

export interface AddReviewSheetProps {
  placeId: string;
  placeName: string;
  /** Tavvy primary category slug (e.g. "restaurants"); used to filter signals. */
  category?: string;
  subcategory?: string;
  open: boolean;
  onClose: () => void;
  /** Called after a successful submit so the parent can refresh aggregates. */
  onSubmitted?: () => void;
}

const EMPTY: SignalsByCategory = { best_for: [], vibe: [], heads_up: [] };

export default function AddReviewSheet({
  placeId,
  placeName,
  category,
  subcategory,
  open,
  onClose,
  onSubmitted,
}: AddReviewSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();

  const [signals, setSignals] = useState<SignalsByCategory>(EMPTY);
  const [selected, setSelected] = useState<SignalTapSelection>({});
  const [signalSearch, setSignalSearch] = useState('');
  const [savedNotes, setSavedNotes] = useState<{ publicNote?: string; privateNote?: string }>({});
  const [publicNote, setPublicNote] = useState('');
  const [editingPrevious, setEditingPrevious] = useState(false);
  const [previousReview, setPreviousReview] = useState<Awaited<ReturnType<typeof fetchUserReview>> | null>(null);
  const [visitDate, setVisitDate] = useState(todayVisitDate);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load category-appropriate signals whenever the sheet opens.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setSuccess(false);
    setSelected({}); setReviewId(null); setEditingPrevious(false); setPreviousReview(null); setVisitDate(todayVisitDate()); setSignalSearch(''); setSavedNotes({}); setPublicNote('');
    Promise.all([
      getSignalsForCategory(category || 'other', subcategory),
      user ? fetchUserReview(placeId) : Promise.resolve({ review: null, signals: [] }),
    ])
      .then(([catalog, saved]) => {
        if (alive) {
          setSignals(catalog);
          setPreviousReview(saved);
          setReviewId(saved.review?.id || null);
          setSavedNotes({ publicNote: saved.review?.public_note || undefined, privateNote: saved.review?.private_note_owner || undefined });
          setPublicNote('');
        }
      })
      .catch(() => {
        if (alive) { setSignals(EMPTY); setError('Your review could not be loaded. Close and reopen to retry.'); }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, placeId, category, subcategory, user?.id]);

  const goodCount = useMemo(
    () => signals.best_for.filter((s) => (selected[s.id] || 0) > 0).length,
    [signals.best_for, selected]
  );
  const vibeCount = useMemo(
    () => signals.vibe.filter((s) => (selected[s.id] || 0) > 0).length,
    [signals.vibe, selected]
  );
  const total = Object.keys(selected).length;
  const core = coreForCategory({ category, subcategory });
  const coreChoices = signals.best_for.filter(s => isCoreSignal({ category, subcategory }, s) && matchesSignalSearch(s, signalSearch)).slice(0, 6);
  const coreChoiceIds = new Set(coreChoices.map(s => s.id));
  const matchingCount = Object.values(signals).flat().filter(signal => matchesSignalSearch(signal, signalSearch)).length;

  // Tavvy guidance: encourage at least 2 Good + 1 Vibe.
  const meetsGuidance = goodCount >= 2 && vibeCount >= 1;

  const toggle = (id: string) => {
    setError(null);
    if (loading || submitting || success) return;
    setSelected(prev => cycleSignalTap(prev, id));
  };

  const handleSubmit = async () => {
    if (loading || submitting || success) return;
    if (total === 0) {
      setError('Tap at least one signal before posting.');
      return;
    }

    // Require sign-in; redirect to login preserving the return path.
    if (!user) {
      const redirect = encodeURIComponent(router.asPath);
      router.push(`/app/login?redirect=${redirect}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const taps = selectedSignalTaps(selected);
      const result = editingPrevious && reviewId
        ? await updateReview(reviewId, placeId, taps, publicNote.trim() || undefined, savedNotes.privateNote)
        : await submitReview(placeId, placeName, taps, publicNote.trim() || undefined, undefined, { visitedAt: visitDateToIso(visitDate) });
      if (!result.success) throw new Error(result.error || 'Failed to post review');

      setSuccess(true);
      onSubmitted?.();
      // Brief success state, then close.
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1100);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Dark surfaces mirror components/SignalCard.tsx.
  const surface = isDark ? '#26262f' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#17013A';
  const textMuted = isDark ? '#C2BDCD' : '#62546F';
  const chipBase = isDark ? '#1c1c24' : '#F2F0F7';
  const chipBorder = isDark ? '#777184' : '#82788F';

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />

        <div className="head">
          <div className="head-text">
            <h2 className="title">What stood out?</h2>
            <p className="subtitle">
              {placeName ? `Tap the signals that match ${placeName}.` : 'Tap the signals that match.'}
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="visit-kind">
          <label><input type="radio" name="visit-kind" checked={!editingPrevious} onChange={() => { setEditingPrevious(false); setSelected({}); setPublicNote(''); }} /> A new visit</label>
          {previousReview?.review && <label><input type="radio" name="visit-kind" checked={editingPrevious} onChange={() => { setEditingPrevious(true); setSelected(restoreSignalTaps(previousReview.signals)); setPublicNote(previousReview.review?.public_note || ''); }} /> Edit my previous review</label>}
          {!editingPrevious ? <label>Visit date <input type="date" value={visitDate} max={todayVisitDate()} onChange={event => setVisitDate(event.target.value)} /></label> : <small>Your original visit date is kept. This edit is recorded in the review history.</small>}
        </div>

        <p className="tap-help">Tap once, twice or three times to show intensity. Tap a fourth time to remove.</p>

        {/* Guidance hint */}
        {!loading && (
          <div className="hint" role="status">
            {meetsGuidance
              ? `Looks great — ${total} signal${total !== 1 ? 's' : ''} selected.`
              : `Tip: pick at least 2 from The Good and 1 from ${core.vibeLabel || 'The Vibe'}.`}
          </div>
        )}

        <label className="signal-search">Search signals
          <input value={signalSearch} onChange={event => setSignalSearch(event.target.value)} placeholder="Search by label or keyword" />
        </label>
        {!loading && coreChoices.length > 0 && <div className="core-choices">
          <strong>Start with {core.label.toLowerCase()}</strong>
          <p>What was true about the main reason you came?</p>
          <div>{coreChoices.map(s => <button type="button" key={s.id} onClick={() => toggle(s.id)} aria-pressed={!!selected[s.id]}>{s.icon_emoji} {s.label}{selected[s.id] ? ` · ${selected[s.id]}` : ''}</button>)}</div>
        </div>}
        <div className="body">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading signals…</span>
            </div>
          ) : (
            BUCKETS.map((bucket) => {
              const bucketTitle = bucket.id === 'vibe' ? core.vibeLabel || bucket.title : bucket.title;
              const list = signals[bucket.id].filter(signal => matchesSignalSearch(signal, signalSearch) && !coreChoiceIds.has(signal.id));
              if (!list || list.length === 0) return null;
              return (
                <section key={bucket.id} className="bucket">
                  <div className="bucket-head">
                    <span className="bucket-badge" style={{ background: bucket.accent, color: bucket.onAccent }}>
                      {bucketTitle}
                    </span>
                  </div>
                  {bucket.id === 'heads_up' && (
                    <p className="warn">Heads Up are cautionary signals — use them honestly.</p>
                  )}
                  <div className="chips">
                    {list.map((sig: Signal) => {
                      const intensity = selected[sig.id] || 0;
                      const on = intensity > 0;
                      return (
                        <button
                          key={sig.id}
                          className={`chip ${on ? 'on' : ''}`}
                          aria-pressed={on}
                          aria-label={`${sig.label}, ${bucketTitle}, ${intensity} of 3 taps. ${intensity === 3 ? 'Activate to remove.' : 'Activate to increase intensity.'}`}
                          disabled={loading || submitting || success}
                          onClick={() => toggle(sig.id)}
                          style={{
                            background: on ? bucket.accent : chipBase,
                            borderColor: on ? bucket.accent : chipBorder,
                            color: on ? bucket.onAccent : textPrimary,
                          }}
                        >
                          {sig.icon_emoji && <span className="chip-e">{sig.icon_emoji}</span>}
                          <span className="chip-l">{sig.label}</span>
                          {on && <span className="chip-check" aria-hidden="true">✓ {intensity}/3</span>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}

          {!loading && matchingCount === 0 && signalSearch.trim() && <p className="empty" role="status">No matching signals. Try another search. Your {total} selected signals are kept.</p>}
          {!loading && !signalSearch.trim() &&
            signals.best_for.length === 0 &&
            signals.vibe.length === 0 &&
            signals.heads_up.length === 0 && (
              <p className="empty">No signals available for this place yet.</p>
            )}
        </div>

        <label className="public-note">Add context (optional)
          <textarea value={publicNote} onChange={event => setPublicNote(event.target.value.slice(0, 4000))} placeholder="What did you order? What made this visit stand out? This note is public." maxLength={4000} />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="footer">
          <button
            className="post"
            onClick={handleSubmit}
            disabled={loading || submitting || success || total === 0}
          >
            {success
              ? 'Posted ✓'
              : submitting
              ? 'Posting…'
              : total > 0
              ? `${reviewId ? 'Update' : 'Post'} review · ${total}`
              : 'Select signals to post'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .visit-kind { display: flex; flex-wrap: wrap; gap: 10px 16px; padding: 12px 20px; color: ${textPrimary}; }
        .visit-kind label { display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .visit-kind small { color: ${textMuted}; }
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fade 0.18s ease;
        }
        .sheet {
          width: 100%;
          max-width: 520px;
          max-height: 88vh;
          background: ${surface};
          border-radius: 22px 22px 0 0;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.35);
          animation: slide 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .grabber {
          width: 38px;
          height: 4px;
          border-radius: 2px;
          background: ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(23,1,58,0.18)'};
          margin: 10px auto 4px;
          flex: none;
        }
        .head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 18px 6px;
          flex: none;
        }
        .title {
          font-size: 21px;
          font-weight: 800;
          color: ${textPrimary};
          margin: 0;
          letter-spacing: -0.3px;
        }
        .subtitle {
          font-size: 13px;
          color: ${textMuted};
          margin: 3px 0 0;
        }
        .close {
          flex: none;
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: none;
          background: ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(23,1,58,0.06)'};
          color: ${textPrimary};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .signal-search { margin: 12px 18px 0; color: ${textMuted}; font-size: 13px; font-weight: 600; }
        .signal-search input { display: block; box-sizing: border-box; width: 100%; min-height: 44px; margin-top: 6px; padding: 10px 12px; border: 1px solid ${chipBorder}; border-radius: 12px; background: ${chipBase}; color: ${textPrimary}; font-size: 15px; }
        .signal-search input::placeholder { color: ${textMuted}; opacity: 1; }
        .signal-search input:focus-visible { outline: 3px solid ${isDark ? '#FFFFFF' : '#17013A'}; outline-offset: 2px; }
        .core-choices { margin: 14px 18px; padding: 14px; border: 1px solid ${chipBorder}; border-radius: 14px; color: ${textPrimary}; }
        .core-choices strong { font-size: 15px; }
        .core-choices p { margin: 4px 0 10px; color: ${textMuted}; font-size: 12px; }
        .core-choices div { display: flex; flex-wrap: wrap; gap: 7px; }
        .core-choices button { border: 1px solid #00C2CB; border-radius: 20px; background: ${chipBase}; color: ${textPrimary}; padding: 7px 10px; font-size: 12px; }
        .core-choices button[aria-pressed="true"] { background: #00C2CB; color: #17013A; }
        .public-note { display: block; padding: 12px 18px; color: ${textPrimary}; font-size: 13px; font-weight: 700; }
        .public-note textarea { display: block; box-sizing: border-box; width: 100%; min-height: 70px; margin-top: 7px; border: 1px solid ${chipBorder}; border-radius: 12px; padding: 10px; background: ${chipBase}; color: ${textPrimary}; font: inherit; font-weight: 400; }
        .tap-help { margin: 8px 18px 4px; color: ${textMuted}; font-size: 13px; line-height: 1.4; }
        .chip-check { font-size: 12px; white-space: nowrap; }
        .hint {
          margin: 4px 18px 0;
          font-size: 12.5px;
          font-weight: 600;
          color: ${textMuted};
          flex: none;
        }
        .body {
          overflow-y: auto;
          padding: 12px 18px 4px;
          -webkit-overflow-scrolling: touch;
        }
        .bucket {
          margin-bottom: 18px;
        }
        .bucket-head {
          margin-bottom: 10px;
        }
        .bucket-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.2px;
        }
        .warn {
          font-size: 12px;
          color: ${isDark ? '#FFC061' : '#9A5600'};
          margin: 0 0 8px;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          min-height: 44px;
          border-radius: 20px;
          border: 1.5px solid;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .chip:focus-visible, .close:focus-visible, .post:focus-visible {
          outline: 3px solid ${isDark ? '#FFFFFF' : '#17013A'};
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .overlay, .sheet, .chip, .post, .spinner { animation: none; transition: none; }
        }
        .chip:active {
          transform: scale(0.95);
        }
        .chip.on {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
        }
        .chip-e {
          font-size: 15px;
          line-height: 1;
        }
        .chip-l {
          line-height: 1.35;
        }
        .empty {
          text-align: center;
          color: ${textMuted};
          font-size: 14px;
          padding: 28px 0;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 36px 0;
          color: ${textMuted};
          font-size: 14px;
        }
        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(23,1,58,0.12)'};
          border-top-color: #00c2cb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .error {
          margin: 0 18px;
          padding: 10px 12px;
          border-radius: 12px;
          background: ${isDark ? 'rgba(255,59,48,0.16)' : '#FEE2E2'};
          color: ${isDark ? '#FF8A80' : '#991B1B'};
          font-size: 13px;
          text-align: center;
        }
        .footer {
          flex: none;
          padding: 12px 18px calc(16px + env(safe-area-inset-bottom, 0));
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,1,58,0.06)'};
          background: ${surface};
        }
        .post {
          width: 100%;
          padding: 15px 20px;
          border-radius: 15px;
          border: none;
          background: #8a05be;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .post:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .post:not(:disabled):active {
          transform: scale(0.98);
        }
        @keyframes fade {
          from {
            opacity: 0;
          }
        }
        @keyframes slide {
          from {
            transform: translateY(100%);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
