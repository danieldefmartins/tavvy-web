import { TEMPLATES, Template } from '../../config/eCardTemplates';

export const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  business: ['biz-traditional', 'biz-modern', 'biz-minimalist', 'business-card', 'pro-card', 'pro-corporate', 'pro-creative', 'cover-card', 'mobile-business'],
  personal: ['basic', 'blogger', 'full-width', 'premium-static', 'pro-realtor', 'church'],
  politician: ['civic-card', 'civic-card-flag', 'civic-card-bold', 'civic-card-clean', 'civic-card-rally', 'politician-generic'],
};
export function templateCardType(id: string): 'business' | 'personal' | 'politician' {
  return TEMPLATE_CATEGORIES.politician.includes(id) ? 'politician' : TEMPLATE_CATEGORIES.personal.includes(id) ? 'personal' : 'business';
}
/** Query parameters select catalog IDs only. They never provide customer fields. */
export function readTemplateSelection(templateId: unknown, schemeId: unknown) {
  if (typeof templateId !== 'string') return null;
  const template = TEMPLATES.find(item => item.id === templateId);
  if (!template) return null;
  const scheme = template.colorSchemes.find(item => item.id === schemeId) || template.colorSchemes[0];
  return scheme ? { template, scheme, cardType: templateCardType(template.id) } : null;
}
export function canUseTemplate(template: Template, schemeId: string | null | undefined, isPro: boolean) {
  const scheme = template.colorSchemes.find(item => item.id === schemeId);
  return !!scheme && (isPro || (!template.isPremium && scheme.isFree === true));
}
export function templateSelectionPath(templateId: string, schemeId: string) {
  return `/app/ecard/new?template=${encodeURIComponent(templateId)}&scheme=${encodeURIComponent(schemeId)}`;
}
/** Rebase only helper-owned example assets; never change external links or customer media. */
export function localExampleAssets<T>(value: T, origin: string): T {
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (url.origin === 'https://tavvy.com' && (url.pathname.startsWith('/images/ecard-examples/') || url.pathname === '/images/brazil-flag-vertical.jpg' ||
        (url.pathname === '/_next/image' && url.searchParams.get('url')?.startsWith('/images/ecard-examples/')))) {
        return `${origin}${url.pathname}${url.search}${url.hash}` as T;
      }
    } catch { /* Non-URL text is unchanged. */ }
    return value;
  }
  if (Array.isArray(value)) return value.map(item => localExampleAssets(item, origin)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localExampleAssets(item, origin)])) as T;
  return value;
}
