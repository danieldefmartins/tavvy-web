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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
// Using API routes instead of direct Supabase calls for runtime env var support
import { PlaceCard as PlaceCardType, SearchResult } from '../../lib/placeService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { 
  FiArrowLeft, FiSearch, FiX, FiInfo, FiLayers, FiNavigation,
  FiCloud, FiFilter, FiChevronDown, FiMapPin, FiArrowRight, FiRefreshCw
} from 'react-icons/fi';
import { 
  IoRestaurant, IoCafe, IoBeer, IoCarSport, IoStorefront,
  IoThumbsUp, IoTrendingUp, IoWarning, IoClose, IoLocationSharp, IoRefresh
} from 'react-icons/io5';
// Leaflet is imported dynamically in useEffect to avoid SSR issues
let L: typeof import('leaflet') | null = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

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

// MapEvents component - detects map pan/zoom to show "Search this area" button
const MapEvents = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { useMapEvents } = mod;
    return {
      default: function InnerMapEvents({ onMoveEnd }: { onMoveEnd: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number; center: [number, number] }) => void }) {
        useMapEvents({
          moveend: (e) => {
            const map = e.target;
            const bounds = map.getBounds();
            const center = map.getCenter();
            onMoveEnd({
              minLat: bounds.getSouth(),
              maxLat: bounds.getNorth(),
              minLng: bounds.getWest(),
              maxLng: bounds.getEast(),
              center: [center.lat, center.lng],
            });
          },
        });
        return null;
      }
    };
  }),
  { ssr: false }
);

export default function MapScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
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
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapBoundsRef = useRef<{ minLat: number; maxLat: number; minLng: number; maxLng: number; center: [number, number] } | null>(null);
  const initialLoadDone = useRef(false);
  
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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  
  // Bottom sheet states - draggable with 3 snap points matching iOS
  // Snap points: collapsed (120px peek), half (50vh), expanded (85vh)
  const SNAP_COLLAPSED = 120;
  const SNAP_HALF = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400;
  const SNAP_EXPANDED = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 680;
  const [sheetHeightPx, setSheetHeightPx] = useState(SNAP_HALF);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);
  const isDragging = useRef(false);

  // Snap to nearest snap point
  const snapToNearest = (height: number) => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const snapPoints = [SNAP_COLLAPSED, vh * 0.5, vh * 0.85];
    let closest = snapPoints[0];
    let minDist = Math.abs(height - closest);
    for (const sp of snapPoints) {
      const dist = Math.abs(height - sp);
      if (dist < minDist) {
        minDist = dist;
        closest = sp;
      }
    }
    setSheetHeightPx(closest);
  };

  // Touch handlers for dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = sheetHeightPx;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const newHeight = Math.max(SNAP_COLLAPSED, Math.min(dragStartHeight.current + deltaY, SNAP_EXPANDED));
    setSheetHeightPx(newHeight);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    snapToNearest(sheetHeightPx);
  };

  // Mouse handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = sheetHeightPx;
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUpGlobal);
  };

  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const deltaY = dragStartY.current - e.clientY;
    const vh = window.innerHeight;
    const newHeight = Math.max(SNAP_COLLAPSED, Math.min(dragStartHeight.current + deltaY, vh * 0.85));
    setSheetHeightPx(newHeight);
  };

  const handleMouseUpGlobal = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    snapToNearest(sheetHeightPx);
    document.removeEventListener('mousemove', handleMouseMoveGlobal);
    document.removeEventListener('mouseup', handleMouseUpGlobal);
  };
  
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

    if (searchQuery.trim().length >= 2) {
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
      
      // Map category names to match iOS Typesense search queries
      const categoryMap: Record<string, string> = {
        'restaurants': 'restaurant',
        'cafes': 'coffee cafe',
        'bars': 'bar pub',
        'gas': 'gas station fuel',
        'shopping': 'shop store'
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
        const fetchedPlaces = data.places || [];
        
        // Deduplicate by place ID (keep first occurrence)
        const seenIds = new Set<string>();
        const uniquePlaces = fetchedPlaces.filter((place: PlaceCardType) => {
          if (seenIds.has(place.id)) {
            console.log(`[Dedup] Removing duplicate place: ${place.name} (${place.id})`);
            return false;
          }
          seenIds.add(place.id);
          return true;
        });
        
        console.log(`[Map] Fetched ${fetchedPlaces.length} places, ${uniquePlaces.length} unique via API`, data.metrics);
        setPlaces(uniquePlaces);
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
    // Expand sheet to half when selecting a category
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    setSheetHeightPx(vh * 0.5);
  };

  // Handle map move end - show "Search this area" button
  const onMapMoveEnd = useCallback((bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number; center: [number, number] }) => {
    mapBoundsRef.current = bounds;
    // Only show "Search this area" after initial load
    if (initialLoadDone.current) {
      setShowSearchThisArea(true);
    } else {
      initialLoadDone.current = true;
    }
  }, []);

  // Search this area - fetch places for current map bounds
  const searchThisArea = async () => {
    setShowSearchThisArea(false);
    if (!mapBoundsRef.current) return;
    
    const { minLat, maxLat, minLng, maxLng, center } = mapBoundsRef.current;
    setLoading(true);
    try {
      const categoryMap: Record<string, string> = {
        'restaurants': 'restaurant',
        'cafes': 'coffee cafe',
        'bars': 'bar pub',
        'gas': 'gas station fuel',
        'shopping': 'shop store'
      };
      const categoryFilter = selectedCategory !== 'all' ? categoryMap[selectedCategory] : undefined;
      
      const params = new URLSearchParams({
        minLat: minLat.toString(),
        maxLat: maxLat.toString(),
        minLng: minLng.toString(),
        maxLng: maxLng.toString(),
        userLat: center[0].toString(),
        userLng: center[1].toString(),
        ...(categoryFilter && { category: categoryFilter }),
      });
      
      const response = await fetch(`/api/places?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('[Map] API error:', data.error);
        setPlaces([]);
      } else {
        const fetchedPlaces = data.places || [];
        const seenIds = new Set<string>();
        const uniquePlaces = fetchedPlaces.filter((place: PlaceCardType) => {
          if (seenIds.has(place.id)) return false;
          seenIds.add(place.id);
          return true;
        });
        console.log(`[Map] Search this area: ${uniquePlaces.length} places`);
        setPlaces(uniquePlaces);
      }
    } catch (error) {
      console.error('Error searching area:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection — show on map (matching iOS behavior)
  const handleSuggestionSelect = (suggestion: SearchResult) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setShowSearchOverlay(false);
    
    if (suggestion.latitude && suggestion.longitude) {
      // Center map on the selected place
      setMapCenter([suggestion.latitude, suggestion.longitude]);
      setMapZoom(16); // Zoom in closer for a single place
      
      // Convert suggestion to PlaceCardType and show as the only card
      const placeCard: PlaceCardType = {
        id: (suggestion as any).id || `search-${Date.now()}`,
        name: suggestion.name,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        category: (suggestion as any).category || 'Place',
        city: (suggestion as any).city || '',
        address: (suggestion as any).address || '',
        signals: [],
      };
      
      setPlaces([placeCard]);
      setSelectedPlaceId(placeCard.id);
      
      // Expand bottom sheet to show the result
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      setSheetHeightPx(vh * 0.5);
      
      console.log('[MapScreen] Showing place on map:', placeCard.name, placeCard.id);
    }
  };

  // Handle search submit (Enter key) — search and show results on map
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setShowSearchOverlay(false);
      setLoading(true);
      
      try {
        // Search via API (same endpoint as autocomplete, but with higher limit)
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          userLat: userLocation[0].toString(),
          userLng: userLocation[1].toString(),
          limit: '30',
        });
        
        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();
        
        if (data.suggestions && data.suggestions.length > 0) {
          // Convert search suggestions to PlaceCardType for the map
          const searchPlaces: PlaceCardType[] = data.suggestions
            .filter((s: any) => s.latitude && s.longitude)
            .map((s: any) => ({
              id: s.id || `search-${Date.now()}-${Math.random()}`,
              name: s.name,
              latitude: s.latitude,
              longitude: s.longitude,
              category: s.category || 'Place',
              city: s.city || '',
              address: s.address || '',
              distance: s.distance,
              signals: [],
            }));
          
          setPlaces(searchPlaces);
          
          // Center map on first result
          if (searchPlaces[0]) {
            setMapCenter([searchPlaces[0].latitude, searchPlaces[0].longitude]);
            setMapZoom(14);
            setSelectedPlaceId(searchPlaces[0].id);
          }
          
          console.log(`[MapScreen] Search "${searchQuery}" returned ${searchPlaces.length} places on map`);
        } else {
          console.log(`[MapScreen] Search "${searchQuery}" returned no results`);
          setPlaces([]);
        }
      } catch (error) {
        console.error('[MapScreen] Search error:', error);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
      
      // Expand bottom sheet to show results
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      setSheetHeightPx(vh * 0.5);
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

  // Dynamic sheet height based on drag state
  const getSheetStyle = () => {
    return { 
      height: `${sheetHeightPx}px`,
      transition: isDragging.current ? 'none' : 'height 0.3s ease',
    };
  };

  // Format distance for display (distance is in meters from API)
  const formatDistance = (distanceMeters?: number) => {
    if (!distanceMeters || typeof distanceMeters !== 'number') return '';
    // Convert meters to miles (1 mile = 1609.34 meters)
    const distanceMiles = distanceMeters / 1609.34;
    // Validate miles calculation
    if (!isFinite(distanceMiles) || isNaN(distanceMiles)) return '';
    if (distanceMiles < 0.1) {
      // Show in feet for very close places (1 mile = 5280 feet)
      return `${Math.round(distanceMiles * 5280)} ft`;
    }
    return `${distanceMiles.toFixed(1)} mi`;
  };

  // ============================================
  // SIGNAL DISPLAY HELPERS (matches iOS HomeScreen.tsx exactly)
  // ============================================
  type SignalType = 'positive' | 'neutral' | 'negative';

  const getSignalType = (bucket: string): SignalType => {
    const bucketLower = bucket.toLowerCase();
    if (bucketLower === 'the good' || bucketLower.includes('the good')) return 'positive';
    if (bucketLower === 'the vibe' || bucketLower.includes('the vibe')) return 'neutral';
    if (bucketLower === 'heads up' || bucketLower.includes('heads up')) return 'negative';
    // Keyword detection for actual signal names
    if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
        bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
        bucketLower.includes('good') || bucketLower.includes('friendly') ||
        bucketLower.includes('fast') || bucketLower.includes('clean') ||
        bucketLower.includes('fresh') || bucketLower.includes('delicious')) return 'positive';
    if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
        bucketLower.includes('crowded') || bucketLower.includes('loud') ||
        bucketLower.includes('slow') || bucketLower.includes('dirty') ||
        bucketLower.includes('rude') || bucketLower.includes('limited') ||
        bucketLower.includes('wait') || bucketLower.includes('noisy') ||
        bucketLower.includes('heads')) return 'negative';
    return 'neutral';
  };

  const getSignalColor = (bucket: string): string => {
    const type = getSignalType(bucket);
    if (type === 'positive') return '#0A84FF'; // Blue - The Good
    if (type === 'negative') return '#FF9500'; // Orange - Heads Up
    return '#8B5CF6'; // Purple - The Vibe
  };

  const getSignalIcon = (type: SignalType) => {
    if (type === 'positive') return <IoThumbsUp size={12} />;
    if (type === 'negative') return <IoWarning size={12} />;
    return <IoTrendingUp size={12} />;
  };

  // Always returns exactly 4 signals: 2 "The Good" (top row), 1 "The Vibe" + 1 "Heads Up" (bottom row)
  const getDisplaySignals = (signals?: { bucket: string; tap_total: number }[]) => {
    const positive = signals?.filter(s => getSignalType(s.bucket) === 'positive') || [];
    const neutral = signals?.filter(s => getSignalType(s.bucket) === 'neutral') || [];
    const negative = signals?.filter(s => getSignalType(s.bucket) === 'negative') || [];

    const result: { bucket: string; tap_total: number; isEmpty: boolean; type: SignalType }[] = [];

    // TOP ROW: 2 positive signals
    if (positive.length >= 2) {
      result.push({ ...positive[0], isEmpty: false, type: 'positive' });
      result.push({ ...positive[1], isEmpty: false, type: 'positive' });
    } else if (positive.length === 1) {
      result.push({ ...positive[0], isEmpty: false, type: 'positive' });
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true, type: 'positive' });
    } else {
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true, type: 'positive' });
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true, type: 'positive' });
    }

    // BOTTOM ROW: 1 neutral + 1 negative
    if (neutral.length > 0) {
      result.push({ ...neutral[0], isEmpty: false, type: 'neutral' });
    } else {
      result.push({ bucket: 'The Vibe', tap_total: 0, isEmpty: true, type: 'neutral' });
    }

    if (negative.length > 0) {
      result.push({ ...negative[0], isEmpty: false, type: 'negative' });
    } else {
      result.push({ bucket: 'Heads Up', tap_total: 0, isEmpty: true, type: 'negative' });
    }

    return result;
  };

  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Places';

  return (
    <AppLayout>
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
            <div 
              className={`search-bar ${isSearchFocused ? 'focused' : ''}`}
              onClick={() => {
                setShowSearchOverlay(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <FiSearch size={18} className="search-icon" />
              <span className="search-placeholder-text">
                {searchQuery || 'Search places or locations'}
              </span>
              {searchQuery && (
                <button className="clear-btn" onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setSearchSuggestionsList([]);
                  setShowSuggestions(false);
                  // Re-fetch nearby places when clearing search
                  fetchPlaces();
                }}>
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="category-pills">
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

        {/* Search This Area Button */}
        {showSearchThisArea && (
          <button className="search-this-area-btn" onClick={searchThisArea}>
            <FiRefreshCw size={16} />
            <span>Search this area</span>
          </button>
        )}

        {/* Full-Screen Search Overlay */}
        {showSearchOverlay && (
          <div className="search-overlay">
            <div className="search-overlay-header">
              <button className="overlay-back-btn" onClick={() => {
                setShowSearchOverlay(false);
                setShowSuggestions(false);
              }}>
                <FiArrowLeft size={24} />
              </button>
              <div className="overlay-search-bar">
                <FiSearch size={18} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search places or locations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  autoFocus
                />
                {isSearching && <div className="search-spinner" />}
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
            <div className="search-overlay-results">
              {searchSuggestionsList.length > 0 ? (
                searchSuggestionsList.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="overlay-suggestion-item"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="overlay-suggestion-icon">
                      <FiMapPin size={18} />
                    </div>
                    <div className="overlay-suggestion-content">
                      <span className="overlay-suggestion-name">{suggestion.name}</span>
                      <span className="overlay-suggestion-address">
                        {(suggestion as any).address || suggestion.city || suggestion.category || 'Place'}
                      </span>
                    </div>
                    <FiArrowRight size={18} className="overlay-suggestion-arrow" />
                  </button>
                ))
              ) : searchQuery.length >= 2 && !isSearching ? (
                <div className="overlay-no-results">
                  <p>No results found</p>
                  <p className="overlay-no-results-hint">Try a different search term</p>
                </div>
              ) : !searchQuery ? (
                <div className="overlay-hint">
                  <FiSearch size={24} />
                  <p>Search for places, restaurants, cafes...</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

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
              {/* Map Events - detect pan/zoom */}
              <MapEvents onMoveEnd={onMapMoveEnd} />
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
              {places.map((place, index) => {
                const isSelected = selectedPlaceId === place.id || index === 0;
                const markerHtml = `
                  <div style="
                    width: ${isSelected ? '42px' : '36px'};
                    height: ${isSelected ? '42px' : '36px'};
                    background-color: ${isSelected ? '#EF4444' : '#667EEA'};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    border: ${isSelected ? '3px solid white' : 'none'};
                    cursor: pointer;
                  ">
                    <svg width="${isSelected ? '20' : '18'}" height="${isSelected ? '20' : '18'}" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                `;
                
                return place.latitude && place.longitude && L && (
                  <Marker
                    key={place.id}
                    position={[place.latitude, place.longitude]}
                    icon={L.divIcon({
                      html: markerHtml,
                      className: '',
                      iconSize: [isSelected ? 42 : 36, isSelected ? 42 : 36],
                      iconAnchor: [isSelected ? 21 : 18, isSelected ? 42 : 36],
                    })}
                    eventHandlers={{
                      click: () => {
                        setSelectedPlaceId(place.id);
                        // Scroll to the place card
                        const cardElement = document.getElementById(`place-card-${place.id}`);
                        if (cardElement) {
                          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                        }
                      }
                    }}
                  />
                );
              })}
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
          {/* Draggable Handle — tap to toggle between collapsed/half */}
          <div 
            className="sheet-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onClick={() => {
              // Tap to toggle: if collapsed → expand to half, if half/expanded → collapse
              if (sheetHeightPx <= SNAP_COLLAPSED + 20) {
                setSheetHeightPx(SNAP_HALF);
              } else {
                setSheetHeightPx(SNAP_COLLAPSED);
              }
            }}
          >
            <div className="handle-bar" />
            <span className="handle-hint">{sheetHeightPx <= SNAP_COLLAPSED + 20 ? 'Swipe up for places' : ''}</span>
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
            <p className="places-count">
              {searchQuery 
                ? `${places.length} result${places.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : `${places.length} places nearby`
              }
            </p>
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
                <div 
                  key={place.id} 
                  id={`place-card-${place.id}`}
                  className={`place-card ${selectedPlaceId === place.id ? 'selected' : ''}`}
                  onClick={() => {
                    console.log('[MapScreen] Place card clicked:', place.id);
                    router.push(`/place/${place.id}`);
                  }}
                >
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
                    {getDisplaySignals(place.signals as any).map((signal, idx) => (
                      <div key={`${place.id}-sig-${idx}`} className="signal-pill-wrapper">
                        <button 
                          className={`signal-btn ${signal.type === 'positive' ? 'the-good' : signal.type === 'neutral' ? 'the-vibe' : 'heads-up'}`}
                          style={{ opacity: signal.isEmpty ? 0.6 : 1 }}
                        >
                          {getSignalIcon(signal.type)}
                          <span className={signal.isEmpty ? 'signal-empty' : ''}>
                            {signal.isEmpty ? 'Be the first to tap!' : signal.bucket}
                          </span>
                        </button>
                        {!signal.isEmpty && signal.tap_total > 0 && (
                          <span className="signal-tap-count">x{signal.tap_total}</span>
                        )}
                      </div>
                    ))}
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
          bottom: 85px;
          background: ${bgColor};
        }
        @media (max-width: 768px) {
          .map-screen {
            bottom: 70px;
          }
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

        /* Search placeholder text in the bar */
        .search-placeholder-text {
          flex: 1;
          font-size: 15px;
          color: ${isDark ? '#666' : '#A0A0A0'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: text;
        }

        /* Search This Area Button */
        .search-this-area-btn {
          position: absolute;
          top: calc(max(12px, env(safe-area-inset-top)) + 100px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 1002;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(0, 122, 255, 0.9);
          color: #fff;
          border: none;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
          backdrop-filter: blur(12px);
          transition: all 0.2s;
          animation: fadeInDown 0.3s ease;
        }

        .search-this-area-btn:hover {
          background: rgba(0, 122, 255, 1);
          box-shadow: 0 6px 24px rgba(0, 122, 255, 0.5);
        }

        .search-this-area-btn:active {
          transform: translateX(-50%) scale(0.95);
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Full-Screen Search Overlay */
        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${isDark ? 'rgba(0,0,0,0.97)' : 'rgba(255,255,255,0.98)'};
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .search-overlay-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: max(16px, env(safe-area-inset-top)) 16px 12px;
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA'};
        }

        .overlay-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7'};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${isDark ? '#fff' : '#333'};
          flex-shrink: 0;
        }

        .overlay-search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          background: ${isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7'};
          border-radius: 10px;
          padding: 10px 14px;
          gap: 10px;
        }

        .overlay-search-bar input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 16px;
          color: ${isDark ? '#fff' : '#111'};
          outline: none;
        }

        .overlay-search-bar input::placeholder {
          color: ${isDark ? '#666' : '#A0A0A0'};
        }

        .search-overlay-results {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .overlay-suggestion-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .overlay-suggestion-item:hover {
          background: ${isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F7'};
        }

        .overlay-suggestion-item:not(:last-child) {
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F7'};
        }

        .overlay-suggestion-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(0, 122, 255, 0.2)' : '#E8F4FF'};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: ${BLUE};
        }

        .overlay-suggestion-content {
          flex: 1;
          min-width: 0;
        }

        .overlay-suggestion-name {
          display: block;
          font-size: 16px;
          font-weight: 500;
          color: ${isDark ? '#fff' : '#111'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .overlay-suggestion-address {
          display: block;
          font-size: 13px;
          color: ${isDark ? '#888' : '#666'};
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .overlay-suggestion-arrow {
          flex-shrink: 0;
          color: ${isDark ? '#555' : '#C7C7CC'};
        }

        .overlay-no-results {
          text-align: center;
          padding: 60px 20px;
          color: ${isDark ? '#888' : '#666'};
        }

        .overlay-no-results p:first-child {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .overlay-no-results-hint {
          font-size: 14px;
          color: ${isDark ? '#555' : '#999'};
          margin: 0;
        }

        .overlay-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: ${isDark ? '#555' : '#C7C7CC'};
          gap: 12px;
        }

        .overlay-hint p {
          font-size: 15px;
          margin: 0;
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
          bottom: 16px;
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
          bottom: 16px;
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
          bottom: 76px;
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
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          will-change: height;
          overflow: hidden;
        }

        .sheet-handle {
          padding: 14px 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: grab;
          user-select: none;
          touch-action: none;
          flex-shrink: 0;
        }

        .sheet-handle:hover {
          background: rgba(0,0,0,0.03);
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
          flex-shrink: 0;
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

        .place-card.selected {
          border: 2px solid #667EEA;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
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
          display: grid;
          grid-template-columns: 1fr 1fr;
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

        .signal-btn.the-good {
          background: #0A84FF;
          color: #fff;
        }

        .signal-btn.the-vibe {
          background: #8B5CF6;
          color: #fff;
        }

        .signal-btn.heads-up {
          background: #FF9500;
          color: #fff;
        }

        .signal-pill-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .signal-tap-count {
          font-size: 11px;
          font-weight: 600;
          color: ${isDark ? '#999' : '#666'};
          white-space: nowrap;
        }

        .signal-empty {
          font-style: italic;
          opacity: 0.8;
        }
      `}</style>
    </AppLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
