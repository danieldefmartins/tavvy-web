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
import { getClientIp, resolveIpGeo } from '../../../lib/geoip';

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

    // Get the card owner ID and place_id from the card
    const { data: cardData } = await supabase
      .from('digital_cards')
      .select('user_id, place_id, professional_category')
      .eq('id', cardId)
      .single();

    if (!cardData) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Prevent self-endorsement
    if (cardData.user_id === user.id) {
      return res.status(400).json({ error: 'You cannot endorse your own card' });
    }

    // Get endorser's ZIP code from profile
    const { data: endorserProfile } = await supabase
      .from('profiles')
      .select('zip_code')
      .eq('user_id', user.id)
      .single();

    // Resolve IP geolocation (non-blocking, best-effort)
    const clientIp = getClientIp(req);
    const geo = await resolveIpGeo(clientIp);

    // Create the endorsement with geo data (ZIP code is optional)
    const { data: endorsement, error: insertError } = await supabase
      .from('ecard_endorsements')
      .insert({
        card_id: cardId,
        card_owner_id: cardData.user_id,
        endorser_id: user.id,
        public_note: note || null,
        endorser_zip: endorserProfile?.zip_code || null,
        ip_address: geo.ip,
        ip_city: geo.city,
        ip_state: geo.state,
        ip_country: geo.country,
        ip_zip: geo.zip,
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
    }));

    const { error: signalError } = await supabase
      .from('ecard_endorsement_signals')
      .insert(signalRows);

    if (signalError) {
      console.error('Signal insert error:', signalError);
      // Don't fail the whole request, endorsement was created
    }

    // Update tap count on the card (proper read-then-increment)
    const { data: currentCard } = await supabase
      .from('digital_cards')
      .select('tap_count')
      .eq('id', cardId)
      .single();
    const newTapCount = (currentCard?.tap_count || 0) + 1;
    await supabase
      .from('digital_cards')
      .update({ tap_count: newTapCount })
      .eq('id', cardId);

    // Endorsements remain in their own tables; a card endorsement is not a place visit.

    // These are public totals: the admin writer must not bypass staff visibility RLS.
    const publicReader = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {auth:{persistSession:false,autoRefreshToken:false}});
    let newEndorsementCount: number | null = null;
    let updatedTags: {label:string;emoji:string;count:number}[] | null = null;
    let evidenceStatus: 'ready'|'unavailable' = 'ready';
    try {
    // Get the actual endorsement count (each signal tap = +1)
    // For business cards with a place, combine both sources

    if (cardData.place_id) {
      // Combined: ecard endorsement signals + place review signal taps (excluding ecard-sourced to avoid double count)
      const { count: ecardCount, error: ecardCountError } = await publicReader
        .from('ecard_endorsement_signals')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', cardId);

      const { count: placeCount, error: placeCountError } = await publicReader
        .from('place_review_signal_taps')
        .select('*, place_reviews!inner(source,status)', { count: 'exact', head: true })
        .eq('place_id', cardData.place_id)
        .neq('place_reviews.source', 'ecard_endorsement').eq('place_reviews.status','live');

      if(ecardCountError||placeCountError||!Number.isInteger(ecardCount)||!Number.isInteger(placeCount))throw new Error('Public totals unavailable');
      newEndorsementCount = (ecardCount || 0) + (placeCount || 0);
    } else {
      const { count, error: countError } = await publicReader
        .from('ecard_endorsement_signals')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', cardId);
      if(countError||!Number.isInteger(count))throw new Error('Public totals unavailable');
      newEndorsementCount = count || 0;
    }

    // Get updated top endorsement tags — combine both sources for business cards
    const tagCounts: Record<string, { label: string; emoji: string; count: number }> = {};

    // Source 1: ecard endorsement signals
    const { data: ecardSignalTaps, error: ecardTagsError } = await publicReader
      .from('ecard_endorsement_signals')
      .select('signal_id, review_items(label, icon_emoji)')
      .eq('card_id', cardId);

    if(ecardTagsError)throw new Error('Public tags unavailable');
    (ecardSignalTaps || []).forEach((tap: any) => {
      const ri = tap.review_items;
      if (ri) {
        if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '⭐', count: 0 };
        tagCounts[tap.signal_id].count++;
      }
    });

    // Source 2: place review signal taps (only non-ecard-sourced to avoid double count)
    if (cardData.place_id) {
      const { data: placeSignalTaps, error: placeTagsError } = await publicReader
        .from('place_review_signal_taps')
        .select('signal_id, review_items(label, icon_emoji), place_reviews!inner(source,status)')
        .eq('place_id', cardData.place_id)
        .neq('place_reviews.source', 'ecard_endorsement').eq('place_reviews.status','live');

      if(placeTagsError)throw new Error('Public tags unavailable');
      (placeSignalTaps || []).forEach((tap: any) => {
        const ri = tap.review_items;
        if (ri) {
          if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '⭐', count: 0 };
          tagCounts[tap.signal_id].count++;
        }
      });
    }

    updatedTags = Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 8);

    } catch {
      // The endorsement is already saved. Do not send a retryable failure or invent totals.
      evidenceStatus='unavailable';newEndorsementCount=null;updatedTags=null;
    }

    return res.status(200).json({
      success: true,
      endorsementId: endorsement.id,
      endorsementCount: newEndorsementCount,
      evidenceStatus,
      topEndorsementTags: updatedTags,
    });
  } catch (err) {
    console.error('Endorsement API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
