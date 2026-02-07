/**
 * POST /api/ecard/endorse
 * Submit an endorsement for an eCard
 * 
 * Body: { cardId, cardOwnerId, signals: string[], note?: string }
 * 
 * - Requires authenticated user (checks Supabase auth)
 * - If not authenticated, returns { requireLogin: true }
 * - Creates endorsement record + signal taps
 * - Updates tap_count on the card
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId, cardOwnerId, signals, note } = req.body;

  if (!cardId || !signals || !Array.isArray(signals) || signals.length === 0) {
    return res.status(400).json({ error: 'cardId and at least one signal are required' });
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
    const { data: { user }, error: authError } = await createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
      .auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    }

    // Check if user already endorsed this card
    const { data: existing } = await supabase
      .from('ecard_endorsements')
      .select('id')
      .eq('card_id', cardId)
      .eq('endorser_id', user.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'You have already endorsed this card' });
    }

    // Get the card owner ID from the card
    const { data: cardData } = await supabase
      .from('digital_cards')
      .select('user_id')
      .eq('id', cardId)
      .single();

    if (!cardData) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Prevent self-endorsement
    if (cardData.user_id === user.id) {
      return res.status(400).json({ error: 'You cannot endorse your own card' });
    }

    // Create the endorsement
    const { data: endorsement, error: insertError } = await supabase
      .from('ecard_endorsements')
      .insert({
        card_id: cardId,
        card_owner_id: cardData.user_id,
        endorser_id: user.id,
        public_note: note || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Endorsement insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create endorsement' });
    }

    // Create signal taps
    const signalRows = signals.map((signalId: string) => ({
      endorsement_id: endorsement.id,
      card_id: cardId,
      card_owner_id: cardData.user_id,
      signal_id: signalId,
      endorser_id: user.id,
    }));

    const { error: signalError } = await supabase
      .from('ecard_endorsement_signals')
      .insert(signalRows);

    if (signalError) {
      console.error('Signal insert error:', signalError);
      // Don't fail the whole request, endorsement was created
    }

    // Update tap count on the card
    await supabase
      .from('digital_cards')
      .update({ tap_count: (await supabase.from('digital_cards').select('tap_count').eq('id', cardId).single()).data?.tap_count + 1 || 1 })
      .eq('id', cardId);

    return res.status(200).json({ success: true, endorsementId: endorsement.id });
  } catch (err) {
    console.error('Endorsement API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
