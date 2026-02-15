/**
 * POST /api/civic/question
 * Submit a question to a civic card candidate
 * 
 * Body: { cardId: string, questionText: string }
 * 
 * - Requires authenticated user
 * - Max 500 characters
 * - Question starts as 'pending' — only visible after card owner approves
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId, questionText } = req.body;

  if (!cardId || !questionText || questionText.trim().length === 0) {
    return res.status(400).json({ error: 'cardId and questionText are required' });
  }

  if (questionText.length > 500) {
    return res.status(400).json({ error: 'Question must be 500 characters or less' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', requireLogin: true });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    ).auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session', requireLogin: true });
    }

    const { data: question, error: insertError } = await supabase
      .from('civic_questions')
      .insert({
        card_id: cardId,
        user_id: user.id,
        question_text: questionText.trim(),
        is_visible: false,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Civic Question] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to submit question' });
    }

    return res.status(200).json({ success: true, question, pending: true });
  } catch (err) {
    console.error('[Civic Question] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
