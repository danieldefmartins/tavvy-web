import { supabase } from './supabaseClient';
import { searchPlaces as searchIndex } from './typesenseService';
import { canonicalPlaceId, mergeSearchResults, resolveSearchIntent, SearchContext, SearchIntent, SearchPlace } from './searchIntent';

export class SearchLocationRequired extends Error { code = 'LOCATION_REQUIRED'; }

function scopeQuery(query: any, intent: SearchIntent, fsq: boolean) {
  const literal = (value: string) => value.replace(/[%_]/g, '\\$&');
  if (intent.city) query = query.ilike(fsq ? 'locality' : 'city', literal(intent.city));
  if (intent.region) query = query.ilike('region', literal(intent.region));
  if (intent.country) query = query.ilike('country', literal(intent.country));
  if (intent.coordinates) {
    const lat = intent.coordinates.latitude, lng = intent.coordinates.longitude;
    const dy = (intent.radiusKm || 50) / 111.32;
    const dx = Math.min(180, dy / Math.max(.01, Math.cos(lat * Math.PI / 180)));
    const bounds = intent.bounds || { minLat: lat-dy, maxLat: lat+dy, minLng: lng-dx, maxLng: lng+dx };
    query = query.gte('latitude', bounds.minLat).lte('latitude', bounds.maxLat).gte('longitude', bounds.minLng).lte('longitude', bounds.maxLng);
  }
  return query;
}

/** Scope is applied in the database, before candidate limits. No fallback broadens it. */
export async function searchDatabase(intent: SearchIntent, limit: number, includeFsq = false, client: any = supabase): Promise<SearchPlace[]> {
  if (intent.needsLocation) throw new SearchLocationRequired('Allow location access or enter a city.');
  const terms = intent.query.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\s-]/gi, ' ').split(/\s+/).filter(Boolean)
    .filter(word => !['best', 'great', 'near', 'me'].includes(word)).map(word => word.replace(/restaurants$/, 'restaurant'));
  const request = async (fsq: boolean, exact = false) => {
    let q: any = client.from(fsq ? 'fsq_places_raw' : 'places').select(fsq
      ? 'fsq_place_id,name,locality,region,country,latitude,longitude,fsq_category_labels,address,tel,website'
      : 'id,source_id,name,city,region,country,tavvy_category,tavvy_subcategory,latitude,longitude,cover_image_url,photos,street,phone,website,slug');
    q = fsq ? q.is('date_closed', null) : q.eq('status', 'active');
    q = scopeQuery(q, intent, fsq);
    if (exact) q = q.ilike('name', intent.query.replace(/[%_]/g, '\\$&'));
    else for (const word of terms) q = q.or(fsq
      ? `name.ilike.%${word}%,fsq_category_labels.ilike.%${word}%`
      : `name.ilike.%${word}%,tavvy_category.ilike.%${word}%,tavvy_subcategory.ilike.%${word}%`);
    const response = await q.order('name').limit(limit);
    if (response.error) throw response.error;
    return (response.data || []).map((p: any): SearchPlace => ({
      id: fsq ? `fsq:${p.fsq_place_id}` : p.id, source: fsq ? 'fsq_raw' : 'places', source_id: fsq ? p.fsq_place_id : p.source_id || p.id,
      name: p.name, city: fsq ? p.locality : p.city, region: p.region, country: p.country,
      latitude: p.latitude, longitude: p.longitude, category: fsq ? (Array.isArray(p.fsq_category_labels) ? p.fsq_category_labels[0] : p.fsq_category_labels)?.split('>').at(-1)?.replace(/[\[\]"]/g, '').trim() : p.tavvy_category,
      subcategory: p.tavvy_subcategory, tavvy_category: p.tavvy_category,
      photo_url: p.cover_image_url, cover_image_url: p.cover_image_url, photos: p.photos, address: fsq ? p.address : p.street, address_line1: fsq ? p.address : p.street, phone: fsq ? p.tel : p.phone, website: p.website, slug: p.slug,
    }));
  };
  const responses = await Promise.allSettled([request(false, true), request(false), ...(includeFsq ? [request(true)] : [])]);
  if (responses.every(result => result.status === 'rejected')) throw new Error('Place search is temporarily unavailable.');
  return mergeSearchResults(responses.flatMap(result => result.status === 'fulfilled' ? result.value : []), intent, limit);
}

export interface PlaceSearchResponse { places: SearchPlace[]; intent: SearchIntent; partial: boolean }
export async function searchAcrossProviders(query: string, limit = 50, context: SearchContext = {}, dependencies: { database?: typeof searchDatabase; index?: typeof searchIndex } = {}): Promise<PlaceSearchResponse> {
  const intent = resolveSearchIntent(query, context);
  if (intent.needsLocation) throw new SearchLocationRequired('Allow location access or enter a city.');
  const take = Math.max(1, Math.min(50, limit));
  const database = dependencies.database || searchDatabase, index = dependencies.index || searchIndex;
  const responses = await Promise.allSettled([
    database(intent, Math.min(150, take * 3), false),
    index({ query: intent.query, locality: intent.city, region: intent.region, country: intent.country,
      latitude: intent.coordinates?.latitude, longitude: intent.coordinates?.longitude, radiusKm: intent.coordinates ? intent.radiusKm : undefined, limit: Math.min(150, take * 3) }),
  ]);
  let canonical = responses[0].status === 'fulfilled' ? responses[0].value : [];
  // Provider failure falls back to the same geographic scope and preserves Tavvy-created places.
  if (responses[1].status === 'rejected') {
    try { canonical = [...canonical, ...await database(intent, Math.min(150, take * 3), true)]; }
    catch { if (responses[0].status === 'rejected') throw new Error('Place search is temporarily unavailable.'); }
  }
  const indexed: SearchPlace[] = responses[1].status === 'fulfilled' ? responses[1].value.places.map(p => ({
    ...p, id: canonicalPlaceId(p.id), source: canonicalPlaceId(p.id).startsWith('fsq:') ? 'fsq_raw' : 'places', source_id: p.fsq_place_id,
    city: p.locality, category: p.subcategory || p.category, phone: p.tel, address_line1: p.address,
  })) : [];
  return { places: mergeSearchResults([...canonical, ...indexed], intent, take), intent, partial: responses.some(result => result.status === 'rejected') };
}
