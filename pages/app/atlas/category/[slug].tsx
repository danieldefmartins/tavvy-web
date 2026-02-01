/**
 * CATEGORY BROWSE SCREEN
 * Pixel-perfect port from tavvy-mobile/screens/CategoryBrowseScreen.tsx
 * 
 * Features:
 * - Category header with icon and description
 * - Sort options (Popular, Recent, Most Loved)
 * - Article list with infinite scroll
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import AppLayout from '../../../../components/AppLayout';
import { supabase } from '../../../../lib/supabaseClient';
import { IoArrowBack, IoHeart, IoTime, IoFlame } from 'react-icons/io5';

type SortOption = 'popular' | 'recent' | 'most_loved';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  author_name?: string;
  read_time_minutes?: number;
  love_count?: number;
  view_count?: number;
  published_at?: string;
}

const TEAL_PRIMARY = '#14b8a6';

export default function CategoryBrowseScreen() {
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { theme, isDark } = useThemeContext();

  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (slug) {
      loadCategory();
    }
  }, [slug]);

  useEffect(() => {
    if (category) {
      loadArticles();
    }
  }, [category, sortBy]);

  const loadCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        setCategory(data);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  const loadArticles = async () => {
    if (!category) return;

    try {
      setLoading(true);

      let query = supabase
        .from('atlas_articles')
        .select('*')
        .eq('category_id', category.id)
        .eq('status', 'published');

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('published_at', { ascending: false });
          break;
        case 'most_loved':
          query = query.order('love_count', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (!error && data) {
        setArticles(data);
        setHasMore(data.length === 20);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading || !category) return;

    try {
      let query = supabase
        .from('atlas_articles')
        .select('*')
        .eq('category_id', category.id)
        .eq('status', 'published');

      switch (sortBy) {
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('published_at', { ascending: false });
          break;
        case 'most_loved':
          query = query.order('love_count', { ascending: false });
          break;
      }

      const { data, error } = await query.range(articles.length, articles.length + 19);

      if (!error && data) {
        setArticles([...articles, ...data]);
        setHasMore(data.length === 20);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const backgroundColor = theme.background;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const surfaceColor = theme.surface;
  const categoryColor = category?.color || TEAL_PRIMARY;

  return (
    <>
      <Head>
        <title>{category?.name || 'Category'} | TavvY Atlas</title>
      </Head>

      <AppLayout hideTabBar>
        <div className="category-screen">
          {/* Header */}
          <header className="header">
            <button className="back-button" onClick={() => router.back()}>
              <IoArrowBack size={24} color={textColor} />
            </button>
            <h1 className="header-title">{category?.name || 'Category'}</h1>
            <div style={{ width: 40 }} />
          </header>

          {/* Category Info */}
          {category && (
            <div 
              className="category-info"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <span className="category-icon">{category.icon || '📚'}</span>
              <p className="category-description">
                {category.description || `Explore ${category.name} articles`}
              </p>
              <span className="category-stats">
                {articles.length} articles available
              </span>
            </div>
          )}

          {/* Sort Options */}
          <div className="sort-bar">
            <button
              className={`sort-chip ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => setSortBy('popular')}
            >
              <IoFlame size={14} />
              <span>Most Popular</span>
            </button>
            <button
              className={`sort-chip ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              <IoTime size={14} />
              <span>Most Recent</span>
            </button>
            <button
              className={`sort-chip ${sortBy === 'most_loved' ? 'active' : ''}`}
              onClick={() => setSortBy('most_loved')}
            >
              <IoHeart size={14} />
              <span>Most Loved</span>
            </button>
          </div>

          {/* Articles List */}
          <main className="content">
            {loading && articles.length === 0 ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : articles.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <h3 className="empty-title">No articles yet</h3>
                <p className="empty-text">Check back soon for new content</p>
              </div>
            ) : (
              <div className="articles-list">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/app/article/${article.slug || article.id}`}
                    className="article-card"
                  >
                    <img
                      src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                      alt={article.title}
                      className="article-image"
                    />
                    <div className="article-content">
                      <h3 className="article-title">{article.title}</h3>
                      {article.excerpt && (
                        <p className="article-excerpt">{article.excerpt}</p>
                      )}
                      <div className="article-meta">
                        <span>{article.author_name || 'Tavvy Team'}</span>
                        <span className="dot">•</span>
                        <span>{article.read_time_minutes || 5} min</span>
                        {article.love_count && article.love_count > 0 && (
                          <>
                            <span className="dot">•</span>
                            <span className="loves">
                              <IoHeart size={12} color="#ef4444" />
                              {formatNumber(article.love_count)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                {hasMore && (
                  <button className="load-more" onClick={loadMore}>
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .category-screen {
            min-height: 100vh;
            background-color: ${backgroundColor};
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            padding-top: 20px;
            background: ${backgroundColor};
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .back-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-title {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0;
          }

          /* Category Info */
          .category-info {
            margin: 0 20px 16px;
            padding: 20px;
            border-radius: 16px;
            text-align: center;
          }

          .category-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 12px;
          }

          .category-description {
            font-size: 15px;
            color: ${textColor};
            margin: 0 0 8px;
            line-height: 1.5;
          }

          .category-stats {
            font-size: 13px;
            color: ${secondaryTextColor};
          }

          /* Sort Bar */
          .sort-bar {
            display: flex;
            gap: 8px;
            padding: 0 20px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .sort-bar::-webkit-scrollbar {
            display: none;
          }

          .sort-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 20px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5'};
            color: ${secondaryTextColor};
          }

          .sort-chip.active {
            background: ${categoryColor};
            color: white;
          }

          /* Content */
          .content {
            padding: 0 20px 40px;
          }

          .loading-container {
            padding-top: 60px;
            display: flex;
            justify-content: center;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
            border-top-color: ${categoryColor};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }

          /* Empty State */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
            text-align: center;
          }

          .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .empty-title {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 8px;
          }

          .empty-text {
            font-size: 16px;
            color: ${secondaryTextColor};
            margin: 0;
          }

          /* Articles List */
          .articles-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .article-card {
            display: flex;
            background: ${surfaceColor};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
            transition: transform 0.2s;
          }

          .article-card:hover {
            transform: scale(1.01);
          }

          .article-image {
            width: 120px;
            height: 140px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .article-content {
            flex: 1;
            padding: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .article-title {
            font-size: 16px;
            font-weight: 600;
            color: ${textColor};
            margin: 0 0 6px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .article-excerpt {
            font-size: 13px;
            color: ${secondaryTextColor};
            margin: 0 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .article-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          .dot {
            margin: 0 2px;
          }

          .loves {
            display: flex;
            align-items: center;
            gap: 3px;
          }

          .load-more {
            padding: 14px 24px;
            background: ${isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5'};
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: 8px;
          }

          .load-more:hover {
            opacity: 0.8;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .article-image {
              width: 100px;
              height: 120px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
