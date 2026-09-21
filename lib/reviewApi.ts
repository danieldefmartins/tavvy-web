/** Authenticated adapter used by both legacy review request shapes. */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateReviewSignals } from './reviewPersistence';
export default async function reviewApi(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { placeId, signals, signalIds, intensities, userId, publicNote, privateNote, reviewId, visitedAt, requestKey } = req.body || {};
  let taps;
  try {
    if (typeof placeId !== 'string' || !placeId.trim()) throw new Error('A place is required.');
    taps = signals ?? (Array.isArray(signalIds) ? signalIds.map(signalId => ({ signalId, intensity: intensities?.[signalId] ?? 1 })) : []);
    validateReviewSignals(taps);
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid review.' }); }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.cookies['sb-access-token'] || req.cookies['supabase-auth-token'];
  if (!token) return res.status(401).json({ error: 'Authentication required', requireLogin: true });
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    if (userId && userId !== user.id) return res.status(403).json({ error: 'User does not match the session.' });
    const { data, error } = await db.rpc('save_place_review_v2', {
      p_place_identifier: placeId, p_signals: taps.map((tap: { signalId: string; intensity: number }) => ({ signal_id: tap.signalId, intensity: tap.intensity })),
      p_public_note: publicNote || null, p_private_note: privateNote || null, p_review_id: reviewId || null, p_mode: reviewId ? 'edit' : 'new_visit', p_visited_at: visitedAt || null,
      p_request_key: requestKey || `api-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, p_source: 'web_app',
    });
    if (error) return res.status(error.code === '22023' ? 400 : 503).json({ error: 'Your review could not be saved. Please try again.', success: false });
    if (typeof data !== 'string' || !/^[0-9a-f-]{36}$/i.test(data)) return res.status(503).json({ error: 'The server did not confirm your review.', success: false });
    return res.status(200).json({ success: true, reviewId: data, taps: taps.length });
  } catch { return res.status(503).json({ error: 'Review saving is temporarily unavailable.', success: false }); }
}
