/**
 * /api/search — Legacy autocomplete endpoint
 *
 * Preserved for backward compatibility. Internally delegates to the
 * canonical /api/search/places endpoint logic (same Typesense call).
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = process.env.TYPESENSE_PORT || '443';
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, userLat, userLng, limit = '8' } = req.query;

    if (!q || typeof q !== 'string' || q.length < 1) {
      return res.status(200).json({ suggestions: [] });
    }

    const limitNum = Math.min(parseInt(limit as string, 10) || 8, 20);
    const searchTerm = q.trim();

    const searchParams: Record<string, string> = {
      q: searchTerm,
      query_by: 'name,categories,location_locality,location_region,location_address',
      query_by_weights: '5,3,2,1,1',
      per_page: String(limitNum),
      page: '1',
      prefix: 'true',
      prioritize_exact_match: 'true',
      prioritize_token_position: 'true',
      num_typos: searchTerm.length <= 3 ? '0' : searchTerm.length <= 5 ? '1' : '2',
      text_match_type: 'max_score',
    };

    // Add location filter
    if (userLat && userLng) {
      const lat = parseFloat(userLat as string);
      const lng = parseFloat(userLng as string);
      searchParams.filter_by = `location:(${lat}, ${lng}, 50 km)`;
      searchParams.sort_by = `_text_match:desc,location(${lat}, ${lng}):asc,popularity:desc`;
    } else {
      searchParams.sort_by = '_text_match:desc,popularity:desc';
    }

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const qs = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${qs}`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
    });

    if (!response.ok) {
      console.error(`[API/search] Typesense ${response.status}`);
      return res.status(200).json({ suggestions: [] });
    }

    const data = await response.json();

    const suggestions = (data.hits || []).map((hit: any) => {
      const doc = hit.document;
      const fsqId = doc.fsq_id || doc.id;
      const isTavvy = doc.id?.toString().startsWith('tavvy:');

      return {
        id: isTavvy ? `tavvy:${fsqId}` : `fsq-${fsqId}`,
        name: doc.name,
        category: doc.categories?.[0]?.split('>')?.pop()?.trim() || 'Place',
        city: doc.location_locality,
        address: [doc.location_address, doc.location_locality, doc.location_region].filter(Boolean).join(', '),
        distance: hit.geo_distance_meters?.location
          ? hit.geo_distance_meters.location / 1609.34
          : undefined,
        latitude: doc.geocodes_lat,
        longitude: doc.geocodes_lng,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('[API/search] Error:', error.message);
    return res.status(200).json({ suggestions: [] });
  }
}
