import { parseSearchQuery } from './smartQueryParser';

export interface SearchCoordinates { latitude: number; longitude: number }
export interface SearchBounds { minLat: number; maxLat: number; minLng: number; maxLng: number }
export interface SearchContext {
  coordinates?: SearchCoordinates;
  location?: string;
  mode?: 'current' | 'map' | 'anywhere';
  bounds?: SearchBounds;
  radiusKm?: number;
}
export interface SearchIntent extends SearchContext {
  query: string;
  city?: string;
  region?: string;
  country?: string;
  kind: 'named' | 'current' | 'map' | 'anywhere';
  label: string;
  needsLocation: boolean;
}
export function validCoordinates(value?: SearchCoordinates): value is SearchCoordinates {
  return !!value && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
export function resolveSearchIntent(query: string, context: SearchContext = {}): SearchIntent {
  const parsed = parseSearchQuery(query);
  const coordinates = validCoordinates(context.coordinates) ? context.coordinates : undefined;
  // A named destination in the submitted query always takes priority over device coordinates.
  const named = parsed.city ? parsed : !parsed.useCurrentLocation && context.location?.trim() ? parseSearchQuery(`${parsed.placeName} in ${context.location.trim()}`) : undefined;
  if (named?.city) return { query: named.placeName, city: named.city, region: named.region, country: named.country, kind: 'named', label: [named.city, named.region].filter(Boolean).join(', '), needsLocation: false };
  if (parsed.useCurrentLocation || context.mode === 'current') return { query: parsed.placeName, kind: 'current', coordinates, radiusKm: context.radiusKm || 50, label: coordinates ? 'Near me · within 50 km' : 'Current location needed', needsLocation: !coordinates };
  if (context.mode === 'map' && coordinates) return { query: parsed.placeName, kind: 'map', coordinates, bounds: context.bounds, radiusKm: context.radiusKm || 50, label: 'This map area', needsLocation: false };
  if (coordinates && context.mode !== 'anywhere') return { query: parsed.placeName, kind: 'current', coordinates, radiusKm: context.radiusKm || 50, label: 'Near me · within 50 km', needsLocation: false };
  return { query: parsed.placeName, kind: 'anywhere', label: 'Any location', needsLocation: false };
}
/** Context for a new typed query. Explicit relative intent cannot inherit a prior map center. */
export function submittedSearchContext(query: string, previous: SearchContext, device?: SearchCoordinates, location?: string): SearchContext {
  if (parseSearchQuery(query).useCurrentLocation) return { mode: 'current', coordinates: validCoordinates(device) ? device : undefined };
  return { ...previous, coordinates: previous.mode === 'map' ? previous.coordinates : device, location: location?.trim() || undefined };
}
export function isDiningSearch(query: string): boolean {
  return /\b(restaurant|restaurants|food|dining|dinner|lunch|breakfast|brunch|italian|pizza|pasta|sushi|cafe|cafes|coffee|bistro|steak|seafood|burger|tacos|mexican|chinese|thai|indian|bakery|bar|bars|pub)\b/i.test(query);
}
export function canonicalPlaceId(id: string, source?: string): string {
  const raw = String(id || '').replace(/^(?:tavvy:|places-|fsq[-:])/, '');
  return /^(?:tavvy:|places-)/.test(id) || (source !== 'fsq_raw' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(raw)) ? raw : `fsq:${raw}`;
}
export function distanceKm(a: SearchCoordinates, b: SearchCoordinates): number {
  const rad = Math.PI / 180, dLat = (b.latitude-a.latitude)*rad, dLng=(b.longitude-a.longitude)*rad;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
export interface SearchPlace {
  id: string; name: string; source?: 'places' | 'fsq_raw'; source_id?: string;
  city?: string; region?: string; country?: string; category?: string; subcategory?: string;
  latitude?: number; longitude?: number; address?: string; distance?: number;
  [key: string]: any;
}
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi, ' ').trim();
export function mergeSearchResults(candidates: SearchPlace[], intent: SearchIntent, limit: number): SearchPlace[] {
  const term = normalize(intent.query);
  const score = (place: SearchPlace) => {
    const name = normalize(place.name), category = normalize(`${place.category || ''} ${place.subcategory || ''}`);
    if (name === term) return 1000;
    if (name.startsWith(term)) return 800;
    if (name.includes(term)) return 600;
    const words = term.split(' ').filter(Boolean).map(w => w.replace(/s$/, ''));
    return words.reduce((total, word) => total + (name.includes(word) ? 40 : category.includes(word) ? 30 : 0), 0);
  };
  const merged: SearchPlace[] = [];
  // Prefer a canonical place record over its provider copy, independent of provider response order.
  for (const candidate of [...candidates].sort((a,b) => Number(b.source === 'places')-Number(a.source === 'places'))) {
    const place = { ...candidate, id: canonicalPlaceId(candidate.id, candidate.source) };
    if (intent.city && normalize(place.city || '') !== normalize(intent.city)) continue;
    if (intent.region && normalize(place.region || '') !== normalize(intent.region)) continue;
    if (intent.country && place.country && normalize(place.country) !== normalize(intent.country)) continue;
    if (intent.coordinates) {
      if (!validCoordinates(place as SearchCoordinates)) continue;
      const distance = distanceKm(intent.coordinates, place as SearchCoordinates);
      if (intent.bounds && (place.latitude! < intent.bounds.minLat || place.latitude! > intent.bounds.maxLat || place.longitude! < intent.bounds.minLng || place.longitude! > intent.bounds.maxLng)) continue;
      if (distance > (intent.radiusKm || 50)) continue;
      place.distance = distance * 1000; // One shared unit: meters.
    }
    const duplicate = merged.some(existing => existing.id === place.id
      || (!!existing.source_id && !!place.source_id && existing.source_id === place.source_id)
      || (normalize(existing.name) === normalize(place.name) && validCoordinates(existing as SearchCoordinates) && validCoordinates(place as SearchCoordinates) && distanceKm(existing as SearchCoordinates, place as SearchCoordinates) < 0.075));
    if (!duplicate) merged.push(place);
  }
  return merged.sort((a,b) => score(b)-score(a) || (a.distance ?? Infinity)-(b.distance ?? Infinity) || a.name.localeCompare(b.name)).slice(0, limit);
}
