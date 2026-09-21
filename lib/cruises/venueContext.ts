/** Read-only onboard context. A failed cruise lookup must never become a land-place fallback. */
export interface CruiseVenueContext {
  venue_id: string; venue_name: string; place_id: string; ship_id: string; universe_id: string;
  ship_name: string; ship_slug: string; operator_name: string; kind: string; review_category: string;
  deck_label: string | null; included: boolean | null; availability_note: string | null;
  description: string | null; official_url: string | null; accepts_reviews: boolean;
  sources: { id: string; url: string; publisher: string; checked_at: string; source_type: string }[];
}
export class CruiseVenueReadError extends Error {
  constructor(public readonly reason: 'hidden' | 'unavailable') {
    super(reason === 'hidden' ? 'This onboard place is not available.' : 'Onboard place information could not be loaded. Please try again.');
    this.name = 'CruiseVenueReadError';
  }
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const categories = new Set(['restaurant','cafe','nightlife','shopping','beauty','fitness','entertainment','other']);
const nullable = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
export function safeVenueWebsite(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
export function parseCruiseVenueContext(value: unknown, placeId: string, sourceId?: string | null): CruiseVenueContext {
  const c = value as Record<string, any> | null;
  if (!c || !['venue_id','place_id','ship_id','universe_id'].every(key => uuid(c[key]))
    || c.place_id.toLowerCase() !== placeId.toLowerCase()
    || !['venue_name','ship_name','ship_slug','operator_name','kind'].every(key => text(c[key]))
    || !/^[a-z0-9][a-z0-9-]*$/.test(c.ship_slug) || !categories.has(c.review_category)
    || typeof c.accepts_reviews !== 'boolean' || (c.included !== null && typeof c.included !== 'boolean')
    || (sourceId != null && sourceId !== `cruise-venue:${c.ship_id}:${c.venue_id}`)) throw new CruiseVenueReadError('unavailable');
  return { venue_id:c.venue_id,venue_name:c.venue_name,place_id:c.place_id,ship_id:c.ship_id,universe_id:c.universe_id,
    ship_name:c.ship_name,ship_slug:c.ship_slug,operator_name:c.operator_name,kind:c.kind,review_category:c.review_category,
    deck_label:nullable(c.deck_label),included:c.included,availability_note:nullable(c.availability_note),description:nullable(c.description),
    official_url:safeVenueWebsite(c.official_url),accepts_reviews:c.accepts_reviews,
    sources:Array.isArray(c.sources)?c.sources.flatMap((s:any)=>s && text(s.id) && text(s.publisher) && text(s.checked_at) && text(s.source_type) && safeVenueWebsite(s.url)
      ? [{id:s.id,url:safeVenueWebsite(s.url)!,publisher:s.publisher,checked_at:s.checked_at,source_type:s.source_type}] : []):[],
  };
}
export async function loadCruiseVenueContext(client: any, place: { id: string; source_type?: string; source_id?: string | null }): Promise<CruiseVenueContext | null> {
  if (place.source_type !== 'cruise_venue') return null;
  if (!uuid(place.id)) throw new CruiseVenueReadError('unavailable');
  let result: any;
  try { result = await client.rpc('get_cruise_venue_context_v1', { p_place_id: place.id }); }
  catch { throw new CruiseVenueReadError('unavailable'); }
  if (result?.error) throw new CruiseVenueReadError('unavailable');
  if (result?.data == null) throw new CruiseVenueReadError('hidden');
  return parseCruiseVenueContext(result.data, place.id, place.source_id);
}
export const cruiseVenueShipHref = (context: CruiseVenueContext) => `/app/cruises/${encodeURIComponent(context.ship_slug)}`;
export const CRUISE_VENUE_STORY_NOTICE = 'Story uploads are not available for onboard places yet.';
export const CRUISE_VENUE_REVIEW_NOTICE = 'Reviews are available when this ship is operating.';
