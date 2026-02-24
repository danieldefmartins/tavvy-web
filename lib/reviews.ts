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

async function resolvePlaceId(placeIdentifier: string, placeName: string): Promise<string | null> {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeIdentifier);
    
    // If it's already a UUID, verify it exists in the places table
    if (isUUID) {
      const { data } = await supabase
        .from('places')
        .select('id')
        .eq('id', placeIdentifier)
        .maybeSingle();
      if (data) return data.id;
    }

    // 1. Check canonical places table by source_id (handles FSQ IDs stored there)
    const { data: bySourceId } = await supabase
      .from('places')
      .select('id')
      .eq('source_id', placeIdentifier)
      .maybeSingle();
    if (bySourceId) return bySourceId.id;

    // 2. Check by google_place_id (handles Google Place IDs)
    const { data: byGoogleId } = await supabase
      .from('places')
      .select('id')
      .eq('google_place_id', placeIdentifier)
      .maybeSingle();
    if (byGoogleId) return byGoogleId.id;

    // 3. Check fsq_places_raw table and auto-promote to canonical places
    const { data: fsqPlace } = await supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email')
      .eq('fsq_place_id', placeIdentifier)
      .maybeSingle();

    if (fsqPlace) {
      // Promote FSQ place to canonical places table
      console.log('Promoting FSQ place to canonical:', placeIdentifier);
      const { data: newPlace, error: createError } = await supabase
        .from('places')
        .insert({
          name: fsqPlace.name || placeName,
          source_type: 'fsq',
          source_id: fsqPlace.fsq_place_id,
          latitude: fsqPlace.latitude,
          longitude: fsqPlace.longitude,
          address: fsqPlace.address,
          city: fsqPlace.locality,
          region: fsqPlace.region,
          country: fsqPlace.country,
          postcode: fsqPlace.postcode,
          phone: fsqPlace.tel,
          website: fsqPlace.website,
          email: fsqPlace.email,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error promoting FSQ place:', createError);
        return null;
      }
      return newPlace.id;
    }

    // 4. Last resort: create a minimal place entry
    console.log('Place not found anywhere, creating new place for:', placeIdentifier);
    const { data: newPlace, error: createError } = await supabase
      .from('places')
      .insert({
        google_place_id: placeIdentifier,
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
    console.error('Error in resolvePlaceId:', error);
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

    // RESOLVE PLACE ID — handles UUIDs, FSQ IDs, and Google Place IDs
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId);
    let targetPlaceId = placeId;
    
    if (!isValidUUID) {
      const resolvedId = await resolvePlaceId(placeId, placeName);
      if (!resolvedId) {
        return { success: false, error: 'Failed to resolve Place UUID' };
      }
      targetPlaceId = resolvedId;
    } else {
      // Even if it looks like a UUID, verify it exists
      const resolvedId = await resolvePlaceId(placeId, placeName);
      if (resolvedId) {
        targetPlaceId = resolvedId;
      }
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
