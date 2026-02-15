/**
 * ECardMessageButton — "Send Message" button + chat modal for e-card public pages
 * 
 * Allows any logged-in Tavvy user to message the card owner.
 * Shows a chat-style modal with message history and compose area.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { supabase } from '../lib/supabaseClient';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  isMine: boolean;
  createdAt: string;
}

interface ECardMessageButtonProps {
  cardId: string;
  cardSlug: string;
  cardOwnerName: string;
  accentColor?: string;
}

const ECardMessageButton: React.FC<ECardMessageButtonProps> = ({
  cardId,
  cardSlug,
  cardOwnerName,
  accentColor = '#1E90FF',
}) => {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadMessages = async () => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`/api/ecard-messaging/messages?threadId=${threadId}`, { headers });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && threadId) {
      loadMessages();
    }
  }, [isOpen, threadId]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        // Not logged in — redirect to login
        window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
        return;
      }

      if (threadId) {
        // Reply to existing thread
        const res = await fetch('/api/ecard-messaging/messages', {
          method: 'POST',
          headers,
          body: JSON.stringify({ threadId, content: newMessage.trim() }),
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
            createdAt: data.message.createdAt,
          }]);
          setNewMessage('');
          scrollToBottom();
        }
      } else {
        // First message — create thread
        const res = await fetch('/api/ecard-messaging/send', {
          method: 'POST',
          headers,
          body: JSON.stringify({ cardId, content: newMessage.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setThreadId(data.message.threadId);
          setMessages([{
            id: data.message.id,
            senderId: '',
            senderName: 'You',
            senderAvatar: null,
            content: data.message.content,
            isMine: true,
            createdAt: data.message.createdAt,
          }]);
          setNewMessage('');
          setMessageSent(true);
          scrollToBottom();
        } else if (data.requireLogin) {
          window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('messaging.justNow', { defaultValue: 'Just now' });
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Message Button */}
      <button
        onClick={() => {
          if (!isLoggedIn) {
            window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
            return;
          }
          setIsOpen(true);
          if (inputRef.current) inputRef.current.focus();
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '14px 20px', borderRadius: 14,
          background: accentColor, color: '#FFFFFF', border: 'none',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          boxShadow: `0 4px 14px ${accentColor}40`,
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {t('messaging.sendMessage', { defaultValue: 'Send Message' })}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 440, maxHeight: '85vh',
            background: '#FFFFFF', borderRadius: '20px 20px 0 0',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s ease',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                  {t('messaging.messageTo', { name: cardOwnerName, defaultValue: `Message ${cardOwnerName}` })}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  {t('messaging.privateConversation', { defaultValue: 'Private conversation' })}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10, border: 'none',
                  background: '#f5f5f5', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              minHeight: 200, maxHeight: '50vh',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {isLoading && (
                <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>
                  {t('messaging.loading', { defaultValue: 'Loading messages...' })}
                </div>
              )}

              {!isLoading && messages.length === 0 && !messageSent && (
                <div style={{
                  textAlign: 'center', padding: '30px 20px', color: '#999',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {t('messaging.startConversation', { name: cardOwnerName, defaultValue: `Start a conversation with ${cardOwnerName}` })}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: '#bbb' }}>
                    {t('messaging.yourMessagePrivate', { defaultValue: 'Your message will be sent privately' })}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                    background: msg.isMine ? accentColor : '#f0f0f0',
                    color: msg.isMine ? '#FFFFFF' : '#1a1a2e',
                    borderBottomRightRadius: msg.isMine ? 4 : 16,
                    borderBottomLeftRadius: msg.isMine ? 16 : 4,
                  }}>
                    {!msg.isMine && (
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: accentColor }}>
                        {msg.senderName}
                      </div>
                    )}
                    <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                    <div style={{
                      fontSize: 10, marginTop: 4, textAlign: 'right',
                      color: msg.isMine ? 'rgba(255,255,255,0.7)' : '#999',
                    }}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Area */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #f0f0f0',
              display: 'flex', gap: 10, alignItems: 'flex-end',
              background: '#fafafa',
            }}>
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('messaging.typeMessage', { defaultValue: 'Type a message...' })}
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 14,
                  border: '1px solid #e0e0e0', background: '#FFFFFF',
                  fontSize: 14, resize: 'none', outline: 'none',
                  fontFamily: 'inherit', maxHeight: 100,
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: newMessage.trim() ? accentColor : '#e0e0e0',
                  border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ECardMessageButton;
