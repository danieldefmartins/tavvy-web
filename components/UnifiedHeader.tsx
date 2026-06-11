'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, ChevronLeft, User, MoreHorizontal } from 'lucide-react';

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
  const colors = SCREEN_COLORS[screenKey];
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

  const iconBtnStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        width: '100%',
        background: `linear-gradient(135deg, ${colors.start} 0%, ${colors.end} 100%)`,
      }}
    >
      {/* Row 1: Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px' }}>
        {showBackButton ? (
          <button onClick={handleBack} aria-label="Go back" style={iconBtnStyle}>
            <ChevronLeft size={24} color="#fff" />
          </button>
        ) : (
          <div style={{ width: 44, height: 44 }} />
        )}

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            flex: 1,
            padding: '0 8px',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>

        <button
          onClick={handleProfilePress}
          aria-label={rightIcon === 'menu' ? 'Open menu' : 'Profile'}
          style={iconBtnStyle}
        >
          {rightIcon === 'menu' ? (
            <MoreHorizontal size={28} color="#fff" />
          ) : (
            <User size={28} color="#fff" />
          )}
        </button>
      </div>

      {/* Row 2: Search Bar */}
      {showSearch && (
        <div style={{ padding: '0 16px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              borderRadius: 12,
              height: 44,
              padding: '0 12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Search size={20} color="#9ca3af" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: '#1f2937',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedHeader;
