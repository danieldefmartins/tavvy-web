import { Html, Head, Main, NextScript, DocumentProps } from 'next/document';

// RTL languages supported by Tavvy
const RTL_LOCALES = ['ar'];

export default function Document(props: DocumentProps) {
  const locale = props.__NEXT_DATA__?.locale || 'en';
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
