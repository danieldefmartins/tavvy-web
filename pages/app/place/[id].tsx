/**
 * Place detail — the live page, now rendered with the agreed signal-review design
 * (same as /preview/signal-spectrum), wired to real data via /api/place/[id].
 * Replaces the old tabbed page; Menu/Order/Directions survive as real action links.
 */
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import type { PlaceShareMetadata } from '../../../lib/placeShareMetadata';
import { fetchPlaceShareMetadata } from '../../../lib/placeShareLookup';
import { placeShareUrl } from '../../../lib/placeShare';
import PlaceScreen, { PlaceConfig, Cat } from '../../../components/PreviewPlace';
import {contentSafetyHeaders} from '../../../lib/contentSafety';
import {CONTENT_SAFETY_CHANGED} from '../../../components/ContentSafetyActions';
import OnTheGoStatus from '../../../components/OnTheGoStatus';
import { useAuth } from '../../../contexts/AuthContext';
import AddReviewSheet from '../../../components/AddReviewSheet';
import { supabase } from '../../../lib/supabaseClient';

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const AVATAR_COLORS = ['#00C2CB', '#8A05BE', '#F5A623', '#667EEA', '#EF4444'];

const TYPE_LABEL: Record<string, string> = {
  restaurants: 'Restaurant', restaurant: 'Restaurant', hotels: 'Hotel', hotel: 'Hotel',
  pros: 'Service', realtors: 'Realtor', on_the_go: 'On The Go', atlas: 'Travel',
  cities: 'City', rv_camping: 'Camping', attraction: 'Attraction',
};

function normUrl(u?: string) {
  if (!u) return undefined;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default function PlaceDetail({ placeShare }: { placeShare: PlaceShareMetadata | null }) {
  return <PlaceDetailContent resolvedPlaceId={placeShare?.id} />;
}

function PlaceDetailContent({resolvedPlaceId}:{resolvedPlaceId?:string}) {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [ecardSlug, setEcardSlug] = useState<string | null>(null);
  const [hasActiveMenu, setHasActiveMenu] = useState(false);
  const redirectTo = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';

  const requestId = useRef(0);
  const load = (showSpinner = true) => {
    const request = ++requestId.current;
    if (!id) return;
    if (showSpinner) setState('loading');
    contentSafetyHeaders().then(headers=>fetch(`/api/place/${encodeURIComponent(resolvedPlaceId || String(id))}`,{headers}))
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if(request!==requestId.current)return; setData(d); setState('ready'); })
      .catch(() => {if(request===requestId.current)setState('error')});
  };
  useEffect(() => { load(); const changed=()=>load(false);window.addEventListener(CONTENT_SAFETY_CHANGED,changed);return()=>{++requestId.current;window.removeEventListener(CONTENT_SAFETY_CHANGED,changed)}; /* eslint-disable-next-line */ }, [id, resolvedPlaceId, user?.id]);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/app/map');
  };
  const placeUuid = data?.place?.id && isUuid(String(data.place.id)) ? String(data.place.id) : null;

  // Load the initial Save-heart state for signed-in users.
  useEffect(() => {
    if (!user || !placeUuid) { setSaved(false); return; }
    let cancelled = false;
    supabase
      .from('saved_places')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', placeUuid)
      .maybeSingle()
      .then(({ data: row }) => { if (!cancelled) setSaved(!!row); });
    return () => { cancelled = true; };
  }, [user, placeUuid]);

  // If this place already has a claimed, published eCard, the eCard tile should
  // open that card instead of the free-eCard upsell.
  useEffect(() => {
    if (!placeUuid) { setEcardSlug(null); return; }
    let cancelled = false;
    supabase
      .from('digital_cards')
      .select('slug')
      .eq('place_id', placeUuid)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle()
      .then(({ data: card }) => { if (!cancelled) setEcardSlug(card?.slug || null); });
    return () => { cancelled = true; };
  }, [placeUuid]);

  useEffect(() => {
    if (!placeUuid) { setHasActiveMenu(false); return; }
    let cancelled = false;
    supabase.from('menus').select('id').eq('place_id', placeUuid).eq('is_active', true).limit(1).maybeSingle()
      .then(({ data: menu }) => { if (!cancelled) setHasActiveMenu(!!menu); });
    return () => { cancelled = true; };
  }, [placeUuid]);

  const onSave = async () => {
    // Not signed in → send to the sign in / sign up page (returns here after).
    if (!user) { router.push(`/app/login?redirect=${redirectTo}`); return; }
    if (!placeUuid) { setSaved(s => !s); return; } // FSQ-only places can't be saved yet
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) {
        const { error } = await supabase
          .from('saved_places')
          .insert({ user_id: user.id, place_id: placeUuid });
        if (error && error.code !== '23505') throw error; // ignore already-saved
      } else {
        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('user_id', user.id)
          .eq('place_id', placeUuid);
        if (error) throw error;
      }
    } catch (e) {
      console.error('[place] save toggle failed:', e);
      setSaved(!next); // roll back
    }
  };
  const onAddReview = () => {
    if (!user) { router.push(`/app/login?redirect=${redirectTo}`); return; }
    setReviewOpen(true);
  };

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
  if (hasActiveMenu) actions.push({ key: 'menu', label: 'Menu' });
  if (p.ordering_enabled) actions.push({ key: 'order', label: 'Order' });
  actions.push({ key: 'story', label: 'Add Story' });
  actions.push({ key: 'share', label: 'Share' });

  const meta = [p.subcategory || TYPE_LABEL[p.category] || 'Place', p.city, p.region].filter(Boolean).join(' · ');
  const directions = p.latitude && p.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.name, p.street, p.city, p.region].filter(Boolean).join(' '))}`;

  const hoursPairs: [string, string][] = (p.hoursList || []).map((h: any) => [h.day, h.range]);
  const recentReviews = (data.recentReviews || []).map((r: any, i: number) => ({
    initial: r.initial || (r.name || 'T')[0], color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    id: r.id, text: r.text, createdAt: r.createdAt, dateSource:r.dateSource, isEdit:r.isEdit, name: r.name, when: r.when, signals: r.signals || [],
  }));
  // The route marker only requests a lookup. The server independently verifies
  // the canonical place association before returning a mobile business.
  const showMobileStatus = (typeof router.query.mobile === 'string' && isUuid(router.query.mobile))
    || [p.category, p.subcategory, p.place_type].some(value => /\b(on the go|food trucks?|mobile)\b/i.test(String(value || '').replace(/[_-]/g, ' ')));

  const config: PlaceConfig = {
    type: TYPE_LABEL[p.category] || 'Place',
    reviewSubject: { category: p.category, subcategory: p.subcategory },
    name: p.name,
    photo: p.cover_image_url || (p.gallery && p.gallery[0]) || (p.photos && p.photos[0]) || '',
    meta,
    openLine: p.openLine || '',
    reviewsSub: `${data.reviewCount || 0} reviews`,
    actions,
    groups,
    description: p.description || undefined as any,
    popularLabel: 'Top signals',
    popular: (g.good || []).slice(0, 4).map((s: any) => s.label),
    info: [
      ...(p.street || p.city ? [{ icon: '📍', main: [p.street, p.city, p.region].filter(Boolean).join(', '), act: 'Directions', href: directions }] : []),
      ...(p.openLine || hoursPairs.length ? [{ icon: '🕐', main: p.openLine || 'Hours', hours: hoursPairs.length ? hoursPairs : undefined }] : []),
      ...(p.phone ? [{ icon: '📞', main: p.phone, href: `tel:${String(p.phone).replace(/[^0-9+]/g, '')}` }] : []),
      { icon: '🏷️', main: [TYPE_LABEL[p.category] || 'Place', p.subcategory].filter(Boolean).join(' · ') },
    ],
    reviews: recentReviews,
    reviewsStatus: data.recentReviewsStatus,
    cta: 'Add Review',
    evidence: data.evidence,
    gallery: p.gallery || [],
    stories: data.stories || [],
    photoEntries: data.photoEntries || [],
    photosStatus: data.photosStatus,
    reviewsHref: `/app/place/${pid}/reviews`,
    deliveryLinks: data.deliveryLinks || {},
    overviewContent: placeUuid && showMobileStatus ? <OnTheGoStatus canonicalPlaceId={placeUuid} /> : undefined,
  };

  const hrefs: Record<string, string> = {};
  if (p.phone) hrefs.phone = `tel:${String(p.phone).replace(/[^0-9+]/g, '')}`;
  if (normUrl(p.website)) hrefs.website = normUrl(p.website)!;
  if (p.whatsapp) hrefs.whatsapp = `https://wa.me/${String(p.whatsapp).replace(/[^0-9]/g, '')}`;
  if (normUrl(p.instagram)) hrefs.instagram = normUrl(p.instagram)!;
  if (normUrl(p.tiktok)) hrefs.tiktok = normUrl(p.tiktok)!;
  if (normUrl(p.youtube)) hrefs.youtube = normUrl(p.youtube)!;
  if (normUrl(p.facebook)) hrefs.facebook = normUrl(p.facebook)!;
  if (hasActiveMenu) hrefs.menu = `/place/${pid}/menu`;
  hrefs.story = `/app/add-story?placeId=${pid}&placeName=${encodeURIComponent(p.name || '')}`;
  if (p.ordering_enabled) hrefs.order = `/place/${pid}/order`;
  hrefs.directions = directions;
  if (ecardSlug) hrefs.ecard = `/${encodeURIComponent(ecardSlug)}`;
  hrefs.owner = `/app/business/claim?placeId=${pid}`;
  hrefs.share = placeShareUrl(p.id);

  return (
    <>
      <Head>
        <title>{p.name} — Tavvy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PlaceScreen config={config} hrefs={hrefs} onBack={goBack} onSave={onSave} onAddReview={onAddReview} saved={saved} />
      <AddReviewSheet
        placeId={p.id}
        placeName={p.name}
        category={p.category}
        subcategory={p.subcategory}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmitted={() => load(false)}
      />
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

export const getServerSideProps: GetServerSideProps = async ({params,res}) => {
  const identifier=typeof params?.id==='string'?params.id:'';
  if(identifier==='demo-trattoria')return {redirect:{destination:'/app/demo/restaurant',permanent:false}};
  const result=await fetchPlaceShareMetadata(identifier);
  res.setHeader('Cache-Control',result.status==='ready'?'public, max-age=0, s-maxage=300, stale-while-revalidate=3600':'no-store');
  if(result.status==='missing')res.statusCode=404;
  if(result.status==='unavailable')res.statusCode=503;
  return {props:{placeShare:result.metadata}};
};
