/**
 * Rides & Attractions Screen
 * Browse theme park rides and attractions with Tavvy signals
 * Matches mobile app RidesBrowseScreen exactly
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Glassy filter pills
 * - Featured ride hero with thrill level badges
 * - Popular rides grid
 * - Real data from Supabase places table
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { supabase } from '../../lib/supabaseClient';
import { 
  FiArrowLeft, FiRefreshCw, FiSearch, FiX
} from 'react-icons/fi';
import { 
  IoRocket, IoThumbsUp, IoSparkles, IoAlertCircle,
  IoFlame, IoTime, IoLocation, IoTrainOutline
} from 'react-icons/io5';
import { UnifiedHeader } from '../../components/UnifiedHeader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Design System Colors (matching mobile)
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1A1A1A',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  mustRide: '#EF4444',
  thrill: '#F59E0B',
};

// Signal colors matching PlaceCard
const SIGNAL_COLORS = {
  positive: '#0A84FF', // Blue - The Good
  neutral: '#8B5CF6',  // Purple - The Vibe
  negative: '#FF9500', // Orange - Heads Up
};

type FilterOption = 'all' | 'roller_coaster' | 'water' | 'family' | 'dark';

interface Ride {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  park_name?: string;
  universe_name?: string;
  cover_image_url?: string;
  photos?: string[];
  thrill_level?: 'mild' | 'moderate' | 'thrilling' | 'extreme';
  is_must_ride?: boolean;
  is_featured?: boolean;
  city?: string;
  region?: string;
}

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'roller_coaster', label: 'Roller Coasters' },
  { key: 'water', label: 'Water Rides' },
  { key: 'family', label: 'Family' },
  { key: 'dark', label: 'Dark Rides' },
];

const THRILL_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: '#10B981' },
  moderate: { label: 'Moderate', color: '#3B82F6' },
  thrilling: { label: 'Thrilling', color: '#F59E0B' },
  extreme: { label: 'Extreme', color: '#EF4444' },
};

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';

// Helper function to determine thrill level from subcategory
const getThrillLevelFromSubcategory = (subcategory: string | undefined): 'mild' | 'moderate' | 'thrilling' | 'extreme' => {
  if (!subcategory) return 'moderate';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'extreme';
  if (lower.includes('water') || lower === 'simulator') return 'thrilling';
  if (lower === 'dark_ride' || lower === 'boat_ride') return 'moderate';
  if (lower === 'carousel' || lower === 'train' || lower === 'playground' || lower === 'show' || lower === 'meet_greet') return 'mild';
  return 'moderate';
};

// Get fallback image based on subcategory
const getCategoryFallbackImage = (subcategory: string | undefined): string => {
  if (!subcategory) return PLACEHOLDER_IMAGE;
  const lower = subcategory.toLowerCase();
  
  if (lower.includes('coaster') || lower.includes('thrill')) {
    return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  }
  if (lower.includes('water') || lower.includes('boat')) {
    return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  }
  if (lower === 'dark_ride') {
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  }
  return PLACEHOLDER_IMAGE;
};

export default function RidesScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { theme, isDark } = useThemeContext();
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRides();
  }, [filterBy]);

  const loadRides = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query places table with attraction category (matching mobile)
      let query = supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
        .eq('tavvy_category', 'attraction')
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filter based on subcategory
      if (filterBy === 'roller_coaster') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', 'roller_coaster')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'water') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .or('tavvy_subcategory.eq.water_ride,tavvy_subcategory.eq.boat_ride')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'family') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .or('tavvy_subcategory.eq.carousel,tavvy_subcategory.eq.train,tavvy_subcategory.eq.spinner,tavvy_subcategory.eq.playground')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'dark') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', 'dark_ride')
          .order('created_at', { ascending: false })
          .limit(50);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error loading rides:', queryError);
        setError('Failed to load rides. Please try again.');
        setRides([]);
      } else {
        // Map places data to Ride interface
        const mappedRides: Ride[] = (data || []).map((place: any) => ({
          id: place.id,
          name: place.name,
          category: place.tavvy_category || 'attraction',
          subcategory: place.tavvy_subcategory,
          park_name: place.city,
          city: place.city,
          region: place.region,
          cover_image_url: place.cover_image_url,
          photos: place.photos,
          thrill_level: getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: place.tavvy_subcategory === 'roller_coaster' || place.tavvy_subcategory === 'thrill_ride',
          is_featured: false,
        }));
        setRides(mappedRides);
      }
    } catch (err) {
      console.error('Error loading rides:', err);
      setError('Failed to load rides. Please try again.');
      setRides([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [filterBy]);

  const handleRidePress = (ride: Ride) => {
    router.push(`/app/ride/${ride.id}?name=${encodeURIComponent(ride.name)}&park=${encodeURIComponent(ride.park_name || ride.city || '')}`);
  };

  const handleBack = () => {
    router.push('/app');
  };

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#111827';
  const secondaryTextColor = isDark ? COLORS.textSecondary : '#6B7280';

  // Filter by search query
  const filteredRides = searchQuery
    ? rides.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rides;

  const featuredRide = filteredRides.find(r => r.is_must_ride || r.is_featured) || filteredRides[0];
  const popularRides = filteredRides.filter(r => r.id !== featuredRide?.id).slice(0, 8);

  // Format subcategory for display
  const formatSubcategory = (subcategory: string | undefined): string => {
    if (!subcategory) return 'Attraction';
    return subcategory
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <Head>
        <title>Rides & Attractions | TavvY</title>
        <meta name="description" content="Browse theme park rides and attractions on TavvY" />
      </Head>

      <AppLayout>
        <div className="rides-screen" style={{ backgroundColor }}>
          {/* Header */}
          <div className="rides-header" style={{ backgroundColor: surfaceColor }}>
            <button className="back-button" onClick={handleBack}>
              <FiArrowLeft size={24} color={textColor} />
            </button>
            <div className="header-content">
              <h1 style={{ color: textColor }}>Rides</h1>
              <p style={{ color: COLORS.accent }}>Theme park thrills await.</p>
            </div>
            <button 
              className="refresh-button" 
              onClick={onRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw 
                size={20} 
                color={secondaryTextColor} 
                className={refreshing ? 'spinning' : ''}
              />
            </button>
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
                placeholder="Search rides & attractions..."
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

          {/* Filter Pills */}
          <div className="filter-container">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`filter-pill ${filterBy === option.key ? 'active' : ''}`}
                style={{ 
                  backgroundColor: filterBy === option.key ? COLORS.accent : glassyColor,
                  borderColor: filterBy === option.key ? COLORS.accent : (isDark ? 'transparent' : '#E5E7EB'),
                }}
                onClick={() => setFilterBy(option.key)}
              >
                <span style={{ 
                  color: filterBy === option.key ? '#FFFFFF' : secondaryTextColor 
                }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="content-area">
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: secondaryTextColor }}>Loading rides...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <IoTrainOutline size={64} color={secondaryTextColor} />
                <p className="error-text" style={{ color: textColor }}>{error}</p>
                <button className="retry-button" onClick={onRefresh}>
                  Try Again
                </button>
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon" style={{ backgroundColor: glassyColor }}>
                  <IoTrainOutline size={48} color={secondaryTextColor} />
                </div>
                <p className="empty-title" style={{ color: textColor }}>No rides yet</p>
                <p className="empty-subtitle" style={{ color: secondaryTextColor }}>
                  Theme park rides and attractions will appear here once added.
                </p>
              </div>
            ) : (
              <>
                {/* Featured Ride Hero */}
                {featuredRide && (
                  <div className="featured-section">
                    <h2 className="section-title" style={{ color: textColor }}>Featured Ride</h2>
                    <div 
                      className="featured-card"
                      onClick={() => handleRidePress(featuredRide)}
                    >
                      <img 
                        src={featuredRide.cover_image_url || featuredRide.photos?.[0] || getCategoryFallbackImage(featuredRide.subcategory)} 
                        alt={featuredRide.name}
                        className="featured-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="featured-gradient">
                        {featuredRide.is_must_ride && (
                          <div className="must-ride-badge">
                            <IoFlame size={12} color="#fff" />
                            <span>MUST RIDE</span>
                          </div>
                        )}
                        <div className="featured-info">
                          <h3 className="featured-name">{featuredRide.name}</h3>
                          <p className="featured-location">
                            {formatSubcategory(featuredRide.subcategory)} • {featuredRide.park_name || featuredRide.city || 'Theme Park'}
                          </p>
                          {featuredRide.thrill_level && (
                            <div 
                              className="thrill-badge"
                              style={{ backgroundColor: THRILL_LABELS[featuredRide.thrill_level]?.color || '#3B82F6' }}
                            >
                              {THRILL_LABELS[featuredRide.thrill_level]?.label || 'Moderate'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Rides Grid */}
                {popularRides.length > 0 && (
                  <div className="popular-section">
                    <h2 className="section-title" style={{ color: textColor }}>All Rides</h2>
                    <div className="rides-grid">
                      {popularRides.map((ride, index) => (
                        <div 
                          key={`ride-${ride.id}-${index}`}
                          className="ride-card"
                          onClick={() => handleRidePress(ride)}
                          style={{ backgroundColor: surfaceColor }}
                        >
                          <div className="ride-image-container">
                            <img 
                              src={ride.cover_image_url || ride.photos?.[0] || getCategoryFallbackImage(ride.subcategory)} 
                              alt={ride.name}
                              className="ride-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                              }}
                            />
                            {ride.thrill_level && (
                              <div 
                                className="thrill-indicator"
                                style={{ backgroundColor: THRILL_LABELS[ride.thrill_level]?.color || '#3B82F6' }}
                              >
                                {THRILL_LABELS[ride.thrill_level]?.label || 'Moderate'}
                              </div>
                            )}
                          </div>
                          <div className="ride-info">
                            <h3 className="ride-name" style={{ color: textColor }}>{ride.name}</h3>
                            <p className="ride-location" style={{ color: secondaryTextColor }}>
                              {formatSubcategory(ride.subcategory)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .rides-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .rides-header {
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
            transition: background 0.2s;
          }
          
          .back-button:hover {
            background: rgba(0,0,0,0.05);
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
          
          .refresh-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 8px;
          }
          
          .refresh-button :global(.spinning) {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
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
          
          .search-bar input::placeholder {
            color: ${secondaryTextColor};
          }
          
          .clear-button {
            padding: 4px;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          /* Filter Container */
          .filter-container {
            display: flex;
            gap: 8px;
            padding: 0 16px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .filter-container::-webkit-scrollbar {
            display: none;
          }
          
          .filter-pill {
            padding: 10px 20px;
            border-radius: 24px;
            border: 1px solid;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .filter-pill.active {
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
          
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            text-align: center;
          }
          
          .error-text {
            font-size: 16px;
            margin: 16px 0;
          }
          
          .retry-button {
            padding: 12px 24px;
            background: ${COLORS.accent};
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .empty-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
            text-align: center;
          }
          
          .empty-icon {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
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
          
          .must-ride-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${COLORS.mustRide};
            padding: 6px 10px;
            border-radius: 6px;
          }
          
          .must-ride-badge span {
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          
          .featured-info {
            margin-top: auto;
          }
          
          .featured-name {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }
          
          .featured-location {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 8px;
          }
          
          .thrill-badge {
            display: inline-block;
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
          
          .rides-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          @media (min-width: 768px) {
            .rides-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .rides-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          
          .ride-card {
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .ride-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .ride-image-container {
            position: relative;
            height: 120px;
          }
          
          .ride-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .thrill-indicator {
            position: absolute;
            bottom: 8px;
            left: 8px;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 600;
            color: #fff;
          }
          
          .ride-info {
            padding: 12px;
          }
          
          .ride-name {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .ride-location {
            font-size: 12px;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
