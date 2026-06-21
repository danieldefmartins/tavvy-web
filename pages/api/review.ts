/**
 * POST /api/review
 *
 * "Add Review" signal-tap submission for a web place page.
 * Mirrors the insert shape used by ~/Projects/tavvy-review-agent/src/submitter.js
 * and lib/reviews.ts:
 *   1. insert a place_reviews row  (place_id, user_id, source, status)
 *   2. insert place_review_signal_taps rows (review_id, place_id, signal_id, intensity)
 *   3. best-effort refresh of place_signal_aggregates (a DB trigger normally
 *      maintains this rollup; we upsert defensively but never fail the request on it)
 *
 * Body: { placeId: string, signalIds: string[], userId: string, intensities?: Record<signalId, 1|2|3> }
 *
 * Auth: the caller must pass a Supabase access token (Authorization: Bearer <jwt>
 * or the sb-access-token cookie). Only the signed-in owner can write their review.
 *
 * Env note: SUPABASE_SERVICE_ROLE_KEY is used when present (matches the other
 * /pages/api routes). When it is absent (e.g. local .env.local), we fall back to
 * an anon client authenticated with the user's bearer token — RLS still allows a
 * user to insert their own place_reviews + taps, so the flow keeps working.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// review_items.signal_type -> place_signal_aggregates.bucket
// (reverse of the BUCKET map in pages/api/place/[id].ts and endorse.ts)
const SIGNAL_TYPE_TO_BUCKET: Record<string, 'positive' | 'neutral' | 'negative'> = {
  best_for: 'positive',
  vibe: 'neutral',
  heads_up: 'negative',
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { placeId, signalIds, userId, intensities } = req.body || {};

  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'placeId is required' });
  }
  if (!Array.isArray(signalIds) || signalIds.length === 0) {
    return res.status(400).json({ error: 'At least one signalId is required' });
  }
  if (!isUuid(placeId)) {
    return res.status(400).json({ error: 'placeId must be a place UUID' });
  }

  // Resolve the auth token (header preferred, cookie fallback).
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.replace('Bearer ', '') ||
    req.cookies['sb-access-token'] ||
    req.cookies['supabase-auth-token'];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', requireLogin: true });
  }

  try {
    // Always verify the user via the anon client + token.
    const authClient = createClient(supabaseUrl, anonKey);
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    }
    if (userId && userId !== user.id) {
      return res.status(403).json({ error: 'userId does not match the authenticated session' });
    }

    // Writer client: service-role when available (bypasses RLS like the other
    // routes), otherwise an anon client carrying the user's JWT so RLS sees them
    // as the owner of the rows they insert.
    const db: SupabaseClient = serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

    // De-dupe signalIds and clamp intensities to 1..3 (default 1).
    const uniqueSignalIds: string[] = Array.from(new Set(signalIds.filter((s: any) => typeof s === 'string')));
    const intensityFor = (sid: string): number => {
      const raw = intensities && typeof intensities[sid] === 'number' ? intensities[sid] : 1;
      return Math.min(3, Math.max(1, Math.round(raw)));
    };

    // 1. Create the review row.
    const { data: review, error: reviewError } = await db
      .from('place_reviews')
      .insert({
        place_id: placeId,
        user_id: user.id,
        source: 'web_app',
        status: 'live',
      })
      .select('id')
      .single();

    if (reviewError || !review) {
      console.error('[api/review] review insert error:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    // 2. Insert signal taps.
    const taps = uniqueSignalIds.map((sid) => ({
      review_id: review.id,
      place_id: placeId,
      signal_id: sid,
      intensity: intensityFor(sid),
    }));

    const { error: tapsError } = await db.from('place_review_signal_taps').insert(taps);
    if (tapsError) {
      console.error('[api/review] signal taps error:', tapsError);
      // Review row exists but taps failed — surface as error so the client can retry.
      return res.status(500).json({ error: 'Failed to save signal taps', reviewId: review.id });
    }

    // 3. Best-effort refresh of place_signal_aggregates.
    //    A DB trigger normally maintains this rollup; if it does, our upsert is a
    //    harmless no-op-equivalent. If it does not, this keeps the place page fresh.
    //    Any failure here is swallowed — the review itself already succeeded.
    await refreshAggregates(db, placeId, uniqueSignalIds, intensityFor).catch((e) =>
      console.warn('[api/review] aggregate refresh skipped:', e?.message || e)
    );

    return res.status(200).json({ success: true, reviewId: review.id, taps: taps.length });
  } catch (err: any) {
    console.error('[api/review] unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Increment place_signal_aggregates for each tapped signal.
 * Reads the signal_type from review_items to derive the bucket, then upserts
 * (place_id, signal_id) with tap_total += intensity and review_count += 1.
 */
async function refreshAggregates(
  db: SupabaseClient,
  placeId: string,
  signalIds: string[],
  intensityFor: (sid: string) => number
): Promise<void> {
  // Map each signal to its bucket via the catalog.
  const { data: items } = await db
    .from('review_items')
    .select('id, signal_type')
    .in('id', signalIds);

  const bucketFor: Record<string, 'positive' | 'neutral' | 'negative'> = {};
  (items || []).forEach((it: any) => {
    const b = SIGNAL_TYPE_TO_BUCKET[it.signal_type];
    if (b) bucketFor[it.id] = b;
  });

  // Pull current rows so we can increment (no atomic RPC available here).
  const { data: existing } = await db
    .from('place_signal_aggregates')
    .select('signal_id, bucket, tap_total, review_count')
    .eq('place_id', placeId)
    .in('signal_id', signalIds);

  const current: Record<string, { tap_total: number; review_count: number }> = {};
  (existing || []).forEach((r: any) => {
    current[r.signal_id] = { tap_total: r.tap_total || 0, review_count: r.review_count || 0 };
  });

  const rows = signalIds
    .filter((sid) => bucketFor[sid])
    .map((sid) => {
      const prev = current[sid] || { tap_total: 0, review_count: 0 };
      return {
        place_id: placeId,
        signal_id: sid,
        bucket: bucketFor[sid],
        tap_total: prev.tap_total + intensityFor(sid),
        review_count: prev.review_count + 1,
      };
    });

  if (rows.length === 0) return;

  await db.from('place_signal_aggregates').upsert(rows, { onConflict: 'place_id,signal_id' });
}
