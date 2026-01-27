/**
 * TAVVY ATLAS v2.0 - DATA LIBRARY (Web Version)
 * ============================================================================
 * This file contains all data fetching and mutation functions for Atlas
 * Ported from tavvy-mobile/lib/atlas.ts
 * ============================================================================
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface AtlasCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  display_order: number;
}

export interface AtlasUniverse {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  banner_image_url: string;
  thumbnail_image_url: string;
  category_id: string;
  parent_universe_id: string | null;
  place_count: number;
  article_count: number;
  sub_universe_count: number;
  total_signals: number;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string;
}

export interface ContentBlock {
  type: string;
  [key: string]: any;
}

export interface AtlasArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string;
  category_id: string;
  universe_id: string | null;
  read_time_minutes: number;
  view_count: number;
  love_count: number;
  not_for_me_count: number;
  save_count: number;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string;
  // v2.0 fields
  content_blocks?: ContentBlock[];
  article_template_type?: 'city_guide' | 'owner_spotlight' | 'tavvy_tips' | 'general';
  section_images?: { url: string; alt?: string; caption?: string }[];
  cover_image_alt?: string;
  cover_image_caption?: string;
  author_bio?: string;
  primary_place_id?: string;
  canonical_url?: string;
  seo_keywords?: string[];
  linked_place_ids?: string[];
  // Joined data
  category?: AtlasCategory;
  universe?: AtlasUniverse;
}

export interface ArticleReaction {
  id: string;
  article_id: string;
  user_id: string;
  reaction_type: 'love' | 'not_for_me';
  created_at: string;
}

export interface PlaceData {
  id: string;
  name: string;
  category: string;
  rating?: number;
  review_count?: number;
  photos?: string[];
  address?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<AtlasCategory[]> {
  const { data, error } = await supabase
    .from('atlas_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<AtlasCategory | null> {
  const { data, error } = await supabase
    .from('atlas_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ============================================================================
// UNIVERSES
// ============================================================================

export async function getFeaturedUniverses(limit = 10): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUniverseBySlug(slug: string): Promise<AtlasUniverse | null> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getSubUniverses(parentId: string): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('parent_universe_id', parentId)
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUniversesByCategory(categoryId: string): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUniversePlaces(universeId: string): Promise<PlaceData[]> {
  const { data, error } = await supabase
    .from('fsq_places_raw')
    .select('id, name, fsq_category_labels, address, locality, region')
    .eq('universe_id', universeId)
    .limit(50);

  if (error) throw error;
  
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.fsq_category_labels?.[0] || 'Place',
    address: p.address,
    city: p.locality,
    state: p.region,
  }));
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getFeaturedArticle(): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getAllArticles(
  options: {
    limit?: number;
    offset?: number;
    shuffle?: boolean;
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0, shuffle = false } = options;

  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  let articles = data || [];
  
  if (shuffle && articles.length > 0) {
    articles = articles.sort(() => Math.random() - 0.5);
  }
  
  return articles;
}

export async function getTrendingArticles(limit = 10): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('status', 'published')
    .order('love_count', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getArticleBySlug(slug: string): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Increment view count
  await supabase
    .from('atlas_articles')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return data;
}

export async function getArticleById(id: string): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Increment view count
  await supabase
    .from('atlas_articles')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return data;
}

export async function getArticlesByCategory(
  categoryId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'popular' | 'recent' | 'most_loved';
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0, sortBy = 'recent' } = options;

  let query = supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published');

  switch (sortBy) {
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    case 'most_loved':
      query = query.order('love_count', { ascending: false });
      break;
    case 'recent':
    default:
      query = query.order('published_at', { ascending: false });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getArticlesByUniverse(universeId: string): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('universe_id', universeId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  limit = 5
): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function searchArticles(query: string, limit = 20): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// REACTIONS & SAVES
// ============================================================================

export async function getUserReaction(
  articleId: string,
  userId: string
): Promise<ArticleReaction | null> {
  const { data, error } = await supabase
    .from('atlas_article_reactions')
    .select('*')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function addReaction(
  articleId: string,
  userId: string,
  reactionType: 'love' | 'not_for_me'
): Promise<void> {
  // Remove any existing reaction first
  await supabase
    .from('atlas_article_reactions')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  // Add new reaction
  const { error } = await supabase
    .from('atlas_article_reactions')
    .insert({
      article_id: articleId,
      user_id: userId,
      reaction_type: reactionType,
    });

  if (error) throw error;

  // Update article counts
  const countField = reactionType === 'love' ? 'love_count' : 'not_for_me_count';
  await supabase.rpc('increment_article_count', {
    article_id: articleId,
    count_field: countField,
  });
}

export async function removeReaction(
  articleId: string,
  userId: string,
  reactionType: 'love' | 'not_for_me'
): Promise<void> {
  const { error } = await supabase
    .from('atlas_article_reactions')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  if (error) throw error;

  // Decrement article counts
  const countField = reactionType === 'love' ? 'love_count' : 'not_for_me_count';
  await supabase.rpc('decrement_article_count', {
    article_id: articleId,
    count_field: countField,
  });
}

export async function isArticleSaved(
  articleId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('atlas_saved_articles')
    .select('id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }
  return !!data;
}

export async function saveArticle(articleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('atlas_saved_articles')
    .insert({
      article_id: articleId,
      user_id: userId,
    });

  if (error && error.code !== '23505') throw error; // Ignore duplicate key errors

  // Update save count
  await supabase.rpc('increment_article_count', {
    article_id: articleId,
    count_field: 'save_count',
  });
}

export async function unsaveArticle(articleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('atlas_saved_articles')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  if (error) throw error;

  // Decrement save count
  await supabase.rpc('decrement_article_count', {
    article_id: articleId,
    count_field: 'save_count',
  });
}

export async function getSavedArticles(userId: string): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_saved_articles')
    .select(`
      article:atlas_articles(
        *,
        category:atlas_categories(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((item: any) => item.article).filter(Boolean);
}

// ============================================================================
// PLACE DATA
// ============================================================================

export async function getPlaceById(placeId: string): Promise<PlaceData | null> {
  const { data, error } = await supabase
    .from('fsq_places_raw')
    .select('*')
    .eq('id', placeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    category: data.fsq_category_labels?.[0] || 'Place',
    rating: data.rating,
    review_count: data.stats?.total_ratings,
    photos: data.photos?.map((p: any) => p.prefix + 'original' + p.suffix) || [],
    address: data.address,
    city: data.locality,
    state: data.region,
  };
}
