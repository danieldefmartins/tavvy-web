import { categoryImageForPlace, realPlacePhotos } from '../lib/placePreviewImage';
/**
 * PREVIEW — reusable, config-driven Tavvy place screen. One design, every
 * business type (restaurant, hotel, service, construction, airport, …) rendered
 * from a config so they stay consistent and are easy to wire to real data later.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import ContentSafetyActions from './ContentSafetyActions';
import DemoBanner from './demo/DemoBanner';
import { reviewDateLabel } from '../lib/placePresentation';
import type { PlaceEvidence } from '../lib/placeEvidence';
import { coreForCategory, secondaryGoodSignals } from '../lib/placeEvidence';
import { buildPlaceReviewSummary } from '../lib/placeReviewSummary';
import PlaceReviewGrid from './PlaceReviewGrid';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

// dark/light palette for the place screen surfaces
function usePalette() {
  let isDark = false;
  try { isDark = useThemeContext().isDark; } catch { /* outside provider */ }
  return isDark ? {
    isDark, bg: '#0e0e14', sheet: '#15151d', text: '#FFFFFF', text2: '#a8a5b3', text3: '#7a7785',
    border: 'rgba(255,255,255,0.09)', divider: 'rgba(255,255,255,0.08)', soft: 'rgba(255,255,255,0.05)',
    softer: 'rgba(255,255,255,0.03)', tileText: '#FFFFFF', pillBg: 'rgba(255,255,255,0.06)',
  } : {
    isDark, bg: '#ffffff', sheet: '#ffffff', text: '#17013A', text2: '#625E70', text3: '#716C7D',
    border: 'rgba(23,1,58,0.08)', divider: 'rgba(23,1,58,0.07)', soft: 'rgba(23,1,58,0.05)',
    softer: 'rgba(23,1,58,0.025)', tileText: '#17013A', pillBg: 'rgba(23,1,58,0.05)',
  };
}

export type Cat = 'good' | 'vibe' | 'headsup';
export type Sig = { label: string; tapCount: number; category: Cat; emoji: string };
export type Review = { id?: string; text?: string | null; createdAt?: string; dateSource?: string; isEdit?: boolean; initial: string; color: string; name: string; when: string; signals: { label: string; category: Cat }[] };
export type InfoRow = { icon: string; main: string; act?: string; hours?: [string, string][]; href?: string };
export type Extra = { title: string; kind: 'chips' | 'list'; sub?: string; items: any[] };
export type PlaceConfig = {
  placeId?: string;
  type: string;
  reviewSubject?: { category?: string; subcategory?: string };
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
  extras?: Extra[];
  reviews: Review[];
  reviewsStatus?: 'ready' | 'unavailable';
  cta: string;                 // "Add Review"
  evidence?: PlaceEvidence;
  gallery?: string[];
  photosStatus?: 'ready'|'unavailable';
  photoEntries?: {id:string;url:string;caption?:string}[];
  stories?: { id: string; media_url: string; media_type: string; caption?: string; created_at: string; story_kind?:string }[];
  demo?: boolean;
  detailsContent?: React.ReactNode;
  overviewContent?: React.ReactNode;
  reviewDisabledReason?: string;
  mediaHeading?: string;
  mediaEmptyMessage?: string;
  mediaNotice?: string;
  demoMenu?: { name: string; description: string; price: string }[];
  demoCard?: { tagline: string; hours: string; contact: string };
  demoCardHref?: string;
  reviewsHref?: string;
  deliveryLinks?: Record<string, string>;
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
    case 'story':
      return sv(<><rect x="3" y="4" width="18" height="16" rx="3" {...s} /><path d="M12 8v8M8 12h8" {...s} /></>);
    case 'share':
      return sv(<path d="M12 15V4M12 4l-3.3 3.3M12 4l3.3 3.3M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...s} />);
    case 'save':
      return sv(<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3.1A4.6 4.6 0 0 1 20 10c0 5.8-8 11-8 11z" {...s} />);
    case 'directions':
      return sv(<><path d="M3 12 12 3l9 9-9 9-9-9zM8 14v-2a3 3 0 0 1 3-3h5M13 6l3 3-3 3" {...s}/></>);
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

export function Reviewer({ r, allowSafety }: { r: Review; allowSafety?:boolean }) {
  const t = usePalette();
  // Chip text takes the category tone so a review reads with the same colors as the summary above it.
  const tone = { good: t.isDark ? '#58D9DE' : '#067A80', vibe: t.isDark ? '#D9B6FF' : '#74209A', headsup: t.isDark ? '#FFD38A' : '#885000' };
  return (
    <div className="rv">
      <div className="rv-av" style={{ background: r.color }}>{r.initial}</div>
      <div className="rv-body">
        <div className="rv-top"><span className="rv-name">{r.name}</span><span className="rv-when">{r.createdAt ? reviewDateLabel(r.createdAt,r.dateSource) : r.when}{r.isEdit ? ' · Edited' : ''}</span></div>
        <div className="rv-sigs">
          {r.signals.map((s, i) => { const c = CAT[s.category];
            return <span className="rv-chip" key={i} style={{ background: c.tint, color: tone[s.category], borderColor: c.border }}>{s.category === 'headsup' && <span className="rv-mark" aria-hidden="true">!</span>}{s.label}</span>; })}
        </div>
        {r.text && <p className="rv-note">{r.text}</p>}
        {allowSafety && r.id && <div className="rv-safety"><ContentSafetyActions kind="place_review" contentId={r.id} compact /></div>}
      </div>
      <style jsx>{`
        .rv { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid ${t.divider}; }
        .rv:last-of-type { border-bottom: 0; }
        .rv-av { flex: none; width: 38px; height: 38px; border-radius: 50%; color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
        .rv-body { flex: 1; min-width: 0; }
        .rv-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .rv-name { font-size: 15px; font-weight: 800; color: ${t.text}; }
        .rv-note { margin: 9px 0 0; color: ${t.text2}; font-size: 14.5px; line-height: 1.55; white-space: pre-wrap; }
        .rv-when { font-size: 12.5px; color: ${t.text2}; flex: none; }
        .rv-sigs { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 0; }
        .rv-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; padding: 5px 10px; border-radius: 20px; border: 1px solid; }
        .rv-mark { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border-radius: 50%; background: #F5A623; color: #17013A; font-size: 9.5px; font-weight: 900; line-height: 1; }
        .rv-safety { display: flex; justify-content: flex-end; }
      `}</style>
    </div>
  );
}

const EXTERNAL = ['website', 'instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp'];

export default function PlaceScreen({ config, hrefs, onAddReview, onBack, onSave, saved, saveMessage }: { config: PlaceConfig; hrefs?: Record<string, string>; onAddReview?: () => void; onBack?: () => void; onSave?: () => void; saved?: boolean; saveMessage?: string }) {
  const copy = useReleaseCopy();
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const imagePlace = { id: config.placeId || config.name, category: config.reviewSubject?.category || config.type, subcategory: config.reviewSubject?.subcategory, photo: config.photo, photos: config.gallery };
  const realHero = realPlacePhotos(imagePlace).find(url => !failedPhotos.includes(url));
  const heroPhoto = realHero || categoryImageForPlace(imagePlace);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  type PlaceTab = 'overview' | 'media' | 'menu' | 'details';
  const [activeTab, setActiveTab] = useState<PlaceTab>('overview');
  const hasMedia = !!(config.gallery?.length || config.stories?.length);
  const hasMenu = !!(config.demoMenu?.length || hrefs?.menu);
  const fullMenuHref = hrefs?.menu && !hrefs.menu.startsWith('#') ? hrefs.menu : undefined;
  const availableTabs: PlaceTab[] = ['overview', 'media', 'details'];
  useEffect(() => {
    const syncTab = () => {
      const requested = new URLSearchParams(window.location.search).get('tab') as PlaceTab;
      if (requested === 'menu' && fullMenuHref) { window.location.replace(fullMenuHref); return; }
      setActiveTab(availableTabs.includes(requested) ? requested : 'overview');
    };
    syncTab();
    window.addEventListener('popstate', syncTab);
    return () => window.removeEventListener('popstate', syncTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMedia, hasMenu]);
  const selectTab = (tab: PlaceTab) => {
    if (tab === 'menu' && fullMenuHref) { window.location.assign(fullMenuHref); return; }
    if (tab === activeTab) return;
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'overview') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);
    // Tabs are local page state. They should not consume the browser Back press.
    window.history.replaceState(window.history.state, '', url.toString());
  };
  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) window.history.back();
    else window.location.assign('/app/search');
  };
  const [selectedSummary, setSelectedSummary] = useState<'main' | 'good' | 'vibe' | 'headsup' | null>(null);
  useEffect(() => { setSelectedTopic(null); setSelectedSummary(null); }, [hrefs?.share, config.name, config.meta]);
  const [showAllDemoReviews, setShowAllDemoReviews] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const sharePlace = async () => {
    try {
      const shareUrl = hrefs?.share || document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || window.location.href.split(/[?#]/)[0];
      if (navigator.share) await navigator.share({ title: config.name, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); setShareMessage('Link copied'); }
    } catch (error) { if ((error as Error).name !== 'AbortError') setShareMessage('Copy the address from your browser to share this place.'); }
  };
  const mediaDialogRef = useRef<HTMLDivElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string; caption: string } | null>(null);
  useEffect(() => {
    if (!selectedMedia) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = mediaDialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const trap = (event: KeyboardEvent) => { if(event.key!=='Tab'||!dialog)return; const targets=Array.from(dialog.querySelectorAll<HTMLElement>('button, video[controls], a[href], [tabindex="0"]')); const first=targets[0],last=targets[targets.length-1]; if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();} };
    window.addEventListener('keydown',trap);
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedMedia(null); };
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('keydown',trap); document.body.style.overflow = previous; previousFocus?.focus(); };
  }, [selectedMedia]);
  const [hoursOpen, setHoursOpen] = useState<number | null>(null);
  const t = usePalette();

  const evidence = config.evidence;
  const reviewSubject = config.reviewSubject || config.type;
  const core = coreForCategory(reviewSubject);
  const unavailable = !evidence || evidence.dataStatus === 'unavailable';
  const otherGood = evidence ? secondaryGoodSignals(evidence, reviewSubject) : [];
  const currentWarnings = evidence?.warnings.filter(w => w.status === 'current' || w.status === 'unconfirmed') || [];
  const summaryIcons = { main: /hotel/i.test(config.type) ? '🛏️' : /restaurant|cafe|bar/i.test(config.type) ? '🍽️' : '⭐', good: '✨', vibe: '🕯️', headsup: '⚠️' };
  const summaryTiles = buildPlaceReviewSummary(evidence, reviewSubject).tiles.map(tile => ({ ...tile, icon: summaryIcons[tile.key] }));
  const deliveryQuery = encodeURIComponent(`${config.name} ${config.meta}`);
  const deliveryPlatforms = [
    { key: 'doordash', label: 'DoorDash', search: `https://www.doordash.com/search/store/${deliveryQuery}` },
    { key: 'ubereats', label: 'Uber Eats', search: `https://www.ubereats.com/search?q=${deliveryQuery}` },
    { key: 'grubhub', label: 'Grubhub', search: `https://www.grubhub.com/search?orderMethod=delivery&query=${deliveryQuery}` },
  ];

  const socialItems = SOCIALS.filter(s => hrefs?.[s.key]);
  const supportLabels = new Set(selectedTopic ? [selectedTopic] : selectedSummary === 'main' ? [...(evidence?.coreSignals||[]),...(evidence?.coreConcerns||[])].map(s=>s.label) : selectedSummary === 'good' ? otherGood.map(s=>s.label) : selectedSummary === 'vibe' ? (evidence?.vibeSignals||[]).map(s=>s.label) : currentWarnings.map(s=>s.label));
  const supportingReviews = config.reviews.filter(r=>r.signals.some(s=>supportLabels.has(s.label))).slice(0,2);

  return (
    <div className="screen">
      <div className="hero">
        <img src={heroPhoto} alt={realHero ? config.name : copy('Category illustration')} className="hero-img" onError={() => { if (realHero) setFailedPhotos(previous => [...previous, realHero]); }} />
        <div className="hero-scrim" />
        {!realHero && <span className="hero-illustration">{copy('Category illustration')}</span>}
        <button className="icon-btn back" aria-label="Back" onClick={handleBack}>‹</button>
        <div className="hero-text">
          <span className="type-pill">{config.type}</span>
          <h1 className="name">{config.name}</h1>
          <p className="meta">{config.meta}{config.openLine && <> · <span className="open">{config.openLine}</span></>}</p>
        </div>
      </div>

      <div className="sheet">
        {config.demo && <DemoBanner />}
        <nav className="quickbar" aria-label="Place actions">
          <div className="bar-scroll">
            {([
              ['phone','Phone','phone'],['address','Address','map'],['website','Website','website'],
              ['directions','Directions','directions'],['menu','Menu','menu'],['reservation','Reserve','book'],['order','Order','order'],
              ['ecard','eCard','ecard'],
            ] as const).filter(([key])=>!!hrefs?.[key]).map(([key,label,icon])=><a className="bi" key={key} href={hrefs![key]} target={hrefs![key].startsWith('http')?'_blank':undefined} rel={hrefs![key].startsWith('http')?'noopener noreferrer':undefined} aria-label={label}>
              <span className="bi-ic"><Glyph name={icon} color={t.text} size={23}/></span><span className="bi-lbl">{label}</span>
            </a>)}
            <button className="bi" type="button" onClick={sharePlace} aria-label="Share place"><span className="bi-ic"><Glyph name="share" color={t.text} size={23}/></span><span className="bi-lbl">Share</span></button>
            {onSave && <button className="bi" type="button" onClick={onSave} aria-label={saved?'Remove saved place':'Save place'} aria-pressed={!!saved}><span className="bi-ic"><Glyph name="save" color={saved?'#E24A72':t.text} size={23}/></span><span className="bi-lbl">{saved?'Saved':'Save'}</span></button>}
          </div>
          {shareMessage && <span role="status" className="share-status">{shareMessage}</span>}
          {saveMessage && <span role="status" className="share-status">{saveMessage}</span>}
        </nav>
        <section className="review-summary" aria-label="Tavvy review summary">
          <div className="section-head"><h2 className="section-title">{copy('Reviews')}</h2></div>
          <PlaceReviewGrid mode="full" summary={buildPlaceReviewSummary(evidence, reviewSubject)} selectedTopic={selectedTopic} onSelect={(section, topic) => { setSelectedSummary(section); setSelectedTopic(topic.label); }} />
          {selectedSummary && !unavailable && <div className="summary-detail">
            <div className="section-head"><strong>{selectedTopic || summaryTiles.find(tile => tile.key === selectedSummary)?.title}</strong><button type="button" className="text-link" onClick={() => {setSelectedSummary(null);setSelectedTopic(null);}}>{copy("All experiences")}</button></div>
            {!supportingReviews.length && <p>{copy('No matching experiences in the recent preview. Open all reviews to explore the history.')}</p>}
            {supportingReviews.length > 0 && <><h3 className="support-title">Recent reviews mentioning this</h3>{supportingReviews.map((r,i)=><Reviewer key={r.id||i} r={r} allowSafety={!config.demo}/>)}</>}
            {config.reviewsHref && <a className="text-link" href={config.reviewsHref}>See all reviews →</a>}
          </div>}
        </section>

        {activeTab === 'overview' && config.overviewContent}

        <nav className="place-tabs" aria-label="Place sections">
          {availableTabs.map(tab => tab === 'menu' && fullMenuHref
            ? <a key={tab} className="place-tab" href={fullMenuHref}>{config.type === 'Hotel' ? 'Rooms' : 'Tavvy Menu'}</a>
            : <button key={tab} type="button" className={activeTab === tab ? 'place-tab selected' : 'place-tab'} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => selectTab(tab)}>{tab === 'media' ? 'Photos & Stories' : tab === 'menu' && config.type === 'Hotel' ? 'Rooms' : tab[0].toUpperCase() + tab.slice(1)}</button>)}
        </nav>

        {activeTab === 'overview' && <div className="section overview-reviews">
          <div className="section-head"><h2 className="section-title">Recent reviews</h2><span className="section-sub">{config.reviewsSub}</span></div>
          {config.reviewsStatus === 'unavailable' ? <p className="review-note" role="status">Reviews could not be loaded. Please try again later.</p> : config.reviews.length > 0 ? (showAllDemoReviews && !config.reviewsHref ? config.reviews : config.reviews.slice(0, 2)).map((review, i) => <Reviewer key={i} r={review} allowSafety={!config.demo} />) : <p className="review-note">No reviews yet. Be the first to share what you experienced.</p>}
          {config.reviewsHref ? <a className="more" href={config.reviewsHref}>See all reviews →</a> : config.reviews.length > 2 && <button className="more" onClick={() => setShowAllDemoReviews(value => !value)}>{showAllDemoReviews ? 'Show fewer reviews' : 'See all reviews'}</button>}
        </div>}

        {activeTab === 'media' && <div className="media-section" id="demo-photos">
          <div className="section-head"><span className="section-title">{config.mediaHeading || 'See the food & vibe'}</span></div>
          {config.photosStatus==='unavailable'?<p className="review-note" role="status">Photos could not be loaded. Please try again later.</p>:!hasMedia && <p className="review-note">{config.mediaEmptyMessage || 'No photos or stories to show. Share a first look at this place.'}</p>}
          <div className="media-scroll">
            {(config.gallery || []).slice(0, 6).map((url, i) => <figure key={`${url}-${i}`}><button className="media-open" onClick={() => setSelectedMedia({ url, type: 'image', caption: `Place photo ${i + 1}` })}><img src={url} alt={`${config.name} photo ${i + 1}`} /></button><figcaption>Place photo</figcaption>{!config.demo && config.photoEntries?.find(photo=>photo.url===url)?.id && <ContentSafetyActions kind="place_photo" contentId={config.photoEntries.find(photo=>photo.url===url)!.id}/>}</figure>)}
            {(config.stories || []).map(story => <figure key={story.id}>
              {!config.demo&&<ContentSafetyActions kind="story" contentId={story.id}/>}

              <button className="media-open" onClick={() => setSelectedMedia({ url: story.media_url, type: story.media_type, caption: story.caption || 'Place story' })}>{story.media_type === 'video' ? <video src={story.media_url} preload="metadata" /> : <img src={story.media_url} alt={story.caption || `${config.name} story`} />}</button>
              <figcaption>{story.story_kind==='owner_highlight'?'From the restaurant':'Guest story'} · {new Date(story.created_at).toLocaleDateString()}{story.caption ? ` · ${story.caption}` : ''}</figcaption>
            </figure>)}
          </div>
          {hrefs?.story && <a className="more" href={hrefs.story}>Add your story →</a>}
          {config.mediaNotice && <p className="review-note">{config.mediaNotice}</p>}
        </div>}

        {activeTab === 'details' && config.detailsContent}
        {activeTab === 'details' && <div className="divider" />}
        {activeTab === 'details' && <div className="section">
          <div className="tp-head"><span className="tp-badge">✦ Tavvy Places</span></div>
          {config.description && <p className="about">{config.description}</p>}

        </div>}

        {activeTab === 'details' && config.extras?.map((ex, i) => (
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

        {activeTab === 'menu' && config.demoMenu && <div className="section" id="demo-menu">
          <div className="section-head"><span className="section-title">Menu</span></div>
          {config.demoMenu.map(item => <div className="demo-menu-row" key={item.name}><div><strong>{item.name}</strong><p>{item.description}</p></div><b>{item.price}</b></div>)}
        </div>}
        {activeTab === 'details' && config.demoCard && <div className="section demo-ecard" id="demo-ecard">
          <div className="section-head"><span className="section-title">eCard</span></div>
          <h3>{config.name}</h3><p>{config.demoCard.tagline}</p>
          <p>{config.demoCard.hours}</p><small>{config.demoCard.contact}</small>
          {config.demoCardHref && <p><a href={config.demoCardHref} style={{ color: '#00AAB4', fontWeight: 700 }}>Open eCard →</a></p>}
        </div>}
        {activeTab === 'details' && <div className="section">
          <h2 className="section-title">Visit & contact</h2>
          <div className="contact-actions">
            {!config.detailsContent && [['phone',hrefs?.phone?.replace(/^tel:/,'')||'Call'],['website','Website'],['directions','Directions'],['reservation','Reserve a table'],['order','Order at your table']].filter(([key])=>hrefs?.[key]).map(([key,label])=><a key={key} href={hrefs![key]} target={hrefs![key].startsWith('http')?'_blank':undefined} rel="noopener noreferrer">{label} ↗</a>)}
            {hrefs?.ecard && <a href={hrefs.ecard}>Restaurant eCard →</a>}
            <button onClick={sharePlace}>{shareMessage || 'Share this place'}</button>
          </div>
          {!config.detailsContent && <div className="demo-links">{socialItems.map(item=><a key={item.key} href={hrefs![item.key]} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</div>}
          {!config.demo && Object.keys(config.deliveryLinks||{}).length>0 && <><h3>Order delivery</h3><div className="demo-links">{deliveryPlatforms.filter(p=>config.deliveryLinks?.[p.key]).map(p=><a key={p.key} href={config.deliveryLinks![p.key]} target="_blank" rel="noopener noreferrer">{p.label} ↗</a>)}</div></>}
          {hrefs?.owner && <p><a className="text-link" href={hrefs.owner}>Manage or claim this place →</a></p>}
        </div>}

        {activeTab === 'details' && <div className="divider" />}
        {activeTab === 'details' && <div className="section">
          <h2 className="section-title">Location & hours</h2>
          <div className="info">
            {config.info.filter(r=>!r.href?.startsWith('tel:')).map((r, i) => {
              const content = <>
                <span className="info-ic">{r.icon}</span>
                <span className="info-mid">
                  <span className="info-main">{r.main}</span>
                  {r.hours && hoursOpen === i && <span className="hours">{r.hours.map(([d, h], j) => <span className="hr" key={j}><span>{d}</span><span>{h}</span></span>)}</span>}
                </span>
                {r.act && <span className="info-act">{r.act}</span>}
                {r.hours && <span className={`chev ${hoursOpen === i ? 'up' : ''}`}>⌄</span>}
              </>;
              return r.href ? <a className="info-row" href={r.href} key={i} target={r.href.startsWith('http') ? '_blank' : undefined} rel={r.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{content}</a>
                : r.hours ? <button className="info-row" key={i} onClick={() => setHoursOpen(o => o === i ? null : i)}>{content}</button>
                : <div className="info-row static" key={i}>{content}</div>;
            })}
          </div>
        </div>}

      </div>
      {selectedMedia && <div ref={mediaDialogRef} className="media-modal" role="dialog" aria-modal="true" aria-label={selectedMedia.caption} onClick={() => setSelectedMedia(null)}>
        <button className="media-close" onClick={() => setSelectedMedia(null)} aria-label="Close media">×</button>
        <div onClick={event => event.stopPropagation()}>{selectedMedia.type === 'video' ? <video src={selectedMedia.url} controls autoPlay playsInline /> : <img src={selectedMedia.url} alt={selectedMedia.caption} />}<p>{selectedMedia.caption}</p></div>
      </div>}

      <div className="actionbar">
        {hasMenu && <button className="act ghost" onClick={()=>selectTab('menu')}>{config.type === 'Hotel' ? 'Rooms' : 'Tavvy Menu'}</button>}
        <button className="act primary" onClick={onAddReview} disabled={!!config.reviewDisabledReason || !onAddReview} aria-describedby={config.reviewDisabledReason ? 'review-disabled-reason' : undefined}>Add a review</button>
        {config.reviewDisabledReason && <small id="review-disabled-reason" role="status">{config.reviewDisabledReason}</small>}
      </div>

      <style jsx>{`
        .contact-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:14px 0; }
        .contact-actions a,.contact-actions button { padding:14px; min-height:44px; border:1px solid ${t.border}; border-radius:12px; color:${t.text}; background:${t.soft}; text-decoration:none; font:inherit; font-size:14px; text-align:left; }
        .text-link { color:${t.isDark ? '#4DDDE2' : '#00666C'}; font-weight:700; }
        .support-title { font-size:14px; margin-top:20px; }
        .screen :focus-visible { outline:3px solid #8A05BE; outline-offset:3px; }
        .screen { max-width: 480px; margin: 0 auto; min-height: 100vh; background: ${t.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; padding-bottom: 92px; }
        .hero { position: relative; width: 100%; height: 33vh; min-height: 232px; }
        .hero:has(.hero-fallback) { height: 210px; min-height: 210px; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-illustration { position:absolute;top:20px;inset-inline-end:16px;max-width:65%;padding:5px 8px;border-radius:7px;background:rgba(0,0,0,.65);color:white;font-size:11px; }
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
        .review-summary { padding: 18px 0 5px; }
        .summary-tile { min-height: 120px; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; text-align: left; border: 1px solid ${t.border}; background: ${t.soft}; color: ${t.text}; border-radius: 16px; padding: 13px; cursor: pointer; font: inherit; }
        .summary-tile.main { border-color: rgba(0,194,203,.42); background: rgba(0,194,203,.10); }
        .summary-tile.headsup { border-color: rgba(245,166,35,.42); background: rgba(245,166,35,.10); }
        .summary-tile.selected { outline: 2px solid #8A05BE; outline-offset: 1px; }
        .summary-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: ${t.text2}; }
        .summary-title span { font-size: 18px; }
        .summary-tile strong { font-size: 15px; line-height: 1.2; }
        .summary-tile small { color: ${t.text2}; font-size: 13px; line-height: 1.35; }
        .summary-detail { margin-top: 11px; padding: 15px; border: 1px solid ${t.border}; border-radius: 14px; background: ${t.softer}; color: ${t.text}; }
        .summary-detail p { margin: 8px 0; font-size: 14px; line-height: 1.45; }
        .summary-detail small { color: ${t.text2}; }
        .place-tabs { display: flex; overflow-x: auto; gap: 0; justify-content: space-between; margin: 18px -20px 0; padding: 0 20px; border-bottom: 1px solid ${t.border}; scrollbar-width: none; position: sticky; top: 0; z-index: 5; background: ${t.sheet}; }
        .place-tabs::-webkit-scrollbar { display: none; }
        .place-tab { flex: 0 1 auto; padding: 13px 2px 11px; border: 0; border-bottom: 3px solid transparent; background: none; color: ${t.text2}; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .place-tab.selected { color: ${t.text}; border-bottom-color: #8A05BE; }
        .overview-buttons { display: grid; gap: 9px; margin-top: 14px; }
        .overview-review-title { color: ${t.text}; font-size: 16px; margin: 18px 0 8px; }
        .overview-buttons button, .overview-buttons a { text-align: left; border: 1px solid ${t.border}; background: ${t.soft}; color: ${t.text}; padding: 13px 14px; border-radius: 12px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
        .demo-banner { padding: 10px 12px; margin-bottom: 12px; border-radius: 10px; background: #FFF0C9; color: #573500; font-size: 11px; font-weight: 800; }
        .decision { margin: 16px 0 8px; padding: 18px; background: ${t.soft}; border: 1px solid ${t.border}; border-radius: 18px; }
        .decision .eyebrow { color: #00A6AE; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
        .decision h2 { margin: 5px 0 8px; color: ${t.text}; font-size: 23px; }
        .decision p { margin: 0 0 9px; color: ${t.text}; font-size: 15px; line-height: 1.45; }
        .decision .core-concerns { color: #A86500; font-weight: 700; }
        .decision small { color: ${t.text2}; font-size: 12px; }
        .decision-line { display: flex; flex-direction: column; gap: 3px; padding-top: 12px; margin-top: 12px; border-top: 1px solid ${t.divider}; color: ${t.text}; font-size: 14px; }
        .decision-line strong { color: ${t.text2}; font-size: 12px; }
        .media-section { padding: 18px 0 5px; }
        .media-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
        .media-scroll figure { flex: 0 0 164px; margin: 0; }
        .media-open { border: 0; padding: 0; background: none; cursor: pointer; }
        .media-scroll img, .media-scroll video { width: 164px; height: 120px; object-fit: cover; border-radius: 12px; background: ${t.soft}; }
        .media-scroll figcaption { font-size: 11px; color: ${t.text2}; margin-top: 5px; }
        .media-modal { position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,.92); display: flex; align-items: center; justify-content: center; padding: 18px; color: white; }
        .media-modal > div { max-width: 900px; width: 100%; text-align: center; }
        .media-modal img, .media-modal video { max-width: 100%; max-height: 76vh; object-fit: contain; }
        .media-close { position: absolute; top: 16px; right: 18px; border: none; background: transparent; color: white; font-size: 34px; }
        .demo-menu-row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid ${t.divider}; color: ${t.text}; }
        .demo-menu-row p { margin: 4px 0 0; font-size: 12px; color: ${t.text2}; }
        .demo-ecard { padding: 18px; border: 1px solid #8A05BE; border-radius: 18px; background: ${t.soft}; color: ${t.text}; }
        .demo-ecard h3 { margin: 4px 0; font-size: 22px; }
        .demo-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .demo-links a, .demo-links button { color: #00AAB4; font-size: 13px; padding: 7px 10px; border: 1px solid #00AAB4; border-radius: 20px; text-decoration: none; background: transparent; cursor: pointer; }
        .quickbar { margin: 0 -20px; padding: 14px 20px 16px; border-bottom: 1px solid ${t.divider}; }
        .bar-scroll { display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; }
        .bar-scroll::-webkit-scrollbar { display: none; }
        .bi { flex: 0 0 auto; width: 68px; display: flex; flex-direction: column; align-items: center; gap: 7px; background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; }
        .bi-ic { width: 50px; height: 50px; border-radius: 50%; background: ${t.pillBg}; display: flex; align-items: center; justify-content: center; }
        .bi-lbl { font-size: 11px; font-weight: 600; color: ${t.text2}; white-space: nowrap; }
        .share-status { display:block; margin-top:8px; font-size:12px; color:${t.text2}; }
        .section { padding: 16px 0 16px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
        .section-title { font-size: 19px; font-weight: 800; color: ${t.text}; letter-spacing: -0.2px; }
        .section-sub { font-size: 12.5px; font-weight: 600; color: ${t.text2}; }
        .review-note { font-size: 12.5px; color: ${t.text2}; margin: 0 0 14px; line-height: 1.4; }
        .learn { color: ${t.isDark ? '#3FE0E8' : '#00858C'}; font-weight: 700; text-decoration: none; }
        .grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
        .more { width: 100%; margin-top: 14px; padding: 13px 0; border-radius: 12px; border: 1px solid ${t.border}; background: ${t.softer}; color: ${t.text}; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
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
        .actionbar { z-index: 20; position: fixed; left: 0; right: 0; bottom: 0; max-width: 480px; margin: 0 auto; display: flex; gap: 12px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: ${t.isDark ? 'rgba(18,18,24,0.96)' : 'rgba(255,255,255,0.96)'}; backdrop-filter: blur(10px); border-top: 1px solid ${t.divider}; }
        .act { flex: 1; padding: 15px 0; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; text-align: center; }
        .act.primary:disabled { color: ${t.text2}; background: ${t.soft}; box-shadow: none; cursor: not-allowed; }
        .act.ghost { background: ${t.pillBg}; color: ${t.text}; }
        .act.primary { background: #8A05BE; color: #fff; box-shadow: 0 6px 18px rgba(138,5,190,0.22); }
      `}</style>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: ${t.bg}; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
