/**
 * Ride Details Screen
 * Detailed view of a theme park ride with Tavvy signals
 * Matches mobile app RideDetailsScreen exactly
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { 
  FiArrowLeft, FiShare2, FiHeart, FiMapPin, FiClock, FiUsers
} from 'react-icons/fi';
import { 
  IoThumbsUp, IoSparkles, IoAlertCircle, IoFlame,
  IoChevronDown, IoChevronUp, IoAdd
} from 'react-icons/io5';

// Category colors matching the universal review system
const CATEGORY_COLORS = {
  best_for: '#0A84FF',  // Blue - The Good
  vibe: '#8B5CF6',      // Purple - The Vibe
  heads_up: '#FF9500',  // Orange - Heads Up
};

const THRILL_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: '#10B981' },
  moderate: { label: 'Moderate', color: '#3B82F6' },
  thrilling: { label: 'Thrilling', color: '#F59E0B' },
  extreme: { label: 'Extreme', color: '#EF4444' },
};

interface RideData {
  id: string;
  name: string;
  parkName: string;
  landName?: string;
  description: string;
  image: string;
  thumbnails: string[];
  keyInfo: {
    thrillLevel: string;
    rideType: string;
    audience: string;
    minHeight?: string;
    duration?: string;
    maxSpeed?: string;
    inversions?: number;
  };
}

interface Signal {
  id: string;
  label: string;
  tap_total: number;
  category: 'best_for' | 'vibe' | 'heads_up';
}

interface SignalsByCategory {
  best_for: Signal[];
  vibe: Signal[];
  heads_up: Signal[];
}

// Helper functions
const getThrillLevelLabel = (subcategory: string | undefined): string => {
  if (!subcategory) return 'Moderate';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'High Thrill';
  if (lower.includes('water') || lower === 'simulator') return 'Moderate-High';
  if (lower === 'dark_ride' || lower === 'boat_ride') return 'Moderate';
  if (lower === 'carousel' || lower === 'train' || lower === 'show') return 'Mild';
  return 'Moderate';
};

const formatSubcategory = (subcategory: string | undefined): string => {
  if (!subcategory) return 'Attraction';
  return subcategory
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getAudienceFromSubcategory = (subcategory: string | undefined): string => {
  if (!subcategory) return 'All Ages';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'Teens & Adults';
  if (lower === 'playground' || lower === 'meet_greet') return 'Kids & Families';
  return 'All Ages';
};

const getDefaultImage = (subcategory: string | undefined): string => {
  if (!subcategory) return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  const lower = subcategory.toLowerCase();
  if (lower.includes('coaster') || lower.includes('thrill')) {
    return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  }
  if (lower.includes('water') || lower.includes('boat')) {
    return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  }
  if (lower === 'dark_ride') {
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  }
  return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
};

const extractPhotos = (photos: any): string[] => {
  if (!photos) return [];
  if (Array.isArray(photos)) {
    return photos.map((p: any) => typeof p === 'string' ? p : p.url || p.photo_url || '').filter(Boolean).slice(0, 4);
  }
  return [];
};

// Sample ride data for fallback
const SAMPLE_RIDES: Record<string, RideData> = {
  'ride-velocicoaster': {
    id: 'ride-velocicoaster',
    name: 'VELOCICOASTER',
    parkName: 'Islands of Adventure',
    landName: 'Jurassic Park',
    description: 'Experience the apex predator of coasters. Launch into the raptor paddock, twist through inversions, and speed over water on this intense thrill ride.',
    image: 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    thumbnails: [
      'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=400',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400',
    ],
    keyInfo: {
      thrillLevel: 'High Thrill',
      rideType: 'Coaster',
      audience: 'Teens & Adults',
      minHeight: '51"',
      duration: '2 min',
      maxSpeed: '70 mph',
      inversions: 4,
    },
  },
};

export default function RideDetailsScreen() {
  const router = useRouter();
  const { id, name, park } = router.query;
  const { theme, isDark } = useThemeContext();
  
  const [ride, setRide] = useState<RideData | null>(null);
  const [signals, setSignals] = useState<SignalsByCategory>({ best_for: [], vibe: [], heads_up: [] });
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      loadRideData();
    }
  }, [id]);

  const loadRideData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      // First try to fetch from Supabase places table
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
        .eq('id', id)
        .single();

      let rideData: RideData;

      if (placeData && !placeError) {
        // Build ride data from Supabase place
        const thrillLevel = getThrillLevelLabel(placeData.tavvy_subcategory);
        const rideType = formatSubcategory(placeData.tavvy_subcategory);
        const audience = getAudienceFromSubcategory(placeData.tavvy_subcategory);
        
        rideData = {
          id: placeData.id,
          name: placeData.name?.toUpperCase() || 'RIDE',
          parkName: (park as string) || placeData.city || 'Theme Park',
          description: `Experience ${placeData.name}, a ${rideType.toLowerCase()} at ${placeData.city || 'this theme park'}.`,
          image: placeData.cover_image_url || getDefaultImage(placeData.tavvy_subcategory),
          thumbnails: extractPhotos(placeData.photos),
          keyInfo: {
            thrillLevel,
            rideType,
            audience,
          },
        };
      } else {
        // Fallback to sample data or default
        rideData = SAMPLE_RIDES[id as string] || {
          id: id as string,
          name: ((name as string) || 'RIDE').toUpperCase(),
          parkName: (park as string) || 'Theme Park',
          description: 'Experience this amazing attraction!',
          image: 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
          thumbnails: [],
          keyInfo: {
            thrillLevel: 'Moderate',
            rideType: 'Attraction',
            audience: 'All Ages',
          },
        };
      }

      setRide(rideData);

      // Fetch signals
      try {
        const { data: signalData, error: signalError } = await supabase
          .from('signal_aggregates')
          .select('signal_id, tap_total, review_items(label, signal_type)')
          .eq('place_id', id)
          .gt('tap_total', 0)
          .order('tap_total', { ascending: false })
          .limit(12);

        if (signalData && !signalError) {
          const grouped: SignalsByCategory = { best_for: [], vibe: [], heads_up: [] };
          signalData.forEach((s: any) => {
            const category = s.review_items?.signal_type as 'best_for' | 'vibe' | 'heads_up';
            if (category && grouped[category]) {
              grouped[category].push({
                id: s.signal_id,
                label: s.review_items?.label || 'Signal',
                tap_total: s.tap_total,
                category,
              });
            }
          });
          setSignals(grouped);
        }
      } catch (signalError) {
        console.log('No signals found for ride');
      }

    } catch (error) {
      console.error('Error loading ride data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAddReview = () => {
    if (!ride) return;
    router.push(`/app/review/add?placeId=${ride.id}&placeName=${encodeURIComponent(ride.name)}&category=attraction`);
  };

  const handleBack = () => {
    router.back();
  };

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#111827' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';

  if (loading) {
    return (
      <AppLayout hideTabBar>
        <div className="loading-screen" style={{ backgroundColor }}>
          <div className="loading-spinner" />
          <p style={{ color: secondaryTextColor }}>Loading ride details...</p>
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid ${surfaceColor};
              border-top-color: #667EEA;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 16px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  if (!ride) {
    return (
      <AppLayout hideTabBar>
        <div className="error-screen" style={{ backgroundColor }}>
          <span className="error-icon">🎢</span>
          <h1 style={{ color: textColor }}>Ride not found</h1>
          <button onClick={handleBack} style={{ color: '#667EEA' }}>
            Go Back
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
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  const allImages = [ride.image, ...ride.thumbnails].filter(Boolean);

  return (
    <>
      <Head>
        <title>{ride.name} | TavvY</title>
        <meta name="description" content={ride.description} />
      </Head>

      <AppLayout hideTabBar>
        <div className="ride-details" style={{ backgroundColor }}>
          {/* Hero Image */}
          <div className="hero-section">
            <img 
              src={allImages[selectedImage] || ride.image}
              alt={ride.name}
              className="hero-image"
            />
            <div className="hero-overlay">
              <button className="back-button" onClick={handleBack}>
                <FiArrowLeft size={24} color="white" />
              </button>
              <div className="hero-actions">
                <button className="action-button">
                  <FiShare2 size={20} color="white" />
                </button>
                <button className="action-button">
                  <FiHeart size={20} color="white" />
                </button>
              </div>
            </div>
            <div className="hero-gradient">
              <h1 className="ride-name">{ride.name}</h1>
              <p className="ride-park">
                <FiMapPin size={14} />
                {ride.parkName}
                {ride.landName && ` • ${ride.landName}`}
              </p>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="thumbnail-gallery">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`View ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Key Info Cards */}
          <div className="info-cards">
            <div className="info-card" style={{ backgroundColor: surfaceColor }}>
              <IoFlame size={20} color="#EF4444" />
              <span className="info-label" style={{ color: secondaryTextColor }}>Thrill</span>
              <span className="info-value" style={{ color: textColor }}>{ride.keyInfo.thrillLevel}</span>
            </div>
            <div className="info-card" style={{ backgroundColor: surfaceColor }}>
              <FiUsers size={20} color="#3B82F6" />
              <span className="info-label" style={{ color: secondaryTextColor }}>Audience</span>
              <span className="info-value" style={{ color: textColor }}>{ride.keyInfo.audience}</span>
            </div>
            <div className="info-card" style={{ backgroundColor: surfaceColor }}>
              <FiClock size={20} color="#10B981" />
              <span className="info-label" style={{ color: secondaryTextColor }}>Type</span>
              <span className="info-value" style={{ color: textColor }}>{ride.keyInfo.rideType}</span>
            </div>
          </div>

          {/* Description */}
          <div className="description-section" style={{ backgroundColor: surfaceColor }}>
            <h2 style={{ color: textColor }}>About This Ride</h2>
            <p style={{ color: secondaryTextColor }}>{ride.description}</p>
          </div>

          {/* Signals Section */}
          <div className="signals-section">
            <h2 style={{ color: textColor }}>What People Say</h2>
            
            {/* The Good */}
            <div className="signal-category">
              <button 
                className="category-header"
                onClick={() => toggleSection('best_for')}
                style={{ backgroundColor: surfaceColor }}
              >
                <div className="category-info">
                  <div className="category-dot" style={{ backgroundColor: CATEGORY_COLORS.best_for }} />
                  <span style={{ color: textColor }}>The Good</span>
                  <span className="signal-count" style={{ color: secondaryTextColor }}>
                    ({signals.best_for.length})
                  </span>
                </div>
                {expandedSection === 'best_for' ? (
                  <IoChevronUp size={20} color={secondaryTextColor} />
                ) : (
                  <IoChevronDown size={20} color={secondaryTextColor} />
                )}
              </button>
              {expandedSection === 'best_for' && (
                <div className="signal-list">
                  {signals.best_for.length > 0 ? (
                    signals.best_for.map((signal) => (
                      <div 
                        key={signal.id}
                        className="signal-item"
                        style={{ backgroundColor: CATEGORY_COLORS.best_for }}
                      >
                        <IoThumbsUp size={16} color="#fff" />
                        <span>{signal.label}</span>
                        <span className="tap-count">×{signal.tap_total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-signals" style={{ color: secondaryTextColor }}>
                      No signals yet. Be the first to share!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* The Vibe */}
            <div className="signal-category">
              <button 
                className="category-header"
                onClick={() => toggleSection('vibe')}
                style={{ backgroundColor: surfaceColor }}
              >
                <div className="category-info">
                  <div className="category-dot" style={{ backgroundColor: CATEGORY_COLORS.vibe }} />
                  <span style={{ color: textColor }}>The Vibe</span>
                  <span className="signal-count" style={{ color: secondaryTextColor }}>
                    ({signals.vibe.length})
                  </span>
                </div>
                {expandedSection === 'vibe' ? (
                  <IoChevronUp size={20} color={secondaryTextColor} />
                ) : (
                  <IoChevronDown size={20} color={secondaryTextColor} />
                )}
              </button>
              {expandedSection === 'vibe' && (
                <div className="signal-list">
                  {signals.vibe.length > 0 ? (
                    signals.vibe.map((signal) => (
                      <div 
                        key={signal.id}
                        className="signal-item"
                        style={{ backgroundColor: CATEGORY_COLORS.vibe }}
                      >
                        <IoSparkles size={16} color="#fff" />
                        <span>{signal.label}</span>
                        <span className="tap-count">×{signal.tap_total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-signals" style={{ color: secondaryTextColor }}>
                      No signals yet. Be the first to share!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Heads Up */}
            <div className="signal-category">
              <button 
                className="category-header"
                onClick={() => toggleSection('heads_up')}
                style={{ backgroundColor: surfaceColor }}
              >
                <div className="category-info">
                  <div className="category-dot" style={{ backgroundColor: CATEGORY_COLORS.heads_up }} />
                  <span style={{ color: textColor }}>Heads Up</span>
                  <span className="signal-count" style={{ color: secondaryTextColor }}>
                    ({signals.heads_up.length})
                  </span>
                </div>
                {expandedSection === 'heads_up' ? (
                  <IoChevronUp size={20} color={secondaryTextColor} />
                ) : (
                  <IoChevronDown size={20} color={secondaryTextColor} />
                )}
              </button>
              {expandedSection === 'heads_up' && (
                <div className="signal-list">
                  {signals.heads_up.length > 0 ? (
                    signals.heads_up.map((signal) => (
                      <div 
                        key={signal.id}
                        className="signal-item"
                        style={{ backgroundColor: CATEGORY_COLORS.heads_up }}
                      >
                        <IoAlertCircle size={16} color="#fff" />
                        <span>{signal.label}</span>
                        <span className="tap-count">×{signal.tap_total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-signals" style={{ color: secondaryTextColor }}>
                      No signals yet. Be the first to share!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Add Review FAB */}
          <button className="fab" onClick={handleAddReview}>
            <IoAdd size={28} color="#fff" />
          </button>
        </div>

        <style jsx>{`
          .ride-details {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          /* Hero Section */
          .hero-section {
            position: relative;
            height: 300px;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 16px;
            padding-top: max(16px, env(safe-area-inset-top));
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .back-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .hero-actions {
            display: flex;
            gap: 8px;
          }
          
          .action-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .hero-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 120px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          
          .ride-name {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }
          
          .ride-park {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          /* Thumbnail Gallery */
          .thumbnail-gallery {
            display: flex;
            gap: 8px;
            padding: 12px 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .thumbnail {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid transparent;
            padding: 0;
            cursor: pointer;
            flex-shrink: 0;
          }
          
          .thumbnail.active {
            border-color: #667EEA;
          }
          
          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          /* Info Cards */
          .info-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            padding: 0 16px 16px;
          }
          
          .info-card {
            padding: 16px 12px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            text-align: center;
          }
          
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 13px;
            font-weight: 600;
          }
          
          /* Description */
          .description-section {
            margin: 0 16px 16px;
            padding: 16px;
            border-radius: 12px;
          }
          
          .description-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 8px;
          }
          
          .description-section p {
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          
          /* Signals Section */
          .signals-section {
            padding: 0 16px;
          }
          
          .signals-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 12px;
          }
          
          .signal-category {
            margin-bottom: 12px;
          }
          
          .category-header {
            width: 100%;
            padding: 14px 16px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .category-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .category-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          
          .signal-count {
            font-size: 13px;
          }
          
          .signal-list {
            padding: 12px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .signal-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 20px;
            color: #fff;
            font-size: 13px;
            font-weight: 500;
          }
          
          .tap-count {
            opacity: 0.9;
            font-size: 12px;
          }
          
          .no-signals {
            font-size: 14px;
            padding: 8px 0;
          }
          
          /* FAB */
          .fab {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #667EEA;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          
          .fab:hover {
            transform: scale(1.1);
          }
        `}</style>
      </AppLayout>
    </>
  );
}
