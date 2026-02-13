/**
 * UNIVERSE DETAIL SCREEN
 * Pixel-perfect port from tavvy-mobile/screens/UniverseDetailScreen.tsx
 * 
 * Features:
 * - Banner with universe info
 * - Stats bar (places, sub-universes, articles, signals)
 * - Tab navigation (Overview, Places, Articles, Guides)
 * - Content sections for each tab
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import AppLayout from '../../../../components/AppLayout';
import { supabase } from '../../../../lib/supabaseClient';
import { IoArrowBack, IoShareOutline, IoLocationOutline, IoGlobeOutline, IoDocumentTextOutline, IoStarOutline } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type TabType = 'overview' | 'places' | 'articles' | 'guides';

interface Universe {
  id: string;
  name: string;
  slug: string;
  location?: string;
  description?: string;
  banner_image_url?: string;
  place_count?: number;
  sub_universe_count?: number;
  article_count?: number;
  total_signals?: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  cover_image_url?: string;
  author_name?: string;
  read_time_minutes?: number;
}

interface Place {
  id: string;
  name: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  photos?: string[];
  rating?: number;
}

interface SubUniverse {
  id: string;
  name: string;
  slug: string;
  banner_image_url?: string;
  place_count?: number;
}

// Category fallback images
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'coffee': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    'rv park': 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
    'campground': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'airport': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  
  return imageMap.default;
};

export default function UniverseDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { theme, isDark } = useThemeContext();

  const [universe, setUniverse] = useState<Universe | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [subUniverses, setSubUniverses] = useState<SubUniverse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadUniverse();
    }
  }, [slug]);

  useEffect(() => {
    if (universe) {
      loadData();
    }
  }, [universe]);

  const loadUniverse = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        setUniverse(data);
      }
    } catch (error) {
      console.error('Error loading universe:', error);
    }
  };

  const loadData = async () => {
    if (!universe) return;

    try {
      setLoading(true);

      // Load articles, sub-universes, and places in parallel
      const [articlesRes, subUniversesRes, placesRes] = await Promise.all([
        supabase
          .from('atlas_articles')
          .select('id, title, slug, cover_image_url, author_name, read_time_minutes')
          .eq('universe_id', universe.id)
          .eq('status', 'published')
          .limit(10),
        supabase
          .from('atlas_universes')
          .select('id, name, slug, banner_image_url, place_count')
          .eq('parent_universe_id', universe.id)
          .limit(10),
        supabase
          .from('fsq_places_raw')
          .select('id, name, fsq_category_labels, address, locality, region')
          .eq('universe_id', universe.id)
          .limit(20),
      ]);

      if (articlesRes.data) setArticles(articlesRes.data);
      if (subUniversesRes.data) setSubUniverses(subUniversesRes.data);
      if (placesRes.data) {
        setPlaces(placesRes.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.fsq_category_labels?.[0] || 'Place',
          address: p.address,
          city: p.locality,
          state: p.region,
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num?.toString() || '0';
  };

  const handleShare = async () => {
    if (navigator.share && universe) {
      try {
        await navigator.share({
          title: universe.name,
          text: `Explore ${universe.name} on TavvY Atlas`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const backgroundColor = theme.background;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const surfaceColor = theme.surface;

  if (!universe) {
    return (
      <AppLayout hideTabBar>
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
              border-top-color: #14b8a6;
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
        <title>{universe.name} | TavvY Atlas</title>
        <meta name="description" content={universe.description || `Explore ${universe.name} on TavvY Atlas`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="universe-screen">
          {/* Banner */}
          <div className="banner-container">
            <img
              src={universe.banner_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'}
              alt={universe.name}
              className="banner-image"
            />
            <button className="back-button" onClick={() => router.back()}>
              <IoArrowBack size={24} color="white" />
            </button>
            <button className="share-button" onClick={handleShare}>
              <IoShareOutline size={24} color="white" />
            </button>
            <div className="banner-overlay">
              <h1 className="universe-name">{universe.name}</h1>
              {universe.location && (
                <p className="universe-location">{universe.location}</p>
              )}
              <div className="universe-badge">
                <span>UNIVERSE</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <IoLocationOutline size={20} color="#14b8a6" />
              <span className="stat-number">{universe.place_count || 0}</span>
              <span className="stat-label">Places</span>
            </div>
            <div className="stat-item">
              <IoGlobeOutline size={20} color="#14b8a6" />
              <span className="stat-number">{universe.sub_universe_count || 0}</span>
              <span className="stat-label">Sub-Universes</span>
            </div>
            <div className="stat-item">
              <IoDocumentTextOutline size={20} color="#14b8a6" />
              <span className="stat-number">{universe.article_count || 0}</span>
              <span className="stat-label">Articles</span>
            </div>
            <div className="stat-item">
              <IoStarOutline size={20} color="#14b8a6" />
              <span className="stat-number">{formatNumber(universe.total_signals || 0)}</span>
              <span className="stat-label">Signals</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-bar">
            {(['overview', 'places', 'articles', 'guides'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <main className="content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                {universe.description && (
                  <div className="description-section">
                    <h3>About</h3>
                    <p>{universe.description}</p>
                  </div>
                )}

                {subUniverses.length > 0 && (
                  <div className="section">
                    <h3>Sub-Universes</h3>
                    <div className="sub-universes-grid">
                      {subUniverses.slice(0, 4).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/app/atlas/universe/${sub.slug}`}
                          className="sub-universe-card"
                        >
                          <img
                            src={sub.banner_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                            alt={sub.name}
                          />
                          <div className="sub-universe-info">
                            <span className="sub-universe-name">{sub.name}</span>
                            <span className="sub-universe-count">{sub.place_count || 0} places</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {articles.length > 0 && (
                  <div className="section">
                    <h3>Featured Articles</h3>
                    <div className="articles-list">
                      {articles.slice(0, 3).map((article) => (
                        <Link
                          key={article.id}
                          href={`/app/article/${article.slug || article.id}`}
                          className="article-card"
                        >
                          <img
                            src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                            alt={article.title}
                          />
                          <div className="article-info">
                            <span className="article-title">{article.title}</span>
                            <span className="article-meta">
                              {article.author_name || 'Tavvy Team'} • {article.read_time_minutes || 5} min
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'places' && (
              <div className="places-tab">
                {places.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📍</span>
                    <h3>No places yet</h3>
                    <p>Places will appear here soon</p>
                  </div>
                ) : (
                  <div className="places-grid">
                    {places.map((place) => (
                      <Link
                        key={place.id}
                        href={`/place/${place.id}`}
                        className="place-card"
                      >
                        <img
                          src={getCategoryFallbackImage(place.category || '')}
                          alt={place.name}
                        />
                        <div className="place-info">
                          <span className="place-name">{place.name}</span>
                          <span className="place-category">{place.category}</span>
                          {place.city && (
                            <span className="place-location">{place.city}, {place.state}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="articles-tab">
                {articles.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📄</span>
                    <h3>No articles yet</h3>
                    <p>Articles will appear here soon</p>
                  </div>
                ) : (
                  <div className="articles-list full">
                    {articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/app/article/${article.slug || article.id}`}
                        className="article-card"
                      >
                        <img
                          src={article.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                          alt={article.title}
                        />
                        <div className="article-info">
                          <span className="article-title">{article.title}</span>
                          <span className="article-meta">
                            {article.author_name || 'Tavvy Team'} • {article.read_time_minutes || 5} min
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'guides' && (
              <div className="guides-tab">
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <h3>Guides coming soon</h3>
                  <p>In-depth guides for {universe.name} will appear here</p>
                </div>
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .universe-screen {
            min-height: 100vh;
            background-color: ${backgroundColor};
            padding-bottom: 40px;
          }

          /* Banner */
          .banner-container {
            position: relative;
            height: 280px;
          }

          .banner-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .back-button,
          .share-button {
            position: absolute;
            top: 20px;
            width: 44px;
            height: 44px;
            border-radius: 22px;
            background: rgba(0,0,0,0.4);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }

          .back-button {
            left: 16px;
          }

          .share-button {
            right: 16px;
          }

          .banner-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 24px 20px;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          }

          .universe-name {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }

          .universe-location {
            font-size: 16px;
            color: rgba(255,255,255,0.8);
            margin: 0 0 12px;
          }

          .universe-badge {
            display: inline-block;
            background: #14b8a6;
            padding: 6px 12px;
            border-radius: 6px;
          }

          .universe-badge span {
            font-size: 11px;
            font-weight: 700;
            color: white;
            letter-spacing: 1px;
          }

          /* Stats Bar */
          .stats-bar {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: ${surfaceColor};
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
          }

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .stat-number {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
          }

          .stat-label {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          /* Tab Bar */
          .tab-bar {
            display: flex;
            padding: 0 20px;
            background: ${surfaceColor};
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
            overflow-x: auto;
          }

          .tab-button {
            padding: 16px 20px;
            background: none;
            border: none;
            font-size: 14px;
            font-weight: 600;
            color: ${secondaryTextColor};
            cursor: pointer;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }

          .tab-button.active {
            color: #14b8a6;
            border-bottom-color: #14b8a6;
          }

          /* Content */
          .content {
            padding: 20px;
          }

          .section {
            margin-bottom: 32px;
          }

          .section h3,
          .description-section h3 {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 16px;
          }

          .description-section {
            margin-bottom: 32px;
          }

          .description-section p {
            font-size: 15px;
            color: ${secondaryTextColor};
            line-height: 1.6;
            margin: 0;
          }

          /* Sub-Universes Grid */
          .sub-universes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .sub-universe-card {
            border-radius: 12px;
            overflow: hidden;
            background: ${surfaceColor};
            text-decoration: none;
            transition: transform 0.2s;
          }

          .sub-universe-card:hover {
            transform: scale(1.02);
          }

          .sub-universe-card img {
            width: 100%;
            height: 100px;
            object-fit: cover;
          }

          .sub-universe-info {
            padding: 12px;
          }

          .sub-universe-name {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
          }

          .sub-universe-count {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          /* Articles List */
          .articles-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .article-card {
            display: flex;
            gap: 12px;
            background: ${surfaceColor};
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .article-card:hover {
            transform: scale(1.01);
          }

          .article-card img {
            width: 100px;
            height: 80px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .article-info {
            padding: 12px 12px 12px 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .article-title {
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .article-meta {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          /* Places Grid */
          .places-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .place-card {
            border-radius: 12px;
            overflow: hidden;
            background: ${surfaceColor};
            text-decoration: none;
            transition: transform 0.2s;
          }

          .place-card:hover {
            transform: scale(1.02);
          }

          .place-card img {
            width: 100%;
            height: 120px;
            object-fit: cover;
          }

          .place-info {
            padding: 12px;
          }

          .place-name {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
          }

          .place-category {
            display: block;
            font-size: 12px;
            color: #14b8a6;
            margin-bottom: 2px;
          }

          .place-location {
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          /* Empty State */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
            text-align: center;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-state h3 {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 8px;
          }

          .empty-state p {
            font-size: 14px;
            color: ${secondaryTextColor};
            margin: 0;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .sub-universes-grid,
            .places-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
