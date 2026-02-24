/**
 * Signal Service for Web App
 * MATCHES iOS signalService.ts EXACTLY
 * 
 * Handles:
 * - Signal cache from review_items table
 * - Category-based signal filtering (CATEGORY_SIGNAL_PREFIXES)
 * - Living Score with 6-month time decay
 * - Ghost logic for fading signals
 * - Medal system
 */

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface ReviewSignalTap {
  signalId: string;
  intensity: number; // 1-3 (tap count)
}

export type ReviewCategory = 'best_for' | 'vibe' | 'heads_up';

export interface SignalAggregate {
  place_id: string;
  signal_id: string;
  tap_total: number;
  current_score: number; // Time-decayed score (Living Score)
  review_count: number;
  last_tap_at: string | null;
  is_ghost: boolean; // True if score is low but > 0 (fading warning)
  label?: string;
  icon?: string;
  category?: ReviewCategory;
}

export interface Signal {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: ReviewCategory;
  color: string;
}

export interface SignalsByCategory {
  best_for: Signal[];
  vibe: Signal[];
  heads_up: Signal[];
}

// ============================================
// SIGNAL CACHE
// ============================================

interface CachedSignal {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: ReviewCategory;
  color: string;
}

let signalCache: Map<string, CachedSignal> = new Map();
let signalsBySlug: Map<string, CachedSignal> = new Map();
let cacheLoaded = false;

async function loadSignalCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const { data, error } = await supabase
      .from('review_items')
      .select('id, slug, label, icon_emoji, signal_type, color')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading signal cache:', error);
      return;
    }

    signalCache = new Map();
    signalsBySlug = new Map();

    (data || []).forEach((item: any) => {
      // Only cache the 3 main signal types (not pro_endorsement)
      if (!['best_for', 'vibe', 'heads_up'].includes(item.signal_type)) return;
      
      const signal: CachedSignal = {
        id: item.id,
        slug: item.slug,
        label: item.label,
        icon_emoji: item.icon_emoji,
        signal_type: item.signal_type as ReviewCategory,
        color: item.color,
      };
      signalCache.set(item.id, signal);
      signalsBySlug.set(item.slug, signal);
    });

    cacheLoaded = true;
    console.log(`✅ Signal cache loaded: ${signalCache.size} signals`);
  } catch (err) {
    console.error('Error loading signal cache:', err);
  }
}

// ============================================
// CATEGORY TO SIGNAL PREFIX MAPPING
// Matches iOS CATEGORY_SIGNAL_PREFIXES exactly
// ============================================

export const CATEGORY_SIGNAL_PREFIXES: Record<string, string[]> = {
  // Core Categories
  restaurants: ['restaurant_', 'generic_'],
  cafes: ['cafe_', 'generic_'],
  nightlife: ['bar_', 'generic_'],
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
  italian: ['italian_', 'restaurant_', 'generic_'],
  mexican: ['mexican_', 'restaurant_', 'generic_'],
  chinese: ['asian_', 'restaurant_', 'generic_'],
  japanese: ['sushi_', 'restaurant_', 'generic_'],
  thai: ['thai_', 'restaurant_', 'generic_'],
  indian: ['indian_', 'restaurant_', 'generic_'],
  seafood: ['seafood_', 'restaurant_', 'generic_'],
  steakhouse: ['steak_', 'restaurant_', 'generic_'],
  bbq: ['bbq_', 'restaurant_', 'generic_'],
  pizza: ['pizza_', 'restaurant_', 'generic_'],
  burgers: ['burger_', 'restaurant_', 'generic_'],
  food_truck: ['foodtruck_', 'restaurant_', 'generic_'],
  brazilian: ['brazilian_', 'restaurant_', 'generic_'],
  
  // FSQ raw subcategory names (extracted from category labels)
  Pizzeria: ['pizza_', 'restaurant_', 'generic_'],
  'Pizza Place': ['pizza_', 'restaurant_', 'generic_'],
  'Sushi Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Japanese Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Ramen Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'BBQ Joint': ['bbq_', 'restaurant_', 'generic_'],
  'Barbecue Restaurant': ['bbq_', 'restaurant_', 'generic_'],
  'Mexican Restaurant': ['mexican_', 'restaurant_', 'generic_'],
  Taqueria: ['mexican_', 'restaurant_', 'generic_'],
  'Italian Restaurant': ['italian_', 'restaurant_', 'generic_'],
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

// ============================================
// CONSTANTS
// ============================================

export const CATEGORY_COLORS = {
  best_for: {
    bg: '#0A84FF',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8B5CF6',
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#FF9500',
    text: '#FFFFFF',
  },
} as const;

export const SIGNAL_COLORS = CATEGORY_COLORS;

export const SIGNAL_LABELS = {
  best_for: 'The Good',
  vibe: 'The Vibe',
  heads_up: 'Heads Up',
} as const;

// ============================================
// SIGNAL LOOKUP FUNCTIONS
// ============================================

export function getSignalById(signalId: string): CachedSignal | undefined {
  return signalCache.get(signalId);
}

export function getSignalBySlug(slug: string): CachedSignal | undefined {
  return signalsBySlug.get(slug);
}

export function getSignalLabel(signalId: string): string {
  const signal = signalCache.get(signalId);
  if (signal) return signal.label;
  
  return signalId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryFromSignal(signalId: string): ReviewCategory | null {
  const signal = signalCache.get(signalId);
  return signal?.signal_type || null;
}

// ============================================
// CATEGORY-SPECIFIC SIGNAL FILTERING
// ============================================

export function getSignalPrefixesForCategory(
  primaryCategory: string,
  subcategory?: string
): string[] {
  if (subcategory && SUBCATEGORY_SIGNAL_OVERRIDES[subcategory]) {
    return SUBCATEGORY_SIGNAL_OVERRIDES[subcategory];
  }
  return CATEGORY_SIGNAL_PREFIXES[primaryCategory] || ['generic_'];
}

export async function getSignalsForCategory(
  primaryCategory: string,
  subcategory?: string
): Promise<SignalsByCategory> {
  await loadSignalCache();
  
  const prefixes = getSignalPrefixesForCategory(primaryCategory, subcategory);
  
  const result: SignalsByCategory = {
    best_for: [],
    vibe: [],
    heads_up: [],
  };
  
  signalsBySlug.forEach((signal) => {
    const matchesPrefix = prefixes.some(prefix => signal.slug.startsWith(prefix));
    
    if (matchesPrefix) {
      const signalForUI: Signal = {
        id: signal.id,
        slug: signal.slug,
        label: signal.label,
        icon_emoji: signal.icon_emoji,
        signal_type: signal.signal_type,
        color: signal.color,
      };
      result[signal.signal_type].push(signalForUI);
    }
  });
  
  // Sort each category alphabetically by label
  result.best_for.sort((a, b) => a.label.localeCompare(b.label));
  result.vibe.sort((a, b) => a.label.localeCompare(b.label));
  result.heads_up.sort((a, b) => a.label.localeCompare(b.label));
  
  return result;
}

/**
 * Fetch signals for a specific place based on its category.
 * Matches iOS fetchSignalsForPlace exactly.
 */
export async function fetchSignalsForPlace(placeId: string): Promise<SignalsByCategory> {
  await loadSignalCache();
  
  try {
    // Try places_unified first
    const { data: place } = await supabase
      .from('places_unified')
      .select('tavvy_primary_category, tavvy_subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (place && place.tavvy_primary_category) {
      return await getSignalsForCategory(
        place.tavvy_primary_category,
        place.tavvy_subcategory
      );
    }
    
    // Fallback: Try tavvy_places table
    const { data: tavvyPlace } = await supabase
      .from('tavvy_places')
      .select('primary_category, subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (tavvyPlace && tavvyPlace.primary_category) {
      return await getSignalsForCategory(
        tavvyPlace.primary_category,
        tavvyPlace.subcategory
      );
    }
    
    // Fallback: Try places table
    const { data: simplePlace } = await supabase
      .from('places')
      .select('tavvy_category, tavvy_subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (simplePlace) {
      const category = simplePlace.tavvy_category;
      const subcategory = simplePlace.tavvy_subcategory;
      if (category) {
        return await getSignalsForCategory(category, subcategory);
      }
    }
    
    // Default: Return generic signals
    return await getSignalsForCategory('other');
    
  } catch (error) {
    console.error('Error fetching place category:', error);
    return await getSignalsForCategory('other');
  }
}

// ============================================
// THE TAVVY ENGINE: Time Decay Calculation
// Matches iOS calculateDecayedScore exactly
// ============================================

function calculateDecayedScore(intensity: number, createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const MAX_AGE_DAYS = 180; // 6 Months

  if (diffDays >= MAX_AGE_DAYS) {
    return 0; // Dead zombie - filtered out
  }

  // Linear Decay: Value = Intensity * (1 - (Age / 180))
  const decayFactor = 1 - (diffDays / MAX_AGE_DAYS);
  return intensity * decayFactor;
}

// Helper: Check if string is a valid UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ============================================
// FETCH PLACE SIGNALS (Living Score)
// Matches iOS fetchPlaceSignals exactly
// ============================================

export async function fetchPlaceSignals(placeId: string): Promise<{
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
  medals: string[];
}> {
  try {
    await loadSignalCache();

    // Non-UUID placeIds can't have taps
    if (!isValidUUID(placeId)) {
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

    // Query place_review_signal_taps joined with place_reviews for created_at
    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select(`
        signal_id,
        intensity,
        place_reviews (
          created_at
        )
      `)
      .eq('place_id', placeId);

    if (error) {
      console.error('Error fetching signal taps:', error);
    }

    // Fallback to tap_activity if place_review_signal_taps is empty
    // tap_activity has 1600+ rows of real signal data
    if (!taps || taps.length === 0) {
      const { data: tapActivity, error: tapError } = await supabase
        .from('tap_activity')
        .select('signal_id, signal_name, created_at')
        .eq('place_id', placeId);

      if (tapError || !tapActivity || tapActivity.length === 0) {
        return { best_for: [], vibe: [], heads_up: [], medals: [] };
      }

      // Convert tap_activity to the same format as place_review_signal_taps
      const convertedTaps = tapActivity.map(t => ({
        signal_id: t.signal_id,
        intensity: 1, // Default intensity for tap_activity
        place_reviews: { created_at: t.created_at },
      }));

      // Use convertedTaps instead of empty taps
      return processTaps(convertedTaps, placeId);
    }

    return processTaps(taps, placeId);
  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// Extracted tap processing logic for reuse
function processTaps(
  taps: any[],
  placeId: string
): {
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
  medals: string[];
} {
  try {

    // Aggregate taps by signal_id with time decay
    const aggregated: Record<string, { 
      tap_total: number; 
      current_score: number;
      review_count: number;
      last_tap_at: string | null 
    }> = {};
    
    (taps || []).forEach((tap: any) => {
      if (!aggregated[tap.signal_id]) {
        aggregated[tap.signal_id] = { 
          tap_total: 0, 
          current_score: 0,
          review_count: 0,
          last_tap_at: null 
        };
      }

      const createdAt = tap.place_reviews?.created_at || new Date().toISOString();
      const decayedValue = calculateDecayedScore(tap.intensity, createdAt);

      aggregated[tap.signal_id].tap_total += tap.intensity;
      aggregated[tap.signal_id].current_score += decayedValue;
      aggregated[tap.signal_id].review_count += 1;
      
      if (!aggregated[tap.signal_id].last_tap_at || new Date(createdAt) > new Date(aggregated[tap.signal_id].last_tap_at!)) {
        aggregated[tap.signal_id].last_tap_at = createdAt;
      }
    });

    // Organize by category
    const result: {
      best_for: SignalAggregate[];
      vibe: SignalAggregate[];
      heads_up: SignalAggregate[];
      medals: string[];
    } = {
      best_for: [],
      vibe: [],
      heads_up: [],
      medals: [],
    };

    let totalPositiveScore = 0;
    let totalNegativeScore = 0;
    let fastServiceScore = 0;
    let slowServiceScore = 0;

    for (const [signalId, data] of Object.entries(aggregated)) {
      const signal = getSignalById(signalId);
      const category = getCategoryFromSignal(signalId);
      
      if (signal && category) {
        // Ghost Logic: score < 1.0 but > 0 = ghost (fading)
        const isGhost = data.current_score > 0 && data.current_score < 1.0;

        // Only include if score > 0 (dead zombies filtered out)
        if (data.current_score > 0) {
          const aggregate: SignalAggregate = {
            place_id: placeId,
            signal_id: signalId,
            tap_total: data.tap_total,
            current_score: parseFloat(data.current_score.toFixed(2)),
            review_count: data.review_count,
            last_tap_at: data.last_tap_at,
            is_ghost: isGhost,
            label: signal.label,
            icon: signal.icon_emoji,
            category: category,
          };
          
          result[category].push(aggregate);

          // Track scores for Medals
          if (category === 'best_for' || category === 'vibe') {
            totalPositiveScore += data.current_score;
          } else if (category === 'heads_up') {
            totalNegativeScore += data.current_score;
          }

          if (signal.label === 'Fast Service') fastServiceScore += data.current_score;
          if (signal.label === 'Slow Service') slowServiceScore += data.current_score;
        }
      }
    }

    // Sort by current_score descending (Living Score)
    result.best_for.sort((a, b) => b.current_score - a.current_score);
    result.vibe.sort((a, b) => b.current_score - a.current_score);
    result.heads_up.sort((a, b) => b.current_score - a.current_score);

    // --- MEDAL LOGIC ---
    const totalScore = totalPositiveScore + totalNegativeScore;

    // 🏆 Vibe Check: >90% Positive
    if (totalScore > 10 && (totalPositiveScore / totalScore) > 0.9) {
      result.medals.push('vibe_check');
    }

    // ⚡ Speed Demon: Fast > 2x Slow
    if (fastServiceScore > 5 && fastServiceScore > (slowServiceScore * 2)) {
      result.medals.push('speed_demon');
    }

    // 💎 Hidden Gem: High Positive, Low Volume
    if (totalPositiveScore > 10 && totalScore < 50 && (totalPositiveScore / totalScore) > 0.95) {
      result.medals.push('hidden_gem');
    }

    return result;

  } catch (error) {
    console.error('Error processing taps:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// ============================================
// TOP SIGNALS (for place cards)
// ============================================

export async function getTopSignals(placeId: string, limit: number = 3): Promise<SignalAggregate[]> {
  const signals = await fetchPlaceSignals(placeId);
  const all = [...signals.best_for, ...signals.vibe, ...signals.heads_up];
  all.sort((a, b) => b.current_score - a.current_score);
  return all.slice(0, limit);
}

export async function preloadSignalCache(): Promise<void> {
  await loadSignalCache();
}
