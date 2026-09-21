import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientIp, resolveIpGeo } from '../../../lib/geoip';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'private, no-store');
  const location = await resolveIpGeo(getClientIp(req));
  return res.status(200).json({ state: location.country === 'United States' ? location.state : null });
}
