/**
 * ECardIframePreview — renders the live card page in an iframe for 100% visual parity.
 * Falls back to CardPreview for draft/unpublished cards that don't have a live URL yet.
 */

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
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

const ECardIframePreview = forwardRef<ECardIframePreviewHandle, ECardIframePreviewProps>(
  ({ slug, isPublished, fallbackCard, fallbackLinks, height = 580 }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [cacheBuster, setCacheBuster] = useState(0);

    const canUseIframe = isPublished && slug && !slug.startsWith('draft_');

    const reload = useCallback(() => {
      if (canUseIframe) {
        setCacheBuster(Date.now());
        setLoading(true);
      }
    }, [canUseIframe]);

    useImperativeHandle(ref, () => ({ reload }), [reload]);

    const iframeSrc = canUseIframe
      ? `/${slug}?preview=1${cacheBuster ? `&t=${cacheBuster}` : ''}`
      : '';

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
          src={iframeSrc}
          sandbox="allow-same-origin"
          onLoad={() => setLoading(false)}
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
