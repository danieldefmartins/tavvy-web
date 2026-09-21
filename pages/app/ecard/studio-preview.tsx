import Head from 'next/head';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CardPreviewContent } from '../../../components/ecard/CardPreview';
import { ECARD_PREVIEW_READY, parseECardPreviewMessage, isECardPreviewEventAllowed } from '../../../lib/ecard/previewBridge';

export default function ECardStudioPreview() {
  const [preview, setPreview] = useState<ReturnType<typeof parseECardPreviewMessage>>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!isECardPreviewEventAllowed(event.origin, event.source === window || event.source == null || (window.parent !== window && event.source === window.parent && event.origin === window.location.origin), window.location.origin, !!(window as any).ReactNativeWebView)) return;
      const data = parseECardPreviewMessage(event.data);
      if (data) setPreview(data);
    };
    window.addEventListener('message', receive);
    document.addEventListener('message', receive as EventListener);
    (window as any).ReactNativeWebView?.postMessage(ECARD_PREVIEW_READY);
    if (window.parent !== window) window.parent.postMessage(ECARD_PREVIEW_READY, window.location.origin);
    return () => { window.removeEventListener('message', receive); document.removeEventListener('message', receive as EventListener); };
  }, []);
  return <><Head><title>Card preview | Tavvy</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main data-preview-scroll="true" tabIndex={0} aria-label="Card preview" onClickCapture={event => event.preventDefault()} onSubmitCapture={event => event.preventDefault()}>
      {preview ? <div style={{ pointerEvents: 'none' }}><CardPreviewContent card={preview.card} links={preview.links} /></div> : <p style={{ padding: 24, fontFamily: 'system-ui', color: '#64748b' }}>Preparing your card preview…</p>}
    </main><style jsx global>{`html,body,#__next{margin:0;height:100%;background:transparent;overflow:hidden}main{width:100%;height:100dvh;margin:0 auto;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;scrollbar-width:thin;scroll-behavior:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;outline:none}`}</style></>;
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
