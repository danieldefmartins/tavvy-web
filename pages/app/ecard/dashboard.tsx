/**
 * Backward-compat redirect: /app/ecard/dashboard?cardId=X → /app/ecard/X/edit
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function DashboardRedirect() {
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    if (!router.isReady) return;
    const { cardId } = router.query;
    if (cardId && typeof cardId === 'string') {
      router.replace(`/app/ecard/${cardId}/edit`, undefined, { locale });
    } else {
      router.replace('/app/ecard', undefined, { locale });
    }
  }, [router.isReady, router.query, locale]);

  return null;
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
