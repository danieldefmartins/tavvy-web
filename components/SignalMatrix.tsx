/**
 * SignalMatrix — 2x2 Grid Reviews Component
 *
 * Replaces the old 3-section layout (The Good / The Vibe / Heads Up).
 * Shows top signal per category in a compact grid. Each box expands
 * to show all signals in that category.
 *
 * Used on: Place detail page, Place card previews
 *
 * Props:
 *  - signals: { best_for: SignalAggregate[], vibe: SignalAggregate[], heads_up: SignalAggregate[] }
 *  - compact: boolean (for card previews — no expand, smaller text)
 *  - onReview: () => void (callback for "Be the first to review")
 */

import React, { useState } from 'react';
import { SignalAggregate } from '../lib/signalService';

interface SignalGroup {
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
}

interface SimpleSignal {
  bucket: string;
  tap_total: number;
}

interface SignalMatrixProps {
  signals?: SignalGroup;
  simpleSignals?: SimpleSignal[];
  compact?: boolean;
  onReview?: () => void;
}

const CATEGORIES = [
  { key: 'best_for' as const, label: 'The Good', color: '#00C2CB', bg: 'rgba(0,194,203,0.1)', border: 'rgba(0,194,203,0.2)', textColor: '#0A8A8F' },
  { key: 'best_for_2' as const, label: 'The Good', color: '#00C2CB', bg: 'rgba(0,194,203,0.1)', border: 'rgba(0,194,203,0.2)', textColor: '#0A8A8F' },
  { key: 'vibe' as const, label: 'The Vibe', color: '#8A05BE', bg: 'rgba(138,5,190,0.08)', border: 'rgba(138,5,190,0.2)', textColor: '#6B04A0' },
  { key: 'heads_up' as const, label: 'Heads Up', color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)', textColor: '#9A6600' },
];

// Known heads_up / vibe signal labels for categorization
const VIBE_KEYWORDS = ['vibe', 'cozy', 'romantic', 'lively', 'casual', 'upscale', 'old school', 'trendy', 'family', 'quiet', 'loud', 'intimate', 'modern', 'classic', 'chill', 'energetic'];
const HEADS_UP_KEYWORDS = ['cash only', 'no reservation', 'wait', 'noisy', 'crowded', 'slow', 'expensive', 'limited', 'parking', 'small', 'closed'];

function categorizeSimpleSignal(label: string): 'best_for' | 'vibe' | 'heads_up' {
  const lower = label.toLowerCase();
  if (HEADS_UP_KEYWORDS.some(kw => lower.includes(kw))) return 'heads_up';
  if (VIBE_KEYWORDS.some(kw => lower.includes(kw))) return 'vibe';
  return 'best_for';
}

function simpleToGrouped(simpleSignals: SimpleSignal[]): SignalGroup {
  const grouped: SignalGroup = { best_for: [], vibe: [], heads_up: [] };
  for (const s of simpleSignals) {
    const cat = categorizeSimpleSignal(s.bucket);
    grouped[cat].push({
      signal_id: s.bucket,
      place_id: '',
      tap_total: s.tap_total,
      current_score: s.tap_total,
      review_count: s.tap_total,
      last_tap_at: null,
      is_ghost: false,
      label: s.bucket,
      icon: '',
      category: cat,
    } as SignalAggregate);
  }
  return grouped;
}

export default function SignalMatrix({ signals, simpleSignals, compact = false, onReview }: SignalMatrixProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Convert simple signals to grouped if needed
  const groupedSignals = signals || (simpleSignals ? simpleToGrouped(simpleSignals) : { best_for: [], vibe: [], heads_up: [] });

  const hasSignals = groupedSignals.best_for.length > 0 || groupedSignals.vibe.length > 0 || groupedSignals.heads_up.length > 0;

  // Build the 4 grid boxes: Good #1, Good #2, Vibe #1, Heads Up #1
  const good1 = groupedSignals.best_for[0] || null;
  const good2 = groupedSignals.best_for[1] || null;
  const vibe1 = groupedSignals.vibe[0] || null;
  const headsUp1 = groupedSignals.heads_up[0] || null;

  const boxes = [
    { signal: good1, cat: CATEGORIES[0], expandKey: 'best_for', allSignals: groupedSignals.best_for },
    { signal: good2, cat: CATEGORIES[1], expandKey: 'best_for_2', allSignals: groupedSignals.best_for.slice(1) },
    { signal: vibe1, cat: CATEGORIES[2], expandKey: 'vibe', allSignals: groupedSignals.vibe },
    { signal: headsUp1, cat: CATEGORIES[3], expandKey: 'heads_up', allSignals: groupedSignals.heads_up },
  ];

  // Empty state
  if (!hasSignals) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📝</div>
        <div style={styles.emptyTitle}>No reviews yet</div>
        <div style={styles.emptyText}>Be the first to review this place</div>
        {onReview && (
          <button onClick={onReview} style={styles.reviewBtn}>
            Leave a Review
          </button>
        )}
      </div>
    );
  }

  const toggleExpand = (key: string) => {
    if (compact) return;
    setExpanded(expanded === key ? null : key);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Reviews</span>
      </div>
      <div style={styles.grid}>
        {boxes.map(({ signal, cat, expandKey, allSignals }, i) => {
          const isExpanded = expanded === expandKey;
          const hasMore = allSignals.length > 1;

          if (!signal) {
            // Empty placeholder
            return (
              <div key={i} style={{
                ...styles.box,
                ...(compact ? styles.boxCompact : {}),
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ ...styles.boxEmptyText, fontSize: compact ? 10 : 12 }}>
                  No {cat.label === 'The Good' ? 'good' : cat.label === 'The Vibe' ? 'vibe' : 'heads up'} signals yet
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              style={{
                ...styles.box,
                ...(compact ? styles.boxCompact : {}),
                background: cat.bg,
                border: `1px solid ${cat.border}`,
                cursor: (!compact && hasMore) ? 'pointer' : 'default',
                ...(isExpanded ? { gridColumn: '1 / -1' } : {}),
              }}
              onClick={() => hasMore && toggleExpand(expandKey)}
            >
              {/* Top signal */}
              <div style={styles.boxContent}>
                <span style={{ fontSize: compact ? 18 : 24 }}>{signal.icon}</span>
                <div style={styles.boxInfo}>
                  <div style={{
                    ...styles.boxLabel,
                    color: cat.textColor,
                    fontSize: compact ? 11 : 14,
                  }}>
                    {signal.label}
                  </div>
                  <div style={{
                    ...styles.boxCount,
                    color: cat.textColor,
                    fontSize: compact ? 10 : 12,
                  }}>
                    x{signal.review_count}
                  </div>
                </div>
                {!compact && hasMore && (
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      marginLeft: 'auto', flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </div>

              {/* Expanded: show all other signals in this category */}
              {isExpanded && (
                <div style={styles.expandedList}>
                  {allSignals.slice(1).map(s => (
                    <div key={s.signal_id} style={styles.expandedPill}>
                      <span>{s.icon}</span>
                      <span style={{ color: cat.textColor, fontWeight: 500, fontSize: 13 }}>{s.label}</span>
                      <span style={{ color: cat.textColor, opacity: 0.5, fontSize: 11 }}>x{s.review_count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 0 8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#222',
    letterSpacing: -0.3,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  box: {
    borderRadius: 14,
    padding: '14px 14px',
    transition: 'all 0.2s',
  },
  boxCompact: {
    padding: '8px 10px',
    borderRadius: 10,
  },
  boxContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  boxInfo: {
    flex: 1,
    minWidth: 0,
  },
  boxLabel: {
    fontWeight: 600,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  boxCount: {
    fontWeight: 500,
    opacity: 0.6,
    marginTop: 2,
  },
  boxEmptyText: {
    color: 'rgba(0,0,0,0.25)',
    textAlign: 'center' as const,
    padding: '8px 0',
    fontWeight: 500,
  },
  expandedList: {
    marginTop: 10,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  expandedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '24px 16px',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  reviewBtn: {
    padding: '10px 24px',
    background: '#8A05BE',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
