/**
 * Universes Screen - Explore curated worlds
 * Pixel-perfect port from tavvy-mobile/screens/UniverseDiscoveryScreen.tsx
 * 
 * PREMIUM DARK MODE DESIGN - January 2026
 * - Minimalist black header with blue tagline
 * - Full-width featured universe hero
 * - Icon-driven category filters
 * - 2x2 popular universes grid with activity signals
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { IoSearch, IoRocketOutline, IoAirplaneOutline, IoLeafOutline, IoBusinessOutline } from 'react-icons/io5';

// Design System Colors
const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  place_count?: number;
  total_signals?: number;
  is_featured?: boolean;
  category_id?: string;
  location?: string;
}

// Category filters matching iOS
const CATEGORY_FILTERS = [
  { id: 'theme-parks', icon: IoRocketOutline, label: 'Theme Parks' },
  { id: 'airports', icon: IoAirplaneOutline, label: 'Airports' },
  { id: 'national-parks', icon: IoLeafOutline, label: 'Parks' },
  { id: 'cities', icon: IoBusinessOutline, label: 'Cities' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function ExploreScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
  const [popularUniverses, setPopularUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchUniverses();
  }, [activeCategory]);

  const fetchUniverses = async () => {
    setLoading(true);
    try {
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1);

      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .order('created_at', { ascending: false });

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery,
        universesQuery.limit(4),
      ]);

      if (featuredResult.data && featuredResult.data.length > 0) {
        setFeaturedUniverse(featuredResult.data[0]);
      }

      if (universesResult.data && universesResult.data.length > 0) {
        setPopularUniverses(universesResult.data);
      }
    } catch (error) {
      console.error('Error fetching universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityLevel = (signals: number) => {
    if (signals > 100) return 'High Activity';
    if (signals > 50) return 'Moderate';
    return 'Active';
  };

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore TavvY Universes - curated worlds" />
      </Head>

      <AppLayout>
        <div className="explore-screen">
          {/* Header */}
          <header className="header">
            <h1 className="title">Universes</h1>
            <p className="tagline">Explore curated worlds.</p>
          </header>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <IoSearch size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Search parks, airports, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Featured Universe Hero */}
          {featuredUniverse && (
            <Link 
              href={`/app/universe/${featuredUniverse.slug || featuredUniverse.id}`}
              className="featured-card"
            >
              <img 
                src={featuredUniverse.banner_image_url || PLACEHOLDER_IMAGE}
                alt={featuredUniverse.name}
                className="featured-image"
              />
              <div className="featured-label-container">
                <div className="featured-label">
                  <span>FEATURED UNIVERSE</span>
                </div>
              </div>
              <div className="featured-gradient">
                <div className="featured-bottom-row">
                  <div className="featured-text-content">
                    <h2 className="featured-name">{featuredUniverse.name}</h2>
                    <p className="featured-meta">
                      {featuredUniverse.location || 'Explore Now'}
                    </p>
                  </div>
                  <button className="explore-button">
                    Explore Universe
                  </button>
                </div>
              </div>
            </Link>
          )}

          {/* Filter by Category */}
          <section className="filter-section">
            <h2 className="section-title">Filter by Category</h2>
            <div className="filter-grid">
              {CATEGORY_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeCategory === filter.id;
                return (
                  <button
                    key={filter.id}
                    className={`filter-button ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveCategory(isActive ? null : filter.id)}
                  >
                    <Icon size={24} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Popular Universes Grid */}
          <section className="popular-section">
            <h2 className="section-title">Popular Universes</h2>
            <div className="grid-container">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Loading universes...</p>
                </div>
              ) : popularUniverses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🌌</span>
                  <h3>No universes found</h3>
                  <p>Check back soon for new universes</p>
                </div>
              ) : (
                popularUniverses.map((universe) => (
                  <Link 
                    key={universe.id}
                    href={`/app/universe/${universe.slug || universe.id}`}
                    className="grid-card"
                  >
                    <img 
                      src={universe.thumbnail_image_url || PLACEHOLDER_IMAGE}
                      alt={universe.name}
                      className="grid-image"
                    />
                    <div className="grid-content">
                      <h3 className="grid-name">{universe.name}</h3>
                      <div className="activity-badge">
                        <span className="activity-icon">🔥</span>
                        <span className="activity-text">
                          {getActivityLevel(universe.total_signals || 0)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .explore-screen {
            min-height: 100vh;
            background-color: ${theme.background};
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            padding: 8px 20px 16px;
          }

          .title {
            font-size: 32px;
            font-weight: 700;
            color: ${theme.text};
            margin: 0;
          }

          .tagline {
            font-size: 16px;
            font-weight: 500;
            color: ${COLORS.accent};
            margin: 4px 0 0;
          }

          /* Search */
          .search-section {
            padding: 0 20px;
            margin-bottom: 20px;
          }

          .search-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            background: ${theme.surface};
            padding: 14px 16px;
            border-radius: 16px;
            color: ${theme.textSecondary};
          }

          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: ${theme.text};
            outline: none;
          }

          .search-input::placeholder {
            color: ${theme.textSecondary};
          }

          /* Featured Card */
          .featured-card {
            position: relative;
            margin: 0 20px 24px;
            border-radius: 20px;
            overflow: hidden;
            height: 220px;
            display: block;
            text-decoration: none;
          }

          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .featured-label-container {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 10;
          }

          .featured-label {
            background: transparent;
            border: 1.5px solid ${COLORS.accent};
            padding: 4px 10px;
            border-radius: 6px;
          }

          .featured-label span {
            color: ${COLORS.accent};
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .featured-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 50px 16px 16px;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
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
            color: #FFFFFF;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px;
          }

          .featured-meta {
            color: #D1D5DB;
            font-size: 13px;
            margin: 0;
          }

          .explore-button {
            background: ${COLORS.accent};
            color: #FFFFFF;
            border: none;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }

          /* Filter Section */
          .filter-section {
            padding: 0 20px;
            margin-bottom: 24px;
          }

          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: ${theme.text};
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
            background: ${theme.surface};
            color: ${theme.textSecondary};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .filter-button.active {
            border: 2px solid ${COLORS.accent};
            color: ${COLORS.accent};
          }

          /* Popular Section */
          .popular-section {
            padding: 0 20px;
          }

          .grid-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .grid-card {
            display: block;
            text-decoration: none;
          }

          .grid-image {
            width: 100%;
            height: 110px;
            border-radius: 14px;
            object-fit: cover;
          }

          .grid-content {
            padding-top: 8px;
          }

          .grid-name {
            font-size: 15px;
            font-weight: 600;
            color: ${theme.text};
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .activity-badge {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .activity-icon {
            font-size: 13px;
          }

          .activity-text {
            font-size: 13px;
            font-weight: 500;
            color: ${COLORS.activityHigh};
          }

          /* Loading & Empty States */
          .loading-container,
          .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 20px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${theme.surface};
            border-top-color: ${COLORS.accent};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .empty-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 12px;
          }

          .empty-state h3 {
            color: ${theme.text};
            font-size: 18px;
            margin: 0 0 8px;
          }

          .empty-state p {
            color: ${theme.textSecondary};
            font-size: 14px;
            margin: 0;
          }

          .bottom-spacing {
            height: 100px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
