/**
 * POST /api/agent-review/auth
 * Simple password auth for the agent review dashboard.
 * Sets an httpOnly cookie that lasts 30 days.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const PASSWORD = process.env.AGENT_DASHBOARD_PASSWORD || '';
const SECRET = process.env.AGENT_DASHBOARD_SECRET || 'tavvy-agent-default-secret-change-me';

function createToken(): string {
  const payload = {
    role: 'agent-admin',
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string): boolean {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return false;
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expected) return false;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!PASSWORD) {
    return res.status(500).json({ error: 'Dashboard password not configured' });
  }

  if (password !== PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = createToken();

  res.setHeader('Set-Cookie', [
    `agent_review_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  ]);

  return res.status(200).json({ success: true });
}
