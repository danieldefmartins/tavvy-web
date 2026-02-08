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
 * - Search by ride name OR theme park name
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

type FilterOption = 'all' | 'thrill_rides' | 'family_rides' | 'dark_rides' | 'shows' | 'characters' | 'explore' | 'animals' | 'water_rides' | 'simulators' | 'interactive';

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
  description?: string;
  short_description?: string;
  min_height_inches?: number;
  duration_minutes?: number;
  gets_wet?: string;
  single_rider?: boolean;
  child_swap?: boolean;
  lightning_lane?: string;
  indoor_outdoor?: string;
}

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'thrill_rides', label: 'Thrill Rides' },
  { key: 'family_rides', label: 'Family Rides' },
  { key: 'dark_rides', label: 'Dark Rides' },
  { key: 'shows', label: 'Shows' },
  { key: 'characters', label: 'Characters' },
  { key: 'explore', label: 'Explore' },
  { key: 'animals', label: 'Animals' },
  { key: 'water_rides', label: 'Water Rides' },
  { key: 'simulators', label: 'Simulators' },
  { key: 'interactive', label: 'Interactive' },
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
  if (lower === 'thrill_rides') return 'extreme';
  if (lower === 'water_rides' || lower === 'simulators') return 'thrilling';
  if (lower === 'dark_rides' || lower === 'interactive') return 'moderate';
  if (lower === 'family_rides' || lower === 'shows' || lower === 'characters' || lower === 'explore' || lower === 'animals') return 'mild';
  return 'moderate';
};

// Get fallback image based on subcategory
const getCategoryFallbackImage = (subcategory: string | undefined): string => {
  if (!subcategory) return PLACEHOLDER_IMAGE;
  const lower = subcategory.toLowerCase();
  
  if (lower === 'thrill_rides') return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  if (lower === 'water_rides') return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  if (lower === 'dark_rides') return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  if (lower === 'animals') return 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800';
  if (lower === 'shows') return 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800';
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
  const [searchingByPark, setSearchingByPark] = useState(false);

  useEffect(() => {
    loadRides();
  }, [filterBy]);

  // Search when query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchRides(searchQuery);
      } else if (searchQuery.length === 0) {
        loadRides();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRides = async () => {
    setLoading(true);
    setError(null);
    setSearchingByPark(false);
    
    try {
      // Query places table with attraction category
      // Use ilike for case-insensitive matching
      let query = supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches, duration_minutes, thrill_level, gets_wet, single_rider, child_swap, lightning_lane, indoor_outdoor')
        .eq('tavvy_category', 'attraction')
        .order('name', { ascending: true })
        .limit(100);

      // Apply filter based on subcategory (direct match with new categories)
      if (filterBy !== 'all') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches, duration_minutes, thrill_level, gets_wet, single_rider, child_swap, lightning_lane, indoor_outdoor')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', filterBy)
          .order('name', { ascending: true })
          .limit(100);
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
          description: place.description,
          short_description: place.short_description,
          min_height_inches: place.min_height_inches,
          duration_minutes: place.duration_minutes,
          gets_wet: place.gets_wet,
          single_rider: place.single_rider,
          child_swap: place.child_swap,
          lightning_lane: place.lightning_lane,
          indoor_outdoor: place.indoor_outdoor,
          thrill_level: place.thrill_level || getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: place.tavvy_subcategory === 'thrill_rides',
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

  const searchRides = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, try to find a universe/theme park matching the search
      const { data: universeData } = await supabase
        .from('atlas_universes')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(1);

      if (universeData && universeData.length > 0) {
        // Found a theme park - get all its rides
        const universeId = universeData[0].id;
        const universeName = universeData[0].name;
        setSearchingByPark(true);

        // Get place IDs linked to this universe
        const { data: placeLinks } = await supabase
          .from('atlas_universe_places')
          .select('place_id')
          .eq('universe_id', universeId)
          .limit(200);

        if (placeLinks && placeLinks.length > 0) {
          const placeIds = placeLinks.map((link: any) => link.place_id);
          
          // Get the places that are attractions
          const { data: placesData } = await supabase
            .from('places')
            .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches, duration_minutes, thrill_level, gets_wet, single_rider, child_swap, lightning_lane, indoor_outdoor')
            .in('id', placeIds)
            .eq('tavvy_category', 'attraction')
            .order('name', { ascending: true });

          if (placesData) {
            const mappedRides: Ride[] = placesData.map((place: any) => ({
              id: place.id,
              name: place.name,
              category: place.tavvy_category || 'attraction',
              subcategory: place.tavvy_subcategory,
              park_name: universeName,
              universe_name: universeName,
              city: place.city,
              region: place.region,
              cover_image_url: place.cover_image_url,
              photos: place.photos,
              description: place.description,
              short_description: place.short_description,
              min_height_inches: place.min_height_inches,
              duration_minutes: place.duration_minutes,
              gets_wet: place.gets_wet,
              single_rider: place.single_rider,
              child_swap: place.child_swap,
              lightning_lane: place.lightning_lane,
              indoor_outdoor: place.indoor_outdoor,
              thrill_level: place.thrill_level || getThrillLevelFromSubcategory(place.tavvy_subcategory),
              is_must_ride: place.tavvy_subcategory === 'thrill_rides',
              is_featured: false,
            }));
            setRides(mappedRides);
            setLoading(false);
            return;
          }
        }
      }

      // No theme park found, search by ride name
      setSearchingByPark(false);
      const { data, error: queryError } = await supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches, duration_minutes, thrill_level, gets_wet, single_rider, child_swap, lightning_lane, indoor_outdoor')
        .eq('tavvy_category', 'attraction')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(100);

      if (queryError) {
        console.error('Error searching rides:', queryError);
        setRides([]);
      } else {
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
          description: place.description,
          short_description: place.short_description,
          min_height_inches: place.min_height_inches,
          duration_minutes: place.duration_minutes,
          gets_wet: place.gets_wet,
          single_rider: place.single_rider,
          child_swap: place.child_swap,
          lightning_lane: place.lightning_lane,
          indoor_outdoor: place.indoor_outdoor,
          thrill_level: place.thrill_level || getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: place.tavvy_subcategory === 'thrill_rides',
          is_featured: false,
        }));
        setRides(mappedRides);
      }
    } catch (err) {
      console.error('Error searching rides:', err);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (searchQuery.length >= 2) {
      searchRides(searchQuery);
    } else {
      loadRides();
    }
  }, [filterBy, searchQuery]);

  const handleRidePress = (ride: Ride) => {
    router.push(`/app/ride/${ride.id}?name=${encodeURIComponent(ride.name)}&park=${encodeURIComponent(ride.park_name || ride.universe_name || ride.city || '')}`);
  };

  const handleBack = () => {
    router.push('/app');
  };

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#111827';
  const secondaryTextColor = isDark ? COLORS.textSecondary : '#6B7280';

  // Apply filter to rides (for when searching by park)
  const filteredRides = rides.filter(r => {
    if (filterBy === 'all') return true;
    return (r.subcategory || '').toLowerCase() === filterBy;
  });

  const featuredRide = filteredRides.find(r => r.is_must_ride || r.is_featured) || filteredRides[0];
  const popularRides = filteredRides.filter(r => r.id !== featuredRide?.id).slice(0, 20);

  // Format subcategory for display
  const formatSubcategory = (subcategory: string | undefined): string => {
    if (!subcategory) return 'Attraction';
    const labels: Record<string, string> = {
      thrill_rides: 'Thrill Rides',
      family_rides: 'Family Rides',
      dark_rides: 'Dark Rides',
      shows: 'Shows & Entertainment',
      characters: 'Characters',
      explore: 'Explore',
      animals: 'Animals & Nature',
      water_rides: 'Water Rides',
      simulators: 'Simulators',
      interactive: 'Interactive',
    };
    return labels[subcategory] || subcategory
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <>
      <Head>
        <title>Rides & Attractions | TavvY</title>
        <meta name="description" content="Browse theme park rides and attractions on TavvY" />
      </Head>

      <AppLayout>
        <div className="rides-screen" style={{ backgroundColor, minHeight: '100vh' }}>
          {/* Header */}
          <div className="rides-header" style={{ 
            backgroundColor: surfaceColor,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`
          }}>
            <button 
              onClick={handleBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              <FiArrowLeft size={24} color={textColor} />
            </button>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 style={{ color: textColor, fontSize: '20px', fontWeight: '600', margin: 0 }}>Rides</h1>
              <p style={{ color: COLORS.accent, fontSize: '14px', margin: 0 }}>Theme park thrills await.</p>
            </div>
            <button 
              onClick={onRefresh}
              disabled={refreshing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              <FiRefreshCw 
                size={20} 
                color={secondaryTextColor} 
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '12px 16px', backgroundColor: surfaceColor }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              backgroundColor: glassyColor,
              borderRadius: '12px',
              padding: '12px 16px',
              gap: '12px'
            }}>
              <FiSearch size={20} color={secondaryTextColor} />
              <input
                type="text"
                placeholder="Search rides or theme parks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: textColor,
                  fontSize: '16px'
                }}
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <FiX size={20} color={secondaryTextColor} />
                </button>
              )}
            </div>
            {searchingByPark && searchQuery && (
              <p style={{ 
                color: COLORS.accent, 
                fontSize: '12px', 
                marginTop: '8px',
                marginLeft: '4px'
              }}>
                Showing rides from "{searchQuery}"
              </p>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ 
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            overflowX: 'auto',
            backgroundColor
          }}>
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilterBy(option.key)}
                style={{ 
                  backgroundColor: filterBy === option.key ? COLORS.accent : glassyColor,
                  color: filterBy === option.key ? '#FFFFFF' : secondaryTextColor,
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '60px 20px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: `3px solid ${glassyColor}`,
                  borderTopColor: COLORS.accent,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: secondaryTextColor, marginTop: '16px' }}>Loading rides...</p>
              </div>
            ) : error ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '60px 20px'
              }}>
                <IoTrainOutline size={64} color={secondaryTextColor} />
                <p style={{ color: textColor, marginTop: '16px', fontWeight: '600' }}>{error}</p>
                <button 
                  onClick={onRefresh}
                  style={{
                    marginTop: '16px',
                    backgroundColor: COLORS.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : filteredRides.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '60px 20px'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: glassyColor,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IoTrainOutline size={40} color={secondaryTextColor} />
                </div>
                <p style={{ color: textColor, marginTop: '16px', fontWeight: '600', fontSize: '18px' }}>No rides found</p>
                <p style={{ color: secondaryTextColor, marginTop: '8px', textAlign: 'center' }}>
                  {searchQuery ? `No rides matching "${searchQuery}"` : 'Theme park rides and attractions will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {/* Featured Ride */}
                {featuredRide && (
                  <div 
                    onClick={() => handleRidePress(featuredRide)}
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '20px',
                      cursor: 'pointer',
                      height: '180px'
                    }}
                  >
                    <img 
                      src={featuredRide.cover_image_url || getCategoryFallbackImage(featuredRide.subcategory)}
                      alt={featuredRide.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(featuredRide.subcategory);
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '16px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        {featuredRide.is_must_ride && (
                          <span style={{
                            backgroundColor: COLORS.mustRide,
                            color: '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            MUST RIDE
                          </span>
                        )}
                        {featuredRide.thrill_level && THRILL_LABELS[featuredRide.thrill_level] && (
                          <span style={{
                            backgroundColor: THRILL_LABELS[featuredRide.thrill_level].color,
                            color: '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {THRILL_LABELS[featuredRide.thrill_level].label}
                          </span>
                        )}
                        {featuredRide.min_height_inches && (
                          <span style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#FFFFFF',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {featuredRide.min_height_inches}" min
                          </span>
                        )}
                      </div>
                      <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {featuredRide.name}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '4px 0 0' }}>
                        {formatSubcategory(featuredRide.subcategory)} • {featuredRide.park_name || featuredRide.universe_name || 'Theme Park'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rides Count */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h2 style={{ color: textColor, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    {searchingByPark ? 'Rides & Attractions' : 'Popular Rides'}
                  </h2>
                  <span style={{ color: secondaryTextColor, fontSize: '14px' }}>
                    {filteredRides.length} rides
                  </span>
                </div>

                {/* Rides Grid */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {popularRides.map((ride) => (
                    <div
                      key={ride.id}
                      onClick={() => handleRidePress(ride)}
                      style={{
                        backgroundColor: surfaceColor,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`
                      }}
                    >
                      <div style={{ position: 'relative', height: '100px' }}>
                        <img 
                          src={ride.cover_image_url || getCategoryFallbackImage(ride.subcategory)}
                          alt={ride.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryFallbackImage(ride.subcategory);
                          }}
                        />
                        {ride.thrill_level && THRILL_LABELS[ride.thrill_level] && (
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: THRILL_LABELS[ride.thrill_level].color,
                            color: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: '600'
                          }}>
                            {THRILL_LABELS[ride.thrill_level].label}
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '10px' }}>
                        <h4 style={{ 
                          color: textColor, 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {ride.name}
                        </h4>
                        <p style={{ 
                          color: secondaryTextColor, 
                          fontSize: '11px', 
                          margin: '4px 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {formatSubcategory(ride.subcategory)}
                          {ride.min_height_inches && ` • ${ride.min_height_inches}"`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </AppLayout>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
}
