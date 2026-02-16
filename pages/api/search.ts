import type { NextApiRequest, NextApiResponse } from 'next';
import { searchPlaces } from '../../lib/typesenseService';

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

    console.log('[API/search] Searching Typesense for:', searchTerm);

    const userLocation = userLat && userLng ? {
      latitude: parseFloat(userLat as string),
      longitude: parseFloat(userLng as string),
    } : undefined;

    // Use Typesense for fast full-text search (same as iOS)
    const result = await searchPlaces({
      query: searchTerm,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      radiusKm: userLocation ? 50 : undefined,
      limit: limitNum,
    });

    const suggestions: SearchSuggestion[] = result.places.map(place => ({
      id: place.id,
      name: place.name,
      category: place.subcategory || place.category || 'Place',
      city: place.locality,
      address: [place.address, place.locality, place.region].filter(Boolean).join(', '),
      distance: place.distance,
      latitude: place.latitude,
      longitude: place.longitude,
    }));

    console.log(`[API/search] Returning ${suggestions.length} suggestions from Typesense (${result.searchTimeMs}ms)`);

    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('[API/search] Typesense error:', error.message);
    
    // Return empty results instead of error to avoid breaking the UI
    return res.status(200).json({ suggestions: [] });
  }
}
