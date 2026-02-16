/**
 * POST /api/civic/react
 * Submit or update a reaction on a civic proposal
 * 
 * Body: { proposalId: string, reactionType: 'support' | 'needs_improvement' | 'disagree' }
 * 
 * - Requires authenticated user
 * - One reaction per user per proposal (upsert)
 * - Returns updated reaction counts
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

  const { proposalId, reactionType } = req.body;

  if (!proposalId || !reactionType) {
    return res.status(400).json({ error: 'proposalId and reactionType are required' });
  }

  if (!['support', 'needs_improvement', 'disagree'].includes(reactionType)) {
    return res.status(400).json({ error: 'Invalid reactionType' });
  }

  // Check for auth token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];

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

    // Get voter's ZIP code from profile
    const { data: voterProfile } = await supabase
      .from('profiles')
      .select('zip_code')
      .eq('user_id', user.id)
      .single();

    // Resolve IP geolocation
    const clientIp = getClientIp(req);
    const geo = await resolveIpGeo(clientIp);

    // Upsert the reaction with geo data (one per user per proposal)
    const { error: upsertError } = await supabase
      .from('civic_reactions')
      .upsert(
        {
          proposal_id: proposalId,
          user_id: user.id,
          reaction_type: reactionType,
          voter_zip: voterProfile?.zip_code || null,
          ip_address: geo.ip,
          ip_city: geo.city,
          ip_state: geo.state,
          ip_country: geo.country,
          ip_zip: geo.zip,
        },
        { onConflict: 'proposal_id,user_id' }
      );

    if (upsertError) {
      console.error('[Civic React] Upsert error:', upsertError);
      return res.status(500).json({ error: 'Failed to submit reaction' });
    }

    // Get updated counts
    const { data: counts } = await supabase
      .from('civic_reactions')
      .select('reaction_type')
      .eq('proposal_id', proposalId);

    const reactionCounts = {
      support: 0,
      needs_improvement: 0,
      disagree: 0,
    };

    (counts || []).forEach((r: any) => {
      if (r.reaction_type in reactionCounts) {
        reactionCounts[r.reaction_type as keyof typeof reactionCounts]++;
      }
    });

    return res.status(200).json({ success: true, reactionCounts });
  } catch (err) {
    console.error('[Civic React] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
