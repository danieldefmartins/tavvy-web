/**
 * ECardIframePreview — loads the live card page in an iframe using src=.
 * Uses the parent page's locale in the URL so the iframe doesn't trigger
 * a locale redirect. Falls back to CardPreview for draft/unpublished cards.
 */

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/router';
import CardPreview from './CardPreview';
import { CardData, LinkItem } from '../../lib/ecard';

export interface ECardIframePreviewHandle {
  reload: () => void;
}

interface ECardIframePreviewProps {
  slug: string | null | undefined;
  isPublished: boolean;
  fallbackCard?: CardData | null;
  fallbackLinks?: LinkItem[];
  height?: number;
}

function buildPreviewUrl(slug: string, locale: string | undefined): string {
  const defaultLocale = 'en';
  const loc = locale || defaultLocale;
  // Default locale has no prefix in Next.js i18n
  const prefix = loc === defaultLocale ? '' : `/${loc}`;
  return `${prefix}/${slug}?preview=1`;
}

const ECardIframePreview = forwardRef<ECardIframePreviewHandle, ECardIframePreviewProps>(
  ({ slug, isPublished, fallbackCard, fallbackLinks, height = 580 }, ref) => {
    const router = useRouter();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [cacheBuster, setCacheBuster] = useState(0);

    const canUseIframe = isPublished && slug && !slug.startsWith('draft_');

    const reload = useCallback(() => {
      setCacheBuster(Date.now());
    }, []);

    useImperativeHandle(ref, () => ({ reload }), [reload]);

    const handleLoad = useCallback(() => {
      setLoading(false);
    }, []);

    // Draft / unpublished fallback
    if (!canUseIframe) {
      if (fallbackCard) {
        return (
          <div style={{ borderRadius: 16, overflow: 'hidden' }}>
            <CardPreview card={fallbackCard} links={fallbackLinks || []} />
          </div>
        );
      }
      return (
        <div style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: 14,
        }}>
          Publish your card to see a live preview
        </div>
      );
    }

    const baseUrl = buildPreviewUrl(slug!, router.locale);
    const iframeSrc = cacheBuster ? `${baseUrl}&t=${cacheBuster}` : baseUrl;

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 375, margin: '0 auto' }}>
        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 20,
            zIndex: 2,
          }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #E5E7EB',
              borderTopColor: '#00C853',
              borderRadius: '50%',
              animation: 'ecard-iframe-spin 0.8s linear infinite',
            }} />
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={cacheBuster}
          src={iframeSrc}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height,
            border: 'none',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            display: 'block',
          }}
          title="Card Preview"
        />

        <style jsx>{`
          @keyframes ecard-iframe-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
);

ECardIframePreview.displayName = 'ECardIframePreview';

export default ECardIframePreview;
