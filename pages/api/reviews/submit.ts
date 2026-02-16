/**
 * POST /api/reviews/submit
 * Server-side review submission with IP geolocation tracking
 * 
 * Body: { placeId, placeName, signals: [{signalId, intensity}], publicNote?, privateNote? }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getClientIp, resolveIpGeo } from '../../../lib/geoip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { placeId, placeName, signals, publicNote, privateNote } = req.body;

  if (!placeId || !signals || !Array.isArray(signals)) {
    return res.status(400).json({ error: 'placeId and signals are required' });
  }

  // Check for auth token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'] || req.cookies['supabase-auth-token'];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', requireLogin: true });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    ).auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    }

    // Get reviewer's ZIP code from profile
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('zip_code')
      .eq('user_id', user.id)
      .single();

    // Resolve IP geolocation
    const clientIp = getClientIp(req);
    const geo = await resolveIpGeo(clientIp);

    // Resolve place ID if needed (short IDs need lookup)
    let targetPlaceId = placeId;
    if (placeId.length !== 36) {
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('google_place_id', placeId)
        .single();

      if (existingPlace) {
        targetPlaceId = existingPlace.id;
      } else {
        const { data: newPlace, error: placeError } = await supabase
          .from('places')
          .insert({ google_place_id: placeId, name: placeName || 'Unknown Place' })
          .select('id')
          .single();
        if (placeError || !newPlace) {
          return res.status(500).json({ error: 'Failed to resolve place' });
        }
        targetPlaceId = newPlace.id;
      }
    }

    // Create the review with geo data
    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .insert({
        place_id: targetPlaceId,
        user_id: user.id,
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        source: 'web_app',
        status: 'live',
        reviewer_zip: reviewerProfile?.zip_code || null,
        ip_address: geo.ip,
        ip_city: geo.city,
        ip_state: geo.state,
        ip_country: geo.country,
        ip_zip: geo.zip,
      })
      .select('id')
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    // Insert signal taps
    if (signals.length > 0) {
      const signalTaps = signals.map((signal: any) => ({
        review_id: review.id,
        place_id: targetPlaceId,
        signal_id: signal.signalId,
        intensity: signal.intensity || 1,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Signal taps error:', tapsError);
      }
    }

    return res.status(200).json({ success: true, reviewId: review.id });
  } catch (err) {
    console.error('Review submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
