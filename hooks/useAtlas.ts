/**
 * useAtlas Hook - Atlas v2.0 (Web Version)
 * Custom hook for Atlas data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCategories,
  getFeaturedUniverses,
  getFeaturedArticle,
  getTrendingArticles,
  getAllArticles,
  getArticlesByCategory,
  getArticlesByUniverse,
  searchArticles,
  getSavedArticles,
  type AtlasCategory,
  type AtlasUniverse,
  type AtlasArticle,
} from '../lib/atlas';
import { supabase } from '../lib/supabaseClient';

interface UseAtlasOptions {
  autoLoad?: boolean;
}

interface UseAtlasReturn {
  // Data
  categories: AtlasCategory[];
  featuredUniverses: AtlasUniverse[];
  featuredArticle: AtlasArticle | null;
  trendingArticles: AtlasArticle[];
  allArticles: AtlasArticle[];
  savedArticles: AtlasArticle[];
  
  // State
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadCategories: () => Promise<void>;
  loadFeaturedUniverses: (limit?: number) => Promise<void>;
  loadFeaturedArticle: () => Promise<void>;
  loadTrendingArticles: (limit?: number) => Promise<void>;
  loadAllArticles: (options?: { limit?: number; offset?: number; shuffle?: boolean }) => Promise<void>;
  loadSavedArticles: () => Promise<void>;
  search: (query: string) => Promise<AtlasArticle[]>;
  refresh: () => Promise<void>;
}

export function useAtlas(options: UseAtlasOptions = {}): UseAtlasReturn {
  const { autoLoad = true } = options;

  // Data state
  const [categories, setCategories] = useState<AtlasCategory[]>([]);
  const [featuredUniverses, setFeaturedUniverses] = useState<AtlasUniverse[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);
  const [allArticles, setAllArticles] = useState<AtlasArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<AtlasArticle[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err as Error);
    }
  }, []);

  // Load featured universes
  const loadFeaturedUniverses = useCallback(async (limit = 10) => {
    try {
      const data = await getFeaturedUniverses(limit);
      setFeaturedUniverses(data);
    } catch (err) {
      console.error('Error loading featured universes:', err);
      setError(err as Error);
    }
  }, []);

  // Load featured article
  const loadFeaturedArticle = useCallback(async () => {
    try {
      const data = await getFeaturedArticle();
      setFeaturedArticle(data);
    } catch (err) {
      console.error('Error loading featured article:', err);
      setError(err as Error);
    }
  }, []);

  // Load trending articles
  const loadTrendingArticles = useCallback(async (limit = 10) => {
    try {
      const data = await getTrendingArticles(limit);
      setTrendingArticles(data);
    } catch (err) {
      console.error('Error loading trending articles:', err);
      setError(err as Error);
    }
  }, []);

  // Load all articles
  const loadAllArticles = useCallback(async (options?: { limit?: number; offset?: number; shuffle?: boolean }) => {
    try {
      const data = await getAllArticles(options);
      if (options?.offset && options.offset > 0) {
        setAllArticles(prev => [...prev, ...data]);
      } else {
        setAllArticles(data);
      }
    } catch (err) {
      console.error('Error loading all articles:', err);
      setError(err as Error);
    }
  }, []);

  // Load saved articles
  const loadSavedArticles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await getSavedArticles(user.id);
        setSavedArticles(data);
      }
    } catch (err) {
      console.error('Error loading saved articles:', err);
      setError(err as Error);
    }
  }, []);

  // Search articles
  const search = useCallback(async (query: string): Promise<AtlasArticle[]> => {
    try {
      return await searchArticles(query);
    } catch (err) {
      console.error('Error searching articles:', err);
      setError(err as Error);
      return [];
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadCategories(),
        loadFeaturedUniverses(),
        loadFeaturedArticle(),
        loadTrendingArticles(),
      ]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadFeaturedUniverses, loadFeaturedArticle, loadTrendingArticles]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad]);

  return {
    // Data
    categories,
    featuredUniverses,
    featuredArticle,
    trendingArticles,
    allArticles,
    savedArticles,
    
    // State
    loading,
    error,
    
    // Actions
    loadCategories,
    loadFeaturedUniverses,
    loadFeaturedArticle,
    loadTrendingArticles,
    loadAllArticles,
    loadSavedArticles,
    search,
    refresh,
  };
}

// Hook for article reactions
export function useArticleReactions(articleId: string, userId: string | null) {
  const [userReaction, setUserReaction] = useState<'love' | 'not_for_me' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && articleId) {
      loadUserState();
    }
  }, [userId, articleId]);

  const loadUserState = async () => {
    if (!userId) return;
    
    try {
      // Load reaction
      const { data: reactionData } = await supabase
        .from('atlas_article_reactions')
        .select('reaction_type')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .single();

      if (reactionData) {
        setUserReaction(reactionData.reaction_type);
      }

      // Load saved state
      const { data: savedData } = await supabase
        .from('atlas_saved_articles')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .single();

      setIsSaved(!!savedData);
    } catch (err) {
      // Ignore errors (likely just no data found)
    }
  };

  const toggleReaction = async (type: 'love' | 'not_for_me') => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      if (userReaction === type) {
        // Remove reaction
        await supabase
          .from('atlas_article_reactions')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', userId);
        setUserReaction(null);
      } else {
        // Add/update reaction
        await supabase
          .from('atlas_article_reactions')
          .upsert({
            article_id: articleId,
            user_id: userId,
            reaction_type: type,
          });
        setUserReaction(type);
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!userId || loading) return;
    
    setLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from('atlas_saved_articles')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', userId);
        setIsSaved(false);
      } else {
        await supabase
          .from('atlas_saved_articles')
          .insert({
            article_id: articleId,
            user_id: userId,
          });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    userReaction,
    isSaved,
    loading,
    toggleReaction,
    toggleSave,
  };
}

export default useAtlas;
