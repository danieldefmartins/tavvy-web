import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useThemeContext } from '../../contexts/ThemeContext';

/** A recoverable page-read failure. No card content, account access or writes. */
export default function PublicCardUnavailable() {
  const { t } = useTranslation('common');
  const { isDark } = useThemeContext();
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: isDark ? '#111118' : '#F7F6F8', color: isDark ? '#F5F3F7' : '#211827' }}>
      <Head><title>{`${t('errors.generic')} | Tavvy`}</title><meta name="robots" content="noindex" /></Head>
      <section role="alert" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Tavvy</p>
        <h1 style={{ fontSize: 26, lineHeight: 1.25 }}>{t('errors.generic')}</h1>
        <p style={{ lineHeight: 1.6 }}>{t('errors.serverError')}</p>
        <button type="button" onClick={() => window.location.reload()} style={{ minHeight: 48, padding: '12px 28px', border: 0, borderRadius: 12, background: '#7B18A5', color: '#FFF', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>{t('common.retry')}</button>
        <p><Link href="/app" style={{ color: isDark ? '#D7B9F0' : '#67218A', display: 'inline-block', padding: 12 }}>{t('navigation.home')}</Link></p>
      </section>
    </main>
  );
}
