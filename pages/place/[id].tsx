/**
 * Place Details Screen
 * Redesigned to match tavvy-mobile/screens/PlaceDetailsScreen.tsx
 * 
 * Layout:
 * 1. Hero section with cover photo + gradient overlay + text
 * 2. Quick info bar (Open / Call / Photos / Drive)
 * 3. Tab navigation (Reviews / Info / Photos)
 * 4. Tab content with white cards on light gray background
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fetchPlaceById } from '../../lib/placeService';
import { Place } from '../../types';
import { fetchPlaceSignals, SignalAggregate, SIGNAL_LABELS } from '../../lib/signalService';

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

type TabType = 'reviews' | 'info' | 'photos';

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const { id } = router.query;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  
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
    if (navigator.share && place) {
      try {
        await navigator.share({
          title: place.name,
          text: `Check out ${place.name} on TavvY`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
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

  // Loading state
  if (loading) {
    return (
      <>
        <style jsx global>{pageStyles}</style>
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
        <style jsx global>{pageStyles}</style>
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
  const hasLivingSignals = livingSignals.best_for.length > 0 || livingSignals.vibe.length > 0 || livingSignals.heads_up.length > 0;
  const fullAddress = [place.address_line1, place.city, place.state_region].filter(Boolean).join(', ');
  const isOpen = place.current_status === 'open_accessible' || place.current_status === 'active';
  const distanceMiles = place.distance ? (place.distance / 1609.34).toFixed(1) : undefined;
  const driveTime = getDriveTime(distanceMiles ? parseFloat(distanceMiles) : undefined);
  const categoryEmoji = getCategoryEmoji(place.category || '');

  return (
    <>
      <Head>
        <title>{place.name} | TavvY</title>
        <meta name="description" content={`${place.name} - ${place.category} in ${place.city || ''}`} />
      </Head>

      <style jsx global>{pageStyles}</style>

      <div className="pd-container">
        {/* ===== HERO SECTION ===== */}
        <div className="pd-hero">
          <img
            src={coverImage}
            alt={place.name}
            className="pd-hero-img"
          />
          <div className="pd-hero-gradient" />

          {/* Back button */}
          <button className="pd-hero-btn pd-hero-back" onClick={() => router.back()}>
            ←
          </button>

          {/* Top right buttons */}
          <div className="pd-hero-actions">
            <button
              className="pd-hero-btn"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button className="pd-hero-btn" onClick={handleShare}>
              📤
            </button>
          </div>

          {/* Hero text overlay */}
          <div className="pd-hero-text">
            <h1 className="pd-hero-name">{place.name}</h1>
            <div className="pd-hero-meta">
              <span>{categoryEmoji} {place.category}</span>
              {distanceMiles && <span>📍 {distanceMiles} mi</span>}
            </div>
          </div>
        </div>

        {/* ===== QUICK INFO BAR ===== */}
        <div className="pd-quick-bar">
          <div className="pd-quick-item" onClick={() => {}}>
            <span className="pd-quick-icon">🕐</span>
            <span className={`pd-quick-label ${isOpen ? 'pd-open' : ''}`}>
              {isOpen ? 'Open' : 'Status'}
            </span>
          </div>
          <div className="pd-quick-divider" />
          <div className="pd-quick-item" onClick={handleCall}>
            <span className="pd-quick-icon">📞</span>
            <span className="pd-quick-value">Call</span>
            <span className="pd-quick-sub">Business</span>
          </div>
          <div className="pd-quick-divider" />
          <div className="pd-quick-item" onClick={() => setActiveTab('photos')}>
            <span className="pd-quick-icon">📷</span>
            <span className="pd-quick-value">{photos.length}</span>
            <span className="pd-quick-sub">Photos</span>
          </div>
          <div className="pd-quick-divider" />
          <div className="pd-quick-item" onClick={handleDirections}>
            <span className="pd-quick-icon">🚗</span>
            <span className="pd-quick-value">{driveTime}</span>
            <span className="pd-quick-sub">Drive</span>
          </div>
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="pd-tabs">
          {(['reviews', 'info', 'photos'] as TabType[]).map((tab) => {
            const labels: Record<TabType, string> = {
              reviews: 'Reviews',
              info: 'Info',
              photos: 'Photos',
            };
            return (
              <button
                key={tab}
                className={`pd-tab ${activeTab === tab ? 'pd-tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ===== TAB CONTENT ===== */}
        <div className="pd-content">
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="pd-tab-content">
              {/* Medals */}
              {livingSignals.medals.length > 0 && (
                <div className="pd-medals">
                  {livingSignals.medals.includes('vibe_check') && (
                    <span className="pd-medal">🏆 Vibe Check</span>
                  )}
                  {livingSignals.medals.includes('speed_demon') && (
                    <span className="pd-medal">⚡ Speed Demon</span>
                  )}
                  {livingSignals.medals.includes('hidden_gem') && (
                    <span className="pd-medal">💎 Hidden Gem</span>
                  )}
                </div>
              )}

              <div className="pd-card">
                <h2 className="pd-card-title">Community Signals</h2>

                {signalsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div className="pd-spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
                  </div>
                ) : hasLivingSignals ? (
                  <>
                    {/* The Good signals with Living Score */}
                    {livingSignals.best_for.map((signal) => (
                      <div key={signal.signal_id} className={`pd-signal-bar pd-signal-blue ${signal.is_ghost ? 'pd-signal-ghost' : ''}`}>
                        <span className="pd-signal-icon">{signal.icon || '👍'}</span>
                        <span className="pd-signal-text">
                          {signal.label} · {signal.review_count} {signal.review_count === 1 ? 'tap' : 'taps'}
                        </span>
                        <span className="pd-signal-score">Score: {signal.current_score}</span>
                      </div>
                    ))}
                    {livingSignals.best_for.length === 0 && (
                      <div className="pd-signal-bar pd-signal-blue">
                        <span className="pd-signal-icon">👍</span>
                        <span className="pd-signal-text pd-signal-italic">
                          The Good · Be the first to tap!
                        </span>
                      </div>
                    )}

                    {/* The Vibe signals with Living Score */}
                    {livingSignals.vibe.map((signal) => (
                      <div key={signal.signal_id} className={`pd-signal-bar pd-signal-purple ${signal.is_ghost ? 'pd-signal-ghost' : ''}`}>
                        <span className="pd-signal-icon">{signal.icon || '✨'}</span>
                        <span className="pd-signal-text">
                          {signal.label} · {signal.review_count} {signal.review_count === 1 ? 'tap' : 'taps'}
                        </span>
                        <span className="pd-signal-score">Score: {signal.current_score}</span>
                      </div>
                    ))}
                    {livingSignals.vibe.length === 0 && (
                      <div className="pd-signal-bar pd-signal-purple">
                        <span className="pd-signal-icon">✨</span>
                        <span className="pd-signal-text pd-signal-italic">
                          The Vibe · Be the first to tap!
                        </span>
                      </div>
                    )}

                    {/* Heads Up signals with Living Score */}
                    {livingSignals.heads_up.map((signal) => (
                      <div key={signal.signal_id} className={`pd-signal-bar pd-signal-orange ${signal.is_ghost ? 'pd-signal-ghost' : ''}`}>
                        <span className="pd-signal-icon">{signal.icon || '⚠️'}</span>
                        <span className="pd-signal-text">
                          {signal.label} · {signal.review_count} {signal.review_count === 1 ? 'tap' : 'taps'}
                        </span>
                        <span className="pd-signal-score">Score: {signal.current_score}</span>
                      </div>
                    ))}
                    {livingSignals.heads_up.length === 0 && (
                      <div className="pd-signal-bar pd-signal-orange">
                        <span className="pd-signal-icon">⚠️</span>
                        <span className="pd-signal-text pd-signal-italic">
                          Heads Up · Be the first to tap!
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Empty state - "Be the first to tap!" bars */}
                    <div className="pd-signal-bar pd-signal-blue">
                      <span className="pd-signal-icon">👍</span>
                      <span className="pd-signal-text pd-signal-italic">
                        The Good · Be the first to tap!
                      </span>
                    </div>
                    <div className="pd-signal-bar pd-signal-purple">
                      <span className="pd-signal-icon">✨</span>
                      <span className="pd-signal-text pd-signal-italic">
                        The Vibe · Be the first to tap!
                      </span>
                    </div>
                    <div className="pd-signal-bar pd-signal-orange">
                      <span className="pd-signal-icon">⚠️</span>
                      <span className="pd-signal-text pd-signal-italic">
                        Heads Up · Be the first to tap!
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Been here? card */}
              <div className="pd-card">
                <h2 className="pd-card-title">Been here?</h2>
                <p className="pd-card-subtitle">Share your experience with the community</p>
                <button 
                  className="pd-add-review-btn"
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

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="pd-tab-content">
              <div className="pd-card">
                <h2 className="pd-card-title">Location &amp; Contact</h2>

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
                    <a href={`tel:${place.phone}`} className="pd-contact-link">
                      {place.phone}
                    </a>
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
                    <a
                      href={place.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pd-contact-link"
                    >
                      Instagram
                    </a>
                  </div>
                )}

                <div className="pd-claim-divider" />
                <div className="pd-claim-section">
                  <button className="pd-claim-btn">
                    🏢 Claim This Business
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="pd-tab-content">
              <div className="pd-card">
                <h2 className="pd-card-title">Photos</h2>

                {photos.length > 0 ? (
                  <div className="pd-photo-grid">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="pd-photo-item">
                        <img src={photo} alt={`${place.name} photo ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pd-no-photos">No photos yet</p>
                )}

                <button className="pd-add-photo-btn">
                  📷 Add a Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ===== ALL STYLES =====
const pageStyles = `
  /* Reset & base */
  .pd-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }

  /* ===== LOADING ===== */
  .pd-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #999;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }
  .pd-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #333;
    border-top-color: #007AFF;
    border-radius: 50%;
    animation: pd-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes pd-spin {
    to { transform: rotate(360deg); }
  }

  /* ===== ERROR ===== */
  .pd-error {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #fff;
    text-align: center;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }
  .pd-error-icon { font-size: 64px; margin-bottom: 16px; }
  .pd-error h1 { margin: 0 0 8px; font-size: 24px; }
  .pd-error p { margin: 0 0 24px; color: #999; }
  .pd-error button {
    background: none;
    border: none;
    color: #007AFF;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  /* ===== HERO SECTION ===== */
  .pd-hero {
    position: relative;
    height: 320px;
    background: #000;
    overflow: hidden;
  }
  .pd-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pd-hero-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
    pointer-events: none;
  }
  .pd-hero-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 2;
  }
  .pd-hero-back {
    position: absolute;
    top: 16px;
    left: 16px;
  }
  .pd-hero-actions {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
    z-index: 2;
  }
  .pd-hero-text {
    position: absolute;
    bottom: 16px;
    left: 16px;
    right: 16px;
    z-index: 2;
  }
  .pd-hero-name {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 6px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    line-height: 1.2;
  }
  .pd-hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pd-hero-meta span {
    font-size: 14px;
    color: rgba(255,255,255,0.9);
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  /* ===== QUICK INFO BAR ===== */
  .pd-quick-bar {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 14px 0;
    border-bottom: 1px solid #e5e5e5;
  }
  .pd-quick-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    gap: 2px;
  }
  .pd-quick-icon {
    font-size: 18px;
    margin-bottom: 2px;
  }
  .pd-quick-label {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
  .pd-open {
    color: #10b981;
  }
  .pd-quick-value {
    font-size: 15px;
    font-weight: 700;
    color: #333;
  }
  .pd-quick-sub {
    font-size: 11px;
    color: #666;
  }
  .pd-quick-divider {
    width: 1px;
    height: 36px;
    background: #e5e5e5;
    flex-shrink: 0;
  }

  /* ===== TAB NAVIGATION ===== */
  .pd-tabs {
    display: flex;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
  }
  .pd-tab {
    flex: 1;
    padding: 14px 0;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }
  .pd-tab-active {
    color: #007AFF;
    font-weight: 600;
    border-bottom-color: #007AFF;
  }

  /* ===== TAB CONTENT ===== */
  .pd-content {
    padding: 16px;
    min-height: 300px;
  }
  .pd-tab-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ===== CARD ===== */
  .pd-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .pd-card-title {
    font-size: 20px;
    font-weight: 700;
    color: #1F2937;
    margin: 0 0 16px;
  }
  .pd-card-subtitle {
    font-size: 14px;
    color: #6B7280;
    margin: -8px 0 16px;
  }

  /* ===== SIGNAL BARS ===== */
  .pd-signal-bar {
    display: flex;
    align-items: center;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .pd-signal-bar:hover {
    opacity: 0.9;
  }
  .pd-signal-bar:last-child {
    margin-bottom: 0;
  }
  .pd-signal-blue { background: #0A84FF; }
  .pd-signal-purple { background: #8B5CF6; }
  .pd-signal-orange { background: #FF9500; }

  .pd-signal-icon {
    font-size: 18px;
    margin-right: 10px;
    flex-shrink: 0;
  }
  .pd-signal-text {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
  }
  .pd-signal-italic {
    font-style: italic;
    opacity: 0.9;
  }
  .pd-signal-ghost {
    opacity: 0.5;
  }
  .pd-signal-score {
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    margin-left: auto;
    padding-left: 8px;
    white-space: nowrap;
  }

  /* ===== MEDALS ===== */
  .pd-medals {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pd-medal {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a1a;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(255, 165, 0, 0.3);
  }

  /* ===== ADD REVIEW BUTTON ===== */
  .pd-add-review-btn {
    width: 100%;
    padding: 12px;
    border: 1px solid #007AFF;
    border-radius: 8px;
    background: none;
    color: #007AFF;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pd-add-review-btn:hover {
    background: rgba(0, 122, 255, 0.05);
  }

  /* ===== CONTACT / INFO ===== */
  .pd-contact-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .pd-contact-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .pd-contact-link {
    color: #007AFF;
    font-size: 15px;
    text-decoration: none;
    line-height: 1.4;
  }
  .pd-contact-link:hover {
    text-decoration: underline;
  }
  .pd-claim-divider {
    height: 1px;
    background: #E5E7EB;
    margin: 20px 0;
  }
  .pd-claim-section {
    text-align: center;
  }
  .pd-claim-btn {
    background: none;
    border: none;
    color: #6B7280;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 12px 20px;
  }
  .pd-claim-btn:hover {
    color: #374151;
  }

  /* ===== PHOTOS ===== */
  .pd-photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  .pd-photo-item {
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1;
  }
  .pd-photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pd-no-photos {
    color: #9CA3AF;
    font-style: italic;
    font-size: 15px;
    margin: 0 0 16px;
  }
  .pd-add-photo-btn {
    width: 100%;
    padding: 12px;
    border: 1px solid #007AFF;
    border-radius: 8px;
    background: none;
    color: #007AFF;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pd-add-photo-btn:hover {
    background: rgba(0, 122, 255, 0.05);
  }

  /* ===== RESPONSIVE ===== */
  @media (min-width: 768px) {
    .pd-container {
      max-width: 480px;
      margin: 0 auto;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }
  }
`;
