/** Shared web/native experience contract. Keep both copies identical. */
export interface ExperiencePath {
  owner_id?: string; is_published?: boolean;
  id: string; title: string; description: string | null; cover_image_url: string | null;
  category: string | null; duration_minutes: number | null;
}
export interface ExperienceStop {
  id: string; path_id: string; place_id: string; position: number; note: string | null;
  place: { id: string; name: string } | null;
}
export const PATH_COLUMNS = 'id,title,description,cover_image_url,category,duration_minutes,owner_id,is_published';
export const STOP_COLUMNS = 'id,path_id,place_id,position,note,place:places(id,name)';
export const validPathId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function matchesPath(path: ExperiencePath, search: string, category = 'all') {
  return (category === 'all' || path.category === category) &&
    [path.title, path.description, path.category].some(value => value?.toLowerCase().includes(search.trim().toLowerCase()));
}
export async function loadExperiencePaths(db: any): Promise<ExperiencePath[]> {
  const rows: ExperiencePath[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('experience_paths').select(PATH_COLUMNS)
      .eq('is_published', true).order('title').order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function loadExperiencePath(db: any, id: string): Promise<ExperiencePath | null> {
  if (!validPathId(id)) return null;
  const { data, error } = await db.from('experience_paths').select(PATH_COLUMNS)
    .eq('is_published', true).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function loadExperienceStops(db: any, id: string): Promise<ExperienceStop[]> {
  if (!validPathId(id)) return [];
  const rows: ExperienceStop[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('experience_path_stops').select(STOP_COLUMNS)
      .eq('path_id', id).order('position').order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

export interface ExperienceDraft {
  title: string; description: string; category: string; duration_minutes: string; cover_image_url: string;
  stops: { place_id: string; name: string; note: string }[];
}
export const emptyExperienceDraft = (): ExperienceDraft => ({ title: '', description: '', category: '', duration_minutes: '', cover_image_url: '', stops: [] });
export async function loadOwnedExperiencePaths(db: any, userId: string): Promise<ExperiencePath[]> {
  if (!validPathId(userId)) return [];
  const rows: ExperiencePath[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('experience_paths').select(PATH_COLUMNS).eq('owner_id', userId).order('title').order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function loadEditableExperiencePath(db: any, id: string, userId: string): Promise<ExperiencePath | null> {
  if (!validPathId(id) || !validPathId(userId)) return null;
  const { data, error } = await db.from('experience_paths').select(PATH_COLUMNS).eq('id', id).eq('owner_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function searchExperiencePlaces(db: any, query: string): Promise<{ id: string; name: string; city: string | null; region: string | null }[]> {
  const text = query.trim();
  if (text.length < 2) return [];
  const escaped = text.replace(/[\\%_]/g, value => '\\' + value);
  const { data, error } = await db.from('places').select('id,name,city,region').ilike('name', '%' + escaped + '%').order('name').order('id').limit(20);
  if (error) throw error;
  return data || [];
}
export function validateExperienceDraft(draft: ExperienceDraft, publish: boolean): string | null {
  if (!draft.title.trim() || draft.title.trim().length > 200) return 'Give your path a title of 1–200 characters.';
  if (draft.description.length > 5000 || draft.category.length > 80) return 'Keep the description under 5,000 characters and category under 80.';
  if (draft.duration_minutes && (!/^\d+$/.test(draft.duration_minutes) || Number(draft.duration_minutes) < 1 || Number(draft.duration_minutes) > 525600)) return 'Enter a duration between 1 and 525,600 minutes, or leave it blank.';
  if (draft.cover_image_url && !/^https?:\/\//i.test(draft.cover_image_url.trim())) return 'Use an http or https image URL, or leave it blank.';
  if (draft.stops.length > 100) return 'A path can have up to 100 stops.';
  if (draft.stops.some(stop => !validPathId(stop.place_id) || stop.note.length > 2000)) return 'Choose real places and keep each stop note under 2,000 characters.';
  if (publish && !draft.stops.length) return 'Add at least one place before publishing.';
  return null;
}
export async function saveExperienceDraft(db: any, id: string | null, draft: ExperienceDraft, publish: boolean): Promise<string> {
  const validation = validateExperienceDraft(draft, publish);
  if (validation) throw new Error(validation);
  if (id !== null && !validPathId(id)) throw new Error('Invalid path ID.');
  const { data, error } = await db.rpc('save_experience_path', {
    p_path_id: id, p_title: draft.title.trim(), p_description: draft.description.trim() || null,
    p_category: draft.category.trim() || null, p_duration_minutes: draft.duration_minutes ? Number(draft.duration_minutes) : null,
    p_cover_image_url: draft.cover_image_url.trim() || null, p_is_published: publish,
    p_stops: draft.stops.map(stop => ({ place_id: stop.place_id, note: stop.note.trim() || null })),
  });
  if (error) throw error;
  if (typeof data !== 'string' || !validPathId(data)) throw new Error('Save could not be confirmed. Check My paths before trying again.');
  return data;
}
export function moveExperienceStop(draft: ExperienceDraft, index: number, direction: -1 | 1): ExperienceDraft {
  const next = index + direction;
  if (index < 0 || index >= draft.stops.length || next < 0 || next >= draft.stops.length) return draft;
  const stops = [...draft.stops];
  [stops[index], stops[next]] = [stops[next], stops[index]];
  return { ...draft, stops };
}
