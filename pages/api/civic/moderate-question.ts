/**
 * POST /api/civic/moderate-question
 * Card owner can approve, reject, or answer a civic question
 * 
 * Body: { questionId: string, action: 'approve' | 'reject' | 'answer', answerText?: string }
 * 
 * - Only the card owner can moderate questions
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questionId, action, answerText } = req.body;

  if (!questionId || !action) {
    return res.status(400).json({ error: 'questionId and action are required' });
  }

  if (!['approve', 'reject', 'answer'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, or answer' });
  }

  if (action === 'answer' && (!answerText || answerText.trim().length === 0)) {
    return res.status(400).json({ error: 'answerText is required for answer action' });
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

    // Fetch the question and verify card ownership
    const { data: question, error: fetchError } = await supabase
      .from('civic_questions')
      .select('*, digital_cards!inner(user_id)')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify the authenticated user owns the card
    if (question.digital_cards.user_id !== user.id) {
      return res.status(403).json({ error: 'Only the card owner can moderate questions' });
    }

    // Build update based on action
    let updateData: any = {};

    if (action === 'approve') {
      updateData = { status: 'approved', is_visible: true };
    } else if (action === 'reject') {
      updateData = { status: 'rejected', is_visible: false };
    } else if (action === 'answer') {
      updateData = {
        status: 'approved',
        is_visible: true,
        answer_text: answerText.trim(),
        answered_at: new Date().toISOString(),
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from('civic_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('[Civic Moderate] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update question' });
    }

    return res.status(200).json({ success: true, question: updated });
  } catch (err) {
    console.error('[Civic Moderate] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
