/** One transaction owns canonical resolution, review and tap replacement.
 * Requires 20260920120000_review_visits_and_evidence.sql; never fall back to destructive legacy writes.
 */
import { supabase } from './supabaseClient';
import { pendingReviewRequest, confirmReviewRequest } from './reviewRequestStore';
type SignalTap = { signalId: string; intensity: number };
export interface StoredReview {
  id: string; place_id: string; user_id: string; public_note: string | null;
  private_note_owner: string | null; created_at: string; updated_at: string;
  status: string; source: string; visited_at?: string; visit_date_source?: 'reported' | 'review_created';
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateReviewSignals(signals: SignalTap[]): void {
  if (!Array.isArray(signals) || signals.length === 0 || signals.length > 100) throw new Error('Select between 1 and 100 signals.');
  const ids = new Set<string>();
  for (const signal of signals) {
    if (!signal || !UUID.test(signal.signalId) || !Number.isInteger(signal.intensity) || signal.intensity < 1 || signal.intensity > 3) throw new Error('Each signal must have an intensity between 1 and 3.');
    const id = signal.signalId.toLowerCase();
    if (ids.has(id)) throw new Error('A signal can only appear once in a review.');
    ids.add(id);
  }
}
function message(error: any): string {
  if (error?.code === 'PGRST202' || error?.code === '42883') return 'Review saving is temporarily unavailable. Please try again later.';
  return error?.message || String(error || 'Unable to save review.');
}
export type ReviewSaveOptions = { visitedAt?: string; requestKey?: string };
export function todayVisitDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function visitDateToIso(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Enter your visit date as YYYY-MM-DD.');
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > todayVisitDate()) throw new Error('Choose a valid visit date that is not in the future.');
  // A user's local day can precede UTC midnight. Keep today's report at or before now.
  return new Date(Math.min(parsed.getTime(), Date.now())).toISOString();
}
export async function savePlaceReview(placeIdentifier: string, signals: SignalTap[], publicNote?: string, privateNote?: string, reviewId?: string, options: ReviewSaveOptions = {}) {
  try {
    validateReviewSignals(signals);
    if ((publicNote?.length || 0) > 4000 || (privateNote?.length || 0) > 4000) throw new Error('Review notes must be 4000 characters or fewer.');
    if (!placeIdentifier?.trim()) throw new Error('A place is required.');
    if (options.visitedAt && (!Number.isFinite(Date.parse(options.visitedAt)) || Date.parse(options.visitedAt) > Date.now())) throw new Error('Choose a valid visit date that is not in the future.');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Sign in to save your review.');
    const sortedSignals = [...signals].sort((a, b) => a.signalId.localeCompare(b.signalId));
    const identity = JSON.stringify([user.id, placeIdentifier, reviewId || null, sortedSignals, publicNote || null, privateNote || null, options.visitedAt || null]);
    // Retain a key after uncertain/failed writes so retrying cannot duplicate a visit.
    const requestKey = await pendingReviewRequest(identity, options.requestKey);
    const { data, error } = await supabase.rpc('save_place_review_v2', {
      p_place_identifier: placeIdentifier,
      p_signals: sortedSignals.map(signal => ({ signal_id: signal.signalId, intensity: signal.intensity })),
      p_public_note: publicNote || null, p_private_note: privateNote || null,
      p_review_id: reviewId || null, p_mode: reviewId ? 'edit' : 'new_visit',
      p_visited_at: options.visitedAt || null, p_request_key: requestKey, p_source: 'web_app',
    });
    if (error) throw error;
    if (typeof data !== 'string' || !UUID.test(data)) throw new Error('The server did not confirm your review was saved.');
    await confirmReviewRequest(identity);
    return { success: true, reviewId: data };
  } catch (error) { return { success: false, error: message(error) }; }
}
export async function submitReview(placeId: string, _placeName: string, signals: SignalTap[], publicNote?: string, privateNote?: string, options?: ReviewSaveOptions) {
  return savePlaceReview(placeId, signals, publicNote, privateNote, undefined, options);
}
export async function updateReview(reviewId: string, placeId: string, signals: SignalTap[], publicNote?: string, privateNote?: string, options?: ReviewSaveOptions) {
  return savePlaceReview(placeId, signals, publicNote, privateNote, reviewId, options);
}
/** Read-only resolution: never create a canonical place while opening a form. */
export async function fetchUserReview(placeIdentifier: string): Promise<{ review: StoredReview | null; signals: SignalTap[] }> {
  const empty = { review: null, signals: [] };
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError?.name === 'AuthSessionMissingError') return empty;
  if (authError) throw new Error('Unable to verify your session. Please sign in again.');
  if (!auth.user) return empty;
  let placeId: string | undefined;
  if (UUID.test(placeIdentifier)) {
    const { data, error } = await supabase.from('places').select('id').eq('id', placeIdentifier).maybeSingle();
    if (error) throw new Error(message(error));
    placeId = data?.id;
  }
  if (!placeId) {
    const { data, error } = await supabase.from('places').select('id').eq('source_id', placeIdentifier).maybeSingle();
    if (error) throw new Error(message(error));
    placeId = data?.id;
  }
  if (!placeId) return empty;
  let { data: review, error } = await supabase.rpc('get_my_place_review_v2', { p_place_id: placeId }).maybeSingle();
  if (error && ['PGRST202', '42883'].includes(error.code)) {
    ({ data: review, error } = await supabase.rpc('get_my_place_review', { p_place_id: placeId }).maybeSingle());
  }
  if (error) throw new Error(message(error));
  if (!review) return empty;
  const { data: taps, error: tapsError } = await supabase.from('place_review_signal_taps')
    .select('signal_id, intensity').eq('review_id', (review as StoredReview).id);
  if (tapsError) throw new Error(message(tapsError));
  return { review: review as StoredReview, signals: (taps || []).map(t => ({ signalId: t.signal_id, intensity: t.intensity })) };
}
