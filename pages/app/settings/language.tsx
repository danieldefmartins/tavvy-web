/**
 * Language Settings Page
 * Allows users to change the app language
 * 
 * - Auto-detects browser language on first visit
 * - Manual selection persists to localStorage
 * - All text on this page is translated using t()
 * - Flags represent country/culture associations
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
];

export default function LanguageSettingsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isChanging, setIsChanging] = useState(false);

  // Get current locale from router
  useEffect(() => {
    if (router.locale) {
      setSelectedLanguage(router.locale);
    }
  }, [router.locale]);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === selectedLanguage || isChanging) return;
    
    setIsChanging(true);
    setSelectedLanguage(languageCode);
    
    // Store preference in localStorage (this is the "manual selection" that takes priority)
    localStorage.setItem('tavvy-locale', languageCode);
    
    // Navigate to the same page with new locale
    const { pathname, asPath, query } = router;
    await router.push({ pathname, query }, asPath, { locale: languageCode });
    
    setIsChanging(false);
  };

  const handleBack = () => {
    router.push('/app/settings', '/app/settings', { locale: router.locale });
  };

  return (
    <>
      <Head>
        <title>{t('settings.language')} | TavvY</title>
        <meta name="description" content={t('settings.languageDescription')} />
      </Head>

      <AppLayout>
        <div className="language-settings">
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={handleBack}>
              <FiArrowLeft size={24} />
            </button>
            <h1>{t('settings.language')}</h1>
            <div style={{ width: 24 }} />
          </header>

          <div className="content">
            <p className="description">
              {t('settings.languageDescription')}
            </p>

            <div className="languages-list">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className={`language-item ${selectedLanguage === language.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                  dir={language.rtl ? 'rtl' : 'ltr'}
                >
                  <div className="language-info">
                    <span className="flag">{language.flag}</span>
                    <div className="names">
                      <span className="native-name">{language.nativeName}</span>
                      {language.name !== language.nativeName && (
                        <span className="english-name">{language.name}</span>
                      )}
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <FiCheck size={20} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <style jsx>{`
            .language-settings {
              min-height: 100vh;
              background: ${isDark ? '#0a0a0f' : '#f5f5f7'};
              color: ${isDark ? '#ffffff' : '#1a1a2e'};
            }

            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: ${isDark ? '#0f1233' : '#ffffff'};
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              position: sticky;
              top: 0;
              z-index: 100;
            }

            .header h1 {
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }

            .back-btn {
              background: none;
              border: none;
              color: inherit;
              cursor: pointer;
              padding: 8px;
              margin: -8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .content {
              padding: 20px;
              padding-bottom: 100px;
            }

            .description {
              font-size: 14px;
              color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
              margin-bottom: 24px;
              line-height: 1.5;
            }

            .languages-list {
              display: flex;
              flex-direction: column;
              gap: 2px;
              background: ${isDark ? '#1a1a2e' : '#ffffff'};
              border-radius: 16px;
              overflow: hidden;
            }

            .language-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: transparent;
              border: none;
              color: inherit;
              cursor: pointer;
              width: 100%;
              text-align: left;
              transition: background 0.2s ease;
            }

            .language-item:hover {
              background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
            }

            .language-item.selected {
              background: ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
            }

            .language-item:disabled {
              opacity: 0.7;
              cursor: wait;
            }

            .language-info {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .flag {
              font-size: 28px;
              line-height: 1;
            }

            .names {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .native-name {
              font-size: 16px;
              font-weight: 500;
            }

            .english-name {
              font-size: 13px;
              color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
            }

            .check-icon {
              color: #3b82f6;
              flex-shrink: 0;
            }

            /* Dividers between items */
            .language-item:not(:last-child) {
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
