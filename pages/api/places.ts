import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client - has access to runtime env vars
const getServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log('[API/places] Supabase URL available:', !!supabaseUrl);
  console.log('[API/places] Supabase Key available:', !!supabaseAnonKey);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface PlaceCard {
  id: string;
  source: 'places' | 'fsq_raw';
  source_id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postcode?: string;
  category?: string;
  subcategory?: string;
  phone?: string;
  website?: string;
  cover_image_url?: string;
  photos?: string[];
  status?: string;
}

// Transform canonical place to PlaceCard
const transformCanonicalPlace = (place: any): PlaceCard => ({
  id: `places-${place.id}`,
  source: 'places',
  source_id: place.source_id || place.id,
  name: place.name || 'Unknown',
  latitude: place.latitude,
  longitude: place.longitude,
  address: place.street || place.address,
  city: place.city,
  region: place.region,
  country: place.country,
  postcode: place.postcode,
  category: place.tavvy_category,
  subcategory: place.tavvy_subcategory,
  phone: place.phone,
  website: place.website,
  cover_image_url: place.cover_image_url,
  photos: place.photos,
  status: place.status,
});

// Transform FSQ raw place to PlaceCard
const transformFsqRawPlace = (place: any): PlaceCard => ({
  id: `fsq-${place.fsq_id}`,
  source: 'fsq_raw',
  source_id: place.fsq_id,
  name: place.name || 'Unknown',
  latitude: place.latitude,
  longitude: place.longitude,
  address: place.address,
  city: place.city,
  region: place.region,
  country: place.country,
  postcode: place.postcode,
  category: place.category_name,
  subcategory: place.subcategory_name,
  phone: place.phone,
  website: place.website,
  cover_image_url: place.cover_image_url,
  photos: place.photos,
  status: 'active',
});

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
    const { minLat, maxLat, minLng, maxLng, userLat, userLng, category, limit = '150' } = req.query;

    // Validate required params
    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({ error: 'Missing required bounds parameters' });
    }

    const bounds = {
      minLat: parseFloat(minLat as string),
      maxLat: parseFloat(maxLat as string),
      minLng: parseFloat(minLng as string),
      maxLng: parseFloat(maxLng as string),
    };

    const userLocation = userLat && userLng ? {
      lat: parseFloat(userLat as string),
      lng: parseFloat(userLng as string),
    } : null;

    const limitNum = parseInt(limit as string, 10);
    const fallbackThreshold = 40;

    console.log('[API/places] Fetching places with bounds:', bounds);

    const supabase = getServerSupabase();

    let placesFromCanonical: PlaceCard[] = [];
    let placesFromFsqRaw: PlaceCard[] = [];
    let fallbackTriggered = false;

    // Step 1: Query canonical `places` table
    try {
      let query = supabase
        .from('places')
        .select('id, source_type, source_id, name, latitude, longitude, street, city, region, country, postcode, tavvy_category, tavvy_subcategory, phone, website, cover_image_url, photos, status')
        .gte('latitude', bounds.minLat)
        .lte('latitude', bounds.maxLat)
        .gte('longitude', bounds.minLng)
        .lte('longitude', bounds.maxLng)
        .eq('status', 'active')
        .limit(limitNum);

      if (category && category !== 'All') {
        query = query.ilike('tavvy_category', `%${category}%`);
      }

      const { data: placesData, error: placesError } = await query;

      if (placesError) {
        console.warn('[API/places] Error querying places table:', placesError);
      } else if (placesData) {
        placesFromCanonical = placesData.map(transformCanonicalPlace);
        console.log(`[API/places] Fetched ${placesFromCanonical.length} places from canonical table`);
      }
    } catch (error) {
      console.error('[API/places] Exception querying places table:', error);
    }

    // Step 2: Check if fallback is needed
    if (placesFromCanonical.length < fallbackThreshold) {
      fallbackTriggered = true;
      console.log(`[API/places] Fallback triggered: ${placesFromCanonical.length} < ${fallbackThreshold} threshold`);

      const existingSourceIds = new Set(
        placesFromCanonical
          .filter(p => p.source_id)
          .map(p => p.source_id)
      );

      try {
        let query = supabase
          .from('fsq_places_raw')
          .select('fsq_id, name, latitude, longitude, address, city, region, country, postcode, category_name, subcategory_name, phone, website, cover_image_url, photos')
          .gte('latitude', bounds.minLat)
          .lte('latitude', bounds.maxLat)
          .gte('longitude', bounds.minLng)
          .lte('longitude', bounds.maxLng)
          .limit(limitNum - placesFromCanonical.length);

        if (category && category !== 'All') {
          query = query.ilike('category_name', `%${category}%`);
        }

        const { data: fsqData, error: fsqError } = await query;

        if (fsqError) {
          console.warn('[API/places] Error querying fsq_places_raw:', fsqError);
        } else if (fsqData) {
          const newFsqPlaces = fsqData
            .filter((p: any) => !existingSourceIds.has(p.fsq_id))
            .map(transformFsqRawPlace);
          placesFromFsqRaw = newFsqPlaces;
          console.log(`[API/places] Fetched ${placesFromFsqRaw.length} places from fsq_places_raw`);
        }
      } catch (error) {
        console.error('[API/places] Exception querying fsq_places_raw:', error);
      }
    }

    // Combine and deduplicate
    const allPlaces = [...placesFromCanonical, ...placesFromFsqRaw];

    // Calculate distances if user location provided
    if (userLocation) {
      allPlaces.forEach(place => {
        place.distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.latitude,
          place.longitude
        );
      });

      // Sort by distance
      allPlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    console.log(`[API/places] Returning ${allPlaces.length} total places`);

    return res.status(200).json({
      places: allPlaces,
      metrics: {
        fromPlaces: placesFromCanonical.length,
        fromFsqRaw: placesFromFsqRaw.length,
        fallbackTriggered,
        total: allPlaces.length,
      },
    });
  } catch (error: any) {
    console.error('[API/places] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
