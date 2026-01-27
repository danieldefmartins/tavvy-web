/**
 * Universe Discovery Screen
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Matches mobile app UniverseDiscoveryScreen exactly
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Full-width featured universe hero
 * - Icon-driven category filters
 * - 2x2 popular universes grid with activity signals
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { 
  FiArrowLeft, FiSearch, FiX
} from 'react-icons/fi';
import { 
  IoRocket, IoAirplane, IoLeaf, IoBusiness, IoFlame
} from 'react-icons/io5';
import { UnifiedHeader } from '../../components/UnifiedHeader';

// Design System Colors
const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
  activityMedium: '#F59E0B',
};

// Default placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Category icons for the filter buttons
const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  'theme-parks': { icon: <IoRocket size={20} />, label: 'Theme Parks' },
  'airports': { icon: <IoAirplane size={20} />, label: 'Airports' },
  'national-parks': { icon: <IoLeaf size={20} />, label: 'Parks' },
  'cities': { icon: <IoBusiness size={20} />, label: 'Cities' },
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  cover_image_url?: string;
  total_signals?: number;
  place_count?: number;
  category_id?: string;
  is_featured?: boolean;
  status?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export default function UniverseDiscoveryScreen() {
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
    if (!signals) return { label: 'Active', color: COLORS.accent };
    if (signals > 100) return { label: 'High Activity', color: COLORS.activityHigh };
    if (signals > 50) return { label: 'Moderate', color: COLORS.activityMedium };
    return { label: 'Active', color: COLORS.accent };
  };

  // Get category type from universe
  const getCategoryType = (categoryId: string | null | undefined) => {
    if (!categoryId) return 'Universe';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Universe';
  };

  const handleUniversePress = (universe: Universe) => {
    router.push(`/app/universe/${universe.slug || universe.id}`);
  };

  const handleBack = () => {
    router.push('/app');
  };

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#111827' : '#FFFFFF';
  const glassyColor = isDark ? '#1A1A1A' : '#F3F4F6';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';

  // Filter by search query
  const filteredUniverses = searchQuery
    ? popularUniverses.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : popularUniverses;

  return (
    <>
      <Head>
        <title>Explore Universes | TavvY</title>
        <meta name="description" content="Explore themed universes on TavvY" />
      </Head>

      <AppLayout>
        <div className="universes-screen" style={{ backgroundColor }}>
          {/* Header */}
          <div className="header" style={{ backgroundColor: surfaceColor }}>
            <button className="back-button" onClick={handleBack}>
              <FiArrowLeft size={24} color={textColor} />
            </button>
            <div className="header-content">
              <h1 style={{ color: textColor }}>Universes</h1>
              <p style={{ color: COLORS.accent }}>Explore themed worlds.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-section" style={{ backgroundColor: surfaceColor }}>
            <div className="search-bar" style={{ 
              backgroundColor: glassyColor,
              borderColor: isDark ? 'transparent' : '#E5E7EB'
            }}>
              <FiSearch size={20} color={secondaryTextColor} />
              <input
                type="text"
                placeholder="Search universes..."
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

          {/* Category Filters */}
          <div className="category-filters">
            <button
              className={`category-pill ${activeCategory === 'All' ? 'active' : ''}`}
              style={{ 
                backgroundColor: activeCategory === 'All' ? COLORS.accent : glassyColor,
              }}
              onClick={() => setActiveCategory('All')}
            >
              <span style={{ color: activeCategory === 'All' ? '#fff' : secondaryTextColor }}>
                All
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${activeCategory === cat.name ? 'active' : ''}`}
                style={{ 
                  backgroundColor: activeCategory === cat.name ? COLORS.accent : glassyColor,
                }}
                onClick={() => setActiveCategory(cat.name)}
              >
                {CATEGORY_ICONS[cat.slug]?.icon}
                <span style={{ color: activeCategory === cat.name ? '#fff' : secondaryTextColor }}>
                  {CATEGORY_ICONS[cat.slug]?.label || cat.name}
                </span>
              </button>
            ))}
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
                {/* Featured Universe Hero */}
                {featuredUniverse && (
                  <div className="featured-section">
                    <h2 className="section-title" style={{ color: textColor }}>Featured</h2>
                    <div 
                      className="featured-card"
                      onClick={() => handleUniversePress(featuredUniverse)}
                    >
                      <img 
                        src={featuredUniverse.cover_image_url || PLACEHOLDER_IMAGE} 
                        alt={featuredUniverse.name}
                        className="featured-image"
                      />
                      <div className="featured-gradient">
                        {featuredUniverse.icon && (
                          <span className="featured-icon">{featuredUniverse.icon}</span>
                        )}
                        <h3 className="featured-name">{featuredUniverse.name}</h3>
                        <p className="featured-category">
                          {getCategoryType(featuredUniverse.category_id)}
                        </p>
                        <div className="featured-stats">
                          <span className="stat">
                            {featuredUniverse.place_count || 0} places
                          </span>
                          <span 
                            className="activity-badge"
                            style={{ backgroundColor: getActivityLevel(featuredUniverse.total_signals).color }}
                          >
                            <IoFlame size={12} color="#fff" />
                            {getActivityLevel(featuredUniverse.total_signals).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Universes Grid */}
                {filteredUniverses.length > 0 && (
                  <div className="popular-section">
                    <h2 className="section-title" style={{ color: textColor }}>Popular Universes</h2>
                    <div className="universes-grid">
                      {filteredUniverses.map((universe) => (
                        <div 
                          key={universe.id}
                          className="universe-card"
                          onClick={() => handleUniversePress(universe)}
                          style={{ backgroundColor: surfaceColor }}
                        >
                          <div className="universe-image-container">
                            <img 
                              src={universe.cover_image_url || PLACEHOLDER_IMAGE} 
                              alt={universe.name}
                              className="universe-image"
                            />
                            {universe.icon && (
                              <span className="universe-icon">{universe.icon}</span>
                            )}
                          </div>
                          <div className="universe-info">
                            <h3 className="universe-name" style={{ color: textColor }}>
                              {universe.name}
                            </h3>
                            <p className="universe-category" style={{ color: secondaryTextColor }}>
                              {getCategoryType(universe.category_id)}
                            </p>
                            <div className="universe-stats">
                              <span style={{ color: secondaryTextColor }}>
                                {universe.place_count || 0} places
                              </span>
                              <span 
                                className="activity-dot"
                                style={{ backgroundColor: getActivityLevel(universe.total_signals).color }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
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
          
          .header {
            display: flex;
            align-items: center;
            padding: 16px;
            padding-top: max(16px, env(safe-area-inset-top));
            gap: 12px;
          }
          
          .back-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 8px;
          }
          
          .header-content {
            flex: 1;
          }
          
          .header-content h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .header-content p {
            font-size: 14px;
            margin: 4px 0 0;
            font-weight: 500;
          }
          
          /* Search Section */
          .search-section {
            padding: 0 16px 12px;
          }
          
          .search-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid;
          }
          
          .search-bar input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .clear-button {
            padding: 4px;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          /* Category Filters */
          .category-filters {
            display: flex;
            gap: 8px;
            padding: 0 16px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .category-filters::-webkit-scrollbar {
            display: none;
          }
          
          .category-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 24px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .category-pill.active {
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          /* Content Area */
          .content-area {
            padding: 0 16px;
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
            border: 3px solid #E5E5EA;
            border-top-color: ${COLORS.accent};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          /* Featured Section */
          .featured-section {
            margin-bottom: 24px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          
          .featured-card {
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .featured-card:hover {
            transform: scale(1.02);
          }
          
          .featured-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
          }
          
          .featured-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 140px;
            background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          
          .featured-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
          
          .featured-name {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }
          
          .featured-category {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 8px;
          }
          
          .featured-stats {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .stat {
            font-size: 13px;
            color: rgba(255,255,255,0.7);
          }
          
          .activity-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
          }
          
          /* Popular Section */
          .popular-section {
            margin-bottom: 24px;
          }
          
          .universes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          @media (min-width: 768px) {
            .universes-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .universes-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          
          .universe-card {
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .universe-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .universe-image-container {
            position: relative;
            height: 120px;
          }
          
          .universe-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .universe-icon {
            position: absolute;
            bottom: 8px;
            left: 8px;
            font-size: 24px;
            background: rgba(0,0,0,0.5);
            padding: 4px 8px;
            border-radius: 8px;
          }
          
          .universe-info {
            padding: 12px;
          }
          
          .universe-name {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .universe-category {
            font-size: 12px;
            margin: 0 0 8px;
          }
          
          .universe-stats {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .universe-stats span {
            font-size: 11px;
          }
          
          .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
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
        `}</style>
      </AppLayout>
    </>
  );
}
