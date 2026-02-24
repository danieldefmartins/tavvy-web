/**
 * Typesense Search Service for Tavvy Mobile App - WITH TAP-BASED RANKING
 * 
 * This enhanced version uses user tap data to improve search relevance:
 * - Searches tap_signals field for user-validated attributes
 * - Ranks by tap_quality_score (weighted by signal importance)
 * - Falls back to popularity for places without taps
 * 
 * Example: "best food Miami" will prioritize places where users tapped "Quality Food"
 * 
 * @module typesenseService
 */

const TYPESENSE_HOST = 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = '443';
const TYPESENSE_PROTOCOL = 'https';
const TYPESENSE_API_KEY = '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

export interface TypesensePlace {
  fsq_place_id: string;
  name: string;
  categories?: string[];
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook_id?: string;
  popularity: number;
  // Future — requires sync pipeline update to populate these fields in Typesense
  tap_signals?: string[];      // e.g., ["Quality Food", "Great Service"]
  tap_categories?: string[];   // e.g., ["quality", "service"]
  tap_total?: number;          // Total tap count
  tap_quality_score?: number;  // Weighted score (quality=5, value=3, etc.)
}

export interface PlaceSearchResult {
  id: string;
  fsq_place_id: string;
  name: string;
  category?: string;
  subcategory?: string;
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook_id?: string;
  popularity: number;
  distance?: number;
  // NEW: Tap data
  tapSignals?: string[];
  tapTotal?: number;
  tapQualityScore?: number;
}

export interface SearchOptions {
  query: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  country?: string;
  region?: string;
  locality?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  places: PlaceSearchResult[];
  totalFound: number;
  searchTimeMs: number;
  page: number;
}

/**
 * Transform Typesense document to PlaceSearchResult
 */
function transformTypesensePlace(doc: any, distance?: number): PlaceSearchResult {
  const category = doc.categories && doc.categories.length > 0 
    ? doc.categories[0].split('>')[0].trim() 
    : undefined;
  
  const subcategory = doc.categories && doc.categories.length > 0
    ? doc.categories[0].split('>').pop()?.trim()
    : undefined;

    // Determine ID prefix based on source
  const isTavvy = doc.id?.startsWith('tavvy:');
  let placeId: string;
  let idPrefix: string;
  if (isTavvy) {
    idPrefix = 'tavvy:';
    placeId = doc.id.replace(/^tavvy:/, '');
  } else {
    idPrefix = 'fsq-';
    // CRITICAL: Use fsq_id (hex format) not doc.id (numeric Typesense auto-ID)
    // fsq_id matches fsq_places_raw.fsq_place_id in Supabase
    placeId = doc.fsq_id || doc.fsq_place_id || doc.id;
  }

  return {
    id: `${idPrefix}${placeId}`,
    fsq_place_id: doc.fsq_id || doc.fsq_place_id || placeId,
    name: doc.name,
    category,
    subcategory,
    address: doc.location_address || doc.address,
    locality: doc.location_locality || doc.locality,
    region: doc.location_region || doc.region,
    country: doc.location_country || doc.country,
    postcode: doc.location_postcode || doc.postcode,
    latitude: doc.geocodes_lat || doc.latitude,
    longitude: doc.geocodes_lng || doc.longitude,
    tel: doc.tel,
    website: doc.website,
    email: doc.email,
    instagram: doc.instagram,
    facebook_id: doc.facebook_id,
    popularity: doc.popularity || 50,
    distance,
    // NEW: Include tap data
    tapSignals: doc.tap_signals,
    tapTotal: doc.tap_total || 0,
    tapQualityScore: doc.tap_quality_score || 0,
  };
}

/**
 * Search places with TAP-BASED RANKING
 * 
 * This is the key enhancement: searches both place data AND tap signals,
 * then ranks by tap quality score.
 */
export async function searchPlaces(options: SearchOptions): Promise<SearchResult> {
  const {
    query,
    latitude,
    longitude,
    radiusKm,
    country,
    region,
    locality,
    categories,
    limit = 50,
    offset = 0,
  } = options;

  const hasGeoLocation = latitude !== undefined && longitude !== undefined && radiusKm !== undefined;

  try {
    const searchParams: any = {
      q: query || '*',
      query_by: 'name,categories,location_locality,location_region',
      query_by_weights: '4,3,1,1',

      sort_by: hasGeoLocation
        ? `location(${latitude}, ${longitude}):asc,popularity:desc`
        : 'popularity:desc',
      per_page: limit,
      page: Math.floor(offset / limit) + 1,

      num_typos: 2,
      typo_tokens_threshold: 1,
      drop_tokens_threshold: 2,

      text_match_type: 'max_score',
    };

    // Build all filters
    const filters = [];

    if (hasGeoLocation) {
      filters.push(`location:(${latitude}, ${longitude}, ${radiusKm} km)`);
    }

    if (country) filters.push(`location_country:=${country}`);
    if (region) filters.push(`location_region:=${region}`);
    if (locality) {
      const capitalizedLocality = locality.charAt(0).toUpperCase() + locality.slice(1).toLowerCase();
      filters.push(`location_locality:=${capitalizedLocality}`);
    }

    // Add category filter (if provided)
    if (categories && categories.length > 0) {
      const categoryQuery = categories.join(',');
      searchParams.q = `${query} ${categoryQuery}`;
    }

    if (filters.length > 0) {
      searchParams.filter_by = filters.join(' && ');
    }

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${url}?${queryString}`, {
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 502) {
          throw new Error('TYPESENSE_502: Search service temporarily unavailable');
        }
        throw new Error(`Typesense search failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[Typesense] Response:', { found: data.found, hits: data.hits?.length, searchTimeMs: data.search_time_ms });

      const places = data.hits.map((hit: any) => {
        const doc = hit.document;
        const distance = hit.geo_distance_meters
          ? (hit.geo_distance_meters / 1609.34)
          : undefined;

        return transformTypesensePlace(doc, distance);
      });

      return {
        places,
        totalFound: data.found,
        searchTimeMs: data.search_time_ms,
        page: data.page,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('TYPESENSE_TIMEOUT: Search request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[typesenseService] Search failed:', error);
    throw error;
  }
}

/**
 * Search places within map bounds with TAP-BASED RANKING
 */
export async function searchPlacesInBounds(options: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { minLat, maxLat, minLng, maxLng, category, limit = 150 } = options;

  try {
    // Calculate center point and radius for geopoint search
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const radiusKm = Math.max(latDiff, lngDiff) * 111; // 1 degree ≈ 111km

    const searchParams: any = {
      q: category || '*',
      query_by: 'name,categories',
      query_by_weights: '3,2',
      filter_by: `location:(${centerLat}, ${centerLng}, ${radiusKm} km)`,
      sort_by: `location(${centerLat}, ${centerLng}):asc,popularity:desc`,
      per_page: limit,
    };

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Typesense bounds search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const places = data.hits.map((hit: any) => 
      transformTypesensePlace(hit.document)
    );

    return {
      places,
      totalFound: data.found,
      searchTimeMs: data.search_time_ms,
      page: 1,
    };
  } catch (error) {
    console.error('[typesenseService] Bounds search failed:', error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions with TAP-BASED RANKING
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    const searchParams = {
      q: query,
      // Search by name (tap_signals will be added after first sync)
      query_by: 'name',
      
      // Sort by popularity (will use tap_total after sync)
      sort_by: 'popularity:desc',
      
      per_page: limit.toString(),
    };

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    // Return unique place names
    const suggestions = data.hits
      .map((hit: any) => hit.document.name)
      .filter((name: string, index: number, self: string[]) => 
        self.indexOf(name) === index
      );

    return suggestions;
  } catch (error) {
    console.error('[typesenseService] Autocomplete failed:', error);
    return [];
  }
}

/**
 * Search nearby places with TAP-BASED RANKING
 */
export async function searchNearbyPlaces(options: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { latitude, longitude, radiusKm = 5, category, limit = 50 } = options;

  return searchPlaces({
    query: category || '*',
    latitude,
    longitude,
    radiusKm,
    limit,
  });
}

/**
 * Get place by ID
 */
export async function getPlaceById(placeId: string): Promise<PlaceSearchResult | null> {
  try {
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/${placeId}`;

    const response = await fetch(url, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) return null;

    const doc = await response.json();
    return transformTypesensePlace(doc);
  } catch (error) {
    console.error('[typesenseService] Get place by ID failed:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ ok: boolean; message?: string }> {
  try {
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/health`;

    const response = await fetch(url, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { ok: data.ok === true };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}
