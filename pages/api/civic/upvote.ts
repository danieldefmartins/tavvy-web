/**
 * POST /api/civic/upvote
 * Upvote a civic question
 * 
 * Body: { questionId: string }
 * 
 * - Requires authenticated user
 * - One upvote per user per question
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questionId } = req.body;

  if (!questionId) {
    return res.status(400).json({ error: 'questionId is required' });
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

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('civic_question_upvotes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Remove upvote (toggle)
      await supabase.from('civic_question_upvotes').delete().eq('id', existing.id);
      // Decrement count
      try {
        await supabase.rpc('decrement_question_upvotes', { q_id: questionId });
      } catch {
        // Fallback: manual update handled below
      }

      // Get updated count
      const { count } = await supabase
        .from('civic_question_upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);

      await supabase
        .from('civic_questions')
        .update({ upvote_count: count || 0 })
        .eq('id', questionId);

      return res.status(200).json({ success: true, upvoted: false, upvoteCount: count || 0 });
    }

    // Add upvote
    const { error: insertError } = await supabase
      .from('civic_question_upvotes')
      .insert({ question_id: questionId, user_id: user.id });

    if (insertError) {
      console.error('[Civic Upvote] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to upvote' });
    }

    // Get updated count
    const { count } = await supabase
      .from('civic_question_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId);

    await supabase
      .from('civic_questions')
      .update({ upvote_count: count || 0 })
      .eq('id', questionId);

    return res.status(200).json({ success: true, upvoted: true, upvoteCount: count || 0 });
  } catch (err) {
    console.error('[Civic Upvote] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
