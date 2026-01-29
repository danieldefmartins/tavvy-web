/**
 * Map View Screen
 * Full-screen interactive map with place search and bottom sheet
 * Matches iOS app design exactly
 * 
 * Features:
 * - Full-screen OpenStreetMap
 * - Search bar with autocomplete
 * - Category filter pills
 * - Map controls (weather, layers, location)
 * - Draggable bottom sheet with place cards
 * - Signal-based review buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useThemeContext } from '../../contexts/ThemeContext';
// Using API routes instead of direct Supabase calls for runtime env var support
import { PlaceCard as PlaceCardType, SearchResult } from '../../lib/placeService';
import { 
  FiArrowLeft, FiSearch, FiX, FiInfo, FiLayers, FiNavigation,
  FiCloud, FiFilter, FiChevronDown, FiMapPin
} from 'react-icons/fi';
import { 
  IoRestaurant, IoCafe, IoBeer, IoCarSport, IoStorefront,
  IoThumbsUp, IoTrendingUp, IoWarning, IoClose, IoLocationSharp
} from 'react-icons/io5';

// Dynamic import for Leaflet (SSR disabled)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
// useMap hook for MapUpdater component
let useMapHook: any = null;
if (typeof window !== 'undefined') {
  import('react-leaflet').then((mod) => {
    useMapHook = mod.useMap;
  });
}

// Theme colors - Tavvy brand colors
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#000000';  // Pure black
const ACCENT_CYAN = '#22D3EE';  // Tavvy cyan/teal
const ACCENT_GREEN = '#10B981';  // Tavvy green
const ACCENT_GOLD = '#F59E0B';  // Tavvy gold
const BLUE = '#007AFF';

// Map tile styles - matching iOS app
const MAP_STYLES = {
  light: {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  dark: {
    name: 'Dark',
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '© CARTO'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri'
  },
};

// Categories for filtering
const categories = [
  { id: 'all', name: 'All', icon: null, color: BLUE },
  { id: 'restaurants', name: 'Restaurants', icon: IoRestaurant, color: '#EF4444' },
  { id: 'cafes', name: 'Cafes', icon: IoCafe, color: '#8B5CF6' },
  { id: 'bars', name: 'Bars', icon: IoBeer, color: '#F59E0B' },
  { id: 'gas', name: 'Gas', icon: IoCarSport, color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: IoStorefront, color: '#EC4899' },
];

// Sort options
const sortOptions = [
  { id: 'relevance', name: 'Relevance' },
  { id: 'distance', name: 'Distance' },
  { id: 'rating', name: 'Rating' },
  { id: 'signals', name: 'Most Signals' },
];

// Cuisine options
const cuisineOptions = [
  { id: 'all', name: 'All Cuisines' },
  { id: 'american', name: 'American' },
  { id: 'italian', name: 'Italian' },
  { id: 'mexican', name: 'Mexican' },
  { id: 'asian', name: 'Asian' },
  { id: 'indian', name: 'Indian' },
];

// Default location (San Francisco)
const DEFAULT_LOCATION: [number, number] = [37.7749, -122.4194];

// Map location updater component - dynamically updates map center
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Get the map instance from the parent MapContainer
      const mapElement = document.querySelector('.leaflet-container');
      if (mapElement && (mapElement as any)._leaflet_map) {
        const map = (mapElement as any)._leaflet_map;
        map.flyTo(center, zoom || map.getZoom(), {
          animate: true,
          duration: 1
        });
      }
    }
  }, [center, zoom, mounted]);

  return null;
}

// Inner component that uses useMap hook - created as a separate file-like component
const MapCenterUpdater = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { useMap } = mod;
    return {
      default: function InnerMapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
        const map = useMap();
        
        React.useEffect(() => {
          if (map && center) {
            map.flyTo(center, zoom || map.getZoom(), {
              animate: true,
              duration: 1
            });
          }
        }, [map, center, zoom]);
        
        return null;
      }
    };
  }),
  { ssr: false }
);

export default function MapScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  
  // Map states
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_LOCATION);
  const [mapZoom, setMapZoom] = useState(14);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchSuggestionsList, setSearchSuggestionsList] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [openNow, setOpenNow] = useState(false);
  const [cuisine, setCuisine] = useState('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  
  // Places data
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bottom sheet states
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'partial' | 'full'>('partial');
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Popup states for map controls
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const [showLayersPopup, setShowLayersPopup] = useState(false);
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const [selectedMapStyle, setSelectedMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');
  const [weatherData, setWeatherData] = useState<any>(null);

  // Get user location on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.log('Location error:', error);
        }
      );
    }
    setMapReady(true);
  }, []);

  // Fetch places when location or category changes
  useEffect(() => {
    fetchPlaces();
  }, [userLocation, selectedCategory]);

  // Handle search input with debounce for autocomplete
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      setIsSearching(true);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          // Use API route for search suggestions
          const params = new URLSearchParams({
            q: searchQuery,
            userLat: userLocation[0].toString(),
            userLng: userLocation[1].toString(),
            limit: '8',
          });
          
          const response = await fetch(`/api/search?${params}`);
          const data = await response.json();
          
          if (data.suggestions) {
            setSearchSuggestionsList(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchSuggestionsList([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, userLocation]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      // userLocation is [lat, lng] format
      const centerLat = userLocation[0];
      const centerLng = userLocation[1];
      
      // Optimized radius for better performance (0.15 degrees = ~10 miles)
      const latDelta = 0.15;
      const lngDelta = 0.15;
      
      const minLat = centerLat - latDelta;
      const maxLat = centerLat + latDelta;
      const minLng = centerLng - lngDelta;
      const maxLng = centerLng + lngDelta;
      
      console.log(`[Map] Fetching places via API near [${centerLat}, ${centerLng}]`);
      
      // Map category names to match Typesense data (singular form)
      const categoryMap: Record<string, string> = {
        'restaurants': 'Restaurant',
        'cafes': 'Cafe',
        'bars': 'Bar',
        'gas': 'Gas Station',
        'shopping': 'Shop'
      };
      
      const categoryFilter = selectedCategory !== 'all' ? 
        categoryMap[selectedCategory] : undefined;
      
      // Use API route instead of direct Supabase call
      const params = new URLSearchParams({
        minLat: minLat.toString(),
        maxLat: maxLat.toString(),
        minLng: minLng.toString(),
        maxLng: maxLng.toString(),
        userLat: centerLat.toString(),
        userLng: centerLng.toString(),
        ...(categoryFilter && { category: categoryFilter }),
      });
      
      const response = await fetch(`/api/places?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('[Map] API error:', data.error);
        setPlaces([]);
      } else {
        console.log(`[Map] Fetched ${data.places?.length || 0} places via API`, data.metrics);
        setPlaces(data.places || []);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId !== 'all') {
      setSheetHeight('partial');
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchResult) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    
    // Navigate to place if it has coordinates
    if (suggestion.latitude && suggestion.longitude) {
      setMapCenter([suggestion.latitude, suggestion.longitude]);
      // Navigate to place detail
      router.push(`/app/place/${suggestion.slug || suggestion.id}`);
    }
  };

  // Handle search submit
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      // Could trigger a full search here
      fetchPlaces();
    }
  };

  // Center on user location - request fresh geolocation
  const centerOnUser = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.log('Location error:', error);
          // Fall back to cached location
          setMapCenter(userLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        }
      );
    } else {
      // Fall back to cached location if geolocation not available
      setMapCenter(userLocation);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/app');
  };

  // Toggle sheet height on handle click - simple and reliable
  const handleToggleSheet = () => {
    setSheetHeight(prev => {
      console.log('[Sheet] Toggle from:', prev);
      if (prev === 'collapsed') return 'partial';
      if (prev === 'partial') return 'full';
      return 'collapsed'; // from 'full' go back to collapsed
    });
  };

  // Get sheet height style
  const getSheetStyle = () => {
    switch (sheetHeight) {
      case 'collapsed':
        return { height: '120px' };
      case 'partial':
        return { height: '45vh' };
      case 'full':
        return { height: 'calc(100vh - 180px)' };
      default:
        return { height: '45vh' };
    }
  };

  // Format distance for display (distance is in meters from API)
  const formatDistance = (distanceMeters?: number) => {
    if (!distanceMeters) return '';
    // Convert meters to miles (1 mile = 1609.34 meters)
    const distanceMiles = distanceMeters / 1609.34;
    if (distanceMiles < 0.1) {
      // Show in feet for very close places (1 mile = 5280 feet)
      return `${Math.round(distanceMiles * 5280)} ft`;
    }
    return `${distanceMiles.toFixed(1)} mi`;
  };

  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Places';

  return (
    <>
      <Head>
        <title>Map | TavvY</title>
        <meta name="description" content="Explore places on the map" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>

      <div className="map-screen">
        {/* Top Controls */}
        <div className="top-controls">
          {/* Back Button & Search Bar */}
          <div className="search-row">
            <button className="back-btn" onClick={handleBack}>
              <FiArrowLeft size={24} />
            </button>
            <div className={`search-bar ${isSearchFocused ? 'focused' : ''}`}>
              <FiSearch size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search places or locations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchSuggestionsList.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setIsSearchFocused(false);
                  // Delay hiding suggestions to allow click
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {isSearching && (
                <div className="search-spinner" />
              )}
              {searchQuery && !isSearching && (
                <button className="clear-btn" onClick={() => {
                  setSearchQuery('');
                  setSearchSuggestionsList([]);
                  setShowSuggestions(false);
                }}>
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && searchSuggestionsList.length > 0 && (
            <div className="suggestions-dropdown">
              {searchSuggestionsList.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="suggestion-icon">
                    <IoLocationSharp size={20} color={BLUE} />
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-name">{suggestion.name}</span>
                    <span className="suggestion-detail">
                      {suggestion.category || 'Place'} 
                      {suggestion.city && ` • ${suggestion.city}`}
                      {suggestion.distance && ` • ${formatDistance(suggestion.distance)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Category Pills - Hidden when bottom sheet is expanded */}
          <div className={`category-pills ${sheetHeight === 'full' ? 'hidden' : ''}`}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    background: isSelected ? ACCENT_CYAN : (isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'),
                    color: isSelected ? '#000' : (isDark ? '#fff' : '#333'),
                  }}
                >
                  {IconComponent && <IconComponent size={14} style={{ marginRight: 4 }} />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Container */}
        <div className="map-container">
          {mapReady && typeof window !== 'undefined' && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution={MAP_STYLES[selectedMapStyle].attribution}
                url={MAP_STYLES[selectedMapStyle].url}
              />
              {/* User location blue dot */}
              <Circle
                center={userLocation}
                radius={30}
                pathOptions={{
                  color: '#007AFF',
                  fillColor: '#007AFF',
                  fillOpacity: 1,
                  weight: 3,
                }}
              />
              <Circle
                center={userLocation}
                radius={100}
                pathOptions={{
                  color: '#007AFF',
                  fillColor: '#007AFF',
                  fillOpacity: 0.2,
                  weight: 1,
                }}
              />
              {/* Place markers */}
              {places.map((place) => (
                place.latitude && place.longitude && (
                  <Marker
                    key={place.id}
                    position={[place.latitude, place.longitude]}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <strong>{place.name}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {place.category || 'Place'}
                        </span>
                        {place.distance && (
                          <>
                            <br />
                            <span style={{ fontSize: '11px', color: '#888' }}>
                              {formatDistance(place.distance)}
                            </span>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
              {/* Map center updater - responds to mapCenter state changes */}
              <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
            </MapContainer>
          )}

          {/* Map Controls - Bottom Right */}
          <div className="map-controls-bottom">
            <button 
              className={`map-control-btn ${showWeatherPopup ? 'active' : ''}`} 
              title="Weather"
              onClick={() => {
                setShowWeatherPopup(!showWeatherPopup);
                setShowLayersPopup(false);
                setShowLegendPopup(false);
              }}
            >
              <FiCloud size={20} />
            </button>
            <button 
              className={`map-control-btn ${showLayersPopup ? 'active' : ''}`} 
              title="Layers"
              onClick={() => {
                setShowLayersPopup(!showLayersPopup);
                setShowWeatherPopup(false);
                setShowLegendPopup(false);
              }}
            >
              <FiLayers size={20} />
            </button>
            <button className="map-control-btn" onClick={centerOnUser} title="My Location">
              <FiNavigation size={20} />
            </button>
          </div>

          {/* Info/Legend Button - Bottom Left */}
          <button 
            className={`info-btn ${showLegendPopup ? 'active' : ''}`} 
            title="Legend"
            onClick={() => {
              setShowLegendPopup(!showLegendPopup);
              setShowWeatherPopup(false);
              setShowLayersPopup(false);
            }}
          >
            <FiInfo size={20} />
          </button>

          {/* Weather Popup */}
          {showWeatherPopup && (
            <div className="control-popup weather-popup">
              <div className="popup-header">
                <h3>Weather</h3>
                <button className="popup-close" onClick={() => setShowWeatherPopup(false)}>
                  <IoClose size={20} />
                </button>
              </div>
              <div className="popup-content">
                <div className="weather-info">
                  <div className="weather-temp">72°F</div>
                  <div className="weather-desc">Partly Cloudy</div>
                  <div className="weather-details">
                    <span>Humidity: 65%</span>
                    <span>Wind: 8 mph</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layers Popup */}
          {showLayersPopup && (
            <div className="control-popup layers-popup">
              <div className="popup-header">
                <h3>Map Style</h3>
                <button className="popup-close" onClick={() => setShowLayersPopup(false)}>
                  <IoClose size={20} />
                </button>
              </div>
              <div className="popup-content">
                <div className="layer-options">
                  <button 
                    className={`layer-option ${selectedMapStyle === 'light' ? 'selected' : ''}`}
                    onClick={() => setSelectedMapStyle('light')}
                  >
                    <div className="layer-preview light-preview"></div>
                    <span>Light</span>
                  </button>
                  <button 
                    className={`layer-option ${selectedMapStyle === 'dark' ? 'selected' : ''}`}
                    onClick={() => setSelectedMapStyle('dark')}
                  >
                    <div className="layer-preview dark-preview"></div>
                    <span>Dark</span>
                  </button>
                  <button 
                    className={`layer-option ${selectedMapStyle === 'satellite' ? 'selected' : ''}`}
                    onClick={() => setSelectedMapStyle('satellite')}
                  >
                    <div className="layer-preview satellite-preview"></div>
                    <span>Satellite</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend Popup */}
          {showLegendPopup && (
            <div className="control-popup legend-popup">
              <div className="popup-header">
                <h3>Map Legend</h3>
                <button className="popup-close" onClick={() => setShowLegendPopup(false)}>
                  <IoClose size={20} />
                </button>
              </div>
              <div className="popup-content">
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#22D3EE' }}></div>
                    <span>Your Location</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#EF4444' }}></div>
                    <span>Restaurants</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#8B5CF6' }}></div>
                    <span>Cafes</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#F59E0B' }}></div>
                    <span>Bars</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#3B82F6' }}></div>
                    <span>Gas Stations</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#EC4899' }}></div>
                    <span>Shopping</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sheet */}
        <div 
          className="bottom-sheet"
          ref={sheetRef}
          style={getSheetStyle()}
        >
          {/* Drag Handle - click to toggle */}
          <div 
            className="sheet-handle"
            onClick={handleToggleSheet}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleToggleSheet()}
          >
            <div className="handle-bar" />
            <span className="handle-hint">
              {sheetHeight === 'collapsed' ? 'Tap to expand' : sheetHeight === 'partial' ? 'Tap to expand' : 'Tap to collapse'}
            </span>
          </div>

          {/* Sheet Header */}
          <div className="sheet-header">
            <h2 className="sheet-title">{categoryName}</h2>
            {selectedCategory !== 'all' && (
              <button className="close-btn" onClick={() => setSelectedCategory('all')}>
                <IoClose size={24} />
              </button>
            )}
          </div>

          {/* Filter Row (shown when category selected) */}
          {selectedCategory !== 'all' && (
            <div className="filter-row">
              <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                <FiFilter size={18} />
              </button>
              
              <div className="dropdown-wrapper">
                <button 
                  className="dropdown-btn"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  Sort by <FiChevronDown size={16} />
                </button>
                {showSortDropdown && (
                  <div className="dropdown-menu">
                    {sortOptions.map(opt => (
                      <button
                        key={opt.id}
                        className={`dropdown-item ${sortBy === opt.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy(opt.id);
                          setShowSortDropdown(false);
                        }}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                className={`filter-pill ${openNow ? 'active' : ''}`}
                onClick={() => setOpenNow(!openNow)}
              >
                Open now
              </button>

              <div className="dropdown-wrapper">
                <button 
                  className="dropdown-btn"
                  onClick={() => setShowCuisineDropdown(!showCuisineDropdown)}
                >
                  Cuisine <FiChevronDown size={16} />
                </button>
                {showCuisineDropdown && (
                  <div className="dropdown-menu">
                    {cuisineOptions.map(opt => (
                      <button
                        key={opt.id}
                        className={`dropdown-item ${cuisine === opt.id ? 'selected' : ''}`}
                        onClick={() => {
                          setCuisine(opt.id);
                          setShowCuisineDropdown(false);
                        }}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Places Count */}
          {selectedCategory === 'all' && (
            <p className="places-count">{places.length} places nearby</p>
          )}

          {/* Place Cards */}
          <div className="places-list">
            {loading ? (
              <div className="loading">
                <div className="spinner" />
                <p>Discovering places...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="empty-state">
                <p>No places found in this area</p>
                <p className="empty-hint">Try zooming out or searching for a specific place</p>
              </div>
            ) : (
              places.map((place) => (
                <div key={place.id} className="place-card" onClick={() => router.push(`/app/place/${place.slug || place.id}`)}>
                  <div className="place-image">
                    <img 
                      src={place.cover_image_url || place.photo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'} 
                      alt={place.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
                      }}
                    />
                    {place.distance && (
                      <div className="place-distance">{formatDistance(place.distance)}</div>
                    )}
                  </div>
                  <div className="place-info">
                    <h3 className="place-name">{place.name}</h3>
                    <p className="place-category">
                      {place.category || place.primary_category || 'Place'} 
                      {place.city && ` • ${place.city}`}
                    </p>
                  </div>
                  <div className="signal-buttons">
                    <button className="signal-btn good">
                      <IoThumbsUp size={14} />
                      <span>Be the first to tap!</span>
                    </button>
                    <button className="signal-btn vibe">
                      <IoThumbsUp size={14} />
                      <span>Be the first to tap!</span>
                    </button>
                    <button className="signal-btn trend">
                      <IoTrendingUp size={14} />
                      <span>Be the first to tap!</span>
                    </button>
                    <button className="signal-btn alert">
                      <IoWarning size={14} />
                      <span>Be the first to tap!</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .map-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${bgColor};
        }

        /* Top Controls */
        .top-controls {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: max(12px, env(safe-area-inset-top)) 16px 12px;
          background: ${isDark ? 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)' : 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 70%, transparent 100%)'};
        }

        .search-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : '#fff'};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          color: ${isDark ? '#fff' : '#333'};
          backdrop-filter: blur(8px);
        }

        .back-btn:hover {
          background: ${ACCENT_CYAN};
          color: #000;
        }

        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)'};
          border-radius: 10px;
          padding: 10px 14px;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          backdrop-filter: blur(8px);
        }

        .search-bar.focused {
          box-shadow: 0 2px 12px rgba(0,122,255,0.2);
        }

        .search-icon {
          color: ${isDark ? '#888' : '#8A8A8A'};
        }

        .search-bar input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 15px;
          color: ${isDark ? '#fff' : '#111'};
          outline: none;
        }

        .search-bar input::placeholder {
          color: ${isDark ? '#666' : '#A0A0A0'};
        }

        .clear-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: ${isDark ? '#888' : '#8E8E93'};
        }

        .search-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid ${isDark ? '#333' : '#E5E5EA'};
          border-top-color: ${ACCENT_CYAN};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Autocomplete Suggestions */
        .suggestions-dropdown {
          position: absolute;
          top: calc(max(12px, env(safe-area-inset-top)) + 52px);
          left: 68px;
          right: 16px;
          background: ${isDark ? 'rgba(0,0,0,0.95)' : '#fff'};
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          z-index: 1002;
          overflow: hidden;
          max-height: 400px;
          overflow-y: auto;
          backdrop-filter: blur(16px);
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
        }

        .suggestion-item:hover {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F7'};
        }

        .suggestion-item:not(:last-child) {
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7'};
        }

        .suggestion-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(34, 211, 238, 0.2)' : '#E8F4FF'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .suggestion-content {
          flex: 1;
          min-width: 0;
        }

        .suggestion-name {
          display: block;
          font-size: 15px;
          font-weight: 500;
          color: ${isDark ? '#fff' : '#111'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-detail {
          display: block;
          font-size: 12px;
          color: ${isDark ? '#888' : '#666'};
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Category Pills - Compact filter bar */
        .category-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          transition: opacity 0.3s, transform 0.3s;
        }

        .category-pills.hidden {
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
        }

        .category-pills::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          display: flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 18px;
          border: none;
          background: rgba(0,0,0,0.85);
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          backdrop-filter: blur(12px);
        }

        .category-pill.selected {
          background: ${ACCENT_CYAN};
          color: #000;
          box-shadow: 0 2px 12px rgba(34, 211, 238, 0.4);
        }

        .category-pill:hover:not(.selected) {
          background: rgba(34, 211, 238, 0.3);
          color: #fff;
        }

        /* Map Container */
        .map-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        /* Map Controls - Bottom Right */
        .map-controls-bottom {
          position: absolute;
          right: 16px;
          bottom: 280px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .map-control-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.8);
          border: none;
          display: flex;
          color: #fff;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
        }

        .map-control-btn:hover {
          background: rgba(34, 211, 238, 0.9);
          color: #000;
        }

        .map-control-btn.active {
          background: ${ACCENT_CYAN};
          color: #000;
        }

        /* Info Button - Bottom Left */
        .info-btn {
          position: absolute;
          left: 16px;
          bottom: 280px;
          z-index: 1000;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.8);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          color: #fff;
          backdrop-filter: blur(8px);
        }

        .info-btn:hover {
          background: rgba(34, 211, 238, 0.9);
          color: #000;
        }

        .info-btn.active {
          background: ${ACCENT_CYAN};
          color: #000;
        }

        /* Control Popups */
        .control-popup {
          position: absolute;
          bottom: 340px;
          z-index: 1002;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 16px;
          padding: 16px;
          min-width: 200px;
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .weather-popup {
          right: 70px;
        }

        .layers-popup {
          right: 70px;
        }

        .legend-popup {
          left: 70px;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .popup-close {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
        }

        .popup-close:hover {
          color: #fff;
        }

        .popup-content {
          color: #fff;
        }

        /* Weather Popup */
        .weather-info {
          text-align: center;
        }

        .weather-temp {
          font-size: 36px;
          font-weight: 700;
          color: ${ACCENT_CYAN};
        }

        .weather-desc {
          font-size: 14px;
          color: #ccc;
          margin-top: 4px;
        }

        .weather-details {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 12px;
          font-size: 12px;
          color: #888;
        }

        /* Layers Popup */
        .layer-options {
          display: flex;
          gap: 12px;
        }

        .layer-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 2px solid transparent;
          border-radius: 12px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .layer-option.selected {
          border-color: ${ACCENT_CYAN};
        }

        .layer-option span {
          font-size: 12px;
          color: #fff;
        }

        .layer-preview {
          width: 60px;
          height: 40px;
          border-radius: 8px;
        }

        .light-preview {
          background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
        }

        .dark-preview {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .satellite-preview {
          background: linear-gradient(135deg, #2d5016 0%, #4a7c59 50%, #1a4d2e 100%);
          position: relative;
        }

        /* Legend Popup */
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-item span {
          font-size: 13px;
          color: #ccc;
        }

        /* Bottom Sheet */
        .bottom-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
          z-index: 1001;
          transition: height 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .sheet-handle {
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          user-select: none;
        }

        .sheet-handle:hover {
          background: rgba(0,0,0,0.02);
        }

        .sheet-handle:active {
          cursor: grabbing;
        }

        .handle-bar {
          width: 40px;
          height: 4px;
          background: #D1D1D6;
          border-radius: 2px;
        }

        .handle-hint {
          font-size: 11px;
          color: #8E8E93;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px 12px;
        }

        .sheet-title {
          font-size: 24px;
          font-weight: 700;
          color: #111;
          margin: 0;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F2F2F7;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #666;
        }

        /* Filter Row */
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .filter-row::-webkit-scrollbar {
          display: none;
        }

        .filter-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #F2F2F7;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
        }

        .dropdown-wrapper {
          position: relative;
        }

        .dropdown-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid #E5E5EA;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          white-space: nowrap;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          min-width: 150px;
          z-index: 1002;
          overflow: hidden;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          text-align: left;
          font-size: 14px;
          color: #333;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #F2F2F7;
        }

        .dropdown-item.selected {
          color: ${BLUE};
          font-weight: 600;
        }

        .filter-pill {
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid #E5E5EA;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          white-space: nowrap;
        }

        .filter-pill.active {
          background: ${BLUE};
          border-color: ${BLUE};
          color: #fff;
        }

        /* Places Count */
        .places-count {
          padding: 0 20px 12px;
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        /* Places List */
        .places-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px 20px;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #666;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #E5E5EA;
          border-top-color: ${BLUE};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-hint {
          font-size: 14px;
          color: #999;
          margin-top: 8px;
        }

        /* Place Card */
        .place-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .place-card:hover {
          transform: translateY(-2px);
        }

        .place-image {
          position: relative;
          height: 180px;
          overflow: hidden;
        }

        .place-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .place-distance {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .place-info {
          padding: 12px 16px;
        }

        .place-name {
          font-size: 18px;
          font-weight: 600;
          color: #111;
          margin: 0 0 4px;
        }

        .place-category {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        /* Signal Buttons */
        .signal-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 16px 16px;
        }

        .signal-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .signal-btn:hover {
          opacity: 0.9;
        }

        .signal-btn.good {
          background: #10B981;
          color: #fff;
        }

        .signal-btn.vibe {
          background: ${BLUE};
          color: #fff;
        }

        .signal-btn.trend {
          background: #F59E0B;
          color: #fff;
        }

        .signal-btn.alert {
          background: #EF4444;
          color: #fff;
        }
      `}</style>
    </>
  );
}
