/**
 * GET /api/civic/recommendations?cardId=xxx
 *   Fetch active recommendations for a civic card (public)
 * 
 * POST /api/civic/recommendations
 *   Add a recommendation (card owner only)
 *   Body: { cardId: string, recommendedCardSlug: string, endorsementNote?: string }
 * 
 * DELETE /api/civic/recommendations
 *   Remove a recommendation (card owner only)
 *   Body: { recommendationId: string }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function getAuthUser(token: string) {
  const { data: { user }, error } = await createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  ).auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET — Public: fetch recommendations for a card
  if (req.method === 'GET') {
    const { cardId } = req.query;
    if (!cardId || typeof cardId !== 'string') {
      return res.status(400).json({ error: 'cardId is required' });
    }

    const { data, error } = await supabase
      .from('civic_recommendations')
      .select(`
        id,
        endorsement_note,
        sort_order,
        recommended_card:digital_cards!recommended_card_id (
          id, slug, full_name, title, profile_photo_url,
          party_name, office_running_for, region
        )
      `)
      .eq('card_id', cardId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Civic Recommendations] Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }

    return res.status(200).json({
      success: true,
      recommendations: (data || []).map((r: any) => ({
        id: r.id,
        endorsementNote: r.endorsement_note,
        sortOrder: r.sort_order,
        card: r.recommended_card ? {
          id: r.recommended_card.id,
          slug: r.recommended_card.slug,
          fullName: r.recommended_card.full_name,
          title: r.recommended_card.title,
          profilePhotoUrl: r.recommended_card.profile_photo_url,
          partyName: r.recommended_card.party_name,
          officeRunningFor: r.recommended_card.office_running_for,
          region: r.recommended_card.region,
        } : null,
      })),
    });
  }

  // POST — Add recommendation (card owner only)
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const user = await getAuthUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const { cardId, recommendedCardSlug, endorsementNote } = req.body;
    if (!cardId || !recommendedCardSlug) {
      return res.status(400).json({ error: 'cardId and recommendedCardSlug are required' });
    }

    // Verify card ownership
    const { data: card } = await supabase
      .from('digital_cards')
      .select('id, user_id')
      .eq('id', cardId)
      .single();

    if (!card || card.user_id !== user.id) {
      return res.status(403).json({ error: 'Only the card owner can add recommendations' });
    }

    // Find the recommended card by slug
    const { data: recommendedCard } = await supabase
      .from('digital_cards')
      .select('id, slug, full_name, title, profile_photo_url, party_name, office_running_for, region, template_id')
      .eq('slug', recommendedCardSlug)
      .eq('is_active', true)
      .single();

    if (!recommendedCard) {
      return res.status(404).json({ error: 'Recommended card not found' });
    }

    // Get current max sort_order
    const { data: maxOrder } = await supabase
      .from('civic_recommendations')
      .select('sort_order')
      .eq('card_id', cardId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order || 0) + 1;

    const { data: rec, error: insertError } = await supabase
      .from('civic_recommendations')
      .insert({
        card_id: cardId,
        recommended_card_id: recommendedCard.id,
        endorsement_note: endorsementNote?.trim() || null,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'This person is already in your recommendations' });
      }
      console.error('[Civic Recommendations] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to add recommendation' });
    }

    return res.status(200).json({
      success: true,
      recommendation: {
        id: rec.id,
        card: {
          id: recommendedCard.id,
          slug: recommendedCard.slug,
          fullName: recommendedCard.full_name,
          title: recommendedCard.title,
          profilePhotoUrl: recommendedCard.profile_photo_url,
          partyName: recommendedCard.party_name,
          officeRunningFor: recommendedCard.office_running_for,
          region: recommendedCard.region,
        },
      },
    });
  }

  // DELETE — Remove recommendation (card owner only)
  if (req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const user = await getAuthUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const { recommendationId } = req.body;
    if (!recommendationId) {
      return res.status(400).json({ error: 'recommendationId is required' });
    }

    // Verify ownership via join
    const { data: rec } = await supabase
      .from('civic_recommendations')
      .select('id, card_id, digital_cards!card_id(user_id)')
      .eq('id', recommendationId)
      .single();

    if (!rec || (rec as any).digital_cards?.user_id !== user.id) {
      return res.status(403).json({ error: 'Only the card owner can remove recommendations' });
    }

    await supabase
      .from('civic_recommendations')
      .delete()
      .eq('id', recommendationId);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
