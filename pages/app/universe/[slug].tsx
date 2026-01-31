/**
 * Universe Landing Screen - iOS Match
 * Pixel-perfect port from iOS UniverseLandingScreen.tsx
 * 
 * Design System:
 * - Primary: #06B6D4 (Cyan)
 * - Background: #FFFFFF (Light) / #000000 (Dark)
 * - Text: #1F2937 (Light) / #FFFFFF (Dark)
 * - Secondary Text: #6B7280 / #9CA3AF
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  IoArrowBack, IoHeartOutline, IoShareOutline, IoLocation,
  IoSearch, IoExitOutline, IoRestaurantOutline, IoWaterOutline,
  IoCarOutline, IoSparkles
} from 'react-icons/io5';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

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
  is_open?: boolean;
}

export default function UniverseLandingScreen() {
  const router = useRouter();
  const { slug } = router.query;
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [subUniverses, setSubUniverses] = useState<Universe[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (slug) {
      loadUniverseData();
    }
  }, [slug]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch universe by slug or id
      let universeData = null;
      
      const { data: bySlug } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (bySlug) {
        universeData = bySlug;
      } else {
        const { data: byId } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        universeData = byId;
      }

      if (!universeData) {
        setLoading(false);
        return;
      }
      
      setUniverse(universeData);

      // Fetch sub-universes
      const { data: subUniversesData } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeData.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      // Fetch places
      const { data: placesData } = await supabase
        .from('atlas_universe_places')
        .select(`
          place_id,
          places (
            id,
            name,
            tavvy_category,
            tavvy_subcategory,
            total_signals,
            thumbnail_url,
            is_open
          )
        `)
        .eq('universe_id', universeData.id)
        .limit(50);

      if (placesData) {
        const extractedPlaces = placesData
          .map(item => item.places)
          .filter(Boolean) as Place[];
        setPlaces(extractedPlaces);
      }

    } catch (error) {
      console.error('Error loading universe:', error);
    } finally {
      setLoading(false);
    }
  };

  // Theme colors matching iOS exactly
  const colors = {
    primary: '#06B6D4',
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1F2937',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#F3F4F6',
    inputBg: '#F3F4F6',
  };

  const stats = [
    { val: universe?.place_count || 0, label: 'Places' },
    { val: universe?.total_signals || 0, label: 'Signals' },
    { val: subUniverses.length, label: 'Parks' },
    { val: '4', label: 'Entrances' },
  ];

  const zones = ['All Zones', ...subUniverses.map(s => s.name)];

  const filteredPlaces = places.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeZone !== 'All Zones') {
      // Filter by zone logic here
    }
    return true;
  });

  if (loading) {
    return (
      <AppLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          color: colors.textSecondary 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <div>Loading universe...</div>
        </div>
      </AppLayout>
    );
  }

  if (!universe) {
    return (
      <AppLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          color: colors.textSecondary 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <div>Universe not found</div>
          <button 
            onClick={() => router.back()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{universe.name} | TavvY</title>
        <meta name="description" content={universe.description || `Explore ${universe.name}`} />
      </Head>

      <AppLayout>
        <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
          {/* Hero Section */}
          <div style={{ position: 'relative', height: '300px' }}>
            <img 
              src={universe.banner_image_url || PLACEHOLDER_IMAGE}
              alt={universe.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)'
            }} />
            
            {/* Hero Nav */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px',
              paddingTop: '40px'
            }}>
              <button
                onClick={() => router.back()}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <IoArrowBack size={24} color="#1F2937" />
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <IoHeartOutline size={24} color="#1F2937" />
                </button>
                <button style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <IoShareOutline size={24} color="#1F2937" />
                </button>
              </div>
            </div>

            {/* Hero Content */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(6, 182, 212, 0.9)',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderRadius: '12px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '12px', marginRight: '4px' }}>🌌</span>
                <span style={{ 
                  color: '#fff', 
                  fontSize: '10px', 
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  UNIVERSE
                </span>
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '6px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {universe.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IoLocation size={14} color="#fff" style={{ marginRight: '4px' }} />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  {universe.location || 'Location TBD'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '16px 0',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: colors.primary
                }}>
                  {stat.val}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: colors.textTertiary,
                  marginTop: '2px'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`
          }}>
            {["Places", "Map", "Signals", "Info"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? colors.primary : 'transparent'}`,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: activeTab === tab ? colors.primary : colors.textTertiary,
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div style={{
            padding: '16px',
            backgroundColor: colors.surface,
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: colors.inputBg,
              padding: '10px',
              borderRadius: '12px',
              marginBottom: '12px'
            }}>
              <IoSearch size={16} color={colors.textTertiary} />
              <input
                type="text"
                placeholder="Search in this universe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  marginLeft: '8px',
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: colors.text,
                  fontSize: '13px'
                }}
              />
            </div>
            
            {zones.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {zones.map((zone) => (
                  <button
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      backgroundColor: activeZone === zone ? colors.primary : colors.inputBg,
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: activeZone === zone ? '#fff' : '#4B5563',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Universes Section */}
          {subUniverses.length > 0 && (
            <div style={{
              padding: '16px 0',
              backgroundColor: colors.surface,
              marginBottom: '8px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: colors.text,
                paddingLeft: '16px',
                marginBottom: '12px'
              }}>
                Parks & Areas
              </h2>
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                overflowX: 'auto',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}>
                {subUniverses.map((subUniverse) => (
                  <div
                    key={subUniverse.id}
                    onClick={() => router.push(`/app/universe/${subUniverse.slug || subUniverse.id}`)}
                    style={{
                      minWidth: '140px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: colors.inputBg,
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={subUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE}
                      alt={subUniverse.name}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {subUniverse.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.textSecondary,
                        marginTop: '2px'
                      }}>
                        {subUniverse.place_count || 0} places
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            padding: '16px',
            backgroundColor: colors.surface,
            marginBottom: '8px'
          }}>
            {[
              { icon: IoExitOutline, label: "Entrances" },
              { icon: IoRestaurantOutline, label: "Dining" },
              { icon: IoWaterOutline, label: "Restrooms" },
              { icon: IoCarOutline, label: "Parking" }
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: colors.inputBg,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={24} color="#374151" />
                  <span style={{
                    fontSize: '11px',
                    color: colors.textSecondary,
                    marginTop: '6px',
                    textAlign: 'center'
                  }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Places List */}
          <div style={{
            padding: '16px',
            backgroundColor: colors.surface
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: colors.text
              }}>
                Places in this Universe
              </h2>
              <span style={{
                fontSize: '13px',
                color: colors.textSecondary
              }}>
                {filteredPlaces.length} places
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  onClick={() => router.push(`/app/place/${place.id}`)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={place.thumbnail_url || getCategoryFallbackImage(place.tavvy_category || '')}
                    alt={place.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: colors.text,
                      marginBottom: '4px'
                    }}>
                      {place.name}
                    </h3>
                    <div style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      marginBottom: '6px'
                    }}>
                      {place.tavvy_category || 'Place'}
                    </div>
                    {place.total_signals && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IoSparkles size={12} color={colors.primary} />
                        <span style={{
                          fontSize: '11px',
                          color: colors.textSecondary
                        }}>
                          {place.total_signals} signals
                        </span>
                      </div>
                    )}
                  </div>
                  {place.is_open !== undefined && (
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: place.is_open ? '#D1FAE5' : '#FEE2E2',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: place.is_open ? '#065F46' : '#991B1B',
                      height: 'fit-content'
                    }}>
                      {place.is_open ? 'Open' : 'Closed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
