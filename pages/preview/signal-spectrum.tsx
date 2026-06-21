/**
 * PREVIEW ONLY — full-screen design proposal for the "Signal Spectrum" place screen.
 * Not linked in the app. One consistent, readable light-theme signal system:
 *  - top 2×2 tiles (the strongest signals, full label on 2 lines)
 *  - a legend so the colour code (Good / Vibe / Heads Up) is learnable
 *  - tap to expand a grouped, readable dropdown with consensus bars
 * Delete after the design decision is made.
 */
import React, { useState } from 'react';
import Head from 'next/head';

type Cat = 'good' | 'vibe' | 'headsup';
type Sig = { label: string; tapCount: number; category: Cat; emoji: string };

// One palette, all readable on a white screen:
//  accent  -> text/count/headers (dark enough for contrast)
//  strong  -> dots & consensus-bar fills (full brand colour)
//  tint/bd -> tile background / border
const CAT: Record<Cat, { name: string; accent: string; strong: string; tint: string; border: string }> = {
  good:    { name: 'The Good', accent: '#067A80', strong: '#00C2CB', tint: 'rgba(0,194,203,0.12)',  border: 'rgba(0,194,203,0.34)' },
  vibe:    { name: 'The Vibe', accent: '#7A05A8', strong: '#8A05BE', tint: 'rgba(138,5,190,0.10)',  border: 'rgba(138,5,190,0.28)' },
  headsup: { name: 'Heads Up', accent: '#9A5600', strong: '#F5A623', tint: 'rgba(245,166,35,0.16)', border: 'rgba(245,166,35,0.42)' },
};

const GROUPS: { key: Cat; items: Sig[] }[] = [
  { key: 'good', items: [
    { label: 'Amazing Pastries', tapCount: 142, category: 'good', emoji: '🥐' },
    { label: 'Great Coffee', tapCount: 98, category: 'good', emoji: '☕' },
    { label: 'Fresh Ingredients', tapCount: 64, category: 'good', emoji: '🥗' },
    { label: 'Friendly Staff', tapCount: 52, category: 'good', emoji: '😊' },
    { label: 'Good Wifi', tapCount: 31, category: 'good', emoji: '📶' },
  ]},
  { key: 'vibe', items: [
    { label: 'Cozy', tapCount: 76, category: 'vibe', emoji: '🛋️' },
    { label: 'Instagrammable', tapCount: 58, category: 'vibe', emoji: '📸' },
    { label: 'Good for Work', tapCount: 40, category: 'vibe', emoji: '💻' },
  ]},
  { key: 'headsup', items: [
    { label: 'Long Wait', tapCount: 45, category: 'headsup', emoji: '⏳' },
    { label: 'Cash Only', tapCount: 22, category: 'headsup', emoji: '💵' },
    { label: 'Cramped', tapCount: 14, category: 'headsup', emoji: '🪑' },
  ]},
];

const ALL = GROUPS.flatMap(g => g.items);
const TOTAL_TAPS = ALL.reduce((n, s) => n + s.tapCount, 0);
// the at-a-glance top row: 2 strongest Good + strongest Vibe + strongest Heads Up
const TOP: Sig[] = [GROUPS[0].items[0], GROUPS[0].items[1], GROUPS[1].items[0], GROUPS[2].items[0]];
const PHOTO = '/preview-bakery.jpg';

// "Tavvy Places" editorial description — shown for places that are popular with reviews
const TAVVY_PLACES = `A beloved all-day café where the pastry case does the talking — flaky croissants, shakshuka and seasonal tarts in a sunlit, plant-filled room. Reviewers keep coming back for the coffee and the cozy work-friendly vibe; just expect a line at peak hours.`;
const POPULAR_FOR = ['Pastries', 'Coffee', 'Working', 'Brunch'];

// A Tavvy "review" = the signals a person tapped (NO written text — signals ARE the review)
type Review = { initial: string; color: string; name: string; when: string; signals: { label: string; category: Cat }[] };
const REVIEWS: Review[] = [
  { initial: 'M', color: '#00C2CB', name: 'Maya R.', when: '2 days ago',
    signals: [{ label: 'Amazing Pastries', category: 'good' }, { label: 'Cozy', category: 'vibe' }, { label: 'Long Wait', category: 'headsup' }] },
  { initial: 'J', color: '#8A05BE', name: 'Jordan K.', when: '1 week ago',
    signals: [{ label: 'Good for Work', category: 'vibe' }, { label: 'Great Coffee', category: 'good' }, { label: 'Good Wifi', category: 'good' }] },
  { initial: 'P', color: '#F5A623', name: 'Priya S.', when: '2 weeks ago',
    signals: [{ label: 'Fresh Ingredients', category: 'good' }, { label: 'Cash Only', category: 'headsup' }] },
];

function Tile({ s, onClick }: { s: Sig; onClick?: () => void }) {
  const c = CAT[s.category];
  return (
    <button className="tile" onClick={onClick} style={{ background: c.tint, borderColor: c.border }}>
      <span className="t-cat" style={{ color: c.accent }}>
        <span className="t-dot" style={{ background: c.strong }} />{c.name}
      </span>
      <span className="t-row">
        <span className="t-emoji">{s.emoji}</span>
        <span className="t-label">{s.label}</span>
      </span>
      <span className="t-count" style={{ color: c.accent }}>{s.tapCount} taps</span>
      <style jsx>{`
        .tile {
          display: flex; flex-direction: column; gap: 4px; width: 100%; min-width: 0;
          min-height: 96px; padding: 12px 13px; border-radius: 16px; border: 1px solid;
          cursor: pointer; text-align: left; font-family: inherit;
          transition: transform 0.12s ease; align-items: stretch;
        }
        .tile:active { transform: scale(0.98); }
        .t-cat { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .t-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
        .t-row { display: flex; align-items: flex-start; gap: 8px; flex: 1; }
        .t-emoji { font-size: 18px; line-height: 1.2; flex: none; }
        .t-label { font-size: 15px; font-weight: 700; color: #17013A; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .t-count { font-size: 12px; font-weight: 700; opacity: 0.85; }
      `}</style>
    </button>
  );
}

function Row({ s, max }: { s: Sig; max: number }) {
  const c = CAT[s.category];
  const pct = Math.max(8, Math.round((s.tapCount / max) * 100));
  return (
    <div className="row">
      <span className="r-emoji">{s.emoji}</span>
      <span className="r-label">{s.label}</span>
      <span className="r-bar"><span className="r-fill" style={{ width: `${pct}%`, background: c.strong }} /></span>
      <span className="r-count">{s.tapCount}</span>
      <style jsx>{`
        .row { display: flex; align-items: center; gap: 11px; padding: 9px 0; }
        .r-emoji { font-size: 16px; flex: none; width: 20px; text-align: center; }
        .r-label { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 600; color: #2A2440;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-bar { flex: none; width: 84px; height: 7px; border-radius: 4px; background: rgba(23,1,58,0.08); overflow: hidden; }
        .r-fill { display: block; height: 100%; border-radius: 4px; }
        .r-count { flex: none; width: 30px; text-align: right; font-size: 13px; font-weight: 800; color: #17013A; }
      `}</style>
    </div>
  );
}

function Reviewer({ r }: { r: Review }) {
  return (
    <div className="rv">
      <div className="rv-av" style={{ background: r.color }}>{r.initial}</div>
      <div className="rv-body">
        <div className="rv-top"><span className="rv-name">{r.name}</span><span className="rv-when">{r.when}</span></div>
        <div className="rv-sigs">
          {r.signals.map((s, i) => {
            const c = CAT[s.category];
            return <span className="rv-chip" key={i} style={{ background: c.tint, color: c.accent, borderColor: c.border }}>{s.label}</span>;
          })}
        </div>
      </div>
      <style jsx>{`
        .rv { display: flex; gap: 12px; padding: 14px 0; }
        .rv-av { flex: none; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
        .rv-body { flex: 1; min-width: 0; }
        .rv-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .rv-name { font-size: 14.5px; font-weight: 800; color: #17013A; }
        .rv-when { font-size: 12px; color: #9a97a6; flex: none; }
        .rv-sigs { display: flex; flex-wrap: wrap; gap: 6px; margin: 7px 0 0; }
        .rv-chip { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid; }
        .rv-note { font-size: 14px; line-height: 1.5; color: #4a475c; margin: 9px 0 0; }
      `}</style>
    </div>
  );
}

export default function SignalSpectrumPreview() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Signal Spectrum — preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="screen">
        <div className="hero">
          <img src={PHOTO} alt="Tatte Bakery & Café" className="hero-img" />
          <div className="hero-scrim" />
          <button className="icon-btn back" aria-label="Back">‹</button>
          <button className="icon-btn save" aria-label="Save">♡</button>
          <div className="hero-text">
            <h1 className="name">Tatte Bakery &amp; Café</h1>
            <p className="meta">Bakery · Boston, MA · 0.4 mi · <span className="open">Open till 8pm</span></p>
          </div>
        </div>

        <div className="sheet">
          <div className="section">
            <div className="section-head">
              <span className="section-title">Reviews</span>
              <span className="section-sub">{TOTAL_TAPS} signals · 142 people</span>
            </div>
            <p className="review-note">Signal-based reviews — tap what's true, no fake stars. <span className="learn">How it works</span></p>

            {/* legend — teaches the colour code */}
            <div className="legend">
              {(['good', 'vibe', 'headsup'] as Cat[]).map(k => (
                <span className="leg" key={k}>
                  <span className="leg-dot" style={{ background: CAT[k].strong }} />
                  <span style={{ color: CAT[k].accent }}>{CAT[k].name}</span>
                </span>
              ))}
            </div>

            {/* top 4 — symmetrical, readable, full labels */}
            <div className="grid">
              {TOP.map((s, i) => <Tile key={i} s={s} onClick={() => setOpen(o => !o)} />)}
            </div>

            <button className="more" onClick={() => setOpen(o => !o)}>
              {open ? 'Hide signals' : `See all ${ALL.length} signals`}
              <span className={`chev ${open ? 'up' : ''}`}>⌄</span>
            </button>

            {open && (
              <div className="dropdown">
                {GROUPS.map(g => {
                  const c = CAT[g.key];
                  const max = Math.max(...g.items.map(i => i.tapCount));
                  return (
                    <div className="group" key={g.key}>
                      <div className="group-head" style={{ color: c.accent }}>
                        <span className="group-dot" style={{ background: c.strong }} />{c.name}
                        <span className="group-n">{g.items.length}</span>
                      </div>
                      {g.items.map((s, i) => <Row key={i} s={s} max={max} />)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Tavvy Places — editorial description for places popular with reviews */}
          <div className="section">
            <div className="tp-head">
              <span className="tp-badge">✦ Tavvy Places</span>
            </div>
            <p className="about">{TAVVY_PLACES}</p>
            <div className="tags">
              <span className="tags-label">Popular for</span>
              {POPULAR_FOR.map((t, i) => <span className="tag" key={i}>{t}</span>)}
            </div>
          </div>

          <div className="divider" />

          {/* Recent reviews — reviewer activity */}
          <div className="section">
            <div className="section-head">
              <span className="section-title">Recent reviews</span>
              <span className="section-sub">142 total</span>
            </div>
            {REVIEWS.map((r, i) => <Reviewer key={i} r={r} />)}
            <button className="more" style={{ marginTop: 6 }}>Read all 142 reviews</button>
          </div>
        </div>

        <div className="actionbar">
          <button className="act ghost">Directions</button>
          <button className="act primary">Add Review</button>
        </div>
      </div>

      <style jsx>{`
        .screen { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; padding-bottom: 92px; }
        .hero { position: relative; width: 100%; height: 40vh; min-height: 270px; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.58) 100%); }
        .icon-btn { position: absolute; top: 18px; width: 40px; height: 40px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.92); font-size: 22px; line-height: 1; color: #17013A; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; }
        .back { left: 16px; } .save { right: 16px; font-size: 19px; }
        .hero-text { position: absolute; left: 20px; right: 20px; bottom: 18px; }
        .name { color: #fff; font-size: 27px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.45); }
        .meta { color: rgba(255,255,255,0.92); font-size: 14px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.45); }
        .open { color: #4ADE80; font-weight: 700; }

        .sheet { position: relative; margin-top: -22px; background: #fff; border-radius: 26px 26px 0 0; padding: 24px 20px 8px; box-shadow: 0 -8px 24px rgba(23,1,58,0.06); }
        .section { padding: 4px 0 18px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
        .section-title { font-size: 19px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .section-sub { font-size: 12.5px; font-weight: 600; color: #8b8898; }

        .review-note { font-size: 12.5px; color: #8b8898; margin: 0 0 14px; line-height: 1.4; }
        .learn { color: #00858C; font-weight: 700; }

        .tp-head { margin-bottom: 10px; }
        .tp-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800;
          color: #00858C; background: rgba(0,194,203,0.10); border: 1px solid rgba(0,194,203,0.28);
          padding: 5px 12px; border-radius: 20px; letter-spacing: 0.2px; }
        .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
        .tags-label { font-size: 12px; font-weight: 700; color: #9a97a6; margin-right: 2px; }
        .tag { font-size: 13px; font-weight: 700; color: #2A2440; background: rgba(23,1,58,0.05);
          padding: 6px 12px; border-radius: 20px; }

        .legend { display: flex; gap: 16px; margin-bottom: 14px; }
        .leg { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; }
        .leg-dot { width: 8px; height: 8px; border-radius: 50%; }

        .grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }

        .more { width: 100%; margin-top: 14px; padding: 13px 0; border-radius: 12px;
          border: 1px solid rgba(23,1,58,0.12); background: rgba(23,1,58,0.025); color: #17013A;
          font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .chev { transition: transform 0.2s ease; font-size: 16px; }
        .chev.up { transform: rotate(180deg); }

        .dropdown { margin-top: 14px; animation: drop 0.18s ease; }
        @keyframes drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .group { padding: 6px 0 4px; }
        .group + .group { border-top: 1px solid rgba(23,1,58,0.06); margin-top: 8px; padding-top: 14px; }
        .group-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 6px; }
        .group-dot { width: 8px; height: 8px; border-radius: 50%; }
        .group-n { margin-left: 6px; font-size: 11px; font-weight: 800; color: #b3b0bd; background: rgba(23,1,58,0.05); border-radius: 20px; padding: 1px 7px; }

        .divider { height: 1px; background: rgba(23,1,58,0.07); margin: 2px 0; }
        .about { font-size: 14.5px; line-height: 1.6; color: #4a475c; margin: 8px 0 0; }
        .actionbar { position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto; display: flex; gap: 12px;
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: rgba(255,255,255,0.96);
          backdrop-filter: blur(10px); border-top: 1px solid rgba(23,1,58,0.07); }
        .act { flex: 1; padding: 15px 0; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
        .act.ghost { background: rgba(23,1,58,0.06); color: #17013A; }
        .act.primary { background: #00C2CB; color: #fff; box-shadow: 0 6px 18px rgba(0,194,203,0.35); }
      `}</style>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: #fff; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
    </>
  );
}
