/**
 * ECardIframePreview — renders a card preview using CardPreview component.
 * Originally used an iframe approach, but switched to direct rendering
 * to avoid locale redirect loops and SSR hydration issues.
 * Exposes a reload() method for API compatibility with the dashboard.
 */

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
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
    const [, setReloadKey] = useState(0);

    const reload = useCallback(() => {
      // Force re-render to pick up latest props
      setReloadKey(k => k + 1);
    }, []);

    useImperativeHandle(ref, () => ({ reload }), [reload]);

    if (!fallbackCard) {
      return (
        <div style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: 14,
        }}>
          {isPublished ? 'Loading preview...' : 'Publish your card to see a live preview'}
        </div>
      );
    }

    return (
      <div style={{
        width: '100%',
        maxWidth: 375,
        margin: '0 auto',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxHeight: height,
        overflowY: 'auto',
      }}>
        <CardPreview card={fallbackCard} links={fallbackLinks || []} />
      </div>
    );
  }
);

ECardIframePreview.displayName = 'ECardIframePreview';

export default ECardIframePreview;
