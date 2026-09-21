/** A real mobile viewport using the same public renderer and current editor data. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { CardData, LinkItem } from '../../lib/ecard';
import { mapPublicCard } from '../../lib/ecard/publicCardMapping';
import { createECardPreviewMessage, ECARD_PREVIEW_READY } from '../../lib/ecard/previewBridge';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import PublicCardView from './PublicCardView';

const SCREEN_WIDTH = 360;
const SCREEN_HEIGHT = 640;

/** Used only inside the isolated preview page. No phone frame or nested iframe. */
export function CardPreviewContent({ card, links }: { card: CardData; links: LinkItem[] }) {
  const data = mapPublicCard(card, links.filter(link => link.is_active !== false && link.is_active !== null));
  const block = (event: React.SyntheticEvent) => { event.preventDefault(); event.stopPropagation(); };
  return <div data-card-preview="true" style={{ position: 'relative', isolation: 'isolate' }}
    onClickCapture={block} onAuxClickCapture={block} onContextMenuCapture={block} onSubmitCapture={block}
    onKeyDownCapture={event => {
      if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement).closest('a,button,input,textarea,select')) block(event);
    }}>
    <PublicCardView cardData={data} error={null} previewOnly />
  </div>;
}

export default function CardPreview({ card, links, maxHeight }: { card: CardData; links: LinkItem[]; maxHeight?: number }) {
  const copy = useReleaseCopy();
  const { locale, defaultLocale } = useRouter();
  const frame = useRef<HTMLIFrameElement>(null), screen = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1), [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [version, setVersion] = useState(0);
  const payload = useMemo(() => {
    try { return createECardPreviewMessage(card, links); } catch { return null; }
  }, [card, links]);
  const source = `${locale && locale !== defaultLocale ? `/${locale}` : ''}/app/ecard/studio-preview`;
  const send = useCallback(() => {
    if (payload) frame.current?.contentWindow?.postMessage(payload, window.location.origin);
  }, [payload]);

  const sendLatest = useRef(send); sendLatest.current = send;
  useEffect(() => {
    const element = screen.current;
    if (!element) return;
    const resize = () => setScale(element.clientWidth / SCREEN_WIDTH);
    resize();
    const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setReady(false); setFailed(false);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data !== ECARD_PREVIEW_READY) return;
      window.clearTimeout(timer); setReady(true); setFailed(false); sendLatest.current();
    };
    window.addEventListener('message', receive);
    const timer = window.setTimeout(() => setFailed(true), 15000);
    return () => { window.removeEventListener('message', receive); window.clearTimeout(timer); };
  }, [source, version]);
  useEffect(() => { if (ready) send(); }, [ready, send]);

  return <figure className="phone-preview" data-phone-preview="true" style={maxHeight ? { maxWidth: Math.min(376, Math.max(180, (maxHeight - 18) * 9 / 16 + 18)) } : undefined}>
    <div className="phone-shell">
      <div className="phone-screen" ref={screen} data-phone-screen="true" aria-busy={!ready && !failed}>
        {payload && <iframe key={`${source}-${version}`} ref={frame} src={source} title={copy('9:16 phone preview')}
          width={SCREEN_WIDTH} height={SCREEN_HEIGHT} tabIndex={0} onLoad={send}
          onFocus={() => { try { frame.current?.contentDocument?.querySelector<HTMLElement>('[data-preview-scroll]')?.focus({ preventScroll: true }); } catch {} }} onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', visibility: ready ? 'visible' : 'hidden' }} />}
        {(!ready || !payload) && <div className="preview-state" role="status">
          <p>{!payload ? copy('This preview could not be prepared. Return to Edit to continue.') : failed ? copy('The preview could not load. Your changes are still in the editor.') : copy('Loading preview…')}</p>
          {failed && payload && <button type="button" onClick={() => { setReady(false); setFailed(false); setVersion(value => value + 1); }}>{copy('Retry preview')}</button>}
        </div>}
      </div>
    </div>
    <figcaption><strong>{copy('Phone preview')} · 9:16</strong><span>{copy('Scroll inside to see the full card')}</span></figcaption>
    <style jsx>{`
      .phone-preview{width:100%;max-width:min(376px,calc(max(360px,100dvh - 290px)*9/16 + 18px));margin:0 auto;color:var(--studio-muted,#64748b)}
      .phone-shell{padding:8px;background:#16181e;border:1px solid #555963;border-radius:36px;box-shadow:0 14px 36px #0002,0 2px 7px #0003;box-sizing:border-box}
      .phone-screen{position:relative;aspect-ratio:9/16;width:100%;overflow:hidden;border-radius:27px;background:#fff;isolation:isolate}
      .preview-state{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;color:#475569;background:#f8fafc;text-align:center;font:14px/1.5 system-ui}
      .preview-state button{min-height:44px;padding:10px 16px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;font:inherit;cursor:pointer}
      .phone-preview :global(:focus-visible){outline:3px solid #9f67c5;outline-offset:-3px}
      figcaption{display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:14px;text-align:center;font:12px/1.4 system-ui}
      figcaption strong{font-weight:600}
      @media(max-width:800px){.phone-preview{max-width:348px}}
    `}</style>
  </figure>;
}
