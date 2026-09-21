export const RV_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏕️' },
  { id: 'rv-parks', label: 'RV Parks', icon: '🚐' },
  { id: 'campgrounds', label: 'Campgrounds', icon: '⛺' },
  { id: 'national-parks', label: 'National Parks', icon: '🌲' },
  { id: 'glamping', label: 'Glamping', icon: '🏠' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'boondocking', label: 'Boondocking', icon: '🌄' },
  { id: 'overnight-parking', label: 'Overnight Parking', icon: '🅿️' },
  { id: 'dump-stations', label: 'Dump Stations', icon: '💧' },
] as const;
export type RVCategory = typeof RV_CATEGORIES[number]['id'];
export type RVPlace = { id: string; name: string; tavvy_category: string | null; tavvy_subcategory: string | null; city: string | null; region: string | null; cover_image_url: string | null; photos: unknown; status: string };
const ALIASES: Record<Exclude<RVCategory, 'all'>, string[]> = {
  'rv-parks': ['rv_park', 'rv_parks', 'rv_resort', 'rv_resorts'],
  campgrounds: ['campground', 'campgrounds', 'established_campground', 'campsite', 'campsites'],
  'national-parks': ['national_park', 'national_parks'],
  glamping: ['glamping', 'glamping_site', 'glamping_sites'],
  beaches: ['beach', 'beaches'],
  boondocking: ['boondocking', 'dispersed_camping'],
  'overnight-parking': ['overnight_parking', 'overnight_parking_spot'],
  'dump-stations': ['dump_station', 'dump_stations', 'rv_dump_station'],
};
// Provider taxonomy is a path. Match its final category, not a substring such as Beach Bar.
const LEAVES: Record<Exclude<RVCategory, 'all'>, string[]> = {
  'rv-parks': ['RV Park', 'RV Resort'], campgrounds: ['Campground', 'Campsite'],
  'national-parks': ['National Park'], glamping: ['Glamping'], beaches: ['Beach'],
  boondocking: ['Boondocking', 'Dispersed Camping'], 'overnight-parking': ['Overnight Parking'], 'dump-stations': ['Dump Station', 'RV Dump Station'],
};
export function isRVCategory(value: unknown): value is RVCategory { return RV_CATEGORIES.some(c => c.id === value); }
function quotedPattern(value: string) { return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
function facetClauses(category: Exclude<RVCategory, 'all'>): string[] {
  const clauses: string[] = [];
  for (const alias of ALIASES[category]) for (const field of ['tavvy_category', 'tavvy_subcategory']) clauses.push(`${field}.ilike.${quotedPattern(alias)}`);
  for (const leaf of LEAVES[category]) for (const suffix of [']', '']) clauses.push(`tavvy_subcategory.ilike.${quotedPattern('%> ' + leaf + suffix)}`);
  return clauses;
}
export function rvCatalogFilter(category: RVCategory, query: string): string {
  if (!isRVCategory(category)) throw new Error('Choose a valid place category.');
  const categoryParts = category === 'all' ? ['tavvy_category.eq.rv_camping', ...Object.keys(ALIASES).flatMap(c => facetClauses(c as Exclude<RVCategory, 'all'>))] : facetClauses(category);
  const parts = [`or(${categoryParts.join(',')})`];
  const tokens = query.trim().slice(0, 120).split(/\s+/).filter(Boolean).slice(0, 8);
  for (const token of tokens) {
    const value = quotedPattern('%' + token.replace(/[%_*]/g, c => '\\' + c) + '%');
    parts.push(`or(${['name', 'city', 'region'].map(field => `${field}.ilike.${value}`).join(',')})`);
  }
  return `and(${parts.join(',')})`;
}
export function rvPlacePhoto(place: Pick<RVPlace, 'cover_image_url' | 'photos'>): string | null {
  const candidates = [place.cover_image_url, ...(Array.isArray(place.photos) ? place.photos.map(p => typeof p === 'string' ? p : p?.url) : [])];
  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    try { const url = new URL(value); if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href; } catch { /* Missing/invalid media uses a neutral placeholder. */ }
  }
  return null;
}
export function rvPlaceCategory(place: Pick<RVPlace, 'tavvy_category' | 'tavvy_subcategory'>): string {
  const raw = place.tavvy_subcategory || place.tavvy_category || '';
  return raw.split('>').at(-1)?.replace(/[\[\]]/g, '').trim().replace(/_/g, ' ') || '';
}
/** Pure canonical browse classification; subcategory takes precedence over its broader category. */
export function rvPlaceBucket(place: Pick<RVPlace, 'tavvy_category' | 'tavvy_subcategory'>): RVCategory | null {
  const normalize = (value: string) => value.split('>').at(-1)!.replace(/[\[\]]/g, '').trim().toLowerCase().replace(/[ -]+/g, '_');
  for (const value of [place.tavvy_subcategory, place.tavvy_category]) {
    if (!value) continue;
    const normalized = normalize(value);
    for (const [bucket, aliases] of Object.entries(ALIASES)) if (aliases.includes(normalized)) return bucket as RVCategory;
  }
  return place.tavvy_category === 'rv_camping' ? 'all' : null;
}
