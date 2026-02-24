/**
 * GET /api/ecard-messaging/threads?cardId=xxx&folder=primary|spam
 * List message threads for a card owner's inbox
 * 
 * - Only the card owner can view threads
 * - Supports folder filtering (primary/spam)
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId, folder = 'primary' } = req.query;

  if (!cardId || typeof cardId !== 'string') {
    return res.status(400).json({ error: 'cardId is required' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const user = await getAuthUser(token);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify card ownership
    const { data: card } = await supabase
      .from('digital_cards')
      .select('id, user_id')
      .eq('id', cardId)
      .single();

    if (!card || card.user_id !== user.id) {
      return res.status(403).json({ error: 'Only the card owner can view threads' });
    }

    // Fetch threads (without user join — profiles table is separate from users)
    const { data: threads, error: fetchError } = await supabase
      .from('ecard_threads')
      .select('id, sender_id, folder, owner_unread, last_message_preview, last_message_at, created_at')
      .eq('card_id', cardId)
      .eq('folder', folder as string)
      .order('last_message_at', { ascending: false });

    if (fetchError) {
      console.error('[ECard Threads] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch threads' });
    }

    // Batch-fetch sender profiles from the profiles table
    const senderIds = [...new Set((threads || []).map((t: any) => t.sender_id).filter(Boolean))];
    let profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);
      for (const p of profiles || []) {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      }
    }

    // Also get counts for both folders
    const { count: primaryCount } = await supabase
      .from('ecard_threads')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId)
      .eq('folder', 'primary');

    const { count: spamCount } = await supabase
      .from('ecard_threads')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId)
      .eq('folder', 'spam');

    const { data: unreadData } = await supabase
      .from('ecard_threads')
      .select('folder, owner_unread')
      .eq('card_id', cardId)
      .gt('owner_unread', 0);

    const primaryUnread = (unreadData || []).filter(t => t.folder === 'primary').reduce((sum, t) => sum + t.owner_unread, 0);
    const spamUnread = (unreadData || []).filter(t => t.folder === 'spam').reduce((sum, t) => sum + t.owner_unread, 0);

    return res.status(200).json({
      success: true,
      threads: (threads || []).map((t: any) => {
        const profile = profileMap[t.sender_id];
        return {
          id: t.id,
          folder: t.folder,
          unreadCount: t.owner_unread || 0,
          lastMessagePreview: t.last_message_preview,
          lastMessageAt: t.last_message_at,
          createdAt: t.created_at,
          sender: {
            id: t.sender_id,
            name: profile?.display_name || 'Unknown',
            avatar: profile?.avatar_url || null,
          },
        };
      }),
      counts: {
        primary: primaryCount || 0,
        spam: spamCount || 0,
        primaryUnread,
        spamUnread,
      },
    });
  } catch (err) {
    console.error('[ECard Threads] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
