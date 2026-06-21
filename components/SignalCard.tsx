/**
 * SignalCard — search/result card that surfaces a place's top signals (2 Good,
 * 1 Vibe, 1 Heads Up) in the agreed design. Used on the map results + search.
 */
import React from 'react';

type Cat = 'good' | 'vibe' | 'headsup';
const CAT: Record<Cat, { accent: string; tint: string; border: string }> = {
  good:    { accent: '#067A80', tint: 'rgba(0,194,203,0.12)',  border: 'rgba(0,194,203,0.34)' },
  vibe:    { accent: '#7A05A8', tint: 'rgba(138,5,190,0.10)',  border: 'rgba(138,5,190,0.28)' },
  headsup: { accent: '#9A5600', tint: 'rgba(245,166,35,0.16)', border: 'rgba(245,166,35,0.42)' },
};

export type CardSignal = { label: string; emoji?: string; category: Cat; count: number };
export type SignalCardPlace = {
  id: string; name: string; category?: string; city?: string;
  distance?: number; cover_image_url?: string; photo?: string; topSignals?: CardSignal[];
};

export default function SignalCard({ place, onClick }: { place: SignalCardPlace; onClick?: () => void }) {
  const photo = place.cover_image_url || place.photo || '';
  const sigs = (place.topSignals || []).slice(0, 4);
  const dist = place.distance != null ? `${place.distance.toFixed(1)} mi` : '';
  const meta = [place.category, place.city].filter(Boolean).join(' · ');

  return (
    <button className="card" onClick={onClick}>
      <div className="ph">
        {photo ? <img src={photo} alt={place.name} /> : <div className="ph-fallback" />}
        {place.category && <span className="badge">{place.category}</span>}
      </div>
      <div className="body">
        <div className="top"><span className="name">{place.name}</span>{dist && <span className="dist">{dist}</span>}</div>
        {meta && <p className="meta">{meta}</p>}
        {sigs.length > 0 ? (
          <div className="chips">
            {sigs.map((s, i) => {
              const c = CAT[s.category];
              return (
                <span className="chip" key={i} style={{ background: c.tint, borderColor: c.border }}>
                  {s.emoji && <span className="chip-e">{s.emoji}</span>}
                  <span className="chip-l">{s.label}</span>
                  <span className="chip-n" style={{ color: c.accent }}>{s.count}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="empty">Be the first to review this place</p>
        )}
      </div>
      <style jsx>{`
        .card { display: block; width: 100%; text-align: left; background: #fff; border: 1px solid rgba(23,1,58,0.06);
          border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 4px 16px rgba(23,1,58,0.06); margin-bottom: 12px; padding: 0; }
        .ph { position: relative; width: 100%; height: 130px; }
        .ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ph-fallback { width: 100%; height: 100%; background: linear-gradient(135deg,#17013A,#3a0a6b,#8A05BE); }
        .badge { position: absolute; top: 10px; left: 10px; font-size: 11px; font-weight: 800; color: #17013A; background: rgba(255,255,255,0.92); padding: 4px 10px; border-radius: 20px; text-transform: capitalize; }
        .body { padding: 12px 14px 14px; }
        .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .name { font-size: 16px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .dist { flex: none; font-size: 12.5px; color: #8b8898; font-weight: 600; }
        .meta { font-size: 12.5px; color: #8b8898; margin: 2px 0 10px; text-transform: capitalize; }
        .chips { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 7px; }
        .chip { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; font-weight: 700;
          padding: 6px 9px; border-radius: 11px; border: 1px solid; color: #17013A; }
        .chip-e { flex: none; font-size: 12px; }
        .chip-l { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chip-n { flex: none; font-weight: 800; }
        .empty { font-size: 12.5px; color: #b3b0bd; font-style: italic; margin: 4px 0 0; }
      `}</style>
    </button>
  );
}
