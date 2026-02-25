/**
 * LinkPerformance — per-link click performance table.
 */

import React from 'react';
import { LinkItem } from '../../../lib/ecard';

interface LinkPerformanceProps {
  links: LinkItem[];
  isDark: boolean;
}

export default function LinkPerformance({ links, isDark }: LinkPerformanceProps) {
  const textPrimary = isDark ? '#E2E8F0' : '#374151';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  if (links.length === 0) {
    return (
      <p style={{ color: textSecondary, fontSize: 14 }}>
        Add links to your card to start tracking clicks.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {links.map((link) => (
        <div key={link.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 10,
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}>
          <span style={{ fontSize: 14, color: textPrimary, fontWeight: 500 }}>
            {link.title || link.url}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: textSecondary,
          }}>
            {link.clicks || 0} clicks
          </span>
        </div>
      ))}
    </div>
  );
}
