/**
 * searchClient.ts
 *
 * Client-side search helper that calls the canonical /api/search/places endpoint.
 * Replaces all direct Supabase ILIKE search and direct Typesense client calls.
 *
 * Features:
 *   - Debounce-ready (caller handles debounce)
 *   - AbortController support (cancel in-flight requests)
 *   - Typed response matching the API contract
 *   - Configurable base URL for mobile reuse
 */

// ─── Types (mirror API output) ──────────────────────────────────────────────

export interface SearchHit {
  id: string;
  fsq_place_id: string;
  name: string;
  categories: string[];
  locality?: string;
  region?: string;
  country?: string;
  address?: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  score?: number;
  highlights?: Record<string, string>;
  popularity?: number;
  tel?: string;
  website?: string;
}

export interface SearchResponse {
  hits: SearchHit[];
  found: number;
  searchTimeMs: number;
  page: number;
  query: string;
  filters: {
    locality: string | null;
    region: string | null;
    country: string | null;
    category: string | null;
    nearMe: boolean;
    lat: number | null;
    lng: number | null;
    radiusKm: number | null;
  };
}

export interface SearchClientOptions {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  category?: string;
  locality?: string;
  region?: string;
  country?: string;
  page?: number;
  limit?: number;
  autocomplete?: boolean;
  signal?: AbortSignal;
}

// ─── Base URL ───────────────────────────────────────────────────────────────
// For web: relative path. For mobile: set via env.
const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_BASE_URL || '');

// ─── Search function ────────────────────────────────────────────────────────

export async function searchPlaces(options: SearchClientOptions): Promise<SearchResponse> {
  const params = new URLSearchParams();

  if (options.q) params.set('q', options.q);
  if (options.lat !== undefined) params.set('lat', String(options.lat));
  if (options.lng !== undefined) params.set('lng', String(options.lng));
  if (options.radius !== undefined) params.set('radius', String(options.radius));
  if (options.minLat !== undefined) params.set('minLat', String(options.minLat));
  if (options.maxLat !== undefined) params.set('maxLat', String(options.maxLat));
  if (options.minLng !== undefined) params.set('minLng', String(options.minLng));
  if (options.maxLng !== undefined) params.set('maxLng', String(options.maxLng));
  if (options.category) params.set('category', options.category);
  if (options.locality) params.set('locality', options.locality);
  if (options.region) params.set('region', options.region);
  if (options.country) params.set('country', options.country);
  if (options.page !== undefined) params.set('page', String(options.page));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.autocomplete) params.set('autocomplete', 'true');

  const url = `${BASE_URL}/api/search/places?${params.toString()}`;

  const response = await fetch(url, {
    signal: options.signal,
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Search API error ${response.status}: ${errBody}`);
  }

  return response.json();
}

// ─── Convenience: autocomplete suggestions ──────────────────────────────────

export async function searchAutocomplete(
  query: string,
  options?: {
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchHit[]> {
  if (!query || query.trim().length < 1) return [];

  const result = await searchPlaces({
    q: query,
    autocomplete: true,
    limit: options?.limit || 8,
    lat: options?.lat,
    lng: options?.lng,
    radius: options?.radius || (options?.lat ? 50 : undefined),
    signal: options?.signal,
  });

  return result.hits;
}

// ─── Convenience: bounds search (map view) ──────────────────────────────────

export async function searchInBounds(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  options?: {
    category?: string;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchResponse> {
  return searchPlaces({
    ...bounds,
    category: options?.category,
    limit: options?.limit || 150,
    signal: options?.signal,
  });
}

// ─── Convenience: nearby search ─────────────────────────────────────────────

export async function searchNearby(
  lat: number,
  lng: number,
  options?: {
    query?: string;
    radius?: number;
    category?: string;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchResponse> {
  return searchPlaces({
    q: options?.query || '*',
    lat,
    lng,
    radius: options?.radius || 25,
    category: options?.category,
    limit: options?.limit || 50,
    signal: options?.signal,
  });
}
