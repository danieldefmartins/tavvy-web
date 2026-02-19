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

import React, { useState, useEffect, useRef } from 'react';
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
import { useTranslation } from 'next-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useThemeContext();
  
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState<Place | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showJustAddedBanner, setShowJustAddedBanner] = useState(false);
  const [placePhotos, setPlacePhotos] = useState<{id: string; url: string; caption?: string; uploaded_by?: string; created_at: string}[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadPlace();
    }
  }, [id]);

  // Show congratulations banner when place was just added
  useEffect(() => {
    if (router.query.justAdded === 'true') {
      setJustAdded(true);
      setShowJustAddedBanner(true);
      // Remove the query param from URL without reload
      const { justAdded: _, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    }
  }, [router.query.justAdded]);

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

  // Load photos when place is loaded
  useEffect(() => {
    if (place?.id) {
      loadPlacePhotos(place.id);
    }
  }, [place?.id]);

  const resolvePlaceUUID = async (placeId: string): Promise<string | null> => {
    if (!placeId) return null;
    const cleanId = placeId.startsWith('fsq:') ? placeId.slice(4) : placeId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUUID) {
      const { data } = await supabase.from('places').select('id').eq('id', cleanId).maybeSingle();
      if (data) return data.id;
    }
    const { data: bySource } = await supabase.from('places').select('id').eq('source_id', cleanId).maybeSingle();
    if (bySource) return bySource.id;
    const { data: byGoogle } = await supabase.from('places').select('id').eq('google_place_id', cleanId).maybeSingle();
    if (byGoogle) return byGoogle.id;
    const { data: fsqPlace } = await supabase.from('fsq_places_raw').select('*').eq('fsq_place_id', cleanId).maybeSingle();
    if (fsqPlace) {
      const { data: newPlace } = await supabase.from('places').insert({
        name: fsqPlace.name, source_type: 'fsq', source_id: fsqPlace.fsq_place_id,
        latitude: fsqPlace.latitude, longitude: fsqPlace.longitude,
        city: fsqPlace.locality, region: fsqPlace.region, country: fsqPlace.country,
        postcode: fsqPlace.postcode, phone: fsqPlace.tel, website: fsqPlace.website,
        email: fsqPlace.email, status: 'active',
      }).select('id').single();
      if (newPlace) return newPlace.id;
    }
    return null;
  };

  const loadPlacePhotos = async (placeId: string) => {
    try {
      const resolvedId = await resolvePlaceUUID(placeId);
      if (!resolvedId) return;
      const { data } = await supabase
        .from('place_photos')
        .select('id, url, caption, uploaded_by, created_at')
        .eq('place_id', resolvedId)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setPlacePhotos(data);
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !place) return;
    if (!user?.id) {
      alert('Please sign in to add photos.');
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const resolvedId = await resolvePlaceUUID(place.id);
      if (!resolvedId) {
        alert('Could not resolve place. Please try again.');
        setIsUploadingPhoto(false);
        return;
      }
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${resolvedId}/${user.id}_${timestamp}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        alert('Upload failed: ' + uploadError.message);
        setIsUploadingPhoto(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('place-photos').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('place_photos').insert({
        place_id: resolvedId, uploaded_by: user.id, user_id: user.id,
        url: urlData.publicUrl, caption: null, is_owner_photo: false, status: 'live',
      });
      if (insertError) console.error('DB insert error:', insertError);
      // Reload photos
      await loadPlacePhotos(place.id);
      setActiveTab('photos');
    } catch (err: any) {
      alert('Error uploading photo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
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

            {/* Just Added Banner */}
            {showJustAddedBanner && (
              <div style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                position: 'relative',
              }}>
                <button
                  onClick={() => setShowJustAddedBanner(false)}
                  style={{
                    position: 'absolute', top: 8, right: 12,
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                    fontSize: 20, cursor: 'pointer', padding: 4,
                  }}
                >
                  ✕
                </button>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
                  Place added successfully!
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                  Help others discover this place by adding a review or photos.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setActiveTab('reviews'); setShowJustAddedBanner(false); }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF', fontSize: '14px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                    }}
                  >
                    ⭐ Write a Review
                  </button>
                  <button
                    onClick={() => { if (photoInputRef.current) photoInputRef.current.click(); }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      backgroundColor: '#FFFFFF', border: 'none',
                      color: '#059669', fontSize: '14px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                    }}
                  >
                    📸 Add Photos
                  </button>
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>
            )}

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
                <div>
                  {placePhotos.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px',
                      marginBottom: '16px',
                    }}>
                      {placePhotos.map((photo) => (
                        <div key={photo.id} style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                        }}>
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Place photo'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: colors.textSecondary,
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        No photos yet
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        Be the first to add a photo!
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { if (photoInputRef.current) photoInputRef.current.click(); }}
                    disabled={isUploadingPhoto}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: COLORS.accentGreen,
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isUploadingPhoto ? 'wait' : 'pointer',
                      opacity: isUploadingPhoto ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px',
                    }}
                  >
                    {isUploadingPhoto ? '⏳ Uploading...' : '📷 Add a Photo'}
                  </button>
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


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
