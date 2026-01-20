/**
 * SignalBar - Universal signal bar component for TavvY Web
 * 
 * This component renders signal bars consistently across the entire app.
 * Ported from tavvy-mobile/components/SignalBar.tsx
 * 
 * COLORS (Single source of truth):
 * - The Good (positive): Blue #0A84FF
 * - The Vibe (neutral): Purple #8B5CF6
 * - Heads Up (negative): Orange #FF9500
 */

import React, { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';

// ============================================
// SIGNAL COLORS - Single source of truth
// ============================================
export const SIGNAL_COLORS = {
  positive: {
    background: '#0A84FF',  // Blue - The Good
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
  neutral: {
    background: '#8B5CF6',  // Purple - The Vibe
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
  negative: {
    background: '#FF9500',  // Orange - Heads Up
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
};

// ============================================
// EMPTY STATE MESSAGES
// ============================================
export const EMPTY_STATE_MESSAGES = {
  positive: 'No The Good taps yet',
  neutral: 'No The Vibe taps yet',
  negative: 'No Heads Up taps yet',
  default: 'Be the first to tap!',
};

// ============================================
// TYPES
// ============================================
export type SignalType = 'positive' | 'neutral' | 'negative';

interface SignalBarProps {
  label: string;
  tapCount: number;
  type: SignalType;
  icon?: string;
  emoji?: string;
  /** Size variant: 'compact' for cards, 'full' for detail pages */
  size?: 'compact' | 'full';
  /** Whether this is an empty placeholder (no taps yet) */
  isEmpty?: boolean;
  /** Custom empty state text */
  emptyText?: string;
  /** Whether to show the dropdown chevron */
  showChevron?: boolean;
  /** Whether the dropdown is expanded */
  isExpanded?: boolean;
  /** Callback when pressed */
  onPress?: () => void;
  /** Details for expanded view */
  details?: {
    intensity1Count?: number;
    intensity2Count?: number;
    intensity3Count?: number;
    recentTaps?: Array<{
      userName: string;
      date: string;
      intensity: number;
    }>;
  };
}

export default function SignalBar({ 
  label, 
  tapCount, 
  type, 
  icon, 
  emoji,
  size = 'full',
  isEmpty = false,
  emptyText,
  showChevron,
  isExpanded: externalExpanded,
  onPress,
  details,
}: SignalBarProps) {
  const { isDark } = useThemeContext();
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const colors = SIGNAL_COLORS[type];
  const isCompact = size === 'compact';
  
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'positive':
        return '👍';
      case 'neutral':
        return '✨';
      case 'negative':
        return '⚠️';
    }
  };
  
  const toggleExpand = () => {
    if (onPress) {
      onPress();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const displayText = isEmpty 
    ? (emptyText || EMPTY_STATE_MESSAGES[type] || EMPTY_STATE_MESSAGES.default)
    : label;

  const shouldShowChevron = showChevron !== undefined ? showChevron : (details && !isCompact);

  return (
    <div className="signal-bar-container">
      <button
        className={`signal-bar ${isCompact ? 'compact' : 'full'}`}
        style={{ backgroundColor: colors.background }}
        onClick={toggleExpand}
      >
        <div className="signal-bar-content">
          {emoji ? (
            <span className={`signal-emoji ${isCompact ? 'compact' : ''}`}>{emoji}</span>
          ) : (
            <span className={`signal-icon ${isCompact ? 'compact' : ''}`}>{getIcon()}</span>
          )}
          
          <span 
            className={`signal-label ${isCompact ? 'compact' : ''} ${isEmpty ? 'empty' : ''}`}
            style={{ color: colors.text }}
          >
            {displayText}
          </span>
          
          {!isEmpty && (
            <span 
              className={`signal-tap-count ${isCompact ? 'compact' : ''}`}
              style={{ color: colors.text }}
            >
              ×{tapCount}
            </span>
          )}
        </div>
        
        {shouldShowChevron && (
          <span className="signal-chevron" style={{ color: colors.icon }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>
      
      {expanded && details && !isCompact && (
        <div 
          className="signal-expanded-content"
          style={{ backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' }}
        >
          {(details.intensity1Count || details.intensity2Count || details.intensity3Count) && (
            <div className="intensity-section">
              <span 
                className="section-title"
                style={{ color: isDark ? '#8E8E93' : '#666' }}
              >
                Tap Intensity Breakdown
              </span>
              <div className="intensity-row">
                <div className="intensity-item">
                  <span className="intensity-dot" style={{ color: colors.background }}>•</span>
                  <span className="intensity-label" style={{ color: isDark ? '#FFF' : '#000' }}>Light</span>
                  <span className="intensity-count" style={{ color: isDark ? '#8E8E93' : '#666' }}>
                    {details.intensity1Count || 0}
                  </span>
                </div>
                <div className="intensity-item">
                  <span className="intensity-dot" style={{ color: colors.background }}>••</span>
                  <span className="intensity-label" style={{ color: isDark ? '#FFF' : '#000' }}>Medium</span>
                  <span className="intensity-count" style={{ color: isDark ? '#8E8E93' : '#666' }}>
                    {details.intensity2Count || 0}
                  </span>
                </div>
                <div className="intensity-item">
                  <span className="intensity-dot" style={{ color: colors.background }}>•••</span>
                  <span className="intensity-label" style={{ color: isDark ? '#FFF' : '#000' }}>Strong</span>
                  <span className="intensity-count" style={{ color: isDark ? '#8E8E93' : '#666' }}>
                    {details.intensity3Count || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {details.recentTaps && details.recentTaps.length > 0 && (
            <div className="recent-section">
              <span 
                className="section-title"
                style={{ color: isDark ? '#8E8E93' : '#666' }}
              >
                Recent Taps
              </span>
              {details.recentTaps.slice(0, 3).map((tap, index) => (
                <div key={index} className="recent-tap-item">
                  <div 
                    className="avatar"
                    style={{ backgroundColor: colors.background }}
                  >
                    {tap.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="recent-tap-info">
                    <span 
                      className="recent-tap-user"
                      style={{ color: isDark ? '#FFF' : '#000' }}
                    >
                      {tap.userName}
                    </span>
                    <span 
                      className="recent-tap-date"
                      style={{ color: isDark ? '#8E8E93' : '#666' }}
                    >
                      {tap.date}
                    </span>
                  </div>
                  <div className="intensity-dots">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="intensity-dot-small"
                        style={{ 
                          backgroundColor: i <= tap.intensity 
                            ? colors.background 
                            : (isDark ? '#3A3A3C' : '#DDD'),
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .signal-bar-container {
          width: 100%;
        }
        
        .signal-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .signal-bar:hover {
          opacity: 0.9;
        }
        
        .signal-bar.full {
          padding: 12px 16px;
          border-radius: 12px;
        }
        
        .signal-bar.compact {
          padding: 8px 12px;
          border-radius: 20px;
        }
        
        .signal-bar-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        
        .signal-icon, .signal-emoji {
          font-size: 18px;
        }
        
        .signal-icon.compact, .signal-emoji.compact {
          font-size: 14px;
        }
        
        .signal-label {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 16px;
        }
        
        .signal-label.compact {
          font-size: 14px;
        }
        
        .signal-label.empty {
          opacity: 0.7;
          font-style: italic;
        }
        
        .signal-tap-count {
          font-weight: 600;
          font-size: 16px;
        }
        
        .signal-tap-count.compact {
          font-size: 14px;
        }
        
        .signal-chevron {
          font-size: 12px;
          margin-left: 8px;
        }
        
        .signal-expanded-content {
          margin-top: 8px;
          padding: 16px;
          border-radius: 12px;
        }
        
        .section-title {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        
        .intensity-section {
          margin-bottom: 16px;
        }
        
        .intensity-row {
          display: flex;
          gap: 16px;
        }
        
        .intensity-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .intensity-dot {
          font-size: 16px;
        }
        
        .intensity-label {
          font-size: 14px;
        }
        
        .intensity-count {
          font-size: 14px;
          margin-left: 4px;
        }
        
        .recent-section {
          margin-top: 8px;
        }
        
        .recent-tap-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }
        
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .recent-tap-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .recent-tap-user {
          font-size: 14px;
          font-weight: 500;
        }
        
        .recent-tap-date {
          font-size: 12px;
        }
        
        .intensity-dots {
          display: flex;
          gap: 4px;
        }
        
        .intensity-dot-small {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

// ============================================
// HELPER FUNCTION - Get signal type from bucket name
// ============================================
export function getSignalTypeFromBucket(bucket: string): SignalType {
  const bucketLower = bucket.toLowerCase();
  
  // Check for exact category names first
  if (bucketLower === 'the good' || bucketLower.includes('the good') || bucketLower === 'best_for') {
    return 'positive';
  }
  if (bucketLower === 'the vibe' || bucketLower.includes('the vibe') || bucketLower === 'vibe') {
    return 'neutral';
  }
  if (bucketLower === 'heads up' || bucketLower.includes('heads up') || bucketLower === 'watch_out') {
    return 'negative';
  }
  
  // Positive signals
  if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
      bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
      bucketLower.includes('good') || bucketLower.includes('friendly') ||
      bucketLower.includes('fast') || bucketLower.includes('clean') ||
      bucketLower.includes('fresh') || bucketLower.includes('delicious') ||
      bucketLower.includes('best') || bucketLower.includes('recommend')) {
    return 'positive';
  }
  
  // Negative signals (Watch Out)
  if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
      bucketLower.includes('crowded') || bucketLower.includes('loud') ||
      bucketLower.includes('slow') || bucketLower.includes('dirty') ||
      bucketLower.includes('rude') || bucketLower.includes('limited') ||
      bucketLower.includes('wait') || bucketLower.includes('noisy') ||
      bucketLower.includes('avoid') || bucketLower.includes('bad')) {
    return 'negative';
  }
  
  // Everything else is neutral (Vibe)
  return 'neutral';
}
