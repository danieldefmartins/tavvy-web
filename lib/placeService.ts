import { supabase } from './supabaseClient';
import { Place, Signal } from '../types';

// Debug flag for place fetching
const DEBUG_PLACES = false;

export interface PlaceCard {
  id: string;
  name: string;
  address_line1: string;
  city?: string;
  state_region?: string;
  category: string;
  primary_category?: string;
  latitude: number;
  longitude: number;
  current_status?: string;
  cover_image_url?: string;
  phone?: string;
  website?: string;
  signals?: Signal[];
  photos?: string[];
  distance?: number;
}

// Helper to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch places within map bounds
export async function fetchPlacesInBounds(
  bounds: {
    ne: [number, number];
    sw: [number, number];
  },
  userLocation?: [number, number] | null,
  category?: string
): Promise<PlaceCard[]> {
  const startTime = Date.now();

  try {
    let query = supabase
      .from('places')
      .select(`
        id,
        name,
        address_line1,
        city,
        state_region,
        category,
        primary_category,
        latitude,
        longitude,
        current_status,
        cover_image_url,
        phone,
        website
      `)
      .gte('latitude', bounds.sw[1])
      .lte('latitude', bounds.ne[1])
      .gte('longitude', bounds.sw[0])
      .lte('longitude', bounds.ne[0])
      .limit(100);

    // Apply category filter if specified
    if (category && category !== 'All') {
      query = query.or(`category.ilike.%${category}%,primary_category.ilike.%${category}%`);
    }

    const { data: places, error } = await query;

    if (error) {
      console.error('Error fetching places:', error);
      return [];
    }

    if (!places || places.length === 0) {
      return [];
    }

    // Fetch signals for these places
    const placeIds = places.map((p) => p.id);
    const { data: signals } = await supabase
      .from('place_signals_aggregated')
      .select('place_id, bucket, tap_total')
      .in('place_id', placeIds);

    // Fetch photos for these places
    const { data: photos } = await supabase
      .from('place_photos')
      .select('place_id, photo_url')
      .in('place_id', placeIds)
      .order('created_at', { ascending: false });

    // Group signals and photos by place_id
    const signalsByPlace: Record<string, Signal[]> = {};
    const photosByPlace: Record<string, string[]> = {};

    signals?.forEach((s) => {
      if (!signalsByPlace[s.place_id]) {
        signalsByPlace[s.place_id] = [];
      }
      signalsByPlace[s.place_id].push({
        bucket: s.bucket,
        tap_total: s.tap_total,
      });
    });

    photos?.forEach((p) => {
      if (!photosByPlace[p.place_id]) {
        photosByPlace[p.place_id] = [];
      }
      photosByPlace[p.place_id].push(p.photo_url);
    });

    // Map places with signals, photos, and distance
    const placesWithData: PlaceCard[] = places.map((place) => {
      let distance: number | undefined;
      if (userLocation) {
        distance = calculateDistance(
          userLocation[1],
          userLocation[0],
          place.latitude,
          place.longitude
        );
      }

      return {
        ...place,
        signals: signalsByPlace[place.id] || [],
        photos: photosByPlace[place.id] || [],
        distance,
      };
    });

    // Sort by distance if user location is available
    if (userLocation) {
      placesWithData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    if (DEBUG_PLACES) {
      console.log(`Fetched ${placesWithData.length} places in ${Date.now() - startTime}ms`);
    }

    return placesWithData;
  } catch (error) {
    console.error('Error in fetchPlacesInBounds:', error);
    return [];
  }
}

// Fetch a single place by ID
export async function fetchPlaceById(placeId: string): Promise<Place | null> {
  try {
    const { data: place, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error || !place) {
      console.error('Error fetching place:', error);
      return null;
    }

    // Fetch signals
    const { data: signals } = await supabase
      .from('place_signals_aggregated')
      .select('bucket, tap_total')
      .eq('place_id', placeId);

    // Fetch photos
    const { data: photos } = await supabase
      .from('place_photos')
      .select('photo_url')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    return {
      ...place,
      signals: signals || [],
      photos: photos?.map((p) => p.photo_url) || [],
    };
  } catch (error) {
    console.error('Error in fetchPlaceById:', error);
    return null;
  }
}

// Get place ID for navigation (handles different ID formats)
export function getPlaceIdForNavigation(place: PlaceCard | Place): string {
  return place.id;
}

// Search places by query
export async function searchPlaces(
  query: string,
  userLocation?: [number, number] | null,
  limit: number = 20
): Promise<PlaceCard[]> {
  try {
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        id,
        name,
        address_line1,
        city,
        state_region,
        category,
        primary_category,
        latitude,
        longitude,
        current_status,
        cover_image_url
      `)
      .or(`name.ilike.%${query}%,address_line1.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(limit);

    if (error || !places) {
      console.error('Error searching places:', error);
      return [];
    }

    // Calculate distances and sort
    const placesWithDistance = places.map((place) => {
      let distance: number | undefined;
      if (userLocation) {
        distance = calculateDistance(
          userLocation[1],
          userLocation[0],
          place.latitude,
          place.longitude
        );
      }
      return { ...place, distance, signals: [], photos: [] };
    });

    if (userLocation) {
      placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return placesWithDistance;
  } catch (error) {
    console.error('Error in searchPlaces:', error);
    return [];
  }
}
