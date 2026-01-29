/**
 * Typesense Search Service for Tavvy Web App
 * 
 * Provides lightning-fast search across 65.7M places with <50ms response times.
 * Replaces slow Supabase ILIKE queries.
 */

import Typesense from 'typesense';
import type { PlaceCard } from './placeService';

// Initialize Typesense client
const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: 'tavvy-typesense-production.up.railway.app',
      port: 443,
      protocol: 'https',
    },
  ],
  apiKey: '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277',
  connectionTimeoutSeconds: 10,
  numRetries: 3,
  retryIntervalSeconds: 0.5,
});

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
  places: PlaceCard[];
  totalFound: number;
  searchTimeMs: number;
  page: number;
}

/**
 * Transform Typesense place to PlaceCard format
 */
function transformTypesensePlace(doc: TypesensePlace, distance?: number): PlaceCard {
  const category = doc.categories && doc.categories.length > 0 
    ? doc.categories[0].split('>')[0].trim() 
    : 'Other';
  
  const subcategory = doc.categories && doc.categories.length > 0
    ? doc.categories[0].split('>').pop()?.trim()
    : undefined;

  return {
    id: `fsq:${doc.fsq_place_id}`,
    source: 'fsq_raw',
    source_id: doc.fsq_place_id,
    source_type: 'fsq',
    name: doc.name,
    latitude: doc.latitude || 0,
    longitude: doc.longitude || 0,
    address: doc.address,
    address_line1: doc.address,
    city: doc.locality,
    state_region: doc.region,
    region: doc.region,
    country: doc.country,
    postcode: doc.postcode,
    category,
    subcategory,
    primary_category: category,
    phone: doc.tel,
    website: doc.website,
    email: doc.email,
    cover_image_url: undefined,
    photo_url: undefined,
    photos: [],
    status: 'active',
    current_status: 'active',
    distance,
  };
}

/**
 * Search places using Typesense
 * 
 * @param options Search options
 * @returns Search results with places and metadata
 */
export async function searchPlacesTypesense(
  options: SearchOptions
): Promise<SearchResult> {
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

  // Build filter query
  const filters: string[] = [];
  
  if (country) {
    filters.push(`country:=${country}`);
  }
  
  if (region) {
    filters.push(`region:=${region}`);
  }
  
  if (locality) {
    filters.push(`locality:=${locality}`);
  }

  if (categories && categories.length > 0) {
    const categoryFilter = categories.map(c => `categories:=${c}`).join(' || ');
    filters.push(`(${categoryFilter})`);
  }

  // Calculate page number (Typesense uses 1-indexed pages)
  const page = Math.floor(offset / limit) + 1;

  // Build search parameters
  const searchParameters: any = {
    q: query || '*',
    query_by: 'name,categories,address,locality,region',
    filter_by: filters.length > 0 ? filters.join(' && ') : undefined,
    sort_by: 'popularity:desc',
    per_page: limit,
    page: page,
  };

  // Add geo-search if location provided
  if (latitude !== undefined && longitude !== undefined) {
    searchParameters.filter_by = filters.length > 0 
      ? `${filters.join(' && ')} && location:(${latitude}, ${longitude}, ${radiusKm} km)`
      : `location:(${latitude}, ${longitude}, ${radiusKm} km)`;
    searchParameters.sort_by = `location(${latitude}, ${longitude}):asc,popularity:desc`;
  }

  try {
    const startTime = Date.now();
    const searchResults = await typesenseClient
      .collections('places')
      .documents()
      .search(searchParameters);
    const searchTimeMs = Date.now() - startTime;

    const places: PlaceCard[] = (searchResults.hits || []).map((hit: any) => {
      const doc = hit.document as TypesensePlace;
      const distance = hit.geo_distance_meters 
        ? Math.round(hit.geo_distance_meters.location / 1609.34 * 10) / 10 // Convert to miles
        : undefined;
      return transformTypesensePlace(doc, distance);
    });

    console.log(`[Typesense] Found ${searchResults.found} places in ${searchTimeMs}ms`);

    return {
      places,
      totalFound: searchResults.found || 0,
      searchTimeMs,
      page,
    };
  } catch (error) {
    console.error('[Typesense] Search error:', error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 10,
  latitude?: number,
  longitude?: number
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const searchParams: any = {
      q: query,
      query_by: 'name,categories',
      per_page: limit,
      prefix: true,
    };

    // Prioritize nearby results if location provided
    if (latitude !== undefined && longitude !== undefined) {
      searchParams.sort_by = `location(${latitude}, ${longitude}):asc`;
    }

    const searchResults = await typesenseClient
      .collections('places')
      .documents()
      .search(searchParams);

    const suggestions = new Set<string>();
    
    (searchResults.hits || []).forEach((hit: any) => {
      const doc = hit.document;
      suggestions.add(doc.name);
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('[Typesense] Autocomplete error:', error);
    return [];
  }
}

/**
 * Search places within map bounds using Typesense
 */
export async function searchPlacesInBounds(
  bounds: {
    ne: [number, number];
    sw: [number, number];
  },
  category?: string,
  limit: number = 150
): Promise<PlaceCard[]> {
  const minLng = bounds.sw[0];
  const maxLng = bounds.ne[0];
  const minLat = bounds.sw[1];
  const maxLat = bounds.ne[1];

  try {
    const filters: string[] = [
      `latitude:>=${minLat}`,
      `latitude:<=${maxLat}`,
      `longitude:>=${minLng}`,
      `longitude:<=${maxLng}`,
    ];

    if (category && category !== 'All') {
      filters.push(`categories:=${category}`);
    }

    const searchResults = await typesenseClient
      .collections('places')
      .documents()
      .search({
        q: '*',
        query_by: 'name',
        filter_by: filters.join(' && '),
        sort_by: 'popularity:desc',
        per_page: limit,
      });

    return (searchResults.hits || []).map((hit: any) => 
      transformTypesensePlace(hit.document as TypesensePlace)
    );
  } catch (error) {
    console.error('[Typesense] Bounds search error:', error);
    throw error;
  }
}

/**
 * Get place by Foursquare ID
 */
export async function getPlaceByIdTypesense(
  fsqPlaceId: string
): Promise<PlaceCard | null> {
  try {
    const result = await typesenseClient
      .collections('places')
      .documents()
      .search({
        q: fsqPlaceId,
        query_by: 'fsq_place_id',
        filter_by: `fsq_place_id:=${fsqPlaceId}`,
        per_page: 1,
      });

    if (result.hits && result.hits.length > 0) {
      return transformTypesensePlace(result.hits[0].document as TypesensePlace);
    }

    return null;
  } catch (error) {
    console.error('[Typesense] Get place by ID error:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function typesenseHealthCheck(): Promise<boolean> {
  try {
    const health = await typesenseClient.health.retrieve();
    return health.ok === true;
  } catch (error) {
    console.error('[Typesense] Health check failed:', error);
    return false;
  }
}

/**
 * Get collection stats
 */
export async function getTypesenseStats(): Promise<{
  numDocuments: number;
  isHealthy: boolean;
} | null> {
  try {
    const collection = await typesenseClient.collections('places').retrieve();
    const health = await typesenseHealthCheck();
    
    return {
      numDocuments: collection.num_documents || 0,
      isHealthy: health,
    };
  } catch (error) {
    console.error('[Typesense] Get stats error:', error);
    return null;
  }
}

export { typesenseClient };
