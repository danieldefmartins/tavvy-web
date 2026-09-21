export const DEMO_RESTAURANT_HREF = '/app/demo/restaurant';

export function matchesDemoRestaurantQuery(query: string): boolean {
  return /^(?:tavvy demo|demo restaurant)$/i.test(query.trim());
}

/** Offer the illustrative sample only after an exact-name lookup confidently found no real places. */
export function shouldOfferDemoRestaurant(query: string, results: readonly unknown[], partial = false): boolean {
  return !partial && /^trattoria tavvy$/i.test(query.trim()) && results.length === 0;
}
