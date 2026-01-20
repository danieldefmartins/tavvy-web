/**
 * PlaceCard - Card component for displaying place information
 * Ported from tavvy-mobile/components/PlaceCard.tsx
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useThemeContext } from '../contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../constants/Colors';
import { Place, Signal } from '../types';

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    address_line1: string;
    city?: string;
    state_region?: string;
    category: string;
    current_status?: string;
    signals?: Signal[];
    photos?: string[];
    distance?: number;
  };
  onPress?: () => void;
}

// Determine signal type based on bucket name
const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
  const bucketLower = bucket.toLowerCase();
  
  // Positive signals
  if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
      bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
      bucketLower.includes('good') || bucketLower.includes('friendly') ||
      bucketLower.includes('fast') || bucketLower.includes('clean') ||
      bucketLower.includes('fresh') || bucketLower.includes('delicious')) {
    return 'positive';
  }
  
  // Negative signals (Watch Out)
  if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
      bucketLower.includes('crowded') || bucketLower.includes('loud') ||
      bucketLower.includes('slow') || bucketLower.includes('dirty') ||
      bucketLower.includes('rude') || bucketLower.includes('limited') ||
      bucketLower.includes('wait') || bucketLower.includes('noisy')) {
    return 'negative';
  }
  
  // Everything else is neutral (Vibe)
  return 'neutral';
};

// Sort signals: 2 positive first, then 1 neutral, then 1 negative
const sortSignalsForDisplay = (signals: Signal[]): Signal[] => {
  const positive = signals.filter(s => getSignalType(s.bucket) === 'positive');
  const neutral = signals.filter(s => getSignalType(s.bucket) === 'neutral');
  const negative = signals.filter(s => getSignalType(s.bucket) === 'negative');
  
  const result: Signal[] = [];
  
  // First row: 2 positive (blue)
  result.push(...positive.slice(0, 2));
  
  // Second row: 1 neutral (gray) + 1 negative (orange)
  if (neutral.length > 0) {
    result.push(neutral[0]);
  }
  if (negative.length > 0) {
    result.push(negative[0]);
  }
  
  return result;
};

const getSignalBackgroundColor = (type: 'positive' | 'neutral' | 'negative') => {
  switch (type) {
    case 'positive':
      return '#0A84FF';
    case 'neutral':
      return '#8B5CF6';
    case 'negative':
      return '#FF9500';
  }
};

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
  const { theme, isDark } = useThemeContext();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const fullAddress = place.city && place.state_region
    ? `${place.address_line1}, ${place.city}`
    : place.address_line1;
  
  const displayPhotos = place.photos && place.photos.length > 0 
    ? place.photos.slice(0, 3) 
    : [null];
  
  const sortedSignals = place.signals ? sortSignalsForDisplay(place.signals) : [];

  const cardContent = (
    <div 
      className="place-card"
      style={{ 
        backgroundColor: theme.cardBackground,
        boxShadow: shadows.large,
      }}
    >
      {/* Photo Section with Name Overlay */}
      <div className="photo-container">
        <div className="photo-scroll">
          {displayPhotos.map((photo, index) => (
            <div key={index} className="photo-wrapper">
              {photo ? (
                <img src={photo} alt={place.name} className="photo" />
              ) : (
                <div 
                  className="placeholder-photo"
                  style={{ backgroundColor: theme.surface }}
                >
                  <span className="placeholder-icon">📷</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Dark Gradient Overlay for Text */}
        <div className="gradient-overlay">
          <h3 className="place-name">{place.name}</h3>
          <p className="place-address">{fullAddress}</p>
        </div>
        
        {/* Pagination Dots */}
        {displayPhotos.length > 1 && (
          <div className="dots-container">
            {displayPhotos.map((_, index) => (
              <div
                key={index}
                className={`dot ${currentPhotoIndex === index ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Signal Bars - 2x2 Grid */}
      {sortedSignals.length > 0 && (
        <div className="signals-container">
          {sortedSignals.map((signal, index) => {
            const signalType = getSignalType(signal.bucket);
            return (
              <div
                key={index}
                className="signal-badge"
                style={{ backgroundColor: getSignalBackgroundColor(signalType) }}
              >
                <span className="signal-text">
                  {signal.bucket} ×{signal.tap_total}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Footer: Category • Distance • Status */}
      <div className="footer">
        <span className="footer-text" style={{ color: theme.textSecondary }}>
          {place.category}
        </span>
        {place.distance !== undefined && (
          <>
            <span className="footer-dot" style={{ color: theme.textSecondary }}> • </span>
            <span className="footer-text" style={{ color: theme.textSecondary }}>
              {place.distance < 0.1 ? 'Nearby' : `${place.distance.toFixed(1)} mi`}
            </span>
          </>
        )}
        {place.current_status && (
          <>
            <span className="footer-dot" style={{ color: theme.textSecondary }}> • </span>
            <span className="status-text">
              {place.current_status === 'open_accessible' ? 'Open' : 
               place.current_status === 'unknown' ? 'No Vibe Yet' : 
               place.current_status}
            </span>
          </>
        )}
      </div>

      <style jsx>{`
        .place-card {
          border-radius: ${borderRadius.lg}px;
          margin-bottom: ${spacing.md}px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .place-card:hover {
          transform: translateY(-2px);
        }
        
        .photo-container {
          height: 140px;
          position: relative;
          overflow: hidden;
        }
        
        .photo-scroll {
          display: flex;
          width: 100%;
          height: 100%;
        }
        
        .photo-wrapper {
          min-width: 100%;
          height: 140px;
        }
        
        .photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-photo {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .placeholder-icon {
          font-size: 48px;
          opacity: 0.3;
        }
        
        .gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 ${spacing.md}px ${spacing.sm}px;
        }
        
        .place-name {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .place-address {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          margin: 2px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dots-container {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.4);
        }
        
        .dot.active {
          background-color: #FFFFFF;
        }
        
        .signals-container {
          display: flex;
          flex-wrap: wrap;
          padding: ${spacing.md}px;
          gap: ${spacing.sm}px;
          justify-content: space-between;
        }
        
        .signal-badge {
          width: 48%;
          padding: ${spacing.sm}px ${spacing.md}px;
          border-radius: ${borderRadius.xl}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .signal-text {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .footer {
          display: flex;
          align-items: center;
          padding: 0 ${spacing.md}px ${spacing.md}px;
        }
        
        .footer-text {
          font-size: 14px;
        }
        
        .footer-dot {
          font-size: 14px;
        }
        
        .status-text {
          color: #34C759;
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </div>
  );

  if (onPress) {
    return <div onClick={onPress}>{cardContent}</div>;
  }

  return (
    <Link href={`/place/${place.id}`} style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
}
