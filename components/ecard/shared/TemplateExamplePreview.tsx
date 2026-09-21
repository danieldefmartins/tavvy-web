import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Template } from '../../../config/eCardTemplates';
import CardPreview from '../CardPreview';
import { templatePreviewData } from '../../../lib/ecard/templateExamples';
import { localExampleAssets } from '../../../lib/ecard/templateSelection';

/** Display-only, isolated public renderer. Offscreen examples release their iframe. */
export default function TemplateExamplePreview({ template, schemeId }: { template: Template; schemeId?: string | null }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    if (!container.current) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { rootMargin: '180px 80px', threshold: 0 });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const data = useMemo(() => localExampleAssets(templatePreviewData(template, schemeId), origin), [template, schemeId, origin]);
  return <div ref={container} data-template-example={template.id} data-scheme={schemeId || template.colorSchemes[0]?.id} style={{ width: '100%', minWidth: 0 }}>
    {visible && origin ? <CardPreview card={data.card as any} links={data.links as any} /> : <div aria-hidden="true" style={{ aspectRatio: '9 / 16', border: '8px solid #20212a', borderRadius: 30, background: '#e8e7ed', boxSizing: 'border-box', marginBottom: 36 }} />}
  </div>;
}
