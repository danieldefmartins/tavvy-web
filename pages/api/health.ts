import type { NextApiRequest, NextApiResponse } from 'next';

/** Readiness probe for the web process; does not depend on third-party services. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ status: 'ok', service: 'tavvy-web' });
}
