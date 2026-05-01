/**
 * SignalPill - New signal pill component for TavvY Web
 *
 * Replaces the old full-width colored bars with compact, scannable pills.
 * Each signal is individually visible — no expanding required.
 *
 * SIGNAL COLORS (Brand-aligned, May 2026):
 * - The Good (positive): Teal #00C2CB
 * - The Vibe (contextual): Purple #8A05BE
 * - Heads Up (warning): Amber #F5A623
 *
 * SIZE scales with consensus (tap count):
 * - lg: 30+ taps (most prominent)
 * - md: 10-29 taps (standard)
 * - sm: 3-9 taps (smaller, slightly muted)
 * - ghost: 1-2 taps (fading, dashed border)
 */

import React from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { getSignalPillSize } from '../constants/Colors';

// ============================================
// TYPES
// ============================================
export type SignalCategory = 'good' | 'vibe' | 'headsup';

interface SignalPillProps {
  label: string;
  tapCount: number;
  category: SignalCategory;
  emoji?: string;
  /** Override auto-sizing based on tap count */
  size?: 'lg' | 'md' | 'sm' | 'ghost';
  /** Show tap count badge */
  showCount?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

// ============================================
// PILL COLORS (dark mode)
// ============================================
const PILL_STYLES = {
  good: {
    dark: {
      bg: 'rgba(0, 194, 203, 0.12)',
      border: 'rgba(0, 194, 203, 0.2)',
      text: '#5EEAEF',
      accent: '#00C2CB',
    },
    light: {
      bg: 'rgba(0, 194, 203, 0.10)',
      border: 'rgba(0, 194, 203, 0.25)',
      text: '#17013A',
      accent: '#00C2CB',
    },
  },
  vibe: {
    dark: {
      bg: 'rgba(138, 5, 190, 0.12)',
      border: 'rgba(138, 5, 190, 0.2)',
      text: '#C77DFF',
      accent: '#8A05BE',
    },
    light: {
      bg: 'rgba(138, 5, 190, 0.08)',
      border: 'rgba(138, 5, 190, 0.18)',
      text: '#17013A',
      accent: '#8A05BE',
    },
  },
  headsup: {
    dark: {
      bg: 'rgba(245, 166, 35, 0.12)',
      border: 'rgba(245, 166, 35, 0.2)',
      text: '#FFB84D',
      accent: '#F5A623',
    },
    light: {
      bg: 'rgba(245, 166, 35, 0.10)',
      border: 'rgba(245, 166, 35, 0.22)',
      text: '#17013A',
      accent: '#F5A623',
    },
  },
};

// ============================================
// COMPONENT
// ============================================
export default function SignalPill({
  label,
  tapCount,
  category,
  emoji,
  size: sizeOverride,
  showCount = true,
  onClick,
  className = '',
}: SignalPillProps) {
  const { isDark } = useThemeContext();
  const mode = isDark ? 'dark' : 'light';
  const colors = PILL_STYLES[category][mode];
  const size = sizeOverride || getSignalPillSize(tapCount);
  const isGhost = size === 'ghost';

  return (
    <button
      className={`signal-pill signal-pill-${size} ${isGhost ? 'ghost' : ''} ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderStyle: isGhost ? 'dashed' : 'solid',
        color: colors.text,
        opacity: isGhost ? 0.4 : size === 'sm' ? 0.75 : 1,
      }}
      onClick={onClick}
      type="button"
    >
      {emoji && <span className="signal-pill-emoji">{emoji}</span>}
      <span className="signal-pill-label">{label}</span>
      {showCount && tapCount > 0 && (
        <span className="signal-pill-count">×{tapCount}</span>
      )}

      <style jsx>{`
        .signal-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-width: 1px;
          border-radius: 100px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          background: none;
          -webkit-tap-highlight-color: transparent;
        }

        .signal-pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        .signal-pill:active {
          transform: translateY(0);
        }

        /* Size variants */
        .signal-pill-lg {
          padding: 12px 22px;
          font-size: 15px;
        }

        .signal-pill-lg .signal-pill-emoji {
          font-size: 18px;
        }

        .signal-pill-md {
          padding: 10px 18px;
          font-size: 14px;
        }

        .signal-pill-md .signal-pill-emoji {
          font-size: 16px;
        }

        .signal-pill-sm {
          padding: 8px 14px;
          font-size: 13px;
        }

        .signal-pill-sm .signal-pill-emoji {
          font-size: 14px;
        }

        .signal-pill.ghost {
          padding: 6px 12px;
          font-size: 12px;
        }

        .signal-pill.ghost .signal-pill-emoji {
          font-size: 12px;
        }

        /* Label */
        .signal-pill-label {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Count */
        .signal-pill-count {
          font-size: 0.85em;
          font-weight: 700;
          opacity: 0.6;
          margin-left: 2px;
        }
      `}</style>
    </button>
  );
}

// ============================================
// SIGNAL PILLS GRID — Renders a group of pills
// ============================================
interface SignalPillsGridProps {
  signals: Array<{
    label: string;
    tapCount: number;
    category: SignalCategory;
    emoji?: string;
    signalId?: string;
  }>;
  /** Max pills to show (default: 6) */
  maxVisible?: number;
  /** Show count on each pill */
  showCounts?: boolean;
  /** Pill click handler */
  onPillClick?: (signalId: string) => void;
  /** Custom className */
  className?: string;
}

export function SignalPillsGrid({
  signals,
  maxVisible = 6,
  showCounts = true,
  onPillClick,
  className = '',
}: SignalPillsGridProps) {
  // Sort by tap count descending so most popular appear first & largest
  const sorted = [...signals].sort((a, b) => b.tapCount - a.tapCount);
  const visible = sorted.slice(0, maxVisible);

  if (visible.length === 0) {
    return (
      <div className={`signal-pills-empty ${className}`}>
        <span className="empty-icon">👆</span>
        <span className="empty-text">Be the first to leave a signal!</span>

        <style jsx>{`
          .signal-pills-empty {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            opacity: 0.5;
            font-size: 14px;
          }

          .empty-icon {
            font-size: 18px;
          }

          .empty-text {
            font-style: italic;
            color: inherit;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`signal-pills-grid ${className}`}>
      {visible.map((signal, index) => (
        <SignalPill
          key={signal.signalId || `${signal.label}-${index}`}
          label={signal.label}
          tapCount={signal.tapCount}
          category={signal.category}
          emoji={signal.emoji}
          showCount={showCounts}
          onClick={onPillClick ? () => onPillClick(signal.signalId || signal.label) : undefined}
        />
      ))}

      <style jsx>{`
        .signal-pills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

// ============================================
// SIGNAL DETAIL ROW — For place detail pages
// ============================================
interface SignalDetailRowProps {
  label: string;
  tapCount: number;
  category: SignalCategory;
  emoji?: string;
  /** Max tap count (for calculating bar fill width) */
  maxTapCount: number;
  onClick?: () => void;
}

export function SignalDetailRow({
  label,
  tapCount,
  category,
  emoji,
  maxTapCount,
  onClick,
}: SignalDetailRowProps) {
  const { isDark } = useThemeContext();
  const mode = isDark ? 'dark' : 'light';
  const colors = PILL_STYLES[category][mode];
  const fillPercent = maxTapCount > 0 ? Math.round((tapCount / maxTapCount) * 100) : 0;

  return (
    <div className="signal-detail-row" onClick={onClick}>
      <div
        className="signal-detail-pill"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        {emoji && <span className="detail-emoji">{emoji}</span>}
        <span className="detail-label">{label}</span>
      </div>

      <div className="signal-detail-bar-track">
        <div
          className="signal-detail-bar-fill"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: colors.accent,
          }}
        />
      </div>

      <div className="signal-detail-count">{tapCount}</div>

      <style jsx>{`
        .signal-detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          cursor: ${onClick ? 'pointer' : 'default'};
        }

        .signal-detail-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 100px;
          border-width: 1px;
          border-style: solid;
          font-size: 13px;
          font-weight: 600;
          min-width: 140px;
          white-space: nowrap;
        }

        .detail-emoji {
          font-size: 14px;
        }

        .detail-label {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .signal-detail-bar-track {
          flex: 1;
          height: 6px;
          background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
          border-radius: 3px;
          overflow: hidden;
        }

        .signal-detail-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }

        .signal-detail-count {
          font-size: 13px;
          font-weight: 700;
          color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'};
          min-width: 32px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

// ============================================
// HELPER — Map old signal types to new categories
// ============================================
export function getSignalCategory(type: string): SignalCategory {
  const t = type.toLowerCase();

  if (t === 'positive' || t === 'pros' || t === 'good' || t === 'best_for' || t === 'the good') {
    return 'good';
  }
  if (t === 'neutral' || t === 'universe' || t === 'vibe' || t === 'the vibe') {
    return 'vibe';
  }
  if (t === 'negative' || t === 'cons' || t === 'headsup' || t === 'heads_up' || t === 'heads up' || t === 'watch_out') {
    return 'headsup';
  }

  return 'vibe'; // default
}

// ============================================
// HELPER — Infer category from signal label
// ============================================
export function inferCategoryFromLabel(label: string): SignalCategory {
  const l = label.toLowerCase();

  // Positive signals
  if (l.includes('great') || l.includes('excellent') || l.includes('amazing') ||
      l.includes('affordable') || l.includes('good') || l.includes('friendly') ||
      l.includes('fast') || l.includes('clean') || l.includes('fresh') ||
      l.includes('delicious') || l.includes('best') || l.includes('recommend') ||
      l.includes('punctual') || l.includes('communicates') || l.includes('fairly priced')) {
    return 'good';
  }

  // Negative signals
  if (l.includes('pricey') || l.includes('expensive') || l.includes('crowded') ||
      l.includes('loud') || l.includes('slow') || l.includes('dirty') ||
      l.includes('rude') || l.includes('limited') || l.includes('wait') ||
      l.includes('noisy') || l.includes('avoid') || l.includes('bad') ||
      l.includes('cash only') || l.includes('hard to park')) {
    return 'headsup';
  }

  // Everything else is vibe
  return 'vibe';
}
