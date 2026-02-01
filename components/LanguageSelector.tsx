import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

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
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(l => l.code === router.locale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: languageCode });
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium">
          {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 max-h-64 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                language.code === router.locale
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : ''
              }`}
            >
              <span className="font-medium">{language.nativeName}</span>
              {showNativeName && language.name !== language.nativeName && (
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  ({language.name})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
