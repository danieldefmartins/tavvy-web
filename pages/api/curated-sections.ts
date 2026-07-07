import { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/curated-sections
 *
 * Previously returned hardcoded mock sections in production. There is no
 * curated-sections table/CMS source yet, so this returns an empty list —
 * never fake data. Populate from a real source (e.g. a Supabase
 * curated_sections table) when curation ships.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json([]);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
