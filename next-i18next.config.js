/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'tr', 'hi', 'id', 'th', 'vi', 'nl'],
    localeDetection: true,
  },
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales') 
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
