/**
 * Canonical Search API — /api/search/places
 *
 * Single source of truth for place search across web + mobile.
 * All Typesense calls happen server-side only (ADMIN key never leaves the server).
 *
 * Supports:
 *   - Full-text search with ranking (name > categories > locality > region > address)
 *   - Geo radius filtering (lat/lng + radius)
 *   - Geo bounds filtering (minLat/maxLat/minLng/maxLng)
 *   - Category filtering
 *   - Autocomplete mode (prefix search)
 *   - Intent-lite parsing ("near me", city/state detection)
 *   - Typo tolerance tuned per query length
 *   - Pagination (page-based, shallow)
 *
 * Output shape (stable contract):
 *   { hits, found, searchTimeMs, page, query, filters }
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Typesense config (server-side only) ────────────────────────────────────
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = process.env.TYPESENSE_PORT || '443';
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

// ─── Rate limiting (in-memory, per-IP) ──────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 120; // 120 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ─── Intent-lite parser ─────────────────────────────────────────────────────
const US_STATES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};
const US_STATE_ABBREVS = new Set(Object.values(US_STATES));

interface ParsedIntent {
  cleanQuery: string;
  nearMe: boolean;
  locality?: string;
  region?: string;
}

function parseIntent(raw: string): ParsedIntent {
  let q = raw.trim();
  let nearMe = false;
  let locality: string | undefined;
  let region: string | undefined;

  // Detect "near me"
  if (/\bnear\s+me\b/i.test(q)) {
    nearMe = true;
    q = q.replace(/\bnear\s+me\b/i, '').trim();
  }

  // Detect trailing 2-letter state code: "pizza miami FL"
  const stateMatch = q.match(/^(.+?)\s+([A-Za-z]{2})$/);
  if (stateMatch) {
    const code = stateMatch[2].toUpperCase();
    if (US_STATE_ABBREVS.has(code)) {
      region = code;
      q = stateMatch[1].trim();
    }
  }

  // Detect full state name at end: "pizza in florida"
  if (!region) {
    const lower = q.toLowerCase();
    for (const [name, code] of Object.entries(US_STATES)) {
      if (lower.endsWith(name)) {
        region = code;
        q = q.slice(0, -name.length).trim();
        break;
      }
    }
  }

  // Detect "in <city>" or "near <city>"
  const cityMatch = q.match(/^(.+?)\s+(?:in|near)\s+(.+)$/i);
  if (cityMatch) {
    q = cityMatch[1].trim();
    locality = cityMatch[2].trim();
  }

  return { cleanQuery: q, nearMe, locality, region };
}

// ─── Typesense query builder ────────────────────────────────────────────────

interface SearchParams {
  q: string;
  query_by: string;
  query_by_weights: string;
  sort_by: string;
  per_page: number;
  page: number;
  prioritize_exact_match: string;
  prioritize_token_position: string;
  num_typos?: string;
  typo_tokens_threshold?: string;
  drop_tokens_threshold?: string;
  prefix?: string;
  highlight_full_fields?: string;
  highlight_affix_num_tokens?: string;
  filter_by?: string;
  facet_by?: string;
  text_match_type?: string;
}

function buildSearchParams(opts: {
  query: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  category?: string;
  locality?: string;
  region?: string;
  country?: string;
  page: number;
  limit: number;
  autocomplete: boolean;
}): SearchParams {
  const {
    query, lat, lng, radiusKm,
    minLat, maxLat, minLng, maxLng,
    category, locality, region, country,
    page, limit, autocomplete,
  } = opts;

  // ── Query fields & weights ──
  // name(5) > categories(3) > locality(2) > region(1) > address(1)
  const queryBy = 'name,categories,location_locality,location_region,location_address';
  const weights = '5,3,2,1,1';

  // ── Typo tolerance tuned by query length ──
  const qLen = query.replace(/\s+/g, '').length;
  let numTypos = '2';
  if (qLen <= 3) numTypos = '0';       // "mi", "bbq" — no typos
  else if (qLen <= 5) numTypos = '1';   // "pizza" — 1 typo max

  // ── Sort strategy ──
  // When geo + text query: text relevance first, then distance
  // When geo + wildcard: distance first
  // When no geo: relevance + popularity
  let sortBy = '_text_match:desc,popularity:desc';
  const hasGeo = lat !== undefined && lng !== undefined;
  const hasBounds = minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined;
  const isWildcard = !query || query === '*';

  if (hasGeo && !isWildcard) {
    // Text search with location: relevance first, distance as tiebreaker
    sortBy = `_text_match:desc,location(${lat}, ${lng}):asc,popularity:desc`;
  } else if (hasGeo && isWildcard) {
    // Nearby browse (no text): distance first
    sortBy = `location(${lat}, ${lng}):asc,popularity:desc`;
  } else if (hasBounds && isWildcard) {
    sortBy = 'popularity:desc';
  }

  // ── Filters ──
  const filters: string[] = [];
  if (hasGeo && radiusKm) {
    filters.push(`location:(${lat}, ${lng}, ${radiusKm} km)`);
  }
  if (hasBounds) {
    filters.push(`geocodes_lat:[${minLat}..${maxLat}]`);
    filters.push(`geocodes_lng:[${minLng}..${maxLng}]`);
  }
  if (category) {
    filters.push(`categories:${category}`);
  }
  if (locality) {
    filters.push(`location_locality:=${locality}`);
  }
  if (region) {
    filters.push(`location_region:=${region}`);
  }
  if (country) {
    filters.push(`location_country:=${country}`);
  }

  const params: SearchParams = {
    q: query || '*',
    query_by: queryBy,
    query_by_weights: weights,
    sort_by: sortBy,
    per_page: limit,
    page,
    prioritize_exact_match: 'true',
    prioritize_token_position: 'true',
    num_typos: numTypos,
    typo_tokens_threshold: '1',
    drop_tokens_threshold: '2',
    text_match_type: 'max_score',
    highlight_full_fields: 'name',
    highlight_affix_num_tokens: '4',
  };

  if (autocomplete) {
    params.prefix = 'true';
  }

  if (filters.length > 0) {
    params.filter_by = filters.join(' && ');
  }

  return params;
}

// ─── Hit transformer ────────────────────────────────────────────────────────

interface HitOutput {
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

function transformHit(hit: any): HitOutput {
  const doc = hit.document;

  // Parse categories — handle the malformed Python list repr
  let categories: string[] = [];
  if (doc.categories && Array.isArray(doc.categories)) {
    // Join and re-parse: "['Dining and Drinking > Cafe', ' Coffee', ' and Tea House > Coffee Shop']"
    const joined = doc.categories.join(',');
    const cleaned = joined.replace(/^\[['"]?|['"]?\]$/g, '');
    categories = cleaned.split("', '").map((c: string) =>
      c.replace(/^['"\s]+|['"\s]+$/g, '').trim()
    ).filter(Boolean);
  }

  // Build highlights map
  const highlights: Record<string, string> = {};
  if (hit.highlights && Array.isArray(hit.highlights)) {
    for (const h of hit.highlights) {
      if (h.snippet) {
        highlights[h.field] = h.snippet;
      }
    }
  }

  // Determine ID: prefer fsq_id, handle tavvy: prefix
  const rawId = doc.id?.toString() || '';
  const isTavvy = rawId.startsWith('tavvy:');
  const fsqId = doc.fsq_id || rawId.replace(/^tavvy:/, '');

  // Build stable ID format
  const stableId = isTavvy ? `tavvy:${fsqId}` : `fsq-${fsqId}`;

  return {
    id: stableId,
    fsq_place_id: fsqId,
    name: doc.name || '',
    categories,
    locality: doc.location_locality || undefined,
    region: doc.location_region || undefined,
    country: doc.location_country || undefined,
    address: doc.location_address || undefined,
    lat: doc.geocodes_lat || 0,
    lng: doc.geocodes_lng || 0,
    distance_meters: hit.geo_distance_meters?.location ?? hit.geo_distance_meters ?? undefined,
    score: hit.text_match_info ? Number(hit.text_match_info.score) : undefined,
    highlights: Object.keys(highlights).length > 0 ? highlights : undefined,
    popularity: doc.popularity ?? undefined,
    tel: doc.tel || undefined,
    website: doc.website || undefined,
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  try {
    // ── Parse & validate input ──
    const {
      q: rawQuery,
      lat: latStr,
      lng: lngStr,
      radius: radiusStr,
      minLat: minLatStr,
      maxLat: maxLatStr,
      minLng: minLngStr,
      maxLng: maxLngStr,
      category,
      locality: qLocality,
      region: qRegion,
      country: qCountry,
      page: pageStr,
      limit: limitStr,
      autocomplete: acStr,
    } = req.query;

    // Validate query
    let query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    if (query.length > 200) {
      return res.status(400).json({ error: 'Query too long (max 200 chars)' });
    }

    // Sanitize — strip control characters
    query = query.replace(/[\x00-\x1f]/g, '');

    // Parse numbers
    const lat = latStr ? parseFloat(latStr as string) : undefined;
    const lng = lngStr ? parseFloat(lngStr as string) : undefined;
    let radiusKm = radiusStr ? parseFloat(radiusStr as string) : undefined;
    if (radiusKm !== undefined) radiusKm = Math.min(radiusKm, 500); // cap at 500km

    const minLat = minLatStr ? parseFloat(minLatStr as string) : undefined;
    const maxLat = maxLatStr ? parseFloat(maxLatStr as string) : undefined;
    const minLng = minLngStr ? parseFloat(minLngStr as string) : undefined;
    const maxLng = maxLngStr ? parseFloat(maxLngStr as string) : undefined;

    let page = pageStr ? parseInt(pageStr as string, 10) : 1;
    if (page < 1) page = 1;
    if (page > 10) page = 10; // cap shallow paging

    let limit = limitStr ? parseInt(limitStr as string, 10) : 20;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const autocomplete = acStr === 'true' || acStr === '1';

    // ── Intent parsing ──
    const intent = parseIntent(query);
    let searchQuery = intent.cleanQuery;
    let filterLocality = (qLocality as string) || intent.locality;
    let filterRegion = (qRegion as string) || intent.region;
    const filterCountry = qCountry as string | undefined;
    const filterCategory = category as string | undefined;

    // "near me" → require lat/lng, set default radius
    if (intent.nearMe && lat !== undefined && lng !== undefined && !radiusKm) {
      radiusKm = 25; // default 25km for "near me"
    }

    // ── Build Typesense params ──
    const searchParams = buildSearchParams({
      query: searchQuery || '*',
      lat,
      lng,
      radiusKm,
      minLat,
      maxLat,
      minLng,
      maxLng,
      category: filterCategory,
      locality: filterLocality,
      region: filterRegion,
      country: filterCountry,
      page,
      limit,
      autocomplete,
    });

    // ── Execute Typesense search ──
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const qs = new URLSearchParams(searchParams as any).toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const tsResponse = await fetch(`${url}?${qs}`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!tsResponse.ok) {
      const errText = await tsResponse.text();
      console.error(`[search/places] Typesense ${tsResponse.status}: ${errText}`);
      return res.status(502).json({ error: 'Search service error', detail: errText });
    }

    const tsData = await tsResponse.json();

    // ── Transform hits ──
    const hits: HitOutput[] = (tsData.hits || []).map(transformHit);

    // ── Build response ──
    const response = {
      hits,
      found: tsData.found || 0,
      searchTimeMs: tsData.search_time_ms || 0,
      page,
      query: searchQuery,
      filters: {
        locality: filterLocality || null,
        region: filterRegion || null,
        country: filterCountry || null,
        category: filterCategory || null,
        nearMe: intent.nearMe,
        lat: lat ?? null,
        lng: lng ?? null,
        radiusKm: radiusKm ?? null,
      },
    };

    // Cache headers — 30s stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json(response);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[search/places] Typesense request timed out');
      return res.status(504).json({ error: 'Search request timed out' });
    }
    console.error('[search/places] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
