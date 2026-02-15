/**
 * POST /api/ecard-messaging/spam
 * Move a thread to spam and block the sender
 * Body: { threadId: string }
 * 
 * DELETE /api/ecard-messaging/spam
 * Unblock a sender and move thread back to primary
 * Body: { threadId: string }
 * 
 * - Only the card owner can manage spam
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
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const user = await getAuthUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { threadId } = req.body;
  if (!threadId) {
    return res.status(400).json({ error: 'threadId is required' });
  }

  // Verify thread exists and user is the card owner
  const { data: thread } = await supabase
    .from('ecard_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (!thread || thread.card_owner_id !== user.id) {
    return res.status(403).json({ error: 'Only the card owner can manage spam' });
  }

  // POST — Mark as spam
  if (req.method === 'POST') {
    try {
      // Move thread to spam
      await supabase
        .from('ecard_threads')
        .update({ folder: 'spam', updated_at: new Date().toISOString() })
        .eq('id', threadId);

      // Add sender to spam list (ignore if already exists)
      await supabase
        .from('ecard_spam_senders')
        .upsert({
          card_id: thread.card_id,
          blocked_user_id: thread.sender_id,
          blocked_by: user.id,
        }, { onConflict: 'card_id,blocked_user_id' });

      return res.status(200).json({ success: true, folder: 'spam' });
    } catch (err) {
      console.error('[ECard Spam] Error marking spam:', err);
      return res.status(500).json({ error: 'Failed to mark as spam' });
    }
  }

  // DELETE — Unmark spam
  if (req.method === 'DELETE') {
    try {
      // Move thread back to primary
      await supabase
        .from('ecard_threads')
        .update({ folder: 'primary', updated_at: new Date().toISOString() })
        .eq('id', threadId);

      // Remove sender from spam list
      await supabase
        .from('ecard_spam_senders')
        .delete()
        .eq('card_id', thread.card_id)
        .eq('blocked_user_id', thread.sender_id);

      return res.status(200).json({ success: true, folder: 'primary' });
    } catch (err) {
      console.error('[ECard Spam] Error unmarking spam:', err);
      return res.status(500).json({ error: 'Failed to unmark spam' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
