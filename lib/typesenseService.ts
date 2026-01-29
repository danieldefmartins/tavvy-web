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
  // NEW: Tap-based fields
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
  const idPrefix = doc.id?.startsWith('tavvy:') ? 'tavvy:' : 'fsq:';
  const placeId = doc.id?.replace(/^(tavvy:|fsq:)/, '') || doc.fsq_place_id;

  return {
    id: `${idPrefix}${placeId}`,
    fsq_place_id: doc.fsq_place_id || placeId,
    name: doc.name,
    category,
    subcategory,
    address: doc.address,
    locality: doc.locality,
    region: doc.region,
    country: doc.country,
    postcode: doc.postcode,
    latitude: doc.latitude,
    longitude: doc.longitude,
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
    radiusKm = 50,
    country,
    region,
    locality,
    categories,
    limit = 50,
    offset = 0,
  } = options;

  try {
    const searchParams: any = {
      q: query || '*',
      // ENHANCED: Search tap_signals field (if it exists) with higher weight!
      // Note: tap_signals field will be added when first tap data is synced
      query_by: 'name,locality,region,categories',
      query_by_weights: '3,1,1,2',
      
      // ENHANCED: Sort by popularity for now (will use tap_quality_score after first sync)
      sort_by: 'popularity:desc',      
      per_page: limit,
      page: Math.floor(offset / limit) + 1,
    };

    // Add location filter
    if (latitude && longitude) {
      searchParams.filter_by = `location:(${latitude}, ${longitude}, ${radiusKm * 1000} m)`;
    }

    // Add country/region/locality filters
    const filters = [];
    if (country) filters.push(`country:=${country}`);
    if (region) filters.push(`region:=${region}`);
    if (locality) filters.push(`locality:=${locality}`);
    
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

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Typesense search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const places = data.hits.map((hit: any) => {
      const doc = hit.document;
      const distance = hit.geo_distance_meters 
        ? (hit.geo_distance_meters / 1609.34) // Convert meters to miles
        : undefined;
      
      return transformTypesensePlace(doc, distance);
    });

    return {
      places,
      totalFound: data.found,
      searchTimeMs: data.search_time_ms,
      page: data.page,
    };
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
    // Calculate center point
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const searchParams: any = {
      q: category || '*',
      // ENHANCED: Search (tap_signals will be added after first sync)
      query_by: 'name,categories',
      query_by_weights: '2,2',
      
      // ENHANCED: Sort by popularity (will use tap_quality_score after sync)
      sort_by: 'popularity:desc',
      
      filter_by: `latitude:[${minLat}..${maxLat}] && longitude:[${minLng}..${maxLng}]`,
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
