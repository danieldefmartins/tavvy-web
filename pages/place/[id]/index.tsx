/**
 * Place Details Screen — Redesigned for clarity & hierarchy
 *
 * Layout (single scrollable page, no tabs):
 * 1. Hero Image (40vh) — photo + name + cuisine
 * 2. Action Bar (sticky) — Menu (primary CTA), Call, Directions, Share
 * 3. Signal Summary — top signals as prominent pills (Tavvy's signature)
 * 4. Menu Preview Card — enticing preview with CTA
 * 5. Full Signal Breakdown — expandable grouped signals
 * 6. Photos Grid — 2x2 with "see more"
 * 7. Info Section — collapsed by default
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
// CSS in styles/place-details.css loaded via _app
import { fetchPlaceById } from '../../../lib/placeService';
import { supabase } from '../../../lib/supabaseClient';
import { Place } from '../../../types';
import { fetchPlaceSignals, SignalAggregate, SIGNAL_LABELS } from '../../../lib/signalService';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Category-based fallback images (from iOS codebase)
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800',
    'mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    'asian': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    'coffee': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'hospital': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'medical': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    'bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'museum': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800',
    'park': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
    'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'gas': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    'entertainment': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'arts': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800',
    'food': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'business': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    'office': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    'health': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'travel': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    'real estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
  };
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800';
};

// Category emoji mapping
const getCategoryEmoji = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const emojiMap: Record<string, string> = {
    'restaurant': '🍽️', 'italian': '🍝', 'mexican': '🌮', 'asian': '🍜',
    'coffee': '☕', 'cafe': '☕', 'hotel': '🏨', 'hospital': '🏥',
    'airport': '✈️', 'park': '🏞️', 'shopping': '🛍️', 'gym': '💪',
    'spa': '💆', 'bar': '🍺', 'museum': '🏛️', 'beach': '🏖️',
    'gas': '⛽', 'bakery': '🍞', 'entertainment': '🎭', 'arts': '🎨',
    'food': '🍽️', 'dining': '🍽️', 'business': '🏢', 'office': '🏢',
    'health': '🏥', 'travel': '✈️', 'real estate': '🏠', 'nursing': '🏥',
    'parking': '🅿️', 'tech': '💻', 'food truck': '🚚',
  };
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerCategory.includes(key)) return emoji;
  }
  return '📍';
};

// Drive time calculation
const getDriveTime = (distanceMiles?: number): string => {
  if (!distanceMiles) return '—';
  const minutes = Math.round((distanceMiles / 30) * 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

// Info section collapsed state

export default function PlaceDetailsScreen({ placeId: propPlaceId }: { placeId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = propPlaceId || (router.query.id as string);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullSignals, setShowFullSignals] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [placePhotosDB, setPlacePhotosDB] = useState<{id: string; url: string; caption?: string}[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Living Score signals (matches iOS)
  const [livingSignals, setLivingSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
    medals: string[];
  }>({ best_for: [], vibe: [], heads_up: [], medals: [] });
  const [signalsLoading, setSignalsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlace(id as string);
    }
  }, [id]);

  // Load Living Score signals when place is loaded
  useEffect(() => {
    if (place?.id) {
      loadLivingSignals(place.id);
    }
  }, [place?.id]);

  const loadLivingSignals = async (placeId: string) => {
    setSignalsLoading(true);
    try {
      const result = await fetchPlaceSignals(placeId);
      setLivingSignals(result);
    } catch (error) {
      console.error('Error loading living signals:', error);
    } finally {
      setSignalsLoading(false);
    }
  };

  const loadPlace = async (placeId: string) => {
    setLoading(true);
    try {
      const data = await fetchPlaceById(placeId);
      setPlace(data);
    } catch (error) {
      console.error('[PlaceDetailsScreen] Error loading place:', error);
      setPlace(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!place) return;
    const shareUrl = place.slug
      ? `https://tavvy.com/${place.slug}`
      : window.location.href;
    const shareText = `${place.name} on Tavvy — see what people are really saying`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Link copied to clipboard!');
      }
    }
  };

  const handleCall = () => {
    if (place?.phone) {
      window.location.href = `tel:${place.phone}`;
    }
  };

  const handleDirections = () => {
    if (place) {
      const lat = place.latitude || place.lat;
      const lng = place.longitude || place.lng;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const handleWebsite = () => {
    if (place?.website) {
      const url = place.website.startsWith('http') ? place.website : `https://${place.website}`;
      window.open(url, '_blank');
    }
  };

  // Load photos from DB when place loads
  useEffect(() => {
    if (place?.id) {
      loadPhotosFromDB(place.id);
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
    return null;
  };

  const loadPhotosFromDB = async (placeId: string) => {
    try {
      const resolvedId = await resolvePlaceUUID(placeId);
      if (!resolvedId) return;
      const { data } = await supabase
        .from('place_photos')
        .select('id, url, caption')
        .eq('place_id', resolvedId)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setPlacePhotosDB(data);
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !place) return;
    const { data: { user } } = await supabase.auth.getUser();
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
      await supabase.from('place_photos').insert({
        place_id: resolvedId, uploaded_by: user.id, user_id: user.id,
        url: urlData.publicUrl, caption: null, is_owner_photo: false, status: 'live',
      });
      await loadPhotosFromDB(place.id);
    } catch (err: any) {
      alert('Error uploading photo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        
        <div className="pd-loading">
          <div className="pd-spinner" />
          <p>Loading place...</p>
        </div>
      </>
    );
  }

  // Error state
  if (!place) {
    return (
      <>
        
        <div className="pd-error">
          <span className="pd-error-icon">😕</span>
          <h1>Place not found</h1>
          <p>This place may have been removed or doesn&apos;t exist.</p>
          <button onClick={() => router.push('/app')}>Go Home</button>
        </div>
      </>
    );
  }

  const coverImage = place.cover_image_url || getCategoryFallbackImage(place.category || '');
  const photos = place.photos || [];
  const allPhotos = [...placePhotosDB.map(p => p.url), ...photos];
  const hasLivingSignals = livingSignals.best_for.length > 0 || livingSignals.vibe.length > 0 || livingSignals.heads_up.length > 0;
  const fullAddress = [place.address_line1, place.city, place.state_region].filter(Boolean).join(', ');
  const isOpen = place.current_status === 'open_accessible' || place.current_status === 'active';
  const distanceMiles = place.distance ? (place.distance / 1609.34).toFixed(1) : undefined;
  const driveTime = getDriveTime(distanceMiles ? parseFloat(distanceMiles) : undefined);
  const categoryEmoji = getCategoryEmoji(place.category || '');

  // Build signal arrays for display
  const allSignals = [
    ...livingSignals.best_for.map(s => ({
      label: s.label || s.signal_id,
      tapCount: s.review_count,
      category: 'good' as string,
      emoji: s.icon,
      signalId: s.signal_id,
    })),
    ...livingSignals.vibe.map(s => ({
      label: s.label || s.signal_id,
      tapCount: s.review_count,
      category: 'vibe' as string,
      emoji: s.icon,
      signalId: s.signal_id,
    })),
    ...livingSignals.heads_up.map(s => ({
      label: s.label || s.signal_id,
      tapCount: s.review_count,
      category: 'headsup' as string,
      emoji: s.icon,
      signalId: s.signal_id,
    })),
  ];
  const maxTapCount = allSignals.reduce((max, s) => Math.max(max, s.tapCount), 0);

  // Top signals for summary section
  const topGood = livingSignals.best_for.slice(0, 5);
  const topVibe = livingSignals.vibe.slice(0, 3);
  const topHeadsUp = livingSignals.heads_up.slice(0, 2);

  const signalBreakdownRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Head>
        <title>{place.name || 'Place'} | Tavvy</title>
        <meta name="description" content={`Discover ${place.name || 'this place'}${place.category ? ` (${place.category})` : ''} on Tavvy. See real signals from real people — what's great, the vibe, and what to watch out for.`} key="description" />
        <meta property="og:title" content={`${place.name || 'Place'} | Tavvy`} key="og:title" />
        <meta property="og:description" content={`See real signals for ${place.name || 'this place'}${place.category ? ` (${place.category})` : ''} — not just stars. Real experiences from real people.`} key="og:description" />
        <meta property="og:image" content={place.cover_image_url || 'https://tavvy.com/og-image.png'} key="og:image" />
        <meta property="og:url" content={`https://tavvy.com/place/${id}`} key="og:url" />
        <link rel="canonical" href={`https://tavvy.com/place/${id}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": place.name,
              "description": place.description || `Discover ${place.name} on Tavvy — real signals from real people.`,
              "url": `https://tavvy.com/place/${id}`,
              ...(fullAddress ? { "address": {
                "@type": "PostalAddress",
                ...(place.address_line1 ? { "streetAddress": place.address_line1 } : {}),
                ...(place.city ? { "addressLocality": place.city } : {}),
                ...(place.state_region ? { "addressRegion": place.state_region } : {}),
              }} : {}),
              ...((place.latitude || place.lat) && (place.longitude || place.lng) ? { "geo": {
                "@type": "GeoCoordinates",
                "latitude": place.latitude || place.lat,
                "longitude": place.longitude || place.lng,
              }} : {}),
              ...(place.cover_image_url || (place.photos && place.photos.length > 0) ? { "image": place.cover_image_url || place.photos![0] } : {}),
              ...(place.phone ? { "telephone": place.phone } : {}),
              ...(place.website ? { "url": place.website.startsWith('http') ? place.website : `https://${place.website}` } : {}),
              ...(place.category ? { "additionalType": place.category } : {}),
              ...((livingSignals.best_for.length + livingSignals.vibe.length + livingSignals.heads_up.length) > 0 ? {
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingCount": livingSignals.best_for.reduce((sum, s) => sum + s.review_count, 0)
                    + livingSignals.vibe.reduce((sum, s) => sum + s.review_count, 0)
                    + livingSignals.heads_up.reduce((sum, s) => sum + s.review_count, 0),
                },
              } : {}),
            }),
          }}
        />
      </Head>

      

      <div className="pd-container">
        {/* ===== 1. HERO IMAGE (40vh) ===== */}
        <div className="pd-hero">
          <img src={coverImage} alt={place.name} className="pd-hero-img" />
          <div className="pd-hero-gradient" />

          <button className="pd-hero-btn pd-hero-back" onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div className="pd-hero-actions">
            <button className="pd-hero-btn" onClick={handleShare} aria-label="Share">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            <button className="pd-hero-btn" onClick={() => setIsFavorite(!isFavorite)} aria-label="Save">
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="pd-hero-text">
            <h1 className="pd-hero-name">{place.name}</h1>
            <p className="pd-hero-category">
              {categoryEmoji} {place.tavvy_subcategory ? `${place.tavvy_subcategory.charAt(0).toUpperCase() + place.tavvy_subcategory.slice(1).replace(/_/g, ' ')}` : place.category}
            </p>
          </div>
        </div>

        {/* ===== 2. ACTION BAR (sticky) ===== */}
        <div className="pd-action-bar">
          <button
            className="pd-action-btn pd-action-primary"
            onClick={() => router.push(`/place/${place.id}/menu-gallery`)}
          >
            <span className="pd-action-icon">📖</span>
            <span className="pd-action-label">Menu</span>
          </button>
          <button className="pd-action-btn" onClick={handleCall}>
            <span className="pd-action-icon">📞</span>
          </button>
          <button className="pd-action-btn" onClick={handleDirections}>
            <span className="pd-action-icon">📍</span>
          </button>
          <button className="pd-action-btn" onClick={handleShare}>
            <span className="pd-action-icon">↗️</span>
          </button>
        </div>

        {/* ===== 3. SIGNAL SUMMARY (THE STAR SECTION) ===== */}
        <div className="pd-signals-summary">
          {/* Medals */}
          {livingSignals.medals.length > 0 && (
            <div className="pd-medals">
              {livingSignals.medals.includes('vibe_check') && (
                <span className="pd-medal">🏆 Vibe Check</span>
              )}
              {livingSignals.medals.includes('hidden_gem') && (
                <span className="pd-medal">💎 Hidden Gem</span>
              )}
              {livingSignals.medals.includes('speed_demon') && (
                <span className="pd-medal">⚡ Speed Demon</span>
              )}
            </div>
          )}

          {signalsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="pd-spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
            </div>
          ) : hasLivingSignals ? (
            <>
              {/* The Good — teal pills */}
              {topGood.length > 0 && (
                <div className="pd-signal-group">
                  <div className="pd-signal-pills">
                    {topGood.map((s) => (
                      <span key={s.signal_id} className="pd-pill pd-pill-good">
                        {s.icon} {s.label || s.signal_id}
                        <span className="pd-pill-count">{s.review_count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* The Vibe — purple pills */}
              {topVibe.length > 0 && (
                <div className="pd-signal-group">
                  <div className="pd-signal-pills">
                    {topVibe.map((s) => (
                      <span key={s.signal_id} className="pd-pill pd-pill-vibe">
                        {s.icon} {s.label || s.signal_id}
                        <span className="pd-pill-count">{s.review_count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Heads Up — amber pills */}
              {topHeadsUp.length > 0 && (
                <div className="pd-signal-group">
                  <div className="pd-signal-pills">
                    {topHeadsUp.map((s) => (
                      <span key={s.signal_id} className="pd-pill pd-pill-headsup">
                        {s.icon} {s.label || s.signal_id}
                        <span className="pd-pill-count">{s.review_count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="pd-see-all-link"
                onClick={() => {
                  setShowFullSignals(true);
                  setTimeout(() => signalBreakdownRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              >
                See all signals →
              </button>
            </>
          ) : (
            <div className="pd-no-signals">
              <p>No signals yet — be the first to share!</p>
              <button
                className="pd-add-signal-btn"
                onClick={() => router.push({
                  pathname: '/app/add-review',
                  query: {
                    placeId: place.id,
                    placeName: place.name,
                    primaryCategory: place.tavvy_category || place.category || '',
                    subcategory: place.tavvy_subcategory || '',
                  },
                })}
              >
                ✏️ Add Your Signal
              </button>
            </div>
          )}
        </div>

        {/* ===== 4. MENU PREVIEW CARD ===== */}
        <div className="pd-section">
          <div className="pd-menu-card">
            <div className="pd-menu-header">
              <h2>Menu</h2>
              {allPhotos.length > 0 && <span className="pd-menu-count">{allPhotos.length} items</span>}
            </div>
            {allPhotos.length > 0 && (
              <div className="pd-menu-thumbnails">
                {allPhotos.slice(0, 4).map((photo, idx) => (
                  <div key={idx} className="pd-menu-thumb">
                    <img src={photo} alt={`Dish ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
            <button
              className="pd-menu-cta"
              onClick={() => router.push(`/place/${place.id}/menu-gallery`)}
            >
              View Full Menu →
            </button>
          </div>
        </div>

        {/* ===== 5. FULL SIGNAL BREAKDOWN (expandable) ===== */}
        <div className="pd-section" ref={signalBreakdownRef}>
          {showFullSignals && (
            <div className="pd-card pd-breakdown">
              {/* The Good */}
              <div className="pd-breakdown-group">
                <div className="pd-breakdown-header">
                  <span className="pd-dot pd-dot-good" />
                  <span className="pd-breakdown-title">The Good</span>
                </div>
                {livingSignals.best_for.length > 0 ? (
                  livingSignals.best_for.map((signal) => (
                    <div key={signal.signal_id} className="pd-breakdown-row"><span>{signal.icon}</span><span className="pd-breakdown-label">{signal.label || signal.signal_id}</span><span className="pd-breakdown-count">×{signal.review_count}</span></div>
                  ))
                ) : (
                  <p className="pd-empty-signal">Be the first to tap!</p>
                )}
              </div>

              <div className="pd-breakdown-divider" />

              {/* The Vibe */}
              <div className="pd-breakdown-group">
                <div className="pd-breakdown-header">
                  <span className="pd-dot pd-dot-vibe" />
                  <span className="pd-breakdown-title">The Vibe</span>
                </div>
                {livingSignals.vibe.length > 0 ? (
                  livingSignals.vibe.map((signal) => (
                    <div key={signal.signal_id} className="pd-breakdown-row"><span>{signal.icon}</span><span className="pd-breakdown-label">{signal.label || signal.signal_id}</span><span className="pd-breakdown-count">×{signal.review_count}</span></div>
                  ))
                ) : (
                  <p className="pd-empty-signal">Be the first to tap!</p>
                )}
              </div>

              <div className="pd-breakdown-divider" />

              {/* Heads Up */}
              <div className="pd-breakdown-group">
                <div className="pd-breakdown-header">
                  <span className="pd-dot pd-dot-headsup" />
                  <span className="pd-breakdown-title">Heads Up</span>
                </div>
                {livingSignals.heads_up.length > 0 ? (
                  livingSignals.heads_up.map((signal) => (
                    <div key={signal.signal_id} className="pd-breakdown-row"><span>{signal.icon}</span><span className="pd-breakdown-label">{signal.label || signal.signal_id}</span><span className="pd-breakdown-count">×{signal.review_count}</span></div>
                  ))
                ) : (
                  <p className="pd-empty-signal">Be the first to tap!</p>
                )}
              </div>

              {/* Add Signal CTA */}
              <div className="pd-breakdown-cta">
                <button
                  className="pd-add-signal-btn"
                  onClick={() => router.push({
                    pathname: '/app/add-review',
                    query: {
                      placeId: place.id,
                      placeName: place.name,
                      primaryCategory: place.tavvy_category || place.category || '',
                      subcategory: place.tavvy_subcategory || '',
                    },
                  })}
                >
                  ✏️ Add Your Signal
                </button>
              </div>
            </div>
          )}

          {!showFullSignals && hasLivingSignals && (
            <button
              className="pd-expand-btn"
              onClick={() => setShowFullSignals(true)}
            >
              Show Full Signal Breakdown
            </button>
          )}
        </div>

        {/* ===== 6. PHOTOS GRID ===== */}
        <div className="pd-section">
          <div className="pd-card">
            <h2 className="pd-card-title">Photos</h2>
            {allPhotos.length > 0 ? (
              <>
                <div className="pd-photo-grid">
                  {allPhotos.slice(0, 4).map((photo, idx) => (
                    <div key={idx} className="pd-photo-item">
                      <img src={photo} alt={`${place.name} photo ${idx + 1}`} />
                      {idx === 3 && allPhotos.length > 4 && (
                        <div className="pd-photo-more">+{allPhotos.length - 4}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="pd-no-photos">No photos yet</p>
            )}
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            <button
              className="pd-add-photo-btn"
              onClick={() => { if (photoInputRef.current) photoInputRef.current.click(); }}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? '⏳ Uploading...' : '📷 Add a Photo'}
            </button>
          </div>
        </div>

        {/* ===== 7. INFO SECTION (collapsed by default) ===== */}
        <div className="pd-section">
          <div className="pd-card">
            <button className="pd-info-toggle" onClick={() => setShowInfo(!showInfo)}>
              <h2 className="pd-card-title" style={{ margin: 0 }}>Info &amp; Contact</h2>
              <span className={`pd-chevron ${showInfo ? 'pd-chevron-open' : ''}`}>▾</span>
            </button>

            {showInfo && (
              <div className="pd-info-content">
                {fullAddress && (
                  <div className="pd-contact-item">
                    <span className="pd-contact-icon">📍</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pd-contact-link"
                    >
                      {fullAddress}
                    </a>
                  </div>
                )}

                {place.phone && (
                  <div className="pd-contact-item">
                    <span className="pd-contact-icon">📞</span>
                    <a href={`tel:${place.phone}`} className="pd-contact-link">{place.phone}</a>
                  </div>
                )}

                {place.website && (
                  <div className="pd-contact-item">
                    <span className="pd-contact-icon">🌐</span>
                    <a
                      href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pd-contact-link"
                    >
                      {place.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {place.instagram_url && (
                  <div className="pd-contact-item">
                    <span className="pd-contact-icon">📸</span>
                    <a href={place.instagram_url} target="_blank" rel="noopener noreferrer" className="pd-contact-link">
                      Instagram
                    </a>
                  </div>
                )}

                <button className="pd-directions-btn" onClick={handleDirections}>
                  🚗 Get Directions{driveTime !== '—' ? ` (${driveTime})` : ''}
                </button>

                <div className="pd-claim-divider" />
                <button className="pd-claim-btn">🏢 Claim This Business</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ===== ALL STYLES =====


export const getServerSideProps = async ({ params, locale }: { params: { id: string }; locale: string }) => {
  try {
    const translations = await serverSideTranslations(locale ?? 'en', ['common']);
    return {
      props: {
        placeId: params?.id || '',
        ...translations,
      },
    };
  } catch (error) {
    return {
      props: {
        placeId: params?.id || '',
      },
    };
  }
};
