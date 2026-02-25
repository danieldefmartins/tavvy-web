/**
 * Backward-compat redirect: /app/ecard/preview?cardId=X → /app/ecard/X/preview
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PreviewRedirect() {
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    if (!router.isReady) return;
    const { cardId } = router.query;
    if (cardId && typeof cardId === 'string') {
      router.replace(`/app/ecard/${cardId}/preview`, undefined, { locale });
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
