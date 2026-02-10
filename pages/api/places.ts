import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { searchPlacesInBounds } from '../../lib/typesenseService';

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

// Clean category string: remove brackets, quotes, extract top-level category
const cleanCategory = (raw: string | null | undefined): string => {
  if (!raw) return 'Place';
  // Remove brackets, quotes, and leading/trailing whitespace
  let cleaned = raw.replace(/^\[?'?/g, '').replace(/'?\]?$/g, '').trim();
  // Take the top-level category (before first >)
  if (cleaned.includes('>')) {
    cleaned = cleaned.split('>')[0].trim();
  }
  return cleaned || 'Place';
};

// Extract subcategory from raw category string
const extractSubcategory = (raw: string | null | undefined): string | undefined => {
  if (!raw) return undefined;
  const cleaned = raw.replace(/^\[?'?/g, '').replace(/'?\]?$/g, '').trim();
  const parts = cleaned.split('>');
  if (parts.length >= 2) {
    return parts[parts.length - 1].trim();
  }
  return undefined;
};

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
  category: cleanCategory(place.tavvy_category),
  subcategory: extractSubcategory(place.tavvy_category) || place.tavvy_subcategory,
  phone: place.phone,
  website: place.website,
  cover_image_url: place.cover_image_url,
  photos: place.photos,
  status: place.status,
});

// Transform FSQ raw place to PlaceCard
// fsq_places_raw columns: fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email, fsq_category_labels
const transformFsqRawPlace = (place: any): PlaceCard => {
  // Parse category from fsq_category_labels (e.g., "[Dining and Drinking > Restaurant > American Restaurant]")
  const rawCat = Array.isArray(place.fsq_category_labels) 
    ? place.fsq_category_labels[0] 
    : place.fsq_category_labels;
  const category = rawCat ? cleanCategory(rawCat) : 'Place';
  const subcategory = rawCat ? rawCat.split('>').pop()?.trim()?.replace(/[\[\]]/g, '') : undefined;
  
  return {
    id: `fsq-${place.fsq_place_id}`,
    source: 'fsq_raw',
    source_id: place.fsq_place_id,
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    city: place.locality,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category,
    subcategory,
    phone: place.tel,
    website: place.website,
    cover_image_url: undefined,
    photos: undefined,
    status: 'active',
  };
};

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
    const { minLat, maxLat, minLng, maxLng, userLat, userLng, category, canonicalCategory, limit = '150' } = req.query;

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

      // For canonical places, use the canonicalCategory param (or derive from category)
      const canonCat = canonicalCategory || category;
      if (canonCat && canonCat !== 'All') {
        // Map search terms to canonical category patterns
        const canonicalMap: Record<string, string> = {
          'restaurant': 'Restaurant',
          'coffee cafe': 'Cafe',
          'bar pub': 'Bar',
          'gas station fuel': 'Gas Station',
          'shop store': 'Retail',
        };
        const catFilter = canonicalMap[canonCat as string] || canonCat;
        query = query.ilike('tavvy_category', `%${catFilter}%`);
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

    // Step 2: Try Typesense first (100x faster!)
    if (placesFromCanonical.length < fallbackThreshold) {
      fallbackTriggered = true;
      console.log(`[API/places] Fallback triggered: ${placesFromCanonical.length} < ${fallbackThreshold} threshold`);

      const existingSourceIds = new Set(
        placesFromCanonical
          .filter(p => p.source_id)
          .map(p => p.source_id)
      );

      // Try Typesense
      try {
        const typesenseResult = await searchPlacesInBounds({
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
          minLng: bounds.minLng,
          maxLng: bounds.maxLng,
          category: category && category !== 'All' ? category as string : undefined,
          limit: limitNum - placesFromCanonical.length,
        });

        const typesenseResults = typesenseResult?.places || [];

        if (typesenseResults && typesenseResults.length > 0) {
          const newTypesensePlaces = typesenseResults
            .filter(p => {
              const sourceId = p.fsq_place_id || p.id;
              return !existingSourceIds.has(sourceId);
            })
            .map(p => {
              const isTavvy = p.id.startsWith('tavvy:');
              return {
                id: p.id,
                source: (isTavvy ? 'places' : 'fsq_raw') as 'places' | 'fsq_raw',
                source_id: p.fsq_place_id || p.id,
                name: p.name,
                latitude: p.latitude!,
                longitude: p.longitude!,
                address: p.address,
                city: p.locality,
                region: p.region,
                country: p.country,
                postcode: p.postcode,
                category: p.category,
                subcategory: p.subcategory,
                phone: p.tel,
                website: p.website,
                cover_image_url: undefined,
                photos: [],
                status: 'active',
              } as PlaceCard;
            });
          
          placesFromFsqRaw = newTypesensePlaces;
          console.log(`[API/places] ⚡ Typesense: ${placesFromFsqRaw.length} places in bounds`);
        }
      } catch (typesenseError) {
        console.warn('[API/places] Typesense failed, falling back to Supabase:', typesenseError);
      }

      // Fallback to Supabase if Typesense failed
      if (placesFromFsqRaw.length === 0) {
        try {
        let query = supabase
          .from('fsq_places_raw')
          .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, fsq_category_labels, tel, website, email')
          .gte('latitude', bounds.minLat)
          .lte('latitude', bounds.maxLat)
          .gte('longitude', bounds.minLng)
          .lte('longitude', bounds.maxLng)
          .is('date_closed', null)
          .limit(Math.min(200, limitNum - placesFromCanonical.length)); // Optimized limit

        if (category && category !== 'All') {
          const fsqCatMap: Record<string, string> = {
            'restaurant': 'Restaurant',
            'coffee cafe': 'Cafe',
            'bar pub': 'Bar',
            'gas station fuel': 'Gas Station',
            'shop store': 'Store',
          };
          const fsqCatFilter = fsqCatMap[category as string] || category;
          query = query.ilike('fsq_category_labels', `%${fsqCatFilter}%`);
        }

        const { data: fsqData, error: fsqError } = await query;

        if (fsqError) {
          console.warn('[API/places] Error querying fsq_places_raw:', fsqError);
        } else if (fsqData) {
          const newFsqPlaces = fsqData
            .filter((p: any) => !existingSourceIds.has(p.fsq_place_id))
            .map(transformFsqRawPlace);
          placesFromFsqRaw = newFsqPlaces;
          console.log(`[API/places] Fetched ${placesFromFsqRaw.length} places from fsq_places_raw`);
        }
        } catch (error) {
          console.error('[API/places] Exception querying fsq_places_raw:', error);
        }
      }
    }

    // Combine all sources
    const rawPlaces = [...placesFromCanonical, ...placesFromFsqRaw];

    // Clean Typesense categories too
    rawPlaces.forEach(place => {
      if (place.category) {
        place.category = cleanCategory(place.category);
      }
    });

    // Deduplicate by name (case-insensitive) — keep first occurrence
    const seenNames = new Set<string>();
    const allPlaces = rawPlaces.filter(place => {
      const key = place.name.toLowerCase().trim();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

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

    console.log(`[API/places] Returning ${allPlaces.length} total places (deduped from ${rawPlaces.length})`);

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
