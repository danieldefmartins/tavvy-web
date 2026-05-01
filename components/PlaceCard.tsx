/**
 * PlaceCard - Card component for displaying place information
 * Pixel-perfect port from tavvy-mobile/components/PlaceCard.tsx
 *
 * Features:
 * - Photo with gradient overlay
 * - Place name and location
 * - Quick action buttons (Call, Directions, Social, Website)
 * - Signal pills (compact, scannable pill UI)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';
import { spacing, borderRadius, shadows, Colors } from '../constants/Colors';
import { FiPhone, FiNavigation, FiGlobe, FiInstagram, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { SignalPillsGrid, inferCategoryFromLabel } from './SignalPill';

interface Signal {
  bucket: string;
  tap_total: number;
}

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    address_line1?: string;
    address?: string;
    city?: string;
    state_region?: string;
    category?: string;
    current_status?: string;
    signals?: Signal[];
    photos?: string[];
    photo_url?: string;
    distance?: number;
    phone?: string;
    website?: string;
    instagram_url?: string;
    latitude?: number;
    longitude?: number;
  };
  onPress?: () => void;
  showQuickActions?: boolean;
  compact?: boolean;
}


export default function PlaceCard({ place, onPress, showQuickActions = true, compact = false }: PlaceCardProps) {
  const { theme, isDark } = useThemeContext();
  const router = useRouter();
  const { locale } = router;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const fullAddress = place.city && place.state_region
    ? `${place.category || 'Place'} • ${place.city}`
    : place.category || 'Place';
  
  // Handle both photos array and single photo_url
  const displayPhotos = place.photos && place.photos.length > 0 
    ? place.photos.slice(0, 5) 
    : place.photo_url 
      ? [place.photo_url]
      : [null];
  
  // Map signals to the format SignalPillsGrid expects
  const pillSignals = (place.signals || [])
    .filter(s => s.tap_total > 0)
    .map(s => ({
      label: s.bucket,
      tapCount: s.tap_total,
      category: inferCategoryFromLabel(s.bucket),
      signalId: undefined as string | undefined,
    }));

  // Quick action handlers
  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (place.phone) {
      window.open(`tel:${place.phone}`, '_self');
    }
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (place.latitude && place.longitude) {
      window.open(`https://maps.google.com/maps?daddr=${place.latitude},${place.longitude}`, '_blank');
    } else if (place.address_line1) {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(place.address_line1)}`, '_blank');
    }
  };

  const handleSocial = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (place.instagram_url) {
      window.open(place.instagram_url, '_blank');
    }
  };

  const handleWebsite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (place.website) {
      window.open(place.website, '_blank');
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

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
        <div 
          className="photo-scroll"
          style={{ transform: `translateX(-${currentPhotoIndex * 100}%)` }}
        >
          {displayPhotos.map((photo, index) => (
            <div key={index} className="photo-wrapper">
              {photo ? (
                <img src={photo} alt={place.name} className="photo" loading="lazy" />
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
        
        {/* Photo Navigation Arrows */}
        {displayPhotos.length > 1 && (
          <>
            <button className="photo-nav photo-nav-left" onClick={prevPhoto}>
              <FiChevronLeft size={20} />
            </button>
            <button className="photo-nav photo-nav-right" onClick={nextPhoto}>
              <FiChevronRight size={20} />
            </button>
          </>
        )}
        
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

      {/* Quick Action Buttons */}
      {showQuickActions && (
        <div className="quick-actions">
          <button 
            className="action-btn"
            onClick={handleCall}
            disabled={!place.phone}
            style={{ opacity: place.phone ? 1 : 0.4 }}
          >
            <FiPhone size={18} />
            <span>Call</span>
          </button>
          <button 
            className="action-btn"
            onClick={handleDirections}
          >
            <FiNavigation size={18} />
            <span>Directions</span>
          </button>
          <button 
            className="action-btn"
            onClick={handleSocial}
            disabled={!place.instagram_url}
            style={{ opacity: place.instagram_url ? 1 : 0.4 }}
          >
            <FiInstagram size={18} />
            <span>Social</span>
          </button>
          <button 
            className="action-btn"
            onClick={handleWebsite}
            disabled={!place.website}
            style={{ opacity: place.website ? 1 : 0.4 }}
          >
            <FiGlobe size={18} />
            <span>Website</span>
          </button>
        </div>
      )}
      
      {/* Signal Pills */}
      <div className="signals-container">
        <SignalPillsGrid
          signals={pillSignals}
          maxVisible={4}
          showCounts={true}
        />
      </div>

      <style jsx>{`
        .place-card {
          border-radius: ${borderRadius.lg}px;
          margin-bottom: ${spacing.lg}px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .place-card:hover {
          transform: translateY(-2px);
        }
        
        .photo-container {
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        
        .photo-scroll {
          display: flex;
          width: 100%;
          height: 100%;
          transition: transform 0.3s ease;
        }
        
        .photo-wrapper {
          min-width: 100%;
          height: 180px;
          flex-shrink: 0;
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
        
        .photo-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        
        .place-card:hover .photo-nav {
          opacity: 1;
        }
        
        .photo-nav-left {
          left: 8px;
        }
        
        .photo-nav-right {
          right: 8px;
        }
        
        .gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 ${spacing.lg}px ${spacing.md}px;
        }
        
        .place-name {
          font-size: 22px;
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
          margin: 4px 0 0;
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
          z-index: 5;
        }
        
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.4);
          transition: background-color 0.2s;
        }
        
        .dot.active {
          background-color: #FFFFFF;
        }

        .quick-actions {
          display: flex;
          justify-content: space-around;
          padding: ${spacing.md}px ${spacing.sm}px;
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: ${theme.text};
          cursor: pointer;
          padding: ${spacing.sm}px;
          border-radius: ${borderRadius.sm}px;
          transition: background-color 0.2s;
        }

        .action-btn:hover:not(:disabled) {
          background-color: ${theme.primaryLight};
        }

        .action-btn span {
          font-size: 12px;
          color: ${theme.textSecondary};
        }
        
        .signals-container {
          padding: ${spacing.md}px;
        }
      `}</style>
    </div>
  );

  if (onPress) {
    return <div onClick={onPress}>{cardContent}</div>;
  }

  return (
    <Link href={`/place/${place.id}`} locale={locale} style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
}
