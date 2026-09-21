import { submitReview, updateReview, fetchUserReview } from './reviewPersistence';
export { submitReview, updateReview, fetchUserReview };
/**
 * Reviews Library for Web App
 * MATCHES iOS lib/reviews.ts EXACTLY
 * 
 * Handles:
 * - Review submission (place_reviews + place_review_signal_taps)
 * - Fetching user's existing review
 * - Updating existing reviews
 */

import { supabase } from './supabaseClient';
import { ReviewSignalTap, ReviewCategory, preloadSignalCache, getSignalById } from './signalService';

// ============================================
// TYPES
// ============================================

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  public_note: string | null;
  private_note_owner: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  source: string;
}

// ============================================
// PLACE RESOLUTION
// ============================================



// ============================================
// FETCH USER'S EXISTING REVIEW
// ============================================


// ============================================
// UPDATE EXISTING REVIEW
// ============================================



// ============================================
// THERMOMETER (Activity Monitor)
// ============================================

function withinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

export async function fetchPlaceThermometer(placeId: string, months: number = 3): Promise<{
  positiveTaps: number;
  negativeTaps: number;
}> {
  try {
    await preloadSignalCache();

    const daysInPeriod = months * 30;

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
      console.error('Error fetching thermometer data:', error);
      return { positiveTaps: 0, negativeTaps: 0 };
    }

    let positiveTaps = 0;
    let negativeTaps = 0;

    (taps || []).forEach((tap: any) => {
      const createdAt = tap.place_reviews?.created_at;

      if (!createdAt || !withinDays(createdAt, daysInPeriod)) {
        return;
      }

      const signal = getSignalById(tap.signal_id);
      const category = signal?.signal_type;

      if (category === 'best_for' || category === 'vibe') {
        positiveTaps += tap.intensity;
      } else if (category === 'heads_up') {
        negativeTaps += tap.intensity;
      }
    });

    return { positiveTaps, negativeTaps };

  } catch (error) {
    console.error('Error fetching thermometer data:', error);
    return { positiveTaps: 0, negativeTaps: 0 };
  }
}

export async function fetchPlacesThermometer(placeIds: string[], months: number = 3): Promise<Map<string, { positiveTaps: number; negativeTaps: number }>> {
  const result = new Map<string, { positiveTaps: number; negativeTaps: number }>();

  if (placeIds.length === 0) {
    return result;
  }

  try {
    await preloadSignalCache();

    const daysInPeriod = months * 30;

    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select(`
        place_id,
        signal_id,
        intensity,
        place_reviews (
          created_at
        )
      `)
      .in('place_id', placeIds);

    if (error) {
      console.error('Error fetching batch thermometer data:', error);
      return result;
    }

    placeIds.forEach(id => {
      result.set(id, { positiveTaps: 0, negativeTaps: 0 });
    });

    (taps || []).forEach((tap: any) => {
      const createdAt = tap.place_reviews?.created_at;

      if (!createdAt || !withinDays(createdAt, daysInPeriod)) {
        return;
      }

      const signal = getSignalById(tap.signal_id);
      const category = signal?.signal_type;
      const placeData = result.get(tap.place_id);

      if (placeData) {
        if (category === 'best_for' || category === 'vibe') {
          placeData.positiveTaps += tap.intensity;
        } else if (category === 'heads_up') {
          placeData.negativeTaps += tap.intensity;
        }
      }
    });

    return result;

  } catch (error) {
    console.error('Error fetching batch thermometer data:', error);
    return result;
  }
}
