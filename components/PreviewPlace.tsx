/**
 * PREVIEW — reusable, config-driven Tavvy place screen. One design, every
 * business type (restaurant, hotel, service, construction, airport, …) rendered
 * from a config so they stay consistent and are easy to wire to real data later.
 */
import React, { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';

// dark/light palette for the place screen surfaces
function usePalette() {
  let isDark = false;
  try { isDark = useThemeContext().isDark; } catch { /* outside provider */ }
  return isDark ? {
    isDark, bg: '#0e0e14', sheet: '#15151d', text: '#FFFFFF', text2: '#a8a5b3', text3: '#7a7785',
    border: 'rgba(255,255,255,0.09)', divider: 'rgba(255,255,255,0.08)', soft: 'rgba(255,255,255,0.05)',
    softer: 'rgba(255,255,255,0.03)', tileText: '#FFFFFF', pillBg: 'rgba(255,255,255,0.06)',
  } : {
    isDark, bg: '#ffffff', sheet: '#ffffff', text: '#17013A', text2: '#8b8898', text3: '#b3b0bd',
    border: 'rgba(23,1,58,0.08)', divider: 'rgba(23,1,58,0.07)', soft: 'rgba(23,1,58,0.05)',
    softer: 'rgba(23,1,58,0.025)', tileText: '#17013A', pillBg: 'rgba(23,1,58,0.05)',
  };
}

export type Cat = 'good' | 'vibe' | 'headsup';
export type Sig = { label: string; tapCount: number; category: Cat; emoji: string };
export type Review = { initial: string; color: string; name: string; when: string; signals: { label: string; category: Cat }[] };
export type InfoRow = { icon: string; main: string; act?: string; hours?: [string, string][] };
export type Extra = { title: string; kind: 'chips' | 'list'; sub?: string; items: any[] };
export type PlaceConfig = {
  type: string;
  name: string;
  photo: string;
  meta: string;
  openLine: string;
  reviewsSub: string;          // "642 signals · 142 people"
  actions: { key: string; label: string }[];
  groups: { key: Cat; items: Sig[] }[];
  description: string;
  popularLabel: string;        // "Popular for" | "Known for"
  popular: string[];
  info: InfoRow[];
  reviews: Review[];
  cta: string;                 // "Add Review"
};

export const CAT: Record<Cat, { name: string; accent: string; strong: string; tint: string; border: string }> = {
  good:    { name: 'The Good', accent: '#067A80', strong: '#00C2CB', tint: 'rgba(0,194,203,0.12)',  border: 'rgba(0,194,203,0.34)' },
  vibe:    { name: 'The Vibe', accent: '#7A05A8', strong: '#8A05BE', tint: 'rgba(138,5,190,0.10)',  border: 'rgba(138,5,190,0.28)' },
  headsup: { name: 'Heads Up', accent: '#9A5600', strong: '#F5A623', tint: 'rgba(245,166,35,0.16)', border: 'rgba(245,166,35,0.42)' },
};

// All icons sit on the same grayish circle; the glyph carries the brand colour.
export const SOCIALS = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'tiktok',    label: 'TikTok',    color: '#17013A' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000' },
  { key: 'whatsapp',  label: 'WhatsApp',  color: '#25D366' },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2' },
];

function Glyph({ name, color = '#fff', size = 26 }: { name: string; color?: string; size?: number }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const sv = (children: React.ReactNode) => <svg viewBox="0 0 24 24" width={size} height={size}>{children}</svg>;
  switch (name) {
    case 'phone': case 'whatsapp':
      return sv(<path d="M6.5 10.8c1.4 2.8 3.9 5.3 6.7 6.7l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.5 21 3 12.5 3 2 3 1.4 3.4 1 4 1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2.4 2.3z" fill={color} />);
    case 'website':
      return sv(<><circle cx="12" cy="12" r="9" {...s} /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" {...s} /></>);
    case 'menu':
      return sv(<path d="M7 3v8M5 3v3a2 2 0 0 0 4 0V3M7 11v10M16 3c-1.4 0-2 2.5-2 5s.7 3.5 2 3.7V21" {...s} />);
    case 'share':
      return sv(<path d="M12 15V4M12 4l-3.3 3.3M12 4l3.3 3.3M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...s} />);
    case 'order':
      return sv(<path d="M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8zM9 8V6.5a3 3 0 0 1 6 0V8" {...s} />);
    case 'book':
      return sv(<><rect x="3.5" y="5" width="17" height="15" rx="2.5" {...s} /><path d="M3.5 9.5h17M8 3v4M16 3v4" {...s} /></>);
    case 'rooms':
      return sv(<path d="M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M7 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M3 19v1M21 19v1" {...s} />);
    case 'amenities':
      return sv(<path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3zM18 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" {...s} />);
    case 'quote':
      return sv(<><path d="M6 3h12v18l-2.2-1.6-1.9 1.6-1.9-1.6L10 21l-1.9-1.6L6 21V3z" {...s} /><path d="M9 8.5h6M9 12h6" {...s} /></>);
    case 'portfolio':
      return sv(<><rect x="3" y="5" width="18" height="14" rx="2" {...s} /><circle cx="8.5" cy="10" r="1.6" {...s} /><path d="M21 16l-5-4-4 3-2-1.4L3 18" {...s} /></>);
    case 'flights':
      return sv(<path d="M21.5 4.5a1.6 1.6 0 0 0-2.3 0l-3.5 3.5-8-2.2-1.6 1.6 5.7 3.4-3 3-3-0.5-1.2 1.2 3.3 1.9 1.9 3.3 1.2-1.2-.5-3 3-3 3.4 5.7 1.6-1.6-2.2-8 3.5-3.5a1.6 1.6 0 0 0 0-2.3z" fill={color} />);
    case 'terminals':
      return sv(<><rect x="4" y="3" width="16" height="18" rx="1.5" {...s} /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-3.5h4V21" {...s} /></>);
    case 'parking':
      return sv(<><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" {...s} /><path d="M9.5 17V7h3.6a3 3 0 0 1 0 6H9.5" {...s} /></>);
    case 'map':
      return sv(<><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z" {...s} /><circle cx="12" cy="10" r="2.5" {...s} /></>);
    case 'instagram':
      return sv(<><rect x="3.5" y="3.5" width="17" height="17" rx="5" {...s} /><circle cx="12" cy="12" r="4" {...s} /><circle cx="17.2" cy="6.8" r="1.1" fill={color} /></>);
    case 'tiktok':
      return sv(<path d="M14 3c.3 2 1.7 3.6 3.8 3.9V10c-1.5 0-2.8-.4-3.8-1.1v5.8a4.7 4.7 0 1 1-4.7-4.7c.3 0 .5 0 .8.1v3.1a1.7 1.7 0 1 0 1.2 1.6V3H14z" fill={color} />);
    case 'youtube': // recognizable red play-button badge (self-coloured)
      return sv(<><rect x="2.5" y="6.5" width="19" height="11" rx="3.4" fill="#FF0000" /><path d="M10.3 9.4l4.7 2.6-4.7 2.6V9.4z" fill="#fff" /></>);
    case 'ecard': // Tavvy mark — two-tone check + dot (self-coloured)
      return sv(<><path d="M11 15.7L17.7 8.4" stroke="#00C2CB" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M11 15.7L8 12.6" stroke="#8A05BE" strokeWidth="5" strokeLinecap="round" fill="none" /><circle cx="9.5" cy="14.3" r="1.7" fill="#fff" /></>);
    case 'facebook':
      return sv(<path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.4V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.6V14h2.3v7h2.6z" fill={color} />);
    default: return null;
  }
}

function Tile({ s, onClick }: { s: Sig; onClick?: () => void }) {
  const c = CAT[s.category]; const t = usePalette();
  return (
    <button className="tile" onClick={onClick} style={{ background: c.tint, borderColor: c.border }}>
      <span className="t-row"><span className="t-emoji">{s.emoji}</span><span className="t-label">{s.label}</span></span>
      <span className="t-count" style={{ color: t.isDark ? c.strong : c.accent }}>{s.tapCount} taps</span>
      <style jsx>{`
        .tile { display: flex; flex-direction: column; justify-content: space-between; gap: 10px; width: 100%; min-width: 0;
          min-height: 76px; padding: 13px; border-radius: 16px; border: 1px solid; cursor: pointer; text-align: left; font-family: inherit; }
        .t-row { display: flex; align-items: flex-start; gap: 8px; }
        .t-emoji { font-size: 18px; flex: none; line-height: 1.2; }
        .t-label { font-size: 15px; font-weight: 700; color: ${t.text}; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .t-count { font-size: 12.5px; font-weight: 700; }
      `}</style>
    </button>
  );
}

function Row({ s, max }: { s: Sig; max: number }) {
  const c = CAT[s.category]; const t = usePalette();
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
        .r-label { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 600; color: ${t.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .r-bar { flex: none; width: 84px; height: 7px; border-radius: 4px; background: ${t.soft}; overflow: hidden; }
        .r-fill { display: block; height: 100%; border-radius: 4px; }
        .r-count { flex: none; width: 30px; text-align: right; font-size: 13px; font-weight: 800; color: ${t.text}; }
      `}</style>
    </div>
  );
}

function Reviewer({ r }: { r: Review }) {
  const t = usePalette();
  return (
    <div className="rv">
      <div className="rv-av" style={{ background: r.color }}>{r.initial}</div>
      <div className="rv-body">
        <div className="rv-top"><span className="rv-name">{r.name}</span><span className="rv-when">{r.when}</span></div>
        <div className="rv-sigs">
          {r.signals.map((s, i) => { const c = CAT[s.category];
            return <span className="rv-chip" key={i} style={{ background: c.tint, color: t.text, borderColor: c.border }}>{s.label}</span>; })}
        </div>
      </div>
      <style jsx>{`
        .rv { display: flex; gap: 12px; padding: 14px 0; }
        .rv-av { flex: none; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
        .rv-body { flex: 1; min-width: 0; }
        .rv-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .rv-name { font-size: 14.5px; font-weight: 800; color: ${t.text}; }
        .rv-when { font-size: 12px; color: ${t.text2}; flex: none; }
        .rv-sigs { display: flex; flex-wrap: wrap; gap: 6px; margin: 7px 0 0; }
        .rv-chip { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid; }
      `}</style>
    </div>
  );
}

const EXTERNAL = ['website', 'instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp'];

export default function PlaceScreen({ config, hrefs, onAddReview, onBack, onSave }: { config: PlaceConfig; hrefs?: Record<string, string>; onAddReview?: () => void; onBack?: () => void; onSave?: () => void }) {
  const [open, setOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState<number | null>(null);
  const t = usePalette();

  const all = config.groups.flatMap(g => g.items);
  const top: Sig[] = [
    config.groups.find(g => g.key === 'good')?.items[0],
    config.groups.find(g => g.key === 'good')?.items[1],
    config.groups.find(g => g.key === 'vibe')?.items[0],
    config.groups.find(g => g.key === 'headsup')?.items[0],
  ].filter(Boolean) as Sig[];

  // In real mode (hrefs provided) only show socials that actually have a link.
  const socialItems = SOCIALS.filter(s => !hrefs || hrefs[s.key]);
  const actionColor = t.isDark ? '#EDEBF5' : '#17013A';
  const bar = [
    ...config.actions.map(a => ({ key: a.key, label: a.label, color: actionColor })),
    { key: 'ecard', label: 'eCard', color: '' },
    // TikTok's glyph is near-black; in dark mode use white so it's visible
    ...socialItems.map(s => ({ key: s.key, label: s.label, color: (s.key === 'tiktok' && t.isDark) ? '#FFFFFF' : s.color })),
  ];

  return (
    <div className="screen">
      <div className="hero">
        {config.photo
          ? <img src={config.photo} alt={config.name} className="hero-img" />
          : <div className="hero-img hero-fallback" />}
        <div className="hero-scrim" />
        <button className="icon-btn back" aria-label="Back" onClick={onBack}>‹</button>
        <button className="icon-btn save" aria-label="Save" onClick={onSave}>♡</button>
        <div className="hero-text">
          <span className="type-pill">{config.type}</span>
          <h1 className="name">{config.name}</h1>
          <p className="meta">{config.meta} · <span className="open">{config.openLine}</span></p>
        </div>
      </div>

      <div className="sheet">
        <div className="quickbar">
          <div className="bar-scroll">
            {bar.map(b => {
              const href = hrefs?.[b.key];
              const ext = EXTERNAL.includes(b.key);
              const inner = (<><span className="bi-ic"><Glyph name={b.key} color={b.color} size={26} /></span><span className="bi-lbl">{b.label}</span></>);
              return href
                ? <a className="bi" key={b.key} href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}>{inner}</a>
                : <button className="bi" key={b.key}>{inner}</button>;
            })}
          </div>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-title">Reviews</span><span className="section-sub">{config.reviewsSub}</span></div>
          <p className="review-note">Signal-based reviews — tap what's true, no fake stars. <a className="learn" href="/app/help">How it works</a></p>
          <div className="grid">{top.map((s, i) => <Tile key={i} s={s} onClick={() => setOpen(o => !o)} />)}</div>
          <button className="more" onClick={() => setOpen(o => !o)}>
            {open ? 'Hide signals' : `See all ${all.length} signals`}<span className={`chev ${open ? 'up' : ''}`}>⌄</span>
          </button>
          {open && (
            <div className="dropdown">
              {config.groups.map(g => { const c = CAT[g.key]; const max = Math.max(...g.items.map(i => i.tapCount));
                return (
                  <div className="group" key={g.key}>
                    <div className="group-head" style={{ color: c.accent }}><span className="group-dot" style={{ background: c.strong }} />{c.name}<span className="group-n">{g.items.length}</span></div>
                    {g.items.map((s, i) => <Row key={i} s={s} max={max} />)}
                  </div>
                ); })}
            </div>
          )}
        </div>

        <div className="divider" />
        <div className="section">
          <div className="tp-head"><span className="tp-badge">✦ Tavvy Places</span></div>
          {config.description && <p className="about">{config.description}</p>}
          <div className="tags"><span className="tags-label">{config.popularLabel}</span>{config.popular.map((t, i) => <span className="tag" key={i}>{t}</span>)}</div>
        </div>

        {config.extras?.map((ex, i) => (
          <React.Fragment key={i}>
            <div className="divider" />
            <div className="section">
              <div className="section-head"><span className="section-title">{ex.title}</span>{ex.sub && <span className="section-sub">{ex.sub}</span>}</div>
              {ex.kind === 'chips' ? (
                <div className="xchips">{(ex.items as string[]).map((t, j) => <span className="xchip" key={j}>{t}</span>)}</div>
              ) : (
                <div className="xlist">{(ex.items as { label: string; sub?: string }[]).map((it, j) => (
                  <div className="xrow" key={j}><span className="xrow-l">{it.label}</span>{it.sub && <span className="xrow-s">{it.sub}</span>}</div>
                ))}</div>
              )}
            </div>
          </React.Fragment>
        ))}

        <div className="divider" />
        <div className="section">
          <span className="section-title">Info</span>
          <div className="info">
            {config.info.map((r, i) => (
              <button className={`info-row ${r.hours ? '' : 'static'}`} key={i} onClick={r.hours ? () => setHoursOpen(o => o === i ? null : i) : undefined}>
                <span className="info-ic">{r.icon}</span>
                <span className="info-mid">
                  <span className="info-main" dangerouslySetInnerHTML={{ __html: r.main }} />
                  {r.hours && hoursOpen === i && <span className="hours">{r.hours.map(([d, h], j) => <span className="hr" key={j}><span>{d}</span><span>{h}</span></span>)}</span>}
                </span>
                {r.act && <span className="info-act">{r.act}</span>}
                {r.hours && <span className={`chev ${hoursOpen === i ? 'up' : ''}`}>⌄</span>}
              </button>
            ))}
          </div>
        </div>

        {config.reviews && config.reviews.length > 0 && (
          <>
            <div className="divider" />
            <div className="section">
              <div className="section-head"><span className="section-title">Recent reviews</span><span className="section-sub">{config.reviews.length * 47}+ total</span></div>
              {config.reviews.map((r, i) => <Reviewer key={i} r={r} />)}
              <button className="more" style={{ marginTop: 6 }}>Read all reviews</button>
            </div>
          </>
        )}
      </div>

      <div className="actionbar">
        {hrefs?.directions
          ? <a className="act ghost" href={hrefs.directions} target="_blank" rel="noopener noreferrer">Directions</a>
          : <button className="act ghost">Directions</button>}
        <button className="act primary" onClick={onAddReview}>{config.cta}</button>
      </div>

      <style jsx>{`
        .screen { max-width: 480px; margin: 0 auto; min-height: 100vh; background: ${t.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; padding-bottom: 92px; }
        .hero { position: relative; width: 100%; height: 33vh; min-height: 232px; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-fallback { background: linear-gradient(135deg, #17013A 0%, #3a0a6b 50%, #8A05BE 100%); }
        .hero-scrim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.62) 100%); }
        .icon-btn { position: absolute; top: 18px; width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,0.92); font-size: 22px; line-height: 1; color: #17013A; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; }
        .back { left: 16px; } .save { right: 16px; font-size: 19px; }
        .hero-text { position: absolute; left: 20px; right: 20px; bottom: 30px; }
        .type-pill { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; color: #fff; background: rgba(255,255,255,0.22); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 20px; margin-bottom: 9px; }
        .name { color: #fff; font-size: 27px; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.45); }
        .meta { color: rgba(255,255,255,0.92); font-size: 14px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.45); }
        .open { color: #4ADE80; font-weight: 700; }
        .sheet { position: relative; margin-top: -22px; background: ${t.sheet}; border-radius: 26px 26px 0 0; padding: 22px 20px 8px; box-shadow: 0 -8px 24px rgba(0,0,0,0.12); }
        .quickbar { margin: 0 -20px; padding: 0 20px 16px; border-bottom: 1px solid ${t.divider}; }
        .bar-scroll { display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; }
        .bar-scroll::-webkit-scrollbar { display: none; }
        .bi { flex: 0 0 auto; width: 54px; display: flex; flex-direction: column; align-items: center; gap: 7px; background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; }
        .bi-ic { width: 50px; height: 50px; border-radius: 50%; background: ${t.pillBg}; display: flex; align-items: center; justify-content: center; }
        .bi-lbl { font-size: 11px; font-weight: 600; color: ${t.text2}; white-space: nowrap; }
        .section { padding: 16px 0 16px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
        .section-title { font-size: 19px; font-weight: 800; color: ${t.text}; letter-spacing: -0.2px; }
        .section-sub { font-size: 12.5px; font-weight: 600; color: ${t.text2}; }
        .review-note { font-size: 12.5px; color: ${t.text2}; margin: 0 0 14px; line-height: 1.4; }
        .learn { color: ${t.isDark ? '#3FE0E8' : '#00858C'}; font-weight: 700; text-decoration: none; }
        .grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
        .more { width: 100%; margin-top: 14px; padding: 13px 0; border-radius: 12px; border: 1px solid ${t.border}; background: ${t.softer}; color: ${t.text}; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .chev { transition: transform 0.2s ease; font-size: 16px; }
        .chev.up { transform: rotate(180deg); }
        .dropdown { margin-top: 14px; }
        .group { padding: 6px 0 4px; }
        .group + .group { border-top: 1px solid ${t.divider}; margin-top: 8px; padding-top: 14px; }
        .group-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 6px; }
        .group-dot { width: 8px; height: 8px; border-radius: 50%; }
        .group-n { margin-left: 6px; font-size: 11px; font-weight: 800; color: ${t.text3}; background: ${t.soft}; border-radius: 20px; padding: 1px 7px; }
        .tp-head { margin-bottom: 10px; }
        .tp-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; color: ${t.isDark ? '#3FE0E8' : '#00858C'}; background: rgba(0,194,203,0.12); border: 1px solid rgba(0,194,203,0.28); padding: 5px 12px; border-radius: 20px; }
        .about { font-size: 14.5px; line-height: 1.6; color: ${t.text2}; margin: 0; }
        .tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
        .tags-label { font-size: 12px; font-weight: 700; color: ${t.text2}; margin-right: 2px; }
        .tag { font-size: 13px; font-weight: 700; color: ${t.text}; background: ${t.pillBg}; padding: 6px 12px; border-radius: 20px; }
        .xchips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .xchip { font-size: 13px; font-weight: 700; color: ${t.text}; background: ${t.pillBg}; padding: 7px 13px; border-radius: 12px; }
        .xlist { display: flex; flex-direction: column; margin-top: 4px; }
        .xrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 0; border-bottom: 1px solid ${t.divider}; }
        .xrow:last-child { border-bottom: none; }
        .xrow-l { font-size: 14.5px; font-weight: 600; color: ${t.text}; }
        .xrow-s { flex: none; font-size: 13px; font-weight: 800; color: ${t.isDark ? '#3FE0E8' : '#00858C'}; }
        .info { margin-top: 8px; display: flex; flex-direction: column; }
        .info-row { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 9px 0; background: none; border: none; cursor: pointer; text-align: left; }
        .info-row.static { cursor: default; }
        .info-ic { flex: none; font-size: 17px; width: 22px; text-align: center; line-height: 1.4; }
        .info-mid { flex: 1; min-width: 0; }
        .info-main { font-size: 14.5px; font-weight: 600; color: ${t.text}; line-height: 1.4; }
        .info-act { flex: none; font-size: 13px; font-weight: 800; color: ${t.isDark ? '#3FE0E8' : '#00858C'}; }
        .hours { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
        .hr { display: flex; justify-content: space-between; font-size: 13.5px; color: ${t.text2}; }
        .hr span:first-child { font-weight: 600; color: ${t.text}; }
        .divider { height: 1px; background: ${t.divider}; margin: 0; }
        .actionbar { position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto; display: flex; gap: 12px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: ${t.isDark ? 'rgba(18,18,24,0.96)' : 'rgba(255,255,255,0.96)'}; backdrop-filter: blur(10px); border-top: 1px solid ${t.divider}; }
        .act { flex: 1; padding: 15px 0; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; text-align: center; }
        .act.ghost { background: ${t.pillBg}; color: ${t.text}; }
        .act.primary { background: #00C2CB; color: #fff; box-shadow: 0 6px 18px rgba(0,194,203,0.35); }
      `}</style>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: ${t.bg}; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
