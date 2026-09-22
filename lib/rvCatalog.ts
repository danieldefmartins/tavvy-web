import { supabase } from './supabaseClient';
import { rvCatalogFilter, RVCategory, RVPlace } from './rvCategories';
export * from './rvCategories';

export async function fetchRVCatalog(options: { category?: RVCategory; query?: string; offset?: number; limit?: number; client?: typeof supabase } = {}) {
  const category = options.category || 'all';
  const offset = Math.max(0, Math.floor(options.offset || 0));
  const limit = Math.max(1, Math.min(50, Math.floor(options.limit || 24)));
  const client = options.client || supabase;
  const { data, error } = await client.from('places')
    .select('id,name,tavvy_category,tavvy_subcategory,city,region,cover_image_url,photos,status,latitude,longitude')
    .eq('status', 'active').or(rvCatalogFilter(category, options.query || ''))
    .order('name', { ascending: true, nullsFirst: false }).order('id', { ascending: true })
    .range(offset, offset + limit);
  if (error) throw new Error('Places are temporarily unavailable. Please try again.');
  if (!Array.isArray(data)) throw new Error('Places are temporarily unavailable. Please try again.');
  return { places: data.slice(0, limit) as RVPlace[], hasMore: data.length > limit, nextOffset: offset + Math.min(data.length, limit) };
}
