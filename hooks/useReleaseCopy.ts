import { useTranslation } from 'next-i18next';
import { RELEASE_COPY_KEYS, EXISTING_COPY_KEYS } from '../lib/releaseCopy';
/** Explicit UI copy only; user/place content must not be passed here. */
export function useReleaseCopy() {
 const { t, i18n } = useTranslation('common');
 return (message: string): string => {
  if ((i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] === 'en') return message;
  const releaseKey = RELEASE_COPY_KEYS[message];
  const key = releaseKey ? 'release.' + releaseKey : EXISTING_COPY_KEYS[message.toLowerCase()];
  return key ? String(t(key, { defaultValue: message })) : message;
 };
}
