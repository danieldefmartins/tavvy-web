/**
 * POST /api/agent-review/auth
 * Simple password auth for the agent review dashboard.
 * Sets an httpOnly cookie that lasts 30 days.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const PASSWORD = process.env.AGENT_DASHBOARD_PASSWORD || '';
// Fail closed: no fallback secret. Handlers check for empty SECRET below.
const SECRET = process.env.AGENT_DASHBOARD_SECRET || '';

// --- Simple in-memory rate limiting (5 attempts / minute per IP) ---
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const attempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    // Opportunistic cleanup to avoid unbounded growth
    if (attempts.size > 1000) {
      for (const [key, val] of attempts) {
        if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) attempts.delete(key);
      }
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing constant, then fail
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

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
    if (!SECRET) {
      console.error('[agent-review/auth] AGENT_DASHBOARD_SECRET is not set — rejecting token');
      return false;
    }
    const [data, sig] = token.split('.');
    if (!data || !sig) return false;
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (!timingSafeEqualStr(sig, expected)) return false;
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

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  }

  const { password } = req.body;

  if (!PASSWORD) {
    return res.status(500).json({ error: 'Dashboard password not configured' });
  }

  if (!SECRET) {
    console.error('[agent-review/auth] AGENT_DASHBOARD_SECRET is not set — refusing to issue tokens');
    return res.status(500).json({ error: 'Dashboard secret not configured' });
  }

  if (typeof password !== 'string' || !timingSafeEqualStr(password, PASSWORD)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = createToken();

  res.setHeader('Set-Cookie', [
    `agent_review_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  ]);

  return res.status(200).json({ success: true });
}
