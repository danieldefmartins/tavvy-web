/**
 * placeService.ts
 * 
 * Centralized place-fetching service with hybrid strategy:
 * 1. Query canonical `places` table first (fast path)
 * 2. If results < threshold, fallback to `fsq_places_raw` (coverage path)
 * 3. Deduplicate by source_id to avoid showing duplicate places
 * 
 * This matches the mobile app implementation exactly.
 */

import { supabase } from './supabaseClient';
import { Place, Signal } from '../types';

// Debug flag for place fetching
const DEBUG_PLACES = true;

// ============================================
// TYPES
// ============================================

export type PlaceSource = 'places' | 'fsq_raw';

export interface PlaceCard {
  id: string;
  source?: PlaceSource;
  source_id?: string;
  source_type?: string;
  name: string;
  address_line1?: string;
  address?: string;
  city?: string;
  state_region?: string;
  region?: string;
  country?: string;
  postcode?: string;
  category?: string;
  subcategory?: string;
  primary_category?: string;
  latitude: number;
  longitude: number;
  current_status?: string;
  status?: string;
  cover_image_url?: string;
  photo_url?: string;
  phone?: string;
  website?: string;
  email?: string;
  signals?: Signal[];
  photos?: string[];
  distance?: number;
  slug?: string;
}

export interface SearchResult extends PlaceCard {
  matchScore?: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LIMIT = 150;
const DEFAULT_FALLBACK_THRESHOLD = 40;

// Progressive search radius tiers (in degrees, ~1 degree ≈ 69 miles)
const SEARCH_RADIUS_LOCAL = 0.3;      // ~20 miles
const SEARCH_RADIUS_REGIONAL = 0.8;   // ~55 miles

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance in meters
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const miles = calculateDistance(lat1, lon1, lat2, lon2);
  return miles * 1609.34;
}

/**
 * Transform a row from the canonical `places` table to PlaceCard format
 */
function transformCanonicalPlace(place: any): PlaceCard {
  return {
    id: place.id,
    source: 'places',
    source_id: place.source_id || place.id,
    source_type: place.source_type,
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.street || place.address,
    address_line1: place.street || place.address,
    city: place.city || place.locality,
    state_region: place.region,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category: place.tavvy_category || place.category,
    subcategory: place.tavvy_subcategory,
    primary_category: place.tavvy_category || place.category,
    phone: place.phone,
    website: place.website,
    email: place.email,
    cover_image_url: place.cover_image_url,
    photo_url: place.cover_image_url,
    photos: place.photos || [],
    status: place.status,
    current_status: place.status,
    slug: place.slug,
  };
}

/**
 * Transform a row from `fsq_places_raw` table to PlaceCard format
 */
function transformFsqRawPlace(place: any): PlaceCard {
  // Extract category from fsq_category_labels
  let category = 'Other';
  let subcategory = '';
  
  if (place.fsq_category_labels) {
    let labels: string[] = [];
    if (Array.isArray(place.fsq_category_labels)) {
      labels = place.fsq_category_labels;
    } else if (typeof place.fsq_category_labels === 'string') {
      labels = place.fsq_category_labels.split(',').map((s: string) => s.trim());
    }
    
    if (labels.length > 0) {
      const fullCategory = labels[0];
      if (typeof fullCategory === 'string') {
        const parts = fullCategory.split('>');
        if (parts.length > 1) {
          category = parts[0].trim();
          subcategory = parts[parts.length - 1].trim();
        } else {
          category = fullCategory.trim();
        }
      }
    }
  }

  return {
    id: `fsq:${place.fsq_place_id}`,
    source: 'fsq_raw',
    source_id: place.fsq_place_id,
    source_type: 'fsq',
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    address_line1: place.address,
    city: place.locality,
    state_region: place.region,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category,
    subcategory,
    primary_category: category,
    phone: place.tel,
    website: place.website,
    email: place.email,
    cover_image_url: undefined,
    photo_url: undefined,
    photos: [],
    status: 'active',
    current_status: 'active',
  };
}

/**
 * Deduplicate places by name and proximity
 */
function deduplicateByNameAndProximity(places: PlaceCard[]): PlaceCard[] {
  const seen = new Map<string, PlaceCard>();
  
  for (const place of places) {
    const key = place.name.toLowerCase().trim();
    const existing = seen.get(key);
    
    if (!existing) {
      seen.set(key, place);
    } else {
      // If same name, check if they're close (within ~100m)
      if (existing.latitude && existing.longitude && place.latitude && place.longitude) {
        const dist = getDistanceInMeters(
          existing.latitude, existing.longitude,
          place.latitude, place.longitude
        );
        // If far apart, they're different places with same name
        if (dist > 100) {
          // Keep both - use a unique key
          seen.set(`${key}_${place.latitude}_${place.longitude}`, place);
        }
        // If close, prefer canonical source
        else if (place.source === 'places' && existing.source === 'fsq_raw') {
          seen.set(key, place);
        }
      }
    }
  }
  
  return Array.from(seen.values());
}

// ============================================
// MAIN FETCH FUNCTION
// ============================================

/**
 * Fetch places within map bounds using hybrid strategy.
 * 
 * Strategy:
 * 1. Query `places` table first (canonical, fast)
 * 2. If results < threshold, query `fsq_places_raw` as fallback
 * 3. Deduplicate by source_id and name+proximity
 * 4. Return unified PlaceCard[] format
 */
export async function fetchPlacesInBounds(
  bounds: {
    ne: [number, number];
    sw: [number, number];
  },
  userLocation?: [number, number] | null,
  category?: string
): Promise<PlaceCard[]> {
  const startTime = Date.now();
  
  const minLng = bounds.sw[0];
  const maxLng = bounds.ne[0];
  const minLat = bounds.sw[1];
  const maxLat = bounds.ne[1];

  let placesFromCanonical: PlaceCard[] = [];
  let placesFromFsqRaw: PlaceCard[] = [];
  let fallbackTriggered = false;

  // ============================================
  // STEP 1: Query canonical `places` table (fast path)
  // ============================================
  try {
    let query = supabase
      .from('places')
      .select('id, source_type, source_id, name, latitude, longitude, street, city, region, country, postcode, tavvy_category, tavvy_subcategory, phone, website, email, cover_image_url, photos, status, slug')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .eq('status', 'active')
      .limit(DEFAULT_LIMIT);

    if (category && category !== 'All') {
      query = query.ilike('tavvy_category', `%${category}%`);
    }

    const { data: placesData, error: placesError } = await query;

    if (placesError) {
      console.warn('[placeService] Error querying places table:', placesError);
    } else if (placesData) {
      placesFromCanonical = placesData.map(transformCanonicalPlace);
      if (DEBUG_PLACES) {
        console.log(`[placeService] Fetched ${placesFromCanonical.length} places from canonical table`);
      }
    }
  } catch (error) {
    console.error('[placeService] Exception querying places table:', error);
  }

  // ============================================
  // STEP 2: Check if fallback is needed
  // ============================================
  if (placesFromCanonical.length < DEFAULT_FALLBACK_THRESHOLD) {
    fallbackTriggered = true;
    if (DEBUG_PLACES) {
      console.log(`[placeService] Fallback triggered: ${placesFromCanonical.length} < ${DEFAULT_FALLBACK_THRESHOLD} threshold`);
    }

    // Get source_ids to exclude
    const existingSourceIds = new Set(
      placesFromCanonical
        .filter(p => p.source_id)
        .map(p => p.source_id)
    );

    // ============================================
    // STEP 3: Query fsq_places_raw as fallback
    // ============================================
    try {
      let fsqQuery = supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email, fsq_category_labels')
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .is('date_closed', null)
        .limit(DEFAULT_LIMIT - placesFromCanonical.length);

      // Apply category filter for FSQ
      if (category && category !== 'All') {
        fsqQuery = fsqQuery.ilike('fsq_category_labels', `%${category}%`);
      }

      const { data: fsqData, error: fsqError } = await fsqQuery;

      if (fsqError) {
        console.warn('[placeService] Error querying fsq_places_raw:', fsqError);
      } else if (fsqData) {
        // Filter out places already in canonical table
        const newFsqPlaces = fsqData.filter(p => !existingSourceIds.has(p.fsq_place_id));
        placesFromFsqRaw = newFsqPlaces.map(transformFsqRawPlace);
        if (DEBUG_PLACES) {
          console.log(`[placeService] Fetched ${fsqData.length} from fsq_raw, ${placesFromFsqRaw.length} after dedup`);
        }
      }
    } catch (error) {
      console.error('[placeService] Exception querying fsq_places_raw:', error);
    }
  }

  // ============================================
  // STEP 4: Merge, deduplicate, and sort
  // ============================================
  let allPlaces = [...placesFromCanonical, ...placesFromFsqRaw];
  allPlaces = deduplicateByNameAndProximity(allPlaces);

  // Calculate distance and sort by proximity
  if (userLocation) {
    allPlaces = allPlaces.map(place => ({
      ...place,
      distance: calculateDistance(
        userLocation[1],
        userLocation[0],
        place.latitude,
        place.longitude
      )
    }));
    
    allPlaces.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  const endTime = Date.now();
  if (DEBUG_PLACES) {
    console.log(`[placeService] Total: ${allPlaces.length} places (${placesFromCanonical.length} canonical, ${placesFromFsqRaw.length} fsq_raw) in ${endTime - startTime}ms`);
  }

  return allPlaces;
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Search places by query using hybrid strategy
 */
export async function searchPlaces(
  query: string,
  userLocation?: [number, number] | null,
  limit: number = 20
): Promise<PlaceCard[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  let resultsFromPlaces: PlaceCard[] = [];
  let resultsFromFsqRaw: PlaceCard[] = [];

  // Search places table
  try {
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, latitude, longitude, cover_image_url, street, phone, slug')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .limit(limit);

    if (!placesError && placesData) {
      resultsFromPlaces = placesData.map(transformCanonicalPlace);
    }
  } catch (error) {
    console.error('[placeService] Error searching places:', error);
  }

  // If not enough results, search fsq_places_raw
  if (resultsFromPlaces.length < 10) {
    try {
      const { data: fsqData, error: fsqError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
        .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
        .is('date_closed', null)
        .limit(limit - resultsFromPlaces.length);

      if (!fsqError && fsqData) {
        resultsFromFsqRaw = fsqData.map(transformFsqRawPlace);
      }
    } catch (error) {
      console.error('[placeService] Error searching fsq_places_raw:', error);
    }
  }

  // Merge and deduplicate
  let allResults = [...resultsFromPlaces, ...resultsFromFsqRaw];
  allResults = deduplicateByNameAndProximity(allResults);

  // Calculate distance and sort
  if (userLocation) {
    allResults = allResults.map(place => ({
      ...place,
      distance: calculateDistance(
        userLocation[1],
        userLocation[0],
        place.latitude,
        place.longitude
      )
    }));
    allResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  return allResults.slice(0, limit);
}

/**
 * Search suggestions (autocomplete) with geo-biased results
 */
export async function searchSuggestions(
  query: string,
  limit: number = 8,
  userLocation?: { latitude: number; longitude: number }
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const results: SearchResult[] = [];
  const seenNames = new Set<string>();

  try {
    // Build geo-bounded query if location available
    let placesQuery = supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, latitude, longitude, cover_image_url, street, phone, slug')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .limit(limit);

    let fsqQuery = supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
      .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
      .is('date_closed', null)
      .limit(limit);

    // Add geo bounds if location available
    if (userLocation) {
      const radiusDegrees = SEARCH_RADIUS_LOCAL;
      const minLat = userLocation.latitude - radiusDegrees;
      const maxLat = userLocation.latitude + radiusDegrees;
      const minLng = userLocation.longitude - radiusDegrees;
      const maxLng = userLocation.longitude + radiusDegrees;

      placesQuery = placesQuery
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng);

      fsqQuery = fsqQuery
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng);
    }

    // Execute both queries in parallel
    const [placesResult, fsqResult] = await Promise.all([placesQuery, fsqQuery]);

    // Process places results first (higher priority)
    if (placesResult.data) {
      for (const p of placesResult.data) {
        const nameKey = p.name.toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          const result: SearchResult = {
            id: p.id,
            source: 'places',
            source_id: p.id,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            city: p.city,
            region: p.region,
            state_region: p.region,
            category: p.tavvy_category,
            primary_category: p.tavvy_category,
            cover_image_url: p.cover_image_url,
            address: p.street,
            address_line1: p.street,
            phone: p.phone,
            slug: p.slug,
          };
          if (userLocation && p.latitude && p.longitude) {
            result.distance = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              p.latitude, p.longitude
            );
          }
          results.push(result);
        }
      }
    }

    // Add FSQ results (deduplicated)
    if (fsqResult.data) {
      for (const p of fsqResult.data) {
        const nameKey = p.name.toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          
          // Extract category
          let category = 'Other';
          if (p.fsq_category_labels) {
            const labels = typeof p.fsq_category_labels === 'string'
              ? p.fsq_category_labels.split(',')
              : p.fsq_category_labels;
            if (labels.length > 0) {
              const parts = labels[0].split('>');
              category = parts[parts.length - 1].trim();
            }
          }

          const result: SearchResult = {
            id: `fsq:${p.fsq_place_id}`,
            source: 'fsq_raw',
            source_id: p.fsq_place_id,
            name: p.name,
            latitude: p.latitude,
            longitude: p.longitude,
            city: p.locality,
            region: p.region,
            state_region: p.region,
            category,
            primary_category: category,
          };
          if (userLocation && p.latitude && p.longitude) {
            result.distance = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              p.latitude, p.longitude
            );
          }
          results.push(result);
        }
      }
    }

    // Sort by distance if location available
    if (userLocation) {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error('[placeService] Error in searchSuggestions:', error);
    return [];
  }
}

// ============================================
// SINGLE PLACE FETCH
// ============================================

/**
 * Fetch a single place by ID
 */
export async function fetchPlaceById(placeId: string): Promise<Place | null> {
  try {
    // Check if it's an FSQ ID
    if (placeId.startsWith('fsq:')) {
      const fsqId = placeId.replace('fsq:', '');
      const { data: fsqPlace, error } = await supabase
        .from('fsq_places_raw')
        .select('*')
        .eq('fsq_place_id', fsqId)
        .single();

      if (error || !fsqPlace) {
        console.error('Error fetching FSQ place:', error);
        return null;
      }

      return transformFsqRawPlace(fsqPlace) as any;
    }

    // Regular place ID
    const { data: place, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error || !place) {
      console.error('Error fetching place:', error);
      return null;
    }

    // Fetch signals
    const { data: signals } = await supabase
      .from('place_signals_aggregated')
      .select('bucket, tap_total')
      .eq('place_id', placeId);

    // Fetch photos
    const { data: photos } = await supabase
      .from('place_photos')
      .select('photo_url')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    return {
      ...transformCanonicalPlace(place),
      signals: signals || [],
      photos: photos?.map((p) => p.photo_url) || [],
    } as any;
  } catch (error) {
    console.error('Error in fetchPlaceById:', error);
    return null;
  }
}

/**
 * Get place ID for navigation (handles different ID formats)
 */
export function getPlaceIdForNavigation(place: PlaceCard | Place): string {
  return place.id;
}
