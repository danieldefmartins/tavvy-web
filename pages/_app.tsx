import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '../contexts/AuthContext';
import { ProAuthProvider } from '../contexts/ProAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/globals.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Supported locale codes (must match next-i18next.config.js)
const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'tr', 'hi', 'id', 'th', 'vi', 'nl'];

/**
 * Detect the browser/device language.
 * Checks navigator.languages (ordered by user preference) and returns
 * the first one Tavvy supports.
 * 
 * Example: A user in Brazil with browser set to Portuguese → returns "pt"
 * Example: A user in the US with browser set to Spanish → returns "es"
 */
function detectBrowserLanguage(): string {
  try {
    // navigator.languages gives all preferred languages in order
    const browserLangs = navigator.languages || [navigator.language];
    for (const lang of browserLangs) {
      if (!lang) continue;
      const code = lang.split('-')[0].toLowerCase();
      if (SUPPORTED_LOCALES.includes(code)) {
        return code;
      }
    }
  } catch (e) {
    // Ignore errors in SSR or restricted environments
  }
  return 'en';
}

/**
 * LocaleManager - Handles locale persistence and auto-detection.
 * 
 * Priority:
 * 1. User's manual selection (saved in localStorage as 'tavvy-locale')
 * 2. Browser/device language (auto-detected on first visit)
 * 3. English (fallback)
 * 
 * On first visit (no saved locale):
 *   - Detects browser language
 *   - Saves it to localStorage
 *   - Redirects to that locale
 * 
 * On subsequent visits:
 *   - Restores saved locale from localStorage
 *   - If user manually changes language in Settings, that takes priority
 * 
 * IMPORTANT: The detection/restore effect runs FIRST (on mount), and only
 * after that does the save effect start persisting locale changes.
 * This prevents the save effect from overwriting a previously saved locale
 * with the server's default ('en') before detection can read it.
 */
function LocaleManager() {
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;
  const hasProcessedRef = useRef(false);
  // Track whether initial detection is complete before saving locale
  const detectionCompleteRef = useRef(false);

  // On initial load: restore saved locale OR auto-detect browser language
  // This MUST run before the save effect to prevent race conditions.
  useEffect(() => {
    if (typeof window === 'undefined' || hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Skip locale management entirely in iframe preview mode.
    // This prevents locale redirects from causing infinite reloads
    // when the card page is embedded in a preview iframe.
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') {
      detectionCompleteRef.current = true;
      return;
    }

    const savedLocale = localStorage.getItem('tavvy-locale');

    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
      // User has a saved preference (manual or previous auto-detect)
      detectionCompleteRef.current = true;
      if (savedLocale !== locale) {
        router.replace({ pathname, query }, asPath, { locale: savedLocale });
      }
      return;
    }

    // No saved preference — first visit
    // Auto-detect browser/device language
    const detectedLang = detectBrowserLanguage();
    localStorage.setItem('tavvy-locale', detectedLang);
    detectionCompleteRef.current = true;
    console.log(`[i18n] First visit: auto-detected browser language "${detectedLang}"`);

    if (detectedLang !== locale) {
      router.replace({ pathname, query }, asPath, { locale: detectedLang });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save locale to localStorage whenever it changes (from navigation or manual selection)
  // Only starts saving AFTER initial detection is complete to avoid overwriting
  // a saved preference with the server's default locale.
  useEffect(() => {
    if (locale && typeof window !== 'undefined' && detectionCompleteRef.current) {
      // Don't let iframe preview mode overwrite the user's saved locale
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === '1') return;
      localStorage.setItem('tavvy-locale', locale);
    }
  }, [locale]);

  return null;
}

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0F1233" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Default Meta Tags — pages can override these with their own <Head> */}
        <title>Tavvy - Discover. Review. Explore.</title>
        <meta name="title" content="Tavvy - Discover. Review. Explore." key="title" />
        <meta name="description" content="Discover restaurants, cafes, bars, and more near you. Real reviews from real people. Your local guide to the best spots." key="description" />

        {/* Default Open Graph / Facebook — overridden by page-level <Head> for eCards, places, etc. */}
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:url" content="https://tavvy.com/" key="og:url" />
        <meta property="og:title" content="Tavvy - Discover. Review. Explore." key="og:title" />
        <meta property="og:description" content="Discover restaurants, cafes, bars, and more near you. Real reviews from real people. Your local guide to the best spots." key="og:description" />
        <meta property="og:image" content="https://files.manuscdn.com/user_upload_by_module/session_file/310519663313028198/XIYZzUZRGypYoHEu.png" key="og:image" />
        <meta property="og:image:width" content="2752" key="og:image:width" />
        <meta property="og:image:height" content="1536" key="og:image:height" />
        <meta property="og:site_name" content="Tavvy" />

        {/* Default Twitter — overridden by page-level <Head> for eCards, places, etc. */}
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:url" content="https://tavvy.com/" key="twitter:url" />
        <meta name="twitter:title" content="Tavvy - Discover. Review. Explore." key="twitter:title" />
        <meta name="twitter:description" content="Discover restaurants, cafes, bars, and more near you. Real reviews from real people. Your local guide to the best spots." key="twitter:description" />
        <meta name="twitter:image" content="https://files.manuscdn.com/user_upload_by_module/session_file/310519663313028198/XIYZzUZRGypYoHEu.png" key="twitter:image" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProAuthProvider>
            <ThemeProvider>
              <LocaleManager />
              <Component {...pageProps} />
            </ThemeProvider>
          </ProAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App);
