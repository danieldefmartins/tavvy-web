import { useEffect, useRef, useState } from 'react';
import { ExperienceDraft, emptyExperienceDraft, loadEditableExperiencePath, loadExperienceStops, moveExperienceStop, saveExperienceDraft, searchExperiencePlaces } from './experiencePaths';

export function useExperienceEditor(db: any, pathId: string, userId?: string) {
  const [draft, setDraft] = useState<ExperienceDraft>(emptyExperienceDraft);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Awaited<ReturnType<typeof searchExperiencePlaces>>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchRetry, setSearchRetry] = useState(0);
  const savedId = useRef<string | null>(pathId === 'new' ? null : pathId);
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    setLoadError(''); setError(''); setDraft(emptyExperienceDraft()); setPublished(false);
    savedId.current = pathId === 'new' ? null : pathId;
    if (!userId || pathId === 'new') { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const path = await loadEditableExperiencePath(db, pathId, userId);
        if (!path) throw new Error('This path is unavailable or belongs to another person.');
        const stops = await loadExperienceStops(db, pathId);
        if (active) {
          setPublished(Boolean(path.is_published));
          setDraft({ title: path.title, description: path.description || '', category: path.category || '', duration_minutes: path.duration_minutes?.toString() || '', cover_image_url: path.cover_image_url || '', stops: stops.map(stop => ({ place_id: stop.place_id, name: stop.place?.name || 'Place unavailable', note: stop.note || '' })) });
        }
      } catch { if (active) setLoadError('Your path could not be opened. It may be unavailable or belong to another person.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [db, pathId, userId, retry]);
  useEffect(() => {
    let active = true;
    setPlaces([]); setSearchError(''); setSearching(query.trim().length >= 2);
    const timer = setTimeout(() => {
      searchExperiencePlaces(db, query).then(rows => { if (active) setPlaces(rows); })
        .catch(() => { if (active) setSearchError('Places could not be loaded. Try searching again.'); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [db, query, searchRetry]);
  const save = async (publish: boolean): Promise<string | null> => {
    if (!userId || savingRef.current || loading || loadError) return null;
    savingRef.current = true; setSaving(true); setError('');
    try {
      const id = await saveExperienceDraft(db, savedId.current, draft, publish);
      savedId.current = id; setPublished(publish);
      return id;
    } catch (e: any) { setError(e instanceof Error || e?.code === 'P0001' ? e.message : 'Your path could not be saved. Your changes are still here. Try saving again.'); return null; }
    finally { savingRef.current = false; setSaving(false); }
  };
  return { draft, setDraft, loading, loadError, error, saving, published, query, setQuery, places, searching, searchError,
    retry: () => setRetry(n => n + 1), retrySearch: () => setSearchRetry(n => n + 1), save,
    move: (index: number, direction: -1 | 1) => setDraft(current => moveExperienceStop(current, index, direction)),
    remove: (index: number) => setDraft(current => ({ ...current, stops: current.stops.filter((_, i) => i !== index) })),
    add: (place: { id: string; name: string }) => { setDraft(current => ({ ...current, stops: [...current.stops, { place_id: place.id, name: place.name, note: '' }] })); setQuery(''); },
  };
}
