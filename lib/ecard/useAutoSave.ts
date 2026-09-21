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
import { ecardDesignChangeRequiresPro } from './designAccess';

interface UseAutoSaveOptions {
  userId: string | undefined;
  isPro: boolean;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({ userId, isPro, debounceMs = 2000, enabled = true }: UseAutoSaveOptions) {
  const { state, dispatch } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const latestState = useRef(state);
  latestState.current = state;
  const savedBadges = useRef({ cardId: state.card.id, card: state.card });
  if (savedBadges.current.cardId !== state.card.id) savedBadges.current = { cardId: state.card.id, card: state.card };

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
    if (inFlightRef.current) return false;
    if (!card.id || !userId) return false;

    // Preserve unchanged saved designs when a subscription changes.
    if (!isPro && ecardDesignChangeRequiresPro(card, savedBadges.current.card)) { dispatch({ type: 'MARK_SAVE_ERROR', error: 'This template requires an active Pro subscription.' }); return false; }
    inFlightRef.current = true;

    dispatch({ type: 'MARK_SAVING' });

    try {
      // 1. Upload pending files
      let photoUrl = card.profile_photo_url;
      if (pendingUploads['profile_photo']) {
        const uploaded = await uploadProfilePhoto(userId, pendingUploads['profile_photo']);
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        photoUrl = uploaded;
      }

      let bannerUrl = card.banner_image_url;
      if (pendingUploads['banner_image']) {
        const uploaded = await uploadEcardFile(userId, pendingUploads['banner_image'], 'banner');
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        bannerUrl = uploaded;
      }

      let logoUrl = (card as any).company_logo_url;
      if (pendingUploads['company_logo'] || pendingUploads['logo']) {
        const uploaded = await uploadEcardFile(userId, pendingUploads['company_logo'] || pendingUploads['logo'], 'logo');
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        logoUrl = uploaded;
      }

      // Upload gallery images
      const galleryImages = [];
      for (const img of card.gallery_images || []) {
        const pendingKey = `gallery_${img.id}`;
        if (pendingUploads[pendingKey]) {
          const url = await uploadEcardFile(userId, pendingUploads[pendingKey], 'gallery');
          if (!url) throw new Error('Gallery upload failed. Your changes remain unsaved.');
          galleryImages.push({ ...img, url, caption: img.caption || '' });
        } else {
          if (img.url?.startsWith('blob:') || (img as any).uri?.startsWith('blob:')) throw new Error('A gallery photo is still waiting to upload. Retry saving.');
          // Keep historical uri/captions/metadata intact on an unrelated edit.
          galleryImages.push({ ...img });
        }
      }

      // 2. Build update payload — never save blob: URLs
      const cleanUrl = (url: string | undefined | null) =>
        url && !url.startsWith('blob:') ? url : undefined;

      // Database clear operations intentionally use null; CardData models the
      // hydrated editor card and does not yet express nullable write fields.
      const updatePayload = {
        full_name: (card.full_name || '').trim(),
        title: card.title_role ?? card.title ?? null,
        company: card.company || null,
        state: card.state || null,
        country: card.country || null,
        bio: card.bio || null,
        email: card.email || null,
        phone: card.phone || null,
        website: card.website || null,
        website_label: card.website_label || null,
        city: card.city || null,
        address_1: card.address_1 || null,
        address_2: card.address_2 || null,
        zip_code: card.zip_code || null,
        profile_photo_url: cleanUrl(photoUrl) || null,
        profile_photo_size: card.profile_photo_size || 'medium',
        gradient_color_1: card.gradient_color_1 || '#667eea',
        gradient_color_2: card.gradient_color_2 || '#764ba2',
        theme: card.theme || 'classic',
        template_id: card.template_id,
        color_scheme_id: card.color_scheme_id,
        button_style: card.button_style || 'fill',
        button_color: card.button_color || null,
        icon_color: card.icon_color || null,
        social_icon_color: card.social_icon_color || null,
        font_style: card.font_style || 'default',
        font_color: card.font_color || null,
        banner_image_url: cleanUrl(bannerUrl) || null,
        featured_socials: card.featured_socials || [],
        gallery_images: galleryImages,
        videos: card.videos || [],
        show_contact_info: card.show_contact_info !== false,
        show_social_icons: card.show_social_icons !== false,
        pronouns: card.pronouns || null,
        description: card.description || null,
        business_type: card.business_type || null,
        form_block: card.form_block ?? null,
        background_type: card.background_type || 'gradient',
        // Professional badges & credentials
        show_licensed_badge: card.show_licensed_badge || false,
        show_insured_badge: card.show_insured_badge || false,
        show_bonded_badge: card.show_bonded_badge || false,
        show_tavvy_verified_badge: card.show_tavvy_verified_badge || false,
        pro_credentials: card.pro_credentials || null,
        professional_category: card.professional_category || null,
        // Civic fields
        ballot_number: card.ballot_number || null,
        party_name: card.party_name || null,
        office_running_for: card.office_running_for || null,
        election_year: card.election_year || null,
        campaign_slogan: card.campaign_slogan || null,
        region: card.region || null,
      };

      // Editing a name/link must not reset badges already reviewed by staff.
      // Newly requested badges retain the existing pending-review workflow.
      const badgeFields = ['show_licensed_badge', 'show_insured_badge', 'show_bonded_badge', 'show_tavvy_verified_badge'] as const;
      const newBadgeRequested = badgeFields.some(field => updatePayload[field] && !savedBadges.current.card[field]);

      // Include company_logo_url via spread since it's not in the CardData interface
      const fullPayload = {
        ...updatePayload,
        company_logo_url: cleanUrl(logoUrl) || null,
        ...(newBadgeRequested ? { badge_approval_status: 'pending' } : {}),
      };

      // 3. Save card + links
      if (!await updateCard(card.id, fullPayload as any)) throw new Error('Card save failed. Retry to save your changes.');
      if (!await saveCardLinks(card.id, links, { throwOnError: true })) throw new Error('Links could not be saved. Retry before publishing.');
      savedBadges.current = { cardId: card.id, card };

      if (isMountedRef.current) {
        dispatch({ type: 'SAVE_COMPLETED', snapshot: { card, links, pendingUploads }, persisted: fullPayload as Partial<CardData> });
      }
      return latestState.current.card === card && latestState.current.links === links && latestState.current.pendingUploads === pendingUploads;
    } catch (err) {
      console.error('[useAutoSave] Save failed:', err);
      if (isMountedRef.current) {
        dispatch({ type: 'MARK_SAVE_ERROR', error: err instanceof Error ? err.message : 'Save failed. Retry to save your changes.' });
      }
      return false;
    } finally { inFlightRef.current = false; }
  }, [state, userId, isPro, dispatch]);

  // Auto-save on dirty state changes
  useEffect(() => {
    if (!enabled || !state.isDirty || state.isSaving || state.saveError || !state.card.id) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, state.isDirty, state.isSaving, state.saveError, state.card.id, debounceMs, performSave]);

  // Manual save (bypasses debounce)
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return performSave();
  }, [performSave]);

  return {
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    saveError: state.saveError,
    saveNow,
  };
}
