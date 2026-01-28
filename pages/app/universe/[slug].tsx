/**
 * Universe Detail Screen - Web Version
 * Shows universe with curved carousel planet selector
 * Supports dark mode (default) and light mode
 * 
 * Features:
 * - Universe name at top with galaxy icon
 * - Curved carousel showing 5 planets (center one larger)
 * - Click/scroll to navigate between planets
 * - Selected planet info with stats
 * - Places list for selected planet
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import { IoSparkles, IoPlanet, IoChevronForward } from 'react-icons/io5';

// Planet carousel configuration
const PLANET_SIZE_LARGE = 100;
const PLANET_SIZE_MEDIUM = 70;
const PLANET_SIZE_SMALL = 50;

// Planet colors for visual variety
const PLANET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
];

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  total_signals?: number;
  place_count?: number;
  sub_universe_count?: number;
  parent_universe_id?: string;
}

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  total_signals?: number;
  thumbnail_url?: string;
}

// Get category-based fallback image
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  return imageMap.default;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
};

export default function UniverseDetailScreen() {
  const router = useRouter();
  const { slug } = router.query;
  const { theme, isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [planets, setPlanets] = useState<Universe[]>([]);
  const [selectedPlanetIndex, setSelectedPlanetIndex] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  useEffect(() => {
    if (slug) {
      loadUniverseData();
    }
  }, [slug]);

  // Load places when selected planet changes
  useEffect(() => {
    if (planets.length > 0 && selectedPlanetIndex >= 0) {
      loadPlanetPlaces(planets[selectedPlanetIndex].id);
    }
  }, [selectedPlanetIndex, planets]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch the universe details - try by slug first, then by id
      let universeData = null;
      let universeError = null;

      // First try to find by slug
      const { data: bySlug, error: slugError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (bySlug) {
        universeData = bySlug;
      } else {
        // If not found by slug, try by id
        const { data: byId, error: idError } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        
        universeData = byId;
        universeError = idError;
      }

      if (universeError) throw universeError;
      
      // If no universe found, stop here
      if (!universeData) {
        console.error('Universe not found for slug/id:', slug);
        setLoading(false);
        return;
      }
      
      setUniverse(universeData);

      // Fetch sub-universes (planets) for this universe
      const { data: planetsData, error: planetsError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeData.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (!planetsError && planetsData && planetsData.length > 0) {
        setPlanets(planetsData);
        setSelectedPlanetIndex(Math.floor(planetsData.length / 2));
      } else {
        // If no sub-universes, treat the universe itself as the only "planet"
        setPlanets([universeData]);
        setSelectedPlanetIndex(0);
      }

    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanetPlaces = async (planetId: string) => {
    setLoadingPlaces(true);
    try {
      const { data: placesData, error: placesError } = await supabase
        .from('atlas_universe_places')
        .select(`
          place:places(
            id,
            name,
            tavvy_category,
            tavvy_subcategory,
            total_signals,
            thumbnail_url
          )
        `)
        .eq('universe_id', planetId)
        .order('display_order', { ascending: true });

      if (!placesError && placesData) {
        const extractedPlaces = placesData
          .map((item: any) => item.place)
          .filter(Boolean);
        setPlaces(extractedPlaces);
      }
    } catch (error) {
      console.error('Error loading planet places:', error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const handlePlanetPress = (index: number) => {
    setSelectedPlanetIndex(index);
  };

  const handlePlanetScroll = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, selectedPlanetIndex - 1)
      : Math.min(planets.length - 1, selectedPlanetIndex + 1);
    setSelectedPlanetIndex(newIndex);
  };

  const selectedPlanet = planets[selectedPlanetIndex];

  // Calculate visible planets (5 at a time, centered on selected)
  const getVisiblePlanets = () => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      const index = selectedPlanetIndex + i;
      if (index >= 0 && index < planets.length) {
        result.push({ planet: planets[index], position: i, index });
      } else {
        result.push({ planet: null, position: i, index });
      }
    }
    return result;
  };

  const getPlanetStyle = (position: number) => {
    const absPos = Math.abs(position);
    let size = PLANET_SIZE_SMALL;
    let opacity = 0.5;
    let translateY = 30;

    if (absPos === 0) {
      size = PLANET_SIZE_LARGE;
      opacity = 1;
      translateY = 0;
    } else if (absPos === 1) {
      size = PLANET_SIZE_MEDIUM;
      opacity = 0.8;
      translateY = 15;
    }

    return { size, opacity, translateY };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-screen" style={{ backgroundColor: theme.background }}>
          <div className="loading-spinner" />
          <p style={{ color: theme.textSecondary, marginTop: 12 }}>Loading universe...</p>
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid ${theme.surface};
              border-top-color: ${theme.primary};
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  if (!universe) {
    return (
      <AppLayout>
        <div className="error-screen" style={{ backgroundColor: theme.background }}>
          <span className="error-icon">🌌</span>
          <h1 style={{ color: theme.text }}>Universe not found</h1>
          <button onClick={() => router.push('/app/universes')} style={{ color: theme.primary }}>
            Back to Universes
          </button>
          <style jsx>{`
            .error-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              text-align: center;
            }
            .error-icon { font-size: 64px; margin-bottom: 16px; }
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{universe.name} | TavvY</title>
        <meta name="description" content={`Explore ${universe.name} on TavvY`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="universe-detail" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <div className="header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <div className="header-center">
              <span className="galaxy-icon">🌌</span>
              <h1 className="universe-name" style={{ color: theme.text }}>{universe.name}</h1>
            </div>
            <button className="more-button">
              <FiMoreHorizontal size={24} color={theme.text} />
            </button>
          </div>

          {/* Planet Carousel */}
          <div className="carousel-container">
            {/* Curved Arc Background */}
            <div className="arc-background" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            
            {/* Navigation Arrows */}
            {selectedPlanetIndex > 0 && (
              <button 
                className="nav-arrow nav-arrow-left"
                onClick={() => handlePlanetScroll('left')}
              >
                <FiChevronLeft size={28} color={theme.textSecondary} />
              </button>
            )}
            {selectedPlanetIndex < planets.length - 1 && (
              <button 
                className="nav-arrow nav-arrow-right"
                onClick={() => handlePlanetScroll('right')}
              >
                <FiChevronRight size={28} color={theme.textSecondary} />
              </button>
            )}

            {/* Planets */}
            <div className="planets-row">
              {getVisiblePlanets().map((item, idx) => {
                if (!item.planet) {
                  return <div key={`empty-${idx}`} className="planet-placeholder" />;
                }
                
                const { size, opacity, translateY } = getPlanetStyle(item.position);
                const isSelected = item.position === 0;
                const planetColor = PLANET_COLORS[item.index % PLANET_COLORS.length];

                return (
                  <button
                    key={item.planet.id}
                    className="planet-container"
                    style={{ 
                      opacity, 
                      transform: `translateY(${translateY}px)`,
                    }}
                    onClick={() => handlePlanetPress(item.index)}
                  >
                    {/* Planet Glow (for selected) */}
                    {isSelected && (
                      <div 
                        className="planet-glow" 
                        style={{ 
                          backgroundColor: planetColor,
                          width: size + 20,
                          height: size + 20,
                        }} 
                      />
                    )}
                    
                    {/* Planet Image/Icon */}
                    <div 
                      className="planet"
                      style={{ 
                        width: size, 
                        height: size, 
                        borderRadius: size / 2,
                        borderColor: isSelected ? planetColor : 'transparent',
                        borderWidth: isSelected ? 3 : 0,
                        borderStyle: 'solid',
                      }}
                    >
                      {item.planet.thumbnail_image_url ? (
                        <img 
                          src={item.planet.thumbnail_image_url} 
                          alt={item.planet.name}
                          className="planet-image"
                          style={{ borderRadius: size / 2 }}
                        />
                      ) : (
                        <div 
                          className="planet-fallback"
                          style={{ 
                            backgroundColor: planetColor, 
                            borderRadius: size / 2,
                          }}
                        >
                          <IoPlanet size={size * 0.5} color="rgba(255,255,255,0.9)" />
                        </div>
                      )}
                    </div>

                    {/* Planet Name */}
                    <span 
                      className="planet-name"
                      style={{ 
                        color: theme.text,
                        fontSize: isSelected ? 13 : 10,
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {item.planet.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pagination Dots */}
            {planets.length > 1 && (
              <div className="pagination-dots">
                {planets.map((_, index) => (
                  <div
                    key={index}
                    className="dot"
                    style={{
                      backgroundColor: index === selectedPlanetIndex 
                        ? theme.primary 
                        : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                      width: index === selectedPlanetIndex ? 20 : 6,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Selected Planet Info */}
          {selectedPlanet && (
            <div className="selected-planet-info">
              <h2 className="selected-planet-name" style={{ color: theme.text }}>
                {selectedPlanet.name}
              </h2>
              <p className="selected-planet-stats" style={{ color: theme.textSecondary }}>
                {selectedPlanet.place_count || places.length} Places • {formatNumber(selectedPlanet.total_signals || 0)} Signals
              </p>
            </div>
          )}

          {/* Places Section */}
          <div className="places-section">
            <h3 className="section-title" style={{ color: theme.text }}>
              Places in {selectedPlanet?.name || 'this Universe'}
            </h3>

            {loadingPlaces ? (
              <div className="places-loading">
                <div className="loading-spinner-small" style={{ borderTopColor: theme.primary }} />
              </div>
            ) : places.length > 0 ? (
              <div className="places-list">
                {places.map((place) => (
                  <Link href={`/app/place/${place.id}`} key={place.id}>
                    <div 
                      className="place-card"
                      style={{ 
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      <img
                        src={place.thumbnail_url || getCategoryFallbackImage(place.tavvy_category || '')}
                        alt={place.name}
                        className="place-image"
                      />
                      <div className="place-content">
                        <h4 className="place-name" style={{ color: theme.text }}>
                          {place.name}
                        </h4>
                        <p className="place-category" style={{ color: theme.textSecondary }}>
                          {place.tavvy_category || 'Attraction'}
                        </p>
                        <div className="place-signals">
                          <IoSparkles size={12} color={theme.primary} />
                          <span style={{ color: theme.primary }}>
                            {place.total_signals || 0} signals
                          </span>
                        </div>
                      </div>
                      <IoChevronForward size={20} color={theme.textSecondary} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📍</span>
                <p style={{ color: theme.textSecondary }}>No places added yet</p>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .universe-detail {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            padding-top: calc(12px + env(safe-area-inset-top, 0));
          }
          
          .back-button, .more-button {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .header-center {
            display: flex;
            align-items: center;
            flex: 1;
            justify-content: center;
            padding: 0 8px;
          }
          
          .galaxy-icon {
            font-size: 20px;
            margin-right: 8px;
          }
          
          .universe-name {
            font-size: 17px;
            font-weight: 700;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* Carousel */
          .carousel-container {
            height: 200px;
            position: relative;
            margin-top: 10px;
          }
          
          .arc-background {
            position: absolute;
            bottom: 50px;
            left: 30px;
            right: 30px;
            height: 100px;
            border-bottom-left-radius: 200px;
            border-bottom-right-radius: 200px;
            border-width: 1px;
            border-style: solid;
            border-top: none;
          }
          
          .nav-arrow {
            position: absolute;
            top: 35%;
            z-index: 10;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .nav-arrow-left { left: 4px; }
          .nav-arrow-right { right: 4px; }
          
          .planets-row {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            height: 150px;
            padding: 0 10px;
          }
          
          .planet-placeholder {
            width: ${PLANET_SIZE_SMALL}px;
            margin: 0 6px;
          }
          
          .planet-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 6px;
            background: none;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
          }
          
          .planet-glow {
            position: absolute;
            top: -10px;
            border-radius: 50%;
            opacity: 0.25;
          }
          
          .planet {
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .planet-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .planet-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .planet-name {
            margin-top: 8px;
            text-align: center;
            max-width: 70px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .pagination-dots {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 12px;
          }
          
          .dot {
            height: 6px;
            border-radius: 3px;
            margin: 0 3px;
            transition: all 0.3s ease;
          }
          
          /* Selected Planet Info */
          .selected-planet-info {
            text-align: center;
            padding: 16px;
          }
          
          .selected-planet-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .selected-planet-stats {
            font-size: 14px;
            margin: 0;
          }
          
          /* Places Section */
          .places-section {
            padding: 0 16px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px;
          }
          
          .places-loading {
            padding: 40px;
            display: flex;
            justify-content: center;
          }
          
          .loading-spinner-small {
            width: 24px;
            height: 24px;
            border: 2px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          .places-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .place-card {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            border-width: 1px;
            border-style: solid;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          
          .place-card:hover {
            transform: translateX(4px);
          }
          
          .place-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
          }
          
          .place-content {
            flex: 1;
            margin-left: 12px;
          }
          
          .place-name {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .place-category {
            font-size: 13px;
            margin: 0 0 4px;
          }
          
          .place-signals {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .empty-state {
            text-align: center;
            padding: 40px;
          }
          
          .empty-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 12px;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </AppLayout>
    </>
  );
}
