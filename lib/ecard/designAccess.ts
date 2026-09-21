import { getTemplateById } from '../../config/eCardTemplates';
type Design = { template_id?: string | null; color_scheme_id?: string | null; theme?: string | null };
const FREE_MIXED_PALETTES: Record<string, string> = { 'pro-realtor': 'warm-neutral', 'politician-generic': 'classic-blue' };
const PRO_THEMES = new Set(['elegant', 'ocean', 'sunset', 'forest']);
/** Existing Free-layout palettes retain their historical publication rights. New selections are gated by canUseTemplate. */
export function ecardDesignRequiresPro(card: Design): boolean {
 const id = card.template_id || 'basic';
 return !!getTemplateById(id)?.isPremium || (id in FREE_MIXED_PALETTES && card.color_scheme_id !== FREE_MIXED_PALETTES[id]) || PRO_THEMES.has(card.theme || '');
}
/** Editing existing saved content must not newly require a subscription. Server guards remain authoritative. */
export function ecardDesignChangeRequiresPro(next: Design, previous?: Design): boolean {
 const designChanged = !previous || next.template_id !== previous.template_id || next.color_scheme_id !== previous.color_scheme_id;
 const themeChanged = !previous || next.theme !== previous.theme;
 return (designChanged && ecardDesignRequiresPro({ ...next, theme: null })) || (themeChanged && PRO_THEMES.has(next.theme || ''));
}
