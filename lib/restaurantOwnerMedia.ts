import { isPlaceId } from './restaurantOwner';
import { StoryPublishError, storyErrorMessage } from './storyPublishing';
export interface OwnerPhoto { id: string; url: string; caption: string | null; media_path: string; created_at?: string; is_owner_photo?: boolean; place_id?: string; status?: string }
export interface OwnerStory { id: string; media_url: string; media_type: 'image' | 'video'; caption?: string | null; media_path?: string; story_kind: 'customer' | 'owner_highlight'; created_at?: string; expires_at?: string; is_permanent?: boolean }
export interface OwnerHighlight { id: string; title: string; is_active: boolean; position: number; stories: OwnerStory[] }
export interface OwnerMediaPage { place: { id: string; name: string; cover_image_url: string | null }; photos: OwnerPhoto[]; stories: OwnerStory[]; highlights: OwnerHighlight[]; totals: { photos: number; stories: number; highlights: number }; nextOffset: number; hasMore: boolean; maxPhotoBytes: number }
const messages: Record<string, string> = {
  PHOTO_AUTH_REQUIRED: 'Sign in to manage restaurant photos.', PHOTO_OWNER_REQUIRED: 'Verified restaurant ownership is required to manage this media.',
  PHOTO_PLACE_UNAVAILABLE: 'This restaurant is not available for media changes.', PHOTO_ACCOUNT_RESTRICTED: 'Photo publishing is restricted for this account.',
  PHOTO_AUTHOR_REQUIRED: 'You can manage only photos uploaded by your own account.', PHOTO_ASSET_NOT_OWNED: 'This upload could not be matched to your account and restaurant.',
  PHOTO_CAPTION_TOO_LONG: 'Use a caption of up to 500 characters.', PHOTO_UPLOAD_INCOMPLETE: 'The photo upload did not finish. Please choose it again.',
  PHOTO_TOO_LARGE: 'Choose a photo smaller than 10 MB.', PHOTO_TYPE_INVALID: 'Choose a JPEG, PNG, WebP or HEIC photo.',
  PHOTO_RETRY_MISMATCH: 'This upload was already used. Choose new media for a different photo.', PHOTO_METADATA_INVALID: 'The photo could not be saved. Please choose it again.',
};
export function ownerMediaError(error: any): string {
  const key = Object.keys(messages).find(name => String(error?.message || error).includes(name));
  return key ? messages[key] : 'Your restaurant media could not be updated. Please try again.';
}
export async function getOwnerMedia(db: any, placeId: string, offset = 0): Promise<OwnerMediaPage> {
  if (!isPlaceId(placeId)) throw new Error('Choose a restaurant first.');
  const { data, error } = await db.rpc('get_restaurant_owner_media', { p_place_id: placeId, p_offset: offset, p_limit: 24 });
  if (error) throw new Error(ownerMediaError(error));
  if (data?.place?.id !== placeId || !Array.isArray(data.photos) || !Array.isArray(data.stories) || !Array.isArray(data.highlights)) throw new Error('Your restaurant media could not be loaded. Try again.');
  return data;
}
export async function publishOwnerPhoto(db: any, placeId: string, mediaPath: string, caption: string): Promise<OwnerPhoto> {
  let failure: any;
  try {
    const { data, error } = await db.rpc('publish_restaurant_owner_photo', { p_place_id: placeId, p_media_path: mediaPath, p_caption: caption.trim() || null });
    if (!error && data?.id) return data;
    failure = error || new Error('Missing photo confirmation');
  } catch (error) { failure = error; }
  try {
    const { data, error } = await db.rpc('get_my_restaurant_photo_upload', { p_media_path: mediaPath });
    if (!error && data?.id) {
      if (data.place_id === placeId && data.status === 'live' && (data.caption || '') === caption.trim()) return data;
      throw new StoryPublishError(messages.PHOTO_RETRY_MISMATCH, true);
    }
  } catch (error) { if (error instanceof StoryPublishError) throw error; }
  if (String(failure?.message).includes('PHOTO_RETRY_MISMATCH')) throw new StoryPublishError(messages.PHOTO_RETRY_MISMATCH, true);
  if (!/^(P0|22|23|40|42)/.test(failure?.code || '')) throw new StoryPublishError('We could not confirm whether your photo saved. Keep this screen open and tap Upload again to safely retry.', true);
  let cleanupFailed = false;
  try { cleanupFailed = !!(await db.storage.from('place-photos').remove([mediaPath])).error; } catch { cleanupFailed = true; }
  throw new StoryPublishError(ownerMediaError(failure) + (cleanupFailed ? ' Your upload was kept for a retry.' : ''), cleanupFailed, cleanupFailed);
}
export async function setOwnerCover(db: any, placeId: string, photoId: string): Promise<void> {
  const { error } = await db.rpc('set_restaurant_owner_cover', { p_place_id: placeId, p_photo_id: photoId });
  if (error) throw new Error(ownerMediaError(error));
}
export async function removeOwnerPhoto(db: any, placeId: string, photoId: string): Promise<void> {
  const { data, error } = await db.rpc('remove_restaurant_owner_photo', { p_place_id: placeId, p_photo_id: photoId });
  if (error || data?.id !== photoId) throw new Error(ownerMediaError(error));
  if (data.media_path) { try { await db.storage.from('place-photos').remove([data.media_path]); } catch {} }
}
export async function removeOwnerStory(db: any, story: OwnerStory): Promise<void> {
  const { data, error } = await db.rpc('delete_my_place_story', { p_story_id: story.id });
  if (error || data !== true) throw new Error(storyErrorMessage(error));
  if (story.media_path) { try { await db.storage.from('place-stories').remove([story.media_path]); } catch {} }
}
