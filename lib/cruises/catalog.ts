/** Ship identity and sourced facts. A ship is not its operator, a port or a sailing. */
export type CruiseKind = 'ocean' | 'river' | 'expedition';
export type CruiseOperatingStatus = 'operating' | 'announced' | 'laid_up' | 'retired' | 'unknown';
export type CruisePublicationStatus = 'draft' | 'published' | 'archived';
export type CruiseSource = { id: string; url: string; publisher: string; checked_at: string; source_type: 'operator' | 'registry' | 'shipyard' | 'other' };
export type CruiseFactKey = keyof typeof CRUISE_FACT_DEFINITIONS;
export type CruiseFact = { key: CruiseFactKey; value: number | string | boolean | null; source_ids: string[]; as_of: string; verification: 'verified' | 'conflicting' | 'unverified'; note?: string | null };
export type CruiseNameHistory = { name: string; operator_name: string | null; valid_from: string | null; valid_until: string | null; source_ids: string[] };
export type CruiseCabinCategory = { id: string; name: string; description: string | null; accessible: boolean | null; source_ids: string[] };
export type CruiseVenueKind = 'restaurant' | 'cafe' | 'bar' | 'shop' | 'theatre' | 'entertainment' | 'pool' | 'spa' | 'fitness' | 'kids_club' | 'other';
export type CruiseVenue = {
 id: string; ship_id: string; name: string; kind: CruiseVenueKind;
 /** Existing canonical place identity, when linked; never the ship's universe UUID. */
 place_id: string | null; description: string | null; deck_label: string | null;
 included: boolean | null; availability_note: string | null; source_ids: string[];
 verification: 'verified' | 'unverified';
};
export type CruiseShip = {
 id: string; universe_id: string; slug: string; name: string; operator_id: string; operator_name: string;
 kind: CruiseKind; operating_status: CruiseOperatingStatus; publication_status: CruisePublicationStatus;
 /** Public individually bookable overnight cruises; false excludes charter-only/day vessels. */
 overnight_public_cruise: boolean; identity_verified: boolean; status_source_ids: string[];
 imo: string | null; eni: string | null; official_url: string | null;
 name_history: CruiseNameHistory[]; facts: CruiseFact[]; cabin_categories: CruiseCabinCategory[];
 /** Asset may be shown only when its license/permission was reviewed. */
 photo: { url: string; alt: string; permission_verified: boolean; source_id: string } | null;
};
export type CruiseProgram = { id:string; ship_id:string; name:string; kind:'show'|'music'|'enrichment'|'activity'; venue_id:string|null; description:string|null; as_of:string; availability_note:string|null; source_ids:string[]; verification:'verified'|'unverified' };
export type CruiseShipDetail = { ship: CruiseShip; sources: CruiseSource[]; venues: CruiseVenue[]; programs?:CruiseProgram[] };
export function visibleCruisePrograms(detail:CruiseShipDetail):CruiseProgram[]{ return (detail.programs||[]).filter(program=>program.ship_id===detail.ship.id&&program.verification==='verified'&&date(program.as_of)&&verifiedSourceIds(program.source_ids,detail.sources)); }
export const CRUISE_FACT_DEFINITIONS = {
 year_built: { label: 'Year built', unit: '', type: 'number' },
 entered_service: { label: 'Entered service', unit: '', type: 'string' },
 last_refurbished: { label: 'Last major refurbishment', unit: '', type: 'string' },
 length_m: { label: 'Length', unit: 'm', type: 'number' },
 gross_tonnage: { label: 'Gross tonnage', unit: 'GT', type: 'number' },
 guests_double_occupancy: { label: 'Guests at double occupancy', unit: '', type: 'number' },
 guests_lower_berths: { label: 'Lower-berth guest capacity', unit: '', type: 'number' },
 guests_maximum: { label: 'Maximum guest capacity', unit: '', type: 'number' },
 crew: { label: 'Crew', unit: '', type: 'number' },
 decks_total: { label: 'Total decks', unit: '', type: 'number' },
 decks_passenger: { label: 'Passenger decks', unit: '', type: 'number' },
 restaurants: { label: 'Restaurants', unit: '', type: 'number' },
 dining_outlets: { label: 'Dining outlets', unit: '', type: 'number' },
 cafes: { label: 'Cafés', unit: '', type: 'number' },
 bars: { label: 'Bars', unit: '', type: 'number' },
 shops: { label: 'Shops', unit: '', type: 'number' },
 pools: { label: 'Pools', unit: '', type: 'number' },
 deck_plan_url: { label: 'Official deck plan', unit: '', type: 'url' },
 accessibility_url: { label: 'Accessibility information', unit: '', type: 'url' },
} as const;
export function safeCruiseUrl(value: unknown): string | null {
 if (typeof value !== 'string') return null;
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function date(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function verifiedSourceIds(ids: string[], sources: CruiseSource[]): boolean {
 return ids.length > 0 && ids.every(id => sources.some(source => source.id === id && safeCruiseUrl(source.url) && source.publisher.trim() && date(source.checked_at)));
}
/** Publication concerns identity/scope/status. Unknown optional specifications are allowed. */
export function cruisePublicationProblems(ship: CruiseShip, sources: CruiseSource[]): string[] {
 const problems: string[] = [];
 if (!ship.id || !ship.universe_id || !ship.slug || !ship.name?.trim() || !ship.operator_name?.trim()) problems.push('Ship identity is incomplete.');
 if (!ship.identity_verified) problems.push('Ship identity has not been verified.');
 if (!ship.overnight_public_cruise) problems.push('Ship is outside the public overnight cruise scope.');
 if (!['operating','announced'].includes(ship.operating_status)) problems.push('Operating or announced status is required.');
 if (!verifiedSourceIds(ship.status_source_ids, sources)) problems.push('Ship status needs dated sources.');
 if (ship.imo !== null && !/^\d{7}$/.test(ship.imo)) problems.push('IMO identifier must have seven digits.');
 if (ship.eni !== null && !/^\d{8}$/.test(ship.eni)) problems.push('ENI identifier must have eight digits.');
 return problems;
}
/** Never convert conflicting or absent facts to zero or count visible venues as ship totals. */
export function displayCruiseFacts(ship: CruiseShip, sources: CruiseSource[]): CruiseFact[] {
 return ship.facts.filter(fact => {
  const definition = CRUISE_FACT_DEFINITIONS[fact.key];
  if (!definition || fact.verification !== 'verified' || fact.value === null || !date(fact.as_of) || !verifiedSourceIds(fact.source_ids, sources)) return false;
  if (definition.type === 'number') return typeof fact.value === 'number' && Number.isFinite(fact.value) && fact.value >= 0;
  if (definition.type === 'url') return !!safeCruiseUrl(fact.value);
  return typeof fact.value === 'string' && fact.value.trim().length > 0;
 });
}
export function publishedCruiseShips(details: CruiseShipDetail[], status: 'operating'|'announced' = 'operating'): CruiseShipDetail[] {
 return details.filter(item => item.ship.publication_status === 'published' && item.ship.operating_status === status && cruisePublicationProblems(item.ship,item.sources).length === 0);
}
/** Name is deliberately insufficient: renamed and sister ships must not collide. */
export function sameCruiseIdentity(a: Pick<CruiseShip,'id'|'imo'|'eni'>, b: Pick<CruiseShip,'id'|'imo'|'eni'>): boolean {
 return a.id === b.id || !!(a.imo && b.imo && a.imo === b.imo) || !!(a.eni && b.eni && a.eni === b.eni);
}
export function visibleCruiseVenues(detail: CruiseShipDetail): CruiseVenue[] {
 return detail.venues.filter(venue => venue.ship_id === detail.ship.id && venue.verification === 'verified' && verifiedSourceIds(venue.source_ids, detail.sources));
}
/** Use familiar category-specific venue taps; ship-level taps have their own Universe target. */
export function cruiseVenueReviewCategory(kind: CruiseVenueKind): string {
 return ({restaurant:'restaurant',cafe:'cafe',bar:'nightlife',shop:'shopping',theatre:'entertainment',entertainment:'entertainment',pool:'fitness',spa:'beauty',fitness:'fitness',kids_club:'entertainment',other:'other'} as const)[kind];
}

export function formatCruiseFact(fact: CruiseFact, locale?: string): string {
 return typeof fact.value === 'number' && fact.key !== 'year_built' ? fact.value.toLocaleString(locale) : String(fact.value ?? '');
}
