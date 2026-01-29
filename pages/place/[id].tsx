/**
 * Place Details Screen
 * Ported from tavvy-mobile/screens/PlaceDetailsScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import SignalBar, { getSignalTypeFromBucket } from '../../components/SignalBar';
import { fetchPlaceById } from '../../lib/placeService';
import { Place, Signal } from '../../types';
import { spacing, borderRadius, shadows } from '../../constants/Colors';

// Group signals by type
const groupSignalsByType = (signals: Signal[]) => {
  const positive: Signal[] = [];
  const neutral: Signal[] = [];
  const negative: Signal[] = [];

  signals.forEach(signal => {
    const type = getSignalTypeFromBucket(signal.bucket);
    if (type === 'positive') positive.push(signal);
    else if (type === 'neutral') neutral.push(signal);
    else negative.push(signal);
  });

  return { positive, neutral, negative };
};

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const { id } = router.query;
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlace(id as string);
    }
  }, [id]);

  const loadPlace = async (placeId: string) => {
    setLoading(true);
    try {
      console.log('[PlaceDetailsScreen] Loading place with ID:', placeId);
      const data = await fetchPlaceById(placeId);
      if (!data) {
        console.error('[PlaceDetailsScreen] Place not found:', placeId);
      }
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

  if (loading) {
    return (
      <div className="loading-screen" style={{ backgroundColor: theme.background }}>
        <div className="loading-spinner" style={{ borderColor: theme.primary }} />
        <p style={{ color: theme.textSecondary, marginTop: 16 }}>Loading place...</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border-width: 3px;
            border-style: solid;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="error-screen" style={{ backgroundColor: theme.background }}>
        <span className="error-icon">😕</span>
        <h1 style={{ color: theme.text }}>Place not found</h1>
        <p style={{ color: theme.textSecondary }}>This place may have been removed or doesn't exist.</p>
        <button onClick={() => router.push('/app')} style={{ color: theme.primary }}>
          Go Home
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
          h1 { margin: 0 0 8px; }
          p { margin: 0 0 24px; }
          button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  const photos = place.photos && place.photos.length > 0 ? place.photos : [];
  const signals = place.signals || [];
  const groupedSignals = groupSignalsByType(signals);
  const fullAddress = [place.address_line1, place.city, place.state_region].filter(Boolean).join(', ');

  return (
    <>
      <Head>
        <title>{place.name} | TavvY</title>
        <meta name="description" content={`${place.name} - ${place.category} in ${place.city || ''}`} />
      </Head>

      <div className="place-details" style={{ backgroundColor: theme.background }}>
        {/* Header with Back Button */}
        <header className="details-header">
          <button 
            className="back-button"
            onClick={() => router.back()}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            ←
          </button>
          <div className="header-actions">
            <button 
              className="action-button"
              onClick={() => setIsFavorite(!isFavorite)}
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button 
              className="action-button"
              onClick={handleShare}
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              📤
            </button>
          </div>
        </header>

        {/* Photo Gallery */}
        <div className="photo-gallery">
          {photos.length > 0 ? (
            <>
              <div className="photo-scroll">
                {photos.map((photo, index) => (
                  <img 
                    key={index}
                    src={photo} 
                    alt={`${place.name} photo ${index + 1}`}
                    className="gallery-photo"
                  />
                ))}
              </div>
              {photos.length > 1 && (
                <div className="photo-dots">
                  {photos.map((_, index) => (
                    <div 
                      key={index}
                      className={`dot ${currentPhotoIndex === index ? 'active' : ''}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-photo" style={{ backgroundColor: theme.surface }}>
              <span>📷</span>
              <p style={{ color: theme.textSecondary }}>No photos yet</p>
            </div>
          )}
        </div>

        {/* Place Info */}
        <div className="place-info">
          <div className="info-header">
            <h1 className="place-name" style={{ color: theme.text }}>{place.name}</h1>
            <span className="place-category" style={{ color: theme.textSecondary }}>
              {place.category}
            </span>
          </div>

          {/* Status Badge */}
          {place.current_status && (
            <div className="status-badge" style={{ 
              backgroundColor: place.current_status === 'open_accessible' ? theme.successLight : theme.surface,
              color: place.current_status === 'open_accessible' ? theme.success : theme.textSecondary,
            }}>
              {place.current_status === 'open_accessible' ? '✓ Open' : place.current_status}
            </div>
          )}

          {/* Address */}
          <p className="place-address" style={{ color: theme.textSecondary }}>
            📍 {fullAddress}
          </p>

          {/* Quick Actions */}
          <div className="quick-actions">
            {place.phone && (
              <button 
                className="quick-action"
                onClick={handleCall}
                style={{ backgroundColor: theme.surface }}
              >
                <span>📞</span>
                <span style={{ color: theme.text }}>Call</span>
              </button>
            )}
            <button 
              className="quick-action"
              onClick={handleDirections}
              style={{ backgroundColor: theme.surface }}
            >
              <span>🧭</span>
              <span style={{ color: theme.text }}>Directions</span>
            </button>
            {place.website && (
              <a 
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="quick-action"
                style={{ backgroundColor: theme.surface }}
              >
                <span>🌐</span>
                <span style={{ color: theme.text }}>Website</span>
              </a>
            )}
            {place.instagram_url && (
              <a 
                href={place.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="quick-action"
                style={{ backgroundColor: theme.surface }}
              >
                <span>📸</span>
                <span style={{ color: theme.text }}>Instagram</span>
              </a>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <div className="description-section">
              <h2 style={{ color: theme.text }}>About</h2>
              <p style={{ color: theme.textSecondary }}>{place.description}</p>
            </div>
          )}

          {/* Signals Section */}
          <div className="signals-section">
            <h2 style={{ color: theme.text }}>Community Signals</h2>
            
            {signals.length === 0 ? (
              <div className="no-signals" style={{ backgroundColor: theme.surface }}>
                <span>✨</span>
                <p style={{ color: theme.textSecondary }}>No signals yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="signals-list">
                {/* The Good (Positive) */}
                {groupedSignals.positive.length > 0 && (
                  <div className="signal-group">
                    <h3 style={{ color: theme.text }}>👍 The Good</h3>
                    {groupedSignals.positive.map((signal, index) => (
                      <SignalBar
                        key={index}
                        label={signal.bucket}
                        tapCount={signal.tap_total}
                        type="positive"
                      />
                    ))}
                  </div>
                )}

                {/* The Vibe (Neutral) */}
                {groupedSignals.neutral.length > 0 && (
                  <div className="signal-group">
                    <h3 style={{ color: theme.text }}>✨ The Vibe</h3>
                    {groupedSignals.neutral.map((signal, index) => (
                      <SignalBar
                        key={index}
                        label={signal.bucket}
                        tapCount={signal.tap_total}
                        type="neutral"
                      />
                    ))}
                  </div>
                )}

                {/* Heads Up (Negative) */}
                {groupedSignals.negative.length > 0 && (
                  <div className="signal-group">
                    <h3 style={{ color: theme.text }}>⚠️ Heads Up</h3>
                    {groupedSignals.negative.map((signal, index) => (
                      <SignalBar
                        key={index}
                        label={signal.bucket}
                        tapCount={signal.tap_total}
                        type="negative"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Review CTA */}
          <div className="add-review-section">
            <Link 
              href={user ? `/app/add-review?placeId=${place.id}` : '/app/login'}
              className="add-review-button"
              style={{ backgroundColor: theme.primary }}
            >
              ✏️ Add Your Signal
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .place-details {
          min-height: 100vh;
          padding-bottom: ${spacing.xxl}px;
        }
        
        .details-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: ${spacing.lg}px;
          padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          z-index: 100;
        }
        
        .back-button, .action-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header-actions {
          display: flex;
          gap: ${spacing.sm}px;
        }
        
        .photo-gallery {
          height: 300px;
          position: relative;
          overflow: hidden;
        }
        
        .photo-scroll {
          display: flex;
          height: 100%;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        
        .photo-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .gallery-photo {
          min-width: 100%;
          height: 100%;
          object-fit: cover;
          scroll-snap-align: start;
        }
        
        .photo-dots {
          position: absolute;
          bottom: 16px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 6px;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
        }
        
        .dot.active {
          background: white;
        }
        
        .no-photo {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .no-photo span {
          font-size: 48px;
          margin-bottom: 8px;
        }
        
        .place-info {
          padding: ${spacing.lg}px;
        }
        
        .info-header {
          margin-bottom: ${spacing.md}px;
        }
        
        .place-name {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        
        .place-category {
          font-size: 16px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: ${borderRadius.full}px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: ${spacing.md}px;
        }
        
        .place-address {
          font-size: 14px;
          margin: 0 0 ${spacing.lg}px;
        }
        
        .quick-actions {
          display: flex;
          gap: ${spacing.md}px;
          margin-bottom: ${spacing.xl}px;
          overflow-x: auto;
        }
        
        .quick-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: ${spacing.md}px ${spacing.lg}px;
          border-radius: ${borderRadius.lg}px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          min-width: 80px;
        }
        
        .quick-action span:first-child {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .quick-action span:last-child {
          font-size: 12px;
          font-weight: 500;
        }
        
        .description-section {
          margin-bottom: ${spacing.xl}px;
        }
        
        .description-section h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 ${spacing.sm}px;
        }
        
        .description-section p {
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        
        .signals-section {
          margin-bottom: ${spacing.xl}px;
        }
        
        .signals-section h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 ${spacing.md}px;
        }
        
        .no-signals {
          padding: ${spacing.xl}px;
          border-radius: ${borderRadius.lg}px;
          text-align: center;
        }
        
        .no-signals span {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }
        
        .no-signals p {
          margin: 0;
          font-size: 14px;
        }
        
        .signals-list {
          display: flex;
          flex-direction: column;
          gap: ${spacing.lg}px;
        }
        
        .signal-group h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 ${spacing.sm}px;
        }
        
        .signal-group > :global(.signal-bar-container) {
          margin-bottom: ${spacing.sm}px;
        }
        
        .add-review-section {
          padding-top: ${spacing.md}px;
        }
        
        .add-review-button {
          display: block;
          width: 100%;
          padding: 16px;
          border-radius: ${borderRadius.lg}px;
          border: none;
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
