import { supabase } from './supabaseClient';

/** A place already on Tavvy at the address someone is trying to add. */
export interface PlaceAtAddress {
  id: string; name: string; tavvy_category: string | null; street: string | null; city: string | null;
  region: string | null; postcode: string | null; phone: string | null; website: string | null;
  cover_image_url: string | null; latitude: number | null; longitude: number | null; distance_m: number | null;
}

/** Fields a member may propose to change on an existing place (applied only after admin approval). */
export const EDITABLE_PLACE_FIELDS: { key: keyof PlaceAtAddress; label: string }[] = [
  { key: 'name', label: 'Place name' },
  { key: 'tavvy_category', label: 'Category' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'street', label: 'Street address' },
  { key: 'city', label: 'City' },
  { key: 'region', label: 'State / region' },
  { key: 'postcode', label: 'ZIP / postal code' },
];

/** Places already on Tavvy at this address (same building or within ~170 m). */
export async function findPlacesAtAddress(input: { latitude?: number | null; longitude?: number | null; street?: string | null; city?: string | null }): Promise<PlaceAtAddress[]> {
  const { data, error } = await supabase.rpc('places_at_address', {
    p_lat: Number.isFinite(input.latitude as number) ? input.latitude : null,
    p_lng: Number.isFinite(input.longitude as number) ? input.longitude : null,
    p_street: (input.street || '').trim().slice(0, 200), p_city: (input.city || '').trim().slice(0, 120),
  });
  if (error) return [];
  return (data || []) as PlaceAtAddress[];
}

/** Proposes changes to an existing place. Stored as pending in edit_suggestions; an admin applies them. */
export async function submitEditSuggestion(input: { placeId: string; userId: string; current: PlaceAtAddress; proposed: Record<string, string>; reason?: string }): Promise<Record<string, string>> {
  const changes: Record<string, string> = {};
  for (const field of EDITABLE_PLACE_FIELDS) {
    const next = (input.proposed[field.key] || '').trim();
    const prev = ((input.current[field.key] as string | null) || '').trim();
    if (next && next !== prev) changes[field.key] = next.slice(0, 300);
  }
  if (Object.keys(changes).length === 0) throw new Error('Change at least one field first.');
  const { error } = await supabase.from('edit_suggestions').insert({
    place_id: input.placeId, user_id: input.userId, suggested_changes: changes,
    reason: (input.reason || '').trim().slice(0, 500) || null, status: 'pending',
  });
  if (error) throw new Error('Could not send your suggestion. Please try again.');
  return changes;
}

/** Address-only label for a Nominatim result: "62 Gorham St, Lowell, MA 01852" — never a business name. */
export function cleanAddressLabel(address: Record<string, string> | undefined): string | null {
  if (!address) return null;
  const road = address.road || address.pedestrian || address.footway || address.residential;
  if (!road) return null;
  const line1 = [address.house_number, road].filter(Boolean).join(' ');
  const city = address.city || address.town || address.village || address.hamlet || address.municipality || address.county;
  const region = address.state_code || address['ISO3166-2-lvl4']?.split('-')[1] || address.state;
  const tail = [region, address.postcode].filter(Boolean).join(' ');
  return [line1, city, tail].filter(Boolean).join(', ');
}
