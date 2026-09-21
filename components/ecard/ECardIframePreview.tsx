/**
 * ECardIframePreview — renders a card preview using CardPreview component.
 * Uses the isolated actual renderer inside a9:16 phone viewport.
 * Draft data is sent locally to the same-origin preview page, never published.
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

    return <CardPreview card={fallbackCard} links={fallbackLinks || []} maxHeight={height} />;
  }
);

ECardIframePreview.displayName = 'ECardIframePreview';

export default ECardIframePreview;
