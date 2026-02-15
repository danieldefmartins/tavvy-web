/**
 * ECardInbox — Messaging inbox + Q&A moderation for e-card dashboard
 * 
 * Features:
 * - Primary / Spam folder tabs
 * - Thread list with unread indicators
 * - Chat view for individual threads
 * - Mark as spam / unmark spam
 * - Q&A moderation section (approve/reject/answer pending questions)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Thread {
  id: string;
  folder: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  isMine: boolean;
  isRead: boolean;
  createdAt: string;
}

interface PendingQuestion {
  id: string;
  questionText: string;
  createdAt: string;
  submitter: { id: string; name: string; avatar: string | null };
}

interface ECardInboxProps {
  cardId: string;
  isDark: boolean;
}

const ECardInbox: React.FC<ECardInboxProps> = ({ cardId, isDark }) => {
  const [activeFolder, setActiveFolder] = useState<'primary' | 'spam' | 'questions'>('primary');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counts, setCounts] = useState({ primary: 0, spam: 0, primaryUnread: 0, spamUnread: 0 });
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([]);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [moderating, setModerating] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }, []);

  const loadThreads = useCallback(async (folder: 'primary' | 'spam') => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/ecard-messaging/threads?cardId=${cardId}&folder=${folder}`, { headers });
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, getAuthHeaders]);

  const loadPendingQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/civic/pending-questions?cardId=${cardId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setPendingQuestions(data.questions);
      }
    } catch (err) {
      console.error('Failed to load pending questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, getAuthHeaders]);

  useEffect(() => {
    if (activeFolder === 'questions') {
      loadPendingQuestions();
    } else {
      loadThreads(activeFolder);
      setSelectedThread(null);
    }
  }, [activeFolder, loadThreads, loadPendingQuestions]);

  const loadMessages = async (threadId: string) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/ecard-messaging/messages?threadId=${threadId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    loadMessages(thread.id);
  };

  const handleReply = async () => {
    if (!newReply.trim() || isSending || !selectedThread) return;
    setIsSending(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch('/api/ecard-messaging/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ threadId: selectedThread.id, content: newReply.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: data.message.id,
          senderId: '',
          senderName: 'You',
          senderAvatar: null,
          content: data.message.content,
          isMine: true,
          isRead: true,
          createdAt: data.message.createdAt,
        }]);
        setNewReply('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSpamAction = async (threadId: string, markAsSpam: boolean) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await fetch('/api/ecard-messaging/spam', {
        method: markAsSpam ? 'POST' : 'DELETE',
        headers,
        body: JSON.stringify({ threadId }),
      });
      setSelectedThread(null);
      loadThreads(activeFolder as 'primary' | 'spam');
    } catch (err) {
      console.error('Failed to update spam status:', err);
    }
  };

  const handleModerateQuestion = async (questionId: string, action: 'approve' | 'reject' | 'answer', answerText?: string) => {
    setModerating(questionId);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const body: any = { questionId, action };
      if (action === 'answer' && answerText) body.answerText = answerText;
      const res = await fetch('/api/civic/moderate-question', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        setAnswerInputs(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      }
    } catch (err) {
      console.error('Failed to moderate question:', err);
    } finally {
      setModerating(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const bg = isDark ? '#0f172a' : '#f8f9fa';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#1a1a2e';
  const textSecondary = isDark ? '#94a3b8' : '#666';
  const borderColor = isDark ? '#334155' : '#e8e8e8';
  const accentColor = '#1E90FF';

  // Chat view
  if (selectedThread) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
        {/* Chat Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          borderBottom: `1px solid ${borderColor}`, background: cardBg,
          borderRadius: '12px 12px 0 0',
        }}>
          <button
            onClick={() => setSelectedThread(null)}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: isDark ? '#334155' : '#f0f0f0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: accentColor + '20',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: accentColor,
          }}>
            {selectedThread.sender.name?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>{selectedThread.sender.name}</div>
          </div>
          <button
            onClick={() => handleSpamAction(selectedThread.id, selectedThread.folder === 'primary')}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
              background: selectedThread.folder === 'primary' ? '#fef2f2' : '#f0fdf4',
              color: selectedThread.folder === 'primary' ? '#dc2626' : '#16a34a',
              cursor: 'pointer',
            }}
          >
            {selectedThread.folder === 'primary' ? '🚫 Spam' : '✅ Not Spam'}
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 16, display: 'flex',
          flexDirection: 'column', gap: 10, background: bg,
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                background: msg.isMine ? accentColor : cardBg,
                color: msg.isMine ? '#fff' : textPrimary,
                border: msg.isMine ? 'none' : `1px solid ${borderColor}`,
                borderBottomRightRadius: msg.isMine ? 4 : 14,
                borderBottomLeftRadius: msg.isMine ? 14 : 4,
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', opacity: 0.6 }}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 16px',
          borderTop: `1px solid ${borderColor}`, background: cardBg,
          borderRadius: '0 0 12px 12px',
        }}>
          <input
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            placeholder="Type a reply..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${borderColor}`, background: bg,
              color: textPrimary, fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={handleReply}
            disabled={!newReply.trim() || isSending}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: newReply.trim() ? accentColor : isDark ? '#334155' : '#e0e0e0',
              border: 'none', cursor: newReply.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Folder Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${borderColor}`, background: bg,
      }}>
        {(['primary', 'spam', 'questions'] as const).map((folder) => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            style={{
              flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeFolder === folder ? 700 : 500,
              background: activeFolder === folder ? accentColor : 'transparent',
              color: activeFolder === folder ? '#fff' : textSecondary,
              transition: 'all 0.2s', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            {folder === 'primary' && '📥'}
            {folder === 'spam' && '🚫'}
            {folder === 'questions' && '❓'}
            {folder === 'primary' && `Primary${counts.primaryUnread > 0 ? ` (${counts.primaryUnread})` : ''}`}
            {folder === 'spam' && `Spam${counts.spamUnread > 0 ? ` (${counts.spamUnread})` : ''}`}
            {folder === 'questions' && `Q&A${pendingQuestions.length > 0 ? ` (${pendingQuestions.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: textSecondary, fontSize: 13 }}>
          Loading...
        </div>
      )}

      {/* Thread List (Primary / Spam) */}
      {!isLoading && activeFolder !== 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {threads.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: textSecondary,
              background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {activeFolder === 'primary' ? '📭' : '🚫'}
              </div>
              <div style={{ fontSize: 14 }}>
                {activeFolder === 'primary' ? 'No messages yet' : 'No spam messages'}
              </div>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: accentColor + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: accentColor, flexShrink: 0,
                }}>
                  {thread.sender.name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: thread.unreadCount > 0 ? 700 : 500,
                      color: textPrimary,
                    }}>
                      {thread.sender.name}
                    </span>
                    <span style={{ fontSize: 11, color: textSecondary }}>
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: textSecondary, marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontWeight: thread.unreadCount > 0 ? 600 : 400,
                  }}>
                    {thread.lastMessagePreview}
                  </div>
                </div>
                {thread.unreadCount > 0 && (
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, background: accentColor,
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {thread.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Q&A Moderation */}
      {!isLoading && activeFolder === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pendingQuestions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', color: textSecondary,
              background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14 }}>No pending questions to review</div>
            </div>
          ) : (
            pendingQuestions.map((q) => (
              <div
                key={q.id}
                style={{
                  background: cardBg, borderRadius: 12, padding: 16,
                  border: `1px solid ${borderColor}`,
                }}
              >
                {/* Question header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#666',
                  }}>
                    {q.submitter.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{q.submitter.name}</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>{formatTime(q.createdAt)}</div>
                  </div>
                </div>

                {/* Question text */}
                <div style={{
                  fontSize: 14, color: textPrimary, lineHeight: 1.5,
                  padding: '10px 14px', background: bg, borderRadius: 10,
                  marginBottom: 12,
                }}>
                  "{q.questionText}"
                </div>

                {/* Answer input */}
                <div style={{ marginBottom: 10 }}>
                  <input
                    value={answerInputs[q.id] || ''}
                    onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer (optional)..."
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${borderColor}`, background: bg,
                      color: textPrimary, fontSize: 13, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      const answer = answerInputs[q.id]?.trim();
                      if (answer) {
                        handleModerateQuestion(q.id, 'answer', answer);
                      } else {
                        handleModerateQuestion(q.id, 'approve');
                      }
                    }}
                    disabled={moderating === q.id}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: moderating === q.id ? 'default' : 'pointer',
                      opacity: moderating === q.id ? 0.6 : 1,
                    }}
                  >
                    {answerInputs[q.id]?.trim() ? '✅ Approve & Answer' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => handleModerateQuestion(q.id, 'reject')}
                    disabled={moderating === q.id}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600,
                      cursor: moderating === q.id ? 'default' : 'pointer',
                      opacity: moderating === q.id ? 0.6 : 1,
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ECardInbox;
