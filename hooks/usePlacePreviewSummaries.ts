import { useEffect, useState } from 'react';
import { canonicalPlaceId } from '../lib/searchIntent';
import { loadReviewSummaries } from '../lib/reviewSummaryLoader';
import { buildPlaceReviewSummary, PlaceReviewSummary } from '../lib/placeReviewSummary';

type Subject = { id: string; category?: string; subcategory?: string; tavvy_category?: string; reviewSummary?: PlaceReviewSummary };
/** Browse cards use the same recent evidence as details; late responses cannot replace a new list. */
export function usePlacePreviewSummaries(places: Subject[]) {
  const [summaries, setSummaries] = useState<Record<string, PlaceReviewSummary>>({});
  const key = JSON.stringify(places.filter(place => !place.reviewSummary).map(place => ({
    originalId: place.id, id: canonicalPlaceId(place.id), category: place.tavvy_category || place.category, subcategory: place.subcategory,
  })));
  useEffect(() => {
    let current = true;
    const subjects = JSON.parse(key) as (Subject & { originalId: string })[];
    setSummaries(Object.fromEntries(subjects.map(place => [place.originalId, buildPlaceReviewSummary(null, place, 'loading')])));
    if (subjects.length) void loadReviewSummaries(subjects).then(result => {
      if (current) setSummaries(Object.fromEntries(subjects.map(place => [place.originalId, result[place.id]])));
    });
    return () => { current = false; };
  }, [key]);
  return summaries;
}
