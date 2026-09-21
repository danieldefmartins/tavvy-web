/** Shared authenticated story contract. Kept identical on web and mobile. */
export type StoryKind = 'customer' | 'owner_highlight';
export interface StoryLocation { latitude: number; longitude: number }
export interface PublishedStory {
  id: string; place_id: string; user_id: string; media_path: string; media_url: string;
  media_type: 'image' | 'video'; story_kind: StoryKind; caption?: string; tags: string[];
  thumbnail_url?: string; status: 'active' | 'deleted' | 'reported'; is_permanent: boolean;
  created_at: string; updated_at: string; expires_at: string;
}
export interface StoryPublishInput {
  placeId: string; mediaPath: string; mediaType: 'image' | 'video'; kind: StoryKind;
  caption?: string; tags?: string[]; location?: StoryLocation | null; universeId?: string | null;
}
export interface StoryAccess { allowed: boolean; expiry_hours: number; daily_limit: number;
  place_daily_limit: number; radius_meters: number; max_media_bytes: number }
export interface StoryClient {
  rpc(name: string, args?: Record<string, unknown>): any;
  storage: { from(bucket: string): { remove(paths: string[]): PromiseLike<{ error: any }> } };
}
const messages: Record<string, string> = {
  STORY_AUTH_REQUIRED: 'Sign in to post a story.',
  STORY_ACCOUNT_RESTRICTED: 'Story publishing is temporarily restricted for your account.',
  STORY_PLACE_INVALID: 'This place is not available for stories yet. Choose a place saved on Tavvy.',
  STORY_KIND_INVALID: 'Choose a customer story or restaurant highlight.',
  STORY_DAILY_LIMIT: 'You have reached the story limit for the last 24 hours. Try again later.',
  STORY_PLACE_LIMIT: 'You have reached the story limit for this place in the last 24 hours.',
  STORY_OWNER_REQUIRED: 'A verified restaurant owner account is required to publish highlights.',
  STORY_LOCATION_REQUIRED: 'Allow location access to share a customer story from this place.',
  STORY_PLACE_LOCATION_MISSING: 'This place needs a map location before customer stories can be posted.',
  STORY_OUTSIDE_RADIUS: 'Move closer to this place to share a customer story.',
  STORY_MEDIA_NOT_OWNED: 'This upload could not be matched to your account and this place. Choose the media again.',
  STORY_MEDIA_METADATA_MISSING: 'The upload is incomplete. Choose the media again.',
  STORY_MEDIA_TYPE_INVALID: 'Choose a JPEG, PNG, WebP, HEIC, MP4, MOV or WebM file.',
  STORY_MEDIA_TOO_LARGE: 'Choose a photo or video smaller than 50 MB.',
  STORY_TEXT_TOO_LONG: 'Use a caption of up to 500 characters and no more than 20 short tags.',
  STORY_UNIVERSE_INVALID: 'This place does not belong to the selected collection.',
  STORY_RETRY_MISMATCH: 'This media was already published with different details. Choose new media for another story.',
  STORY_NO_LONGER_ACTIVE: 'This story is no longer active.',
  STORY_AUTHOR_REQUIRED: 'Only the person who posted this story can delete it.',
  STORY_REPORT_REASON_INVALID: 'Choose a reason for reporting this story.',
  STORY_HIGHLIGHT_TITLE_INVALID: 'Enter a highlight title of up to 80 characters.',
  STORY_HIGHLIGHT_LIMIT: 'Choose up to 30 stories for a highlight.',
  STORY_HIGHLIGHT_CONTENT_INVALID: 'Highlights can include active restaurant stories from this place only.',
  STORY_HIGHLIGHT_NOT_FOUND: 'This highlight is no longer available.',
};
export function storyErrorMessage(error: any): string {
  const text = typeof error === 'string' ? error : String(error?.message || '');
  const code = Object.keys(messages).find(key => text.includes(key));
  if (code) return messages[code];
  if (error?.code === '42883' || error?.code === 'PGRST202' || error?.code === '42501')
    return 'Story publishing is being updated. Please try again shortly.';
  return 'We could not finish this story request. Check your connection and try again.';
}
export class StoryPublishError extends Error {
  constructor(message: string, public keepUpload: boolean = false, public cleanupFailed: boolean = false) {
    super(message); this.name = 'StoryPublishError';
  }
}
export async function getStoryPublishAccess(client: StoryClient, placeId?: string | null,
  kind: StoryKind = 'customer', location?: StoryLocation | null, requireLocation = true): Promise<StoryAccess> {
  const { data, error } = await client.rpc('get_story_publish_access', {
    p_place_id: placeId || null, p_story_kind: kind, p_latitude: location?.latitude ?? null,
    p_longitude: location?.longitude ?? null, p_require_location: requireLocation,
  });
  if (error) throw new Error(storyErrorMessage(error));
  if (!data?.allowed) throw new Error(storyErrorMessage(null));
  return data;
}
export async function hasStoryOwnerAccess(client: StoryClient, placeId: string): Promise<boolean> {
  const { data, error } = await client.rpc('has_verified_restaurant_claim', { p_place_id: placeId });
  return !error && data === true;
}
/** Publish once per uploaded path. A transport failure may occur after commit;
 * reconcile before deleting media so we never break a successfully posted story. */
export async function publishUploadedStory(client: StoryClient, input: StoryPublishInput): Promise<PublishedStory> {
  const tags = [...new Set([...(input.tags || []), ...(input.caption?.match(new RegExp('#[\\p{L}\\p{N}_]+', 'gu')) || [])
    .map(tag => tag.slice(1).toLowerCase())])];
  let failure: any;
  try {
    const { data, error } = await client.rpc('publish_place_story', {
      p_place_id: input.placeId, p_media_path: input.mediaPath, p_media_type: input.mediaType,
      p_story_kind: input.kind, p_caption: input.caption?.trim() || null, p_tags: tags,
      p_latitude: input.location?.latitude ?? null, p_longitude: input.location?.longitude ?? null,
      p_universe_id: input.universeId || null,
    });
    if (!error && data?.id) return data;
    failure = error || new Error('Missing publish response');
  } catch (error) { failure = error; }
  // A database error confirms the transaction did not commit. Network/PostgREST
  // response failures do not: retain the path for a safe idempotent retry.
  const databaseRejection = /^(P0|22|23|40|42)/.test(failure?.code || '');
  try {
    const { data, error } = await client.rpc('get_my_story_by_media', { p_media_path: input.mediaPath });
    if (!error && data?.id) {
      if (data.place_id === input.placeId && data.story_kind === input.kind && data.status === 'active'
        && data.media_type === input.mediaType && (data.universe_id || null) === (input.universeId || null)
        && JSON.stringify(data.tags || []) === JSON.stringify(tags)
        && (data.caption || '') === (input.caption?.trim() || '')) return data;
      throw new StoryPublishError(storyErrorMessage({ message: 'STORY_RETRY_MISMATCH' }), true);
    }
  } catch (error) { if (error instanceof StoryPublishError) throw error; }
  if (String(failure?.message).includes('STORY_RETRY_MISMATCH') || String(failure?.message).includes('STORY_NO_LONGER_ACTIVE'))
    throw new StoryPublishError(storyErrorMessage(failure), true);
  if (!databaseRejection) throw new StoryPublishError(
    'We could not confirm whether your story posted. Keep this screen open and tap Post again to safely retry.', true);
  let cleanupFailed = false;
  try { cleanupFailed = !!(await client.storage.from('place-stories').remove([input.mediaPath])).error; }
  catch { cleanupFailed = true; }
  throw new StoryPublishError(storyErrorMessage(failure) + (cleanupFailed ? ' Your upload was kept for a retry.' : ''), cleanupFailed, cleanupFailed);
}
export function storyMediaDetails(fileName: string, suppliedMime = ''): { mime: string; extension: string; type: 'image' | 'video' } | null {
  const mimeByExtension: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
  const extension = fileName.split(/[?#]/)[0].split('.').pop()?.toLowerCase() || '';
  const mime = suppliedMime || mimeByExtension[extension];
  if (!mime || !Object.values(mimeByExtension).includes(mime)) return null;
  const canonicalExtension = Object.keys(mimeByExtension).find(ext => mimeByExtension[ext] === mime)!;
  return { mime, extension: canonicalExtension, type: mime.startsWith('video/') ? 'video' : 'image' };
}
export async function saveOwnerHighlight(client: StoryClient, placeId: string, title: string,
  storyIds?: string[], id?: string, active = true): Promise<any> {
  const { data, error } = await client.rpc('save_owner_story_highlight', { p_place_id: placeId,
    p_highlight_id: id || null, p_title: title, p_story_ids: storyIds ?? null, p_is_active: active });
  if (error) throw new Error(storyErrorMessage(error));
  return data;
}
export async function deleteOwnerHighlight(client: StoryClient, id: string): Promise<void> {
  const { error } = await client.rpc('delete_owner_story_highlight', { p_highlight_id: id });
  if (error) throw new Error(storyErrorMessage(error));
}
