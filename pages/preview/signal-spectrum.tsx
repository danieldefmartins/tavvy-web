/**
 * PREVIEW ONLY — full-screen "Reviews" place screen proposal. Not linked in app.
 * Layout: hero → quick actions + socials → Reviews (signals) → Tavvy Places →
 * Info → Connect → Recent reviews. Built to be the most complete place hub.
 * Delete after the design decision is made.
 */
import React, { useState } from 'react';
import Head from 'next/head';

type Cat = 'good' | 'vibe' | 'headsup';
type Sig = { label: string; tapCount: number; category: Cat; emoji: string };

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
const TOP: Sig[] = [GROUPS[0].items[0], GROUPS[0].items[1], GROUPS[1].items[0], GROUPS[2].items[0]];
const PHOTO = '/preview-bakery.jpg';

const TAVVY_PLACES = `A beloved all-day café where the pastry case does the talking — flaky croissants, shakshuka and seasonal tarts in a sunlit, plant-filled room. Reviewers keep coming back for the coffee and the cozy work-friendly vibe; just expect a line at peak hours.`;
const POPULAR_FOR = ['Pastries', 'Coffee', 'Working', 'Brunch'];

const PLACE = { address: '399 Boylston St, Boston, MA 02116', price: '$$' };
const HOURS: [string, string][] = [
  ['Mon – Fri', '7:00 AM – 8:00 PM'],
  ['Saturday', '8:00 AM – 8:00 PM'],
  ['Sunday', '8:00 AM – 6:00 PM'],
];

// quick-action icons on top of reviews
const ACTIONS = [
  { key: 'phone', label: 'Call' },
  { key: 'website', label: 'Website' },
  { key: 'menu', label: 'Menu' },
  { key: 'share', label: 'Share' },
  { key: 'order', label: 'Order' },
];
const SOCIALS = [
  { key: 'instagram', bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf)', label: 'Instagram', value: '@tattebakery' },
  { key: 'tiktok', bg: '#000000', label: 'TikTok', value: '@tatte' },
  { key: 'youtube', bg: '#FF0000', label: 'YouTube', value: 'Tatte Bakery' },
];
// the full directory (Tavvy shows everything)
const LINKS: { key: string; bg: string; label: string; value: string }[] = [
  { key: 'phone',     bg: '#0E7C86', label: 'Call',      value: '(617) 555-0192' },
  { key: 'whatsapp',  bg: '#25D366', label: 'WhatsApp',  value: 'Message us' },
  { key: 'website',   bg: '#00C2CB', label: 'Website',   value: 'tattebakery.com' },
  { key: 'instagram', bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf)', label: 'Instagram', value: '@tattebakery · 248k' },
  { key: 'tiktok',    bg: '#000000', label: 'TikTok',    value: '@tatte · 92k' },
  { key: 'youtube',   bg: '#FF0000', label: 'YouTube',   value: 'Tatte Bakery' },
  { key: 'facebook',  bg: '#1877F2', label: 'Facebook',  value: 'Tatte Bakery & Café' },
];

type Review = { initial: string; color: string; name: string; when: string; signals: { label: string; category: Cat }[] };
const REVIEWS: Review[] = [
  { initial: 'M', color: '#00C2CB', name: 'Maya R.', when: '2 days ago',
    signals: [{ label: 'Amazing Pastries', category: 'good' }, { label: 'Cozy', category: 'vibe' }, { label: 'Long Wait', category: 'headsup' }] },
  { initial: 'J', color: '#8A05BE', name: 'Jordan K.', when: '1 week ago',
    signals: [{ label: 'Good for Work', category: 'vibe' }, { label: 'Great Coffee', category: 'good' }, { label: 'Good Wifi', category: 'good' }] },
  { initial: 'P', color: '#F5A623', name: 'Priya S.', when: '2 weeks ago',
    signals: [{ label: 'Fresh Ingredients', category: 'good' }, { label: 'Cash Only', category: 'headsup' }] },
];

function Glyph({ name, color = '#fff' }: { name: string; color?: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'phone':
    case 'whatsapp':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6.5 10.8c1.4 2.8 3.9 5.3 6.7 6.7l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.5 21 3 12.5 3 2 3 1.4 3.4 1 4 1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2.4 2.3z" fill={color} /></svg>;
    case 'website':
      return <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" {...s} /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" {...s} /></svg>;
    case 'menu':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 3v8M5 3v3a2 2 0 0 0 4 0V3M7 11v10M16 3c-1.4 0-2 2.5-2 5s.7 3.5 2 3.7V21" {...s} /></svg>;
    case 'share':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 15V4M12 4l-3.3 3.3M12 4l3.3 3.3M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...s} /></svg>;
    case 'order':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8zM9 8V6.5a3 3 0 0 1 6 0V8" {...s} /></svg>;
    case 'instagram':
      return <svg viewBox="0 0 24 24" width="18" height="18"><rect x="3.5" y="3.5" width="17" height="17" rx="5" {...s} /><circle cx="12" cy="12" r="4" {...s} /><circle cx="17.2" cy="6.8" r="1.1" fill={color} /></svg>;
    case 'tiktok':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M14 3c.3 2 1.7 3.6 3.8 3.9V10c-1.5 0-2.8-.4-3.8-1.1v5.8a4.7 4.7 0 1 1-4.7-4.7c.3 0 .5 0 .8.1v3.1a1.7 1.7 0 1 0 1.2 1.6V3H14z" fill={color} /></svg>;
    case 'youtube':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill={color} /></svg>;
    case 'facebook':
      return <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.4V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.6V14h2.3v7h2.6z" fill={color} /></svg>;
    default:
      return null;
  }
}

function Tile({ s, onClick }: { s: Sig; onClick?: () => void }) {
  const c = CAT[s.category];
  return (
    <button className="tile" onClick={onClick} style={{ background: c.tint, borderColor: c.border }}>
      <span className="t-row">
        <span className="t-emoji">{s.emoji}</span>
        <span className="t-label">{s.label}</span>
      </span>
      <span className="t-count" style={{ color: c.accent }}>{s.tapCount} taps</span>
      <style jsx>{`
        .tile { display: flex; flex-direction: column; justify-content: space-between; gap: 10px; width: 100%; min-width: 0;
          min-height: 76px; padding: 13px; border-radius: 16px; border: 1px solid; cursor: pointer; text-align: left;
          font-family: inherit; transition: transform 0.12s ease; }
        .tile:active { transform: scale(0.98); }
        .t-row { display: flex; align-items: flex-start; gap: 8px; }
        .t-emoji { font-size: 18px; flex: none; line-height: 1.2; }
        .t-label { font-size: 15px; font-weight: 700; color: #17013A; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .t-count { font-size: 12.5px; font-weight: 700; }
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
        .r-label { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 600; color: #2A2440; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-bar { flex: none; width: 84px; height: 7px; border-radius: 4px; background: rgba(23,1,58,0.08); overflow: hidden; }
        .r-fill { display: block; height: 100%; border-radius: 4px; }
        .r-count { flex: none; width: 30px; text-align: right; font-size: 13px; font-weight: 800; color: #17013A; }
      `}</style>
    </div>
  );
}

function LinkRow({ l }: { l: typeof LINKS[number] }) {
  return (
    <button className="lk">
      <span className="lk-ic" style={{ background: l.bg }}><Glyph name={l.key} /></span>
      <span className="lk-mid"><span className="lk-label">{l.label}</span><span className="lk-val">{l.value}</span></span>
      <span className="lk-chev">›</span>
      <style jsx>{`
        .lk { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 0; background: none; border: none; cursor: pointer; text-align: left; }
        .lk-ic { flex: none; width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; }
        .lk-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .lk-label { font-size: 14.5px; font-weight: 800; color: #17013A; }
        .lk-val { font-size: 13px; color: #8b8898; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lk-chev { flex: none; font-size: 22px; color: #c7c4d0; font-weight: 400; }
      `}</style>
    </button>
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
      `}</style>
    </div>
  );
}

export default function SignalSpectrumPreview() {
  const [open, setOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

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
          {/* quick actions + socials, on top of the reviews */}
          <div className="quickbar">
            <div className="qa-row">
              {ACTIONS.map(a => (
                <button className="qa" key={a.key}>
                  <span className="qa-ic"><Glyph name={a.key} color="#17013A" /></span>
                  <span className="qa-lbl">{a.label}</span>
                </button>
              ))}
            </div>
            <div className="so-row">
              {SOCIALS.map(s => (
                <button className="so" key={s.key}>
                  <span className="so-ic" style={{ background: s.bg }}><Glyph name={s.key} /></span>
                  <span className="so-mid"><span className="so-lbl">{s.label}</span><span className="so-val">{s.value}</span></span>
                </button>
              ))}
            </div>
          </div>

          {/* Reviews (signals) */}
          <div className="section">
            <div className="section-head">
              <span className="section-title">Reviews</span>
              <span className="section-sub">{TOTAL_TAPS} signals · 142 people</span>
            </div>
            <p className="review-note">Signal-based reviews — tap what's true, no fake stars. <span className="learn">How it works</span></p>

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

          {/* Tavvy Places */}
          <div className="section">
            <div className="tp-head"><span className="tp-badge">✦ Tavvy Places</span></div>
            <p className="about">{TAVVY_PLACES}</p>
            <div className="tags">
              <span className="tags-label">Popular for</span>
              {POPULAR_FOR.map((t, i) => <span className="tag" key={i}>{t}</span>)}
            </div>
          </div>

          <div className="divider" />

          {/* Info */}
          <div className="section">
            <span className="section-title">Info</span>
            <div className="info">
              <button className="info-row">
                <span className="info-ic">📍</span>
                <span className="info-mid"><span className="info-main">{PLACE.address}</span></span>
                <span className="info-act">Directions</span>
              </button>
              <button className="info-row" onClick={() => setHoursOpen(o => !o)}>
                <span className="info-ic">🕐</span>
                <span className="info-mid">
                  <span className="info-main"><b style={{ color: '#16a34a' }}>Open</b> · till 8:00 PM</span>
                  {hoursOpen && <span className="hours">{HOURS.map(([d, h], i) => <span className="hr" key={i}><span>{d}</span><span>{h}</span></span>)}</span>}
                </span>
                <span className={`chev ${hoursOpen ? 'up' : ''}`}>⌄</span>
              </button>
              <div className="info-row static">
                <span className="info-ic">💵</span>
                <span className="info-mid"><span className="info-main">{PLACE.price} · Bakery, Café</span></span>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Connect — the complete link directory */}
          <div className="section">
            <span className="section-title">Connect</span>
            <p className="connect-sub">Everywhere this place is — all in one tap.</p>
            <div className="links">{LINKS.map((l, i) => <LinkRow key={i} l={l} />)}</div>
          </div>

          <div className="divider" />

          {/* Recent reviews */}
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
        .hero-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 100%); }
        .icon-btn { position: absolute; top: 18px; width: 40px; height: 40px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.92); font-size: 22px; line-height: 1; color: #17013A; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; }
        .back { left: 16px; } .save { right: 16px; font-size: 19px; }
        /* lifted off the sheet, tighter name -> meta */
        .hero-text { position: absolute; left: 20px; right: 20px; bottom: 34px; }
        .name { color: #fff; font-size: 27px; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.45); }
        .meta { color: rgba(255,255,255,0.92); font-size: 14px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.45); }
        .open { color: #4ADE80; font-weight: 700; }

        .sheet { position: relative; margin-top: -22px; background: #fff; border-radius: 26px 26px 0 0; padding: 22px 20px 8px; box-shadow: 0 -8px 24px rgba(23,1,58,0.06); }

        /* quick actions + socials */
        .quickbar { padding-bottom: 18px; border-bottom: 1px solid rgba(23,1,58,0.07); }
        .qa-row { display: flex; justify-content: space-between; gap: 4px; }
        .qa { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; background: none; border: none; cursor: pointer; padding: 0; }
        .qa-ic { width: 48px; height: 48px; border-radius: 50%; background: rgba(23,1,58,0.05); display: flex; align-items: center; justify-content: center; }
        .qa-lbl { font-size: 11.5px; font-weight: 600; color: #4a475c; }
        .so-row { display: flex; gap: 9px; margin-top: 16px; }
        .so { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 12px; background: rgba(23,1,58,0.04); border: none; cursor: pointer; text-align: left; }
        .so-ic { flex: none; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .so-mid { display: flex; flex-direction: column; min-width: 0; }
        .so-lbl { font-size: 12.5px; font-weight: 800; color: #17013A; line-height: 1.2; }
        .so-val { font-size: 11px; color: #8b8898; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .section { padding: 16px 0 16px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
        .section-title { font-size: 19px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .section-sub { font-size: 12.5px; font-weight: 600; color: #8b8898; }
        .review-note { font-size: 12.5px; color: #8b8898; margin: 0 0 14px; line-height: 1.4; }
        .learn { color: #00858C; font-weight: 700; }

        .grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
        .more { width: 100%; margin-top: 14px; padding: 13px 0; border-radius: 12px; border: 1px solid rgba(23,1,58,0.12);
          background: rgba(23,1,58,0.025); color: #17013A; font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px; }
        .chev { transition: transform 0.2s ease; font-size: 16px; }
        .chev.up { transform: rotate(180deg); }

        .dropdown { margin-top: 14px; animation: drop 0.18s ease; }
        @keyframes drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .group { padding: 6px 0 4px; }
        .group + .group { border-top: 1px solid rgba(23,1,58,0.06); margin-top: 8px; padding-top: 14px; }
        .group-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 6px; }
        .group-dot { width: 8px; height: 8px; border-radius: 50%; }
        .group-n { margin-left: 6px; font-size: 11px; font-weight: 800; color: #b3b0bd; background: rgba(23,1,58,0.05); border-radius: 20px; padding: 1px 7px; }

        .tp-head { margin-bottom: 10px; }
        .tp-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; color: #00858C;
          background: rgba(0,194,203,0.10); border: 1px solid rgba(0,194,203,0.28); padding: 5px 12px; border-radius: 20px; }
        .about { font-size: 14.5px; line-height: 1.6; color: #4a475c; margin: 0; }
        .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
        .tags-label { font-size: 12px; font-weight: 700; color: #9a97a6; margin-right: 2px; }
        .tag { font-size: 13px; font-weight: 700; color: #2A2440; background: rgba(23,1,58,0.05); padding: 6px 12px; border-radius: 20px; }

        .info { margin-top: 8px; display: flex; flex-direction: column; }
        .info-row { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 9px 0; background: none; border: none; cursor: pointer; text-align: left; }
        .info-row.static { cursor: default; }
        .info-ic { flex: none; font-size: 17px; width: 22px; text-align: center; line-height: 1.4; }
        .info-mid { flex: 1; min-width: 0; }
        .info-main { font-size: 14.5px; font-weight: 600; color: #2A2440; line-height: 1.4; }
        .info-act { flex: none; font-size: 13px; font-weight: 800; color: #00858C; }
        .hours { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
        .hr { display: flex; justify-content: space-between; font-size: 13.5px; color: #6b6880; }
        .hr span:first-child { font-weight: 600; color: #4a475c; }

        .connect-sub { font-size: 12.5px; color: #8b8898; margin: 4px 0 8px; }
        .links { display: flex; flex-direction: column; }

        .divider { height: 1px; background: rgba(23,1,58,0.07); margin: 0; }
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
