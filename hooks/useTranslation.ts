import { useTranslation as useI18nTranslation } from 'next-i18next';

/**
 * Custom hook wrapper for translations
 * Provides type-safe access to translation functions
 */
export function useTranslation(namespace: string = 'common') {
  const { t, i18n, ready } = useI18nTranslation(namespace);

  const changeLanguage = async (locale: string) => {
    await i18n.changeLanguage(locale);
  };

  return {
    t,
    i18n,
    ready,
    locale: i18n.language,
    changeLanguage,
  };
}

export default useTranslation;
