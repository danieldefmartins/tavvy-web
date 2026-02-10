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
import { ReviewSignalTap, ReviewCategory } from './signalService';

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

async function getOrCreatePlace(googlePlaceId: string, placeName: string): Promise<string | null> {
  try {
    const { data: existingPlace } = await supabase
      .from('places')
      .select('id')
      .eq('google_place_id', googlePlaceId)
      .maybeSingle();

    if (existingPlace) {
      return existingPlace.id;
    }

    const { data: newPlace, error: createError } = await supabase
      .from('places')
      .insert({
        google_place_id: googlePlaceId,
        name: placeName,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating place:', createError);
      return null;
    }

    return newPlace.id;
  } catch (error) {
    console.error('Error in getOrCreatePlace:', error);
    return null;
  }
}

// ============================================
// SUBMIT REVIEW
// ============================================

export async function submitReview(
  placeId: string,
  placeName: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any; reviewId?: string }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Must be logged in to submit a review' };
    }

    const userId = user.id;

    // Resolve place ID if needed
    let targetPlaceId = placeId;
    if (placeId.length !== 36) {
      const resolvedId = await getOrCreatePlace(placeId, placeName);
      if (!resolvedId) {
        return { success: false, error: 'Failed to resolve Place UUID' };
      }
      targetPlaceId = resolvedId;
    }

    // Step 1: Create the review
    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .insert({
        place_id: targetPlaceId,
        user_id: userId,
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        source: 'web_app',
        status: 'live',
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return { success: false, error: reviewError };
    }

    // Step 2: Insert signal taps
    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: review.id,
        place_id: targetPlaceId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Error saving signal taps:', tapsError);
        return { success: false, error: tapsError };
      }
    }

    console.log('✅ Review submitted successfully!', review.id);
    return { success: true, reviewId: review.id };

  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error };
  }
}

// ============================================
// FETCH USER'S EXISTING REVIEW
// ============================================

export async function fetchUserReview(placeId: string): Promise<{
  review: PlaceReview | null;
  signals: ReviewSignalTap[];
}> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      return { review: null, signals: [] };
    }

    const user = authData.user;

    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reviewError) {
      console.error('Error fetching user review:', reviewError);
      return { review: null, signals: [] };
    }

    if (!review) {
      return { review: null, signals: [] };
    }

    const { data: taps, error: tapsError } = await supabase
      .from('place_review_signal_taps')
      .select('signal_id, intensity')
      .eq('review_id', review.id);

    if (tapsError) {
      return { review: review as PlaceReview, signals: [] };
    }

    const signals: ReviewSignalTap[] = (taps || []).map(tap => ({
      signalId: tap.signal_id,
      intensity: tap.intensity,
    }));

    return { review: review as PlaceReview, signals };

  } catch (error) {
    console.error('Error fetching user review:', error);
    return { review: null, signals: [] };
  }
}

// ============================================
// UPDATE EXISTING REVIEW
// ============================================

export async function updateReview(
  reviewId: string,
  placeId: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Update the review
    const { error: reviewError } = await supabase
      .from('place_reviews')
      .update({
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (reviewError) {
      return { success: false, error: reviewError };
    }

    // Delete existing signal taps
    const { error: deleteError } = await supabase
      .from('place_review_signal_taps')
      .delete()
      .eq('review_id', reviewId);

    if (deleteError) {
      console.error('Error deleting old taps:', deleteError);
    }

    // Insert new signal taps
    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: reviewId,
        place_id: placeId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        return { success: false, error: tapsError };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, error };
  }
}
