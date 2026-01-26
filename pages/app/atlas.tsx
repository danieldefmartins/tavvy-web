/**
 * Atlas Screen - Articles and Guides
 * Pixel-perfect port from tavvy-mobile/screens/AtlasHomeScreen.tsx
 * 
 * Features:
 * - Clean header with search icon
 * - Dynamic category filter chips from database
 * - Article count
 * - Article grid with images, titles, authors, read time
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { IoSearch, IoTimeOutline, IoEyeOutline } from 'react-icons/io5';
import { UnifiedHeader } from '../../components/UnifiedHeader';

// Atlas brand colors (Purple theme - matching mobile)
const ATLAS_PRIMARY = '#7C3AED';
const ATLAS_LIGHT = '#A78BFA';
const ATLAS_BG = '#F5F3FF';
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#0F172A';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  author_name?: string;
  author_avatar_url?: string;
  read_time_minutes?: number;
  view_count?: number;
  category_id?: string;
  published_at?: string;
  status?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

// Filter options based on article content patterns (matching mobile)
interface FilterOption {
  id: string;
  name: string;
  keywords: string[];
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', name: 'All', keywords: [] },
  { id: 'family', name: 'Family & Kids', keywords: ['kids', 'family', 'children'] },
  { id: 'restaurants', name: 'Restaurants', keywords: ['restaurant', 'best restaurants', 'eats', 'food'] },
  { id: 'city', name: 'City Guides', keywords: ['things to do', 'guide'] },
];

export default function AtlasScreen() {
  const { theme, isDark } = useThemeContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch articles and categories in parallel
      const [articlesResult, categoriesResult] = await Promise.all([
        supabase
          .from('atlas_articles')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
        supabase
          .from('atlas_categories')
          .select('*')
          .order('display_order', { ascending: true })
      ]);

      if (articlesResult.data) {
        setArticles(articlesResult.data);
      }
      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on selected filter and search query
  const filteredArticles = articles.filter(article => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    if (selectedFilter === 'all') {
      return matchesSearch;
    }

    const filterOption = FILTER_OPTIONS.find(f => f.id === selectedFilter);
    if (!filterOption) return matchesSearch;

    const titleLower = article.title.toLowerCase();
    const excerptLower = (article.excerpt || '').toLowerCase();
    
    const matchesFilter = filterOption.keywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase()) || 
      excerptLower.includes(keyword.toLowerCase())
    );

    return matchesSearch && matchesFilter;
  });

  // Get count for each filter
  const getFilterCount = (filterId: string): number => {
    if (filterId === 'all') return articles.length;
    
    const filterOption = FILTER_OPTIONS.find(f => f.id === filterId);
    if (!filterOption) return 0;

    return articles.filter(article => {
      const titleLower = article.title.toLowerCase();
      const excerptLower = (article.excerpt || '').toLowerCase();
      return filterOption.keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) || 
        excerptLower.includes(keyword.toLowerCase())
      );
    }).length;
  };

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  return (
    <>
      <Head>
        <title>Atlas | TavvY</title>
        <meta name="description" content="TavvY Atlas - Articles and guides for your adventures" />
      </Head>

      <AppLayout>
        <div className="atlas-screen">
          {/* Unified Header */}
          <UnifiedHeader
            screenKey="atlas"
            title="Atlas"
            searchPlaceholder="Search articles..."
            showBackButton={false}
            onSearch={setSearchQuery}
          />

          {/* Category Filter Chips */}
          <div className="category-chips">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.id}
                className={`category-chip ${selectedFilter === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter.id)}
              >
                <span>{filter.name}</span>
                <span className="chip-count">({getFilterCount(filter.id)})</span>
              </button>
            ))}
          </div>

          {/* Article Count */}
          <div className="article-count">
            <span>{filteredArticles.length} articles</span>
          </div>

          {/* Articles Grid */}
          <main className="main-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <h3>No articles found</h3>
                <p>Check back soon for new content</p>
              </div>
            ) : (
              <div className="articles-grid">
                {filteredArticles.map((article) => (
                  <Link 
                    key={article.id}
                    href={`/app/article/${article.slug || article.id}`}
                    className="article-card"
                  >
                    <div className="article-image">
                      <img 
                        src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                        alt={article.title}
                      />
                    </div>
                    <div className="article-info">
                      <h3>{article.title}</h3>
                      <div className="article-meta">
                        <div className="author-row">
                          <div className="author-avatar">
                            {article.author_avatar_url ? (
                              <img src={article.author_avatar_url} alt={article.author_name} />
                            ) : (
                              <span>{article.author_name?.charAt(0) || 'T'}</span>
                            )}
                          </div>
                          <span className="author-name">{article.author_name || 'Tavvy Team'}</span>
                        </div>
                        <span className="read-time">
                          {article.read_time_minutes || 5} min read
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .atlas-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          /* Category Chips */
          .category-chips {
            display: flex;
            gap: 8px;
            padding: 0 20px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .category-chips::-webkit-scrollbar {
            display: none;
          }

          .category-chip {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 10px 16px;
            border-radius: 24px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          .category-chip.active {
            background: ${ATLAS_PRIMARY};
            color: #fff;
          }

          .chip-count {
            opacity: 0.8;
          }

          /* Article Count */
          .article-count {
            padding: 0 20px 16px;
          }

          .article-count span {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
          }

          /* Main Content */
          .main-content {
            padding: 0 20px;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
            border-top-color: ${ATLAS_PRIMARY};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-container p {
            margin-top: 16px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }

          .empty-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 16px;
          }

          .empty-state h3 {
            margin: 0 0 8px;
            color: ${isDark ? '#fff' : '#111'};
          }

          .empty-state p {
            margin: 0;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
          }

          /* Articles Grid */
          .articles-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .article-card {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .article-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .article-image {
            aspect-ratio: 4/3;
            overflow: hidden;
          }

          .article-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .article-info {
            padding: 12px;
          }

          .article-info h3 {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .article-meta {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .author-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .author-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${ATLAS_PRIMARY};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .author-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .author-avatar span {
            color: #fff;
            font-size: 12px;
            font-weight: 600;
          }

          .author-name {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          .read-time {
            font-size: 11px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
          }

          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .articles-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
          }

          @media (min-width: 768px) {
            .articles-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .articles-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
