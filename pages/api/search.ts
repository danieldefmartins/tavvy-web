import type { NextApiRequest, NextApiResponse } from 'next';
import { searchAcrossProviders, SearchLocationRequired } from '../../lib/placeSearch';
import { isDiningSearch, SearchContext, validCoordinates } from '../../lib/searchIntent';
import { fetchEvidenceForPlaces } from '../../lib/placeEvidenceService';
import { currentEvidenceSignals, PlaceEvidence } from '../../lib/placeEvidence';
import { matchNeed, DINING_NEEDS } from '../../lib/discoveryEvidence';
import { buildPlaceReviewSummary } from '../../lib/placeReviewSummary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const param = (key: string) => typeof req.query[key] === 'string' ? req.query[key] as string : '';
  const q = param('q').trim();
  if (!q) return res.status(200).json({ suggestions: [] });
  if (q.length > 200 || param('where').length > 120) return res.status(400).json({ error: 'Search query is too long', suggestions: [] });
  const limit = Math.max(1, Math.min(50, Number(param('limit')) || 8));
  const coordinates = { latitude: Number(param('userLat')), longitude: Number(param('userLng')) };
  const mode = param('location');
  const context: SearchContext = { location: param('where'),
    coordinates: param('userLat') && param('userLng') && validCoordinates(coordinates) ? coordinates : undefined,
    mode: mode === 'current' || mode === 'map' || mode === 'anywhere' ? mode : undefined };
  if (mode === 'map') {
    const bounds = { minLat: Number(param('minLat')), maxLat: Number(param('maxLat')), minLng: Number(param('minLng')), maxLng: Number(param('maxLng')) };
    if (['minLat','maxLat','minLng','maxLng'].every(key => param(key) !== '') && bounds.minLat < bounds.maxLat && bounds.minLng < bounds.maxLng && Math.abs(bounds.minLat) <= 90 && Math.abs(bounds.maxLat) <= 90 && Math.abs(bounds.minLng) <= 180 && Math.abs(bounds.maxLng) <= 180) {
      context.bounds = bounds;
      context.coordinates = { latitude: (bounds.minLat+bounds.maxLat)/2, longitude: (bounds.minLng+bounds.maxLng)/2 };
      context.radiusKm = Math.min(20000, Math.hypot(bounds.maxLat-bounds.minLat, (bounds.maxLng-bounds.minLng)*Math.cos(context.coordinates.latitude*Math.PI/180))*111.32/2);
    }
  }
  try {
    const response = await searchAcrossProviders(q, limit, context);
    const dining = isDiningSearch(response.intent.query) || response.places.some(place => isDiningSearch(`${place.category} ${place.subcategory}`));
    const need = dining && DINING_NEEDS.some(item => item.id === param('need')) ? param('need') : '';
    const canonical = response.places.filter(place => !place.id.startsWith('fsq:'));
    const deferEvidence = param('evidence') === 'defer';
    const evidence = deferEvidence ? new Map<string, PlaceEvidence>() : await fetchEvidenceForPlaces(canonical.map(place => ({ id: place.id, category: place.tavvy_category || place.category, subcategory: place.subcategory })));
    const suggestions = response.places.map(place => {
      const current = evidence.get(place.id);
      const topSignals = current ? currentEvidenceSignals(current) : [];
      return { ...place, topSignals, signals: topSignals.map(signal => ({ bucket: signal.label, tap_total: signal.count, category: signal.category })),
        reviewSummary: buildPlaceReviewSummary(current, { category: place.tavvy_category || place.category, subcategory: place.subcategory }, deferEvidence && !place.id.startsWith('fsq:') ? 'loading' : current?.dataStatus || 'unavailable'),
        evidenceStatus: deferEvidence && !place.id.startsWith('fsq:') ? 'loading' : current?.dataStatus || 'unavailable',
        ...(!deferEvidence && need ? { matchScore: matchNeed(current, need).score, matchReason: matchNeed(current, need).reason } : {}) };
    });
    if (need && !deferEvidence) suggestions.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
    return res.status(200).json({ suggestions, location: { kind: response.intent.kind, label: response.intent.label }, dining, evidencePending: deferEvidence && canonical.length > 0, partial: response.partial });
  } catch (error) {
    if (error instanceof SearchLocationRequired) return res.status(422).json({ code: 'LOCATION_REQUIRED', error: error.message, suggestions: [] });
    console.error('[search]', error);
    return res.status(503).json({ error: 'Search is temporarily unavailable. Please try again.', suggestions: [] });
  }
}
