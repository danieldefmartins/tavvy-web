/**
 * Place Details Screen - Web Version
 * Pixel-perfect port from iOS PlaceDetailsScreen.tsx
 * 
 * Features:
 * - Photo carousel with user-uploaded photos
 * - Place info (name, category, price level, hours)
 * - Quick info pills (features, amenities)
 * - Action buttons (call, directions, website, share)
 * - Tabs: Overview, Reviews, Photos, Map
 * - Momentum thermometer (signals/reviews)
 * - Stories ring (if available)
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  IoCallOutline, IoNavigateOutline, IoGlobeOutline, IoShareOutline,
  IoTimeOutline, IoCashOutline, IoLocationOutline, IoChevronBack,
  IoHeartOutline, IoHeart, IoCheckmarkCircle
} from 'react-icons/io5';

// Design System Colors
const COLORS = {
  background: '#000000',
  backgroundLight: '#FAFAFA',
  surface: '#1A1A1A',
  surfaceLight: '#FFFFFF',
  accent: '#22D3EE',
  accentGreen: '#10B981',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price_level?: string;
  category?: string;
  cover_image_url?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  instagram_url?: string;
  facebook_url?: string;
  opening_hours?: any;
  is_24_7?: boolean;
  features?: string[];
  is_insured?: boolean;
  is_licensed?: boolean;
}

// Category emoji mapping
const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'restaurant': '🍽️',
    'coffee': '☕',
    'cafe': '☕',
    'hotel': '🏨',
    'hospital': '🏥',
    'airport': '✈️',
    'park': '🏞️',
    'mall': '🛍️',
    'gym': '💪',
    'bar': '🍺',
    'museum': '🏛️',
    'default': '📍',
  };
  
  const lowerCategory = (category || '').toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerCategory.includes(key)) return emoji;
  }
  return emojiMap.default;
};

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useThemeContext();
  
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState<Place | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlace();
    }
  }, [id]);

  const loadPlace = async () => {
    setLoading(true);
    try {
      const rawId = id as string;
      
      // Determine source and extract real ID from prefixed format
      let source: 'places' | 'fsq_raw' | 'typesense' = 'places';
      let realId = rawId;
      
      if (rawId.startsWith('places-')) {
        source = 'places';
        realId = rawId.replace('places-', '');
      } else if (rawId.startsWith('fsq-')) {
        source = 'fsq_raw';
        realId = rawId.replace('fsq-', '');
      } else if (rawId.startsWith('tavvy:')) {
        source = 'places';
        realId = rawId.replace('tavvy:', '');
      }
      
      console.log(`[PlaceDetail] Loading place: source=${source}, realId=${realId}, rawId=${rawId}`);
      
      if (source === 'places') {
        // Query canonical places table
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('id', realId)
          .single();

        if (data) {
          setPlace(data);
        } else if (error) {
          console.warn('[PlaceDetail] Not found in places table, trying fsq_places_raw...');
          // Fallback: try fsq_places_raw with the ID
          const { data: fsqData } = await supabase
            .from('fsq_places_raw')
            .select('fsq_id, name, latitude, longitude, address, city, region, country, postcode, category_name, subcategory_name, phone, website, cover_image_url, photos')
            .eq('fsq_id', realId)
            .single();
          if (fsqData) {
            setPlace({
              id: fsqData.fsq_id,
              name: fsqData.name,
              latitude: fsqData.latitude,
              longitude: fsqData.longitude,
              address_line_1: fsqData.address,
              city: fsqData.city,
              state: fsqData.region,
              category: fsqData.category_name,
              phone: fsqData.phone,
              website: fsqData.website,
              cover_image_url: fsqData.cover_image_url,
            });
          }
        }
      } else if (source === 'fsq_raw') {
        // Query FSQ raw table
        const { data, error } = await supabase
          .from('fsq_places_raw')
          .select('fsq_id, name, latitude, longitude, address, city, region, country, postcode, category_name, subcategory_name, phone, website, cover_image_url, photos')
          .eq('fsq_id', realId)
          .single();

        if (data) {
          setPlace({
            id: data.fsq_id,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            address_line_1: data.address,
            city: data.city,
            state: data.region,
            category: data.category_name,
            phone: data.phone,
            website: data.website,
            cover_image_url: data.cover_image_url,
          });
        }
      }
    } catch (error) {
      console.error('Error loading place:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (place?.phone) {
      window.location.href = `tel:${place.phone}`;
    }
  };

  const handleDirections = () => {
    if (place) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleWebsite = () => {
    if (place?.website) {
      window.open(place.website, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share && place) {
      try {
        await navigator.share({
          title: place.name,
          text: `Check out ${place.name} on TavvY`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const colors = {
    background: isDark ? COLORS.background : COLORS.backgroundLight,
    surface: isDark ? COLORS.surface : COLORS.surfaceLight,
    text: isDark ? COLORS.textPrimary : '#111827',
    textSecondary: COLORS.textSecondary,
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: colors.background
        }}>
          <div style={{ color: colors.text }}>Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!place) {
    return (
      <AppLayout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: colors.background,
          color: colors.text
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Place not found</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{place.name} | TavvY</title>
        <meta name="description" content={`${place.name} - ${place.category || 'Place'}`} />
      </Head>

      <AppLayout>
        <div style={{
          backgroundColor: colors.background,
          minHeight: '100vh'
        }}>
          {/* Header with back button */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#E5E7EB'}`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <IoChevronBack size={24} color={colors.text} />
            </button>
            <h1 style={{
              flex: 1,
              fontSize: '18px',
              fontWeight: '700',
              color: colors.text,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {place.name}
            </h1>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              {isFavorite ? 
                <IoHeart size={24} color="#EF4444" /> :
                <IoHeartOutline size={24} color={colors.text} />
              }
            </button>
          </div>

          {/* Hero Image */}
          <div style={{
            width: '100%',
            height: '300px',
            position: 'relative',
            backgroundColor: '#1A1A1A'
          }}>
            <img
              src={place.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
              alt={place.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Category badge */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>
                {getCategoryEmoji(place.category || '')}
              </span>
              <span style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {place.category || 'Place'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px' }}>
            {/* Place name and info */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: colors.text,
                margin: '0 0 8px 0'
              }}>
                {place.name}
              </h2>
              
              {/* Address */}
              {place.address_line_1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: colors.textSecondary,
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  <IoLocationOutline size={16} />
                  <span>
                    {place.address_line_1}, {place.city}, {place.state} {place.zip_code}
                  </span>
                </div>
              )}

              {/* Price level and hours */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginTop: '12px'
              }}>
                {place.price_level && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: colors.surface,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: colors.text
                  }}>
                    <IoCashOutline size={14} />
                    {place.price_level}
                  </div>
                )}
                {place.is_24_7 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: colors.surface,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: COLORS.accentGreen
                  }}>
                    <IoTimeOutline size={14} />
                    Open 24/7
                  </div>
                )}
                {place.is_insured && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: colors.surface,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: COLORS.accentGreen
                  }}>
                    <IoCheckmarkCircle size={14} />
                    Insured
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {place.phone && (
                <button
                  onClick={handleCall}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 8px',
                    backgroundColor: colors.surface,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <IoCallOutline size={24} color={COLORS.accent} />
                  <span style={{
                    fontSize: '12px',
                    color: colors.text,
                    fontWeight: '600'
                  }}>
                    Call
                  </span>
                </button>
              )}
              
              <button
                onClick={handleDirections}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  backgroundColor: colors.surface,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                <IoNavigateOutline size={24} color={COLORS.accent} />
                <span style={{
                  fontSize: '12px',
                  color: colors.text,
                  fontWeight: '600'
                }}>
                  Directions
                </span>
              </button>

              {place.website && (
                <button
                  onClick={handleWebsite}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 8px',
                    backgroundColor: colors.surface,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <IoGlobeOutline size={24} color={COLORS.accent} />
                  <span style={{
                    fontSize: '12px',
                    color: colors.text,
                    fontWeight: '600'
                  }}>
                    Website
                  </span>
                </button>
              )}

              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  backgroundColor: colors.surface,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                <IoShareOutline size={24} color={COLORS.accent} />
                <span style={{
                  fontSize: '12px',
                  color: colors.text,
                  fontWeight: '600'
                }}>
                  Share
                </span>
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '16px',
              borderBottom: `1px solid ${isDark ? '#2A2A2A' : '#E5E7EB'}`,
              marginBottom: '24px'
            }}>
              {['overview', 'reviews', 'photos', 'map'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                    color: activeTab === tab ? COLORS.accent : colors.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ marginBottom: '40px' }}>
              {activeTab === 'overview' && (
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.text,
                    marginBottom: '12px'
                  }}>
                    About
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: colors.textSecondary,
                    lineHeight: '1.6'
                  }}>
                    {place.name} is a {place.category?.toLowerCase() || 'place'} located in {place.city}, {place.state}.
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: colors.textSecondary
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    No reviews yet
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    Be the first to review this place
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: colors.textSecondary
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    No photos yet
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    Add photos to help others
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <div style={{
                  width: '100%',
                  height: '300px',
                  backgroundColor: '#1A1A1A',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textSecondary
                }}>
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>🗺️</div>
                    <div style={{ fontSize: '14px' }}>
                      Map at {place.latitude && !isNaN(place.latitude) ? place.latitude.toFixed(4) : '0.0000'}, {place.longitude && !isNaN(place.longitude) ? place.longitude.toFixed(4) : '0.0000'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
