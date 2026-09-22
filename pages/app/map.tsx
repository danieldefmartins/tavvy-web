import Link from 'next/link';
import { DEMO_RESTAURANT_HREF, shouldOfferDemoRestaurant } from '../../lib/demoPlace';
import { canGoBackInApp } from '../../hooks/useAppNavigationHistory';
import { parseSearchQuery } from '../../lib/smartQueryParser';
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
import SignalMatrix from '../../components/SignalMatrix';
import SignalCard from '../../components/SignalCard';
import { canonicalPlaceId, distanceKm, validCoordinates } from '../../lib/searchIntent';
import { usePlacePreviewSummaries } from '../../hooks/usePlacePreviewSummaries';
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
const ACCENT_GREEN = '#00C2CB';  // Tavvy teal
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
  { id: 'cafes', name: 'Cafes', icon: IoCafe, color: '#8A05BE' },
  { id: 'bars', name: 'Bars', icon: IoBeer, color: '#F59E0B' },
  { id: 'gas', name: 'Gas', icon: IoCarSport, color: '#8A05BE' },
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
  const locale = router.locale || 'en';
  const { t } = useTranslation('common');
  const { theme, isDark } = useThemeContext();
  
  // Map states
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_LOCATION);
  const [mapZoom, setMapZoom] = useState(14);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [showDemoFallback, setShowDemoFallback] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState('This map area');
  const actualCoordinatesRef = useRef<[number, number] | null>(null);
  const restoredMapRef = useRef(false);
  const [loadedRoute, setLoadedRoute] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const searchRowRef = useRef<HTMLDivElement>(null);
  const restoreListScrollRef = useRef(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchSuggestionsList, setSearchSuggestionsList] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchIntentRef = useRef(false);
  const placesRequestRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapBoundsRef = useRef<{ minLat: number; maxLat: number; minLng: number; maxLng: number; center: [number, number] } | null>(null);
  const initialLoadDone = useRef(false);

  // URL owns each submitted search. Back/Forward can restore a prior map entry.
  useEffect(() => {
    if (!router.isReady) return;
    ++placesRequestRef.current;
    setLoadedRoute('');
    setShowSuggestions(false); setShowSearchOverlay(false); setSearchMessage(''); setShowDemoFallback(false);
    try {
      const stored = JSON.parse(sessionStorage.getItem(`tavvy:map:${router.asPath}`) || 'null');
      if (stored && Array.isArray(stored.places) && !stored.places.some((place: any) => place.evidenceStatus === 'loading') && Date.now() - stored.at < 120000) {
        restoredMapRef.current = true; searchIntentRef.current = Boolean(router.query.q);
        setSearchQuery(stored.query); setShowDemoFallback(stored.demoFallback === true); setSelectedPlaceId(null); setPlaces(stored.places); setMapCenter(stored.center); setMapZoom(stored.zoom);
        setSheetHeightPx(Math.max(SNAP_COLLAPSED, Math.min(stored.height, getSnapPoints()[2]))); setSelectedCategory(stored.category); setResolvedLocation(stored.label);
        restoreListScrollRef.current = stored.scrollTop || 0; setLoadedRoute(router.asPath); setLoading(false); return;
      }
    } catch {}
    restoredMapRef.current = false; restoreListScrollRef.current = 0;
    const q = typeof router.query.q === 'string' ? router.query.q.trim() : '';
    setSearchQuery(q); setSelectedPlaceId(null);
    if (q) { searchIntentRef.current = true; setSelectedCategory('all'); void runSearch(q); }
    else { searchIntentRef.current = false; const category = typeof router.query.category === 'string' ? router.query.category : 'all'; setSelectedCategory(category); void fetchPlaces(category); }
    // runSearch/fetchPlaces read the current URL; result generations discard earlier responses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.asPath]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [openNow, setOpenNow] = useState(false);
  const [cuisine, setCuisine] = useState('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  
  // Places data
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const previewSummaries = usePlacePreviewSummaries(places);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  
  // Bottom sheet states - draggable with 3 snap points matching iOS
  // Snap points: collapsed (120px peek), half (50vh), expanded (85vh)
  const SNAP_COLLAPSED = 120;
  const SNAP_HALF = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400;
  const [sheetHeightPx, setSheetHeightPx] = useState(SNAP_HALF);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!router.isReady || loading || loadedRoute !== router.asPath) return;
    const save = () => { try { sessionStorage.setItem(`tavvy:map:${router.asPath}`, JSON.stringify({ at: Date.now(), query: typeof router.query.q === 'string' ? router.query.q : '', places, center: mapCenter, zoom: mapZoom, height: sheetHeightPx, category: selectedCategory, label: resolvedLocation, scrollTop: listRef.current?.scrollTop || 0, demoFallback: showDemoFallback })); } catch {} };
    save(); window.addEventListener('pagehide', save); router.events.on('routeChangeStart', save);
    const list = listRef.current; let timer: ReturnType<typeof setTimeout> | undefined;
    const scroll = () => { if (!timer) timer = setTimeout(() => { timer = undefined; save(); }, 120); };
    list?.addEventListener('scroll', scroll, { passive: true });
    return () => { if (timer) clearTimeout(timer); window.removeEventListener('pagehide', save); router.events.off('routeChangeStart', save); list?.removeEventListener('scroll', scroll); };
  }, [router.asPath, router.isReady, loading, places, mapCenter, mapZoom, sheetHeightPx, selectedCategory, resolvedLocation, loadedRoute, showDemoFallback]);

  useEffect(() => {
    if (!loading && listRef.current && restoreListScrollRef.current) { listRef.current.scrollTop = restoreListScrollRef.current; restoreListScrollRef.current = 0; }
  }, [loading, places]);

  // --- Smooth, velocity-aware bottom-sheet dragging ---
  // During a drag we write the height straight to the DOM (rAF-coalesced) so we
  // never trigger a React re-render per frame. On release we pick a snap point
  // based on the FLICK velocity (not just nearest), then let one CSS transition
  // settle it with an iOS-style spring curve.
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);          // px/ms, positive = dragging upward (growing)
  const didDrag = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const mouseCleanupRef = useRef<(() => void) | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingHeight = useRef<number | null>(null);
  const SHEET_EASE = 'height 0.42s cubic-bezier(0.32, 0.72, 0, 1)';

  const getSnapPoints = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewport = mapViewportRef.current?.getBoundingClientRect();
    const searchRow = searchRowRef.current?.getBoundingClientRect();
    // Keep search and Back reachable above the expanded sheet, including landscape.
    const available = viewport && searchRow ? viewport.bottom - searchRow.bottom - 8 : vh * .88;
    const maximum = Math.max(SNAP_COLLAPSED, Math.min(vh * .88, available));
    return [SNAP_COLLAPSED, Math.min(vh * .5, maximum), maximum];
  };

  const flushHeight = () => {
    rafId.current = null;
    if (pendingHeight.current != null && sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.height = `${pendingHeight.current}px`;
    }
  };

  const chooseSnap = (height: number, vel: number) => {
    const snaps = getSnapPoints().sort((a, b) => a - b);
    const FLICK = 0.28; // px/ms — easier to flick the sheet up/down
    if (vel > FLICK) return snaps.find((s) => s > height + 8) ?? snaps[snaps.length - 1];
    if (vel < -FLICK) return [...snaps].reverse().find((s) => s < height - 8) ?? snaps[0];
    return snaps.reduce((best, s) => (Math.abs(s - height) < Math.abs(best - height) ? s : best), snaps[0]);
  };

  const beginDrag = (clientY: number) => {
    isDragging.current = true;
    didDrag.current = false;
    dragStartY.current = clientY;
    dragStartHeight.current = sheetRef.current
      ? sheetRef.current.getBoundingClientRect().height
      : sheetHeightPx;
    lastY.current = clientY;
    lastT.current = performance.now();
    velocity.current = 0; pendingHeight.current = null;
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging.current) return;
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) {
      const v = (lastY.current - clientY) / dt; // upward positive
      velocity.current = velocity.current * 0.7 + v * 0.3; // smoothed
    }
    lastY.current = clientY;
    lastT.current = now;

    const deltaY = dragStartY.current - clientY;
    if (Math.abs(deltaY) > 5) didDrag.current = true;

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const min = SNAP_COLLAPSED;
    const max = getSnapPoints()[2];
    let newHeight = dragStartHeight.current + deltaY;
    // Rubber-band resistance past the limits so it feels elastic, not stuck.
    if (newHeight < min) newHeight = min - (min - newHeight) * 0.35;
    if (newHeight > max) newHeight = max + (newHeight - max) * 0.18;
    newHeight = Math.max(70, Math.min(newHeight, vh * 0.95));

    pendingHeight.current = newHeight;
    if (rafId.current == null) rafId.current = requestAnimationFrame(flushHeight);
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (rafId.current != null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    const currentHeight = pendingHeight.current ?? sheetRef.current?.getBoundingClientRect().height ?? sheetHeightPx;
    const target = chooseSnap(currentHeight, performance.now() - lastT.current > 100 ? 0 : velocity.current);
    pendingHeight.current = null;
    if (didDrag.current) suppressClickUntilRef.current = performance.now() + 350;
    if (sheetRef.current) {
      sheetRef.current.style.transition = SHEET_EASE;
      sheetRef.current.style.height = `${target}px`;
    }
    setSheetHeightPx(target);
  };

  // Handle event bindings (whole header is grabbable, not just the pill)
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    beginDrag(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => moveDrag(e.touches[0].clientY);
  const handleTouchEnd = () => endDrag();
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    e.preventDefault(); mouseCleanupRef.current?.();
    beginDrag(e.clientY);
    const onMove = (ev: MouseEvent) => moveDrag(ev.clientY);
    const onUp = () => {
      endDrag();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    mouseCleanupRef.current = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  
  // Let a list gesture expand the sheet first; at full height native scrolling takes over.
  // A downward gesture at the top collapses it. Horizontal filters/buttons remain ordinary controls.
  useEffect(() => {
    const list = listRef.current; if (!list) return;
    let startY = 0, startX = 0, tracking = false, draggingList = false;
    const start = (event: TouchEvent) => { if (event.touches.length !== 1) return; startY = event.touches[0].clientY; startX = event.touches[0].clientX; tracking = true; draggingList = false; };
    const move = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const touch = event.touches[0], delta = startY - touch.clientY;
      if (!draggingList) {
        if (Math.abs(delta) < 8 || Math.abs(delta) < Math.abs(startX - touch.clientX)) return;
        const height = sheetRef.current?.getBoundingClientRect().height || 0;
        const atTop = list.scrollTop <= 1;
        if (!atTop || (delta > 0 && height >= getSnapPoints()[2] - 8)) return;
        draggingList = true; beginDrag(startY);
      }
      if (event.cancelable) event.preventDefault();
      moveDrag(touch.clientY);
    };
    const end = () => { tracking = false; if (draggingList) endDrag(); draggingList = false; };
    list.addEventListener('touchstart', start, { passive: true });
    list.addEventListener('touchmove', move, { passive: false });
    list.addEventListener('touchend', end); list.addEventListener('touchcancel', end);
    return () => { list.removeEventListener('touchstart', start); list.removeEventListener('touchmove', move); list.removeEventListener('touchend', end); list.removeEventListener('touchcancel', end); if (rafId.current != null) cancelAnimationFrame(rafId.current); };
    // DOM refs and drag handlers read current measurements; no per-frame React updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const resize = () => { if (!isDragging.current) setSheetHeightPx(height => Math.max(SNAP_COLLAPSED, Math.min(height, getSnapPoints()[2]))); };
    window.addEventListener('resize', resize); return () => { window.removeEventListener('resize', resize); mouseCleanupRef.current?.(); };
  }, []);

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
          actualCoordinatesRef.current = loc;
          setUserLocation(loc);
          if (!searchIntentRef.current) setMapCenter(loc);
        },
        (error) => {
          setSearchMessage('Location access was unavailable. Search a city or move the map.');
        }
      );
    }
    setMapReady(true);
  }, []);

  // Fetch places when location or category changes
  useEffect(() => {
    if (router.isReady && !searchIntentRef.current && !restoredMapRef.current) fetchPlaces(typeof router.query.category === 'string' ? router.query.category : 'all');
    // Category/URL changes are handled by the route effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Handle search input with debounce for autocomplete
  useEffect(() => {
    const controller = new AbortController();
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (showSearchOverlay && searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          // Use API route for search suggestions
          const params = new URLSearchParams({
            q: searchQuery,
            ...(actualCoordinatesRef.current ? { userLat: actualCoordinatesRef.current[0].toString(), userLng: actualCoordinatesRef.current[1].toString() } : {}),
            limit: '8', evidence: 'defer',
          });
          
          if (!parseSearchQuery(searchQuery).useCurrentLocation) for (const [key, apiKey] of [['where','where'],['location','location'],['lat','userLat'],['lng','userLng'],['minLat','minLat'],['maxLat','maxLat'],['minLng','minLng'],['maxLng','maxLng']]) {
            if (typeof router.query[key] === 'string') params.set(apiKey, router.query[key] as string);
          }
          const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
          const data = await response.json();
          
          if (!controller.signal.aborted && data.suggestions) {
            setSearchSuggestionsList(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          if (!controller.signal.aborted) console.error('Error fetching suggestions:', error);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      }, 180);
    } else {
      setSearchSuggestionsList([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      controller.abort();
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, userLocation, showSearchOverlay, router.asPath]);

  const fetchPlaces = async (category = selectedCategory) => {
    const requestId = ++placesRequestRef.current;
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
      
      const categoryFilter = category !== 'all' ? 
        categoryMap[category] : undefined;
      
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
        if (requestId === placesRequestRef.current && !searchIntentRef.current) setPlaces([]);
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
        if (requestId === placesRequestRef.current && !searchIntentRef.current) { setPlaces(uniquePlaces); setLoadedRoute(router.asPath); }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      if (requestId === placesRequestRef.current && !searchIntentRef.current) setPlaces([]);
    } finally {
      if (requestId === placesRequestRef.current && !searchIntentRef.current) setLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    void router.push({ pathname: '/app/map', query: categoryId === 'all' ? {} : { category: categoryId } }, undefined, { shallow: true });
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
    const bounds = mapBoundsRef.current;
    if (!bounds) return;
    const query = parseSearchQuery(searchQuery).placeName || (selectedCategory === 'all' ? '*' : selectedCategory);
    navigateMapSearch(query, { location: 'map', minLat: String(bounds.minLat), maxLat: String(bounds.maxLat), minLng: String(bounds.minLng), maxLng: String(bounds.maxLng), userLat: String(bounds.center[0]), userLng: String(bounds.center[1]) });
  };

  // Give an autocomplete selection its own history entry while keeping it on the map.
  const handleSuggestionSelect = (suggestion: SearchResult) => {
    navigateMapSearch(suggestion.name, suggestion.id ? { selected: suggestion.id } : undefined);
  };

  // Handle search submit (Enter key) — search and show results on map
  const runSearch = async (query: string) => {
    if (query.trim()) {
      searchIntentRef.current = true;
      const requestId = ++placesRequestRef.current;
      setShowSuggestions(false);
      setShowSearchOverlay(false);
      setLoading(true); setLoadedRoute(''); setSearchMessage(''); setShowDemoFallback(false);
      setSheetHeightPx(getSnapPoints()[1]);
      
      try {
        // Search via API (same endpoint as autocomplete, but with higher limit)
        const params = new URLSearchParams({
          q: query.trim(),
          ...(actualCoordinatesRef.current ? { userLat: String(actualCoordinatesRef.current[0]), userLng: String(actualCoordinatesRef.current[1]) } : {}),
          limit: '30', evidence: 'defer',
        });
        
        for (const [key, apiKey] of [['where','where'],['need','need'],['location','location'],['lat','userLat'],['lng','userLng'],['minLat','minLat'],['maxLat','maxLat'],['minLng','minLng'],['maxLng','maxLng']]) {
          if (typeof router.query[key] === 'string') params.set(apiKey, router.query[key] as string);
        }
        if (parseSearchQuery(query).useCurrentLocation) {
          // A map center is not a device fix, even when an earlier route supplied lat/lng.
          const point = actualCoordinatesRef.current || await new Promise<[number, number]>((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('Location is unavailable. Enter a city instead.')); return; }
            navigator.geolocation.getCurrentPosition(position => resolve([position.coords.latitude, position.coords.longitude]), () => reject(new Error('Location access was not available. Enter a city instead.')), { timeout: 10000 });
          });
          if (requestId !== placesRequestRef.current) return;
          actualCoordinatesRef.current = point;
          for (const key of ['where','minLat','maxLat','minLng','maxLng']) params.delete(key);
          params.set('location', 'current'); params.set('userLat', String(point[0])); params.set('userLng', String(point[1]));
        }
        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();
        
        if (!response.ok || !Array.isArray(data.suggestions)) throw new Error(data.error || 'Search unavailable');
        if (requestId !== placesRequestRef.current) return;
        setResolvedLocation(data.location?.label || 'Any location'); setLoadedRoute(router.asPath);
        setShowDemoFallback(shouldOfferDemoRestaurant(query, data.suggestions, data.partial));
        setSearchQuery(query);
        if (data.suggestions.length > 0) {
          // Convert search suggestions to PlaceCardType for the map
          const searchPlaces: PlaceCardType[] = data.suggestions
            .filter((s: any) => typeof router.query.selected !== 'string' || s.id === router.query.selected)
            .filter((s: any) => typeof s.id === 'string' && s.id.trim() && Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
            .map((s: any) => ({
              ...s,
              id: s.id,
              name: s.name,
              latitude: s.latitude,
              longitude: s.longitude,
              category: s.category || 'Place',
              city: s.city || '',
              address: s.address || '',
              distance: s.distance,
              signals: s.signals || [],
              topSignals: s.topSignals || [],
              evidenceStatus: s.evidenceStatus,
            }));
          
          if (requestId === placesRequestRef.current) setPlaces(searchPlaces);
          
          // Center map on first result
          if (searchPlaces[0] && requestId === placesRequestRef.current) {
            setMapCenter([searchPlaces[0].latitude, searchPlaces[0].longitude]);
            setMapZoom(14);
            setSelectedPlaceId(searchPlaces[0].id);
          }
          
          console.log(`[MapScreen] Search "${query}" returned ${searchPlaces.length} places on map`);
          setLoading(false);
          if (data.evidencePending) {
            params.set('evidence', 'full');
            try {
              const enrichedResponse = await fetch(`/api/search?${params}`);
              const enriched = await enrichedResponse.json();
              if (!enrichedResponse.ok || !Array.isArray(enriched.suggestions)) throw new Error('Guest reports unavailable');
              if (requestId === placesRequestRef.current) {
                const byId = new Map(enriched.suggestions.map((place: any) => [place.id, place]));
                const updated = searchPlaces.map(place => ({ ...place, ...(byId.get(place.id) as any || { evidenceStatus: 'unavailable' }) }));
                if (params.get('need')) updated.sort((a: any,b: any) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
                setPlaces(updated);
              }
            } catch { if (requestId === placesRequestRef.current) setPlaces(previous => previous.map(place => ({ ...place, evidenceStatus: 'unavailable' }))); }
          }
        } else {
          console.log(`[MapScreen] Search "${query}" returned no results`);
          if (requestId === placesRequestRef.current) setPlaces([]);
        }
      } catch (error) {
        console.error('[MapScreen] Search error:', error);
        if (requestId === placesRequestRef.current) { setPlaces([]); setSearchMessage(error instanceof Error ? error.message : 'Search unavailable'); }
      } finally {
        if (requestId === placesRequestRef.current) setLoading(false);
      }
      
      // Evidence may finish later; preserve the user's current sheet position.
    }
  };
  const navigateMapSearch = (query: string, override?: Record<string, string>) => {
    if (!query.trim()) return;
    const next: Record<string, string> = { q: query.trim() };
    const parsed = parseSearchQuery(query);
    if (!parsed.city && !parsed.useCurrentLocation) {
      for (const key of ['where','need','location','lat','lng','minLat','maxLat','minLng','maxLng']) if (typeof router.query[key] === 'string') next[key] = router.query[key] as string;
    }
    if (!parsed.city && !next.lat && actualCoordinatesRef.current) { next.lat = String(actualCoordinatesRef.current[0]); next.lng = String(actualCoordinatesRef.current[1]); }
    if (parsed.useCurrentLocation) next.location = 'current';
    if (override) { if (override.location === 'map') { delete next.where; for (const key of ['minLat','maxLat','minLng','maxLng']) delete next[key]; } for (const [key,value] of Object.entries(override)) next[key === 'userLat' ? 'lat' : key === 'userLng' ? 'lng' : key] = value; }
    setShowSearchOverlay(false); setShowSuggestions(false);
    const unchanged = Object.keys(router.query).length === Object.keys(next).length && Object.entries(next).every(([key,value]) => router.query[key] === value);
    if (unchanged) void runSearch(query);
    else void router.push({ pathname: '/app/map', query: next }, undefined, { shallow: true });
  };
  const handleSearch = () => { navigateMapSearch(searchQuery); };

  // Center on user location - request fresh geolocation
  const centerOnUser = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          actualCoordinatesRef.current = loc;
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
    if (canGoBackInApp()) router.back(); else void router.replace('/app', undefined, { locale });
  };

  // Dynamic sheet height based on drag state
  const getSheetStyle = () => {
    return {
      height: `${sheetHeightPx}px`,
      transition: isDragging.current ? 'none' : SHEET_EASE,
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
    if (type === 'positive') return '#00C2CB'; // Teal - The Good
    if (type === 'negative') return '#F5A623'; // Amber - Heads Up
    return '#8A05BE'; // Purple - The Vibe
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

      <div className="map-screen" ref={mapViewportRef}>
        {/* Top Controls */}
        <div className="top-controls">
          {/* Back Button & Search Bar */}
          <div className="search-row" ref={searchRowRef}>
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
              <span
                className="search-placeholder-text"
                style={{
                  color: searchQuery
                    ? (isDark ? '#FFFFFF' : '#111111')
                    : (isDark ? '#9A9AA0' : '#8A8A8E'),
                  fontWeight: searchQuery ? 600 : 400,
                }}
              >
                {searchQuery || 'Search places or locations'}
              </span>
              {searchQuery && (
                <button className="clear-btn" onClick={(e) => {
                  e.stopPropagation();
                  setSearchSuggestionsList([]); setShowSuggestions(false);
                  void router.push('/app/map', undefined, { shallow: true });
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
                    setSearchSuggestionsList([]); setShowSuggestions(false); setShowSearchOverlay(false);
                    void router.push('/app/map', undefined, { shallow: true });
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
                    <div className="legend-dot" style={{ background: '#8A05BE' }}></div>
                    <span>Cafes</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#F59E0B' }}></div>
                    <span>Bars</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#8A05BE' }}></div>
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
          onClickCapture={event => { if (performance.now() < suppressClickUntilRef.current) { event.preventDefault(); event.stopPropagation(); } }}
        >
        {searchMessage && <p role="status" className="search-scope">{searchMessage}</p>}
        {/* Draggable Handle — drag anywhere on this header; tap to toggle */}
          <div
            className="sheet-handle"
            role="button" tabIndex={0} aria-label="Resize search results" aria-expanded={sheetHeightPx > SNAP_COLLAPSED + 20}
            onKeyDown={event => {
              if (['ArrowUp','ArrowDown','Home','End','Enter',' '].includes(event.key)) {
                event.preventDefault(); const snaps = getSnapPoints();
                const target = event.key === 'Home' ? snaps[0] : event.key === 'End' ? snaps[2] : event.key === 'ArrowUp' ? snaps.find(h => h > sheetHeightPx + 8) ?? snaps[2] : event.key === 'ArrowDown' ? [...snaps].reverse().find(h => h < sheetHeightPx - 8) ?? snaps[0] : sheetHeightPx <= SNAP_COLLAPSED + 20 ? snaps[1] : snaps[0];
                setSheetHeightPx(target);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onClick={() => {
              // Ignore the click that follows a real drag — only treat true taps as toggles
              if (performance.now() < suppressClickUntilRef.current) return;
              didDrag.current = false;
              const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
              if (sheetHeightPx <= SNAP_COLLAPSED + 20) {
                setSheetHeightPx(vh * 0.5);
              } else {
                setSheetHeightPx(SNAP_COLLAPSED);
              }
            }}
          >
            <div className="handle-bar" />
            <span className="handle-hint">{sheetHeightPx <= SNAP_COLLAPSED + 20 ? 'Swipe up for places' : ''}</span>
          </div>

          {/* The full header is a grab area, including the title. */}
          <div className="sheet-header" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd} onMouseDown={handleMouseDown}>
            <div><h2 className="sheet-title">{categoryName}</h2><p style={{fontSize:12,color:theme.textSecondary,margin:'4px 0 0'}}>{resolvedLocation}</p></div>
            {selectedCategory !== 'all' && (
              <button className="close-btn" onClick={() => handleCategorySelect('all')}>
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
          <div className="places-list" ref={listRef}>
            {loading ? (
              <div className="loading">
                <div className="spinner" />
                <p>Discovering places...</p>
              </div>
            ) : places.length === 0 ? (
              <div className="empty-state">
                {showDemoFallback ? <Link className="demo-fallback" href={DEMO_RESTAURANT_HREF}><strong>Trattoria Tavvy</strong><span>Illustrative demo</span><span>View demo →</span></Link> : <><p>{searchMessage || `No places found · ${resolvedLocation}`}</p><p className="empty-hint">Try zooming out or searching for a specific place</p></>}
              </div>
            ) : (
              places.map((place) => (
                <SignalCard
                  key={place.id}
                  place={{ ...place,
                    distance: actualCoordinatesRef.current && validCoordinates(place) ? distanceKm({latitude:actualCoordinatesRef.current[0],longitude:actualCoordinatesRef.current[1]},place)*1000 : place.distance,
                    distanceLabel: actualCoordinatesRef.current ? 'Straight-line distance from your location' : 'Straight-line distance from the search location',
                    reviewSummary: (place as any).reviewSummary || previewSummaries[place.id] } as any}
                  onClick={() => router.push(`/app/place/${encodeURIComponent(canonicalPlaceId(place.id))}`, undefined, { locale })}
                />
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
          background: ${isDark ? 'rgba(44,44,46,0.92)' : 'rgba(255,255,255,0.97)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)'};
          border-radius: 10px;
          padding: 10px 14px;
          gap: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          backdrop-filter: blur(12px);
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
          background: linear-gradient(135deg, #121212 0%, #16213e 100%);
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
        .demo-fallback { display: flex; flex-direction: column; gap: 8px; padding: 18px; color: ${theme.text}; background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: 14px; text-decoration: none; }
        .search-scope { display: flex; gap: 10px; padding: 8px 16px; align-items: center; color: ${theme.text}; font-size: 13px; }
        .search-scope button { padding: 8px 10px; background: ${theme.surface}; color: inherit; border: 1px solid ${theme.border}; border-radius: 9px; }
        .bottom-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${isDark ? '#1C1C1E' : '#fff'};
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -4px 24px rgba(0,0,0,${isDark ? '0.5' : '0.15'});
          border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'transparent'};
          z-index: 1001;
          display: flex;
          flex-direction: column;
          will-change: height;
          overflow: hidden;
        }

        .sheet-handle {
          padding: 12px 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: grab;
          user-select: none;
          touch-action: none;
          flex-shrink: 0;
        }

        .sheet-handle:focus-visible { outline: 3px solid ${ACCENT_CYAN}; outline-offset: -3px; }
        @media (prefers-reduced-motion: reduce) { .bottom-sheet { transition-duration: 0.01ms !important; } }
        .sheet-handle:active {
          cursor: grabbing;
        }

        .handle-bar {
          width: 44px;
          height: 5px;
          background: ${isDark ? '#5A5A5E' : '#D1D1D6'};
          border-radius: 3px;
          transition: background 0.2s, width 0.2s;
        }

        .sheet-handle:hover .handle-bar {
          background: ${isDark ? '#7A7A7E' : '#B0B0B6'};
          width: 52px;
        }

        .handle-hint {
          font-size: 11px;
          color: ${isDark ? '#8E8E93' : '#8E8E93'};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px 12px;
          flex-shrink: 0;
          min-height: 56px;
          cursor: grab;
          user-select: none;
          touch-action: none;
        }
        .sheet-header:active { cursor: grabbing; }

        .sheet-title {
          font-size: 24px;
          font-weight: 700;
          color: ${isDark ? '#fff' : '#111'};
          margin: 0;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7'};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${isDark ? '#ccc' : '#666'};
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
          flex-shrink: 0;
        }

        .filter-row::-webkit-scrollbar {
          display: none;
        }

        .filter-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: ${isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7'};
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${isDark ? '#ddd' : '#333'};
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
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#E5E5EA'};
          background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
          font-size: 14px;
          font-weight: 500;
          color: ${isDark ? '#ddd' : '#333'};
          cursor: pointer;
          white-space: nowrap;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          background: ${isDark ? '#2C2C2E' : '#fff'};
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,${isDark ? '0.4' : '0.15'});
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
          color: ${isDark ? '#ddd' : '#333'};
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: ${isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F7'};
        }

        .dropdown-item.selected {
          color: ${ACCENT_CYAN};
          font-weight: 600;
        }

        .filter-pill {
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#E5E5EA'};
          background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
          font-size: 14px;
          font-weight: 500;
          color: ${isDark ? '#ddd' : '#333'};
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
          color: ${isDark ? '#9A9AA0' : '#666'};
          margin: 0;
        }

        /* Places List */
        .places-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior-y: contain;
          -webkit-overflow-scrolling: touch;
          padding: 0 20px 20px;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: ${isDark ? '#9A9AA0' : '#666'};
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
          color: ${isDark ? '#9A9AA0' : '#666'};
        }

        .empty-hint {
          font-size: 14px;
          color: ${isDark ? '#6A6A70' : '#999'};
          margin-top: 8px;
        }

        /* Place Card */
        .place-card {
          background: ${isDark ? '#2C2C2E' : '#fff'};
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,${isDark ? '0.3' : '0.08'});
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
          color: ${isDark ? '#fff' : '#111'};
          margin: 0 0 4px;
        }

        .place-category {
          font-size: 14px;
          color: ${isDark ? '#9A9AA0' : '#666'};
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
          background: #00C2CB;
          color: #fff;
        }

        .signal-btn.the-vibe {
          background: #8A05BE;
          color: #fff;
        }

        .signal-btn.heads-up {
          background: #F5A623;
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
