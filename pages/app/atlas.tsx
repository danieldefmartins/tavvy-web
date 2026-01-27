/**
 * ATLAS HOME SCREEN - Premium Redesign
 * Pixel-perfect port from tavvy-mobile/screens/AtlasHomeScreen.tsx
 * 
 * Features:
 * - Clean, minimal magazine-style layout
 * - Large featured story hero with gradient overlay
 * - 2 trending guide cards
 * - Browse all articles button
 * - Dark/Light mode support
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { IoCompassOutline, IoChevronForward } from 'react-icons/io5';

// Design System Colors (matching iOS)
const COLORS = {
  accent: '#667EEA',
  accentLight: '#818CF8',
};

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
  article_template_type?: string;
}

// Placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100';

export default function AtlasHomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch featured article (most recent or marked as featured)
      const { data: featured } = await supabase
        .from('atlas_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch trending articles (excluding featured)
      const { data: articles } = await supabase
        .from('atlas_articles')
        .select('*')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5);

      if (featured) {
        setFeaturedArticle(featured);
      }

      if (articles) {
        // Get 2 articles that are not the featured one
        const trending = articles.filter(a => a.id !== featured?.id).slice(0, 2);
        setTrendingArticles(trending);
      }
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToArticle = (article: Article) => {
    if (article.article_template_type === 'owner_spotlight') {
      router.push(`/app/atlas/owner-spotlight/${article.slug || article.id}`);
    } else {
      router.push(`/app/article/${article.slug || article.id}`);
    }
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

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

          {/* Trending Guides */}
          <section className="trending-section">
            <h3 className="section-title">Trending Guides</h3>
            <div className="trending-grid">
              {trendingArticles.map((article) => (
                <div
                  key={article.id}
                  className="trending-card"
                  onClick={() => navigateToArticle(article)}
                >
                  <img
                    src={article.cover_image_url || PLACEHOLDER_ARTICLE}
                    alt={article.title}
                    className="trending-image"
                  />
                  <div className="trending-content">
                    <h4 className="trending-title">{article.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Browse All Button */}
          <section className="browse-section">
            <Link href="/app/atlas/search" className="browse-button">
              <IoCompassOutline size={24} color={COLORS.accent} />
              <span className="browse-text">Browse All Articles</span>
              <IoChevronForward size={20} color={secondaryTextColor} />
            </Link>
          </section>

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
            padding: 20px 20px 24px;
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
            background: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            color: #1F2937;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
          }

          .read-button:hover {
            transform: scale(1.02);
            opacity: 0.95;
          }

          /* Trending Section */
          .trending-section {
            padding: 0 20px;
            margin-bottom: 32px;
          }

          .section-title {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 16px;
          }

          .trending-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .trending-card {
            background: ${surfaceColor};
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
          }

          .trending-card:hover {
            transform: scale(1.02);
          }

          .trending-image {
            width: 100%;
            height: 140px;
            object-fit: cover;
          }

          .trending-content {
            padding: 14px;
          }

          .trending-title {
            font-size: 15px;
            font-weight: 600;
            color: ${isDark ? '#E5E7EB' : '#1F2937'};
            margin: 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Browse Section */
          .browse-section {
            padding: 0 20px;
          }

          .browse-button {
            display: flex;
            align-items: center;
            gap: 12px;
            background: ${isDark ? surfaceColor : '#FFFFFF'};
            border: ${isDark ? 'none' : '1px solid #E5E7EB'};
            border-radius: 16px;
            padding: 18px 20px;
            width: 100%;
            cursor: pointer;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .browse-button:hover {
            transform: scale(1.01);
          }

          .browse-text {
            flex: 1;
            font-size: 16px;
            font-weight: 600;
            color: ${textColor};
          }

          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .trending-grid {
              grid-template-columns: 1fr;
            }
            
            .featured-card {
              height: 280px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
