'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, ChevronLeft, User, MoreHorizontal } from 'lucide-react';

// Screen color configurations - matching mobile
export const SCREEN_COLORS = {
  universes: { start: '#0EA5E9', end: '#14B8A6' },
  happeningNow: { start: '#F43F5E', end: '#FB7185' },
  realtors: { start: '#1E3A5F', end: '#2D4A6F' },
  pros: { start: '#059669', end: '#10B981' },
  atlas: { start: '#7C3AED', end: '#8B5CF6' },
  cities: { start: '#EA580C', end: '#F97316' },
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

  return (
    <div
      className="w-full"
      style={{
        background: `linear-gradient(135deg, ${colors.start} 0%, ${colors.end} 100%)`,
      }}
    >
      {/* Row 1: Navigation */}
      <div className="flex items-center justify-between h-14 px-4">
        {showBackButton ? (
          <button
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div className="w-11 h-11" />
        )}

        <h1 className="text-xl font-bold text-white text-center flex-1 truncate px-2">
          {title}
        </h1>

        <button
          onClick={handleProfilePress}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label={rightIcon === 'menu' ? 'Open menu' : 'Profile'}
        >
          {rightIcon === 'menu' ? (
            <MoreHorizontal className="w-7 h-7 text-white" />
          ) : (
            <User className="w-7 h-7 text-white" />
          )}
        </button>
      </div>

      {/* Row 2: Search Bar */}
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="flex items-center bg-white rounded-xl h-11 px-3 shadow-sm">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="flex-1 ml-2 text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedHeader;
