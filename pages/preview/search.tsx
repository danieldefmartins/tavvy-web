/**
 * PREVIEW ONLY — search results with Tavvy review (signal) cards. Not linked.
 * Each card surfaces the place's top signals so a user can compare and pick a
 * favorite, then tap through to the full place screen. Delete after design lock.
 */
import React from 'react';
import Head from 'next/head';

type Cat = 'good' | 'vibe' | 'headsup';
const CAT: Record<Cat, { accent: string; tint: string; border: string }> = {
  good:    { accent: '#067A80', tint: 'rgba(0,194,203,0.12)',  border: 'rgba(0,194,203,0.34)' },
  vibe:    { accent: '#7A05A8', tint: 'rgba(138,5,190,0.10)',  border: 'rgba(138,5,190,0.28)' },
  headsup: { accent: '#9A5600', tint: 'rgba(245,166,35,0.16)', border: 'rgba(245,166,35,0.42)' },
};

type Sig = { label: string; count: number; category: Cat; emoji: string };
type Place = { photo: string; name: string; cat: string; dist: string; price: string; reviews: number; featured?: boolean; signals: Sig[] };

const PLACES: Place[] = [
  { photo: '/preview-bakery.jpg', name: 'Tatte Bakery & Café', cat: 'Bakery', dist: '0.4 mi', price: '$$', reviews: 642, featured: true,
    signals: [
      { label: 'Amazing Pastries', count: 142, category: 'good', emoji: '🥐' },
      { label: 'Great Coffee', count: 98, category: 'good', emoji: '☕' },
      { label: 'Cozy', count: 76, category: 'vibe', emoji: '🛋️' },
      { label: 'Long Wait', count: 45, category: 'headsup', emoji: '⏳' },
    ] },
  { photo: '/preview-cafe.jpg', name: 'George Howell Coffee', cat: 'Coffee Shop', dist: '0.6 mi', price: '$$', reviews: 318,
    signals: [
      { label: 'Great Coffee', count: 211, category: 'good', emoji: '☕' },
      { label: 'Good for Work', count: 87, category: 'vibe', emoji: '💻' },
      { label: 'Cash Only', count: 19, category: 'headsup', emoji: '💵' },
    ] },
  { photo: '/preview-dinner.jpg', name: 'Sarma', cat: 'Mediterranean', dist: '1.2 mi', price: '$$$', reviews: 905,
    signals: [
      { label: 'Amazing Food', count: 402, category: 'good', emoji: '🍽️' },
      { label: 'Romantic', count: 154, category: 'vibe', emoji: '🕯️' },
      { label: 'Hard to Book', count: 88, category: 'headsup', emoji: '📅' },
    ] },
];

function Chip({ s }: { s: Sig }) {
  const c = CAT[s.category];
  return (
    <span className="chip" style={{ background: c.tint, color: c.accent, borderColor: c.border }}>
      <span className="chip-e">{s.emoji}</span>{s.label}<span className="chip-n">{s.count}</span>
      <style jsx>{`
        .chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700;
          padding: 5px 9px; border-radius: 20px; border: 1px solid; white-space: nowrap; }
        .chip-e { font-size: 12px; }
        .chip-n { font-weight: 800; opacity: 0.75; }
      `}</style>
    </span>
  );
}

function Card({ p }: { p: Place }) {
  return (
    <a className="card" href="/preview/signal-spectrum">
      <div className="ph">
        <img src={p.photo} alt={p.name} />
        <button className="heart" aria-label="Save">♡</button>
        <span className="badge">{p.cat}</span>
        {p.featured && <span className="feat">✦ Tavvy Places</span>}
      </div>
      <div className="body">
        <div className="top"><span className="name">{p.name}</span><span className="dist">{p.dist}</span></div>
        <p className="meta">{p.price} · {p.cat} · {p.reviews} reviews</p>
        <div className="chips">{p.signals.map((s, i) => <Chip key={i} s={s} />)}</div>
      </div>
      <style jsx>{`
        .card { display: block; background: #fff; border-radius: 18px; overflow: hidden; text-decoration: none;
          box-shadow: 0 6px 22px rgba(23,1,58,0.08); border: 1px solid rgba(23,1,58,0.05); margin-bottom: 16px; }
        .ph { position: relative; width: 100%; height: 150px; }
        .ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .heart { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.92); font-size: 17px; color: #17013A; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .badge { position: absolute; top: 12px; left: 12px; font-size: 11px; font-weight: 800; color: #17013A;
          background: rgba(255,255,255,0.92); padding: 4px 10px; border-radius: 20px; }
        .feat { position: absolute; bottom: 10px; left: 12px; font-size: 11px; font-weight: 800; color: #fff;
          background: linear-gradient(135deg,#00C2CB,#8A05BE); padding: 4px 10px; border-radius: 20px; }
        .body { padding: 13px 15px 15px; }
        .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .name { font-size: 17px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .dist { flex: none; font-size: 13px; color: #8b8898; font-weight: 600; }
        .meta { font-size: 13px; color: #8b8898; margin: 3px 0 11px; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
      `}</style>
    </a>
  );
}

export default function SearchPreview() {
  return (
    <>
      <Head>
        <title>Search — preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="screen">
        <div className="header">
          <div className="searchbar">
            <span className="s-ic">🔍</span>
            <span className="s-text">Coffee &amp; bakeries</span>
            <span className="s-loc">Boston</span>
          </div>
          <div className="filters">
            {['Open now', 'Top rated', '$$', 'Cozy', 'Pet friendly'].map((f, i) => (
              <span className={`filter ${i === 0 ? 'on' : ''}`} key={i}>{f}</span>
            ))}
          </div>
        </div>
        <div className="results">
          <p className="count">{PLACES.length * 47} places · sorted by signals</p>
          {PLACES.map((p, i) => <Card key={i} p={p} />)}
        </div>
      </div>

      <style jsx>{`
        .screen { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #f4f5f7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .header { position: sticky; top: 0; background: rgba(244,245,247,0.92); backdrop-filter: blur(10px);
          padding: 16px 16px 8px; z-index: 5; }
        .searchbar { display: flex; align-items: center; gap: 9px; background: #fff; border-radius: 14px;
          padding: 13px 14px; box-shadow: 0 3px 12px rgba(23,1,58,0.07); }
        .s-ic { font-size: 15px; }
        .s-text { flex: 1; font-size: 15px; font-weight: 600; color: #17013A; }
        .s-loc { font-size: 13px; font-weight: 700; color: #00858C; }
        .filters { display: flex; gap: 8px; overflow-x: auto; margin-top: 12px; scrollbar-width: none; }
        .filters::-webkit-scrollbar { display: none; }
        .filter { flex: 0 0 auto; font-size: 13px; font-weight: 700; color: #4a475c; background: #fff;
          border: 1px solid rgba(23,1,58,0.08); padding: 7px 14px; border-radius: 20px; }
        .filter.on { background: #17013A; color: #fff; border-color: #17013A; }
        .results { padding: 12px 16px 28px; }
        .count { font-size: 12.5px; font-weight: 600; color: #8b8898; margin: 2px 2px 14px; }
      `}</style>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: #f4f5f7; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
    </>
  );
}
