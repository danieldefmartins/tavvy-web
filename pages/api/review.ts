/**
 * POST /api/review
 *
 * "Add Review" signal-tap submission for a web place page.
 * Mirrors the insert shape used by ~/Projects/tavvy-review-agent/src/submitter.js
 * and lib/reviews.ts:
 *   1. upsert a place_reviews row — one review per user per place; a repeat
 *      submit UPDATES the existing review (old taps replaced) instead of
 *      inserting a duplicate, so rankings can't be inflated
 *   2. insert place_review_signal_taps rows (review_id, place_id, signal_id, intensity)
 *   3. best-effort recompute of place_signal_aggregates via the
 *      aggregate_place_signals RPC (no DB trigger maintains this rollup)
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

    // 1. Duplicate guard: one review per user per place. If the user already
    //    reviewed this place, UPDATE that review (replace its taps) instead of
    //    inserting a new one — repeat submits must not inflate rankings.
    const { data: existingReviews } = await db
      .from('place_reviews')
      .select('id, created_at')
      .eq('place_id', placeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    let reviewId: string;
    let updated = false;

    if (existingReviews && existingReviews.length > 0) {
      updated = true;
      reviewId = existingReviews[0].id; // keep the oldest review row
      const allIds = existingReviews.map((r: any) => r.id);

      // Replace their taps: delete old taps for all of this user's reviews here
      const { error: delTapsError } = await db
        .from('place_review_signal_taps')
        .delete()
        .in('review_id', allIds);
      if (delTapsError) {
        console.error('[api/review] old taps delete error:', delTapsError);
        return res.status(500).json({ error: 'Failed to update review' });
      }

      // Clean up any duplicate review rows beyond the one we keep
      if (allIds.length > 1) {
        await db.from('place_reviews').delete().in('id', allIds.slice(1));
      }

      // Refresh the kept review's metadata
      await db
        .from('place_reviews')
        .update({ source: 'web_app', status: 'live' })
        .eq('id', reviewId);
    } else {
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
      reviewId = review.id;
    }

    // 2. Insert signal taps.
    const taps = uniqueSignalIds.map((sid) => ({
      review_id: reviewId,
      place_id: placeId,
      signal_id: sid,
      intensity: intensityFor(sid),
    }));

    const { error: tapsError } = await db.from('place_review_signal_taps').insert(taps);
    if (tapsError) {
      console.error('[api/review] signal taps error:', tapsError);
      // Review row exists but taps failed — surface as error so the client can retry.
      return res.status(500).json({ error: 'Failed to save signal taps', reviewId });
    }

    // 3. Recompute place_signal_aggregates atomically DB-side.
    //    aggregate_place_signals(p_place_ids uuid[]) rebuilds the rollup from the
    //    actual taps (no trigger maintains it), replacing the old racy
    //    read-then-upsert. Failure is swallowed — the review already succeeded.
    await refreshAggregates(db, placeId).catch((e) =>
      console.warn('[api/review] aggregate refresh skipped:', e?.message || e)
    );

    return res.status(200).json({ success: true, reviewId, taps: taps.length, updated });
  } catch (err: any) {
    console.error('[api/review] unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Recompute place_signal_aggregates for the place atomically via the
 * aggregate_place_signals(p_place_ids uuid[]) DB function. Verified in prod:
 * no trigger maintains this rollup, and the RPC rebuilds it from the actual
 * taps — correct even after tap deletions (review updates).
 */
async function refreshAggregates(db: SupabaseClient, placeId: string): Promise<void> {
  const { error } = await db.rpc('aggregate_place_signals', { p_place_ids: [placeId] });
  if (error) throw error;
}
