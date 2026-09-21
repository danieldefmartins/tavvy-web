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
  latitude: number | null;
  longitude: number | null;
  data?: Record<string, any>;
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
  cover_photo?: string | null;
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

export function useDrafts(context: Record<string, any> = {}) {
  const [currentDraft, setDraftState] = useState<ContentDraft | null>(null);
  const draftRef = useRef<ContentDraft | null>(null);
  const setCurrentDraft = (value: ContentDraft | null | ((prev: ContentDraft | null) => ContentDraft | null)) => {
    draftRef.current = typeof value === 'function' ? value(draftRef.current) : value;
    setDraftState(draftRef.current);
  };
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveInFlight = useRef<Promise<boolean> | null>(null);
  const submitInFlight = useRef(false);
  const submittedResult = useRef<SubmitResult | null>(null);
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
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [checkOnlineStatus]);

  useEffect(() => {
    if (!draftRef.current) checkForPendingDraft();
  }, [isOnline]);

  const checkForPendingDraft = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await (!isOnline ? supabase.auth.getSession().then(({ data, error }) => ({ data: { user: data.session?.user || null }, error })) : supabase.auth.getUser());
      if (!user) {
        setIsLoading(false);
        return;
      }

      const localDrafts = await readOfflineDrafts();
      const local = localDrafts.filter(d => d.user_id === user.id && d.status !== 'submitted' && (!d.remind_later_until || Date.parse(d.remind_later_until) <= Date.now())).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
      if (local) setPendingDraft(local);

      const { data: draft, error: draftError } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'submitted')
        .is('remind_later_until', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftError) throw draftError;
      if (draft && (!local || draft.updated_at > local.updated_at)) {
        setPendingDraft(draft as ContentDraft);
      }
    } catch (error) {
      console.error('[useDrafts] Error checking for pending draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDraft = async (input: CreateDraftInput): Promise<ContentDraft | null> => {
    input = { ...input, data: { ...context, ...input.data } };
    setIsLoading(true);
    try {
      const { data: { user } } = await (!isOnline ? supabase.auth.getSession().then(({ data, error }) => ({ data: { user: data.session?.user || null }, error })) : supabase.auth.getUser());
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
          data: input.data || {},
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
          data: input.data || {},
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
    if (!draftRef.current) return;

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
      return await flushPendingUpdates();
    } else {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(flushPendingUpdates, AUTO_SAVE_DELAY);
    }
  }, [currentDraft]);

  const flushPendingUpdates = async (): Promise<boolean> => {
    if (saveInFlight.current) await saveInFlight.current;
    const draft = draftRef.current;
    if (!draft || Object.keys(pendingUpdates.current).length === 0) return true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const updates = pendingUpdates.current;
    pendingUpdates.current = {};
    const operation = (async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        if (draft.is_offline || !isOnline) {
          const offlineCopy = { ...draft, is_offline: true, sync_status: 'pending' as const };
          await saveOfflineDraft(offlineCopy);
          setCurrentDraft(prev => prev?.id === draft.id ? { ...prev, is_offline: true, sync_status: 'pending' } : prev);
        } else {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user || user.id !== draft.user_id) throw new Error('Please sign in to save this draft');
          const { error } = await supabase.from('content_drafts')
            .update({ ...updates, ...(updates.data ? { data: draft.data } : {}) })
            .eq('id', draft.id).eq('user_id', user.id).select('id').single();
          if (error) throw error;
        }
        return true;
      } catch (error: any) {
        pendingUpdates.current = { ...updates, ...pendingUpdates.current,
          data: { ...updates.data, ...pendingUpdates.current.data } };
        setSaveError(error.message || 'Failed to save draft');
        return false;
      } finally { setIsSaving(false); }
    })();
    saveInFlight.current = operation;
    const result = await operation;
    if (saveInFlight.current === operation) saveInFlight.current = null;
    return result;
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
        const { error } = await supabase.from('content_drafts').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
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
    const draft = draftRef.current || pendingDraft;
    if (!draft) return false;
    setCurrentDraft(draft);
    const remindAt = new Date();
    remindAt.setHours(remindAt.getHours() + hours);
    if (!await updateDraft({ remind_later_until: remindAt.toISOString() }, true)) return false;
    setCurrentDraft(null);
    setPendingDraft(null);
    return true;
  };

  const submitDraft = async (): Promise<SubmitResult> => {
    if (submitInFlight.current) return { success: false, error: 'Submission already in progress' };
    if (!await flushPendingUpdates()) return { success: false, error: 'Could not save your draft. Please retry.' };
    let currentDraft = draftRef.current;
    if (submitInFlight.current) return { success: false, error: 'Submission already in progress' };
    if (!currentDraft) return { success: false, error: 'No draft to submit' };
    if (!isOnline) return { success: false, error: 'Reconnect before publishing. Your draft is saved on this device.' };
    submitInFlight.current = true;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== currentDraft.user_id) throw new Error('Please sign in as the draft owner');

      if (currentDraft.is_offline || currentDraft.id.startsWith('offline_')) {
        const offlineId = currentDraft.id;
        // Persist the server ID locally BEFORE making a request. A lost response or
        // app restart can safely retry the same primary key instead of duplicating.
        const serverId = currentDraft.data._offline_sync_id || (!currentDraft.id.startsWith('offline_') ? currentDraft.id : null) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.floor(Math.random() * 16);
          return (c === 'x' ? r : (r & 3) | 8).toString(16);
        });
        const local = { ...currentDraft, data: { ...currentDraft.data, _offline_sync_id: serverId } };
        await saveOfflineDraft(local);
        setCurrentDraft(local);
        const { data: existing, error: lookupError } = await supabase.from('content_drafts')
          .select('*').eq('id', serverId).eq('user_id', user.id).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing?.status === 'submitted') {
          await removeOfflineDraft(offlineId);
          setCurrentDraft(null);
          return { success: true };
        }
        const onlineDraft = { ...local, id: serverId, is_offline: false, sync_status: 'synced' as const };
        const { data: migrated, error: migrateError } = await supabase.from('content_drafts')
          .upsert(onlineDraft, { onConflict: 'id' }).select('*').single();
        if (migrateError || !migrated) throw migrateError || new Error('Could not sync the draft');
        // If removing local storage fails, keep the marked offline draft and retry
        // the same server row. Never lose the only saved copy on network failure.
        await removeOfflineDraft(offlineId);
        currentDraft = migrated as ContentDraft;
        setCurrentDraft(currentDraft);
      }

      const serviceWithoutLocation = currentDraft.content_type === 'business' && currentDraft.content_subtype === 'service' && currentDraft.data?.has_physical_location === false && currentDraft.latitude === null && currentDraft.longitude === null;
      if (!serviceWithoutLocation && (typeof currentDraft.latitude !== 'number' || !Number.isFinite(currentDraft.latitude) || Math.abs(currentDraft.latitude) > 90 || typeof currentDraft.longitude !== 'number' || !Number.isFinite(currentDraft.longitude) || Math.abs(currentDraft.longitude) > 180)) {
        return { success: false, error: 'Location is required' };
      }
      if (!currentDraft.content_type) {
        return { success: false, error: 'Content type is required' };
      }

      if ((currentDraft.photos || []).some(uri => !/^https?:\/\//i.test(uri))) {
        throw new Error('Please remove and re-add any photos saved before uploads were supported.');
      }
      let result: SubmitResult;
      if (submittedResult.current) result = submittedResult.current;
      else switch (currentDraft.content_type) {
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
        submittedResult.current = result;
        if (!currentDraft.id.startsWith('offline_')) {
          const { error } = await supabase.from('content_drafts').update({ status: 'submitted' }).eq('id', currentDraft.id).eq('user_id', user.id).select('id').single();
          if (error) throw new Error('Published, but could not finish saving the draft. Retry to finish without publishing again.');
        } else {
          removeOfflineDraft(currentDraft.id);
        }
        setCurrentDraft(null);
        submittedResult.current = null;
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to submit' };
    } finally {
      submitInFlight.current = false;
      setIsLoading(false);
    }
  };

  const resumeDraft = (draft: ContentDraft) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    pendingUpdates.current = {};
    submittedResult.current = null;
    setCurrentDraft(draft);
    setPendingDraft(null);
  };

  const dismissPendingDraft = () => setPendingDraft(null);

  // Local storage helpers for offline drafts
  const readOfflineDrafts = async (): Promise<ContentDraft[]> => {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  };

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
      throw e;
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
      throw e;
    }
  };

  return {
    currentDraft, pendingDraft, isLoading, isSaving, isOnline, saveError,
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

export async function submitToTavvyPlaces(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  // A previous publish may have succeeded before membership/finalization failed.
  const { data: existing, error: lookupError } = await supabase.from('tavvy_places')
    .select('id').eq('draft_id', draft.id).eq('created_by', userId).limit(1).maybeSingle();
  if (lookupError) return { success: false, error: lookupError.message };
  const { data, error } = existing ? { data: existing, error: null } : await supabase.from('tavvy_places').insert({
    name: draft.data?.name || draft.content_subtype || 'Place',
    description: draft.data?.description,
    tavvy_category: draft.data?.tavvy_category || draft.data?.universe_place_type || draft.content_subtype || 'other',
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
    universe_id: draft.data?.universe_id || null,
    place_subtype: draft.data?.universe_place_type || draft.content_subtype,
    service_area: draft.data?.service_area,
    is_quick_add: draft.content_type === 'quick_add',
    quick_add_type: draft.content_type === 'quick_add' ? draft.content_subtype : null,
    source: 'user',
    created_by: userId,
    draft_id: draft.id,
    notes: draft.data?.notes,
  }).select('id').single();
  
  if (error) return { success: false, error: error.message };
  if (draft.data?.universe_id) {
    // The deployed sync trigger creates places, but does not create universe membership.
    const { data: canonical, error: canonicalError } = await supabase.from('places')
      .select('id').eq('source_type', 'user').eq('source_id', data.id).single();
    if (canonicalError || !canonical) return { success: false, error: canonicalError?.message || 'Published place is not yet available. Retry to finish adding it to the universe.' };
    const { error: membershipError } = await supabase.from('atlas_universe_places').upsert(
      { universe_id: draft.data.universe_id, place_id: canonical.id },
      { onConflict: 'universe_id,place_id', ignoreDuplicates: true }
    );
    if (membershipError) return { success: false, error: membershipError.message };
  }
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
