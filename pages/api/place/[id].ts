import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchPlaceEvidence } from '../../../lib/placeEvidenceService';
import { contentViewer } from '../../../lib/contentSafetyServer';
import { parseHours, openLineFrom } from '../../../lib/placeHours';
import {loadCruiseVenueContext,CruiseVenueReadError} from '../../../lib/cruises/venueContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// bucket (stored on aggregates) -> Tavvy category
const BUCKET: Record<string, 'good' | 'vibe' | 'headsup'> = {
  positive: 'good', neutral: 'vibe', negative: 'headsup',
};

// review_items.signal_type -> Tavvy category (taps carry no bucket of their own)
const SIGNAL_TYPE_CAT: Record<string, 'good' | 'vibe' | 'headsup'> = {
  best_for: 'good', vibe: 'vibe', heads_up: 'headsup',
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// "2026-05-29T..." or Date -> "2 days ago" style relative string
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  const w = Math.floor(d / 7);
  if (d < 30) return `${w} week${w === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (d < 365) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader('Vary','Authorization');
  const {client:viewer,error:authError}=await contentViewer(req);
  if(authError)return res.status(401).json({error:'Please sign in again to load your review feed.'});
  // Links across the app use several id forms: raw uuid, slug, tavvy:<uuid>, places-<uuid>, fsq-<id>, fsq:<id>
  const rawId = String(req.query.id || '');
  const isFsq = /^fsq[-:]/.test(rawId);
  const raw = rawId.replace(/^(tavvy:|places-|fsq[-:])/, '');
  if (!raw) return res.status(400).json({ error: 'missing id' });

  try {
    // FSQ (Foursquare) places aren't in the Tavvy `places` table — resolve them
    // from fsq_places_raw and render with no signals ("Be the first").
    if (isFsq || (!isUuid(raw) && /^[0-9a-f]{24}$/i.test(raw))) {
      const { data: f } = await supabase.from('fsq_places_raw').select('*').eq('fsq_place_id', raw).maybeSingle();
      if (f) {
        const rawCat = Array.isArray(f.fsq_category_labels) ? f.fsq_category_labels[0] : f.fsq_category_labels;
        const cat = rawCat ? String(rawCat).replace(/[\[\]']/g, '').split('>')[0].trim() : 'Place';
        return res.status(200).json({
          place: {
            id: rawId, name: f.name, category: cat, subcategory: undefined,
            street: f.address, city: f.locality, region: f.region, country: f.country,
            phone: f.tel, website: f.website, email: f.email,
            cover_image_url: null, photos: null, description: null,
            latitude: f.latitude, longitude: f.longitude,
          },
          groups: { good: [], vibe: [], headsup: [] }, totalTaps: 0, reviewCount: 0,
        });
      }
      return res.status(404).json({ error: 'not found' });
    }

    // Resolve by UUID id, else by slug (never .or(id.eq.slug) — that crashes on uuid columns)
    let q = supabase.from('places').select('*').limit(1);
    q = isUuid(raw) ? q.eq('id', raw) : q.eq('slug', raw);
    const { data: place, error } = await q.maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!place) return res.status(404).json({ error: 'not found' });
    const cruiseVenue = await loadCruiseVenueContext(supabase, place);

    // Existing external profiles may contain direct delivery listings. Only
    // accept URLs on the matching provider domain; a search link is a separate
    // fallback in the UI and must never be presented as a confirmed listing.
    const deliveryDomains: Record<string, string> = {
      doordash: 'doordash.com', door_dash: 'doordash.com',
      ubereats: 'ubereats.com', uber_eats: 'ubereats.com',
      grubhub: 'grubhub.com', postmates: 'postmates.com',
    };
    const deliveryLinks: Record<string, string> = {};
    const socialDomains: Record<string, string[]> = {
      instagram: ['instagram.com'], tiktok: ['tiktok.com'],
      youtube: ['youtube.com', 'youtu.be'], facebook: ['facebook.com'],
    };
    const socialLinks: Record<string, string> = {};
    const { data: externalProfiles } = await supabase.from('place_external_profiles')
      .select('provider,external_url').eq('place_id', place.id);
    for (const profile of externalProfiles || []) {
      const provider = String(profile.provider || '').toLowerCase();
      const domain = deliveryDomains[provider];
      const allowed = domain ? [domain] : socialDomains[provider];
      if (!allowed || !profile.external_url) continue;
      try {
        const url = new URL(profile.external_url);
        if (url.protocol !== 'https:' || url.username || url.password || !allowed.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) continue;
        if (domain) deliveryLinks[provider.replace('_', '')] = url.toString();
        else socialLinks[provider] = url.toString();
      } catch { /* ignore malformed external links */ }
    }

    // Aggregated signals for this place, joined to the signal catalog (review_items)
    const { data: aggs } = await supabase
      .from('place_signal_aggregates')
      .select('signal_id, bucket, tap_total, review_count')
      .eq('place_id', place.id)
      .order('tap_total', { ascending: false });

    const ids = [...new Set((aggs || []).map(a => a.signal_id))];
    let items: Record<string, any> = {};
    if (ids.length) {
      const { data: ri } = await supabase
        .from('review_items')
        .select('id, slug, label, icon_emoji, signal_type, category')
        .in('id', ids);
      (ri || []).forEach(r => { items[r.id] = r; });
    }

    const groups: Record<'good' | 'vibe' | 'headsup', any[]> = { good: [], vibe: [], headsup: [] };
    let totalTaps = 0;
    for (const a of aggs || []) {
      const cat = BUCKET[a.bucket];
      const def = items[a.signal_id];
      if (!cat || !def) continue;
      totalTaps += a.tap_total || 0;
      groups[cat].push({ label: def.label, emoji: def.icon_emoji || '', tapCount: a.tap_total, category: cat });
    }

    // Shared with search and mobile: complete visit history, distinct reviewers,
    // and an explicit unavailable state when evidence cannot be loaded.
    const evidence = await fetchPlaceEvidence(place.id, { category: cruiseVenue?.review_category || place.tavvy_category, subcategory: cruiseVenue ? undefined : place.tavvy_subcategory }, { client: supabase });

    let stories: any[] = [];
    try {
      const { data: storyRows } = await viewer.from('place_stories')
        .select('id,media_url,media_type,caption,created_at,user_id,is_permanent,story_kind,expires_at,thumbnail_url')
        .eq('place_id', place.id).eq('status', 'active')
        .or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`)
        .order('created_at', { ascending: false }).limit(12);
      stories = storyRows || [];
    } catch (e) { console.warn('Could not load place stories', e); }

    // ---- hours / open status (resilient) ----
    let hoursList: Array<{ day: string; range: string }> = [];
    let openLine = '';
    try {
      if (place.hours != null && place.hours !== '') {
        const parsed = parseHours(place.hours);
        hoursList = parsed.hoursList;
        openLine = openLineFrom(parsed.byDow, place.timezone);
      }
    } catch { hoursList = []; openLine = ''; }

    // Viewer-filtered uploads and cover: never resurrect a hidden photo via places.cover_image_url.
    let gallery: string[] = [];
    let photoEntries: {id:string;url:string;caption?:string}[] = [];
    let safeCover: string | null = null;
    let photosStatus: 'ready'|'unavailable' = 'unavailable';
    try {
      const {data:media,error:mediaError}=await viewer.rpc('get_place_photo_safety_v1',{p_place_id:place.id});
      if(mediaError||!Array.isArray(media?.photos))throw new Error('Photo feed unavailable');
      photoEntries=media.photos;gallery=photoEntries.map(p=>p.url);safeCover=media.cover||null;photosStatus='ready';
    } catch { gallery = []; }

    // Read published reviews first: selecting taps first can expose withdrawn
    // reviews and can cut off a review partway through its selected signals.
    let recentReviews: Array<{
      id: string; initial: string; name: string; when: string; createdAt: string;
      text?: string; signals: Array<{ label: string; category: 'good' | 'vibe' | 'headsup' }>;
    }> = [];
    const { count: reviewCount, error: reviewCountError } = await supabase.from('place_reviews')
      .select('id', {count:'exact',head:true}).eq('place_id',place.id).eq('status','live');
    const { data: recentRows, error: recentReadError } = await viewer.rpc('get_place_recent_reviews', {
      p_place_id: place.id, p_limit: 6, p_offset: 0,
    });
    const reviewsError = recentReadError || (!Array.isArray(recentRows) ? new Error('Review response unavailable') : null);
    const publishedReviews = recentRows as Array<{id:string;user_id:string|null;created_at:string;public_note:string|null}> | null;
    let recentReviewsStatus = reviewsError ? 'unavailable' : 'ready';
    if (!reviewsError && publishedReviews?.length) {
      const reviewIds = publishedReviews.map(review => review.id);
      const { data: taps, error: tapsError } = await supabase.from('place_review_signal_taps')
        .select('review_id,signal_id').eq('place_id', place.id).in('review_id', reviewIds);
      const signalIds = [...new Set((taps || []).map(tap => tap.signal_id))];
      const { data: definitions, error: catalogError } = signalIds.length
        ? await supabase.from('review_items').select('id,label,signal_type').in('id', signalIds)
        : { data: [], error: null };
      const signalMap = new Map((definitions || []).map(definition => [definition.id, definition]));
      const userIds = [...new Set(publishedReviews.map(review => review.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('user_id,display_name,username').in('user_id', userIds)
        : { data: [] };
      const names = new Map((profiles || []).map(profile => [profile.user_id, String(profile.display_name || profile.username || '').trim()]));
      if (tapsError || catalogError) recentReviewsStatus = 'unavailable';
      if (!tapsError && !catalogError) recentReviews = publishedReviews.map(review => {
        const displayName = names.get(review.user_id) || '';
        const name = displayName && !/agent|system/i.test(displayName) ? displayName : 'Tavvy member';
        const signals = (taps || []).filter(tap => tap.review_id === review.id).flatMap(tap => {
          const definition = signalMap.get(tap.signal_id);
          const category = SIGNAL_TYPE_CAT[definition?.signal_type];
          return definition && category ? [{ label: definition.label, category }] : [];
        });
        return { id: review.id, initial: (name.replace(/[^A-Za-z]/g, '')[0] || 'T').toUpperCase(),
          name, when: relativeTime(review.created_at), createdAt: review.created_at,
          text: review.public_note || undefined, signals };
      });
    }

    return res.status(200).json({
      place: {
        id: place.id, slug: place.slug, source_type: place.source_type, name: cruiseVenue?.venue_name || place.name,
        category: cruiseVenue?.review_category || place.tavvy_category, subcategory: cruiseVenue ? null : place.tavvy_subcategory,
        street: place.street, city: place.city, region: place.region, country: place.country,
        phone: place.phone, whatsapp: place.whatsapp_number, website: place.website, email: place.email,
        instagram: socialLinks.instagram, tiktok: socialLinks.tiktok, youtube: socialLinks.youtube, facebook: socialLinks.facebook,
        cover_image_url: safeCover || (gallery.length ? gallery[0] : null), photos: gallery,
        description: cruiseVenue ? cruiseVenue.description : place.description || place.short_description, hours: place.hours,
        ordering_enabled: place.ordering_enabled,
        latitude: place.latitude, longitude: place.longitude,
        // new fields
        hoursList, openLine, gallery,
      },
      cruiseVenue,
      groups,
      evidence,
      stories,
      photoEntries,
      photosStatus,
      deliveryLinks,
      totalTaps,
      reviewCount: reviewCountError ? null : reviewCount || 0,
      recentReviewsStatus,
      recentReviews,
    });
  } catch (e: any) {
    if (e instanceof CruiseVenueReadError) return res.status(e.reason === 'hidden' ? 404 : 503).json({error:e.message});
    return res.status(500).json({ error: e.message });
  }
}
