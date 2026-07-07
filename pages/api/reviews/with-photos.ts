import { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/reviews/with-photos
 *
 * Previously returned hardcoded mock reviews in production. There is no
 * photo-bearing review pipeline wired up yet, so this returns an empty list —
 * never fake data. When review photos ship (place_reviews joined to
 * place_photos / review photo uploads), query them here.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json([]);
}
