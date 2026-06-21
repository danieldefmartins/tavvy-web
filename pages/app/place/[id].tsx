/**
 * Place detail — the live page, now rendered with the agreed signal-review design
 * (same as /preview/signal-spectrum), wired to real data via /api/place/[id].
 * Replaces the old tabbed page; Menu/Order/Directions survive as real action links.
 */
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import PlaceScreen, { PlaceConfig, Cat } from '../../../components/PreviewPlace';
import { useAuth } from '../../../contexts/AuthContext';

const TYPE_LABEL: Record<string, string> = {
  restaurants: 'Restaurant', restaurant: 'Restaurant', hotels: 'Hotel', hotel: 'Hotel',
  pros: 'Service', realtors: 'Realtor', on_the_go: 'On The Go', atlas: 'Travel',
  cities: 'City', rv_camping: 'Camping', attraction: 'Attraction',
};

function normUrl(u?: string) {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default function PlaceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showAuth, setShowAuth] = useState(false);
  const [saved, setSaved] = useState(false);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/app/map');
  };
  const onSave = () => {
    if (!user) { setShowAuth(true); return; }
    setSaved(s => !s); // TODO: persist saved place for signed-in users
  };
  const redirectTo = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';

  useEffect(() => {
    if (!id) return;
    setState('loading');
    fetch(`/api/place/${encodeURIComponent(String(id))}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setState('ready'); })
      .catch(() => setState('error'));
  }, [id]);

  if (state === 'loading') return <Centered>Loading…</Centered>;
  if (state === 'error' || !data?.place) return <Centered>Place not found.</Centered>;

  const p = data.place;
  const g = data.groups || { good: [], vibe: [], headsup: [] };
  const pid = encodeURIComponent(String(p.id));

  const groups: { key: Cat; items: any[] }[] = (['good', 'vibe', 'headsup'] as Cat[])
    .map(k => ({ key: k, items: (g[k] || []) }))
    .filter(grp => grp.items.length > 0);

  // Quick-action row from what the place actually has.
  const actions: { key: string; label: string }[] = [];
  if (p.phone) actions.push({ key: 'phone', label: 'Call' });
  if (p.website) actions.push({ key: 'website', label: 'Website' });
  if (p.category === 'restaurants' || p.category === 'restaurant') actions.push({ key: 'menu', label: 'Menu' });
  if (p.ordering_enabled) actions.push({ key: 'order', label: 'Order' });
  actions.push({ key: 'share', label: 'Share' });

  const meta = [p.subcategory || TYPE_LABEL[p.category] || 'Place', p.city, p.region].filter(Boolean).join(' · ');
  const directions = p.latitude && p.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.street, p.city, p.region].filter(Boolean).join(' '))}`;

  const config: PlaceConfig = {
    type: TYPE_LABEL[p.category] || 'Place',
    name: p.name,
    photo: p.cover_image_url || (p.photos && p.photos[0]) || '',
    meta,
    openLine: '',
    reviewsSub: `${data.totalTaps || 0} signals · ${data.reviewCount || 0} reviews`,
    actions,
    groups,
    description: p.description || undefined as any,
    popularLabel: 'Top signals',
    popular: (g.good || []).slice(0, 4).map((s: any) => s.label),
    info: [
      ...(p.street || p.city ? [{ icon: '📍', main: [p.street, p.city, p.region].filter(Boolean).join(', '), act: 'Directions' }] : []),
      ...(p.phone ? [{ icon: '📞', main: p.phone }] : []),
      { icon: '🏷️', main: [TYPE_LABEL[p.category] || 'Place', p.subcategory].filter(Boolean).join(' · ') },
    ],
    reviews: [],
    cta: 'Add Review',
  };

  const hrefs: Record<string, string> = {};
  if (p.phone) hrefs.phone = `tel:${String(p.phone).replace(/[^0-9+]/g, '')}`;
  if (normUrl(p.website)) hrefs.website = normUrl(p.website)!;
  if (p.whatsapp) hrefs.whatsapp = `https://wa.me/${String(p.whatsapp).replace(/[^0-9]/g, '')}`;
  if (normUrl(p.instagram)) hrefs.instagram = normUrl(p.instagram)!;
  if (normUrl(p.tiktok)) hrefs.tiktok = normUrl(p.tiktok)!;
  if (normUrl(p.youtube)) hrefs.youtube = normUrl(p.youtube)!;
  if (normUrl(p.facebook)) hrefs.facebook = normUrl(p.facebook)!;
  hrefs.menu = `/place/${pid}/menu`;
  if (p.ordering_enabled) hrefs.order = `/place/${pid}/order`;
  hrefs.directions = directions;
  // This place hasn't claimed a Tavvy eCard yet — tapping eCard sells the free
  // eCard with the place's name for context. (When places link real cards, branch here.)
  hrefs.ecard = `/ecard?for=${encodeURIComponent(p.name || '')}`;

  return (
    <>
      <Head>
        <title>{p.name} — Tavvy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PlaceScreen config={config} hrefs={hrefs} onBack={goBack} onSave={onSave} />
      {showAuth && (
        <div style={overlay} onClick={() => setShowAuth(false)}>
          <div style={sheet} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🔖</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#fff' }}>Save {p.name}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
              Create a free Tavvy account to save places, leave signals, and build your list.
            </p>
            <a href={`/app/signup?redirect=${redirectTo}`} style={{ ...btn, background: '#00C2CB', color: '#06121a' }}>Sign up — it&apos;s free</a>
            <a href={`/app/login?redirect=${redirectTo}`} style={{ ...btn, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>Log in</a>
            <button onClick={() => setShowAuth(false)} style={{ ...btn, background: 'none', color: 'rgba(255,255,255,0.5)', border: 'none', fontWeight: 600 }}>Not now</button>
          </div>
        </div>
      )}
    </>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' };
const sheet: React.CSSProperties = { width: '100%', maxWidth: 480, background: '#1b1b24', borderRadius: '22px 22px 0 0', padding: '26px 22px calc(26px + env(safe-area-inset-bottom))', textAlign: 'center', fontFamily: '-apple-system, sans-serif', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' };
const btn: React.CSSProperties = { display: 'block', width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 10, cursor: 'pointer' };

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#6b6880', background: '#fff' }}>
      {children}
    </div>
  );
}
