import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRVCatalog, RVCategory, RVPlace } from '../lib/rvCatalog';
import { buildPlaceReviewSummary, PlaceReviewSummary } from '../lib/placeReviewSummary';
import { loadReviewSummaries } from '../lib/reviewSummaryLoader';

export function useRVCatalog(category: RVCategory, query: string) {
  const [places, setPlaces] = useState<RVPlace[]>([]), [loading, setLoading] = useState(true), [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  const generation = useRef(0), nextOffset = useRef(0), pendingMore = useRef<number | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, PlaceReviewSummary>>({});
  const enrich = useCallback(async (rows: RVPlace[], request: number) => {
    const subjects = rows.map(place => ({ id: place.id, category: place.tavvy_category, subcategory: place.tavvy_subcategory }));
    setReviewSummaries(current => ({ ...current, ...Object.fromEntries(subjects.map(place => [place.id, buildPlaceReviewSummary(null, place, 'loading')])) }));
    const summaries = await loadReviewSummaries(subjects);
    if (generation.current === request) setReviewSummaries(current => ({ ...current, ...summaries }));
  }, []);
  useEffect(() => {
    const request = ++generation.current;
    nextOffset.current = 0; pendingMore.current = null;
    setPlaces([]); setReviewSummaries({}); setError(''); setLoading(true); setLoadingMore(false); setHasMore(false);
    const timer = setTimeout(() => { void fetchRVCatalog({ category, query }).then(result => {
      if (request !== generation.current) return;
      nextOffset.current = result.nextOffset; setPlaces(result.places); setHasMore(result.hasMore);
      void enrich(result.places, request);
    }).catch(e => { if (request === generation.current) setError(e.message); }).finally(() => { if (request === generation.current) setLoading(false); }); }, query.trim() ? 200 : 0);
    return () => { clearTimeout(timer); if (generation.current === request) generation.current++; };
  }, [category, query, refresh, enrich]);
  const loadMore = useCallback(async () => {
    const request = generation.current;
    if (loading || !hasMore || pendingMore.current === request) return;
    pendingMore.current = request; setLoadingMore(true); setError('');
    try {
      const result = await fetchRVCatalog({ category, query, offset: nextOffset.current });
      if (generation.current !== request) return;
      nextOffset.current = result.nextOffset;
      setPlaces(current => { const seen = new Set(current.map(p => p.id)); return [...current, ...result.places.filter(p => !seen.has(p.id))]; });
      setHasMore(result.hasMore);
      void enrich(result.places, request);
    } catch (e) { if (generation.current === request) setError(e instanceof Error ? e.message : 'Places are temporarily unavailable. Please try again.'); }
    finally { if (generation.current === request) { pendingMore.current = null; setLoadingMore(false); } }
  }, [category, query, loading, hasMore, enrich]);
  const reload = useCallback(() => { generation.current++; setRefresh(v => v + 1); }, []);
  return { places, reviewSummaries, loading, loadingMore, hasMore, error, loadMore, reload };
}
