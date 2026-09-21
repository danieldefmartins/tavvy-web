/** Public On The Go map contract. Keep web/mobile behavior aligned. */
export interface MobileBusiness {
  tavvy_place_id: string; place_name: string; session_id?: string;
  category?: string; subcategory?: string; cover_image_url?: string;
  canonical_place_id?: string | null; phone?: string; service_area?: string; started_at?: string;
  session_lat?: number; session_lng?: number; session_address?: string;
  location_label?: string; today_note?: string; scheduled_end_at?: string;
  is_live: boolean; has_schedule?: boolean;
  next_event?: { latitude: number; longitude: number; location_name: string; location_address?: string; scheduled_start: string; scheduled_end: string };
  next_event_label?: string;
}
export const BUSINESS_FILTERS = [
  ['all', 'All'], ['live', 'Live Now'], ['scheduled', 'Scheduled'], ['food', 'Food Trucks'], ['coffee', 'Coffee'],
  ['ice-cream', 'Ice Cream'], ['pet-grooming', 'Pet Care'], ['car-wash', 'Car Wash'],
  ['auto-detailing', 'Detailing'], ['mechanic', 'Mechanic'], ['hair-beauty', 'Hair & Beauty'],
  ['massage', 'Massage'], ['notary', 'Notary'], ['photography', 'Photo Booth'], ['dj', 'DJ'], ['other', 'Other'],
];
const categories: Record<string, RegExp> = {
  food: /food|truck|bbq|barbecue|taco|pizza|pop.?up|catering/,
  coffee: /coffee|cafe/, 'ice-cream': /ice.?cream|gelato/,
  'pet-grooming': /pet|dog|groom|vet/, 'car-wash': /car.?wash/,
  'auto-detailing': /detail/, mechanic: /mechanic|tire|auto.?repair/,
  'hair-beauty': /hair|barber|salon|beauty|nail/, massage: /massage/,
  notary: /notary/, photography: /photo/, dj: /\bdj\b|disc.?jockey/,
};
export const normalizeBusinessText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ');
export function matchesBusiness(b: MobileBusiness, filter: string, query = '') {
  const category = normalizeBusinessText(`${b.category || ''} ${b.subcategory || ''}`);
  const aliases = Object.entries(categories).filter(([,pattern])=>pattern.test(category)).map(([id])=>id==='coffee'?'coffee cafe espresso':id==='hair-beauty'?'hair beauty barber salon':id.replace(/-/g,' ')).join(' ');
  const search = normalizeBusinessText([b.place_name, category, aliases, b.service_area, b.session_address, b.location_label, b.next_event?.location_name, b.next_event?.location_address].filter(Boolean).join(' '));
  if (!normalizeBusinessText(query).trim().split(/\s+/).every(token => search.includes(token))) return false;
  if (filter === 'all') return true;
  if (filter === 'live') return b.is_live;
  if (filter === 'scheduled') return !b.is_live;
  if (filter === 'other') return !Object.values(categories).some(pattern => pattern.test(category));
  return categories[filter]?.test(category) || false;
}
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    typeof lng === 'number' && Number.isFinite(lng) && Math.abs(lng) <= 180;
}
export function normalizeMapData(data: any, now = Date.now()): { sessions: MobileBusiness[]; scheduled: MobileBusiness[] } {
  if (!data?.success || !Array.isArray(data.sessions) || !Array.isArray(data.scheduled_places)) {
    throw new Error('Mobile business data is unavailable. Please try again.');
  }
  const valid = (b: any) => b && typeof b.tavvy_place_id === 'string' && b.tavvy_place_id.trim() && typeof b.place_name === 'string' && b.place_name.trim();
  const unique = (rows: MobileBusiness[]) => Array.from(new Map(rows.map(b => [b.tavvy_place_id, b])).values());
  // A missing/invalid expiry is not evidence that a business is live indefinitely.
  const sessions = unique(data.sessions.filter((b: any) => valid(b) && b.is_live === true && Date.parse(b.scheduled_end_at) > now));
  const liveIds = new Set(sessions.map(b => b.tavvy_place_id));
  const scheduled = unique(data.scheduled_places.filter((b: any) => valid(b) && !liveIds.has(b.tavvy_place_id) &&
    Date.parse(b.next_event?.scheduled_end) > now && Date.parse(b.next_event?.scheduled_start) < Date.parse(b.next_event?.scheduled_end))
    .map((b: MobileBusiness) => ({ ...b, is_live: false })));
  return { sessions, scheduled };
}
export function businessPoint(b: MobileBusiness): [number, number] | null {
  const lat = b.is_live ? b.session_lat : b.next_event?.latitude;
  const lng = b.is_live ? b.session_lng : b.next_event?.longitude;
  return validCoordinates(lat, lng) ? [lat!, lng!] : null;
}
export function distanceKm(a: [number,number], b: [number,number]) {
  const radians = (n: number) => n * Math.PI / 180;
  const dlat = radians(b[0]-a[0]), dlng = radians(b[1]-a[1]);
  const x = Math.sin(dlat/2)**2 + Math.cos(radians(a[0]))*Math.cos(radians(b[0]))*Math.sin(dlng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0,1-x)));
}
export function selectBusinesses(rows: MobileBusiness[], filter: string, query: string, location: [number,number] | null, nearby: boolean) {
  return rows.filter(b => matchesBusiness(b,filter,query)).map(b => ({business:b,distance: location && businessPoint(b) ? distanceKm(location,businessPoint(b)!) : Infinity}))
    .filter(b => !nearby || (location && b.distance <= 50))
    .sort((a,b) => Number(b.business.is_live)-Number(a.business.is_live) || (location ? a.distance-b.distance : 0) || a.business.place_name.localeCompare(b.business.place_name))
    .map(b => b.business);
}
export function businessTime(value?: string, locale?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  return new Date(value).toLocaleString(locale, {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
}
export function businessDirections(b: MobileBusiness) {
  const p = businessPoint(b);
  return p ? `https://www.google.com/maps/dir/?api=1&destination=${p[0]},${p[1]}` : null;
}
export function safeBusinessUrl(value?: string | null, scheme: 'web' | 'phone' = 'web') {
  if (!value?.trim()) return null;
  if (scheme === 'phone') { const number = value.replace(/[^+0-9*#,;]/g,''); return number && /[0-9]/.test(number) ? `tel:${number}` : null; }
  try { const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
