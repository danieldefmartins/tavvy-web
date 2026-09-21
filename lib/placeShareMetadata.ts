import { compositePlacePhotoSource } from './placeSharePhoto';
import { normalizePlaceShareId, placeShareUrl, PLACE_SHARE_ORIGIN } from './placeShare';
export interface PlaceShareMetadata {
    id: string;
    name: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    photoUrl?: string | null;
    imageVersion?: string;
    location: string;
    url: string;
    image: string;
    imageAlt: string;
    generatedImage: boolean;
}
export interface PlaceShareRecord {
    id: string;
    name?: string;
    tavvy_category?: string;
    tavvy_subcategory?: string;
    category?: string;
    city?: string;
    region?: string;
    country?: string;
    cover_image_url?: string | null;
    photos?: unknown;
    description?: string | null;
}
const text = (value: unknown, max = 160) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
export function placeSharePhotoUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 4096 || /[\u0000-\u001f]/.test(value))
        return null;
    try {
        const url = new URL(value, PLACE_SHARE_ORIGIN);
        if ((!value.startsWith('/') && !/^https:\/\//i.test(value)) || value.startsWith('//') || url.protocol !== 'https:' || url.username || url.password)
            return null;
        if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(url.hostname) || /\.(local|internal)$/i.test(url.hostname))
            return null;
        if (/\.(svg|heic|heif)(?:$|\?)/i.test(url.pathname))
            return null;
        return url.href;
    }
    catch {
        return null;
    }
}
function firstPhoto(photos: unknown): string | null {
    if (typeof photos === 'string') {
        try {
            return firstPhoto(JSON.parse(photos));
        }
        catch {
            return placeSharePhotoUrl(photos);
        }
    }
    if (!Array.isArray(photos))
        return null;
    for (const photo of photos) {
        const candidate = placeSharePhotoUrl(typeof photo === 'string' ? photo : photo?.url || photo?.image_url || photo?.photo_url);
        if (candidate)
            return candidate;
    }
    return null;
}
const categoryLabels: Record<string, string> = { restaurants: 'Restaurant', restaurant: 'Restaurant', cafes: 'Café', cafe: 'Café', hotels: 'Hotel', hotel: 'Hotel', on_the_go: 'On The Go', rv_camping: 'RV & Camping', rv_park: 'RV Park', rv_parks: 'RV Park', realtors: 'Real estate', pros: 'Local service' };
const label = (value: unknown) => { const raw = text(value, 90); return categoryLabels[raw.toLowerCase()] || raw.replace(/_/g, ' ').replace(/^./, letter => letter.toUpperCase()); };
const identity = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '').replace(/s$/, '');
export function placeShareCategories(record: PlaceShareRecord): {
    category: string;
    subcategory: string;
} {
    const primary = label(record.tavvy_category || record.category), secondary = label(record.tavvy_subcategory);
    if (!primary)
        return { category: secondary || 'Place', subcategory: '' };
    if (!secondary || identity(primary) === identity(secondary))
        return { category: primary, subcategory: '' };
    // "Restaurant · Italian restaurant" repeats the category. Keep the cuisine qualifier.
    const escaped = primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const short = secondary.replace(new RegExp('\\s+' + escaped + 's?$', 'i'), '').trim();
    return { category: primary, subcategory: short || secondary };
}
function visualVersion(values: unknown[]): string { let hash = 2166136261; for (const char of JSON.stringify(values)) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
} return '2-' + (hash >>> 0).toString(16); }
export function buildPlaceShareMetadata(record: PlaceShareRecord): PlaceShareMetadata {
    const id = normalizePlaceShareId(record.id) || 'place', name = text(record.name) || 'Place on Tavvy';
    const { category, subcategory } = placeShareCategories(record);
    const location = [text(record.city, 70), text(record.region, 45)].filter(Boolean).join(', ') || text(record.country, 70);
    const details = [category, subcategory, location].filter(Boolean).join(' · ');
    const photoUrl = placeSharePhotoUrl(record.cover_image_url) || firstPhoto(record.photos);
    const generatedImage = !photoUrl || Boolean(compositePlacePhotoSource(photoUrl));
    const imageVersion = visualVersion([id, name, category, subcategory, location, photoUrl]);
    return { id, name, title: `${name} — Tavvy`, category, subcategory, location, photoUrl, imageVersion,
        description: `${details}. Explore ${name} on Tavvy: visitor experiences, photos and place details.`, url: placeShareUrl(id),
        image: generatedImage ? `${PLACE_SHARE_ORIGIN}/api/og/place/${encodeURIComponent(id)}?v=${imageVersion}` : photoUrl!,
        imageAlt: `${name} · ${details}`, generatedImage };
}
export const DEMO_PLACE_SHARE = {
    ...buildPlaceShareMetadata({ id: 'demo-trattoria', name: 'Trattoria Tavvy', tavvy_category: 'restaurant', tavvy_subcategory: 'Italian', city: 'Winter Park', region: 'Florida', cover_image_url: '/images/demo-trattoria/dining-room.jpg' }),
    description: 'Explore Tavvy’s sample Italian restaurant: food, stories, a visual menu, eCard and table ordering.',
};
