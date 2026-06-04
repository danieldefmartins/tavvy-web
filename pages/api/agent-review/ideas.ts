/**
 * GET/PATCH /api/agent-review/ideas
 * GET: List ideas, filterable by ?status=pending|approved|rejected|discuss|all
 * PATCH: Update an idea's status and optional response_note
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
    const status = (req.query.status as string) || 'pending';

    let query = supabase
      .from('agent_ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ideas: data });
  }

  if (req.method === 'PATCH') {
    const { id, status, response_note } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'id and status are required' });
    }

    if (!['approved', 'rejected', 'discuss'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved, rejected, or discuss' });
    }

    const update: Record<string, any> = {
      status,
      decided_at: new Date().toISOString(),
    };

    if (response_note !== undefined) {
      update.response_note = response_note;
    }

    const { data, error } = await supabase
      .from('agent_ideas')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ idea: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
