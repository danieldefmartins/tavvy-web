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
import { getSignalPrefixesForCategory, signalMatchesCategory, loadActiveSignalCatalog, loadPlaceSignalCategory } from './signalCatalog';
export { CATEGORY_SIGNAL_PREFIXES, SUBCATEGORY_SIGNAL_OVERRIDES, getSignalPrefixesForCategory } from './signalCatalog';

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
  is_universal?: boolean;
  category?: string | null;
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
  const data = await loadActiveSignalCatalog(supabase);
  signalCache = new Map();
  signalsBySlug = new Map();
  data.forEach((item: any) => {
    signalCache.set(item.id, item);
    signalsBySlug.set(item.slug, item);
  });
  cacheLoaded = true;
}

// ============================================
// CATEGORY TO SIGNAL PREFIX MAPPING
// Matches iOS CATEGORY_SIGNAL_PREFIXES exactly
// ============================================

// ============================================
// CONSTANTS
// ============================================

export const CATEGORY_COLORS = {
  best_for: {
    bg: '#00C2CB',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8A05BE',
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#F5A623',
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
    const matchesPrefix = signalMatchesCategory(signal, primaryCategory, subcategory);
    
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
  const category = await loadPlaceSignalCategory(supabase, placeId);
  return getSignalsForCategory(category.primary, category.subcategory);
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

    // Accurate all-time tap totals via DB-side aggregation RPC
    // (raw pulls on the 21M-row taps table hit the PostgREST row cap)
    let tapTotals: Map<string, number> | undefined;
    try {
      const { data: rpcCounts } = await supabase.rpc('get_places_signal_counts', {
        p_place_ids: [placeId],
      });
      if (rpcCounts && rpcCounts.length > 0) {
        tapTotals = new Map(
          (rpcCounts as { signal_id: string; tap_count: number }[]).map(r => [
            r.signal_id,
            Number(r.tap_count),
          ])
        );
      }
    } catch (e) {
      console.warn('Error fetching signal counts RPC:', e);
    }

    // Raw per-tap rows are only needed for the time-decay score, and taps
    // older than 180 days decay to 0 — so only fetch the decay window.
    const decayCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select(`
        signal_id,
        intensity,
        place_reviews!inner (
          created_at
        )
      `)
      .eq('place_id', placeId)
      .gte('place_reviews.created_at', decayCutoff)
      .limit(20000);

    if (error) {
      console.error('Error fetching signal taps:', error);
    }

    // Fallback to tap_activity if place_review_signal_taps is empty
    if ((!taps || taps.length === 0) && (!tapTotals || tapTotals.size === 0)) {
      const { data: tapActivity, error: tapError } = await supabase
        .from('tap_activity')
        .select('signal_id, signal_name, created_at')
        .eq('place_id', placeId)
        .gte('created_at', decayCutoff)
        .limit(20000);

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

    return processTaps(taps || [], placeId, tapTotals);
  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// Extracted tap processing logic for reuse.
// `tapTotals` (from the counts RPC) overrides the sampled tap_total when
// available, so displayed totals stay accurate beyond the fetch window.
function processTaps(
  taps: any[],
  placeId: string,
  tapTotals?: Map<string, number>
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
            tap_total: tapTotals?.get(signalId) ?? data.tap_total,
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

/**
 * Batch-fetch signals for multiple places (for search results / place cards).
 * Returns a Map of placeId → Signal[] (bucket + tap_total).
 * Aggregation happens DB-side via RPC — pulling raw tap_activity rows hits
 * the PostgREST 1000-row cap and undercounts at scale.
 */
export async function fetchSignalsForPlaces(
  placeIds: string[]
): Promise<Map<string, { bucket: string; tap_total: number }[]>> {
  const result = new Map<string, { bucket: string; tap_total: number }[]>();
  if (!placeIds.length) return result;

  try {
    const uuidIds = placeIds.filter(isValidUUID);
    if (!uuidIds.length) return result;

    const { data: tapCounts } = await supabase.rpc('get_places_tap_activity_counts', {
      p_place_ids: uuidIds,
    });

    if (!tapCounts || tapCounts.length === 0) return result;

    for (const row of tapCounts as { place_id: string; signal_name: string; tap_count: number }[]) {
      const existing = result.get(row.place_id) || [];
      existing.push({ bucket: row.signal_name, tap_total: Number(row.tap_count) });
      result.set(row.place_id, existing);
    }
    for (const signals of Array.from(result.values())) {
      signals.sort((a, b) => b.tap_total - a.tap_total);
    }
  } catch (e) {
    console.warn('[fetchSignalsForPlaces] Error:', e);
  }

  return result;
}
