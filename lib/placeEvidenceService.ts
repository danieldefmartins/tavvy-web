import { supabase } from './supabaseClient';
import { buildPlaceEvidence, EvidenceSubject, EvidenceVisit, PlaceEvidence, unavailablePlaceEvidence } from './placeEvidence';

export type EvidencePlace = { id: string; category?: string | null; subcategory?: string | null };
export type EvidenceClient = { from: (table: string) => any; rpc?: (name: string, args: Record<string, unknown>) => any };
export type EvidenceLoadOptions = { client?: EvidenceClient; now?: Date };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY: Record<string, 'good' | 'vibe' | 'headsup'> = { best_for: 'good', vibe: 'vibe', heads_up: 'headsup' };
const PAGE_SIZE = 500;

async function allRows(query: (from: number, to: number) => any, maxRows: number): Promise<any[]> {
  const rows: any[] = [];
  let expectedCount: number | null = null;
  for (let offset = 0; offset <= maxRows; offset += PAGE_SIZE) {
    const { data, error, count } = await query(offset, offset + PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) throw new Error('Review data could not be loaded completely');
    if (typeof count !== 'number' || (expectedCount !== null && count !== expectedCount)) throw new Error('Review data changed or its completeness could not be confirmed');
    expectedCount = count;
    if (count > maxRows) throw new Error('Review data exceeds the complete-summary limit');
    rows.push(...data);
    if (rows.length > maxRows) throw new Error('Review data exceeds the complete-summary limit');
    if (data.length < PAGE_SIZE) {
      if (rows.length !== expectedCount) throw new Error('Review data was truncated');
      return rows;
    }
  }
  throw new Error('Review data could not be loaded completely');
}

// Migration-backed reads use an immutable revision snapshot and keyset cursor.
// Old deployments retain a paginated read-only fallback until the additive migration is installed.
async function revisionVisits(client: EvidenceClient, ids: string[], retried = false): Promise<{ placeId: string; visit: EvidenceVisit }[] | null> {
  if (!client.rpc) return null;
  const visits: { placeId: string; visit: EvidenceVisit }[] = [];
  let cursor: string | null = null;
  let snapshot: string | null = null;
  for (let page = 0; page < 100; page++) {
    const { data, error } = await client.rpc('get_place_review_evidence', { p_place_ids: ids, p_cursor: cursor, p_snapshot: snapshot, p_limit: PAGE_SIZE });
    if (error) {
      if (error.code === '40001' && !retried) return revisionVisits(client, ids, true);
      if (page === 0 && ['PGRST202', '42883'].includes(error.code)) return null;
      throw new Error('Recent review information could not be loaded');
    }
    if (!data || !Array.isArray(data.visits) || typeof data.complete !== 'boolean' || typeof data.snapshot !== 'string') throw new Error('Incomplete review response');
    snapshot = data.snapshot;
    for (const row of data.visits) {
      if (!ids.includes(row.place_id) || typeof row.review_id !== 'string' || !Array.isArray(row.signals)) throw new Error('Invalid review response');
      visits.push({ placeId: row.place_id, visit: { reviewId: row.review_id, userId: row.user_id || '', visitedAt: row.visited_at, dateSource: row.date_source, signals: row.signals } });
    }
    if (data.complete) return visits;
    if (!data.next_cursor || data.next_cursor === cursor) throw new Error('Incomplete review pagination');
    cursor = data.next_cursor;
  }
  throw new Error('Review data exceeds the complete-summary limit');
}

async function legacyVisits(client: EvidenceClient, ids: string[], now: Date): Promise<{ placeId: string; visit: EvidenceVisit }[]> {
  const reviews = await allRows((from, to) => client.from('place_reviews')
    .select('id,place_id,user_id,created_at', { count: 'exact' }).in('place_id', ids).eq('status', 'live')
    .lte('created_at', now.toISOString()).order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to), 20000);
  if (!reviews.length) return [];
  const byReview = new Map<string, { placeId: string; visit: EvidenceVisit }>(reviews.map(row => [row.id, { placeId: row.place_id, visit: { reviewId: row.id, userId: row.user_id || '', visitedAt: row.created_at, dateSource: 'review_created', signals: [] } }]));
  const taps = await allRows((from, to) => client.from('place_review_signal_taps')
    .select('id,review_id,signal_id,intensity', { count: 'exact' }).in('place_id', ids)
    .order('id', { ascending: true }).range(from, to), 100000);
  const catalogIds = [...new Set(taps.filter(t => byReview.has(t.review_id)).map(t => t.signal_id))];
  const definitions = new Map<string, any>();
  for (let start = 0; start < catalogIds.length; start += PAGE_SIZE) {
    const { data, error } = await client.from('review_items').select('id,slug,label,signal_type').in('id', catalogIds.slice(start, start + PAGE_SIZE));
    if (error || !Array.isArray(data)) throw new Error('Review signals could not be loaded');
    for (const item of data) definitions.set(item.id, item);
  }
  for (const tap of taps) {
    const row = byReview.get(tap.review_id);
    if (!row) continue;
    const item = definitions.get(tap.signal_id);
    if (!item) throw new Error('A review signal is unavailable');
    const category = CATEGORY[item.signal_type];
    if (category) row.visit.signals.push({ slug: item.slug, label: item.label, category, intensity: tap.intensity });
  }
  return [...byReview.values()];
}

export async function fetchEvidenceForPlaces(places: EvidencePlace[], options: EvidenceLoadOptions = {}): Promise<Map<string, PlaceEvidence>> {
  const client = options.client || supabase;
  const now = options.now || new Date();
  const result = new Map<string, PlaceEvidence>();
  const unique = [...new Map(places.map(place => [place.id, place])).values()];
  for (const place of unique) if (!UUID.test(place.id)) result.set(place.id, unavailablePlaceEvidence(place, 'Recent review information is not available for this listing', now));
  const valid = unique.filter(place => UUID.test(place.id));
  // Small batches avoid serializing every restaurant's entire history behind
  // one long cursor. Bound concurrency so discovery stays responsive without
  // issuing an unbounded number of database requests.
  const loadBatch = async (batch: EvidencePlace[]) => {
    try {
      const ids = batch.map(place => place.id);
      const visits = await revisionVisits(client, ids) ?? await legacyVisits(client, ids, now);
      const grouped = new Map<string, EvidenceVisit[]>();
      for (const row of visits) { if (!grouped.has(row.placeId)) grouped.set(row.placeId, []); grouped.get(row.placeId)!.push(row.visit); }
      for (const place of batch) result.set(place.id, buildPlaceEvidence(grouped.get(place.id) || [], place, now));
    } catch {
      for (const place of batch) result.set(place.id, unavailablePlaceEvidence(place, undefined, now));
    }
  };
  const BATCH_SIZE = 5, CONCURRENCY = 4;
  for (let offset = 0; offset < valid.length; offset += BATCH_SIZE * CONCURRENCY) {
    const batches: EvidencePlace[][] = [];
    for (let cursor = offset; cursor < Math.min(valid.length, offset + BATCH_SIZE * CONCURRENCY); cursor += BATCH_SIZE) batches.push(valid.slice(cursor, cursor + BATCH_SIZE));
    await Promise.all(batches.map(loadBatch));
  }
  return result;
}

export async function fetchPlaceEvidence(placeId: string, subject?: EvidenceSubject, options?: EvidenceLoadOptions): Promise<PlaceEvidence> {
  return (await fetchEvidenceForPlaces([{ id: placeId, ...(typeof subject === 'string' ? { category: subject } : subject) }], options)).get(placeId)!;
}
