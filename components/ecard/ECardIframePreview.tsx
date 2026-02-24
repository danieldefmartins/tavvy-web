/**
 * ECardIframePreview — fetches the live card's SSR HTML and renders it
 * in an iframe via srcdoc. This avoids all client-side JS issues (locale
 * redirects, auth, hydration) that plague the src= approach.
 * Falls back to CardPreview for draft/unpublished cards.
 */

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
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

const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

const ECardIframePreview = forwardRef<ECardIframePreviewHandle, ECardIframePreviewProps>(
  ({ slug, isPublished, fallbackCard, fallbackLinks, height = 580 }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    const canUseIframe = isPublished && slug && !slug.startsWith('draft_');

    const fetchHtml = useCallback(async () => {
      if (!canUseIframe || !slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/${slug}?preview=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let html = await res.text();
        // Strip all script tags to prevent any JS from running
        html = html.replace(SCRIPT_TAG_RE, '');
        setHtmlContent(html);
      } catch (err) {
        console.error('[ECardIframePreview] Failed to fetch card HTML:', err);
      } finally {
        setLoading(false);
      }
    }, [canUseIframe, slug]);

    useEffect(() => {
      fetchHtml();
    }, [fetchHtml, fetchKey]);

    const reload = useCallback(() => {
      setFetchKey(Date.now());
    }, []);

    useImperativeHandle(ref, () => ({ reload }), [reload]);

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

        {htmlContent && (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            sandbox="allow-same-origin"
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
        )}

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
