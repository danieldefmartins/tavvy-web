/**
 * Universes Screen - Web Version V3
 * EXACT pixel-perfect port from iOS Tavvy V2
 * 
 * Design: Black background, blue accents, featured universe hero,
 * category filters with labels, popular universes grid, working search
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  IoSearchOutline, IoCloseCircle, IoFlameOutline
} from 'react-icons/io5';
import { 
  MdAttractions, MdFlight, MdPark, MdLocationCity, 
  MdSportsFootball, MdBeachAccess, MdHotel, MdDirectionsBoat 
} from 'react-icons/md';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Theme colors
const COLORS = {
  accent: '#667EEA',
  accentHover: '#5A6FD6',
  background: '#000000',
  backgroundLight: '#FFFFFF',
  surface: 'rgba(255,255,255,0.08)',
  surfaceLight: '#F3F4F6',
  text: '#FFFFFF',
  textLight: '#111827',
  textSecondary: '#9CA3AF',
  textSecondaryLight: '#6B7280',
  active: '#EF4444',
};

interface Universe {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  category_id?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  is_featured?: boolean;
  status?: string;
  total_signals?: number;
  place_count?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

// Category configuration matching iOS
const CATEGORY_CONFIG: { [key: string]: { icon: any; label: string } } = {
  'theme-parks': { icon: MdAttractions, label: 'Theme Parks' },
  'airports': { icon: MdFlight, label: 'Airports' },
  'national-parks': { icon: MdPark, label: 'Parks' },
  'cities': { icon: MdLocationCity, label: 'Cities' },
  'stadiums': { icon: MdSportsFootball, label: 'Stadiums' },
  'beaches': { icon: MdBeachAccess, label: 'Beaches' },
  'resorts': { icon: MdHotel, label: 'Resorts' },
  'cruise-ports': { icon: MdDirectionsBoat, label: 'Cruise' },
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function UniversesScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { isDark } = useThemeContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Universe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<Category[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme colors based on mode
  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const textColor = isDark ? COLORS.text : COLORS.textLight;
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textSecondaryLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('atlas_categories')
        .select('*')
        .order('name');
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Load featured universe
      const { data: featuredData } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .limit(1)
        .maybeSingle();

      if (featuredData) {
        setFeaturedUniverse(featuredData);
      }

      // Load popular universes
      const { data: universesData } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .order('total_signals', { ascending: false })
        .limit(8);

      if (universesData) {
        setUniverses(universesData);
        // Use first as featured if none specifically marked
        if (!featuredData && universesData.length > 0) {
          setFeaturedUniverse(universesData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%,description.ilike.%${query}%`)
        .order('total_signals', { ascending: false })
        .limit(20);

      if (data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const getCategorySlug = (categoryId?: string) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.slug || null;
  };

  const getCategoryType = (categoryId?: string) => {
    if (!categoryId) return 'Universe';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Universe';
  };

  const getActivityLevel = (signals: number) => {
    if (signals > 1000) return { label: 'High Activity', color: COLORS.active };
    if (signals > 100) return { label: 'Active', color: COLORS.active };
    return { label: 'Active', color: COLORS.active };
  };

  const filteredUniverses = activeCategory === 'All' 
    ? universes 
    : universes.filter(u => {
        const catSlug = getCategorySlug(u.category_id);
        const config = catSlug ? CATEGORY_CONFIG[catSlug] : null;
        return config?.label === activeCategory;
      });

  const isShowingSearchResults = searchQuery.trim().length > 0;

  const renderCategoryIcon = (config: { icon: any; label: string }, size: number, color: string) => {
    const IconComponent = config.icon;
    return <IconComponent size={size} color={color} />;
  };

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore curated worlds" />
      </Head>

      <AppLayout>
        <div style={{
          minHeight: '100vh',
          backgroundColor,
          paddingBottom: '100px'
        }}>

          {/* Header */}
          <div style={{ padding: '16px 16px 4px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: textColor,
              margin: '0 0 2px 0',
              letterSpacing: '-0.3px'
            }}>
              Universes
            </h1>
            <p style={{
              fontSize: '14px',
              color: COLORS.accent,
              margin: 0,
              fontWeight: '500'
            }}>
              Explore curated worlds.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '12px 16px 16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: surfaceColor,
              borderRadius: '12px'
            }}>
              <IoSearchOutline size={20} color={secondaryTextColor} />
              <input
                type="text"
                placeholder="Search parks, airports, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: textColor,
                  fontFamily: 'inherit'
                }}
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={clearSearch}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <IoCloseCircle size={20} color={secondaryTextColor} />
                </button>
              )}
              {isSearching && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${COLORS.accent}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>
          </div>

          {/* Search Results or Regular Content */}
          {isShowingSearchResults ? (
            /* Search Results */
            <div style={{ padding: '0 20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: textColor,
                margin: '0 0 14px 0'
              }}>
                {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
              </h3>
              
              {searchResults.length === 0 && !isSearching ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  <IoSearchOutline size={48} color={secondaryTextColor} />
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: secondaryTextColor,
                    marginTop: '16px'
                  }}>
                    No universes found for "{searchQuery}"
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: secondaryTextColor,
                    marginTop: '8px'
                  }}>
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  {searchResults.map((universe) => {
                    const activity = getActivityLevel(universe.total_signals || 0);
                    return (
                      <Link
                        key={universe.id}
                        href={`/app/universe/${universe.slug || universe.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div style={{
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}>
                          <div style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: isDark ? '#1F2937' : '#E5E7EB'
                          }}>
                            <img
                              src={universe.thumbnail_image_url || universe.banner_image_url || PLACEHOLDER_IMAGE}
                              alt={universe.name}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                          <div style={{ paddingTop: '10px' }}>
                            <p style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: textColor,
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {universe.name}
                            </p>
                            <p style={{
                              fontSize: '13px',
                              color: secondaryTextColor,
                              margin: '2px 0 0 0'
                            }}>
                              {universe.location || getCategoryType(universe.category_id)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Regular Content */
            <>
              {/* Featured Universe */}
              {featuredUniverse && (
                <div style={{ padding: '0 16px 20px' }}>
                  <div 
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      height: '160px',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/app/universe/${featuredUniverse.slug || featuredUniverse.id}`)}
                  >
                    {/* Background Image */}
                    <img
                      src={featuredUniverse.banner_image_url || featuredUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE}
                      alt={featuredUniverse.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        backgroundColor: isDark ? '#1F2937' : '#E5E7EB'
                      }}
                    />
                    
                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      zIndex: 10
                    }}>
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        padding: '5px 10px',
                        borderRadius: '6px'
                      }}>
                        <span style={{
                          color: COLORS.accent,
                          fontSize: '10px',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          FEATURED UNIVERSE
                        </span>
                      </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '60px 16px 16px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7), rgba(0,0,0,0.9))'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{ flex: 1, marginRight: '12px' }}>
                          <h2 style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#FFFFFF',
                            margin: '0 0 4px 0'
                          }}>
                            {featuredUniverse.name}
                          </h2>
                          <p style={{
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.8)',
                            margin: 0
                          }}>
                            {getCategoryType(featuredUniverse.category_id)} • {featuredUniverse.location || 'Explore Now'}
                          </p>
                        </div>
                        <button style={{
                          padding: '10px 16px',
                          backgroundColor: COLORS.accent,
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}>
                          Explore Universe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter by Category */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: textColor,
                  margin: '0 0 10px 0',
                  paddingLeft: '16px'
                }}>
                  Filter by Category
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingBottom: '4px'
                }}>
                  {Object.entries(CATEGORY_CONFIG).slice(0, 6).map(([slug, config]) => {
                    const isActive = activeCategory === config.label;
                    return (
                      <button
                        key={slug}
                        onClick={() => setActiveCategory(isActive ? 'All' : config.label)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '64px',
                          height: '72px',
                          padding: '8px',
                          backgroundColor: surfaceColor,
                          border: isActive ? `2px solid ${COLORS.accent}` : 'none',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        {renderCategoryIcon(config, 24, isActive ? COLORS.accent : secondaryTextColor)}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          marginTop: '4px',
                          textAlign: 'center',
                          color: isActive ? COLORS.accent : secondaryTextColor
                        }}>
                          {config.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Popular Universes */}
              <div style={{ padding: '0 16px' }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: textColor,
                  margin: '0 0 10px 0'
                }}>
                  Popular Universes
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {filteredUniverses.map((universe) => {
                    const activity = getActivityLevel(universe.total_signals || 0);
                    return (
                      <Link
                        key={universe.id}
                        href={`/app/universe/${universe.slug || universe.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div style={{
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}>
                          <div style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: isDark ? '#1F2937' : '#E5E7EB'
                          }}>
                            <img
                              src={universe.thumbnail_image_url || universe.banner_image_url || PLACEHOLDER_IMAGE}
                              alt={universe.name}
                              style={{
                                width: '100%',
                                height: '90px',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                          <div style={{ paddingTop: '8px' }}>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: textColor,
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {universe.name}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              marginTop: '2px'
                            }}>
                              <IoFlameOutline size={12} color={activity.color} />
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: activity.color
                              }}>
                                {activity.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* CSS for spinner animation */}
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
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
