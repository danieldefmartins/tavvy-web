/**
 * PREVIEW — how a Tavvy review looks, rendered with the REAL components
 * (PlaceReviewGrid, Reviewer, SignalCard) from fictional evidence. Every number
 * is computed by the live rules: people not taps, last 180 days, concerns marked
 * in text, dated older reports, practical details kept apart from complaints.
 *
 * Fictional place and reviewers. Not a real business or real reviews.
 */
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';
import PlaceReviewGrid from '../../components/PlaceReviewGrid';
import { Reviewer, type Review } from '../../components/PreviewPlace';
import SignalCard from '../../components/SignalCard';
import { buildPlaceEvidence, EvidenceVisit } from '../../lib/placeEvidence';
import { buildPlaceReviewSummary } from '../../lib/placeReviewSummary';

// ---------------------------------------------------------------------------
// Fictional evidence: 38 reviewers over the last six months.
// ---------------------------------------------------------------------------
const NOW = new Date('2026-09-22T12:00:00Z');
const SUBJECT = { category: 'restaurant', subcategory: 'Brazilian' };
type Cat = 'good' | 'vibe' | 'headsup';
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const TOPICS: { slug: string; label: string; category: Cat; users: number[] }[] = [
  { slug: 'delicious_food', label: 'Delicious food', category: 'good', users: range(1, 21) },
  { slug: 'fresh_ingredients', label: 'Fresh ingredients', category: 'good', users: range(3, 11) },
  { slug: 'generous_portions', label: 'Generous portions', category: 'good', users: range(6, 13) },
  { slug: 'friendly_staff', label: 'Friendly staff', category: 'good', users: range(2, 15) },
  { slug: 'good_value', label: 'Good value', category: 'good', users: range(8, 18) },
  { slug: 'quick_service', label: 'Quick service', category: 'good', users: range(20, 25) },
  { slug: 'cozy', label: 'Cozy', category: 'vibe', users: range(1, 12) },
  { slug: 'lively', label: 'Lively', category: 'vibe', users: range(13, 21) },
  { slug: 'family_friendly', label: 'Family friendly', category: 'vibe', users: range(22, 28) },
  { slug: 'food_arrived_cold', label: 'Food arrived cold', category: 'headsup', users: range(29, 31) },
  { slug: 'long_wait_weekends', label: 'Long wait on weekends', category: 'headsup', users: range(30, 34) },
  { slug: 'loud_on_fridays', label: 'Loud on Fridays', category: 'headsup', users: range(33, 36) },
  { slug: 'cash_only', label: 'Cash only', category: 'headsup', users: range(35, 38) },
];
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();
const VISITS: EvidenceVisit[] = range(1, 38).map(u => ({
  reviewId: `r${u}`, userId: `u${u}`, visitedAt: daysAgo(3 + ((u * 37) % 170)),
  signals: TOPICS.filter(t => t.users.includes(u)).map(t => ({ slug: t.slug, label: t.label, category: t.category })),
}));
// A serious concern never fades automatically: it stays visible, dated, until resolved.
VISITS.push({ reviewId: 'r-old-9', userId: 'u9', visitedAt: '2026-02-10T18:00:00Z',
  signals: [{ slug: 'allergen_mixup', label: 'Allergen mix-up', category: 'headsup' }] });

const EVIDENCE = buildPlaceEvidence(VISITS, SUBJECT, NOW);
const SUMMARY = buildPlaceReviewSummary(EVIDENCE, SUBJECT);

const REVIEWS: Review[] = [
  { id: 'e1', initial: 'M', color: '#00C2CB', name: 'Marina S.', when: 'Sep 17, 2026', text: 'The picanha was perfect and they brought extra farofa without asking. Go early on Saturdays.',
    signals: [{ label: 'Delicious food', category: 'good' }, { label: 'Cozy', category: 'vibe' }, { label: 'Friendly staff', category: 'good' }] },
  { id: 'e2', initial: 'D', color: '#8A05BE', name: 'Diego R.', when: 'Sep 11, 2026', text: 'Portions are huge, but two plates came out lukewarm on a packed Friday.',
    signals: [{ label: 'Generous portions', category: 'good' }, { label: 'Food arrived cold', category: 'headsup' }, { label: 'Long wait on weekends', category: 'headsup' }] },
  { id: 'e3', initial: 'A', color: '#F5A623', name: 'Ana P.', when: 'Sep 3, 2026',
    signals: [{ label: 'Family friendly', category: 'vibe' }, { label: 'Quick service', category: 'good' }, { label: 'Delicious food', category: 'good' }] },
  { id: 'e4', initial: 'R', color: '#E24A72', name: 'Rafael T.', when: 'Aug 1, 2026', text: 'Cash only — there is an ATM next door.',
    signals: [{ label: 'Delicious food', category: 'good' }, { label: 'Cash only', category: 'headsup' }, { label: 'Lively', category: 'vibe' }] },
];

const CARD_PLACE = {
  id: 'preview-casa-verde', name: 'Casa Verde Kitchen', category: 'Restaurant', subcategory: 'Brazilian Restaurant',
  address_line1: '12 Union Square', city: 'Somerville', region: 'MA', distance: 1287, phone: '+16175550142', website: 'https://example.test/menu',
  photos: ['/preview-dinner.jpg', '/preview-bakery.jpg', '/preview-cafe.jpg'], reviewSummary: SUMMARY, evidenceStatus: 'ready' as const,
};

export default function ReviewDesignPreview() {
  const router = useRouter();
  const { theme, isDark, setThemeMode } = useThemeContext();
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const mode = router.query.theme;
    if (mode === 'light' || mode === 'dark') setThemeMode(mode);
  }, [router.query.theme, setThemeMode]);
  const matching = selected ? REVIEWS.filter(r => r.signals.some(s => s.label === selected)) : [];
  const sheet = isDark ? '#15151d' : '#ffffff';
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,1,58,0.07)';
  const link = isDark ? '#4DDDE2' : '#00666C';

  return (
    <div className="rxp-screen" style={{ background: sheet, color: theme.text }}>
      <Head>
        <title>Review design — Tavvy preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="rxp-hero">
        <img src="/preview-dinner.jpg" alt="" />
        <div className="rxp-scrim" />
        <a className="rxp-back" href="/preview" aria-label="Back">‹</a>
        <div className="rxp-theme" role="group" aria-label="Preview theme">
          <button type="button" aria-pressed={!isDark} onClick={() => setThemeMode('light')}>Light</button>
          <button type="button" aria-pressed={isDark} onClick={() => setThemeMode('dark')}>Dark</button>
        </div>
        <div className="rxp-hero-text">
          <span className="rxp-type">Restaurant · Preview</span>
          <h1>Casa Verde Kitchen</h1>
          <p>Brazilian · Somerville, MA · 0.8 mi · <span className="rxp-open">Open till 10pm</span></p>
        </div>
      </div>

      <div className="rxp-sheet" style={{ background: sheet }}>
        <section className="rxp-section" aria-label="Tavvy review summary">
          <div className="rxp-head"><h2>Reviews</h2></div>
          <PlaceReviewGrid mode="full" summary={SUMMARY} selectedTopic={selected} onSelect={(_section, topic) => setSelected(selected === topic.label ? null : topic.label)} />
          {selected && <div className="rxp-detail" style={{ borderColor: divider }}>
            <div className="rxp-head"><strong>{selected}</strong><button type="button" className="rxp-link" style={{ color: link }} onClick={() => setSelected(null)}>All experiences</button></div>
            {!matching.length && <p className="rxp-note" style={{ color: theme.textSecondary }}>No matching experiences in the recent preview. Open all reviews to explore the history.</p>}
            {matching.length > 0 && <><h3 className="rxp-sub">Recent reviews mentioning this</h3>{matching.map(r => <Reviewer key={r.id} r={r} />)}</>}
          </div>}
        </section>

        <div className="rxp-divider" style={{ background: divider }} />

        <section className="rxp-section" aria-label="Recent reviews">
          <div className="rxp-head"><h2>Recent reviews</h2><span className="rxp-count" style={{ color: theme.textSecondary }}>{REVIEWS.length} recent</span></div>
          {REVIEWS.map(r => <Reviewer key={r.id} r={r} />)}
          <button type="button" className="rxp-more" style={{ borderColor: divider, color: theme.text }}>See all reviews →</button>
        </section>

        <div className="rxp-divider" style={{ background: divider }} />

        <section className="rxp-section" aria-label="How it looks on search results">
          <div className="rxp-head"><h2>On search results</h2><span className="rxp-count" style={{ color: theme.textSecondary }}>same evidence</span></div>
          <SignalCard place={CARD_PLACE} />
        </section>
        <p className="rxp-foot" style={{ color: theme.textSecondary }}>Preview only · fictional place and reviewers · numbers computed by the live evidence rules</p>
      </div>

      <div className="rxp-actionbar" style={{ background: isDark ? 'rgba(18,18,24,.96)' : 'rgba(255,255,255,.96)', borderColor: divider }}>
        <button type="button" className="rxp-act rxp-ghost" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,1,58,0.05)', color: theme.text }}>Tavvy Menu</button>
        <button type="button" className="rxp-act rxp-primary">Add a review</button>
      </div>

      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: ${sheet}; }
        *, *::before, *::after { box-sizing: border-box; }
        .rxp-screen { max-width: 480px; margin: 0 auto; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; padding-bottom: 96px; }
        .rxp-hero { position: relative; height: 236px; }
        .rxp-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rxp-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.66) 100%); }
        .rxp-back { position: absolute; top: 16px; left: 16px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.92); color: #17013A; font-size: 24px; line-height: 38px; text-align: center; text-decoration: none; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
        .rxp-theme { position: absolute; top: 18px; right: 16px; display: flex; background: rgba(255,255,255,.92); border-radius: 20px; padding: 3px; }
        .rxp-theme button { border: 0; background: none; font: inherit; font-size: 12px; font-weight: 700; color: #17013A; padding: 6px 11px; border-radius: 16px; cursor: pointer; }
        .rxp-theme button[aria-pressed=true] { background: #17013A; color: #fff; }
        .rxp-hero-text { position: absolute; left: 20px; right: 20px; bottom: 32px; color: #fff; }
        .rxp-type { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; background: rgba(255,255,255,.22); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 20px; margin-bottom: 9px; }
        .rxp-hero-text h1 { font-size: 27px; font-weight: 800; margin: 0 0 2px; letter-spacing: -.4px; text-shadow: 0 2px 12px rgba(0,0,0,.45); }
        .rxp-hero-text p { margin: 0; font-size: 14px; color: rgba(255,255,255,.92); text-shadow: 0 1px 8px rgba(0,0,0,.45); }
        .rxp-open { color: #4ADE80; font-weight: 700; }
        .rxp-sheet { position: relative; margin-top: -22px; border-radius: 26px 26px 0 0; padding: 22px 20px 8px; box-shadow: 0 -8px 24px rgba(0,0,0,.12); }
        .rxp-section { padding: 6px 0 16px; }
        .rxp-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .rxp-head h2 { font-size: 19px; font-weight: 800; margin: 0; letter-spacing: -.2px; }
        .rxp-count { font-size: 12.5px; font-weight: 600; }
        .rxp-detail { margin-top: 10px; padding-top: 12px; border-top: 1px solid; }
        .rxp-sub { font-size: 14px; margin: 12px 0 0; }
        .rxp-note { font-size: 14px; line-height: 1.45; margin: 8px 0; }
        .rxp-link { border: 0; background: none; font: inherit; font-size: 13px; font-weight: 700; min-height: 44px; cursor: pointer; }
        .rxp-more { width: 100%; margin-top: 8px; padding: 13px 0; border-radius: 12px; border: 1px solid; background: none; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .rxp-divider { height: 1px; }
        .rxp-foot { text-align: center; font-size: 11.5px; margin: 14px 0 6px; }
        .rxp-actionbar { position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto; display: flex; gap: 12px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); backdrop-filter: blur(10px); border-top: 1px solid; z-index: 20; }
        .rxp-act { flex: 1; padding: 15px 0; border-radius: 14px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; border: 0; }
        .rxp-primary { background: #8A05BE; color: #fff; box-shadow: 0 6px 18px rgba(138,5,190,.22); }
      `}</style>
    </div>
  );
}
