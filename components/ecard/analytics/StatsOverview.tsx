/**
 * StatsOverview — Views and Taps stat cards in a 2-column grid.
 */

import React from 'react';
import { IoEye, IoHandLeft } from 'react-icons/io5';

interface StatsOverviewProps {
  viewCount: number;
  tapCount: number;
  isDark: boolean;
}

export default function StatsOverview({ viewCount, tapCount, isDark }: StatsOverviewProps) {
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
      <div style={{
        padding: 20, borderRadius: 14, backgroundColor: cardBg,
        textAlign: 'center', boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <IoEye size={22} color="#3B82F6" style={{ marginBottom: 8 }} />
        <span style={{ display: 'block', fontSize: 32, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
          {viewCount.toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: textSecondary }}>Views</span>
      </div>
      <div style={{
        padding: 20, borderRadius: 14, backgroundColor: cardBg,
        textAlign: 'center', boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <IoHandLeft size={22} color="#00C853" style={{ marginBottom: 8 }} />
        <span style={{ display: 'block', fontSize: 32, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
          {tapCount.toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: textSecondary }}>Link Taps</span>
      </div>
    </div>
  );
}
