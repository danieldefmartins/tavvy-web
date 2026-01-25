/**
 * Rides & Attractions Screen
 * Browse theme park rides and attractions with Tavvy signals
 * Matches mobile app RidesBrowseScreen exactly
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { supabase } from '../../lib/supabaseClient';
import { 
  FiArrowLeft, FiRefreshCw, FiMapPin, FiChevronDown
} from 'react-icons/fi';
import { 
  IoRocket, IoThumbsUp, IoSparkles, IoAlertCircle,
  IoFlame, IoTime, IoLocation
} from 'react-icons/io5';
import { UnifiedHeader } from '../../components/UnifiedHeader';

// Signal colors matching PlaceCard
const SIGNAL_COLORS = {
  positive: '#0A84FF', // Blue - The Good
  neutral: '#8B5CF6',  // Purple - The Vibe
  negative: '#FF9500', // Orange - Heads Up
};

// Ride categories for filtering
const RIDE_CATEGORIES = [
  'Attraction', 'Ride', 'Roller Coaster', 'Theme Park Ride',
  'Water Ride', 'Dark Ride', 'Thrill Ride', 'Family Ride',
  'Spinner', 'Show', 'Experience', 'Interactive'
];

// Sort options
type SortOption = 'popular' | 'recent' | 'nearby';

interface Place {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  parkName?: string;
  signals?: Signal[];
}

interface Signal {
  bucket: string;
  tap_total: number;
}

// Helper to extract category from labels
const extractCategory = (labels: any): string => {
  if (!labels) return 'Attraction';
  const labelsStr = Array.isArray(labels) ? labels.join(' ') : String(labels);
  for (const cat of RIDE_CATEGORIES) {
    if (labelsStr.toLowerCase().includes(cat.toLowerCase())) {
      return cat;
    }
  }
  return 'Attraction';
};

// Get fallback image based on category
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  
  if (lowerCategory.includes('roller') || lowerCategory.includes('thrill')) {
    return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  }
  if (lowerCategory.includes('water')) {
    return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  }
  if (lowerCategory.includes('family') || lowerCategory.includes('kid')) {
    return 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800';
  }
  if (lowerCategory.includes('dark') || lowerCategory.includes('indoor')) {
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  }
  return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
};

export default function RidesScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    loadPlaces();
  }, [sortBy]);

  const loadPlaces = async () => {
    try {
      setLoading(true);

      // Query places that are rides/attractions from fsq_places_raw
      const { data: placesData, error } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, fsq_category_labels')
        .is('date_closed', null)
        .limit(100);

      if (error) {
        console.error('Error loading rides:', error);
        setPlaces([]);
        return;
      }

      if (placesData && placesData.length > 0) {
        // Filter for ride-related categories
        const filteredPlaces = placesData.filter(p => {
          if (!p.fsq_category_labels) return false;
          const labels = Array.isArray(p.fsq_category_labels) 
            ? p.fsq_category_labels.join(' ').toLowerCase() 
            : String(p.fsq_category_labels).toLowerCase();
          return RIDE_CATEGORIES.some(cat => labels.includes(cat.toLowerCase()));
        }).map(p => ({
          id: p.fsq_place_id,
          name: p.name,
          description: '',
          category: extractCategory(p.fsq_category_labels),
          subcategory: '',
          city: p.locality,
          region: p.region,
          latitude: p.latitude,
          longitude: p.longitude,
          photo_url: getCategoryFallbackImage(extractCategory(p.fsq_category_labels)),
          signals: [],
        }));
        setPlaces(filteredPlaces);
      } else {
        setPlaces([]);
      }
      
    } catch (error) {
      console.error('Error loading rides:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlaces();
  }, [sortBy]);

  const handlePlacePress = (place: Place) => {
    router.push(`/app/place/${place.id}`);
  };

  const handleBack = () => {
    router.push('/app');
  };

  // Render signal badges in 2x2 grid format
  const renderSignalBadges = (signals: Signal[]) => {
    const hasSignals = signals && signals.length > 0;
    
    return (
      <div className="signals-container">
        {/* Row 1: 2 Blue badges (The Good) */}
        <div className="signal-row">
          <button 
            className="signal-badge"
            style={{ backgroundColor: SIGNAL_COLORS.positive }}
          >
            <IoThumbsUp size={14} color="#FFFFFF" />
            <span>
              {hasSignals ? `Thrilling ×${signals[0]?.tap_total || 0}` : 'Be the first to tap!'}
            </span>
          </button>
          
          <button 
            className="signal-badge"
            style={{ backgroundColor: SIGNAL_COLORS.positive }}
          >
            <IoThumbsUp size={14} color="#FFFFFF" />
            <span>
              {hasSignals ? `Smooth ×${signals[1]?.tap_total || 0}` : 'Be the first to tap!'}
            </span>
          </button>
        </div>
        
        {/* Row 2: 1 Purple (The Vibe) + 1 Orange (Heads Up) */}
        <div className="signal-row">
          <button 
            className="signal-badge"
            style={{ backgroundColor: SIGNAL_COLORS.neutral }}
          >
            <IoSparkles size={14} color="#FFFFFF" />
            <span>
              {hasSignals ? `Immersive ×${signals[2]?.tap_total || 0}` : 'Be the first to tap!'}
            </span>
          </button>
          
          <button 
            className="signal-badge"
            style={{ backgroundColor: SIGNAL_COLORS.negative }}
          >
            <IoAlertCircle size={14} color="#FFFFFF" />
            <span>
              {hasSignals ? `Long lines ×${signals[3]?.tap_total || 0}` : 'Be the first to tap!'}
            </span>
          </button>
        </div>
      </div>
    );
  };

  const renderPlaceCard = (place: Place, index: number) => {
    const imageUrl = place.photo_url || getCategoryFallbackImage(place.category || '');
    const location = place.parkName || [place.city, place.region].filter(Boolean).join(', ') || 'Theme Park';
    const category = place.subcategory || place.category || 'Attraction';

    return (
      <div
        key={`ride-${place.id}-${index}`}
        className="ride-card"
        onClick={() => handlePlacePress(place)}
      >
        {/* Photo with Gradient Overlay */}
        <div className="photo-container">
          <img 
            src={imageUrl} 
            alt={place.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getCategoryFallbackImage(place.category || '');
            }}
          />
          
          {/* Ride Badge */}
          <div className="ride-badge">
            <IoRocket size={12} color="#fff" />
            <span>RIDE</span>
          </div>
          
          {/* Gradient Overlay with Name */}
          <div className="gradient-overlay">
            <h3 className="card-title">{place.name}</h3>
            <p className="card-subtitle">{category} • {location}</p>
          </div>
        </div>
        
        {/* Signal Badges - 2x2 Grid matching PlaceCard */}
        {renderSignalBadges(place.signals || [])}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Rides & Attractions | TavvY</title>
        <meta name="description" content="Browse theme park rides and attractions on TavvY" />
      </Head>

      <AppLayout>
        <div className="rides-screen" style={{ backgroundColor: isDark ? theme.background : '#F2F2F7' }}>
          {/* Unified Header */}
          <UnifiedHeader
            screenKey="rides"
            title="Rides & Attractions"
            searchPlaceholder="Search rides..."
            showBackButton={true}
          />

          {/* Sort Options */}
          <div className="sort-container" style={{ backgroundColor: isDark ? theme.surface : '#fff' }}>
            <div className="sort-scroll">
              {(['popular', 'recent', 'nearby'] as SortOption[]).map((option) => (
                <button
                  key={option}
                  className={`sort-button ${sortBy === option ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: sortBy === option ? '#0A84FF' : (isDark ? theme.background : '#F2F2F7'),
                    color: sortBy === option ? '#fff' : (isDark ? theme.textSecondary : '#666')
                  }}
                  onClick={() => setSortBy(option)}
                >
                  {option === 'popular' ? '🔥 Popular' : option === 'recent' ? '🆕 Recent' : '📍 Nearby'}
                </button>
              ))}
            </div>
          </div>

          {/* Places List */}
          <div className="places-list">
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p style={{ color: isDark ? theme.textSecondary : '#666' }}>Loading rides...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="empty-container">
                <IoRocket size={64} color={isDark ? theme.textSecondary : '#ccc'} />
                <p className="empty-text" style={{ color: isDark ? theme.textSecondary : '#666' }}>
                  No rides found yet
                </p>
                <p className="empty-subtext" style={{ color: isDark ? theme.textTertiary : '#999' }}>
                  Check back soon for rides and attractions to explore
                </p>
              </div>
            ) : (
              places.map((place, index) => renderPlaceCard(place, index))
            )}
          </div>
        </div>

        <style jsx>{`
          .rides-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .rides-header {
            display: flex;
            align-items: center;
            padding: 16px;
            padding-top: max(16px, env(safe-area-inset-top));
            border-bottom: 1px solid rgba(0,0,0,0.05);
            gap: 12px;
          }
          
          .back-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .header-title-container {
            flex: 1;
          }
          
          .rides-header h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          }
          
          .rides-header p {
            font-size: 13px;
            margin: 2px 0 0;
          }
          
          .refresh-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .refresh-button :global(.spinning) {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .sort-container {
            padding: 12px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
          
          .sort-scroll {
            display: flex;
            gap: 8px;
            padding: 0 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .sort-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .sort-button {
            padding: 8px 16px;
            border-radius: 20px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .sort-button.active {
            box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
          }
          
          .places-list {
            padding: 16px;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
          }
          
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #E5E5EA;
            border-top-color: #0A84FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
          }
          
          .empty-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 20px;
          }
          
          .empty-text {
            font-size: 18px;
            font-weight: 600;
            margin: 16px 0 0;
          }
          
          .empty-subtext {
            font-size: 14px;
            margin: 8px 0 0;
            text-align: center;
          }
          
          /* Ride Card */
          .ride-card {
            background: ${isDark ? theme.surface : '#fff'};
            border-radius: ${borderRadius.lg}px;
            margin-bottom: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .ride-card:hover {
            transform: translateY(-2px);
          }
          
          .photo-container {
            height: 180px;
            position: relative;
            overflow: hidden;
          }
          
          .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .ride-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #0A84FF;
            padding: 4px 8px;
            border-radius: 4px;
          }
          
          .ride-badge span {
            color: #fff;
            font-size: 10px;
            font-weight: bold;
          }
          
          .gradient-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 12px 16px;
          }
          
          .card-title {
            font-size: 22px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0;
          }
          
          .card-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.85);
            margin: 2px 0 0;
          }
          
          /* Signal Badges */
          .signals-container {
            padding: 16px;
          }
          
          .signal-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
          }
          
          .signal-row:last-child {
            margin-bottom: 0;
          }
          
          .signal-badge {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 12px;
            border-radius: 20px;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          
          .signal-badge:hover {
            opacity: 0.9;
          }
          
          .signal-badge span {
            color: #FFFFFF;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
