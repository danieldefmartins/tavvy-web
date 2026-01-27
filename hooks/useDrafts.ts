/**
 * useDrafts Hook - Manages content drafts for Universal Add (Web version)
 * Matches the iOS implementation in tavvy-mobile
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export type ContentType = 'business' | 'universe' | 'city' | 'rv_campground' | 'event' | 'quick_add';
export type ContentSubtype = 
  | 'physical' | 'service' | 'on_the_go'
  | 'new_universe' | 'spot_in_universe'
  | 'rv_park' | 'campground' | 'boondocking' | 'overnight_parking'
  | 'restroom' | 'parking' | 'atm' | 'water_fountain' | 'pet_relief' | 'photo_spot';

export type DraftStatus = 
  | 'draft_location' | 'draft_type_selected' | 'draft_subtype_selected'
  | 'draft_details' | 'draft_review' | 'submitted' | 'failed';

export interface ContentDraft {
  id: string;
  user_id: string;
  status: DraftStatus;
  current_step: number;
  latitude: number | null;
  longitude: number | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  formatted_address: string | null;
  content_type: ContentType | null;
  content_subtype: ContentSubtype | null;
  data: Record<string, any>;
  photos: string[];
  cover_photo: string | null;
  created_at: string;
  updated_at: string;
  remind_later_until: string | null;
  is_offline: boolean;
  offline_created_at: string | null;
  sync_status: 'synced' | 'pending' | 'failed';
}

interface CreateDraftInput {
  latitude: number;
  longitude: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  formatted_address?: string;
}

interface UpdateDraftInput {
  status?: DraftStatus;
  current_step?: number;
  content_type?: ContentType;
  content_subtype?: ContentSubtype;
  data?: Record<string, any>;
  photos?: string[];
  cover_photo?: string;
  [key: string]: any;
}

interface SubmitResult {
  success: boolean;
  final_id?: string;
  final_table?: string;
  taps_earned?: number;
  error?: string;
}

const OFFLINE_DRAFTS_KEY = 'tavvy_offline_drafts';
const AUTO_SAVE_DELAY = 2000;

export function useDrafts() {
  const [currentDraft, setCurrentDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingDraft, setPendingDraft] = useState<ContentDraft | null>(null);
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<UpdateDraftInput>({});

  // Check online status
  const checkOnlineStatus = useCallback(async () => {
    setIsOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    checkOnlineStatus();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [checkOnlineStatus]);

  useEffect(() => {
    checkForPendingDraft();
  }, []);

  const checkForPendingDraft = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: draft } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'submitted')
        .is('remind_later_until', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draft) {
        setPendingDraft(draft as ContentDraft);
      }
    } catch (error) {
      console.error('[useDrafts] Error checking for pending draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDraft = async (input: CreateDraftInput): Promise<ContentDraft | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!isOnline) {
        const offlineDraft: ContentDraft = {
          id: `offline_${Date.now()}`,
          user_id: user.id,
          status: 'draft_location',
          current_step: 1,
          ...input,
          latitude: input.latitude,
          longitude: input.longitude,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          region: input.region || null,
          postal_code: input.postal_code || null,
          country: input.country || null,
          formatted_address: input.formatted_address || null,
          content_type: null,
          content_subtype: null,
          data: {},
          photos: [],
          cover_photo: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          remind_later_until: null,
          is_offline: true,
          offline_created_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        
        saveOfflineDraft(offlineDraft);
        setCurrentDraft(offlineDraft);
        return offlineDraft;
      }

      const { data, error } = await supabase
        .from('content_drafts')
        .insert({
          user_id: user.id,
          status: 'draft_location',
          current_step: 1,
          ...input,
          data: {},
          photos: [],
          sync_status: 'synced',
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDraft(data as ContentDraft);
      return data as ContentDraft;
    } catch (error) {
      console.error('[useDrafts] Error creating draft:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDraft = useCallback(async (updates: UpdateDraftInput, immediate = false) => {
    if (!currentDraft) return;

    pendingUpdates.current = {
      ...pendingUpdates.current,
      ...updates,
      data: updates.data 
        ? { ...pendingUpdates.current.data, ...updates.data }
        : pendingUpdates.current.data,
    };

    setCurrentDraft(prev => prev ? {
      ...prev,
      ...updates,
      data: updates.data ? { ...prev.data, ...updates.data } : prev.data,
      updated_at: new Date().toISOString(),
    } : null);

    if (immediate) {
      await flushPendingUpdates();
    } else {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(flushPendingUpdates, AUTO_SAVE_DELAY);
    }
  }, [currentDraft]);

  const flushPendingUpdates = async () => {
    if (!currentDraft || Object.keys(pendingUpdates.current).length === 0) return;

    setIsSaving(true);
    try {
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};

      if (currentDraft.is_offline || !isOnline) {
        const updatedDraft = {
          ...currentDraft,
          ...updates,
          data: updates.data ? { ...currentDraft.data, ...updates.data } : currentDraft.data,
          updated_at: new Date().toISOString(),
          sync_status: 'pending' as const,
        };
        saveOfflineDraft(updatedDraft);
        setCurrentDraft(updatedDraft);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (updates.data) {
          updates.data = { ...currentDraft.data, ...updates.data };
        }

        const { data, error } = await supabase
          .from('content_drafts')
          .update(updates)
          .eq('id', currentDraft.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setCurrentDraft(data as ContentDraft);
      }
    } catch (error) {
      console.error('[useDrafts] Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDraft = async (draftId?: string): Promise<boolean> => {
    const id = draftId || currentDraft?.id;
    if (!id) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (id.startsWith('offline_')) {
        removeOfflineDraft(id);
      } else {
        await supabase.from('content_drafts').delete().eq('id', id).eq('user_id', user.id);
      }

      if (id === currentDraft?.id) setCurrentDraft(null);
      if (id === pendingDraft?.id) setPendingDraft(null);
      return true;
    } catch (error) {
      console.error('[useDrafts] Error deleting draft:', error);
      return false;
    }
  };

  const snoozeDraft = async (hours: number = 24): Promise<boolean> => {
    if (!currentDraft) return false;
    const remindAt = new Date();
    remindAt.setHours(remindAt.getHours() + hours);
    await updateDraft({ remind_later_until: remindAt.toISOString() } as any, true);
    setCurrentDraft(null);
    setPendingDraft(null);
    return true;
  };

  const submitDraft = async (): Promise<SubmitResult> => {
    if (!currentDraft) return { success: false, error: 'No draft to submit' };
    await flushPendingUpdates();

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!currentDraft.latitude || !currentDraft.longitude) {
        return { success: false, error: 'Location is required' };
      }
      if (!currentDraft.content_type) {
        return { success: false, error: 'Content type is required' };
      }

      let result: SubmitResult;
      switch (currentDraft.content_type) {
        case 'business':
        case 'quick_add':
          result = await submitToTavvyPlaces(currentDraft, user.id);
          break;
        case 'event':
          result = await submitToTavvyEvents(currentDraft, user.id);
          break;
        case 'rv_campground':
          result = await submitToTavvyRvCampgrounds(currentDraft, user.id);
          break;
        default:
          return { success: false, error: `Unknown content type` };
      }

      if (result.success) {
        if (!currentDraft.id.startsWith('offline_')) {
          await supabase.from('content_drafts').update({ status: 'submitted' }).eq('id', currentDraft.id);
        } else {
          removeOfflineDraft(currentDraft.id);
        }
        setCurrentDraft(null);
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to submit' };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeDraft = (draft: ContentDraft) => {
    setCurrentDraft(draft);
    setPendingDraft(null);
  };

  const dismissPendingDraft = () => setPendingDraft(null);

  // Local storage helpers for offline drafts
  const saveOfflineDraft = (draft: ContentDraft) => {
    try {
      const existing = localStorage.getItem(OFFLINE_DRAFTS_KEY);
      const drafts: ContentDraft[] = existing ? JSON.parse(existing) : [];
      const index = drafts.findIndex(d => d.id === draft.id);
      if (index >= 0) drafts[index] = draft;
      else drafts.push(draft);
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.error('[useDrafts] Error saving offline draft:', e);
    }
  };

  const removeOfflineDraft = (draftId: string) => {
    try {
      const existing = localStorage.getItem(OFFLINE_DRAFTS_KEY);
      if (!existing) return;
      const drafts: ContentDraft[] = JSON.parse(existing);
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== draftId)));
    } catch (e) {
      console.error('[useDrafts] Error removing offline draft:', e);
    }
  };

  return {
    currentDraft, pendingDraft, isLoading, isSaving, isOnline,
    createDraft, updateDraft, deleteDraft, snoozeDraft, submitDraft,
    resumeDraft, dismissPendingDraft, flushPendingUpdates,
  };
}

/**
 * Maps business type to database place_type constraint
 * Database only allows: 'fixed' or 'on_the_go'
 */
function getPlaceType(contentSubtype: string | null | undefined, hasPhysicalLocation?: boolean): 'fixed' | 'on_the_go' {
  if (contentSubtype === 'on_the_go') {
    return 'on_the_go';
  }
  if (contentSubtype === 'service') {
    return hasPhysicalLocation === false ? 'on_the_go' : 'fixed';
  }
  return 'fixed';
}

async function submitToTavvyPlaces(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_places').insert({
    name: draft.data?.name || draft.content_subtype || 'Place',
    description: draft.data?.description,
    tavvy_category: draft.data?.tavvy_category || draft.content_subtype || 'other',
    tavvy_subcategory: draft.data?.tavvy_subcategory,
    latitude: draft.latitude,
    longitude: draft.longitude,
    address_line1: draft.address_line1,
    address_line2: draft.address_line2,
    formatted_address: draft.formatted_address,
    city: draft.city,
    region: draft.region,
    postcode: draft.postal_code,
    country: draft.country,
    phone: draft.data?.phone,
    email: draft.data?.email,
    website: draft.data?.website,
    instagram: draft.data?.instagram,
    facebook: draft.data?.facebook,
    twitter: draft.data?.twitter,
    tiktok: draft.data?.tiktok,
    photos: draft.photos,
    cover_image_url: draft.cover_photo,
    place_type: getPlaceType(draft.content_subtype, draft.data?.has_physical_location),
    place_subtype: draft.content_subtype,
    service_area: draft.data?.service_area,
    is_quick_add: draft.content_type === 'quick_add',
    quick_add_type: draft.content_type === 'quick_add' ? draft.content_subtype : null,
    source: 'user',
    created_by: userId,
    draft_id: draft.id,
    notes: draft.data?.notes,
  }).select('id').single();
  
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_places', taps_earned: 50 };
}

async function submitToTavvyEvents(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_events').insert({
    name: draft.data?.name,
    description: draft.data?.description,
    latitude: draft.latitude,
    longitude: draft.longitude,
    address_line1: draft.address_line1,
    city: draft.city,
    region: draft.region,
    country: draft.country,
    formatted_address: draft.formatted_address,
    start_datetime: draft.data?.start_datetime,
    end_datetime: draft.data?.end_datetime,
    is_all_day: draft.data?.is_all_day || false,
    event_category: draft.data?.event_category,
    cover_photo: draft.cover_photo,
    photos: draft.photos,
    ticket_url: draft.data?.ticket_url,
    is_free: draft.data?.is_free !== false,
    created_by: userId,
    status: 'published',
  }).select('id').single();
  
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_events', taps_earned: 50 };
}

async function submitToTavvyRvCampgrounds(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_rv_campgrounds').insert({
    name: draft.data?.name,
    description: draft.data?.description,
    latitude: draft.latitude,
    longitude: draft.longitude,
    address_line1: draft.address_line1,
    city: draft.city,
    region: draft.region,
    country: draft.country,
    formatted_address: draft.formatted_address,
    campground_type: draft.content_subtype,
    amenities: draft.data?.amenities || [],
    photos: draft.photos,
    cover_photo: draft.cover_photo,
    created_by: userId,
    status: 'published',
  }).select('id').single();
  
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_rv_campgrounds', taps_earned: 50 };
}
