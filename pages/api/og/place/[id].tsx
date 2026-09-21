import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { fetchPlaceShareMetadata } from '../../../../lib/placeShareLookup';
import { loadPlaceSharePhoto, renderPlaceSharePng } from '../../../../lib/placeShareImage';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return res.status(405).end();
    }
    const result = await fetchPlaceShareMetadata(req.query.id);
    if (!result.metadata) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(result.status === 'missing' ? 404 : 503).json({ error: 'Place preview unavailable' });
    }
    try {
        // Remote photos are never fetched unless their origin/path is explicitly trusted.
        const photo = await loadPlaceSharePhoto(result.metadata.photoUrl);
        // The bundled font remains explicitly traced for this route in next.config.js.
        const png = renderPlaceSharePng(result.metadata, photo), etag = '"' + createHash('sha256').update(png).digest('hex') + '"';
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('ETag', etag);
        if (req.headers['if-none-match'] === etag)
            return res.status(304).end();
        res.setHeader('Content-Length', png.length);
        // Next's send(buffer) replaces ETag. Use the native response so GET and HEAD agree.
        return req.method === 'HEAD' ? res.status(200).end() : res.status(200).end(png);
    }
    catch {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ error: 'Place preview unavailable' });
    }
}
