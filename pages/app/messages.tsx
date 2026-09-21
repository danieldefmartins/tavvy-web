import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { blockConversation } from '../../lib/tavvyChat';
import AppLayout from '../../components/AppLayout';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useTavvyChat } from '../../hooks/useTavvyChat';

export default function MessagesPage() {
  const { theme } = useThemeContext();
  const [active, setActive] = useState<string>();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [blockNotice, setBlockNotice] = useState('');
  const [blocking, setBlocking] = useState(false);
  const chat = useTavvyChat(active);
  useEffect(() => { setActive(undefined); setDraft(''); }, [chat.currentUserId]);
  const title = (c: typeof chat.conversations[number]) => c.pro_id === chat.currentUserId ? (c.customer_name || 'Customer conversation') : (c.provider_name || 'Professional conversation');
  const refresh = () => active ? chat.fetchMessages(active) : chat.fetchConversations();
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || chat.sending) return;
    const content = draft;
    try { await chat.sendMessage(active, content); setDraft(current => current === content ? '' : current); } catch { /* Hook displays recoverable error. */ }
  };
  const block = async () => {
    if (!active || !chat.currentUserId || blocking || !window.confirm('Block messaging with this participant?')) return;
    setBlocking(true); setBlockNotice('');
    try { await blockConversation(active, chat.currentUserId); setBlockNotice('Messaging with this participant is blocked.'); }
    catch { setBlockNotice('Could not block this participant. Please retry.'); }
    finally { setBlocking(false); }
  };
  return <AppLayout><Head><title>Messages | Tavvy</title></Head>
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 100px', color: theme.text }}>
      <Link href="/app/apps">← Apps</Link><h1>Messages</h1>
      {chat.authLoading ? <p role="status">Checking your session…</p> : !chat.currentUserId ? <p><Link href="/app/login">Sign in</Link> to view your conversations.</p> : <>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {active && <button onClick={() => { setActive(undefined); setDraft(''); }}>← Conversations</button>}
          <button onClick={refresh} disabled={chat.loading}>Refresh</button>
          {active && <button onClick={block} disabled={blocking}>{blocking ? 'Blocking…' : 'Block participant'}</button>}
        </div>
        {blockNotice && <p role="status">{blockNotice}</p>}
        {chat.error && <p role="alert">{chat.error} <button onClick={refresh}>Retry</button></p>}
        {chat.loading && <p role="status">Loading…</p>}
        {!active ? <>
          <input aria-label="Search conversations" placeholder="Search conversations" value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 16 }} />
          {!chat.loading && !chat.error && chat.conversations.length === 0 && <p>No conversations yet. Conversations with your service professionals will appear here.</p>}
          <ul style={{ padding: 0, listStyle: 'none' }}>{chat.conversations.filter(c => `${title(c)} ${c.last_message || ''} ${c.id}`.toLowerCase().includes(query.toLowerCase())).map(c => <li key={c.id} style={{ marginBottom: 12 }}>
            <button onClick={() => { setActive(c.id); setDraft(''); }} style={{ textAlign: 'left', width: '100%', padding: 18, borderRadius: 12, border: '1px solid #8886', color: theme.text, background: theme.surface }}>
              <strong>{title(c)} · {c.id.slice(0, 8)}</strong><p>{c.last_message || 'Open conversation'}</p>
            </button>
          </li>)}</ul>
        </> : <>
          <div role="log" aria-label="Conversation messages" aria-live="polite" style={{ minHeight: 200, maxHeight: '55vh', overflowY: 'auto' }}>
            {!chat.loading && !chat.error && !chat.messages.length && <p>No messages yet.</p>}
            {chat.messages.map(m => <article key={m.id} style={{ margin: '12px 0', padding: 14, borderRadius: 12, background: m.sender_id === chat.currentUserId ? '#667eea25' : theme.surface, marginLeft: m.sender_id === chat.currentUserId ? 40 : 0 }}>
              <small>{m.sender_id === chat.currentUserId ? 'You' : 'Participant'} · {new Date(m.created_at).toLocaleString()}</small><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</p>
            </article>)}
          </div>
          <form onSubmit={send} style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <textarea aria-label="Message" placeholder="Type a message…" value={draft} maxLength={5000} onChange={e => setDraft(e.target.value)} style={{ flex: 1, padding: 12 }} />
            <button disabled={chat.sending || !draft.trim()} type="submit">{chat.sending ? 'Sending…' : 'Send'}</button>
          </form>
        </>}
      </>}
    </main>
  </AppLayout>;
}

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
