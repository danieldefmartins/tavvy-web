/**
 * OnTheGo Screen - Web Version V2
 * Updated to match mobile V2 design system
 * 
 * Features:
 * - V2 Pure Black Design (#0A0A0F background, #1A1A24 surfaces)
 * - Full-screen map showing live mobile businesses
 * - V2 Header with back arrow and login icon
 * - Map layer switcher (Standard, Dark, Satellite)
 * - Updated filter categories: All, Live Now, Food, Pet Grooming, Hair Dresser, Coffee, Services
 * - Enhanced GPS blue dot with glowing effect
 * - Collapsible "Live Now" bottom sheet
 * - White text on dark backgrounds for readability
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  IoLocationOutline, IoTimeOutline, IoCallOutline, IoChevronDown,
  IoChevronUp, IoFastFoodOutline, IoCafeOutline, IoGridOutline,
  IoRadioOutline, IoPawOutline, IoCutOutline, IoConstructOutline,
  IoArrowBack, IoPersonCircleOutline, IoMapOutline, IoMoonOutline,
  IoImageOutline, IoRestaurantOutline
} from 'react-icons/io5';

// V2 Design System Colors - matching mobile
const COLORS = {
  background: '#0A0A0F',  // V2 Pure black
  backgroundLight: '#FAFAFA',
  surface: '#1A1A24',  // V2 Card background
  surfaceLight: '#FFFFFF',
  glassy: 'rgba(26, 26, 36, 0.85)',  // V2 Glassy dark
  glassyLight: 'rgba(255, 255, 255, 0.9)',
  accent: '#6B7FFF',  // V2 Blue
  accentEnd: '#5563E8',  // V2 Blue gradient end
  accentGreen: '#10B981',
  accentGold: '#F59E0B',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',  // V2 Secondary text
  textMuted: '#6B7280',
  live: '#EF4444',
  success: '#10B981',
};

// Filter categories matching mobile V2
const FILTER_CATEGORIES = [
  { id: 'all', name: 'All', icon: IoGridOutline },
  { id: 'live', name: 'Live Now', icon: IoRadioOutline },
  { id: 'food', name: 'Food', icon: IoRestaurantOutline },
  { id: 'pet-grooming', name: 'Pet Grooming', icon: IoPawOutline },
  { id: 'hair-dresser', name: 'Hair Dresser', icon: IoCutOutline },
  { id: 'coffee', name: 'Coffee', icon: IoCafeOutline },
  { id: 'mobile-services', name: 'Services', icon: IoConstructOutline },
];

// Map layer options
const MAP_LAYERS = [
  { id: 'standard', name: 'Standard', icon: IoMapOutline },
  { id: 'dark', name: 'Dark', icon: IoMoonOutline },
  { id: 'satellite', name: 'Satellite', icon: IoImageOutline },
];

interface LiveSession {
  session_id?: string;
  tavvy_place_id: string;
  session_lat?: number;
  session_lng?: number;
  place_name: string;
  category?: string;
  subcategory?: string;
  cover_image_url?: string;
  phone?: string;
  service_area?: string;
  location_label?: string;
  session_address?: string;
  today_note?: string;
  started_at?: string;
  scheduled_end_at?: string;
  is_live: boolean;
}

export default function OnTheGoScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { t } = useTranslation('common');
  const { isDark } = useThemeContext();
  
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedMapLayer, setSelectedMapLayer] = useState('standard');
  const [showMapLayerPicker, setShowMapLayerPicker] = useState(false);
  const [trayExpanded, setTrayExpanded] = useState(true);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadLiveSessions();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Miami if location denied
          setUserLocation({ lat: 25.7617, lng: -80.1918 });
        }
      );
    } else {
      // Default to Miami
      setUserLocation({ lat: 25.7617, lng: -80.1918 });
    }
  };

  const loadLiveSessions = async () => {
    setLoading(true);
    try {
      // Fetch live OnTheGo sessions from Supabase
      const { data, error } = await supabase
        .from('onthego_live_sessions')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false });

      if (data) {
        setLiveSessions(data);
      }
    } catch (error) {
      console.error('Error loading live sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = liveSessions.filter(session => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'live') return session.is_live;
    if (selectedFilter === 'food') return session.category?.toLowerCase().includes('food');
    if (selectedFilter === 'pet-grooming') return session.category?.toLowerCase().includes('pet') || session.category?.toLowerCase().includes('grooming');
    if (selectedFilter === 'hair-dresser') return session.category?.toLowerCase().includes('hair') || session.category?.toLowerCase().includes('salon');
    if (selectedFilter === 'coffee') return session.category?.toLowerCase().includes('coffee');
    if (selectedFilter === 'mobile-services') return session.category?.toLowerCase().includes('service');
    return true;
  });

  // Always use V2 dark colors
  const colors = {
    background: COLORS.background,
    surface: COLORS.surface,
    glassy: COLORS.glassy,
    text: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
  };

  return (
    <>
      <Head>
        <title>On The Go | TavvY</title>
        <meta name="description" content="Find mobile businesses near you - food trucks, coffee carts, and more" />
      </Head>

      <AppLayout>
        <div style={{
          position: 'relative',
          height: '100vh',
          backgroundColor: colors.background,
          overflow: 'hidden'
        }}>
          {/* V2 Header */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 100,
            borderBottom: `1px solid ${colors.surface}`
          }}>
            <button
              onClick={() => router.back()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                backgroundColor: colors.surface,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <IoArrowBack size={20} color={colors.text} />
            </button>

            <h1 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.text,
              margin: 0
            }}>
              On The Go
            </h1>

            <button
              onClick={() => router.push('/app/profile', undefined, { locale })}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                backgroundColor: colors.surface,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <IoPersonCircleOutline size={24} color={colors.text} />
            </button>
          </div>

          {/* Map Container */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.surface
          }}>
            {/* Placeholder for map - would integrate MapLibre GL JS here */}
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: colors.textSecondary,
              backgroundColor: selectedMapLayer === 'dark' ? '#1A1A1A' : selectedMapLayer === 'satellite' ? '#2A2A2A' : '#F5F5F5'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: colors.text }}>
                Map Loading...
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                {userLocation ? 
                  `Centered at ${userLocation.lat && !isNaN(userLocation.lat) ? userLocation.lat.toFixed(4) : '0.0000'}, ${userLocation.lng && !isNaN(userLocation.lng) ? userLocation.lng.toFixed(4) : '0.0000'}` :
                  'Getting your location...'
                }
              </div>
              <div style={{ fontSize: '12px', marginTop: '16px', color: colors.textSecondary }}>
                {filteredSessions.length} mobile businesses nearby
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: colors.textSecondary }}>
                Map Layer: {MAP_LAYERS.find(l => l.id === selectedMapLayer)?.name || 'Standard'}
              </div>
              
              {/* GPS Blue Dot Indicator */}
              {userLocation && (
                <div style={{
                  marginTop: '24px',
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Glowing circle */}
                  <div style={{
                    position: 'absolute',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(107, 127, 255, 0.2)',
                    boxShadow: '0 0 20px rgba(107, 127, 255, 0.4)',
                  }} />
                  {/* Blue dot */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.accent,
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Floating Filter Pills */}
          <div style={{
            position: 'absolute',
            top: '75px',
            left: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            zIndex: 50
          }}>
            {FILTER_CATEGORIES.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: isActive ? COLORS.accent : colors.glassy,
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '20px',
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 26, 36, 0.95)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = colors.glassy;
                    }
                  }}
                >
                  <Icon size={16} />
                  {filter.name}
                </button>
              );
            })}
          </div>

          {/* Map Layer Switcher Button */}
          <div style={{
            position: 'absolute',
            top: '135px',
            right: '16px',
            zIndex: 50
          }}>
            <button
              onClick={() => setShowMapLayerPicker(!showMapLayerPicker)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                backgroundColor: colors.glassy,
                backdropFilter: 'blur(10px)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(26, 26, 36, 0.95)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.glassy}
            >
              <IoMapOutline size={22} color={colors.text} />
            </button>

            {/* Map Layer Picker Popup */}
            {showMapLayerPicker && (
              <div style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                backgroundColor: colors.surface,
                borderRadius: '12px',
                padding: '8px',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 100
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: colors.text,
                  padding: '8px 12px',
                  marginBottom: '4px'
                }}>
                  Map Type
                </div>
                {MAP_LAYERS.map((layer) => {
                  const Icon = layer.icon;
                  const isActive = selectedMapLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => {
                        setSelectedMapLayer(layer.id);
                        setShowMapLayerPicker(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: isActive ? 'rgba(107, 127, 255, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Icon size={18} />
                      {layer.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Count Badge */}
          <div style={{
            position: 'absolute',
            top: '135px',
            left: '16px',
            padding: '10px 14px',
            backgroundColor: colors.glassy,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: COLORS.live,
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {filteredSessions.filter(s => s.is_live).length} Live
            </span>
          </div>

          {/* Collapsible Live Now Bottom Sheet */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            maxHeight: trayExpanded ? '60vh' : '70px',
            transition: 'max-height 0.3s ease',
            overflow: 'hidden',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 60
          }}>
            {/* Tray Header */}
            <button
              onClick={() => setTrayExpanded(!trayExpanded)}
              style={{
                width: '100%',
                padding: '20px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IoRadioOutline size={22} color={COLORS.live} />
                <span style={{
                  color: colors.text,
                  fontSize: '17px',
                  fontWeight: '700'
                }}>
                  {filteredSessions.filter(s => s.is_live).length} Live Now
                </span>
              </div>
              {trayExpanded ? 
                <IoChevronDown size={24} color={colors.textSecondary} /> :
                <IoChevronUp size={24} color={colors.textSecondary} />
              }
            </button>

            {/* Tray Content */}
            {trayExpanded && (
              <div style={{
                padding: '0 16px 24px',
                maxHeight: 'calc(60vh - 70px)',
                overflowY: 'auto'
              }}>
                {loading ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: colors.textSecondary
                  }}>
                    Loading live businesses...
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: colors.textSecondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚚</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: colors.text }}>
                      No businesses live right now
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      Check back soon for food trucks and mobile services
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredSessions.map((session) => (
                      <div
                        key={session.session_id || session.tavvy_place_id}
                        onClick={() => router.push(`/app/place/${session.tavvy_place_id}`, undefined, { locale })}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '14px',
                          backgroundColor: colors.glassy,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {/* Image */}
                        <img
                          src={session.cover_image_url || 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400'}
                          alt={session.place_name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '10px',
                            objectFit: 'cover'
                          }}
                        />
                        
                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: colors.text,
                              margin: 0
                            }}>
                              {session.place_name}
                            </h3>
                            {session.is_live && (
                              <span style={{
                                padding: '3px 8px',
                                backgroundColor: COLORS.live,
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: '700',
                                borderRadius: '6px',
                                textTransform: 'uppercase'
                              }}>
                                LIVE
                              </span>
                            )}
                          </div>
                          
                          <div style={{
                            fontSize: '13px',
                            color: colors.textSecondary,
                            marginBottom: '6px'
                          }}>
                            {session.category || 'Mobile Business'}
                          </div>

                          {session.session_address && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: colors.textSecondary,
                              marginBottom: '4px'
                            }}>
                              <IoLocationOutline size={14} />
                              {session.session_address}
                            </div>
                          )}

                          {session.today_note && (
                            <div style={{
                              fontSize: '12px',
                              color: COLORS.accentGreen,
                              fontStyle: 'italic',
                              marginTop: '4px'
                            }}>
                              {session.today_note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CSS for pulse animation */}
          <style jsx>{`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
        </div>
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
