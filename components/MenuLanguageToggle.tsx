/**
 * MenuLanguageToggle - Compact language switcher for menu pages
 * Shows EN | PT | ES pill buttons with globe icon
 */

import React from 'react';
import { useRouter } from 'next/router';

const MENU_LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
  { code: 'es', label: 'ES' },
];

interface MenuLanguageToggleProps {
  variant?: 'light' | 'dark';
}

export default function MenuLanguageToggle({ variant = 'light' }: MenuLanguageToggleProps) {
  const router = useRouter();
  const currentLocale = router.locale || 'en';

  const handleLocaleChange = (locale: string) => {
    router.push(router.asPath, router.asPath, { locale });
  };

  const isDark = variant === 'dark';

  return (
    <div className="menu-lang-toggle">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isDark ? '#aaa' : '#666'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="menu-lang-globe"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {MENU_LOCALES.map((loc) => (
        <button
          key={loc.code}
          className={`menu-lang-btn ${currentLocale === loc.code ? 'active' : ''} ${isDark ? 'dark' : ''}`}
          onClick={() => handleLocaleChange(loc.code)}
        >
          {loc.label}
        </button>
      ))}

      <style jsx>{`
        .menu-lang-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .menu-lang-globe {
          margin-right: 4px;
          flex-shrink: 0;
        }
        .menu-lang-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background: ${isDark ? '#1a1a1a' : '#f3f3f3'};
          color: ${isDark ? '#888' : '#666'};
        }
        .menu-lang-btn.active {
          background: #8A05BE;
          color: #fff;
        }
        .menu-lang-btn.dark {
          background: #1a1a1a;
          color: #888;
        }
        .menu-lang-btn.dark.active {
          background: #8A05BE;
          color: #fff;
        }
        .menu-lang-btn:hover:not(.active) {
          background: ${isDark ? '#222' : '#e8e8e8'};
        }
      `}</style>
    </div>
  );
}
