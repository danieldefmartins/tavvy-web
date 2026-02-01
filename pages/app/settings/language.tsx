/**
 * Language Settings Page
 * Allows users to change the app language
 * Following Tavvy V2 design system
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
];

export default function LanguageSettingsPage() {
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
    if (languageCode === selectedLanguage) return;
    
    setIsChanging(true);
    setSelectedLanguage(languageCode);
    
    // Store preference in localStorage
    localStorage.setItem('tavvy-language', languageCode);
    
    // Navigate to the same page with new locale
    const { pathname, asPath, query } = router;
    await router.push({ pathname, query }, asPath, { locale: languageCode });
    
    setIsChanging(false);
  };

  return (
    <>
      <Head>
        <title>Language | TavvY Settings</title>
        <meta name="description" content="Change your language preference" />
      </Head>

      <AppLayout>
        <div className="language-settings">
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <FiArrowLeft size={24} />
            </button>
            <h1>Language</h1>
            <div style={{ width: 24 }} />
          </header>

          <div className="content">
            <p className="description">
              Select your preferred language. The app will display content in your chosen language where translations are available.
            </p>

            <div className="languages-list">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className={`language-item ${selectedLanguage === language.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
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
