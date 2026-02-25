/**
 * Backward-compat redirect: /app/ecard/create → /app/ecard/new
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function CreateRedirect() {
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    if (!router.isReady) return;
    router.replace('/app/ecard/new', undefined, { locale });
  }, [router.isReady, locale]);

  return null;
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
