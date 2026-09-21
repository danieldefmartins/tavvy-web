/** Real phone previews; browsing a locked design never silently selects a different card. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReleaseCopy } from '../../../hooks/useReleaseCopy';
import { TEMPLATES } from '../../../config/eCardTemplates';
import { templatesForBrowse, BrowsePlan, isFreeDesign, canUseTemplate } from '../../../lib/ecard/templateSelection';
import TemplateExamplePreview from '../shared/TemplateExamplePreview';
interface TemplateGalleryProps {
  cardType: string; planFilter?: BrowsePlan; countryTemplate?: string; selectedTemplateId: string | null; selectedColorSchemeId: string | null;
  onSelect: (templateId: string, colorSchemeId: string) => void; onBack: () => void;
  isPro: boolean; isDark: boolean; onAvailabilityChange?: (available: boolean) => void;
}
export default function TemplateGallery({ cardType, planFilter='all', countryTemplate, selectedTemplateId, selectedColorSchemeId, onSelect, onBack, isPro, isDark, onAvailabilityChange }: TemplateGalleryProps) {
  const copy = useReleaseCopy();
  const templates = useMemo(() => {
    const filtered = templatesForBrowse(cardType,planFilter);
    return countryTemplate ? [...filtered.filter(template => template.id === countryTemplate), ...filtered.filter(template => template.id !== countryTemplate)] : filtered;
  }, [cardType, planFilter, countryTemplate]);
  const [index, setIndex] = useState(() => Math.max(0, templates.findIndex(template => template.id === selectedTemplateId)));
  const scroll = useRef<HTMLDivElement>(null), cards = useRef<(HTMLDivElement | null)[]>([]);
  const initialized = useRef(false);
  useEffect(() => {
    const initial = Math.max(0, templates.findIndex(template => template.id === selectedTemplateId));
    setIndex(initial);
    if (scroll.current && cards.current[initial]) scroll.current.scrollLeft = cards.current[initial]!.offsetLeft;
    initialized.current = true;
    // Parent remounts this carousel only when the category changes. Selection changes must not reset a swipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visible = templates[index];
  const schemeFor = (template: typeof TEMPLATES[number]) => template.id === selectedTemplateId
    ? template.colorSchemes.find(scheme => scheme.id === selectedColorSchemeId) || template.colorSchemes[0]
    : template.colorSchemes.find(scheme => isPro || scheme.isFree) || template.colorSchemes[0];
  const scheme = visible && schemeFor(visible);
  const available = !!visible && visible.id === selectedTemplateId && canUseTemplate(visible, selectedColorSchemeId, isPro);
  useEffect(() => { onAvailabilityChange?.(available); }, [available, onAvailabilityChange]);
  const chooseIndex = (next: number) => {
    const template = templates[next];
    if (!template) return;
    setIndex(next);
    const nextScheme = schemeFor(template);
    if (template.id !== selectedTemplateId && canUseTemplate(template, nextScheme?.id, isPro)) onSelect(template.id, nextScheme.id);
  };
  const move = (next: number) => {
    chooseIndex(next);
    scroll.current?.scrollTo({ left: cards.current[next]?.offsetLeft || 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return <div className={`template-gallery ${isDark ? 'dark' : ''}`}>
    <div className="gallery-heading"><div><h1>{copy('Choose your look')}</h1><p>{copy('Swipe through real phone previews.')}</p></div><button type="button" onClick={onBack}>{copy('Card type')}</button></div>
    {visible&&<div className="gallery-navigation"><button type="button" aria-label={copy('Previous template')} disabled={index === 0} onClick={() => move(index - 1)}>‹</button><div aria-live="polite"><strong>{visible?copy(visible.name):''}</strong><span>{templates.length?index + 1:0} / {templates.length}{visible?` · ${copy(isFreeDesign(visible)?'Free':'Pro')}`:''}</span></div><button type="button" aria-label={copy('Next template')} disabled={!templates.length || index >= templates.length - 1} onClick={() => move(index + 1)}>›</button></div>}
    <div className="template-gallery-scroll" ref={scroll} onScroll={() => {
      if (!initialized.current || !scroll.current) return;
      const left = scroll.current.scrollLeft;
      const nearest = cards.current.reduce((best, card, i) => card && Math.abs(card.offsetLeft - left) < Math.abs((cards.current[best]?.offsetLeft || 0) - left) ? i : best, 0);
      if (nearest !== index) chooseIndex(nearest);
    }}>
      {templates.map((template, i) => <div className="gallery-slide" key={template.id} ref={element => { cards.current[i] = element; }}><div className="gallery-phone"><TemplateExamplePreview template={template} schemeId={schemeFor(template)?.id}/></div></div>)}
    </div>
    {!visible&&<p role="status">{copy('No designs match these filters. Choose All plans or another category.')}</p>}
    <div className="gallery-dots" aria-label={copy('Browse templates')}>{templates.map((template, i) => <button type="button" key={template.id} aria-label={copy('Preview {{name}}').replace('{{name}}',template.name)} aria-pressed={index === i} onClick={() => move(i)}><span/></button>)}</div>
    {visible && <div className="schemes"><p>{copy('Color')} · <strong>{scheme?.name}</strong>{(visible.isPremium || !scheme?.isFree) && ' · Pro'}</p><div>{visible.colorSchemes.filter(color=>planFilter!=='free'||color.isFree===true).map(color => {
      const locked = !canUseTemplate(visible, color.id, isPro);
      return <button type="button" key={color.id} title={color.name} aria-label={`${color.name}${locked ? ' · Pro' : ''}`} aria-pressed={scheme?.id === color.id} aria-disabled={locked} onClick={() => { if (!locked) onSelect(visible.id, color.id); }} style={{ background: `linear-gradient(135deg,${color.primary},${color.secondary || color.primary})` }}>{locked && <span aria-hidden="true">Pro</span>}</button>;
    })}</div></div>}
    {visible&&isFreeDesign(visible)&&visible.colorSchemes.some(color=>!color.isFree)&&<p className="example-note">{copy('Free design. Some colors require Pro.')}</p>}
    {visible&&<p className="example-note">{copy(available ? 'Example content only. Your details will appear on your card.' : 'This design or color requires Pro. Choose a Free option to continue.')}</p>}
    <style jsx>{`.template-gallery{--text:#26212d;--muted:#655d6c;--panel:#fff;--line:#d8d1df;color:var(--text);min-width:0}.template-gallery.dark{--text:#f8f5fc;--muted:#bdb3c9;--panel:#211e29;--line:#504557}.gallery-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.gallery-heading h1{font-size:25px;letter-spacing:-.025em;margin:0 0 6px}.gallery-heading p{font-size:13px;color:var(--muted);margin:0}.template-gallery button{font:inherit;cursor:pointer;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:10px;min-height:44px;min-width:44px}.gallery-heading button{padding:8px 12px;font-size:13px}.gallery-navigation{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.gallery-navigation button{font-size:28px}.gallery-navigation button:disabled{opacity:.35;cursor:default}.gallery-navigation>div{display:flex;flex-direction:column;text-align:center;gap:4px}.gallery-navigation strong{font-size:15px}.gallery-navigation span{font-size:12px;color:var(--muted)}.template-gallery-scroll{position:relative;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;gap:16px}.template-gallery-scroll::-webkit-scrollbar{display:none}.gallery-slide{flex:0 0 100%;min-width:0;scroll-snap-align:center;display:flex;justify-content:center}.gallery-phone{position:relative;width:100%;max-width:min(330px,calc(clamp(260px,100dvh - 500px,520px)*9/16 + 18px))}.gallery-dots{display:flex;justify-content:center;flex-wrap:wrap;margin-top:8px;gap:0}.gallery-dots button{min-width:22px;min-height:28px;border:0;background:transparent;padding:7px}.gallery-dots span{display:block;width:7px;height:7px;background:var(--line);border-radius:5px}.gallery-dots button[aria-pressed=true] span{background:#8a05be}.schemes{text-align:center;margin-top:8px}.schemes p{font-size:12px;color:var(--muted);margin:0 0 10px}.schemes>div{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.schemes button{position:relative;width:44px;height:44px;border:3px solid transparent;box-shadow:0 0 0 1px var(--line)}.schemes button[aria-pressed=true]{box-shadow:0 0 0 2px #9b50bd;border-color:var(--panel)}.schemes button[aria-disabled=true]{cursor:not-allowed}.schemes button span{position:absolute;bottom:1px;right:1px;border-radius:4px;background:#211e29;color:#fff;padding:2px 3px;font-size:9px}.example-note{text-align:center;font-size:12px;line-height:1.5;color:var(--muted);margin:14px 0 0}`}</style>
  </div>;
}
