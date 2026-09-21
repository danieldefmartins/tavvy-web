import { TEMPLATES, Template } from '../../config/eCardTemplates';

export const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  business: ['biz-traditional', 'biz-modern', 'biz-minimalist', 'business-card', 'pro-card', 'pro-corporate', 'pro-creative', 'cover-card', 'mobile-business', 'pro-realtor', 'church', 'full-width'],
  personal: ['basic', 'blogger', 'full-width', 'premium-static', 'pro-realtor', 'church', 'cover-card'],
  politician: ['civic-card', 'civic-card-flag', 'civic-card-bold', 'civic-card-clean', 'civic-card-rally', 'politician-generic'],
};
export function templateCardType(id: string): 'business' | 'personal' | 'politician' {
  return BROWSE_CATEGORIES.find(category=>(category.templates as readonly string[]).includes(id))?.purpose || 'business';
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

/** Browse taxonomy is separate from the three persisted card_type values. */
export const BROWSE_CATEGORIES = [
  {id:'business-services',purpose:'business',label:'Business & Services',templates:['biz-traditional','biz-modern','biz-minimalist','business-card','pro-card','pro-corporate','pro-creative']},
  {id:'personal-creators',purpose:'personal',label:'Personal & Creators',templates:['basic','blogger','cover-card','premium-static']},
  {id:'food-mobile',purpose:'business',label:'Food & Mobile Businesses',templates:['full-width','mobile-business']},
  {id:'real-estate',purpose:'business',label:'Real Estate',templates:['pro-realtor']},
  {id:'faith-community',purpose:'business',label:'Faith & Community',templates:['church']},
  {id:'politics-public-service',purpose:'politician',label:'Politics & Public Service',templates:['civic-card','civic-card-flag','civic-card-bold','civic-card-clean','civic-card-rally','politician-generic']},
] as const;
export type BrowsePlan = 'all' | 'free' | 'pro';
export function browseCategoryForTemplate(id:string): string {
  return BROWSE_CATEGORIES.find(category=>(category.templates as readonly string[]).includes(id))?.id || 'business-services';
}
export function browseCategoryForCardType(type:string): string {
  return type==='politician'?'politics-public-service':type==='personal'?'personal-creators':'business-services';
}
export function isFreeDesign(template:Template):boolean {
  return !template.isPremium && template.colorSchemes.some(scheme=>scheme.isFree===true);
}
export function templatesForBrowse(category:string,plan:BrowsePlan='all'):Template[] {
  const ids=BROWSE_CATEGORIES.find(item=>item.id===category)?.templates as readonly string[]|undefined;
  const legacy=TEMPLATE_CATEGORIES[category];
  return TEMPLATES.filter(template=>(ids?ids.includes(template.id):legacy?legacy.includes(template.id):category==='all') &&
    (plan==='all'||(plan==='free'?isFreeDesign(template):!isFreeDesign(template))));
}
/** Select within the chosen category, even if its only choices are locked; never reuse a different category's design. */
export function firstBrowseSelection(category:string,isPro:boolean,preferred?:string,plan:BrowsePlan='all') {
  const templates=templatesForBrowse(category,plan);
  const template=templates.find(item=>item.id===preferred)||templates.find(item=>isPro||isFreeDesign(item))||templates[0];
  if(!template)return null;
  const scheme=template.colorSchemes.find(item=>plan==='free'?canUseTemplate(template,item.id,false):isPro||canUseTemplate(template,item.id,false))||template.colorSchemes[0];
  return readTemplateSelection(template.id,scheme.id);
}
