import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Conversation, Message, listConversations, loadMessages, insertMessage, mergeMessages, MESSAGE_TABLE, MESSAGE_SCOPE_COLUMN } from '../lib/tavvyChat';
export function useTavvyChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scope = useRef({ uid: currentUserId, id: conversationId });
  scope.current = { uid: currentUserId, id: conversationId };
  const sendLock = useRef(false);
  const listVersion = useRef(0);
  const messageVersion = useRef(0);
  useEffect(() => {
    let alive = true;
    let authEventSeen = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      authEventSeen = true;
      const uid = session?.user.id || null;
      if (scope.current.uid !== uid) { setMessages([]); setConversations([]); setError(null); }
      scope.current.uid = uid;
      setCurrentUserId(uid); setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive || authEventSeen) return;
      if (error) setError('Could not restore your session. Please sign in again.');
      setCurrentUserId(data.session?.user.id || null); setAuthLoading(false);
    });
    return () => { alive = false; scope.current.uid = null; subscription.unsubscribe(); };
  }, []);
  const fetchConversations = useCallback(async () => {
    const uid = currentUserId;
    const version = ++listVersion.current;
    if (!uid) { setConversations([]); return; }
    setLoading(true); setError(null);
    try { const rows = await listConversations(uid); if (scope.current.uid === uid && version === listVersion.current) setConversations(rows); }
    catch { if (scope.current.uid === uid) setError('Could not load conversations. Please retry.'); }
    finally { if (scope.current.uid === uid && version === listVersion.current) setLoading(false); }
  }, [currentUserId]);
  const fetchMessages = useCallback(async (id: string) => {
    const uid = currentUserId;
    const version = ++messageVersion.current;
    if (!uid || scope.current.id !== id) return;
    setLoading(true); setError(null);
    try { const rows = await loadMessages(id, uid); if (scope.current.uid === uid && scope.current.id === id && version === messageVersion.current) setMessages(prev => mergeMessages(rows, prev)); }
    catch { if (scope.current.uid === uid && scope.current.id === id) { setMessages([]); setError('Could not load this conversation. Please retry.'); } }
    finally { if (scope.current.uid === uid && scope.current.id === id && version === messageVersion.current) setLoading(false); }
  }, [currentUserId]);
  useEffect(() => {
    void fetchConversations();
    if (!currentUserId) return;
    const uid = currentUserId;
    // Match IDs refer to providers, not auth users; refresh using the scoped joins.
    const timer = setInterval(() => { void fetchConversations(); }, 30000);
    return () => { clearInterval(timer); };
  }, [fetchConversations, currentUserId]);
  useEffect(() => {
    setMessages([]);
    if (!conversationId || !currentUserId) return;
    const id = conversationId; const uid = currentUserId;
    void fetchMessages(id);
    const channel = supabase.channel(`chat:${uid}:${id}`).on('postgres_changes', { event: '*', schema: 'public', table: MESSAGE_TABLE, filter: `${MESSAGE_SCOPE_COLUMN}=eq.${id}` }, () => {
      // Recheck membership before displaying any realtime data.
      if (scope.current.uid === uid && scope.current.id === id) void fetchMessages(id);
    }).subscribe(status => {
      if (scope.current.uid !== uid || scope.current.id !== id) return;
      if (status === 'SUBSCRIBED') void fetchMessages(id);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Live updates disconnected. Refresh to check for new messages.');
    });
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, currentUserId, fetchMessages]);
  const sendMessage = async (id: string, content: string) => {
    if (sendLock.current) throw new Error('A message is already being sent.');
    const uid = currentUserId;
    if (!uid) throw new Error('Sign in to send messages.');
    sendLock.current = true; setSending(true); setError(null);
    try {
      const row = await insertMessage(id, uid, content);
      if (scope.current.uid === uid && scope.current.id === id) setMessages(prev => mergeMessages(prev, [row]));
      return row;
    } catch (err) { if (scope.current.uid === uid) setError('Message not confirmed. Your draft is saved; refresh before retrying.'); throw err; }
    finally { sendLock.current = false; setSending(false); }
  };
  return { messages, conversations, loading, authLoading, sending, error, currentUserId, fetchConversations, fetchMessages, sendMessage };
}
