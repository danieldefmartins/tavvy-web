/**
 * AddReviewSheet — bottom-sheet modal for the "Add Review" signal-tapping flow.
 *
 * A Tavvy review is a SET OF TAPPED SIGNALS (no written text). Signals come from
 * the review_items catalog and are grouped into three buckets by signal_type:
 *   - best_for  -> "The Good"   (teal   #00C2CB)
 *   - vibe      -> "The Vibe"   (purple #8A05BE)
 *   - heads_up  -> "Heads Up"   (amber  #F5A623)
 *
 * Signals are filtered to the place's category via getSignalsForCategory()
 * (slug-prefix match + generic_), the same filter the iOS app and the existing
 * /app/add-review page use.
 *
 * Submission posts to /api/review which inserts a place_reviews row + taps and
 * refreshes place_signal_aggregates. On success, onSubmitted() is called so the
 * parent place page can re-fetch its signals.
 *
 * Props: { placeId, placeName, category, open, onClose, onSubmitted }
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getSignalsForCategory, Signal, SignalsByCategory } from '../lib/signalService';

type BucketId = 'best_for' | 'vibe' | 'heads_up';

const BUCKETS: { id: BucketId; title: string; accent: string }[] = [
  { id: 'best_for', title: 'The Good', accent: '#00C2CB' },
  { id: 'vibe', title: 'The Vibe', accent: '#8A05BE' },
  { id: 'heads_up', title: 'Heads Up', accent: '#F5A623' },
];

export interface AddReviewSheetProps {
  placeId: string;
  placeName: string;
  /** Tavvy primary category slug (e.g. "restaurants"); used to filter signals. */
  category?: string;
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
  open,
  onClose,
  onSubmitted,
}: AddReviewSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();

  const [signals, setSignals] = useState<SignalsByCategory>(EMPTY);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
    getSignalsForCategory(category || 'other')
      .then((s) => {
        if (alive) setSignals(s);
      })
      .catch(() => {
        if (alive) setSignals(EMPTY);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, category]);

  // Reset selection each time the sheet is (re)opened.
  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const goodCount = useMemo(
    () => signals.best_for.filter((s) => selected.has(s.id)).length,
    [signals.best_for, selected]
  );
  const vibeCount = useMemo(
    () => signals.vibe.filter((s) => selected.has(s.id)).length,
    [signals.vibe, selected]
  );
  const total = selected.size;

  // Tavvy guidance: encourage at least 2 Good + 1 Vibe.
  const meetsGuidance = goodCount >= 2 && vibeCount >= 1;

  const toggle = (id: string) => {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          placeId,
          signalIds: Array.from(selected),
          userId: user.id,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json?.requireLogin) {
          const redirect = encodeURIComponent(router.asPath);
          router.push(`/app/login?redirect=${redirect}`);
          return;
        }
        throw new Error(json?.error || 'Failed to post review');
      }

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
  const textMuted = isDark ? '#a8a5b3' : '#8b8898';
  const chipBase = isDark ? '#1c1c24' : '#F2F0F7';
  const chipBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(23,1,58,0.10)';

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

        {/* Guidance hint */}
        {!loading && (
          <div className="hint" style={{ opacity: meetsGuidance ? 0.55 : 1 }}>
            {meetsGuidance
              ? `Looks great — ${total} signal${total !== 1 ? 's' : ''} selected.`
              : 'Tip: pick at least 2 from The Good and 1 from The Vibe.'}
          </div>
        )}

        <div className="body">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Loading signals…</span>
            </div>
          ) : (
            BUCKETS.map((bucket) => {
              const list = signals[bucket.id];
              if (!list || list.length === 0) return null;
              return (
                <section key={bucket.id} className="bucket">
                  <div className="bucket-head">
                    <span className="bucket-badge" style={{ background: bucket.accent }}>
                      {bucket.title}
                    </span>
                  </div>
                  {bucket.id === 'heads_up' && (
                    <p className="warn">Heads Up are cautionary signals — use them honestly.</p>
                  )}
                  <div className="chips">
                    {list.map((sig: Signal) => {
                      const on = selected.has(sig.id);
                      return (
                        <button
                          key={sig.id}
                          className={`chip ${on ? 'on' : ''}`}
                          onClick={() => toggle(sig.id)}
                          style={{
                            background: on ? bucket.accent : chipBase,
                            borderColor: on ? bucket.accent : chipBorder,
                            color: on ? '#FFFFFF' : textPrimary,
                          }}
                        >
                          {sig.icon_emoji && <span className="chip-e">{sig.icon_emoji}</span>}
                          <span className="chip-l">{sig.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}

          {!loading &&
            signals.best_for.length === 0 &&
            signals.vibe.length === 0 &&
            signals.heads_up.length === 0 && (
              <p className="empty">No signals available for this place yet.</p>
            )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="footer">
          <button
            className="post"
            onClick={handleSubmit}
            disabled={submitting || success || total === 0}
          >
            {success
              ? 'Posted ✓'
              : submitting
              ? 'Posting…'
              : total > 0
              ? `Post review · ${total}`
              : 'Select signals to post'}
          </button>
        </div>
      </div>

      <style jsx>{`
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
          width: 32px;
          height: 32px;
          border-radius: 16px;
          border: none;
          background: ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(23,1,58,0.06)'};
          color: ${textPrimary};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
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
          padding: 9px 13px;
          border-radius: 20px;
          border: 1.5px solid;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
          -webkit-tap-highlight-color: transparent;
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
          line-height: 1.1;
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
