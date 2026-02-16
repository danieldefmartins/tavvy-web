/**
 * IP Geolocation utility
 * Uses ip-api.com (free, no key needed, 45 req/min)
 * Falls back gracefully if the service is unavailable
 */

export interface GeoData {
  ip: string;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
}

/**
 * Extract the client IP from a Next.js API request
 */
export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Resolve an IP address to geo data
 * Uses ip-api.com free tier (no API key needed)
 */
export async function resolveIpGeo(ip: string): Promise<GeoData> {
  const result: GeoData = {
    ip,
    city: null,
    state: null,
    country: null,
    zip: null,
  };

  // Skip private/local IPs
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return result;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,zip`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        result.city = data.city || null;
        result.state = data.regionName || null;
        result.country = data.country || null;
        result.zip = data.zip || null;
      }
    }
  } catch (err) {
    // Silently fail — geo data is supplementary, not critical
    console.warn('IP geo lookup failed:', err);
  }

  return result;
}
