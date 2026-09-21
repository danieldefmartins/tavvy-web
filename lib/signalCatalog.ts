export const CATEGORY_SIGNAL_PREFIXES: Record<string, string[]> = {
  cruise_ship: ['cruise_'],
  // Core Categories (canonical singular + legacy plural aliases —
  // DB data is being migrated to singular 'restaurant'/'hotel')
  airport: ['airport_', 'transit_', 'restroom_', 'generic_'],
  park: ['park_', 'outdoor_', 'restroom_', 'generic_'],
  restaurant: ['restaurant_', 'generic_'],
  restaurants: ['restaurant_', 'generic_'],
  cafe: ['cafe_', 'generic_'],
  cafes: ['cafe_', 'generic_'],
  nightlife: ['bar_', 'generic_'],
  hotel: ['hotel_', 'generic_'],
  hotels: ['hotel_', 'generic_'],
  lodging: ['hotel_', 'generic_'],
  
  // RV & Camping
  rv_camping: ['rv_', 'dump_', 'water_', 'wifi_', 'restroom_', 'laundry_', 'generic_'],
  
  // Shopping & Services
  shopping: ['shop_', 'laundry_', 'generic_'],
  beauty: ['beauty_', 'generic_'],
  health: ['health_', 'generic_'],
  fitness: ['fitness_', 'generic_'],
  
  // Automotive
  automotive: ['fuel_', 'auto_', 'dump_', 'generic_'],
  
  // Professional & Business
  home_services: ['service_', 'generic_'],
  professional: ['pro_', 'generic_'],
  financial: ['bank_', 'generic_'],
  
  // Other Services
  pets: ['pet_', 'generic_'],
  education: ['edu_', 'generic_'],
  arts: ['arts_', 'generic_'],
  
  // Entertainment
  entertainment: ['tp_', 'ent_', 'generic_'],
  attraction: ['tp_', 'ent_', 'generic_'],
  
  // Outdoors & Parks
  outdoors: ['outdoor_', 'restroom_', 'generic_'],
  
  // Transportation
  transportation: ['transit_', 'restroom_', 'generic_'],
  
  // Government
  government: ['border_', 'gov_', 'generic_'],
  
  // Religious & Events
  religious: ['religious_', 'generic_'],
  events: ['venue_', 'generic_'],
  
  // Cities
  city: ['city_', 'generic_'],
  
  // Other/Generic
  other: ['generic_'],
};

export const SUBCATEGORY_SIGNAL_OVERRIDES: Record<string, string[]> = {
  // RV & Camping subcategories
  dump_station: ['dump_', 'generic_'],
  propane_station: ['fuel_', 'generic_'],
  water_fill_station: ['water_', 'generic_'],
  public_showers: ['restroom_', 'generic_'],
  laundromat: ['laundry_', 'generic_'],
  wifi_hotspot: ['wifi_', 'generic_'],
  restroom: ['restroom_', 'generic_'],
  
  // Theme Park subcategories
  theme_park_ride: ['tp_', 'generic_'],
  theme_park_attraction: ['tp_', 'generic_'],
  theme_park_food: ['restaurant_', 'tp_', 'generic_'],
  theme_park_restroom: ['restroom_', 'generic_'],
  
  // Attraction subcategories
  show: ['tp_', 'generic_'],
  dark_ride: ['tp_', 'generic_'],
  boat_ride: ['tp_', 'generic_'],
  roller_coaster: ['tp_', 'generic_'],
  thrill_ride: ['tp_', 'generic_'],
  water_ride: ['tp_', 'generic_'],
  spinner: ['tp_', 'generic_'],
  simulator: ['tp_', 'generic_'],
  carousel: ['tp_', 'generic_'],
  train: ['tp_', 'generic_'],
  tour: ['tp_', 'generic_'],
  meet_greet: ['tp_', 'generic_'],
  playground: ['tp_', 'generic_'],
  
  // Restaurant cuisine subcategories (categoryConfig slugs)
  italian: ['italian_', 'pizza_', 'restaurant_', 'generic_'],
  mexican: ['mexican_', 'restaurant_', 'generic_'],
  chinese: ['asian_', 'restaurant_', 'generic_'],
  japanese: ['sushi_', 'restaurant_', 'generic_'],
  thai: ['thai_', 'restaurant_', 'generic_'],
  indian: ['indian_', 'restaurant_', 'generic_'],
  seafood: ['seafood_', 'restaurant_', 'generic_'],
  steakhouse: ['steak_', 'restaurant_', 'generic_'],
  bbq: ['bbq_', 'restaurant_', 'generic_'],
  pizza: ['pizza_', 'italian_', 'restaurant_', 'generic_'],
  burgers: ['burger_', 'restaurant_', 'generic_'],
  food_truck: ['foodtruck_', 'restaurant_', 'generic_'],
  brazilian: ['brazilian_', 'restaurant_', 'generic_'],
  korean: ['korean_', 'restaurant_', 'generic_'],
  vietnamese: ['viet_', 'restaurant_', 'generic_'],
  mediterranean: ['med_', 'restaurant_', 'generic_'],
  greek: ['med_', 'restaurant_', 'generic_'],
  french: ['french_', 'restaurant_', 'generic_'],

  // FSQ raw subcategory names (extracted from category labels)
  Pizzeria: ['pizza_', 'italian_', 'restaurant_', 'generic_'],
  'Pizza Place': ['pizza_', 'italian_', 'restaurant_', 'generic_'],
  'Sushi Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Japanese Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Ramen Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'BBQ Joint': ['bbq_', 'restaurant_', 'generic_'],
  'Barbecue Restaurant': ['bbq_', 'restaurant_', 'generic_'],
  'Mexican Restaurant': ['mexican_', 'restaurant_', 'generic_'],
  Taqueria: ['mexican_', 'restaurant_', 'generic_'],
  'Italian Restaurant': ['italian_', 'pizza_', 'restaurant_', 'generic_'],
  'Chinese Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Asian Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Dim Sum Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Noodle House': ['asian_', 'restaurant_', 'generic_'],
  'Indian Restaurant': ['indian_', 'restaurant_', 'generic_'],
  'Thai Restaurant': ['thai_', 'restaurant_', 'generic_'],
  'Seafood Restaurant': ['seafood_', 'restaurant_', 'generic_'],
  'Fish Market': ['seafood_', 'restaurant_', 'generic_'],
  Steakhouse: ['steak_', 'restaurant_', 'generic_'],
  'Burger Joint': ['burger_', 'restaurant_', 'generic_'],
  'Burger Restaurant': ['burger_', 'restaurant_', 'generic_'],
  'Fast Food Restaurant': ['burger_', 'restaurant_', 'generic_'],
  'Brazilian Restaurant': ['brazilian_', 'restaurant_', 'generic_'],
  Churrascaria: ['brazilian_', 'restaurant_', 'generic_'],
  'Korean Restaurant': ['korean_', 'restaurant_', 'generic_'],
  'Korean BBQ Restaurant': ['korean_', 'restaurant_', 'generic_'],
  'Vietnamese Restaurant': ['viet_', 'restaurant_', 'generic_'],
  'Pho Restaurant': ['viet_', 'restaurant_', 'generic_'],
  'Mediterranean Restaurant': ['med_', 'restaurant_', 'generic_'],
  'Greek Restaurant': ['med_', 'restaurant_', 'generic_'],
  'French Restaurant': ['french_', 'restaurant_', 'generic_'],
  Bistro: ['french_', 'restaurant_', 'generic_'],
  Brasserie: ['french_', 'restaurant_', 'generic_'],
  'Food Truck': ['foodtruck_', 'restaurant_', 'generic_'],
  'Food Stand': ['foodtruck_', 'restaurant_', 'generic_'],
  'Food Court': ['restaurant_', 'generic_'],
  
  // Automotive subcategories
  gas_station: ['fuel_', 'generic_'],
  ev_charging: ['fuel_', 'generic_'],
  car_wash: ['auto_', 'generic_'],
  auto_repair: ['auto_', 'generic_'],
  
  // Government subcategories
  border_crossing: ['border_', 'generic_'],
  checkpoint: ['border_', 'generic_'],
  dmv_gov: ['gov_', 'generic_'],
  post_office: ['gov_', 'generic_'],
};


/** Normalize display labels, legacy plurals and category slugs consistently. */
export function normalizeSignalCategory(value: string = ''): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
const ALIASES: Record<string, string> = {
  restaurants: 'restaurant', cafes: 'cafe', coffee_shop: 'cafe', coffee_shops: 'cafe',
  hotels: 'hotel', motel: 'hotel', resort: 'hotel', accommodation: 'hotel',
  bar: 'nightlife', bars: 'nightlife', pub: 'nightlife',
  parks: 'park', public_park: 'park', national_park: 'park',
  airports: 'airport', airport_terminal: 'airport',
  bathroom: 'restroom', bathrooms: 'restroom', restrooms: 'restroom', public_bathroom: 'restroom',
  public_bathrooms: 'restroom', public_restroom: 'restroom', public_restrooms: 'restroom',
  airport_bathroom: 'restroom', airport_restroom: 'restroom', toilet: 'restroom', toilets: 'restroom',
  service_provider: 'home_services', service_providers: 'home_services', home_service: 'home_services',
  professional_services: 'professional', business: 'other', businesses: 'other',
  rv_and_camping: 'rv_camping', rv_park: 'rv_camping', campground: 'rv_camping',
  theme_park: 'entertainment', theme_parks: 'entertainment', ride: 'attraction', rides: 'attraction',
};
const normalizedOverrides = Object.fromEntries(Object.entries(SUBCATEGORY_SIGNAL_OVERRIDES).map(([key, value]) => [normalizeSignalCategory(key), value]));
const canonical = (value: string) => { const key = normalizeSignalCategory(value); return ALIASES[key] || key; };
export function getSignalPrefixesForCategory(primaryCategory: string, subcategory?: string): string[] {
  const primary = canonical(primaryCategory);
  const sub = canonical(subcategory || '');
  return normalizedOverrides[sub] || normalizedOverrides[primary] || CATEGORY_SIGNAL_PREFIXES[primary] || ['generic_'];
}
export interface CatalogSignal {
  id: string; slug: string; label: string; signal_type: string;
  is_universal?: boolean; category?: string | null;
}
export function signalMatchesCategory(signal: CatalogSignal, primaryCategory: string, subcategory?: string): boolean {
  if (!['best_for', 'vibe', 'heads_up'].includes(signal.signal_type)) return false;
  const restroom = getSignalPrefixesForCategory(primaryCategory, subcategory).includes('restroom_') &&
    !getSignalPrefixesForCategory(primaryCategory, subcategory).some(p => !['restroom_', 'generic_'].includes(p));
  if (restroom) {
    // A bathroom is reviewed as a facility, not as its enclosing airport/park/business.
    const relevantGeneric = new Set(['generic_accessible', 'generic_not_accessible', 'generic_heads_up_not_accessible',
      'generic_clean', 'generic_dirty', 'generic_heads_up_dirty', 'generic_well_maintained',
      'generic_hard_to_find', 'generic_heads_up_hard_to_find', 'generic_long_wait', 'generic_heads_up_long_wait',
      'generic_closed_often', 'generic_heads_up_closed_often', 'generic_modern', 'generic_quiet', 'cash_only']);
    return signal.slug.startsWith('restroom_') || relevantGeneric.has(signal.slug);
  }
  if (signal.is_universal || signal.slug.startsWith('generic_')) return true;
  return getSignalPrefixesForCategory(primaryCategory, subcategory).some(prefix => signal.slug.startsWith(prefix));
}
/** Stable pagination prevents the >1,000-row catalog from silently truncating. */
export async function loadActiveSignalCatalog(db: any): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('review_items')
      .select('id,slug,label,icon_emoji,signal_type,color,is_universal,category')
      .eq('is_active', true).in('signal_type', ['best_for', 'vibe', 'heads_up'])
      .order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

export async function loadPlaceSignalCategory(db: any, identifier: string): Promise<{ primary: string; subcategory?: string }> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const { data, error } = await db.from('places').select('tavvy_category,tavvy_subcategory,source_type,source_id')
    .eq(isUuid ? 'id' : 'source_id', identifier).maybeSingle();
  if (error) throw error;
  if (data?.tavvy_category || data?.tavvy_subcategory) return { primary: data.tavvy_category || 'other', subcategory: data.tavvy_subcategory || undefined };
  const rawId = data?.source_type === 'fsq' && data?.source_id ? data.source_id : !isUuid ? identifier : null;
  if (rawId) {
    const { data: raw, error: rawError } = await db.from('fsq_places_raw').select('fsq_category_labels').eq('fsq_place_id', rawId).maybeSingle();
    if (rawError) throw rawError;
    const labels = Array.isArray(raw?.fsq_category_labels) ? raw.fsq_category_labels : [];
    for (const label of labels) {
      if (typeof label !== 'string') continue;
      const parts = label.split('>').map(part => part.trim()).reverse();
      for (const part of parts) if (getSignalPrefixesForCategory(part).some(prefix => prefix !== 'generic_')) return { primary: part };
    }
  }
  return { primary: 'other' };
}
