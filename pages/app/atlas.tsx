/**
 * ATLAS HOME SCREEN
 * Shows all articles with search bar and category filters
 * Search works on title, excerpt, content, and author name
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { IoSearch, IoClose, IoChevronForward } from 'react-icons/io5';

// Design System Colors
const COLORS = {
  accent: '#667EEA',
  accentLight: '#818CF8',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  author_name?: string;
  author_avatar_url?: string;
  read_time_minutes?: number;
  view_count?: number;
  love_count?: number;
  category_id?: string;
  published_at?: string;
  status?: string;
  article_template_type?: string;
}

// Placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100';

export default function AtlasHomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data states
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load categories and articles on mount
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('atlas_categories')
        .select('id, name, slug, icon')
        .order('display_order', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch all published articles with content for full-text search
      const { data: articles } = await supabase
        .from('atlas_articles')
        .select('id, title, slug, excerpt, content, cover_image_url, author_name, author_avatar_url, read_time_minutes, view_count, love_count, category_id, published_at, article_template_type')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (articles && articles.length > 0) {
        setAllArticles(articles);
        setDisplayedArticles(articles);
      }
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search articles
  const filterArticles = useCallback((categoryId: string | null, query: string) => {
    let filtered = allArticles;

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter(a => a.category_id === categoryId);
    }

    // Search in title, excerpt, content, and author name
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(lowerQuery)) ||
        (article.content && article.content.toLowerCase().includes(lowerQuery)) ||
        (article.author_name && article.author_name.toLowerCase().includes(lowerQuery))
      );
    }

    setDisplayedArticles(filtered);
  }, [allArticles]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    filterArticles(categoryId, searchQuery);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterArticles(selectedCategory, query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    filterArticles(selectedCategory, '');
  };

  const navigateToArticle = (article: Article) => {
    if (article.article_template_type === 'owner_spotlight') {
      router.push(`/app/atlas/owner-spotlight/${article.slug || article.id}`);
    } else {
      router.push(`/app/article/${article.slug || article.id}`);
    }
  };

  const backgroundColor = theme.background;
  const cardColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const inputBgColor = isDark ? '#2C2C2E' : '#E5E5EA';

  if (loading) {
    return (
      <>
        <Head>
          <title>Atlas | TavvY</title>
        </Head>
        <AppLayout>
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading articles...</p>
            <style jsx>{`
              .loading-container {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: ${backgroundColor};
              }
              .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
                border-top-color: ${COLORS.accent};
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              p {
                margin-top: 12px;
                font-size: 14px;
                color: ${secondaryTextColor};
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </AppLayout>
      </>
    );
  }

  // Get featured article (first one) and rest for grid
  const featuredArticle = displayedArticles.length > 0 ? displayedArticles[0] : null;
  const gridArticles = displayedArticles.slice(1);

  return (
    <>
      <Head>
        <title>Atlas | TavvY</title>
        <meta name="description" content="TavvY Atlas - Your guide to the exceptional" />
      </Head>

      <AppLayout>
        <div className="atlas-screen">
          {/* Header */}
          <header className="header">
            <h1 className="title">Atlas</h1>
            <p className="tagline">Your guide to the exceptional.</p>
          </header>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <IoSearch size={20} color={secondaryTextColor} />
              <input
                type="text"
                className="search-input"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-button" onClick={clearSearch}>
                  <IoClose size={20} color={secondaryTextColor} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="filter-container">
            <div className="filter-scroll">
              {/* All chip */}
              <button
                className={`filter-chip ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => handleCategorySelect(null)}
              >
                <span className="chip-icon">📚</span>
                <span className="chip-text">All</span>
              </button>
              
              {/* Category chips */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`filter-chip ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.icon && <span className="chip-icon">{category.icon}</span>}
                  <span className="chip-text">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="results-count">
              <p>{displayedArticles.length} result{displayedArticles.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
            </div>
          )}

          {/* No Results */}
          {displayedArticles.length === 0 ? (
            <div className="empty-state">
              <p>No articles found{searchQuery ? ` matching "${searchQuery}"` : ' in this category'}.</p>
            </div>
          ) : (
            <>
              {/* Featured Story Hero */}
              {featuredArticle && (
                <div 
                  className="featured-card"
                  onClick={() => navigateToArticle(featuredArticle)}
                >
                  <img 
                    src={featuredArticle.cover_image_url || PLACEHOLDER_ARTICLE}
                    alt={featuredArticle.title}
                    className="featured-image"
                  />
                  <div className="featured-gradient">
                    <div className="featured-label">
                      <span>FEATURED STORY</span>
                    </div>
                    <h2 className="featured-title">{featuredArticle.title}</h2>
                    <div className="author-row">
                      <img 
                        src={featuredArticle.author_avatar_url || PLACEHOLDER_AVATAR}
                        alt={featuredArticle.author_name}
                        className="author-avatar"
                      />
                      <span className="author-name">
                        By {featuredArticle.author_name || 'Tavvy Team'}
                      </span>
                    </div>
                    <button className="read-button">
                      Read Article
                    </button>
                  </div>
                </div>
              )}

              {/* All Articles Grid */}
              {gridArticles.length > 0 && (
                <section className="articles-section">
                  <h3 className="section-title">
                    {searchQuery ? 'Search Results' : 'All Articles'}
                  </h3>
                  <div className="articles-grid">
                    {gridArticles.map((article) => (
                      <div
                        key={article.id}
                        className="article-card"
                        onClick={() => navigateToArticle(article)}
                      >
                        <img
                          src={article.cover_image_url || PLACEHOLDER_ARTICLE}
                          alt={article.title}
                          className="article-image"
                        />
                        <div className="article-overlay">
                          <h4 className="article-title">{article.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .atlas-screen {
            min-height: 100vh;
            background-color: ${backgroundColor};
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            padding: 20px 20px 16px;
            text-align: center;
          }

          .title {
            font-size: 36px;
            font-weight: 700;
            font-style: italic;
            color: ${textColor};
            margin: 0;
          }

          .tagline {
            font-size: 16px;
            font-weight: 500;
            color: ${COLORS.accent};
            margin: 4px 0 0;
          }

          /* Search Bar */
          .search-container {
            padding: 0 20px 16px;
          }

          .search-input-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            background: ${inputBgColor};
            border-radius: 12px;
            padding: 14px 16px;
          }

          .search-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            font-size: 16px;
            color: ${textColor};
          }

          .search-input::placeholder {
            color: ${secondaryTextColor};
          }

          .clear-button {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Filter Chips */
          .filter-container {
            padding: 0 20px 20px;
            overflow: hidden;
          }

          .filter-scroll {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .filter-scroll::-webkit-scrollbar {
            display: none;
          }

          .filter-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: ${cardColor};
            border: none;
            border-radius: 20px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }

          .filter-chip.active {
            background: ${COLORS.accent};
          }

          .chip-icon {
            font-size: 16px;
          }

          .chip-text {
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#E5E7EB' : '#374151'};
          }

          .filter-chip.active .chip-text {
            color: white;
          }

          /* Results Count */
          .results-count {
            padding: 0 20px 12px;
          }

          .results-count p {
            font-size: 14px;
            color: ${secondaryTextColor};
            margin: 0;
          }

          /* Empty State */
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }

          .empty-state p {
            color: ${secondaryTextColor};
            font-size: 16px;
          }

          /* Featured Card */
          .featured-card {
            margin: 0 20px 32px;
            border-radius: 20px;
            overflow: hidden;
            height: 320px;
            position: relative;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .featured-card:hover {
            transform: scale(1.01);
          }

          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .featured-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 24px;
            padding-top: 80px;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
          }

          .featured-label {
            display: inline-block;
            background: ${COLORS.accent};
            padding: 6px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .featured-label span {
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .featured-title {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin: 0 0 12px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .author-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
          }

          .author-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.3);
          }

          .author-name {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            font-weight: 500;
          }

          .read-button {
            background: ${COLORS.accent};
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            color: white;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          }

          .read-button:hover {
            transform: scale(1.02);
            opacity: 0.95;
          }

          /* Articles Section */
          .articles-section {
            padding: 0 20px;
          }

          .section-title {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 16px;
          }

          .articles-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .article-card {
            background: ${cardColor};
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
            position: relative;
            height: 200px;
          }

          .article-card:hover {
            transform: scale(1.02);
          }

          .article-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .article-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          }

          .article-title {
            font-size: 15px;
            font-weight: 600;
            color: white;
            margin: 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .articles-grid {
              grid-template-columns: 1fr;
            }
            
            .featured-card {
              height: 280px;
            }

            .article-card {
              height: 180px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
