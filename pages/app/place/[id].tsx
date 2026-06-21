/**
 * Place detail — the live page, now rendered with the agreed signal-review design
 * (same as /preview/signal-spectrum), wired to real data via /api/place/[id].
 * Replaces the old tabbed page; Menu/Order/Directions survive as real action links.
 */
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import PlaceScreen, { PlaceConfig, Cat } from '../../../components/PreviewPlace';

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
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

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
      <PlaceScreen config={config} hrefs={hrefs} />
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', color: '#6b6880', background: '#fff' }}>
      {children}
    </div>
  );
}
