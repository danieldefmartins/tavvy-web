/**
 * ATLAS HOME SCREEN - Web Version V2
 * Port from iOS AtlasHomeScreen.tsx with V2 dark design system
 * 
 * Features:
 * - Search bar that searches title, excerpt, content, and author
 * - Category filter chips
 * - Featured story hero
 * - All articles displayed in grid
 * - V2 design system matching Pros page
 */

import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { getCoverImageUrl } from '../../../lib/imageUtils';
import { IoSearch, IoCloseCircle, IoDocumentTextOutline } from 'react-icons/io5';

// V2 Design System Colors
const COLORS = {
  primaryBlue: '#6B7FFF',
  accentTeal: '#00CED1',
  accent: '#667EEA',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  errorRed: '#EF4444',
};

// Default placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=T&background=667EEA&color=fff&size=100';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface AtlasArticle {
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
  article_template_type?: string;
}

export default function AtlasHomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data states
  const [allArticles, setAllArticles] = useState<AtlasArticle[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<AtlasArticle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      // Fetch all published articles
      const { data: articles } = await supabase
        .from('atlas_articles')
        .select('id, title, slug, excerpt, content, cover_image_url, author_name, author_avatar_url, read_time_minutes, view_count, love_count, category_id, published_at, article_template_type')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (articles && articles.length > 0) {
        setAllArticles(articles as AtlasArticle[]);
        setDisplayedArticles(articles as AtlasArticle[]);
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

  const navigateToArticle = (article: AtlasArticle) => {
    if (article.article_template_type === 'owner_spotlight') {
      router.push(`/app/atlas/owner-spotlight/${article.slug}`);
    } else {
      router.push(`/app/article/${article.slug}`);
    }
  };

  const bgColor = isDark ? '#121212' : '#FAFAFA';
  const surfaceColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const surfaceAltColor = isDark ? '#2A2A2A' : '#F3F4F6';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#333333' : '#E5E7EB';
  const inputBgColor = isDark ? '#2C2C2E' : '#E5E5EA';

  if (loading) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: secondaryTextColor }}>Loading articles...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Get featured article (first one) and rest for grid
  const featuredArticle = displayedArticles.length > 0 ? displayedArticles[0] : null;
  const gridArticles = displayedArticles.slice(1);

  return (
    <>
      <Head>
        <title>Atlas | TavvY</title>
        <meta name="description" content="Your guide to the exceptional." />
      </Head>

      <AppLayout>
        <div className="atlas-screen" style={{ backgroundColor: bgColor, minHeight: '100vh' }}>
          {/* Header */}
          <div className="header">
            <h1 className="title">Atlas</h1>
            <p className="tagline">Your guide to the exceptional.</p>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper" style={{ backgroundColor: inputBgColor }}>
              <IoSearch size={20} color={secondaryTextColor} />
              <input
                type="text"
                className="search-input"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ color: textColor }}
              />
              {searchQuery.length > 0 && (
                <button onClick={clearSearch} className="clear-button">
                  <IoCloseCircle size={20} color={secondaryTextColor} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="filter-container">
            {/* All chip */}
            <button
              className={`filter-chip ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => handleCategorySelect(null)}
              style={{ backgroundColor: selectedCategory === null ? COLORS.accent : surfaceColor }}
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
                style={{ backgroundColor: selectedCategory === category.id ? COLORS.accent : surfaceColor }}
              >
                {category.icon && <span className="chip-icon">{category.icon}</span>}
                <span className="chip-text">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Results Count */}
          {searchQuery.length > 0 && (
            <div className="results-count">
              <p className="results-text" style={{ color: secondaryTextColor }}>
                {displayedArticles.length} result{displayedArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}

          {/* No Results */}
          {displayedArticles.length === 0 ? (
            <div className="empty-state">
              <IoDocumentTextOutline size={48} color={secondaryTextColor} />
              <p className="empty-text" style={{ color: secondaryTextColor }}>
                No articles found{searchQuery ? ` matching "${searchQuery}"` : ' in this category'}.
              </p>
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
                    src={getCoverImageUrl(featuredArticle.cover_image_url) || PLACEHOLDER_ARTICLE}
                    alt={featuredArticle.title}
                    className="featured-image"
                  />
                  <div className="featured-gradient">
                    <div className="featured-label">
                      <span className="featured-label-text">FEATURED STORY</span>
                    </div>
                    <h2 className="featured-title">{featuredArticle.title}</h2>
                    <div className="author-row">
                      <img
                        src={featuredArticle.author_avatar_url || PLACEHOLDER_AVATAR}
                        alt={featuredArticle.author_name || 'Author'}
                        className="author-avatar"
                      />
                      <span className="author-name">
                        By {featuredArticle.author_name || 'Tavvy Team'}
                      </span>
                    </div>
                    <button 
                      className="read-button"
                      onClick={() => navigateToArticle(featuredArticle)}
                    >
                      Read Article
                    </button>
                  </div>
                </div>
              )}

              {/* All Articles Grid */}
              {gridArticles.length > 0 && (
                <div className="articles-section">
                  <h2 className="section-title" style={{ color: textColor }}>
                    {searchQuery ? 'Search Results' : 'All Articles'}
                  </h2>
                  <div className="articles-grid">
                    {gridArticles.map((article) => (
                      <div
                        key={article.id}
                        className="article-card"
                        onClick={() => navigateToArticle(article)}
                        style={{ backgroundColor: surfaceColor }}
                      >
                        <img
                          src={getCoverImageUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE}
                          alt={article.title}
                          className="article-image"
                        />
                        <div className="article-overlay">
                          <h3 className="article-title">{article.title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom Spacing */}
          <div style={{ height: 100 }} />

          <style jsx>{`
            .atlas-screen {
              padding-bottom: 80px;
            }

            /* Header */
            .header {
              padding: 24px 20px;
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
              margin: 8px 0 0;
            }

            /* Search Bar */
            .search-container {
              padding: 0 20px 16px;
            }

            .search-input-wrapper {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 16px;
              border-radius: 12px;
            }

            .search-input {
              flex: 1;
              background: transparent;
              border: none;
              outline: none;
              font-size: 15px;
            }

            .search-input::placeholder {
              color: ${secondaryTextColor};
            }

            .clear-button {
              background: none;
              border: none;
              padding: 0;
              cursor: pointer;
              display: flex;
              align-items: center;
            }

            /* Filter Chips */
            .filter-container {
              display: flex;
              gap: 8px;
              padding: 0 20px 16px;
              overflow-x: auto;
              scrollbar-width: none;
            }

            .filter-container::-webkit-scrollbar {
              display: none;
            }

            .filter-chip {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 10px 16px;
              border: none;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              white-space: nowrap;
              transition: transform 0.2s;
            }

            .filter-chip:hover {
              transform: scale(1.05);
            }

            .filter-chip.active .chip-text {
              color: #FFFFFF;
            }

            .filter-chip:not(.active) .chip-text {
              color: ${isDark ? '#E5E7EB' : '#374151'};
            }

            .chip-icon {
              font-size: 16px;
            }

            .chip-text {
              font-size: 14px;
              font-weight: 500;
            }

            /* Results Count */
            .results-count {
              padding: 0 20px 16px;
            }

            .results-text {
              font-size: 14px;
              margin: 0;
            }

            /* Empty State */
            .empty-state {
              text-align: center;
              padding: 60px 20px;
            }

            .empty-text {
              font-size: 16px;
              margin-top: 16px;
            }

            /* Featured Card */
            .featured-card {
              position: relative;
              height: 500px;
              margin: 0 20px 32px;
              border-radius: 16px;
              overflow: hidden;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .featured-card:hover {
              transform: translateY(-4px);
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
              padding: 32px 24px;
              background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
            }

            .featured-label {
              display: inline-block;
              background: rgba(102, 126, 234, 0.9);
              padding: 6px 12px;
              border-radius: 6px;
              margin-bottom: 16px;
            }

            .featured-label-text {
              font-size: 11px;
              font-weight: 700;
              color: #FFFFFF;
              letter-spacing: 1px;
            }

            .featured-title {
              font-size: 28px;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0 0 16px;
              line-height: 1.3;
            }

            .author-row {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
            }

            .author-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              object-fit: cover;
            }

            .author-name {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
            }

            .read-button {
              background: ${COLORS.accent};
              color: #FFFFFF;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }

            .read-button:hover {
              background: ${COLORS.primaryBlue};
            }

            /* Articles Section */
            .articles-section {
              padding: 0 20px;
            }

            .section-title {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 20px;
            }

            .articles-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 16px;
            }

            .article-card {
              position: relative;
              height: 200px;
              border-radius: 12px;
              overflow: hidden;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .article-card:hover {
              transform: translateY(-4px);
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
              padding: 20px;
              background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            }

            .article-title {
              font-size: 16px;
              font-weight: 600;
              color: #FFFFFF;
              margin: 0;
              line-height: 1.4;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            @media (max-width: 768px) {
              .articles-grid {
                grid-template-columns: 1fr;
              }

              .featured-title {
                font-size: 24px;
              }

              .featured-card {
                height: 400px;
              }
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}
