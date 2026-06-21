import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// bucket (stored on aggregates) -> Tavvy category
const BUCKET: Record<string, 'good' | 'vibe' | 'headsup'> = {
  positive: 'good', neutral: 'vibe', negative: 'headsup',
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
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

    return res.status(200).json({
      place: {
        id: place.id, slug: place.slug, name: place.name,
        category: place.tavvy_category, subcategory: place.tavvy_subcategory,
        street: place.street, city: place.city, region: place.region, country: place.country,
        phone: place.phone, whatsapp: place.whatsapp_number, website: place.website, email: place.email,
        instagram: place.instagram, tiktok: place.tiktok, youtube: place.youtube, facebook: place.facebook,
        cover_image_url: place.cover_image_url, photos: place.photos,
        description: place.description || place.short_description, hours: place.hours,
        ordering_enabled: place.ordering_enabled,
        latitude: place.latitude, longitude: place.longitude,
      },
      groups,
      totalTaps,
      reviewCount: (aggs || []).reduce((m, a) => Math.max(m, a.review_count || 0), 0),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
