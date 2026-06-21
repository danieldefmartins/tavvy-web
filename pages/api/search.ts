import type { NextApiRequest, NextApiResponse } from 'next';
import { searchPlaces } from '../../lib/typesenseService';
import { parseSearchQuery } from '../../lib/smartQueryParser';
import { searchSuggestions } from '../../lib/placeService';

interface SearchSuggestion {
  id: string;
  name: string;
  category?: string;
  city?: string;
  address?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, userLat, userLng, limit = '8' } = req.query;

    if (!q || typeof q !== 'string' || q.length < 1) {
      return res.status(200).json({ suggestions: [] });
    }

    const limitNum = parseInt(limit as string, 10);
    const searchTerm = q.trim();

    // Parse query for location keywords (e.g., "pizza near Orlando, FL")
    const parsed = parseSearchQuery(searchTerm);

    console.log('[API/search] Searching Typesense for:', searchTerm, parsed.isParsed ? `(parsed: "${parsed.placeName}" in ${parsed.city || ''} ${parsed.region || ''})` : '');

    const userLocation = userLat && userLng ? {
      latitude: parseFloat(userLat as string),
      longitude: parseFloat(userLng as string),
    } : undefined;

    const result = await searchPlaces({
      query: parsed.isParsed ? parsed.placeName : searchTerm,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radiusKm: parsed.isParsed ? undefined : (userLocation ? 50 : undefined),
      locality: parsed.city,
      region: parsed.region,
      country: parsed.country,
      limit: limitNum,
    });

    let suggestions: SearchSuggestion[] = result.places.map(place => ({
      id: place.id,
      name: place.name,
      category: place.subcategory || place.category || 'Place',
      city: place.locality,
      address: [place.address, place.locality, place.region].filter(Boolean).join(', '),
      distance: place.distance,
      latitude: place.latitude,
      longitude: place.longitude,
    }));

    // Always run Supabase search to catch places with subcategories (e.g. "Italian Restaurant")
    // Typesense only indexes FSQ data, Supabase has agent-created places with tavvy_subcategory
    {
      const supabaseTerm = parsed.isParsed ? parsed.placeName : searchTerm;
      console.log(`[API/search] Also searching Supabase for subcategories: "${supabaseTerm}"`);
      const fallback = await searchSuggestions(supabaseTerm, limitNum, userLocation);
      const fallbackMapped = fallback.map(place => ({
        id: place.id,
        name: place.name,
        category: place.subcategory || place.category || 'Place',
        city: place.city,
        address: [place.address, place.city, place.region].filter(Boolean).join(', '),
        distance: place.distance,
        latitude: place.latitude,
        longitude: place.longitude,
      }));

      // Merge: add Supabase results that aren't already in Typesense results
      const existingIds = new Set(suggestions.map(s => s.id));
      const existingNames = new Set(suggestions.map(s => s.name.toLowerCase()));
      for (const item of fallbackMapped) {
        if (!existingIds.has(item.id) && !existingNames.has(item.name.toLowerCase())) {
          suggestions.push(item);
        }
      }
      if (fallbackMapped.length > 0) {
        console.log(`[API/search] Supabase added ${fallbackMapped.length} additional results`);
      }
    }

    // Trim to limit
    suggestions = suggestions.slice(0, limitNum);

    // Enrich with real top signals (labels) so result cards show the signal-review design.
    try {
      const ids = suggestions
        .map(s => String(s.id).replace(/^(tavvy:|places-|fsq-)/, ''))
        .filter(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x));
      if (ids.length) {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
        const { data: aggs } = await sb.from('place_signal_aggregates').select('place_id,signal_id,bucket,tap_total').in('place_id', ids);
        if (aggs && aggs.length) {
          const sigIds = [...new Set(aggs.map((a: any) => a.signal_id))];
          const { data: ri } = await sb.from('review_items').select('id,label,icon_emoji').in('id', sigIds);
          const lbl = new Map<string, any>(); (ri || []).forEach((r: any) => lbl.set(r.id, r));
          const BC: Record<string, string> = { positive: 'good', neutral: 'vibe', negative: 'headsup' };
          const byPlace = new Map<string, any>();
          for (const a of aggs as any[]) {
            const c = BC[a.bucket]; const d = lbl.get(a.signal_id); if (!c || !d) continue;
            const g = byPlace.get(a.place_id) || { good: [], vibe: [], headsup: [] };
            g[c].push({ label: d.label, emoji: d.icon_emoji || '', category: c, count: a.tap_total || 0 });
            byPlace.set(a.place_id, g);
          }
          for (const s of suggestions as any[]) {
            const key = String(s.id).replace(/^(tavvy:|places-|fsq-)/, '');
            const g = byPlace.get(key);
            if (g) { const srt = (arr: any[]) => arr.sort((x, y) => y.count - x.count); s.topSignals = [...srt(g.good).slice(0, 2), ...srt(g.vibe).slice(0, 1), ...srt(g.headsup).slice(0, 1)]; }
          }
        }
      }
    } catch { /* signal enrichment is best-effort */ }

    console.log(`[API/search] Returning ${suggestions.length} suggestions (${result.searchTimeMs}ms)`);

    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('[API/search] Typesense error:', error.message);

    // Typesense failed entirely — fall back to Supabase
    try {
      const searchTerm = (req.query.q as string)?.trim() || '';
      const limitNum = parseInt((req.query.limit as string) || '8', 10);
      const userLat = req.query.userLat as string | undefined;
      const userLng = req.query.userLng as string | undefined;
      const userLocation = userLat && userLng
        ? { latitude: parseFloat(userLat), longitude: parseFloat(userLng) }
        : undefined;

      const fallback = await searchSuggestions(searchTerm, limitNum, userLocation);
      const suggestions: SearchSuggestion[] = fallback.map(place => ({
        id: place.id,
        name: place.name,
        category: place.subcategory || place.category || 'Place',
        city: place.city,
        address: [place.address, place.city, place.region].filter(Boolean).join(', '),
        distance: place.distance,
        latitude: place.latitude,
        longitude: place.longitude,
      }));
      console.log(`[API/search] Supabase fallback (after Typesense error) returned ${suggestions.length} results`);
      return res.status(200).json({ suggestions });
    } catch (fallbackError: any) {
      console.error('[API/search] Supabase fallback also failed:', fallbackError.message);
      return res.status(200).json({ suggestions: [] });
    }
  }
}
