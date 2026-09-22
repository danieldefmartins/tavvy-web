/**
 * PREVIEW — proposed visual design for how a Tavvy review looks.
 *
 * Unlinked design preview. It renders the SAME evidence contract the live
 * summary uses (buildPlaceEvidence → buildPlaceReviewSummary → sections), so
 * every number on screen is computed by the real rules: people not taps,
 * last 180 days, concerns marked in text, dated older reports, practical
 * details kept apart from complaints. Only the presentation is new.
 *
 * Fictional place and reviewers. Not a real business or real reviews.
 */
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import { buildPlaceEvidence, EvidenceVisit } from '../../lib/placeEvidence';
import { buildPlaceReviewSummary, compactReviewSections, reviewSections, ReviewTileKey, ReviewTopic } from '../../lib/placeReviewSummary';

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
const VERIFIED_VISITS = 14; // proposal: reviews posted after scanning the table QR

type Experience = {
  id: string; initial: string; color: string; name: string; visited: string;
  verified?: boolean; imported?: boolean; note?: string;
  signals: { label: string; category: Cat; emphasis?: number }[];
};
const EXPERIENCES: Experience[] = [
  { id: 'e1', initial: 'M', color: '#00C2CB', name: 'Marina S.', visited: daysAgo(5), verified: true,
    note: 'The picanha was perfect and they brought extra farofa without asking. Go early on Saturdays.',
    signals: [{ label: 'Delicious food', category: 'good', emphasis: 3 }, { label: 'Cozy', category: 'vibe' }, { label: 'Friendly staff', category: 'good' }] },
  { id: 'e2', initial: 'D', color: '#8A05BE', name: 'Diego R.', visited: daysAgo(11), verified: true,
    note: 'Portions are huge, but two plates came out lukewarm on a packed Friday.',
    signals: [{ label: 'Generous portions', category: 'good' }, { label: 'Food arrived cold', category: 'headsup' }, { label: 'Long wait on weekends', category: 'headsup' }] },
  { id: 'e3', initial: 'A', color: '#F5A623', name: 'Ana P.', visited: daysAgo(19),
    signals: [{ label: 'Family friendly', category: 'vibe' }, { label: 'Quick service', category: 'good' }, { label: 'Delicious food', category: 'good' }] },
  { id: 'e4', initial: 'J', color: '#6366F1', name: 'J. M.', visited: daysAgo(34), imported: true,
    signals: [{ label: 'Delicious food', category: 'good' }, { label: 'Good value', category: 'good' }, { label: 'Lively', category: 'vibe' }] },
  { id: 'e5', initial: 'R', color: '#E24A72', name: 'Rafael T.', visited: daysAgo(52),
    note: 'Cash only — there is an ATM next door.',
    signals: [{ label: 'Delicious food', category: 'good' }, { label: 'Cash only', category: 'headsup' }, { label: 'Lively', category: 'vibe' }] },
];

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------
const TONE = {
  positive: { light: '#067A80', dark: '#58D9DE', strong: '#00C2CB', tint: 'rgba(0,194,203,.12)', border: 'rgba(0,194,203,.38)' },
  neutral: { light: '#74209A', dark: '#D9B6FF', strong: '#8A05BE', tint: 'rgba(138,5,190,.10)', border: 'rgba(138,5,190,.32)' },
  concern: { light: '#885000', dark: '#FFD38A', strong: '#F5A623', tint: 'rgba(245,166,35,.14)', border: 'rgba(245,166,35,.45)' },
} as const;
const SECTION_TONE: Record<ReviewTileKey, keyof typeof TONE> = { main: 'neutral', good: 'positive', vibe: 'neutral', headsup: 'concern' };
const CAT_TONE: Record<Cat, keyof typeof TONE> = { good: 'positive', vibe: 'neutral', headsup: 'concern' };
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function ReviewDesignPreview() {
  const router = useRouter();
  const { theme, isDark, setThemeMode } = useThemeContext();
  const copy = useReleaseCopy();
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  useEffect(() => {
    const mode = router.query.theme;
    if (mode === 'light' || mode === 'dark') setThemeMode(mode);
  }, [router.query.theme, setThemeMode]);

  const sections = reviewSections(SUMMARY);
  const main = sections.find(s => s.key === 'main')!;
  const rows = sections.filter(s => s.key !== 'main');
  const people = SUMMARY.recentReviewers || 0;
  const tone = (t: keyof typeof TONE) => isDark ? TONE[t].dark : TONE[t].light;
  const shown = selected ? EXPERIENCES.filter(e => e.signals.some(s => s.label === selected)) : EXPERIENCES;
  const compact = compactReviewSections(SUMMARY);

  const pill = (topic: ReviewTopic, interactive = true) => {
    const t = TONE[topic.tone];
    const on = selected === topic.label;
    const inner = <>
      <span className="rx-pill-main">
        {topic.tone === 'concern' && <span className="rx-bang" aria-hidden="true">!</span>}
        <span className="rx-lbl">{topic.label}</span>
        <b className="rx-n">{topic.count}</b>
      </span>
      {topic.older && <small className="rx-old">{copy('Older report')} · {fmtDate(topic.lastReportedAt)}</small>}
    </>;
    const style = { background: t.tint, borderColor: on ? t.strong : t.border, color: tone(topic.tone), boxShadow: on ? `0 0 0 1.5px ${t.strong}` : 'none' };
    return interactive
      ? <button type="button" key={topic.slug || topic.label} className="rx-pill" style={style} aria-pressed={on}
          aria-label={`${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`}
          onClick={() => setSelected(on ? null : topic.label)}>{inner}</button>
      : <span key={topic.slug || topic.label} className="rx-pill rx-static" style={style}>{inner}</span>;
  };

  const cssVars = {
    '--rx-bg': theme.background, '--rx-surface': theme.surface, '--rx-text': theme.text, '--rx-text2': theme.textSecondary,
    '--rx-border': theme.border, '--rx-accent': isDark ? '#D9B6FF' : '#74209A', '--rx-hero-a': isDark ? 'rgba(138,5,190,.22)' : 'rgba(138,5,190,.07)',
    '--rx-hero-b': isDark ? 'rgba(0,194,203,.12)' : 'rgba(0,194,203,.07)',
  } as React.CSSProperties;

  return (
    <div className="rx-screen" style={cssVars}>
      <Head>
        <title>Review design — Tavvy preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="rx-hero">
        <img src="/preview-bakery.jpg" alt="" />
        <div className="rx-scrim" />
        <a className="rx-back" href="/preview" aria-label="Back">‹</a>
        <div className="rx-theme" role="group" aria-label="Preview theme">
          <button type="button" aria-pressed={!isDark} onClick={() => setThemeMode('light')}>Light</button>
          <button type="button" aria-pressed={isDark} onClick={() => setThemeMode('dark')}>Dark</button>
        </div>
        <div className="rx-hero-text">
          <span className="rx-type">Restaurant · Preview</span>
          <h1>Casa Verde Kitchen</h1>
          <p>Brazilian · Somerville, MA · 0.8 mi · <span className="rx-open">Open till 10pm</span></p>
        </div>
      </div>

      <div className="rx-sheet">
        {/* ---------------- Summary ---------------- */}
        <section className="rx-section" aria-label="Tavvy review summary">
          <div className="rx-head"><h2>Reviews</h2></div>
          <div className="rx-trust">
            <span className="rx-chip"><b>{people}</b> people · {copy('Last 6 months')}</span>
            <span className="rx-chip rx-verified"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>{VERIFIED_VISITS} verified visits</span>
          </div>
          <p className="rx-note">Signal-based reviews — people tap what was true for them. No stars, no averages.</p>

          <div className="rx-main">
            <div className="rx-main-head">
              <span className="rx-over">The main thing</span>
              <span className="rx-core">{main.title}</span>
            </div>
            <div className="rx-bars">
              {main.topics.filter(t => t.tone !== 'concern').map(t => (
                <button type="button" key={t.label} className="rx-bar" aria-pressed={selected === t.label}
                  aria-label={`${t.label}, ${t.count} ${copy('people mentioned this')}. ${copy('See experiences')}`}
                  onClick={() => setSelected(selected === t.label ? null : t.label)}>
                  <span className="rx-bar-top"><span className="rx-bar-lbl">{t.label}</span><b>{t.count}</b></span>
                  <span className="rx-track"><span className="rx-fill" style={{ width: `${Math.round((t.count / Math.max(people, 1)) * 100)}%`, background: TONE.positive.strong, opacity: selected && selected !== t.label ? .45 : 1 }} /></span>
                </button>
              ))}
            </div>
            {main.topics.some(t => t.tone === 'concern') && (
              <div className="rx-main-concern">
                {main.topics.filter(t => t.tone === 'concern').map(t => pill(t))}
                <span className="rx-concern-why">Reported alongside the praise — it counts the same way.</span>
              </div>
            )}
          </div>

          {rows.map(row => {
            const open = expanded.includes(row.key);
            const topics = open ? row.topics : row.topics.slice(0, 6);
            return (
              <div key={row.key} className="rx-row">
                <div className="rx-row-head" style={{ color: tone(SECTION_TONE[row.key]) }}>
                  <span className="rx-dot" style={{ background: TONE[SECTION_TONE[row.key]].strong }} />{copy(row.title)}
                  {row.topics.length > 0 && <span className="rx-row-n">{row.topics.length}</span>}
                </div>
                <div className="rx-pills">
                  {topics.map(t => pill(t))}
                  {!topics.length && <span className="rx-empty">{copy(row.key === 'headsup' ? 'No other recent concerns reported' : 'More recent reviews needed')}</span>}
                  {row.topics.length > 6 && <button type="button" className="rx-more" aria-expanded={open}
                    onClick={() => setExpanded(p => open ? p.filter(k => k !== row.key) : [...p, row.key])}>{copy(open ? 'Show less' : 'Show all')}</button>}
                </div>
              </div>
            );
          })}

          {EVIDENCE.practical.length > 0 && (
            <div className="rx-row rx-practical">
              <div className="rx-row-head"><span className="rx-dot rx-dot-info" />Good to know</div>
              <div className="rx-pills">
                {EVIDENCE.practical.map(p => <span key={p.label} className="rx-pill rx-static rx-info">{p.label}<b className="rx-n">{p.reports}</b></span>)}
              </div>
            </div>
          )}

          <p className="rx-legend">{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')} {copy('Choose a topic to see experiences.')}</p>
        </section>

        <div className="rx-divider" />

        {/* ---------------- Experiences ---------------- */}
        <section className="rx-section" aria-label="Recent experiences">
          <div className="rx-head">
            <h2>{selected ? 'Mentioning' : 'Recent experiences'}</h2>
            {selected
              ? <button type="button" className="rx-link" onClick={() => setSelected(null)}>{copy('All experiences')}</button>
              : <span className="rx-sub">{EXPERIENCES.length} recent</span>}
          </div>
          {selected && <div className="rx-filter">{pill({ label: selected, count: shown.length, tone: CAT_TONE[EXPERIENCES.flatMap(e => e.signals).find(s => s.label === selected)?.category || 'good'] }, false)}</div>}
          {!shown.length && <p className="rx-note">{copy('No matching experiences in the recent preview. Open all reviews to explore the history.')}</p>}
          {shown.map(e => (
            <article key={e.id} className="rx-exp">
              <div className="rx-av" style={{ background: e.color }}>{e.initial}</div>
              <div className="rx-exp-body">
                <div className="rx-exp-top">
                  <span className="rx-name">{e.name}</span>
                  <span className="rx-when">Visited {fmtShort(e.visited)}</span>
                </div>
                {(e.verified || e.imported) && (
                  <div className="rx-badges">
                    {e.verified && <span className="rx-badge rx-badge-v"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Verified visit</span>}
                    {e.imported && <span className="rx-badge rx-badge-i">From a public review</span>}
                  </div>
                )}
                <div className="rx-exp-sigs">
                  {e.signals.map((s, i) => {
                    const t = TONE[CAT_TONE[s.category]];
                    const dim = selected && selected !== s.label;
                    return <span key={i} className="rx-sig" style={{ background: t.tint, borderColor: t.border, color: tone(CAT_TONE[s.category]), opacity: dim ? .5 : 1 }}>
                      {s.category === 'headsup' && <span className="rx-bang" aria-hidden="true">!</span>}{s.label}{s.emphasis && s.emphasis > 1 && <small> ×{s.emphasis}</small>}
                    </span>;
                  })}
                </div>
                {e.note && <p className="rx-exp-note">“{e.note}”</p>}
              </div>
            </article>
          ))}
          <button type="button" className="rx-all">See all reviews →</button>
        </section>

        <div className="rx-divider" />

        {/* ---------------- Search card ---------------- */}
        <section className="rx-section" aria-label="How it looks on search results">
          <div className="rx-head"><h2>On search results</h2><span className="rx-sub">same evidence, two rows</span></div>
          <div className="rx-card">
            <div className="rx-card-top">
              <div className="rx-card-id">
                <h3>Casa Verde Kitchen</h3>
                <p>Brazilian restaurant · 0.8 mi</p>
                <p>Somerville, MA</p>
              </div>
              <img src="/preview-bakery.jpg" alt="" />
            </div>
            <div className="rx-card-rows">
              {compact.map(row => (
                <div key={row.key} className="rx-card-row">
                  <span className="rx-card-lbl" style={{ color: tone(SECTION_TONE[row.key]) }}>{row.title}</span>
                  <span className="rx-card-pills">{row.topics.map(t => pill(t, false))}</span>
                </div>
              ))}
              <span className="rx-card-meta"><b>{people}</b> people · {copy('Last 6 months')}</span>
            </div>
            <div className="rx-card-acts"><span>Directions</span><span>Call</span><span>Website</span><span className="rx-card-open">Open</span></div>
          </div>
        </section>
        <p className="rx-foot">Preview only · fictional place and reviewers · numbers computed by the live evidence rules</p>
      </div>

      <div className="rx-actionbar">
        <button type="button" className="rx-act rx-ghost">Directions</button>
        <button type="button" className="rx-act rx-primary">Add a review</button>
      </div>

      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: var(--rx-bg, #fff); }
        *, *::before, *::after { box-sizing: border-box; }
        .rx-screen { max-width: 480px; margin: 0 auto; min-height: 100vh; background: var(--rx-bg); color: var(--rx-text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; padding-bottom: 96px; }
        .rx-hero { position: relative; height: 236px; }
        .rx-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rx-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.66) 100%); }
        .rx-back { position: absolute; top: 16px; left: 16px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.92); color: #17013A; font-size: 24px; line-height: 38px; text-align: center; text-decoration: none; box-shadow: 0 2px 10px rgba(0,0,0,.18); }
        .rx-theme { position: absolute; top: 18px; right: 16px; display: flex; background: rgba(255,255,255,.92); border-radius: 20px; padding: 3px; }
        .rx-theme button { border: 0; background: none; font: inherit; font-size: 12px; font-weight: 700; color: #17013A; padding: 6px 11px; border-radius: 16px; cursor: pointer; }
        .rx-theme button[aria-pressed=true] { background: #17013A; color: #fff; }
        .rx-hero-text { position: absolute; left: 20px; right: 20px; bottom: 32px; color: #fff; }
        .rx-type { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; background: rgba(255,255,255,.22); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 20px; margin-bottom: 9px; }
        .rx-hero-text h1 { font-size: 27px; font-weight: 800; margin: 0 0 2px; letter-spacing: -.4px; text-shadow: 0 2px 12px rgba(0,0,0,.45); }
        .rx-hero-text p { margin: 0; font-size: 14px; color: rgba(255,255,255,.92); text-shadow: 0 1px 8px rgba(0,0,0,.45); }
        .rx-open { color: #4ADE80; font-weight: 700; }
        .rx-sheet { position: relative; margin-top: -22px; background: var(--rx-bg); border-radius: 26px 26px 0 0; padding: 22px 20px 8px; box-shadow: 0 -8px 24px rgba(0,0,0,.12); }
        .rx-section { padding: 6px 0 18px; }
        .rx-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .rx-head h2 { font-size: 21px; font-weight: 800; margin: 0; letter-spacing: -.3px; line-height: 1.2; }
        .rx-sub { font-size: 12.5px; font-weight: 600; color: var(--rx-text2); padding-top: 5px; }
        .rx-trust { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
        .rx-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: var(--rx-text2); background: var(--rx-surface); border: 1px solid var(--rx-border); border-radius: 20px; padding: 4px 10px; white-space: nowrap; }
        .rx-chip b { color: var(--rx-text); font-weight: 800; }
        .rx-verified { color: ${isDark ? '#58D9DE' : '#067A80'}; background: rgba(0,194,203,.12); border-color: rgba(0,194,203,.35); }
        .rx-note { font-size: 13px; line-height: 1.45; color: var(--rx-text2); margin: 0 0 14px; }
        .rx-main { border-radius: 18px; padding: 16px 16px 14px; background: linear-gradient(135deg, var(--rx-hero-a), var(--rx-hero-b)); border: 1px solid var(--rx-border); margin-bottom: 6px; }
        .rx-main-head { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
        .rx-over { font-size: 11px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; color: var(--rx-text2); }
        .rx-core { font-size: 24px; font-weight: 800; letter-spacing: -.4px; color: var(--rx-accent); line-height: 1.15; }
        .rx-bars { display: flex; flex-direction: column; gap: 9px; }
        .rx-bar { display: flex; flex-direction: column; gap: 5px; width: 100%; min-height: 44px; padding: 4px 0; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; border-radius: 8px; }
        .rx-bar[aria-pressed=true] .rx-bar-lbl { text-decoration: underline; text-decoration-color: ${TONE.positive.strong}; text-underline-offset: 3px; }
        .rx-bar-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .rx-bar-lbl { font-size: 15px; font-weight: 700; color: var(--rx-text); }
        .rx-bar-top b { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; color: ${isDark ? '#58D9DE' : '#067A80'}; }
        .rx-track { display: block; height: 7px; border-radius: 4px; background: ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(23,1,58,.07)'}; overflow: hidden; }
        .rx-fill { display: block; height: 100%; border-radius: 4px; transition: width .5s ease, opacity .2s; }
        .rx-main-concern { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--rx-border); display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .rx-concern-why { font-size: 11.5px; color: var(--rx-text2); flex-basis: 100%; }
        .rx-row { padding: 14px 0 4px; }
        .rx-row + .rx-row { border-top: 1px solid var(--rx-border); margin-top: 8px; }
        .rx-row-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; margin-bottom: 9px; color: var(--rx-text2); }
        .rx-dot { width: 8px; height: 8px; border-radius: 50%; }
        .rx-dot-info { background: ${isDark ? '#9CA3AF' : '#9CA3AF'}; }
        .rx-row-n { margin-left: 2px; font-size: 11px; font-weight: 800; color: var(--rx-text2); background: var(--rx-surface); border: 1px solid var(--rx-border); border-radius: 20px; padding: 0 7px; line-height: 17px; }
        .rx-pills { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .rx-pill { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 3px 6px; min-height: 44px; max-width: 100%; padding: 9px 13px; border: 1px solid; border-radius: 22px; font: inherit; font-size: 14px; font-weight: 650; text-align: start; cursor: pointer; transition: box-shadow .15s; }
        .rx-pill.rx-static { min-height: 0; padding: 6px 11px; font-size: 13px; cursor: default; }
        .rx-pill-main { display: inline-flex; align-items: center; gap: 6px; }
        .rx-pill .rx-n { font-weight: 800; font-variant-numeric: tabular-nums; }
        .rx-bang { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; border-radius: 50%; background: ${TONE.concern.strong}; color: #17013A; font-size: 12px; font-weight: 900; line-height: 1; flex: none; }
        .rx-old { flex-basis: 100%; padding-left: 23px; font-size: 11px; font-weight: 600; opacity: .85; }
        .rx-info { background: var(--rx-surface); border-color: var(--rx-border); color: var(--rx-text2); }
        .rx-empty { font-size: 12px; color: var(--rx-text2); padding: 6px 0; }
        .rx-more, .rx-link { border: 0; background: none; font: inherit; font-size: 13px; font-weight: 700; color: var(--rx-accent); min-height: 44px; padding: 0 4px; cursor: pointer; }
        .rx-legend { font-size: 11.5px; line-height: 1.45; color: var(--rx-text2); margin: 14px 0 0; }
        .rx-divider { height: 1px; background: var(--rx-border); }
        .rx-filter { margin: 2px 0 8px; }
        .rx-exp { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--rx-border); }
        .rx-exp:last-of-type { border-bottom: 0; }
        .rx-av { flex: none; width: 40px; height: 40px; border-radius: 50%; color: #fff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .rx-exp-body { flex: 1; min-width: 0; }
        .rx-exp-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .rx-name { font-size: 15px; font-weight: 800; }
        .rx-when { font-size: 12px; color: var(--rx-text2); flex: none; }
        .rx-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
        .rx-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 3px 8px; }
        .rx-badge-v { color: ${isDark ? '#58D9DE' : '#067A80'}; background: rgba(0,194,203,.12); border: 1px solid rgba(0,194,203,.35); }
        .rx-badge-i { color: var(--rx-text2); background: var(--rx-surface); border: 1px solid var(--rx-border); }
        .rx-exp-sigs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .rx-sig { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; padding: 5px 10px; border-radius: 20px; border: 1px solid; }
        .rx-sig small { font-size: 11px; opacity: .8; }
        .rx-exp-note { font-size: 13.5px; line-height: 1.5; color: var(--rx-text2); margin: 8px 0 0; }
        .rx-all { width: 100%; margin-top: 10px; padding: 13px 0; border-radius: 12px; border: 1px solid var(--rx-border); background: var(--rx-surface); color: var(--rx-text); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .rx-card { border: 1px solid var(--rx-border); border-radius: 16px; background: var(--rx-surface); overflow: hidden; }
        .rx-card-top { display: flex; gap: 12px; padding: 12px 12px 8px; }
        .rx-card-id { flex: 1; min-width: 0; }
        .rx-card-id h3 { margin: 0 0 3px; font-size: 16px; font-weight: 800; }
        .rx-card-id p { margin: 0; font-size: 12.5px; color: var(--rx-text2); line-height: 1.4; }
        .rx-card-top img { width: 96px; height: 96px; border-radius: 12px; object-fit: cover; flex: none; }
        .rx-card-rows { padding: 0 12px 10px; display: flex; flex-direction: column; gap: 6px; }
        .rx-card-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rx-card-lbl { font-size: 12px; font-weight: 800; flex: none; }
        .rx-card-pills { display: inline-flex; flex-wrap: wrap; gap: 6px; }
        .rx-card-meta { font-size: 11.5px; color: var(--rx-text2); margin-top: 2px; }
        .rx-card-meta b { color: var(--rx-text); }
        .rx-card-acts { display: flex; gap: 6px; padding: 10px 12px 12px; border-top: 1px solid var(--rx-border); }
        .rx-card-acts span { flex: 1; text-align: center; font-size: 13px; font-weight: 700; padding: 9px 0; border-radius: 10px; background: var(--rx-bg); border: 1px solid var(--rx-border); }
        .rx-card-open { background: #8A05BE !important; color: #fff; border-color: #8A05BE !important; }
        .rx-foot { text-align: center; font-size: 11.5px; color: var(--rx-text2); margin: 18px 0 6px; }
        .rx-actionbar { position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto; display: flex; gap: 12px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: ${isDark ? 'rgba(18,18,24,.96)' : 'rgba(255,255,255,.96)'}; backdrop-filter: blur(10px); border-top: 1px solid var(--rx-border); }
        .rx-act { flex: 1; padding: 15px 0; border-radius: 14px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; border: 0; }
        .rx-ghost { background: var(--rx-surface); color: var(--rx-text); border: 1px solid var(--rx-border); }
        .rx-primary { background: #8A05BE; color: #fff; box-shadow: 0 6px 18px rgba(138,5,190,.35); }
        button:focus-visible, a:focus-visible { outline: 3px solid var(--rx-accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
