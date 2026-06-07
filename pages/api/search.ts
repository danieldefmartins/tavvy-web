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
