/**
 * ATLAS SEARCH SCREEN
 * Pixel-perfect port from tavvy-mobile/screens/AtlasSearchScreen.tsx
 * 
 * Features:
 * - Search bar with auto-focus
 * - Results list with article cards
 * - Empty states for no search and no results
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { IoArrowBack, IoClose, IoSearch, IoHeart } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Design colors
const TEAL_PRIMARY = '#14b8a6';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  author_name?: string;
  read_time_minutes?: number;
  love_count?: number;
  category?: {
    name: string;
    color: string;
  };
}

export default function AtlasSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { theme, isDark } = useThemeContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-focus search input on mount
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);

      const { data, error } = await supabase
        .from('atlas_articles')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
        .order('view_count', { ascending: false })
        .limit(20);

      if (!error && data) {
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const backgroundColor = theme.background;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const surfaceColor = theme.surface;

  return (
    <>
      <Head>
        <title>Search Atlas | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div className="search-screen">
          {/* Header with Search Bar */}
          <header className="header">
            <button className="back-button" onClick={() => router.back()}>
              <IoArrowBack size={24} color={textColor} />
            </button>
            <div className="search-bar-container">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search articles, universes, places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchQuery.length > 0 && (
                <button className="clear-button" onClick={clearSearch}>
                  <IoClose size={18} color="#666" />
                </button>
              )}
            </div>
            <button className="search-button" onClick={handleSearch}>
              <IoSearch size={24} color={TEAL_PRIMARY} />
            </button>
          </header>

          {/* Content */}
          <main className="content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : hasSearched ? (
              <>
                {/* Results Count */}
                <div className="results-header">
                  <span className="results-count">
                    {results.length} results for "{searchQuery}"
                  </span>
                </div>

                {/* Results List */}
                {results.length > 0 ? (
                  <div className="results-list">
                    {results.map((article) => (
                      <Link
                        key={article.id}
                        href={`/app/article/${article.slug || article.id}`}
                        locale={locale}
                        className="result-card"
                      >
                        <img
                          src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                          alt={article.title}
                          className="result-image"
                        />
                        <div className="result-content">
                          <div 
                            className="result-badge"
                            style={{ backgroundColor: article.category?.color || TEAL_PRIMARY }}
                          >
                            ARTICLE
                          </div>
                          <h3 className="result-title">{article.title}</h3>
                          {article.excerpt && (
                            <p className="result-excerpt">{article.excerpt}</p>
                          )}
                          <div className="result-meta">
                            <span className="result-author">{article.author_name || 'Tavvy Team'}</span>
                            <span className="result-dot">•</span>
                            <span className="result-read-time">{article.read_time_minutes || 5} min read</span>
                            {article.love_count && article.love_count > 0 && (
                              <>
                                <span className="result-dot">•</span>
                                <span className="result-loves">
                                  {formatNumber(article.love_count)} <IoHeart size={12} color="#ef4444" />
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <h3 className="empty-title">No results found</h3>
                    <p className="empty-text">Try different keywords or browse categories</p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🗺️</span>
                <h3 className="empty-title">Search Tavvy Atlas</h3>
                <p className="empty-text">Find articles, guides, and universes</p>
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .search-screen {
            min-height: 100vh;
            background-color: ${backgroundColor};
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            padding-top: 20px;
            background: ${backgroundColor};
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .back-button {
            padding: 8px;
            margin-right: 8px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .search-bar-container {
            flex: 1;
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5'};
            border-radius: 12px;
            padding: 0 16px;
          }

          .search-input {
            flex: 1;
            padding: 12px 0;
            font-size: 16px;
            color: ${textColor};
            background: transparent;
            border: none;
            outline: none;
          }

          .search-input::placeholder {
            color: ${secondaryTextColor};
          }

          .clear-button {
            padding: 4px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .search-button {
            padding: 8px;
            margin-left: 8px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Content */
          .content {
            padding: 0;
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
            border-top-color: ${TEAL_PRIMARY};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }

          /* Results */
          .results-header {
            padding: 20px 20px 12px;
          }

          .results-count {
            font-size: 14px;
            color: ${secondaryTextColor};
          }

          .results-list {
            padding: 0 20px 40px;
          }

          .result-card {
            display: flex;
            margin-bottom: 16px;
            background: ${surfaceColor};
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
            transition: transform 0.2s;
          }

          .result-card:hover {
            transform: scale(1.01);
          }

          .result-image {
            width: 120px;
            height: 140px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .result-content {
            flex: 1;
            padding: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .result-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            color: white;
            margin-bottom: 6px;
            align-self: flex-start;
          }

          .result-title {
            font-size: 15px;
            font-weight: 600;
            color: ${textColor};
            margin: 0 0 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .result-excerpt {
            font-size: 13px;
            color: ${secondaryTextColor};
            margin: 0 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .result-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
          }

          .result-author,
          .result-read-time,
          .result-loves {
            font-size: 12px;
            color: ${secondaryTextColor};
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .result-dot {
            color: ${secondaryTextColor};
            margin: 0 2px;
          }

          /* Empty State */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 80px 40px;
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

          /* Responsive */
          @media (max-width: 480px) {
            .result-image {
              width: 100px;
              height: 120px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
