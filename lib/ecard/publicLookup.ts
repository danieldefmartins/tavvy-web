/** Public reads only. A failed query must never be treated as a deleted card. */
export const PUBLIC_CARD_UNAVAILABLE = 'Card temporarily unavailable';

type ReadClient = { from(table: string): any };
type ReadResult = { data: any; error: { code?: string } | null; status?: number };
type LookupResult =
  | { kind: 'card'; card: any }
  | { kind: 'place'; placeId: string }
  | { kind: 'missing' }
  | { kind: 'unavailable'; stage: 'slug' | 'domain' | 'place'; code: string };

async function readOnceOrRetry(query: () => PromiseLike<ReadResult>): Promise<ReadResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let result: ReadResult;
    try {
      result = await query();
    } catch {
      result = { data: null, error: { code: 'NETWORK_ERROR' }, status: 0 };
    }
    if (!result.error) return result;
    const status = result.status ?? 0;
    // Retry one transport, timeout, rate-limit or service failure. Never retry
    // authorization, malformed queries or duplicate-row errors as "missing".
    if (attempt === 1 || !(status === 0 || status === 408 || status === 429 || status >= 500)) return result;
  }
  throw new Error('Unreachable public lookup state');
}

function customHost(host: string): string | null {
  const normalized = host.trim().toLowerCase();
  const hostname = normalized.split(':')[0];
  if (!hostname || hostname === 'tavvy.com' || hostname.endsWith('.tavvy.com') || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return null;
  return normalized;
}

export async function lookupPublicCard(client: ReadClient, slug: string, host = ''): Promise<LookupResult> {
  const readCard = (column: 'slug' | 'custom_domain', value: string) => readOnceOrRetry(() => {
    let query = client.from('digital_cards').select('*')
      .eq('is_published', true).eq('is_active', true).eq(column, value);
    if (column === 'custom_domain') query = query.eq('custom_domain_verified', true);
    return query.abortSignal(AbortSignal.timeout(6000)).maybeSingle();
  });
  const bySlug = await readCard('slug', slug);
  if (bySlug.error) return { kind: 'unavailable', stage: 'slug', code: bySlug.error.code || 'READ_FAILED' };
  if (bySlug.data) return { kind: 'card', card: bySlug.data };

  const domain = customHost(host);
  if (domain) {
    const byDomain = await readCard('custom_domain', domain);
    if (byDomain.error) return { kind: 'unavailable', stage: 'domain', code: byDomain.error.code || 'READ_FAILED' };
    if (byDomain.data) return { kind: 'card', card: byDomain.data };
  }

  const place = await readOnceOrRetry(() => client.from('places').select('id')
    .eq('slug', slug).abortSignal(AbortSignal.timeout(6000)).maybeSingle());
  if (place.error) return { kind: 'unavailable', stage: 'place', code: place.error.code || 'READ_FAILED' };
  return place.data?.id ? { kind: 'place', placeId: place.data.id } : { kind: 'missing' };
}

export function setPublicCardErrorStatus(response: { statusCode: number; setHeader(name: string, value: string): void }, unavailable: boolean): void {
  response.statusCode = unavailable ? 503 : 404;
  response.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (unavailable) response.setHeader('Retry-After', '30');
}
