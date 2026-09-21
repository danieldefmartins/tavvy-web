import { supabase } from './supabaseClient';

export function hasUniverseCoordinates(point: { latitude?: number | null; longitude?: number | null } | null | undefined): boolean {
  return !!point && typeof point.latitude === 'number' && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 && typeof point.longitude === 'number' && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

// Read every membership page so larger parks and child areas are not silently truncated.
export async function loadUniversePlaces(universeIds: string[]) {
  const links: { place_id: string; universe_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('atlas_universe_places').select('place_id, universe_id').in('universe_id', universeIds).order('universe_id').order('place_id').range(offset, offset + 999);
    if (error) throw error;
    links.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const ids = [...new Set(links.map(link => link.place_id))];
  const places: any[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabase.from('places').select('id, name, tavvy_category, tavvy_subcategory, cover_image_url, latitude, longitude').in('id', ids.slice(offset, offset + 100));
    if (error) throw error;
    places.push(...(data || []));
  }
  return places.map(place => ({ ...place, universe_ids: links.filter(link => link.place_id === place.id).map(link => link.universe_id) })).sort((a, b) => a.name.localeCompare(b.name));
}
