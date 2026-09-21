/** Public place links share one route on web and native; root slugs belong to eCards. */
export const PLACE_SHARE_ORIGIN = 'https://tavvy.com';
export function normalizePlaceShareId(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,199}$/.test(value)) return null;
  const raw = value.replace(/^(?:tavvy:|places-)/, '').replace(/^fsq-/, 'fsq:');
  return /^[a-f0-9]{24}$/i.test(raw) ? `fsq:${raw}` : raw;
}
export function placeShareUrl(identifier: unknown): string {
  const id = normalizePlaceShareId(identifier);
  if (!id) return `${PLACE_SHARE_ORIGIN}/app`;
  return id === 'demo-trattoria' ? `${PLACE_SHARE_ORIGIN}/app/demo/restaurant` : `${PLACE_SHARE_ORIGIN}/app/place/${encodeURIComponent(id)}`;
}
