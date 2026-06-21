/**
 * PREVIEW ONLY — full-screen design proposal. Not linked anywhere in the app.
 * Proposed "Signal Spectrum": a symmetrical top-4 grid of the strongest signals,
 * tappable to expand a dropdown with the full signal list (grouped by category).
 * Built from the REAL SignalPill / SignalDetailRow components. Delete after the
 * design decision is made.
 */
import React, { useState } from 'react';
import Head from 'next/head';
import { SignalDetailRow, SignalCategory } from '../../components/SignalPill';

type Sig = { label: string; tapCount: number; category: SignalCategory; emoji?: string };

// Readable tile colors: dark text on a light tint of the brand accent (the old
// dark-mode pills put light text on a faint tint → washed out on a white screen).
const TILE: Record<SignalCategory, { bg: string; border: string; count: string }> = {
  good:    { bg: 'rgba(0, 194, 203, 0.12)', border: 'rgba(0, 194, 203, 0.32)', count: '#00858C' },
  vibe:    { bg: 'rgba(138, 5, 190, 0.10)', border: 'rgba(138, 5, 190, 0.28)', count: '#7A05A8' },
  headsup: { bg: 'rgba(245, 166, 35, 0.16)', border: 'rgba(245, 166, 35, 0.40)', count: '#A85D00' },
};

function SignalTile({ s, onClick }: { s: Sig; onClick?: () => void }) {
  const c = TILE[s.category];
  return (
    <button className="tile" onClick={onClick} style={{ background: c.bg, borderColor: c.border }}>
      <span className="tile-emoji">{s.emoji}</span>
      <span className="tile-label">{s.label}</span>
      <span className="tile-count" style={{ color: c.count }}>×{s.tapCount}</span>
      <style jsx>{`
        .tile {
          display: flex; align-items: center; gap: 9px; width: 100%; min-width: 0;
          min-height: 62px; padding: 12px 14px; border-radius: 16px;
          border: 1px solid; cursor: pointer; text-align: left;
          font-family: inherit; transition: transform 0.15s ease, filter 0.15s ease;
        }
        .tile:active { transform: scale(0.98); }
        .tile-emoji { font-size: 19px; flex: none; line-height: 1; }
        .tile-label {
          flex: 1; min-width: 0; font-size: 14px; font-weight: 700;
          color: #17013A; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .tile-count { font-size: 13px; font-weight: 800; flex: none; }
      `}</style>
    </button>
  );
}

// Top 4 — the symmetrical at-a-glance row (2 Good · 1 Vibe · 1 Heads Up)
const TOP: Sig[] = [
  { label: 'Amazing Pastries', tapCount: 142, category: 'good', emoji: '🥐' },
  { label: 'Great Coffee', tapCount: 98, category: 'good', emoji: '☕' },
  { label: 'Cozy', tapCount: 76, category: 'vibe', emoji: '🛋️' },
  { label: 'Long Wait', tapCount: 45, category: 'headsup', emoji: '⏳' },
];

// The full list revealed in the dropdown, grouped by category
const GROUPS: { key: SignalCategory; title: string; items: Sig[] }[] = [
  {
    key: 'good', title: 'The Good', items: [
      { label: 'Amazing Pastries', tapCount: 142, category: 'good', emoji: '🥐' },
      { label: 'Great Coffee', tapCount: 98, category: 'good', emoji: '☕' },
      { label: 'Fresh Ingredients', tapCount: 64, category: 'good', emoji: '🥗' },
      { label: 'Friendly Staff', tapCount: 52, category: 'good', emoji: '😊' },
      { label: 'Good Wifi', tapCount: 31, category: 'good', emoji: '📶' },
    ],
  },
  {
    key: 'vibe', title: 'The Vibe', items: [
      { label: 'Cozy', tapCount: 76, category: 'vibe', emoji: '🛋️' },
      { label: 'Instagrammable', tapCount: 58, category: 'vibe', emoji: '📸' },
      { label: 'Good for Work', tapCount: 40, category: 'vibe', emoji: '💻' },
    ],
  },
  {
    key: 'headsup', title: 'Heads Up', items: [
      { label: 'Long Wait', tapCount: 45, category: 'headsup', emoji: '⏳' },
      { label: 'Cash Only', tapCount: 22, category: 'headsup', emoji: '💵' },
      { label: 'Cramped', tapCount: 14, category: 'headsup', emoji: '🪑' },
    ],
  },
];

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);
const PHOTO = '/preview-bakery.jpg';

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
            <p className="meta">Bakery · Boston, MA · 0.4 mi · Open till 8pm</p>
          </div>
        </div>

        <div className="sheet">
          <div className="section">
            <div className="section-head">
              <span className="section-title">Signal Spectrum</span>
              <span className="section-sub">361 taps</span>
            </div>

            {/* Symmetrical top-4 grid — equal-height tiles that fit the full label on 2 lines */}
            <div className="grid">
              {TOP.map((s, i) => (
                <SignalTile key={i} s={s} onClick={() => setOpen(o => !o)} />
              ))}
            </div>

            {/* Expand toggle */}
            <button className="more" onClick={() => setOpen(o => !o)}>
              {open ? 'Hide signals' : `See all ${TOTAL} signals`}
              <span className={`chev ${open ? 'up' : ''}`}>⌄</span>
            </button>

            {/* Dropdown: full signal list, grouped */}
            {open && (
              <div className="dropdown">
                {GROUPS.map((g) => {
                  const max = Math.max(...g.items.map(i => i.tapCount));
                  return (
                    <div className="group" key={g.key}>
                      <div className={`group-title ${g.key}`}>{g.title}</div>
                      {g.items.map((s, i) => (
                        <SignalDetailRow
                          key={i}
                          label={s.label}
                          tapCount={s.tapCount}
                          category={s.category}
                          emoji={s.emoji}
                          maxTapCount={max}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="section">
            <span className="section-title">About</span>
            <p className="about">All-day café and bakery known for shakshuka, flaky pastries and a sunlit room. A local favorite for slow weekend mornings.</p>
          </div>
        </div>

        <div className="actionbar">
          <button className="act ghost">Directions</button>
          <button className="act primary">Add a Signal</button>
        </div>
      </div>

      <style jsx>{`
        .screen {
          max-width: 480px; margin: 0 auto; min-height: 100vh; background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative; padding-bottom: 92px;
        }
        .hero { position: relative; width: 100%; height: 42vh; min-height: 280px; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%); }
        .icon-btn {
          position: absolute; top: 18px; width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255,255,255,0.92); font-size: 22px; line-height: 1;
          color: #17013A; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center;
        }
        .back { left: 16px; } .save { right: 16px; font-size: 19px; }
        .hero-text { position: absolute; left: 20px; right: 20px; bottom: 18px; }
        .name { color: #fff; font-size: 28px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.4); }
        .meta { color: rgba(255,255,255,0.92); font-size: 14px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.4); }
        .sheet { position: relative; margin-top: -22px; background: #fff; border-radius: 26px 26px 0 0; padding: 26px 20px 8px; box-shadow: 0 -8px 24px rgba(23,1,58,0.06); }
        .section { padding: 6px 0 18px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-size: 18px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .section-sub { font-size: 13px; font-weight: 700; color: #00C2CB; }

        /* symmetrical 2-column grid, equal-width pills */
        .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; align-items: stretch; }

        .more {
          width: 100%; margin-top: 14px; padding: 12px 0; border-radius: 12px;
          border: 1px solid rgba(23,1,58,0.10); background: rgba(23,1,58,0.02);
          color: #17013A; font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .chev { transition: transform 0.2s ease; font-size: 16px; }
        .chev.up { transform: rotate(180deg); }

        .dropdown { margin-top: 16px; animation: drop 0.18s ease; }
        @keyframes drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .group { margin-bottom: 18px; }
        .group-title { font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 12px; }
        .group-title.good { color: #00C2CB; }
        .group-title.vibe { color: #8A05BE; }
        .group-title.headsup { color: #F5A623; }

        .divider { height: 1px; background: rgba(23,1,58,0.07); margin: 2px 0; }
        .about { font-size: 14.5px; line-height: 1.6; color: #4a475c; margin: 8px 0 0; }
        .actionbar {
          position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto;
          display: flex; gap: 12px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
          background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); border-top: 1px solid rgba(23,1,58,0.07);
        }
        .act { flex: 1; padding: 15px 0; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
        .act.ghost { background: rgba(23,1,58,0.06); color: #17013A; }
        .act.primary { background: #00C2CB; color: #fff; box-shadow: 0 6px 18px rgba(0,194,203,0.35); }
      `}</style>

      {/* global so it can reach into the SignalPill button DOM for equal widths */}
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: #fff; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
    </>
  );
}
