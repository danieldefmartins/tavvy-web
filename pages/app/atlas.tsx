/**
 * Atlas Screen - Travel Guides and Articles
 * Ported from tavvy-mobile/screens/AtlasHomeScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  author_name?: string;
  published_at?: string;
  read_time_minutes?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function AtlasScreen() {
  const { theme } = useThemeContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch articles
      const articlesResult = await supabase
        .from('atlas_articles')
        .select('*');
      
      const articlesData = articlesResult?.data || [];

      // Fetch categories
      const categoriesResult = await supabase
        .from('atlas_categories')
        .select('*');
      
      const categoriesData = categoriesResult?.data || [];

      setArticles(articlesData.filter((a: any) => a?.status === 'published'));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching atlas data:', error);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  // Default categories if none from database
  const defaultCategories: Category[] = [
    { id: 'all', name: 'All', slug: 'all', icon: '📚' },
    { id: 'cities', name: 'Cities', slug: 'cities', icon: '🏙️' },
    { id: 'food', name: 'Food & Drink', slug: 'food', icon: '🍽️' },
    { id: 'outdoors', name: 'Outdoors', slug: 'outdoors', icon: '🏕️' },
    { id: 'culture', name: 'Culture', slug: 'culture', icon: '🎭' },
    { id: 'tips', name: 'Travel Tips', slug: 'tips', icon: '💡' },
  ];

  const displayCategories = [
    { id: 'all', name: 'All', slug: 'all', icon: '📚' },
    ...(categories.length > 0 ? categories : defaultCategories.slice(1))
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>Atlas | TavvY</title>
        <meta name="description" content="TavvY Atlas - Travel guides, articles, and local insights" />
      </Head>

      <AppLayout>
        <div className="atlas-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="atlas-header">
            <h1 className="title" style={{ color: theme.text }}>
              🗺️ Atlas
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Travel guides and local insights
            </p>
            
            {/* Search */}
            <div 
              className="search-container"
              style={{ 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              }}
            >
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
          </header>

          {/* Category Pills */}
          <div className="categories-scroll">
            {displayCategories.map((category) => (
              <button
                key={category.id}
                className={`category-pill ${selectedCategory === category.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.slug)}
                style={{
                  backgroundColor: selectedCategory === category.slug ? theme.primary : theme.surface,
                  color: selectedCategory === category.slug ? '#FFFFFF' : theme.text,
                }}
              >
                {category.icon && <span>{category.icon} </span>}
                {category.name}
              </button>
            ))}
          </div>

          {/* Articles */}
          <main className="articles-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ borderColor: theme.primary }} />
                <p style={{ color: theme.textSecondary }}>Loading articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📖</span>
                <h3 style={{ color: theme.text }}>No articles found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery ? 'Try a different search term' : 'Check back soon for new content'}
                </p>
              </div>
            ) : (
              <div className="articles-grid">
                {filteredArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/app/atlas/article/${article.slug || article.id}`}
                    className={`article-card ${index === 0 ? 'featured' : ''}`}
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="article-image-container">
                      {article.cover_image_url ? (
                        <img 
                          src={article.cover_image_url} 
                          alt={article.title}
                          className="article-image"
                        />
                      ) : (
                        <div 
                          className="article-placeholder"
                          style={{ backgroundColor: theme.surface }}
                        >
                          <span>🗺️</span>
                        </div>
                      )}
                      {article.category && (
                        <span 
                          className="article-category-badge"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {article.category}
                        </span>
                      )}
                    </div>
                    <div className="article-info">
                      <h3 className="article-title" style={{ color: theme.text }}>
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="article-excerpt" style={{ color: theme.textSecondary }}>
                          {article.excerpt}
                        </p>
                      )}
                      <div className="article-meta">
                        {article.author_name && (
                          <span style={{ color: theme.textTertiary }}>
                            By {article.author_name}
                          </span>
                        )}
                        {article.published_at && (
                          <span style={{ color: theme.textTertiary }}>
                            {formatDate(article.published_at)}
                          </span>
                        )}
                        {article.read_time_minutes && (
                          <span style={{ color: theme.textTertiary }}>
                            {article.read_time_minutes} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .atlas-screen {
            min-height: 100vh;
          }
          
          .atlas-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .subtitle {
            font-size: 14px;
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
            border-width: 1px;
            border-style: solid;
          }
          
          .search-icon {
            font-size: 16px;
            margin-right: 12px;
          }
          
          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            padding: 0 ${spacing.lg}px ${spacing.md}px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .category-pill {
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .articles-container {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
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
            border-width: 3px;
            border-style: solid;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .articles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .article-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .article-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          }
          
          .article-card.featured {
            grid-column: 1 / -1;
          }
          
          .article-card.featured .article-image-container {
            height: 200px;
          }
          
          .article-image-container {
            height: 140px;
            position: relative;
            overflow: hidden;
          }
          
          .article-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .article-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          }
          
          .article-category-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            padding: 4px 10px;
            border-radius: ${borderRadius.sm}px;
            color: white;
            font-size: 12px;
            font-weight: 600;
          }
          
          .article-info {
            padding: ${spacing.md}px;
          }
          
          .article-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .article-card.featured .article-title {
            font-size: 20px;
          }
          
          .article-excerpt {
            font-size: 14px;
            margin: 0 0 12px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .article-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 12px;
          }
          
          .article-meta span:not(:last-child)::after {
            content: '•';
            margin-left: 8px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
