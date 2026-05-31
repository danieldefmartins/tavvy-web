/**
 * API Route: POST /api/menu/sync-popularity
 *
 * Runs the auto-popularity logic for a given place.
 * Body: { place_id: string }
 *
 * Can be called periodically or on menu load.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { syncPopularity } from '../../../lib/menuPopularity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { place_id } = req.body;

  if (!place_id || typeof place_id !== 'string') {
    return res.status(400).json({ error: 'place_id is required' });
  }

  try {
    const result = await syncPopularity(place_id);
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('[sync-popularity] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
