/** Local visual preview only. No card reads, writes, publication, or credentials. */
export const ECARD_PREVIEW_MESSAGE = 'tavvy-ecard-preview';
export const ECARD_PREVIEW_READY = 'tavvy-ecard-preview-ready';
const MAX_MESSAGE = 1024 * 1024;
const unsafeScheme = /^[a-z][a-z0-9+.-]*:/i;
export function safePreviewUrl(value: unknown, media = false): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || /[\u0000-\u001f]/.test(text)) return '';
  if (/^https?:\/\//i.test(text)) { try { const url = new URL(text); return url.username || url.password ? '' : text; } catch { return ''; } }
  if (!media && /^(mailto:|tel:)/i.test(text)) return text;
  if (media) return '';
  return unsafeScheme.test(text) || text.startsWith('//') ? '' : text;
}
function clean(value: any, key = '', depth = 0): any {
  if (depth > 12) throw new Error('Preview content is too deeply nested.');
  if (typeof value === 'string') {
    if (value.length > 20000) throw new Error('Preview content is too large.');
    if (/(url|uri|src)$/i.test(key)) return safePreviewUrl(value, /photo|image|banner|logo|thumbnail|background|uri|src/i.test(key));
    return value;
  }
  if (Array.isArray(value)) { if (key !== 'links' && value.length > 500) throw new Error('Preview contains too many items.'); return value.map(item => clean(item, key, depth + 1)); }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const name of Object.keys(value)) {
      if (['__proto__', 'constructor', 'prototype', 'access_token', 'refresh_token'].includes(name)) continue;
      result[name] = clean(value[name], name, depth + 1);
    }
    return result;
  }
  return value;
}
const isRecord = (value: any): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const hasTextFields = (value: any, fields: string[]) => isRecord(value) && fields.every(key => value[key] == null || typeof value[key] === 'string');
/** Normalize old serialized JSON, then reject shapes the public renderer cannot safely display. */
function validPreviewCard(card: Record<string, any>): boolean {
  const textFields = ['id', 'slug', 'full_name', 'title', 'title_role', 'company', 'bio', 'description', 'pronouns', 'phone', 'email', 'website', 'website_label', 'address', 'address_1', 'address_2', 'address1', 'address2', 'city', 'state', 'zip_code', 'zipCode', 'country', 'template_id', 'color_scheme_id', 'gradient_color_1', 'gradient_color_2', 'profile_photo_url', 'profile_photo_size', 'background_type', 'background_image_url', 'background_video_url', 'banner_image_url', 'company_logo_url', 'theme', 'font_style', 'font_color', 'button_style', 'button_color', 'icon_color', 'social_icon_color', 'professional_category', 'ballot_number', 'party_name', 'office_running_for', 'campaign_slogan', 'region', 'youtube_video_id', 'youtube_title', 'gallery_title', 'testimonials_title', 'menu_title', 'card_name', 'badge_approval_status'];
  const socialFields = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'whatsapp'].map(name => `social_${name}`);
  if (!hasTextFields(card, [...textFields, ...socialFields])) return false;
  if (card.election_year != null && !['string', 'number'].includes(typeof card.election_year)) return false;
  for (const key of ['gallery_images', 'videos', 'blocks', 'industry_icons', 'featured_icons', 'featured_socials', 'testimonials', 'menu_items', 'form_block', 'pro_credentials', 'qr_style']) {
    if (typeof card[key] === 'string') card[key] = JSON.parse(card[key]);
  }
  for (const key of ['gallery_images', 'videos', 'blocks', 'industry_icons', 'featured_icons', 'featured_socials', 'testimonials', 'menu_items']) {
    if (card[key] != null && !Array.isArray(card[key])) return false;
  }
  if (card.gallery_images?.some((item: any) => !hasTextFields(item, ['id', 'url', 'uri', 'caption']))) return false;
  if (card.videos?.some((item: any) => !hasTextFields(item, ['type', 'url', 'thumbnail_url', 'title']) || typeof item.url !== 'string')) return false;
  if (card.featured_socials?.some((item: any) => typeof item !== 'string' && (!hasTextFields(item, ['platform', 'url']) || typeof item.platform !== 'string'))) return false;
  if (card.testimonials?.some((item: any) => !hasTextFields(item, ['id', 'customerName', 'customerPhoto', 'reviewText', 'source', 'date']) || (item.rating != null && typeof item.rating !== 'number'))) return false;
  if (card.menu_items?.some((category: any) => !hasTextFields(category, ['category', 'emoji']) || !Array.isArray(category.items) || category.items.some((item: any) => !hasTextFields(item, ['name', 'description', 'image_url']) || (item.price != null && !['string', 'number'].includes(typeof item.price))))) return false;
  const form = card.form_block;
  if (form != null && form !== false && form !== true) {
    if (!hasTextFields(form, ['formType', 'title', 'description', 'buttonText', 'successMessage', 'embedUrl', 'webhookUrl', 'ghlWebhookUrl', 'ghlEmbedCode'])) return false;
    if (form.fields != null && (!Array.isArray(form.fields) || form.fields.some((field: any) => !hasTextFields(field, ['id', 'type', 'label', 'placeholder'])))) return false;
  }
  return true;
}
export function parseECardPreviewMessage(input: unknown): { card: any; links: any[] } | null {
  try {
    const raw = typeof input === 'string' ? input : JSON.stringify(input);
    if (!raw || raw.length > MAX_MESSAGE) return null;
    const data = JSON.parse(raw);
    if (data?.type !== ECARD_PREVIEW_MESSAGE || !data.card || typeof data.card !== 'object' || Array.isArray(data.card) || typeof data.card.full_name !== 'string' || !Array.isArray(data.links)) return null;
    if (!validPreviewCard(data.card)) return null;
    if (data.links.some((link: any) => !link || typeof link !== 'object' || typeof link.url !== 'string' || (link.title != null && typeof link.title !== 'string'))) return null;
    const result = clean({ card: data.card, links: data.links });
    // The bridge never forwards authentication data or performs card actions.
    result.links = result.links.filter((link: any) => link.is_active === undefined || link.is_active === true);
    return result;
  } catch { return null; }
}
export function createECardPreviewMessage(card: unknown, links: unknown[]): string {
  const parsed = parseECardPreviewMessage({ type: ECARD_PREVIEW_MESSAGE, card, links });
  if (!parsed) throw new Error('This preview could not be prepared. Your changes remain in the editor.');
  return JSON.stringify({ type: ECARD_PREVIEW_MESSAGE, ...parsed });
}

export function isECardPreviewEventAllowed(origin: string, sourceIsSelfOrNull: boolean, pageOrigin: string, hasNativeBridge: boolean): boolean {
  if (!sourceIsSelfOrNull) return false;
  if (origin === pageOrigin) return true;
  return hasNativeBridge && (!origin || origin === 'null');
}
