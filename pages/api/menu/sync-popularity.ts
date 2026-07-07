/**
 * API Route: POST /api/menu/sync-popularity
 *
 * Runs the auto-popularity logic for a given place.
 * Body: { place_id: string }
 *
 * Requires an authenticated Supabase session. Per-place cooldown of 1 minute
 * prevents write-amplification from repeated calls.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { syncPopularity } from '../../../lib/menuPopularity';

// In-memory per-place cooldown: at most one sync per place per minute
const COOLDOWN_MS = 60 * 1000;
const lastSync = new Map<string, number>();

async function getAuthUser(token: string) {
  const { data: { user }, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  ).auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { place_id } = req.body;

  if (!place_id || typeof place_id !== 'string') {
    return res.status(400).json({ error: 'place_id is required' });
  }

  // Require any authenticated Supabase user
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const user = await getAuthUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  // Per-place cooldown
  const now = Date.now();
  const last = lastSync.get(place_id);
  if (last && now - last < COOLDOWN_MS) {
    return res.status(429).json({ error: 'Popularity sync already ran recently for this place' });
  }
  lastSync.set(place_id, now);
  if (lastSync.size > 5000) {
    for (const [key, ts] of lastSync) {
      if (now - ts > COOLDOWN_MS) lastSync.delete(key);
    }
  }

  try {
    const result = await syncPopularity(place_id);
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('[sync-popularity] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
