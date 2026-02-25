/**
 * ProBanner — upgrade CTA for non-pro users on the stats page.
 */

import React from 'react';
import { useRouter } from 'next/router';

interface ProBannerProps {
  isDark: boolean;
}

export default function ProBanner({ isDark }: ProBannerProps) {
  const router = useRouter();
  const { locale } = router;

  return (
    <div style={{
      padding: 20, borderRadius: 14, textAlign: 'center', marginBottom: 20,
      backgroundColor: isDark ? '#1E293B' : '#FFF9E6',
    }}>
      <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: isDark ? '#fff' : '#333' }}>
        Unlock Advanced Analytics
      </h4>
      <p style={{ fontSize: 13, margin: '0 0 16px', color: isDark ? '#94A3B8' : '#6B7280' }}>
        See detailed click tracking, visitor locations, and more with Pro
      </p>
      <button
        onClick={() => router.push('/app/ecard/premium', undefined, { locale })}
        style={{
          background: '#00C853',
          border: 'none',
          padding: '12px 24px',
          borderRadius: 10,
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}
