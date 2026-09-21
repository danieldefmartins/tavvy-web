import { fetchEvidenceForPlaces, EvidencePlace } from './placeEvidenceService';
import { buildPlaceReviewSummary, PlaceReviewSummary } from './placeReviewSummary';

/** Keep discovery usable when review reads fail or never resolve. */
export async function loadReviewSummaries(
  places: EvidencePlace[],
  options: { load?: typeof fetchEvidenceForPlaces; timeoutMs?: number } = {},
): Promise<Record<string, PlaceReviewSummary>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const evidence = await Promise.race([
      (options.load || fetchEvidenceForPlaces)(places),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Review read timed out')), options.timeoutMs ?? 20000); }),
    ]);
    return Object.fromEntries(places.map(place => [place.id, buildPlaceReviewSummary(evidence.get(place.id), place)]));
  } catch {
    return Object.fromEntries(places.map(place => [place.id, buildPlaceReviewSummary(null, place, 'unavailable')]));
  } finally {
    if (timer) clearTimeout(timer);
  }
}
