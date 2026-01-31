/**
 * OnTheGo Screen - Web Version
 * Pixel-perfect port from iOS OnTheGoScreen.tsx
 * 
 * Features:
 * - Full-screen map showing live mobile businesses
 * - Floating translucent UI elements
 * - Filter pills for categories
 * - Pulsing live markers
 * - Collapsible "Live Now" tray
 * - Dark mode design with glassy effects
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  IoLocationOutline, IoTimeOutline, IoCallOutline, IoChevronDown,
  IoChevronUp, IoFastFoodOutline, IoCafeOutline, IoGridOutline,
  IoRadioOutline
} from 'react-icons/io5';

// Design System Colors matching iOS
const COLORS = {
  background: '#000000',
  backgroundLight: '#FAFAFA',
  surface: '#1A1A1A',
  surfaceLight: '#FFFFFF',
  glassy: 'rgba(26, 26, 26, 0.85)',
  glassyLight: 'rgba(255, 255, 255, 0.9)',
  accent: '#22D3EE',
  accentGreen: '#10B981',
  accentGold: '#F59E0B',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  live: '#EF4444',
  success: '#10B981',
};

// Filter categories matching iOS
const FILTER_CATEGORIES = [
  { id: 'all', name: 'All', icon: IoGridOutline },
  { id: 'live', name: 'Live Now', icon: IoRadioOutline },
  { id: 'food-trucks', name: 'Food', icon: IoFastFoodOutline },
  { id: 'coffee', name: 'Coffee', icon: IoCafeOutline },
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
  const { isDark } = useThemeContext();
  
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
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
    if (selectedFilter === 'food-trucks') return session.category?.toLowerCase().includes('food');
    if (selectedFilter === 'coffee') return session.category?.toLowerCase().includes('coffee');
    return true;
  });

  const colors = {
    background: isDark ? COLORS.background : COLORS.backgroundLight,
    surface: isDark ? COLORS.surface : COLORS.surfaceLight,
    glassy: isDark ? COLORS.glassy : COLORS.glassyLight,
    text: isDark ? COLORS.textPrimary : '#111827',
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
          {/* Map Container */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1A1A1A'
          }}>
            {/* Placeholder for map - would integrate MapLibre GL JS here */}
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: colors.textSecondary
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Map Loading...
              </div>
              <div style={{ fontSize: '14px' }}>
                {userLocation ? 
                  `Centered at ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` :
                  'Getting your location...'
                }
              </div>
              <div style={{ fontSize: '12px', marginTop: '16px', opacity: 0.6 }}>
                {filteredSessions.length} mobile businesses nearby
              </div>
            </div>
          </div>

          {/* Floating Filter Pills */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px'
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
                    padding: '8px 16px',
                    backgroundColor: isActive ? COLORS.accent : colors.glassy,
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '20px',
                    color: isActive ? '#000' : colors.text,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={16} />
                  {filter.name}
                </button>
              );
            })}
          </div>

          {/* Live Count Badge */}
          <div style={{
            position: 'absolute',
            top: '120px',
            right: '16px',
            padding: '8px 12px',
            backgroundColor: colors.glassy,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {filteredSessions.filter(s => s.is_live).length} Live
            </span>
          </div>

          {/* Collapsible Live Now Tray */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.glassy,
            backdropFilter: 'blur(20px)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            maxHeight: trayExpanded ? '60vh' : '60px',
            transition: 'max-height 0.3s ease',
            overflow: 'hidden'
          }}>
            {/* Tray Header */}
            <button
              onClick={() => setTrayExpanded(!trayExpanded)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoRadioOutline size={20} color={COLORS.live} />
                <span style={{
                  color: colors.text,
                  fontSize: '16px',
                  fontWeight: '700'
                }}>
                  Live Now
                </span>
                <span style={{
                  color: colors.textSecondary,
                  fontSize: '14px'
                }}>
                  ({filteredSessions.filter(s => s.is_live).length})
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
                padding: '0 16px 16px',
                maxHeight: 'calc(60vh - 60px)',
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
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
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
                        onClick={() => router.push(`/app/place/${session.tavvy_place_id}`)}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: colors.surface,
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
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                        
                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: colors.text,
                              margin: 0
                            }}>
                              {session.place_name}
                            </h3>
                            {session.is_live && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: COLORS.live,
                                color: '#fff',
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
                            fontSize: '12px',
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
                              <IoLocationOutline size={12} />
                              {session.session_address}
                            </div>
                          )}

                          {session.today_note && (
                            <div style={{
                              fontSize: '11px',
                              color: COLORS.accentGreen,
                              fontStyle: 'italic'
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
