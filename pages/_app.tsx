import 'leaflet/dist/leaflet.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import PlaceShareHead from '../components/PlaceShareHead';
import { DEMO_PLACE_SHARE } from '../lib/placeShareMetadata';
import { useRouter } from 'next/router';
import { useAppNavigationHistory } from '../hooks/useAppNavigationHistory';
import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '../contexts/AuthContext';
import { ProAuthProvider } from '../contexts/ProAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/globals.css';
import '../styles/place-details.css';

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
  const initialLocaleRef = useRef<string | null>(null);
  const hasProcessedRef = useRef(false);
  useEffect(() => {
    if (!router.isReady || hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    let saved: string | null = null;
    try { saved = localStorage.getItem('tavvy-locale'); } catch { /* Storage may be unavailable in private contexts. */ }
    const preferred = saved && SUPPORTED_LOCALES.includes(saved) ? saved : detectBrowserLanguage();
    initialLocaleRef.current = preferred;
    if (preferred !== locale) {
      void router.replace({ pathname, query }, asPath, { locale: preferred }).catch(() => {
        // Keep the current route usable if loading the selected language fails.
        initialLocaleRef.current = null;
      });
    } else {
      initialLocaleRef.current = null;
      try { localStorage.setItem('tavvy-locale', preferred); } catch { /* Preference still works for this session. */ }
    }
  }, [router.isReady]); // Initial preference is restored once, not on each navigation.

  useEffect(() => {
    if (!locale) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    // Do not overwrite the chosen language with the old route while replacement is pending.
    if (initialLocaleRef.current && locale !== initialLocaleRef.current) return;
    if (!hasProcessedRef.current) return;
    initialLocaleRef.current = null;
    try { localStorage.setItem('tavvy-locale', locale); } catch { /* Non-persistent environments remain usable. */ }
  }, [locale]);
  return null;
}

function App({ Component, pageProps }: AppProps) {
  useAppNavigationHistory();
  const pageRoute = useRouter().pathname;
  const placePreview = pageProps.placeShare || (pageRoute === '/app/demo/restaurant' ? DEMO_PLACE_SHARE : null);
  // PWA freshness: when a NEW service worker takes over (i.e. a new deploy),
  // reload once so users get the fresh version instead of the old cached page.
  // Guarded on an existing controller so first-install does NOT trigger a reload.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (!navigator.serviceWorker.controller) return; // first install — nothing stale to replace
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#17013A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon-source.png" />

        {/* Default Meta Tags — pages can override these with their own <Head> */}
        <title>Tavvy — Real Experiences, Not Fake Stars</title>
        <meta name="title" content="Tavvy — Real Experiences, Not Fake Stars" key="title" />
        <meta name="description" content="Stop guessing with meaningless star ratings. Tavvy shows you real signals from real people — what's actually great, the vibe, and what to watch out for." key="description" />

        {/* Default Open Graph / Facebook — overridden by page-level <Head> for eCards, places, etc. */}
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:url" content="https://tavvy.com/" key="og:url" />
        <meta property="og:title" content="Tavvy — Real Experiences, Not Fake Stars" key="og:title" />
        <meta property="og:description" content="Stop guessing with meaningless star ratings. Tavvy shows you real signals from real people — what's actually great, the vibe, and what to watch out for." key="og:description" />
        <meta property="og:image" content="https://tavvy.com/og-image.png" key="og:image" />
        {!placePreview && <meta property="og:image:width" content="1200" key="og:image:width" />}
        {!placePreview && <meta property="og:image:height" content="630" key="og:image:height" />}
        <meta property="og:site_name" content="Tavvy" key="og:site_name" />

        {/* Default Twitter — overridden by page-level <Head> for eCards, places, etc. */}
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:url" content="https://tavvy.com/" key="twitter:url" />
        <meta name="twitter:title" content="Tavvy - Discover. Review. Explore." key="twitter:title" />
        <meta name="twitter:description" content="Discover restaurants, cafes, bars, and more near you. Real reviews from real people. Your local guide to the best spots." key="twitter:description" />
        <meta name="twitter:image" content="https://files.manuscdn.com/user_upload_by_module/session_file/310519663313028198/XIYZzUZRGypYoHEu.png" key="twitter:image" />
      </Head>
      {/* Preview tags must render before providers that wait for client hydration. */}
      {placePreview && <PlaceShareHead metadata={placePreview} />}
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
