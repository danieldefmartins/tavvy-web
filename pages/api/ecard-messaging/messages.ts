/**
 * GET /api/ecard-messaging/messages?threadId=xxx
 *   Fetch messages in a thread (for both participants)
 * 
 * POST /api/ecard-messaging/messages
 *   Reply to a thread (for both participants)
 *   Body: { threadId: string, content: string }
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

  // GET — Fetch messages in a thread
  if (req.method === 'GET') {
    const { threadId } = req.query;
    if (!threadId || typeof threadId !== 'string') {
      return res.status(400).json({ error: 'threadId is required' });
    }

    // Verify user is a participant
    const { data: thread } = await supabase
      .from('ecard_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (!thread || (thread.card_owner_id !== user.id && thread.sender_id !== user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch messages
    const { data: messages, error: fetchError } = await supabase
      .from('ecard_messages')
      .select(`
        id, sender_id, content, is_read, read_at, created_at,
        sender:users!sender_id (id, full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[ECard Messages] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Mark messages as read for the current user
    const isOwner = thread.card_owner_id === user.id;
    const unreadMessages = (messages || []).filter(
      (m: any) => m.sender_id !== user.id && !m.is_read
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m: any) => m.id);
      await supabase
        .from('ecard_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      // Reset unread count
      if (isOwner) {
        await supabase
          .from('ecard_threads')
          .update({ owner_unread: 0 })
          .eq('id', threadId);
      } else {
        await supabase
          .from('ecard_threads')
          .update({ sender_unread: 0 })
          .eq('id', threadId);
      }
    }

    return res.status(200).json({
      success: true,
      thread: {
        id: thread.id,
        cardId: thread.card_id,
        isOwner,
      },
      messages: (messages || []).map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender?.full_name || 'Unknown',
        senderAvatar: m.sender?.avatar_url,
        content: m.content,
        isRead: m.is_read,
        isMine: m.sender_id === user.id,
        createdAt: m.created_at,
      })),
    });
  }

  // POST — Reply to a thread
  if (req.method === 'POST') {
    const { threadId, content } = req.body;

    if (!threadId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'threadId and content are required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message must be 2000 characters or less' });
    }

    // Verify user is a participant
    const { data: thread } = await supabase
      .from('ecard_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (!thread || (thread.card_owner_id !== user.id && thread.sender_id !== user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('ecard_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('[ECard Messages] Insert error:', msgError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update thread
    const isOwner = thread.card_owner_id === user.id;
    const updateData: any = {
      last_message_preview: content.trim().substring(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isOwner) {
      updateData.sender_unread = (thread.sender_unread || 0) + 1;
    } else {
      updateData.owner_unread = (thread.owner_unread || 0) + 1;
    }

    await supabase
      .from('ecard_threads')
      .update(updateData)
      .eq('id', threadId);

    return res.status(200).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.created_at,
        isMine: true,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
