'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, ChevronLeft, User, MoreHorizontal } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

// Screen color configurations - matching mobile
export const SCREEN_COLORS = {
  universes: { start: '#8A05BE', end: '#14B8A6' },
  happeningNow: { start: '#F43F5E', end: '#FB7185' },
  realtors: { start: '#1E3A5F', end: '#2D4A6F' },
  pros: { start: '#059669', end: '#00C2CB' },
  atlas: { start: '#7C3AED', end: '#8A05BE' },
  cities: { start: '#EA580C', end: '#00C2CB' },
  wallet: { start: '#475569', end: '#64748B' },
  rvCamping: { start: '#166534', end: '#15803D' },
  rides: { start: '#D946EF', end: '#F472B6' },
} as const;

export type ScreenColorKey = keyof typeof SCREEN_COLORS;

interface UnifiedHeaderProps {
  screenKey: ScreenColorKey;
  title: string;
  searchPlaceholder: string;
  onSearch?: (text: string) => void;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  showSearch?: boolean;
  rightIcon?: 'profile' | 'menu';
  onRightIconPress?: () => void;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  screenKey,
  title,
  searchPlaceholder,
  onSearch,
  onProfilePress,
  showBackButton = true,
  showSearch = true,
  rightIcon = 'profile',
  onRightIconPress,
}) => {
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const accent = SCREEN_COLORS[screenKey];
  const [searchValue, setSearchValue] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else if (onRightIconPress) {
      onRightIconPress();
    } else {
      router.push('/profile', undefined, { locale });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const textColor = isDark ? '#fff' : '#17013A';
  const iconBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ width: '100%', background: isDark ? '#000' : '#fff', padding: '14px 16px 10px' }}>
      {/* Row 1: brand / back + profile — matches the home header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {showBackButton ? (
          <button onClick={handleBack} aria-label="Go back" style={iconBtnStyle}>
            <ChevronLeft size={22} color={textColor} />
          </button>
        ) : (
          <img
            src={isDark ? '/tavvy-logo-white.png' : '/tavvy-logo-dark.png'}
            alt="Tavvy"
            style={{ height: 26, width: 'auto' }}
          />
        )}

        <button
          onClick={handleProfilePress}
          aria-label={rightIcon === 'menu' ? 'Open menu' : 'Profile'}
          style={iconBtnStyle}
        >
          {rightIcon === 'menu' ? (
            <MoreHorizontal size={22} color={textColor} />
          ) : (
            <User size={22} color={textColor} />
          )}
        </button>
      </div>

      {/* Title with a per-screen accent dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: `linear-gradient(135deg, ${accent.start}, ${accent.end})`, flexShrink: 0 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: textColor, margin: 0, letterSpacing: -0.6 }}>
          {title}
        </h1>
      </div>

      {/* Search Bar — same dark surface style as the home page */}
      {showSearch && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(255,255,255,0.10)' : '#F5F5F5',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'transparent'}`,
            borderRadius: 16,
            height: 50,
            padding: '0 16px',
          }}
        >
          <Search size={20} color={isDark ? 'rgba(255,255,255,0.6)' : '#999'} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: textColor,
              background: 'transparent',
              border: 'none',
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedHeader;
