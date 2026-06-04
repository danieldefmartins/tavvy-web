/**
 * Agent Review Dashboard
 * Password-protected page for reviewing ideas from Tavvy's AI agents.
 * Supports approve, reject, and discuss actions with inline HTML mockups.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

interface AgentIdea {
  id: string;
  agent_name: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  mockup_url: string | null;
  status: string;
  response_note: string | null;
  decided_at: string | null;
  created_at: string;
}

const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  'improve': { bg: 'rgba(0, 194, 203, 0.12)', border: '#00C2CB', text: '#00C2CB', label: 'Improve' },
  'signal-design': { bg: 'rgba(138, 5, 190, 0.12)', border: '#8A05BE', text: '#8A05BE', label: 'Signal Design' },
  'code-fix': { bg: 'rgba(245, 166, 35, 0.12)', border: '#F5A623', text: '#F5A623', label: 'Code Fix' },
};

const STATUS_COLORS: Record<string, string> = {
  approved: '#22C55E',
  rejected: '#EF4444',
  discuss: '#8A05BE',
  pending: '#9394A1',
};

export default function AgentReviewDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [ideas, setIdeas] = useState<AgentIdea[]>([]);
  const [history, setHistory] = useState<AgentIdea[]>([]);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(false);

  const [discussId, setDiscussId] = useState<string | null>(null);
  const [discussNote, setDiscussNote] = useState('');
  const [mockupId, setMockupId] = useState<string | null>(null);

  // Check if already authed
  useEffect(() => {
    fetch('/api/agent-review/ideas?status=pending')
      .then(r => {
        if (r.ok) setAuthed(true);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/agent-review/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setLoginError('Wrong password');
      }
    } catch {
      setLoginError('Connection error');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch('/api/agent-review/ideas?status=pending'),
        fetch('/api/agent-review/ideas?status=all'),
      ]);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setIdeas(data.ideas || []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory((data.ideas || []).filter((i: AgentIdea) => i.status !== 'pending'));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchIdeas();
  }, [authed, fetchIdeas]);

  const handleAction = async (id: string, status: string, note?: string) => {
    try {
      const res = await fetch('/api/agent-review/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, response_note: note }),
      });
      if (res.ok) {
        setDiscussId(null);
        setDiscussNote('');
        fetchIdeas();
      }
    } catch {}
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (checking) {
    return (
      <>
        <Head><title>Agent Review | Tavvy</title></Head>
        <div style={styles.page}>
          <div style={styles.loader}>Loading...</div>
        </div>
      </>
    );
  }

  // Login gate
  if (!authed) {
    return (
      <>
        <Head><title>Agent Review | Tavvy</title></Head>
        <div style={styles.page}>
          <div style={styles.loginCard}>
            <div style={styles.loginLogo}>Tavvy</div>
            <div style={styles.loginSubtitle}>Agent Review Dashboard</div>
            <form onSubmit={handleLogin} style={styles.loginForm}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={styles.input}
                autoFocus
              />
              {loginError && <div style={styles.error}>{loginError}</div>}
              <button type="submit" disabled={loginLoading} style={styles.loginButton}>
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Dashboard
  return (
    <>
      <Head><title>Agent Review | Tavvy</title></Head>
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Agent Review</h1>
              <div style={styles.subtitle}>
                {ideas.length} pending idea{ideas.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={fetchIdeas} style={styles.refreshBtn} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setTab('pending')}
              style={{ ...styles.tab, ...(tab === 'pending' ? styles.tabActive : {}) }}
            >
              Pending ({ideas.length})
            </button>
            <button
              onClick={() => setTab('history')}
              style={{ ...styles.tab, ...(tab === 'history' ? styles.tabActive : {}) }}
            >
              History ({history.length})
            </button>
          </div>

          {/* Ideas List */}
          <div style={styles.list}>
            {tab === 'pending' && ideas.length === 0 && (
              <div style={styles.empty}>No pending ideas. Your agents are working on it.</div>
            )}

            {(tab === 'pending' ? ideas : history).map(idea => {
              const agent = AGENT_COLORS[idea.agent_name] || AGENT_COLORS['improve'];
              const hasMockup = !!idea.metadata?.mockupHtml;

              return (
                <div key={idea.id} style={styles.card}>
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <span style={{
                      ...styles.agentBadge,
                      backgroundColor: agent.bg,
                      borderColor: agent.border,
                      color: agent.text,
                    }}>
                      {agent.label}
                    </span>
                    <span style={styles.cardDate}>{formatDate(idea.created_at)}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={styles.cardTitle}>{idea.title}</h3>
                  {idea.description && (
                    <p style={styles.cardDesc}>{idea.description}</p>
                  )}

                  {/* Metadata */}
                  {idea.metadata?.impact && (
                    <div style={styles.metaRow}>
                      <span style={styles.metaTag}>Impact: {idea.metadata.impact}/5</span>
                      <span style={styles.metaTag}>Effort: {idea.metadata.effort}/5</span>
                      {idea.metadata.priority && (
                        <span style={styles.metaTag}>Priority: {idea.metadata.priority.toFixed?.(1) || idea.metadata.priority}</span>
                      )}
                    </div>
                  )}

                  {idea.metadata?.whyItWorks && (
                    <div style={styles.whyBox}>
                      <strong>Why it works:</strong> {idea.metadata.whyItWorks}
                    </div>
                  )}

                  {idea.metadata?.layout && (
                    <div style={styles.whyBox}>
                      <strong>Layout:</strong> {idea.metadata.layout}
                    </div>
                  )}

                  {/* Quick Wins */}
                  {idea.metadata?.quickWins?.length > 0 && (
                    <div style={styles.quickWins}>
                      <strong>Quick Wins:</strong>
                      <ul style={styles.quickWinList}>
                        {idea.metadata.quickWins.slice(0, 3).map((w: string, i: number) => (
                          <li key={i} style={styles.quickWinItem}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Mockup Toggle */}
                  {hasMockup && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => setMockupId(mockupId === idea.id ? null : idea.id)}
                        style={styles.mockupBtn}
                      >
                        {mockupId === idea.id ? 'Hide Mockup' : 'View Mockup'}
                      </button>
                      {mockupId === idea.id && (
                        <div style={styles.mockupContainer}>
                          <iframe
                            srcDoc={idea.metadata.mockupHtml}
                            style={styles.mockupIframe}
                            sandbox="allow-same-origin"
                            title={`Mockup: ${idea.title}`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status badge for history */}
                  {idea.status !== 'pending' && (
                    <div style={styles.statusRow}>
                      <span style={{
                        ...styles.statusBadge,
                        color: STATUS_COLORS[idea.status] || '#9394A1',
                        borderColor: STATUS_COLORS[idea.status] || '#9394A1',
                      }}>
                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                      </span>
                      {idea.decided_at && (
                        <span style={styles.cardDate}>{formatDate(idea.decided_at)}</span>
                      )}
                    </div>
                  )}

                  {/* Response note */}
                  {idea.response_note && (
                    <div style={styles.responseNote}>
                      <strong>Your note:</strong> {idea.response_note}
                    </div>
                  )}

                  {/* Action buttons (pending only) */}
                  {idea.status === 'pending' && (
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleAction(idea.id, 'approved')}
                        style={styles.approveBtn}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(idea.id, 'rejected')}
                        style={styles.rejectBtn}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setDiscussId(discussId === idea.id ? null : idea.id)}
                        style={styles.discussBtn}
                      >
                        Discuss
                      </button>
                    </div>
                  )}

                  {/* Discuss text box */}
                  {discussId === idea.id && (
                    <div style={styles.discussBox}>
                      <textarea
                        value={discussNote}
                        onChange={e => setDiscussNote(e.target.value)}
                        placeholder="Share your thoughts on this idea..."
                        style={styles.textarea}
                        rows={3}
                        autoFocus
                      />
                      <button
                        onClick={() => handleAction(idea.id, 'discuss', discussNote)}
                        disabled={!discussNote.trim()}
                        style={{
                          ...styles.sendBtn,
                          opacity: discussNote.trim() ? 1 : 0.5,
                        }}
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Inline Styles ──

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0D0B1A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#F1F5F9',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 16px',
  },
  container: {
    width: '100%',
    maxWidth: 640,
  },
  loader: {
    color: '#9394A1',
    marginTop: 100,
    textAlign: 'center',
  },

  // Login
  loginCard: {
    marginTop: 120,
    padding: 32,
    background: '#1A1730',
    borderRadius: 16,
    border: '1px solid rgba(138, 5, 190, 0.2)',
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
  },
  loginLogo: {
    fontSize: 32,
    fontWeight: 800,
    color: '#8A05BE',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#9394A1',
    marginBottom: 24,
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: '12px 16px',
    background: '#0D0B1A',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#F1F5F9',
    fontSize: 16,
    outline: 'none',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
  loginButton: {
    padding: '12px 24px',
    background: '#8A05BE',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#9394A1',
    marginTop: 4,
  },
  refreshBtn: {
    padding: '8px 16px',
    background: 'rgba(138, 5, 190, 0.15)',
    border: '1px solid rgba(138, 5, 190, 0.3)',
    borderRadius: 8,
    color: '#D4A0FF',
    fontSize: 13,
    cursor: 'pointer',
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#9394A1',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  tabActive: {
    color: '#F1F5F9',
    borderBottomColor: '#8A05BE',
  },

  // List
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#6B6B80',
    padding: 40,
    fontSize: 15,
  },

  // Card
  card: {
    background: '#1A1730',
    borderRadius: 14,
    padding: 20,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 100,
    border: '1px solid',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardDate: {
    fontSize: 12,
    color: '#6B6B80',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 8px',
    color: '#F1F5F9',
  },
  cardDesc: {
    fontSize: 14,
    color: '#9394A1',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },

  // Metadata
  metaRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 12,
  },
  metaTag: {
    fontSize: 12,
    color: '#D4A0FF',
    background: 'rgba(138, 5, 190, 0.1)',
    padding: '3px 8px',
    borderRadius: 6,
  },
  whyBox: {
    fontSize: 13,
    color: '#9394A1',
    lineHeight: 1.5,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    marginBottom: 8,
  },
  quickWins: {
    fontSize: 13,
    color: '#9394A1',
    marginBottom: 12,
  },
  quickWinList: {
    margin: '4px 0 0',
    paddingLeft: 18,
  },
  quickWinItem: {
    marginBottom: 2,
  },

  // Mockup
  mockupBtn: {
    padding: '6px 14px',
    background: 'rgba(0, 194, 203, 0.12)',
    border: '1px solid rgba(0, 194, 203, 0.3)',
    borderRadius: 8,
    color: '#00C2CB',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  mockupContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  mockupIframe: {
    width: '100%',
    height: 600,
    border: 'none',
    borderRadius: 12,
    background: '#17013A',
  },

  // Status
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 100,
    border: '1px solid',
  },
  responseNote: {
    fontSize: 13,
    color: '#9394A1',
    padding: '8px 12px',
    background: 'rgba(138, 5, 190, 0.08)',
    borderRadius: 8,
    marginTop: 10,
  },

  // Actions
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  approveBtn: {
    flex: 1,
    padding: '10px 0',
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: 10,
    color: '#22C55E',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    flex: 1,
    padding: '10px 0',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  discussBtn: {
    flex: 1,
    padding: '10px 0',
    background: 'rgba(138, 5, 190, 0.12)',
    border: '1px solid rgba(138, 5, 190, 0.3)',
    borderRadius: 10,
    color: '#D4A0FF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Discuss box
  discussBox: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  textarea: {
    padding: '10px 14px',
    background: '#0D0B1A',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#F1F5F9',
    fontSize: 14,
    resize: 'vertical' as const,
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    alignSelf: 'flex-end',
    padding: '8px 20px',
    background: '#8A05BE',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
