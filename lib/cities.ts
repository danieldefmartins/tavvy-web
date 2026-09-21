import { CITY_COUNTRY_CODES } from './cityCountryCodes';
/** City discovery uses published city metadata; city IDs are not place review IDs. */
export interface CityRecord {
  id: string; name: string; slug?: string; state?: string; region?: string; country?: string;
  latitude?: number; longitude?: number; population?: number; cover_image_url?: string; thumbnail_image_url?: string;
  description?: string; culture?: string; history?: string; best_time_to_visit?: string;
  weather_summary?: string; timezone?: string; is_featured?: boolean; gallery_images?: unknown;
}
export const CITY_COLUMNS = 'id,name,slug,state,region,country,latitude,longitude,population,cover_image_url,thumbnail_image_url,description,culture,history,best_time_to_visit,weather_summary,timezone,is_featured,gallery_images';
export function matchesCity(city: CityRecord, search: string) {
  const term = search.trim().toLocaleLowerCase();
  return [city.name, city.state, city.region, city.country].some(value => value?.toLocaleLowerCase().includes(term));
}
export function cityPhotos(city: CityRecord): string[] {
  const gallery = Array.isArray(city.gallery_images) ? city.gallery_images : [];
  return [...new Set([city.cover_image_url, ...gallery.map(item => typeof item === 'string' ? item : item?.url)].filter((url): url is string => typeof url === 'string' && /^https?:\/\//.test(url)))];
}
export async function loadActiveCities(client: any): Promise<CityRecord[]> {
  const cities: CityRecord[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await client.from('tavvy_cities').select(CITY_COLUMNS).eq('is_active', true)
      .order('population', { ascending: false, nullsFirst: false }).order('id').range(from, from + 499);
    if (error) throw error;
    cities.push(...(data || []));
    if (!data || data.length < 500) return cities;
  }
}
export async function loadCity(client: any, idOrSlug: string): Promise<CityRecord | null> {
  const column = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(idOrSlug) ? 'id' : 'slug';
  const { data, error } = await client.from('tavvy_cities').select(CITY_COLUMNS).eq('is_active', true).eq(column, idOrSlug).maybeSingle();
  if (error) throw error;
  return data;
}
export function placeBelongsToCity(place: any, city: CityRecord): boolean {
  const countryCode = (value?: string) => CITY_COUNTRY_CODES[(value || '').trim().toLowerCase()] || (value || '').trim().toUpperCase();
  if (city.country && countryCode(place.country) !== countryCode(city.country)) return false;
  // Importers use both translated state names and abbreviations. Coordinates disambiguate
  // same-name cities within a country without treating city.region (e.g. Europe) as a state.
  if (city.latitude != null && city.longitude != null && place.latitude != null && place.longitude != null) {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const dlat = radians(Number(place.latitude) - Number(city.latitude));
    const dlon = radians(Number(place.longitude) - Number(city.longitude));
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(radians(Number(city.latitude))) * Math.cos(radians(Number(place.latitude))) * Math.sin(dlon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) <= 80;
  }
  return true;
}
export async function loadCityPlaces(client: any, city: CityRecord): Promise<any[]> {
  const places: any[] = [];
  // Escape LIKE metacharacters; a city's name must never broaden the query.
  const exact = (value: string) => value.replace(/[\\%_]/g, '\\$&');
  for (let from = 0; ; from += 500) {
    let query = client.from('places').select('id,name,slug,tavvy_category,street,city,country,region,latitude,longitude,cover_image_url,photos')
      .eq('status', 'active').ilike('city', exact(city.name));
    const { data, error } = await query.order('name').order('id').range(from, from + 499);
    if (error) throw error;
    places.push(...(data || []).filter((place: any) => placeBelongsToCity(place, city)));
    if (!data || data.length < 500) return places;
  }
}
