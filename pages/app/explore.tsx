/**
 * Explore Screen - Universe Discovery
 * Pixel-perfect port from tavvy-mobile/screens/UniverseDiscoveryScreen.tsx
 * 
 * Features:
 * - Teal gradient header
 * - Category filter chips
 * - Featured universe hero card
 * - Popular universes grid
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiUser, FiChevronRight } from 'react-icons/fi';

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Category chips matching mobile app
const CATEGORY_CHIPS = [
  { id: 'all', name: 'All', icon: null },
  { id: 'theme-parks', name: 'Theme Parks', icon: '🎢' },
  { id: 'airports', name: 'Airports', icon: '✈️' },
  { id: 'national-parks', name: 'National Parks', icon: '🌲' },
  { id: 'cities', name: 'Cities', icon: '🏙️' },
  { id: 'food-drink', name: 'Food & Drink', icon: '🍽️' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function ExploreScreen() {
  const { theme, isDark } = useThemeContext();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
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

      // Apply category filter
      if (activeCategory !== 'all') {
        // In a real app, you'd filter by category_id
        // For now, we'll just fetch all
      }

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.single(),
        universesQuery.limit(20),
      ]);

      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      }

      setUniverses(universesResult.data || []);
    } catch (error) {
      console.error('Error fetching universes:', error);
      // Set empty state on error
      setUniverses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniverses = universes.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore TavvY Universes - worlds with many places inside" />
      </Head>

      <AppLayout>
        <div className="explore-screen" style={{ backgroundColor: theme.background }}>
          {/* Gradient Header */}
          <header className="explore-header">
            <div className="header-row">
              <div className="header-left">
                <h1 className="header-title">Universes</h1>
              </div>
              <button className="header-right">
                <FiUser size={24} color="white" />
              </button>
            </div>
            <p className="header-subtitle">Explore worlds with many places inside</p>
            
            {/* Search Bar */}
            <div className="search-container">
              <FiSearch size={18} color="rgba(255,255,255,0.7)" />
              <input
                type="text"
                className="search-input"
                placeholder="Search universes..."
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
                style={{
                  backgroundColor: activeCategory === cat.id ? '#0D9488' : theme.surface,
                  color: activeCategory === cat.id ? 'white' : theme.text,
                }}
              >
                {cat.icon && <span className="chip-icon">{cat.icon}</span>}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <main className="main-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p style={{ color: theme.textSecondary }}>Loading universes...</p>
              </div>
            ) : (
              <>
                {/* Featured Universe */}
                {featuredUniverse && !searchQuery && (
                  <section className="featured-section">
                    <Link 
                      href={`/app/universe/${featuredUniverse.slug || featuredUniverse.id}`}
                      className="featured-card"
                    >
                      <img 
                        src={featuredUniverse.cover_image_url || PLACEHOLDER_IMAGE}
                        alt={featuredUniverse.name}
                        className="featured-image"
                      />
                      <div className="featured-overlay">
                        <span className="featured-badge">Featured</span>
                        <h2 className="featured-title">{featuredUniverse.name}</h2>
                        {featuredUniverse.description && (
                          <p className="featured-description">{featuredUniverse.description}</p>
                        )}
                      </div>
                    </Link>
                  </section>
                )}

                {/* Popular Universes */}
                <section className="universes-section">
                  <div className="section-header">
                    <h2 style={{ color: theme.text }}>Popular Universes</h2>
                    <button className="see-all-btn" style={{ color: '#0D9488' }}>
                      See All <FiChevronRight size={16} />
                    </button>
                  </div>
                  
                  {filteredUniverses.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🌌</span>
                      <h3 style={{ color: theme.text }}>No universes found</h3>
                      <p style={{ color: theme.textSecondary }}>
                        {searchQuery ? 'Try a different search term' : 'Check back soon for new universes'}
                      </p>
                    </div>
                  ) : (
                    <div className="universes-grid">
                      {filteredUniverses.map((universe) => (
                        <Link 
                          key={universe.id} 
                          href={`/app/universe/${universe.slug || universe.id}`}
                          className="universe-card"
                          style={{ backgroundColor: theme.cardBackground }}
                        >
                          <div className="universe-image-container">
                            <img 
                              src={universe.cover_image_url || universe.thumbnail_image_url || PLACEHOLDER_IMAGE}
                              alt={universe.name}
                              className="universe-image"
                            />
                            <div className="universe-gradient" />
                          </div>
                          <div className="universe-info">
                            <h3 className="universe-name" style={{ color: theme.text }}>
                              {universe.icon && <span>{universe.icon} </span>}
                              {universe.name}
                            </h3>
                            {universe.total_signals !== undefined && universe.total_signals > 0 && (
                              <span className="universe-signals" style={{ color: theme.textSecondary }}>
                                {universe.total_signals} signals
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>

        <style jsx>{`
          .explore-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .explore-header {
            background: linear-gradient(135deg, #06B6D4, #0891B2);
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.xl}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${spacing.sm}px;
          }
          
          .header-title {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0;
          }
          
          .header-right {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          
          .header-subtitle {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            background: rgba(255,255,255,0.2);
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: white;
            outline: none;
          }
          
          .search-input::placeholder {
            color: rgba(255,255,255,0.7);
          }
          
          .category-chips {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
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
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .chip-icon {
            font-size: 16px;
          }
          
          .main-content {
            padding: 0 ${spacing.lg}px;
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
            border: 3px solid ${theme.surface};
            border-top-color: #0D9488;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: ${spacing.md}px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .featured-section {
            margin-bottom: ${spacing.xl}px;
          }
          
          .featured-card {
            display: block;
            position: relative;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
          }
          
          .featured-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }
          
          .featured-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: ${spacing.lg}px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
          }
          
          .featured-badge {
            display: inline-block;
            background: #0D9488;
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: ${borderRadius.full}px;
            margin-bottom: ${spacing.sm}px;
          }
          
          .featured-title {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .featured-description {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .universes-section {
            margin-bottom: ${spacing.xl}px;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${spacing.md}px;
          }
          
          .section-header h2 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }
          
          .see-all-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
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
            margin-bottom: ${spacing.md}px;
          }
          
          .universes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.md}px;
          }
          
          .universe-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .universe-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          }
          
          .universe-image-container {
            position: relative;
            height: 100px;
            overflow: hidden;
          }
          
          .universe-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .universe-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(transparent, rgba(0,0,0,0.3));
          }
          
          .universe-info {
            padding: ${spacing.md}px;
          }
          
          .universe-name {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .universe-signals {
            font-size: 12px;
          }
          
          @media (min-width: 768px) {
            .universes-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .featured-image {
              height: 280px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
