/**
 * Signal Service for Web App
 * Matches mobile app signalService.ts functionality
 * 
 * Handles fetching and displaying Tavvy signals (The Good, The Vibe, Heads Up)
 */

import { supabase } from './supabaseClient';

// Signal category colors matching PlaceCard
export const SIGNAL_COLORS = {
  best_for: '#0A84FF',  // Blue - The Good
  vibe: '#8B5CF6',      // Purple - The Vibe
  heads_up: '#FF9500',  // Orange - Heads Up
};

// Category prefix mapping for signals
const CATEGORY_PREFIX_MAP: Record<string, string> = {
  restaurant: 'r_',
  bar: 'b_',
  cafe: 'c_',
  hotel: 'h_',
  entertainment: 'tp_',
  attraction: 'tp_',
  retail: 'rt_',
  fitness: 'f_',
  beauty: 'bt_',
  health: 'hc_',
  services: 'sv_',
  automotive: 'au_',
  education: 'ed_',
  financial: 'fn_',
  government: 'gv_',
  religious: 'rg_',
  transportation: 'tr_',
  utilities: 'ut_',
  default: 'g_',
};

// Subcategory overrides for more specific signals
const SUBCATEGORY_OVERRIDES: Record<string, string> = {
  // Theme park specific
  theme_park_ride: 'tp_',
  theme_park_attraction: 'tp_',
  theme_park_food: 'tp_',
  theme_park_restroom: 'tp_',
  // Attraction subcategories
  show: 'tp_',
  dark_ride: 'tp_',
  roller_coaster: 'tp_',
  water_ride: 'tp_',
  boat_ride: 'tp_',
  carousel: 'tp_',
  train: 'tp_',
  spinner: 'tp_',
  simulator: 'tp_',
  meet_greet: 'tp_',
  playground: 'tp_',
  thrill_ride: 'tp_',
  flat_ride: 'tp_',
};

export interface Signal {
  id: string;
  label: string;
  tap_total: number;
  category: 'best_for' | 'vibe' | 'heads_up';
}

export interface SignalsByCategory {
  best_for: Signal[];
  vibe: Signal[];
  heads_up: Signal[];
}

/**
 * Get the signal prefix for a given category and subcategory
 */
export function getSignalPrefix(category: string, subcategory?: string): string {
  // Check subcategory override first
  if (subcategory && SUBCATEGORY_OVERRIDES[subcategory]) {
    return SUBCATEGORY_OVERRIDES[subcategory];
  }
  
  // Fall back to category prefix
  return CATEGORY_PREFIX_MAP[category] || CATEGORY_PREFIX_MAP.default;
}

/**
 * Fetch signals for a place from Supabase
 */
export async function fetchSignalsForPlace(placeId: string): Promise<SignalsByCategory> {
  const result: SignalsByCategory = {
    best_for: [],
    vibe: [],
    heads_up: [],
  };

  try {
    // First get the place category to determine signal prefix
    const { data: placeData, error: placeError } = await supabase
      .from('places')
      .select('tavvy_category, tavvy_subcategory')
      .eq('id', placeId)
      .single();

    if (placeError || !placeData) {
      console.log('Could not fetch place data for signals');
      return result;
    }

    const prefix = getSignalPrefix(placeData.tavvy_category, placeData.tavvy_subcategory);

    // Fetch signal aggregates for this place
    const { data: signalData, error: signalError } = await supabase
      .from('signal_aggregates')
      .select(`
        signal_id,
        tap_total,
        review_items (
          id,
          label,
          signal_type,
          prefix
        )
      `)
      .eq('place_id', placeId)
      .gt('tap_total', 0)
      .order('tap_total', { ascending: false })
      .limit(15);

    if (signalError || !signalData) {
      console.log('Could not fetch signals:', signalError);
      return result;
    }

    // Group signals by category
    signalData.forEach((item: any) => {
      const reviewItem = item.review_items;
      if (!reviewItem) return;

      const signalType = reviewItem.signal_type as 'best_for' | 'vibe' | 'heads_up';
      if (!result[signalType]) return;

      result[signalType].push({
        id: item.signal_id,
        label: reviewItem.label,
        tap_total: item.tap_total,
        category: signalType,
      });
    });

    return result;
  } catch (error) {
    console.error('Error fetching signals:', error);
    return result;
  }
}

/**
 * Fetch available signals for a category (for review submission)
 */
export async function fetchAvailableSignals(category: string, subcategory?: string): Promise<SignalsByCategory> {
  const result: SignalsByCategory = {
    best_for: [],
    vibe: [],
    heads_up: [],
  };

  try {
    const prefix = getSignalPrefix(category, subcategory);

    const { data, error } = await supabase
      .from('review_items')
      .select('id, label, signal_type, prefix')
      .eq('prefix', prefix)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) {
      console.log('Could not fetch available signals:', error);
      return result;
    }

    data.forEach((item: any) => {
      const signalType = item.signal_type as 'best_for' | 'vibe' | 'heads_up';
      if (!result[signalType]) return;

      result[signalType].push({
        id: item.id,
        label: item.label,
        tap_total: 0,
        category: signalType,
      });
    });

    return result;
  } catch (error) {
    console.error('Error fetching available signals:', error);
    return result;
  }
}

/**
 * Get top signals for a place (for display in cards)
 */
export async function getTopSignals(placeId: string, limit: number = 3): Promise<Signal[]> {
  try {
    const { data, error } = await supabase
      .from('signal_aggregates')
      .select(`
        signal_id,
        tap_total,
        review_items (
          id,
          label,
          signal_type
        )
      `)
      .eq('place_id', placeId)
      .gt('tap_total', 0)
      .order('tap_total', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.signal_id,
      label: item.review_items?.label || 'Signal',
      tap_total: item.tap_total,
      category: item.review_items?.signal_type || 'best_for',
    }));
  } catch (error) {
    console.error('Error fetching top signals:', error);
    return [];
  }
}
