import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function EcardRedirect() {
  const { t } = useTranslation();
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/ecard');
  }, [router]);
  return null;
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
