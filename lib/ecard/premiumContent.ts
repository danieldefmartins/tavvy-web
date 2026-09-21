/** Shared, pure classification for the four approved Pro extras. Never changes card data. */
export type ProExtra = 'gallery' | 'video' | 'form' | 'credentials';
export const PRO_EXTRA_LABELS: Record<ProExtra, string> = {
  gallery: 'Gallery photos', video: 'Embedded videos', form: 'Contact forms', credentials: 'Professional credentials',
};
const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;
function parsed(value: unknown): any {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}
const isDisabled = (value: any): boolean => record(value) && (value.enabled === false || value.is_active === false || value.visible === false);
function mediaItems(value: unknown): any[] { const data = parsed(value); return Array.isArray(data) ? data : []; }
function hasMedia(value: unknown, keys: string[]): boolean {
  // Card gallery/video renderers do not support per-item visibility flags.
  return mediaItems(value).some(item => text(item) || record(item) && keys.some(key => text(item[key])));
}
/** False/zero defaults and metadata alone do not request a professional credential. */
export function hasCredentialContent(value: unknown): boolean {
  const data = parsed(value);
  if (isDisabled(data)) return false;
  if (typeof data === 'string') return data.trim().length > 0;
  if (Array.isArray(data)) return data.some(hasCredentialContent);
  if (record(data)) return Object.entries(data).some(([key, entry]) => {
    if (['id', 'type', 'enabled', 'is_active', 'visible', 'sort_order', 'created_at', 'updated_at'].includes(key)) return false;
    // A license value such as "0" is still text; numeric yearsInBusiness: 0 is a default.
    if (typeof entry === 'string') return entry.trim().length > 0;
    return hasCredentialContent(entry);
  });
  return data === true || typeof data === 'number' && data > 0;
}
/** Public cards render a default contact form for any object, including {}. */
export function hasEnabledForm(value: unknown): boolean {
  const data = parsed(value);
  return data === true || record(data) && data.enabled !== false;
}
export function getProExtras(card: Record<string, any> | null | undefined): ProExtra[] {
  if (!card) return [];
  const found = new Set<ProExtra>();
  if (hasMedia(card.gallery_images ?? card.galleryImages, ['url', 'uri'])) found.add('gallery');
  if (hasMedia(card.videos, ['url', 'uri', 'videoId', 'video_id']) || [card.youtube_video_id, card.youtubeVideoId, card.youtube_video_url, card.youtubeVideoUrl].some(text)) found.add('video');
  if (hasEnabledForm(card.form_block ?? card.formBlock)) found.add('form');
  if (hasCredentialContent(card.pro_credentials ?? card.proCredentials)) found.add('credentials');
  for (const block of mediaItems(card.blocks)) {
    if (!record(block) || isDisabled(block)) continue;
    const content = parsed(block.data ?? block.content ?? block);
    if (isDisabled(content)) continue;
    if (block.type === 'gallery' && hasMedia(content?.images ?? content?.gallery_images ?? content, ['url', 'uri'])) found.add('gallery');
    if (['video', 'youtube'].includes(block.type) && (text(content) || record(content) && ['url', 'uri', 'videoId', 'video_id', 'youtube_video_id', 'youtube_video_url'].some(key => text(content[key])))) found.add('video');
    if (block.type === 'form' && hasEnabledForm(content)) found.add('form');
    if (block.type === 'credentials' && hasCredentialContent(content?.credentials ?? content?.pro_credentials ?? content)) found.add('credentials');
  }
  return (['gallery', 'video', 'form', 'credentials'] as const).filter(extra => found.has(extra));
}
export function hasProExtras(card: Record<string, any> | null | undefined): boolean { return getProExtras(card).length > 0; }
