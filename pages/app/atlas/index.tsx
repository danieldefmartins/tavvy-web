/**
 * ATLAS INDEX PAGE
 * Browse all Atlas content - categories, universes, and recent articles
 * Acts as a hub for all Atlas content
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { IoSearch, IoChevronForward, IoCompassOutline, IoGlobeOutline, IoBookOutline } from 'react-icons/io5';

const TEAL_PRIMARY = '#14b8a6';
const ACCENT_COLOR = '#667EEA';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
}

interface Universe {
  id: string;
  name: string;
  slug: string;
  location?: string;
  banner_image_url?: string;
  place_count?: number;
  article_count?: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  cover_image_url?: string;
  author_name?: string;
  read_time_minutes?: number;
}

export default function AtlasIndexPage() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, universesRes, articlesRes] = await Promise.all([
        supabase
          .from('atlas_categories')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('atlas_universes')
          .select('*')
          .eq('status', 'published')
          .eq('is_featured', true)
          .order('published_at', { ascending: false })
          .limit(6),
        supabase
          .from('atlas_articles')
          .select('id, title, slug, cover_image_url, author_name, read_time_minutes')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (universesRes.data) setUniverses(universesRes.data);
      if (articlesRes.data) setRecentArticles(articlesRes.data);
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = theme.background;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const surfaceColor = theme.surface;

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-screen" style={{ backgroundColor }}>
          <div className="loading-spinner" />
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
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
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Browse Atlas | TavvY</title>
        <meta name="description" content="Browse all TavvY Atlas content - categories, universes, and articles" />
      </Head>

      <AppLayout>
        <div className="atlas-index">
          {/* Header */}
          <header className="header">
            <h1 className="title">Browse Atlas</h1>
            <Link href="/app/atlas/search" className="search-button">
              <IoSearch size={24} color={textColor} />
            </Link>
          </header>

          {/* Quick Links */}
          <section className="quick-links">
            <Link href="/app/atlas" className="quick-link">
              <div className="quick-link-icon" style={{ backgroundColor: `${ACCENT_COLOR}20` }}>
                <IoCompassOutline size={24} color={ACCENT_COLOR} />
              </div>
              <span>Featured</span>
            </Link>
            <Link href="/app/atlas/search" className="quick-link">
              <div className="quick-link-icon" style={{ backgroundColor: `${TEAL_PRIMARY}20` }}>
                <IoSearch size={24} color={TEAL_PRIMARY} />
              </div>
              <span>Search</span>
            </Link>
          </section>

          {/* Categories */}
          <section className="section">
            <h2 className="section-title">
              <IoBookOutline size={20} color={ACCENT_COLOR} />
              Categories
            </h2>
            <div className="categories-grid">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/app/atlas/category/${category.slug}`}
                  className="category-card"
                >
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: `${category.color || TEAL_PRIMARY}20` }}
                  >
                    <span>{category.icon || '📚'}</span>
                  </div>
                  <span className="category-name">{category.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Universes */}
          {universes.length > 0 && (
            <section className="section">
              <h2 className="section-title">
                <IoGlobeOutline size={20} color={ACCENT_COLOR} />
                Featured Universes
              </h2>
              <div className="universes-grid">
                {universes.map((universe) => (
                  <Link
                    key={universe.id}
                    href={`/app/atlas/universe/${universe.slug}`}
                    className="universe-card"
                  >
                    <img
                      src={universe.banner_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                      alt={universe.name}
                      className="universe-image"
                    />
                    <div className="universe-info">
                      <span className="universe-name">{universe.name}</span>
                      {universe.location && (
                        <span className="universe-location">{universe.location}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Articles */}
          {recentArticles.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recent Articles</h2>
                <Link href="/app/atlas/search" className="see-all">
                  See All <IoChevronForward size={16} />
                </Link>
              </div>
              <div className="articles-list">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/app/article/${article.slug || article.id}`}
                    className="article-row"
                  >
                    <img
                      src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200'}
                      alt={article.title}
                      className="article-thumb"
                    />
                    <div className="article-info">
                      <span className="article-title">{article.title}</span>
                      <span className="article-meta">
                        {article.author_name || 'Tavvy Team'} • {article.read_time_minutes || 5} min
                      </span>
                    </div>
                    <IoChevronForward size={20} color={secondaryTextColor} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .atlas-index {
            min-height: 100vh;
            background-color: ${backgroundColor};
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px;
          }

          .title {
            font-size: 28px;
            font-weight: 700;
            color: ${textColor};
            margin: 0;
          }

          .search-button {
            padding: 10px;
            background: ${surfaceColor};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Quick Links */
          .quick-links {
            display: flex;
            gap: 12px;
            padding: 0 20px 24px;
          }

          .quick-link {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: ${surfaceColor};
            border-radius: 16px;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .quick-link:hover {
            transform: scale(1.02);
          }

          .quick-link-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .quick-link span {
            font-size: 15px;
            font-weight: 600;
            color: ${textColor};
          }

          /* Sections */
          .section {
            padding: 0 20px 32px;
          }

          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 16px;
          }

          .see-all {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 600;
            color: ${ACCENT_COLOR};
            text-decoration: none;
          }

          /* Categories Grid */
          .categories-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .category-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 8px;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .category-card:hover {
            transform: scale(1.05);
          }

          .category-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .category-icon span {
            font-size: 28px;
          }

          .category-name {
            font-size: 12px;
            font-weight: 600;
            color: ${textColor};
            text-align: center;
          }

          /* Universes Grid */
          .universes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .universe-card {
            border-radius: 16px;
            overflow: hidden;
            background: ${surfaceColor};
            text-decoration: none;
            transition: transform 0.2s;
          }

          .universe-card:hover {
            transform: scale(1.02);
          }

          .universe-image {
            width: 100%;
            height: 100px;
            object-fit: cover;
          }

          .universe-info {
            padding: 12px;
          }

          .universe-name {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
          }

          .universe-location {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          /* Articles List */
          .articles-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .article-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: ${surfaceColor};
            border-radius: 12px;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .article-row:hover {
            transform: scale(1.01);
          }

          .article-thumb {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .article-info {
            flex: 1;
            min-width: 0;
          }

          .article-title {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .article-meta {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          .bottom-spacing {
            height: 40px;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .categories-grid {
              grid-template-columns: repeat(3, 1fr);
            }

            .universes-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
