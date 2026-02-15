/**
 * POST /api/ecard-messaging/send
 * Send a message to an e-card owner (creates thread if needed)
 * 
 * Body: { cardId: string, content: string }
 * 
 * - Requires authenticated Tavvy user
 * - Auto-creates thread on first message
 * - If sender is in spam list, thread goes to spam folder automatically
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId, content } = req.body;

  if (!cardId || !content || content.trim().length === 0) {
    return res.status(400).json({ error: 'cardId and content are required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message must be 2000 characters or less' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Authentication required', requireLogin: true });

  try {
    const user = await getAuthUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid session', requireLogin: true });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the card and its owner
    const { data: card, error: cardError } = await supabase
      .from('digital_cards')
      .select('id, user_id, full_name')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Cannot message yourself
    if (card.user_id === user.id) {
      return res.status(400).json({ error: 'Cannot send a message to your own card' });
    }

    // Check if sender is in spam list
    const { data: spamEntry } = await supabase
      .from('ecard_spam_senders')
      .select('id')
      .eq('card_id', cardId)
      .eq('blocked_user_id', user.id)
      .single();

    const folder = spamEntry ? 'spam' : 'primary';

    // Find or create thread
    let { data: thread } = await supabase
      .from('ecard_threads')
      .select('*')
      .eq('card_id', cardId)
      .eq('sender_id', user.id)
      .single();

    if (!thread) {
      const { data: newThread, error: threadError } = await supabase
        .from('ecard_threads')
        .insert({
          card_id: cardId,
          card_owner_id: card.user_id,
          sender_id: user.id,
          folder,
          owner_unread: 1,
          sender_unread: 0,
          last_message_preview: content.trim().substring(0, 100),
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (threadError) {
        console.error('[ECard Messaging] Thread create error:', threadError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }
      thread = newThread;
    } else {
      // Update existing thread
      await supabase
        .from('ecard_threads')
        .update({
          folder: spamEntry ? 'spam' : thread.folder, // Keep existing folder unless newly spammed
          owner_unread: (thread.owner_unread || 0) + 1,
          last_message_preview: content.trim().substring(0, 100),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.id);
    }

    // Insert the message
    const { data: message, error: msgError } = await supabase
      .from('ecard_messages')
      .insert({
        thread_id: thread.id,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('[ECard Messaging] Message insert error:', msgError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({
      success: true,
      message: {
        id: message.id,
        threadId: thread.id,
        content: message.content,
        createdAt: message.created_at,
      },
    });
  } catch (err) {
    console.error('[ECard Messaging] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
