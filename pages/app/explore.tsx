/**
 * Universes Screen - Explore worlds with many places inside
 * Pixel-perfect port from tavvy-mobile/screens/UniverseDiscoveryScreen.tsx
 * 
 * Features:
 * - Teal gradient header
 * - Search bar
 * - Category filter chips (All, Airports, Theme Parks, National Parks, etc.)
 * - Featured Universe hero card
 * - Nearby Universes section
 * - Popular Destinations section
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { IoSearch, IoPersonCircleOutline, IoLocationSharp, IoChevronForward } from 'react-icons/io5';
import { FiChevronRight } from 'react-icons/fi';

// Teal theme colors
const TEAL = '#14B8A6';
const TEAL_DARK = '#0D9488';
const TEAL_GRADIENT = 'linear-gradient(135deg, #14B8A6, #0891B2)';

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  cover_image_url?: string;
  thumbnail_image_url?: string;
  place_count?: number;
  total_signals?: number;
  is_featured?: boolean;
  category_id?: string;
  location?: string;
}

// Category chips matching mobile app
const CATEGORY_CHIPS = [
  { id: 'all', name: 'All', icon: null },
  { id: 'airports', name: 'Airports', icon: '✈️' },
  { id: 'theme-parks', name: 'Theme Parks', icon: '🎢' },
  { id: 'national-parks', name: 'National Parks', icon: '🏞️' },
  { id: 'stadiums', name: 'Stadiums', icon: '🏟️' },
  { id: 'malls', name: 'Malls', icon: '🛍️' },
];

// Mock nearby universes
const mockNearbyUniverses = [
  { 
    id: '1', 
    name: 'Jacob K. Javits Convention Center', 
    slug: 'javits-center',
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    place_count: 0,
    total_signals: 0,
    location: 'New York, NY'
  },
  { 
    id: '2', 
    name: 'McCormick Place', 
    slug: 'mccormick-place',
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    place_count: 0,
    total_signals: 0,
    location: 'Chicago, IL'
  },
  { 
    id: '3', 
    name: 'Orange County Convention Center', 
    slug: 'orange-county-cc',
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    place_count: 0,
    total_signals: 0,
    location: 'Orlando, FL'
  },
];

// Mock featured universe
const mockFeaturedUniverse = {
  id: 'featured-1',
  name: 'U.S. Bank Stadium',
  slug: 'us-bank-stadium',
  cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  place_count: 0,
  total_signals: 0,
  location: 'Minneapolis, Minnesota',
  is_popular: true,
};

export default function ExploreScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(mockFeaturedUniverse);
  const [nearbyUniverses, setNearbyUniverses] = useState<Universe[]>(mockNearbyUniverses);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchUniverses();
  }, [activeCategory]);

  const fetchUniverses = async () => {
    setLoading(true);
    try {
      // Fetch featured universe
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1);

      // Fetch all universes
      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .order('total_signals', { ascending: false });

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.single(),
        universesQuery.limit(20),
      ]);

      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      }

      if (universesResult.data && universesResult.data.length > 0) {
        setUniverses(universesResult.data);
        setNearbyUniverses(universesResult.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? '#0F172A' : '#F9F7F2';

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore TavvY Universes - worlds with many places inside" />
      </Head>

      <AppLayout>
        <div className="explore-screen">
          {/* Teal Gradient Header */}
          <header className="explore-header">
            <div className="header-row">
              <div className="header-left">
                <h1 className="header-title">Universes</h1>
                <p className="header-subtitle">Explore worlds with many places inside</p>
              </div>
              <button className="profile-btn">
                <IoPersonCircleOutline size={32} color="#fff" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="search-container">
              <IoSearch size={18} color="rgba(0,0,0,0.4)" />
              <input
                type="text"
                className="search-input"
                placeholder="Find a universe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {/* Category Chips */}
          <div className="category-chips">
            {CATEGORY_CHIPS.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon && <span className="chip-icon">{cat.icon}</span>}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <main className="main-content">
            {/* Featured Universe */}
            {featuredUniverse && !searchQuery && (
              <section className="featured-section">
                <h2 className="section-label">Featured Universe</h2>
                <Link 
                  href={`/app/universe/${featuredUniverse.slug || featuredUniverse.id}`}
                  className="featured-card"
                >
                  <img 
                    src={featuredUniverse.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                    alt={featuredUniverse.name}
                    className="featured-image"
                  />
                  <div className="featured-overlay">
                    {featuredUniverse.is_popular && (
                      <span className="featured-badge">🔥 Popular</span>
                    )}
                    <h2 className="featured-title">{featuredUniverse.name}</h2>
                    <p className="featured-location">
                      <IoLocationSharp size={14} />
                      {featuredUniverse.location || 'Location'} • {featuredUniverse.place_count || 0} Places
                    </p>
                  </div>
                </Link>
              </section>
            )}

            {/* Nearby Universes */}
            <section className="nearby-section">
              <div className="section-header">
                <div className="section-title-row">
                  <span className="section-icon">📍</span>
                  <h2>Nearby Universes</h2>
                </div>
                <Link href="/app/explore/map" className="see-map">
                  See Map
                </Link>
              </div>
              <div className="nearby-scroll">
                {nearbyUniverses.map((universe) => (
                  <Link 
                    key={universe.id}
                    href={`/app/universe/${universe.slug || universe.id}`}
                    className="nearby-card"
                  >
                    <div className="nearby-image">
                      <img 
                        src={universe.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                        alt={universe.name}
                      />
                    </div>
                    <div className="nearby-info">
                      <h3>{universe.name}</h3>
                      <div className="nearby-meta">
                        <span>{universe.place_count || 0} places</span>
                        <span className="signals">{universe.total_signals || 0} signals</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Destinations */}
            <section className="popular-section">
              <div className="section-header">
                <h2>Popular Destinations</h2>
                <button className="see-all">
                  See All <FiChevronRight size={16} />
                </button>
              </div>
              <div className="popular-grid">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Loading universes...</p>
                  </div>
                ) : universes.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🌌</span>
                    <h3>No universes found</h3>
                    <p>Check back soon for new universes</p>
                  </div>
                ) : (
                  universes.slice(0, 6).map((universe) => (
                    <Link 
                      key={universe.id}
                      href={`/app/universe/${universe.slug || universe.id}`}
                      className="popular-card"
                    >
                      <div className="popular-image">
                        <img 
                          src={universe.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                          alt={universe.name}
                        />
                        <div className="popular-gradient" />
                      </div>
                      <div className="popular-info">
                        <h3>{universe.name}</h3>
                        <p>{universe.place_count || 0} places • {universe.total_signals || 0} signals</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </main>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .explore-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          /* Teal Header */
          .explore-header {
            background: ${TEAL_GRADIENT};
            padding: 20px;
            padding-top: max(20px, env(safe-area-inset-top));
            padding-bottom: 24px;
          }

          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
          }

          .header-title {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }

          .header-subtitle {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0;
          }

          .profile-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
          }

          .search-container {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fff;
            padding: 14px 16px;
            border-radius: 16px;
          }

          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: #111;
            outline: none;
          }

          .search-input::placeholder {
            color: rgba(0,0,0,0.4);
          }

          /* Category Chips */
          .category-chips {
            display: flex;
            gap: 8px;
            padding: 16px 20px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .category-chips::-webkit-scrollbar {
            display: none;
          }

          .category-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 24px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          .category-chip.active {
            background: ${TEAL};
            color: #fff;
          }

          .chip-icon {
            font-size: 14px;
          }

          /* Main Content */
          .main-content {
            padding: 0 20px;
          }

          /* Section Label */
          .section-label {
            font-size: 13px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 12px;
          }

          /* Featured Section */
          .featured-section {
            margin-bottom: 32px;
          }

          .featured-card {
            display: block;
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            text-decoration: none;
          }

          .featured-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
          }

          .featured-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
          }

          .featured-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            color: #fff;
            margin-bottom: 8px;
          }

          .featured-title {
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 6px;
          }

          .featured-location {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0;
          }

          /* Nearby Section */
          .nearby-section {
            margin-bottom: 32px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .section-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-icon {
            font-size: 18px;
          }

          .section-header h2 {
            font-size: 18px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0;
          }

          .see-map, .see-all {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 600;
            color: ${TEAL};
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
          }

          .nearby-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .nearby-scroll::-webkit-scrollbar {
            display: none;
          }

          .nearby-card {
            min-width: 200px;
            max-width: 200px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
          }

          .nearby-image {
            height: 120px;
            overflow: hidden;
          }

          .nearby-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .nearby-info {
            padding: 12px;
          }

          .nearby-info h3 {
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .nearby-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
          }

          .nearby-meta .signals {
            color: ${TEAL};
          }

          /* Popular Section */
          .popular-section {
            margin-bottom: 32px;
          }

          .popular-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .popular-card {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
          }

          .popular-image {
            position: relative;
            height: 100px;
          }

          .popular-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .popular-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(transparent, rgba(0,0,0,0.5));
          }

          .popular-info {
            padding: 12px;
          }

          .popular-info h3 {
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .popular-info p {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: 0;
          }

          /* Loading & Empty States */
          .loading-container, .empty-state {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${isDark ? '#333' : '#ddd'};
            border-top-color: ${TEAL};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-container p, .empty-state p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: 0;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }

          .empty-state h3 {
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 4px;
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (min-width: 768px) {
            .popular-grid {
              grid-template-columns: repeat(3, 1fr);
            }

            .nearby-card {
              min-width: 240px;
              max-width: 240px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
