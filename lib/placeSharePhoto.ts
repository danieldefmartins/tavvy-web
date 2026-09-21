import { PLACE_SHARE_ORIGIN } from './placeShare';
export type CompositePhotoSource = {
    kind: 'local';
    path: string;
} | {
    kind: 'storage';
    url: string;
};
/** Only project-owned public storage and one known demo asset may be fetched server-side. */
export function compositePlacePhotoSource(value: unknown, storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://scasgwrikoqdwlwlwcff.supabase.co'): CompositePhotoSource | null {
    if (typeof value !== 'string')
        return null;
    try {
        const url = new URL(value, PLACE_SHARE_ORIGIN);
        if (url.protocol !== 'https:' || url.username || url.password || url.port)
            return null;
        if (url.origin === PLACE_SHARE_ORIGIN && url.pathname === '/images/demo-trattoria/dining-room.jpg' && !url.search && !url.hash)
            return { kind: 'local', path: 'images/demo-trattoria/dining-room.jpg' };
        const origin = new URL(storageOrigin);
        if (origin.protocol !== 'https:' || origin.username || origin.password || origin.port || origin.pathname !== '/')
            return null;
        if (url.origin !== origin.origin || !url.pathname.startsWith('/storage/v1/object/public/') || url.pathname.includes('%') || url.search || url.hash)
            return null;
        if (!/\.(?:png|jpe?g)$/i.test(url.pathname))
            return null;
        return { kind: 'storage', url: url.href };
    }
    catch {
        return null;
    }
}
