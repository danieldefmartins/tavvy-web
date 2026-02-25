/**
 * useAutoSave — watches dirty state in the editor context,
 * debounces for 2 seconds, then uploads pending files and saves card + links.
 *
 * Also provides a manual save function for the fallback button.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useEditor } from './EditorContext';
import {
  updateCard,
  saveCardLinks,
  uploadProfilePhoto,
  uploadEcardFile,
  CardData,
} from '../ecard';
import { getTemplateById } from '../../config/eCardTemplates';

interface UseAutoSaveOptions {
  userId: string | undefined;
  isPro: boolean;
  debounceMs?: number;
}

export function useAutoSave({ userId, isPro, debounceMs = 2000 }: UseAutoSaveOptions) {
  const { state, dispatch } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Core save logic
  const performSave = useCallback(async () => {
    const { card, links, pendingUploads } = state;
    if (!card.id || !userId) return;

    // Validate template access
    const tpl = getTemplateById(card.template_id || 'basic');
    if (tpl?.isPremium && !isPro) return;

    dispatch({ type: 'MARK_SAVING' });

    try {
      // 1. Upload pending files
      let photoUrl = card.profile_photo_url;
      if (pendingUploads['profile_photo']) {
        const uploaded = await uploadProfilePhoto(userId, pendingUploads['profile_photo']);
        if (uploaded) photoUrl = uploaded;
      }

      let bannerUrl = card.banner_image_url;
      if (pendingUploads['banner_image']) {
        const uploaded = await uploadEcardFile(userId, pendingUploads['banner_image'], 'banner');
        if (uploaded) bannerUrl = uploaded;
      }

      let logoUrl = (card as any).company_logo_url;
      if (pendingUploads['company_logo']) {
        const uploaded = await uploadEcardFile(userId, pendingUploads['company_logo'], 'logo');
        if (uploaded) logoUrl = uploaded;
      }

      // Upload gallery images
      const galleryImages = [];
      for (const img of card.gallery_images || []) {
        const pendingKey = `gallery_${img.id}`;
        if (pendingUploads[pendingKey]) {
          const url = await uploadEcardFile(userId, pendingUploads[pendingKey], 'gallery');
          if (url) galleryImages.push({ id: img.id, url, caption: '' });
        } else if (img.url && !img.url.startsWith('blob:')) {
          galleryImages.push({ id: img.id, url: img.url, caption: '' });
        }
      }

      // 2. Build update payload — never save blob: URLs
      const cleanUrl = (url: string | undefined | null) =>
        url && !url.startsWith('blob:') ? url : undefined;

      const updatePayload: Partial<CardData> = {
        full_name: (card.full_name || '').trim(),
        title: card.title || undefined,
        bio: card.bio || undefined,
        email: card.email || undefined,
        phone: card.phone || undefined,
        website: card.website || undefined,
        website_label: card.website_label || undefined,
        city: card.city || undefined,
        address_1: card.address_1 || undefined,
        address_2: card.address_2 || undefined,
        zip_code: card.zip_code || undefined,
        profile_photo_url: cleanUrl(photoUrl),
        profile_photo_size: card.profile_photo_size || 'medium',
        gradient_color_1: card.gradient_color_1 || '#667eea',
        gradient_color_2: card.gradient_color_2 || '#764ba2',
        theme: card.theme || 'classic',
        template_id: card.template_id,
        color_scheme_id: card.color_scheme_id,
        button_style: card.button_style || 'fill',
        font_style: card.font_style || 'default',
        font_color: card.font_color || null,
        banner_image_url: cleanUrl(bannerUrl) || null,
        featured_socials: card.featured_socials || [],
        gallery_images: galleryImages,
        videos: card.videos || [],
        show_contact_info: card.show_contact_info !== false,
        show_social_icons: card.show_social_icons !== false,
        pronouns: card.pronouns || undefined,
        description: card.description || undefined,
        // Civic fields
        ballot_number: card.ballot_number || undefined,
        party_name: card.party_name || undefined,
        office_running_for: card.office_running_for || undefined,
        election_year: card.election_year || undefined,
        campaign_slogan: card.campaign_slogan || undefined,
        region: card.region || undefined,
      };

      // Include company_logo_url via spread since it's not in the CardData interface
      const fullPayload = {
        ...updatePayload,
        company_logo_url: cleanUrl(logoUrl) || null,
      };

      // 3. Save card + links
      await updateCard(card.id, fullPayload as any);
      await saveCardLinks(card.id, links);

      if (isMountedRef.current) {
        dispatch({ type: 'CLEAR_ALL_PENDING_UPLOADS' });
        dispatch({ type: 'MARK_SAVED' });
      }
    } catch (err) {
      console.error('[useAutoSave] Save failed:', err);
      if (isMountedRef.current) {
        dispatch({ type: 'MARK_SAVE_ERROR' });
      }
    }
  }, [state, userId, isPro, dispatch]);

  // Auto-save on dirty state changes
  useEffect(() => {
    if (!state.isDirty || state.isSaving || !state.card.id) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isDirty, state.isSaving, state.card.id, debounceMs, performSave]);

  // Manual save (bypasses debounce)
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    performSave();
  }, [performSave]);

  return {
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    saveNow,
  };
}
