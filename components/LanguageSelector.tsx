import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useThemeContext } from '../contexts/ThemeContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
];

interface LanguageSelectorProps {
  className?: string;
  showNativeName?: boolean;
}

export default function LanguageSelector({ 
  className = '', 
  showNativeName = true 
}: LanguageSelectorProps) {
  const router = useRouter();
  const { locale } = router;
  const { i18n } = useTranslation();
  const { isDark } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(l => l.code === router.locale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: languageCode });
    setIsOpen(false);
  };

  return (
    <div className={className} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: isDark ? '#1f2937' : '#f3f4f6',
          color: isDark ? '#fff' : '#111827',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <svg
          width={16}
          height={16}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: 8,
            right: 0,
            width: 192,
            maxHeight: 256,
            overflowY: 'auto',
            background: isDark ? '#111827' : '#fff',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            zIndex: 50,
          }}
        >
          {languages.map((language) => {
            const active = language.code === router.locale;
            return (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  background: active ? (isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff') : 'transparent',
                  color: active ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#e5e7eb' : '#111827'),
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 500 }}>{language.nativeName}</span>
                {showNativeName && language.name !== language.nativeName && (
                  <span style={{ color: isDark ? '#9ca3af' : '#6b7280', marginLeft: 8 }}>
                    ({language.name})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
