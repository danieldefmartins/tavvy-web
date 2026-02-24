/**
 * GET /api/civic/pending-questions?cardId=xxx
 * Fetch all pending questions for a card (for card owner moderation)
 * 
 * - Only the card owner can view pending questions
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId } = req.query;

  if (!cardId || typeof cardId !== 'string') {
    return res.status(400).json({ error: 'cardId is required' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', requireLogin: true });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    ).auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    }

    // Verify card ownership
    const { data: card, error: cardError } = await supabase
      .from('digital_cards')
      .select('id, user_id')
      .eq('id', cardId)
      .single();

    if (cardError || !card || card.user_id !== user.id) {
      return res.status(403).json({ error: 'Only the card owner can view pending questions' });
    }

    // Fetch pending questions (without user join — profiles table is separate from users)
    const { data: questions, error: fetchError } = await supabase
      .from('civic_questions')
      .select('*')
      .eq('card_id', cardId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Pending Questions] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Batch-fetch submitter profiles from the profiles table
    const userIds = [...new Set((questions || []).map((q: any) => q.user_id).filter(Boolean))];
    let profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      for (const p of profiles || []) {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      }
    }

    return res.status(200).json({
      success: true,
      questions: (questions || []).map((q: any) => {
        const profile = profileMap[q.user_id];
        return {
          id: q.id,
          questionText: q.question_text,
          createdAt: q.created_at,
          submitter: {
            id: q.user_id,
            name: profile?.display_name || 'Anonymous',
            avatar: profile?.avatar_url || null,
          },
        };
      }),
    });
  } catch (err) {
    console.error('[Pending Questions] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
