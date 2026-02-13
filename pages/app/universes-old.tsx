/**
 * Universe Discovery Screen
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Matches mockup design exactly
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Full-width featured universe hero with badge at top-left
 * - Icon-driven category filters (square buttons)
 * - 2x2 popular universes grid with activity signals
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { FiSearch, FiX } from 'react-icons/fi';
import { 
  IoRocket, IoAirplane, IoLeaf, IoBusiness
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Design System Colors
const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
  activityMedium: '#F59E0B',
};

// Default placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Category icons for the filter buttons - matching mockup square icons
const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  'theme-parks': { icon: <IoRocket size={24} />, label: 'Theme Parks' },
  'airports': { icon: <IoAirplane size={24} />, label: 'Airports' },
  'national-parks': { icon: <IoLeaf size={24} />, label: 'Parks' },
  'cities': { icon: <IoBusiness size={24} />, label: 'Cities' },
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  total_signals?: number;
  place_count?: number;
  category_id?: string;
  is_featured?: boolean;
  status?: string;
  location?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export default function UniverseDiscoveryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
  const [popularUniverses, setPopularUniverses] = useState<Universe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadUniverses();
  }, [activeCategory, categories]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catsData } = await supabase
        .from('atlas_categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      setCategories(catsData || []);
      await loadUniverses();
    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniverses = async () => {
    try {
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1);

      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .order('total_signals', { ascending: false });

      if (activeCategory !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategory);
        if (selectedCat) {
          featuredQuery = featuredQuery.eq('category_id', selectedCat.id);
          universesQuery = universesQuery.eq('category_id', selectedCat.id);
        }
      }

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.single(),
        universesQuery.limit(8),
      ]);

      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      } else {
        setFeaturedUniverse(null);
      }

      setPopularUniverses(universesResult.data || []);
    } catch (error) {
      console.error('Error loading universes:', error);
    }
  };

  // Get activity level based on signals
  const getActivityLevel = (signals: number | undefined) => {
    if (!signals) return { label: 'High Activity', color: COLORS.activityHigh };
    if (signals > 100) return { label: 'High Activity', color: COLORS.activityHigh };
    if (signals > 50) return { label: 'Moderate', color: COLORS.activityMedium };
    return { label: 'High Activity', color: COLORS.activityHigh };
  };

  // Get category type from universe
  const getCategoryType = (categoryId: string | null | undefined) => {
    if (!categoryId) return 'Universe';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Universe';
  };

  const handleUniversePress = (universe: Universe) => {
    router.push(`/app/universe/${universe.slug || universe.id}`, undefined, { locale });
  };

  const backgroundColor = isDark ? '#000000' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';

  // Filter by search query
  const filteredUniverses = searchQuery
    ? popularUniverses.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : popularUniverses;

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore curated worlds on TavvY" />
      </Head>

      <AppLayout>
        <div className="universes-screen" style={{ backgroundColor }}>
          {/* Header */}
          <div className="header">
            <h1 style={{ color: textColor }}>Universes</h1>
            <p style={{ color: COLORS.accent }}>Explore curated worlds.</p>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar" style={{ backgroundColor: surfaceColor }}>
              <FiSearch size={20} color={secondaryTextColor} />
              <input
                type="text"
                placeholder="Search parks, airports, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: textColor }}
              />
              {searchQuery.length > 0 && (
                <button className="clear-button" onClick={() => setSearchQuery('')}>
                  <FiX size={20} color={secondaryTextColor} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="content-area">
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: secondaryTextColor }}>Loading universes...</p>
              </div>
            ) : (
              <>
                {/* Featured Universe Hero - Matching Mockup */}
                {featuredUniverse && (
                  <div 
                    className="featured-card"
                    onClick={() => handleUniversePress(featuredUniverse)}
                  >
                    <img 
                      src={featuredUniverse.banner_image_url || featuredUniverse.cover_image_url || PLACEHOLDER_IMAGE} 
                      alt={featuredUniverse.name}
                      className="featured-image"
                    />
                    {/* Featured Badge at top-left */}
                    <div className="featured-badge">
                      <span>FEATURED UNIVERSE</span>
                    </div>
                    {/* Bottom gradient with title and button */}
                    <div className="featured-gradient">
                      <div className="featured-bottom-row">
                        <div className="featured-text-content">
                          <h3 className="featured-name">{featuredUniverse.name}</h3>
                          <p className="featured-meta">
                            {getCategoryType(featuredUniverse.category_id)} • {featuredUniverse.location || 'Explore Now'}
                          </p>
                        </div>
                        <button className="explore-button">
                          Explore Universe
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter by Category - Square Icon Buttons */}
                <div className="filter-section">
                  <h2 className="section-title" style={{ color: textColor }}>Filter by Category</h2>
                  <div className="filter-grid">
                    {Object.entries(CATEGORY_ICONS).map(([slug, { icon, label }]) => {
                      const isActive = activeCategory === label;
                      return (
                        <button
                          key={slug}
                          className={`filter-button ${isActive ? 'active' : ''}`}
                          style={{ backgroundColor: surfaceColor }}
                          onClick={() => setActiveCategory(isActive ? 'All' : label)}
                        >
                          <span style={{ color: isActive ? COLORS.accent : secondaryTextColor }}>
                            {icon}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Universes Grid - 2x2 with activity badges */}
                {filteredUniverses.length > 0 && (
                  <div className="popular-section">
                    <h2 className="section-title" style={{ color: textColor }}>Popular Universes</h2>
                    <div className="universes-grid">
                      {filteredUniverses.slice(0, 4).map((universe) => {
                        const activity = getActivityLevel(universe.total_signals);
                        return (
                          <div 
                            key={universe.id}
                            className="universe-card"
                            onClick={() => handleUniversePress(universe)}
                          >
                            <img 
                              src={universe.thumbnail_image_url || universe.cover_image_url || PLACEHOLDER_IMAGE} 
                              alt={universe.name}
                              className="universe-image"
                            />
                            <div className="universe-info">
                              <h3 className="universe-name" style={{ color: textColor }}>
                                {universe.name}
                              </h3>
                              <div className="activity-badge">
                                <span className="fire-icon">🔥</span>
                                <span style={{ color: activity.color }}>{activity.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {filteredUniverses.length === 0 && !featuredUniverse && (
                  <div className="empty-container">
                    <span className="empty-icon">🌌</span>
                    <p className="empty-title" style={{ color: textColor }}>No universes yet</p>
                    <p className="empty-subtitle" style={{ color: secondaryTextColor }}>
                      Themed universes will appear here once added.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .universes-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          /* Header - Matching Mockup */
          .header {
            padding: 20px;
            padding-top: max(20px, env(safe-area-inset-top));
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
          }
          
          .header p {
            font-size: 16px;
            margin: 4px 0 0;
            font-weight: 500;
          }
          
          /* Search Section */
          .search-section {
            padding: 0 20px 20px;
          }
          
          .search-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border-radius: 16px;
          }
          
          .search-bar input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .search-bar input::placeholder {
            color: ${secondaryTextColor};
          }
          
          .clear-button {
            padding: 4px;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          /* Content Area */
          .content-area {
            padding: 0 20px;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top-color: ${COLORS.accent};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Featured Card - Matching Mockup Exactly */
          .featured-card {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            cursor: pointer;
            margin-bottom: 24px;
            height: 220px;
          }
          
          .featured-card:hover {
            transform: scale(1.01);
            transition: transform 0.2s;
          }
          
          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .featured-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 10;
          }
          
          .featured-badge span {
            display: inline-block;
            padding: 4px 10px;
            border: 1.5px solid ${COLORS.accent};
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: ${COLORS.accent};
            background: transparent;
          }
          
          .featured-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            padding-top: 50px;
            background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
          }
          
          .featured-bottom-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .featured-text-content {
            flex: 1;
            margin-right: 12px;
          }
          
          .featured-name {
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }
          
          .featured-meta {
            font-size: 13px;
            color: #D1D5DB;
            margin: 0;
          }
          
          .explore-button {
            background: ${COLORS.accent};
            color: #fff;
            border: none;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          }
          
          .explore-button:hover {
            opacity: 0.9;
          }
          
          /* Filter Section - Square Icon Buttons */
          .filter-section {
            margin-bottom: 24px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          
          .filter-grid {
            display: flex;
            gap: 12px;
          }
          
          .filter-button {
            width: 70px;
            height: 70px;
            border-radius: 16px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .filter-button:hover {
            opacity: 0.8;
          }
          
          .filter-button.active {
            border: 2px solid ${COLORS.accent};
          }
          
          /* Popular Section - 2x2 Grid */
          .popular-section {
            margin-bottom: 24px;
          }
          
          .universes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .universe-card {
            cursor: pointer;
          }
          
          .universe-card:hover .universe-image {
            transform: scale(1.02);
          }
          
          .universe-image {
            width: 100%;
            height: 110px;
            object-fit: cover;
            border-radius: 14px;
            transition: transform 0.2s;
          }
          
          .universe-info {
            padding-top: 8px;
          }
          
          .universe-name {
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .activity-badge {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .fire-icon {
            font-size: 13px;
          }
          
          .activity-badge span:last-child {
            font-size: 13px;
            font-weight: 500;
          }
          
          /* Empty State */
          .empty-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            text-align: center;
          }
          
          .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }
          
          .empty-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px;
          }
          
          .empty-subtitle {
            font-size: 14px;
            margin: 0;
          }
          
          /* Responsive - Keep 2x2 on mobile */
          @media (min-width: 768px) {
            .universes-grid {
              grid-template-columns: repeat(2, 1fr);
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
