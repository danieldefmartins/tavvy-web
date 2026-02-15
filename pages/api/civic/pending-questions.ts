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

    // Fetch pending questions with submitter info
    const { data: questions, error: fetchError } = await supabase
      .from('civic_questions')
      .select('*, users!inner(id, full_name, avatar_url)')
      .eq('card_id', cardId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Pending Questions] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    return res.status(200).json({
      success: true,
      questions: (questions || []).map((q: any) => ({
        id: q.id,
        questionText: q.question_text,
        createdAt: q.created_at,
        submitter: {
          id: q.users?.id,
          name: q.users?.full_name || 'Anonymous',
          avatar: q.users?.avatar_url,
        },
      })),
    });
  } catch (err) {
    console.error('[Pending Questions] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
