/** Search and place-service distances are meters, including zero. */
export function formatPlaceDistance(meters: unknown, unit: 'miles' | 'kilometers' = 'miles'): string {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters < 0) return '';
  if (meters < 15) return 'Nearby';
  if (unit === 'kilometers') return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  const miles = meters / 1609.344;
  return miles < 0.1 ? `${Math.round(meters / 0.3048)} ft` : `${miles.toFixed(1)} mi`;
}
