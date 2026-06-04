/**
 * GET/POST /api/agent-review/discussions
 * GET: Fetch discussion thread for an idea (?idea_id=xxx)
 * POST: Add a message to a discussion thread
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function isAuthed(req: NextApiRequest): boolean {
  const token = req.cookies.agent_review_session;
  return !!token && verifyToken(token);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    const ideaId = req.query.idea_id as string;
    if (!ideaId) return res.status(400).json({ error: 'idea_id required' });

    const { data, error } = await supabase
      .from('idea_discussions')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ messages: data });
  }

  if (req.method === 'POST') {
    const { idea_id, message } = req.body;
    if (!idea_id || !message?.trim()) {
      return res.status(400).json({ error: 'idea_id and message required' });
    }

    const { data, error } = await supabase
      .from('idea_discussions')
      .insert({ idea_id, sender: 'daniel', message: message.trim() })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
