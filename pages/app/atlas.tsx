/**
 * Atlas Screen - Articles and Guides
 * Pixel-perfect port from tavvy-mobile/screens/AtlasScreen.tsx
 * 
 * Features:
 * - Clean header with search icon
 * - Category filter chips (All, Family & Kids, Restaurants, etc.)
 * - Article count
 * - Article grid with images, titles, authors, read time
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { IoSearch, IoTimeOutline, IoEyeOutline } from 'react-icons/io5';
import { UnifiedHeader } from '../../components/UnifiedHeader';

// Theme colors
const TEAL = '#14B8A6';
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
  category?: string;
  published_at?: string;
  status?: string;
}

// Category chips matching mobile app
const CATEGORY_CHIPS = [
  { id: 'all', name: 'All', count: 13 },
  { id: 'family-kids', name: 'Family & Kids', count: 10 },
  { id: 'restaurants', name: 'Restaurants', count: 3 },
];

// Mock articles data
const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Things to Do in Miami With Kids',
    slug: 'things-to-do-miami-kids',
    cover_image_url: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&h=300&fit=crop',
    author_name: 'Tavvy Team',
    read_time_minutes: 12,
    view_count: 0,
    category: 'family-kids',
  },
  {
    id: '2',
    title: 'Things to Do in Nashville With Kids (Family-Friendly Guide)',
    slug: 'things-to-do-nashville-kids',
    cover_image_url: 'https://images.unsplash.com/photo-1545486332-9e0999c535b2?w=400&h=300&fit=crop',
    author_name: 'Tavvy Atlas',
    read_time_minutes: 12,
    view_count: 0,
    category: 'family-kids',
  },
  {
    id: '3',
    title: 'Things to Do in Chicago With Kids',
    slug: 'things-to-do-chicago-kids',
    cover_image_url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=300&fit=crop',
    author_name: 'Tavvy Team',
    read_time_minutes: 15,
    view_count: 0,
    category: 'family-kids',
  },
  {
    id: '4',
    title: 'Things to Do in San Francisco With Kids',
    slug: 'things-to-do-sf-kids',
    cover_image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
    author_name: 'Tavvy Team',
    read_time_minutes: 16,
    view_count: 0,
    category: 'family-kids',
  },
  {
    id: '5',
    title: 'Things to Do in Orlando With Kids',
    slug: 'things-to-do-orlando-kids',
    cover_image_url: 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=400&h=300&fit=crop',
    author_name: 'Tavvy Team',
    read_time_minutes: 14,
    view_count: 0,
    category: 'family-kids',
  },
  {
    id: '6',
    title: '7 Best Restaurants in New York City',
    slug: 'best-restaurants-nyc',
    cover_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
    author_name: 'Tavvy Team',
    read_time_minutes: 10,
    view_count: 0,
    category: 'restaurants',
  },
];

export default function AtlasScreen() {
  const { theme, isDark } = useThemeContext();
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('atlas_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const { data, error } = await query.limit(20);

      if (data && data.length > 0) {
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

          {/* Category Chips */}
          <div className="category-chips">
            {CATEGORY_CHIPS.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.name}</span>
                <span className="chip-count">({cat.count})</span>
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
                    href={`/app/atlas/article/${article.slug || article.id}`}
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

          /* Header */
          .atlas-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .search-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .atlas-header h1 {
            font-size: 18px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0;
          }

          .header-spacer {
            width: 40px;
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
            background: ${TEAL};
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

          /* Articles Grid */
          .articles-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .article-card {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .article-card:hover {
            transform: scale(1.02);
          }

          .article-image {
            height: 120px;
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
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 10px;
            line-height: 1.3;
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
            background: ${isDark ? '#333' : '#e5e5e5'};
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
            font-size: 11px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#666'};
          }

          .author-name {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          .read-time {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
          }

          /* Loading & Empty States */
          .loading-container, .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${isDark ? '#333' : '#ddd'};
            border-top-color: ${TEAL};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-container p, .empty-state p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: 0;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }

          .empty-state h3 {
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 4px;
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (min-width: 768px) {
            .articles-grid {
              grid-template-columns: repeat(3, 1fr);
            }

            .article-image {
              height: 160px;
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
