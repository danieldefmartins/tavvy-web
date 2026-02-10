import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parseSearchQuery } from '../../lib/smartQueryParser';

// Server-side Supabase client
const getServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface SearchSuggestion {
  id: string;
  name: string;
  category?: string;
  city?: string;
  address?: string;
  distance?: number;
  latitude: number;
  longitude: number;
}

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, userLat, userLng, limit = '10' } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    const userLocation = userLat && userLng ? {
      lat: parseFloat(userLat as string),
      lng: parseFloat(userLng as string),
    } : null;

    const limitNum = parseInt(limit as string, 10);
    const searchTerm = q.trim();

    console.log('[API/search] Searching for:', searchTerm);

    // SMART PARSING: Parse natural language query
    const parsed = parseSearchQuery(searchTerm);
    console.log('[API/search] Parsed query:', parsed);

    const supabase = getServerSupabase();

    let suggestions: SearchSuggestion[] = [];

    // Search in fsq_places_raw table (has more data)
    try {
      let query = supabase
        .from('fsq_places_raw')
        .select('fsq_id, name, category_name, city, address, latitude, longitude');
      
      // Apply smart parsing filters if available
      if (parsed.isParsed) {
        query = query.ilike('name', `%${parsed.placeName}%`);
        
        if (parsed.city) {
          query = query.ilike('locality', `%${parsed.city}%`);
        }
        
        if (parsed.region) {
          query = query.eq('region', parsed.region);
        }
        
        if (parsed.country) {
          query = query.eq('country', parsed.country);
        }
      } else {
        // Fallback to simple name search
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      query = query.limit(limitNum * 2); // Fetch more to filter later

      const { data, error } = await query;

      if (error) {
        console.warn('[API/search] Error searching fsq_places_raw:', error);
      } else if (data) {
        suggestions = data.map((place: any) => ({
          id: `fsq-${place.fsq_id}`,
          name: place.name,
          category: place.category_name,
          city: place.city,
          address: [place.address, place.city].filter(Boolean).join(', '),
          latitude: place.latitude,
          longitude: place.longitude,
        }));
      }
    } catch (error) {
      console.error('[API/search] Exception searching:', error);
    }

    // Calculate distances if user location provided
    if (userLocation) {
      suggestions.forEach(suggestion => {
        suggestion.distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          suggestion.latitude,
          suggestion.longitude
        );
      });

      // Sort by distance (closest first)
      suggestions.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Limit results
    suggestions = suggestions.slice(0, limitNum);

    console.log(`[API/search] Returning ${suggestions.length} suggestions`);

    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('[API/search] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
