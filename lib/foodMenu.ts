import { supabase } from './supabaseClient';

export interface FoodMenuResult {
  id: string; place_id: string; item_name: string; description: string | null;
  price: number | null; price_label: string | null; image_url: string | null;
  category: string; dietary_tags: string[]; place_name: string;
  city: string | null; state: string | null; dish_type: string | null;
  distance_km: number | null;
}
export interface FoodMenuSearch {
  query?: string; city?: string; latitude?: number; longitude?: number;
  radiusKm?: number; universeId?: string; offset?: number;
}
export async function searchFoodMenus(options: FoodMenuSearch): Promise<FoodMenuResult[]> {
  const { data, error } = await supabase.rpc('search_food_menus', {
    search_text: (options.query || '').trim().slice(0, 120),
    location_text: (options.city || '').trim().slice(0, 120),
    center_lat: options.latitude ?? null, center_lon: options.longitude ?? null,
    radius_km: options.radiusKm ?? 25, universe_filter: options.universeId ?? null,
    page_offset: options.offset ?? 0,
  });
  if (error) throw new Error('Food Menu search is temporarily unavailable. Please try again later.');
  return data || [];
}

export interface FoodMenuPlace {
  place_id: string; place_name: string; slug: string | null; city: string | null; state: string | null;
  cover_image_url: string | null; dish_count: number; sample_dishes: string[]; distance_km: number | null;
}
/** Restaurants mode of the Food Menu tool: places with a published food menu (optionally matching a dish/place search). */
export async function searchFoodMenuPlaces(options: FoodMenuSearch): Promise<FoodMenuPlace[]> {
  const { data, error } = await supabase.rpc('search_food_menu_places', {
    search_text: (options.query || '').trim().slice(0, 120),
    location_text: (options.city || '').trim().slice(0, 120),
    center_lat: options.latitude ?? null, center_lon: options.longitude ?? null,
    radius_km: options.radiusKm ?? 25, page_offset: options.offset ?? 0,
  });
  if (error) throw new Error('Food Menu search is temporarily unavailable. Please try again later.');
  return (data || []).map((row: FoodMenuPlace) => ({ ...row, dish_count: Number(row.dish_count) || 0, sample_dishes: row.sample_dishes || [] }));
}
