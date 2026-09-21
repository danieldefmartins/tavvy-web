import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AppLayout from '../../../components/AppLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { getAccountDeletionAvailability, createDeletionViewGuard, AccountDeletionAvailability } from '../../../lib/accountDeletion';
import { accountDeletionCopy } from '../../../lib/accountDeletionCopy';

export default function DeleteAccountPage() {
  const { user, session, loading } = useAuth();
  const { isDark } = useThemeContext();
  const { t, i18n } = useTranslation('common');
  const copy = accountDeletionCopy(i18n.resolvedLanguage || i18n.language);
  const [availability, setAvailability] = useState<AccountDeletionAvailability | null>(null);
  const guard = useRef(createDeletionViewGuard()).current;
  guard.setSession(user?.id ?? null, session?.access_token ?? null);
  useEffect(() => {
    guard.mount();
    const ticket = guard.begin();
    setAvailability(null);
    void getAccountDeletionAvailability().then(result => {
      if (guard.current(ticket)) setAvailability(result);
    });
    return () => guard.dispose();
  }, [guard, user?.id, session?.access_token]);
  return <AppLayout><Head><title>{copy.title} | Tavvy</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="delete-account">
      <Link href="/app/settings">← {copy.settings}</Link>
      <h1>{t('auth.deleteAccount', { defaultValue: copy.title })}</h1>
      {loading || !availability ? <p role="status">{copy.loading}</p> : <>
        <section className="deletion-status" aria-label={copy.title} data-deletion-status={availability.status}>
          <h2>{copy.unavailable}</h2>
          <p>{copy.unchanged}</p>
        </section>
        {!user && <p>{copy.guest} <Link href="/app/login?returnUrl=%2Fapp%2Fsettings%2Fdelete-account">{copy.signIn}</Link></p>}
      </>}
    </main>
    <style jsx>{`
      .delete-account { min-height: 70vh; max-width: 640px; margin: auto; padding: 28px 20px 110px; color: ${isDark ? '#FFFFFF' : '#17013A'}; }
      h1 { font-size: 28px; margin: 28px 0 20px; } h2 { font-size: 19px; line-height: 1.4; margin: 0 0 12px; }
      p { line-height: 1.6; margin-bottom: 0; } .deletion-status { padding: 20px; border-radius: 16px; background: ${isDark ? '#24143B' : '#F5F1FA'}; border: 1px solid ${isDark ? '#685376' : '#CCBED7'}; }
      .delete-account :global(a) { color: ${isDark ? '#43D8CA' : '#006B72'}; text-decoration: underline; }
      .delete-account :global(a:focus-visible) { outline: 3px solid #00C2CB; outline-offset: 4px; }
    `}</style>
  </AppLayout>;
}
export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}
