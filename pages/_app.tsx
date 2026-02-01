import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
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

// LocaleManager component to handle locale persistence
function LocaleManager() {
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;

  useEffect(() => {
    // Save locale to localStorage when it changes
    if (locale && typeof window !== 'undefined') {
      localStorage.setItem('tavvy-locale', locale);
    }
  }, [locale]);

  useEffect(() => {
    // On initial load, check if there's a saved locale and redirect if needed
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('tavvy-locale');
      
      // Only redirect if:
      // 1. There's a saved locale
      // 2. It's different from the current locale
      // 3. We're on the default locale (en)
      // 4. The URL doesn't already have a locale prefix
      if (savedLocale && savedLocale !== locale && locale === 'en' && !asPath.startsWith(`/${savedLocale}`)) {
        router.replace({ pathname, query }, asPath, { locale: savedLocale });
      }
    }
  }, []); // Only run once on mount

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
