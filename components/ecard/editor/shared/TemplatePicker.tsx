/** The same real 9:16 renderer used by the public gallery and creation wizard. */
import React from 'react';
import { useReleaseCopy } from '../../../../hooks/useReleaseCopy';
import { TEMPLATES } from '../../../../config/eCardTemplates';
import { TEMPLATE_CATEGORIES, canUseTemplate } from '../../../../lib/ecard/templateSelection';
import TemplateExamplePreview from '../../shared/TemplateExamplePreview';
import { IoLockClosed } from 'react-icons/io5';
interface TemplatePickerProps {
  selectedTemplateId: string;
  onSelect: (templateId: string, colorSchemeId?: string) => void;
  isPro: boolean; isDark?: boolean; filterCategory?: string;
}
export default function TemplatePicker({ selectedTemplateId, onSelect, isPro, isDark = false, filterCategory }: TemplatePickerProps) {
  const copy = useReleaseCopy();
  const category = filterCategory ? TEMPLATE_CATEGORIES[filterCategory] : undefined;
  const filtered = category ? TEMPLATES.filter(template => category.includes(template.id)) : TEMPLATES;
  return <div aria-label={copy('Card designs')} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x proximity', padding: '4px 3px 12px' }}>
    {filtered.map(template => {
      const selected = selectedTemplateId === template.id;
      const scheme = template.colorSchemes.find(item => isPro || item.isFree) || template.colorSchemes[0];
      const locked = !canUseTemplate(template, scheme?.id, isPro);
      return <div key={template.id} style={{ flex: '0 0 180px', scrollSnapAlign: 'start', position: 'relative', padding: 8, borderRadius: 18, border: `2px solid ${selected ? '#8A05BE' : isDark ? '#41404a' : '#d6d3dd'}`, background: isDark ? '#211e29' : '#fff', color: isDark ? '#fff' : '#26212d' }}>
        <div aria-hidden="true" {...({ inert: '' } as any)} style={{ pointerEvents: 'none' }}><TemplateExamplePreview template={template} schemeId={scheme?.id}/></div>
        <button type="button" aria-label={`${template.name} · ${locked ? copy('Pro required') : template.isPremium ? 'Pro' : copy('Free')}`} aria-pressed={selected} aria-disabled={locked} onClick={() => { if (!locked && scheme) onSelect(template.id, scheme.id); }} style={{ position: 'absolute', inset: 0, border: 0, borderRadius: 16, background: 'transparent', cursor: locked ? 'not-allowed' : 'pointer' }} />
        <span style={{ position: 'absolute', top: 14, right: 14, pointerEvents: 'none', padding: '5px 8px', borderRadius: 8, background: '#211e29', color: '#fff', fontSize: 11 }}>{locked && <IoLockClosed aria-hidden="true"/>} {template.isPremium ? 'Pro' : copy('Free')}</span>
        <div style={{ textAlign: 'center', pointerEvents: 'none', fontSize: 13, fontWeight: 650 }}>{selected ? '✓ ' : ''}{template.name}</div>
      </div>;
    })}
  </div>;
}
