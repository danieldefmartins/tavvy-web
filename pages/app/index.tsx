import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import featureCards from '../../config/featureCards.json';
import discovery from '../../config/discovery.json';
/**
 * Home Screen - Main app entry point
 * Pixel-perfect port from tavvy-mobile/screens/HomeScreen.tsx
 * 
 * Features:
 * - Navy header with Tavvy logo
 * - Standard/Map view toggle
 * - "Find a place that fits your moment" title
 * - Search bar with autocomplete
 * - Category icon row
 * - Stories row
 * - What's Happening Now carousel
 * - Trending Near You section
 * - Explore Tavvy section
 * - Did You Know card
 * - Top Contributors section
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { parseSearchQuery } from '../../lib/smartQueryParser';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { fetchPlacesInBounds, PlaceCard as PlaceCardType } from '../../lib/placeService';
import { DEMO_RESTAURANT_HREF, matchesDemoRestaurantQuery } from '../../lib/demoPlace';
import Onboarding, { useOnboarding } from '../../components/Onboarding';
import { spacing, borderRadius, Colors } from '../../constants/Colors';
import { 
  FiSearch, FiX, FiMapPin, FiUser, FiChevronRight, FiMenu,
  FiCoffee, FiHome as FiHotel, FiShoppingBag, FiDroplet
} from 'react-icons/fi';
import {
  IoRestaurant, IoCafe, IoBeer, IoCarSport, IoBed,
  IoBonfire, IoStorefront, IoSparkles, IoChevronForward,
  IoLocationSharp, IoSearch,
  IoRocket, IoPlanet, IoConstruct, IoBusiness, IoEarth, IoRadio
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// ============================================
// CONSTANTS
// ============================================

// Theme colors matching mobile app
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#000000'; // Pure black for dark mode
const ACCENT = '#17013A';
const TEAL = '#14B8A6';
const GREEN = '#00C2CB';

// Categories for filtering - matching mobile app with icons
const categoriesDef = [
  { id: 'restaurants', nameKey: 'categories.restaurants', apiName: 'Restaurants', icon: IoRestaurant, color: '#EF4444' },
  { id: 'cafes', nameKey: 'categories.cafes', apiName: 'Cafes', icon: IoCafe, color: '#8A05BE' },
  { id: 'bars', nameKey: 'categories.bars', apiName: 'Bars', icon: IoBeer, color: '#F59E0B' },
  { id: 'gas', nameKey: 'categories.gas', apiName: 'Gas Stations', icon: IoCarSport, color: '#8A05BE' },
  { id: 'shopping', nameKey: 'categories.shopping', apiName: 'Shopping', icon: IoStorefront, color: '#EC4899' },
  { id: 'hotels', nameKey: 'categories.hotels', apiName: 'Hotels', icon: IoBed, color: '#6366F1' },
  { id: 'rv-camping', nameKey: 'categories.rvCamping', apiName: 'RV & Camping', icon: IoBonfire, color: '#00C2CB' },
];

// Searchable categories for autocomplete
const SEARCHABLE_CATEGORIES = [
  { name: 'Restaurants', icon: 'restaurant', type: 'category' },
  { name: 'Cafes', icon: 'cafe', type: 'category' },
  { name: 'Coffee Shops', icon: 'cafe', type: 'category' },
  { name: 'Bars', icon: 'beer', type: 'category' },
  { name: 'Gas Stations', icon: 'car', type: 'category' },
  { name: 'Shopping', icon: 'shopping', type: 'category' },
  { name: 'Hotels', icon: 'bed', type: 'category' },
  { name: 'RV & Camping', icon: 'bonfire', type: 'category' },
];

// Explore Tavvy items (Universes preview)
const exploreItems = [
  { id: 'airports', title: 'Airports', subtitle: 'Terminals, lounges & more', icon: '✈️', color: '#8A05BE', route: '/app/explore' },
  { id: 'theme-parks', title: 'Theme Parks', subtitle: 'Rides, shows & attractions', icon: '🎢', color: '#EC4899', route: '/app/explore' },
  { id: 'rv-camping', title: 'RV & Camping', subtitle: 'Parks, sites & amenities', icon: '🏕️', color: '#00C2CB', route: '/app/rv-camping' },
];

// Featured carousel — showcases the BREADTH of Tavvy (rides + every other feature)
// Rides leads, but the rotation makes clear Tavvy is for everyone, not just thrill-seekers.
const featureSlides = featureCards.map(card => ({ ...card, image: `/images/features-v2/${card.id}.jpg` }));

// Category grid — the mockup's centerpiece. Theme-adaptive monochrome icons.
const featureGrid = [
  { id: 'restaurants', label: 'Restaurants', Icon: IoRestaurant, route: '/app/map?category=Restaurants' },
  { id: 'hotels', label: 'Hotels', Icon: IoBed, route: '/app/map?category=Hotels' },
  { id: 'rides', label: 'Rides', Icon: IoRocket, route: '/app/rides' },
  { id: 'universes', label: 'Universes', Icon: IoPlanet, route: '/app/universes' },
  { id: 'pros', label: 'Pros', Icon: IoConstruct, route: '/app/pros' },
  { id: 'cities', label: 'Cities', Icon: IoBusiness, route: '/app/cities' },
  { id: 'atlas', label: 'Atlas', Icon: IoEarth, route: '/app/atlas' },
  { id: 'rv-camping', label: 'RV & Camping', Icon: IoBonfire, route: '/app/rv-camping' },
  { id: 'signals', label: 'Signals', Icon: IoRadio, route: '/app/search' },
];

// Search suggestion interface
interface SearchSuggestion {
  id: string;
  type: 'place' | 'category' | 'recent' | 'demo';
  title: string;
  subtitle: string;
  icon: string;
  data?: any;
}

// Location fallback is handled by IP geolocation - see getLocationFromIP()

export default function HomeScreen() {
  const copy = useReleaseCopy();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  
  // Onboarding — optional prompt, not blocking
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'standard' | 'map'>("standard");
  
  // Data states
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<PlaceCardType[]>([]);
  const [nearbyError, setNearbyError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Greeting
  const [greeting, setGreeting] = useState('');

  // Featured carousel (rides + all Tavvy features)
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const carouselTouchX = useRef<number | null>(null);

  // Auto-advance the carousel every 4.5s unless paused (hover / touch)
  useEffect(() => {
    if (carouselPaused || reduceMotion) return;
    const id = setInterval(() => {
      setActiveSlide((s) => (s + 1) % featureSlides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [carouselPaused, reduceMotion]);

  const goToSlide = useCallback((i: number) => {
    setActiveSlide(((i % featureSlides.length) + featureSlides.length) % featureSlides.length);
  }, []);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(t('home.greeting.morning'));
    } else if (hour >= 12 && hour < 17) {
      setGreeting(t('home.greeting.afternoon'));
    } else if (hour >= 17 && hour < 21) {
      setGreeting(t('home.greeting.evening'));
    } else {
      setGreeting(t('home.greeting.night'));
    }
  }, [t]);

  // Get location from IP address as fallback
  const getLocationFromIP = async (): Promise<{ coords: [number, number]; city: string } | null> => {
    try {
      // Using ipapi.co (HTTPS, free tier: 1000 requests/day)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const locationName = data.city 
          ? `${data.city}, ${data.region || data.country_name}`
          : data.country_name || 'Unknown';
        console.log('[Location] IP geolocation success:', locationName, data.latitude, data.longitude);
        return {
          coords: [data.longitude, data.latitude] as [number, number],
          city: locationName
        };
      }
    } catch (error) {
      console.log('[Location] IP geolocation failed:', error);
    }
    return null;
  };

  // Never present a guessed fallback city as the user's current location.
  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) { setLocationName('Choose a city'); return; }
    navigator.geolocation.getCurrentPosition(position => {
      if (cancelled) return;
      const loc: [number, number] = [position.coords.longitude, position.coords.latitude];
      setUserLocation(loc); reverseGeocode(loc);
    }, () => { if (!cancelled) setLocationName('Choose a city'); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
    return () => { cancelled = true; };
  }, []);

  // Reverse geocode to get location name
  const reverseGeocode = async (coords: [number, number]) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords[1]}&lon=${coords[0]}&format=json`
      );
      const data = await response.json();
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || '';
        const state = data.address.state || '';
        setLocationName(city ? `${city}, ${state}` : state);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  // Fetch places when location or category changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces();
    }
  }, [userLocation, selectedCategory]);

  const fetchNearbyPlaces = async () => {
    if (!userLocation) {
      console.log('[Places] No user location yet, skipping fetch');
      return;
    }
    
    console.log('[Places] Fetching places near:', userLocation);
    setNearbyError(false);
    setLoading(true);
    try {
      const bounds = {
        ne: [userLocation[0] + 0.1, userLocation[1] + 0.1] as [number, number],
        sw: [userLocation[0] - 0.1, userLocation[1] - 0.1] as [number, number],
      };
      
      const categoryFilter = selectedCategory ? 
        categoriesDef.find(c => c.id === selectedCategory)?.apiName : undefined;
      
      console.log('[Places] Bounds:', bounds, 'Category:', categoryFilter);
      
      const fetchedPlaces = await fetchPlacesInBounds(
        bounds,
        userLocation,
        categoryFilter
      );
      
      console.log('[Places] Fetched places:', fetchedPlaces.length);
      setPlaces(fetchedPlaces);
      setTrendingPlaces(fetchedPlaces.slice(0, 10));
    } catch (error) {
      console.error('[Places] Error fetching places:', error);
      setNearbyError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debouncing and autocomplete
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    let cancelled = false;
    // Debounce search by 300ms
    searchDebounceRef.current = setTimeout(async () => {
      const suggestions: SearchSuggestion[] = [];
      const query = searchQuery.toLowerCase();
      if (matchesDemoRestaurantQuery(searchQuery)) {
        suggestions.push({ id: 'demo-restaurant', type: 'demo', title: 'Trattoria Tavvy', subtitle: 'Italian restaurant · Illustrative demo', icon: "location" });
      }

      // Search for matching categories
      const matchingCategories = SEARCHABLE_CATEGORIES
        .filter(c => c.name.toLowerCase().includes(query))
        .slice(0, 2);
      
      matchingCategories.forEach(cat => {
        suggestions.push({
          id: `category-${cat.name}`,
          type: "category",
          title: cat.name,
          subtitle: t('search.category'),
          icon: cat.icon,
          data: cat,
        });
      });

      // Use the same search endpoint as the results page and map.
      try {
        const params = new URLSearchParams({ q: searchQuery, limit: '5', evidence: 'defer' });
        if (userLocation) {
          params.set('userLat', String(userLocation[1]));
          params.set('userLng', String(userLocation[0]));
        }
        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const payload = await response.json();
        (payload.suggestions || []).forEach((place: any) => {
          suggestions.push({
            id: `place-${place.id}`,
            type: "place",
            title: place.name,
            subtitle: `${place.category || t('search.place')} • ${place.city || t('search.nearby')}`,
            icon: "location",
            data: place,
          });
        });
      } catch (error) {
        console.error('[Search] Typesense search error:', error);
      }

      if (!cancelled) setSearchSuggestions(suggestions);
    }, 180);

    return () => {
      cancelled = true;
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, userLocation]);

  // Handle search submission
  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return;
    const hasNamedDestination = !!parseSearchQuery(query).city;
    router.push({ pathname: '/app/search', query: { q: query.trim(), ...(!hasNamedDestination && userLocation ? { location: 'current', lat: String(userLocation[1]), lng: String(userLocation[0]) } : {}) } }, undefined, { locale });
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
    setSearchQuery('');
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setIsSearchFocused(false);
    setSearchSuggestions([]);
    
    switch (suggestion.type) {
      case 'demo':
        router.push(DEMO_RESTAURANT_HREF, undefined, { locale });
        break;
      case "place":
        // Navigate to place details
        const place = suggestion.data;
        if (place.id) {
          router.push(`/app/place/${encodeURIComponent(place.id)}`, undefined, { locale });
        } else if (place.fsq_place_id) {
          router.push(`/app/place/${encodeURIComponent(`fsq:${place.fsq_place_id}`)}`, undefined, { locale });
        }
        break;
      case "category":
        // Navigate to map with category filter
        const categoryName = suggestion.data.name;
        router.push(`/app/map?category=${encodeURIComponent(categoryName)}`);
        break;
      case "recent":
        setSearchQuery(suggestion.title);
        handleSearch(suggestion.title);
        break;
    }
  };

  // Switch to map mode
  const switchToMapMode = () => {
    router.push('/app/map', undefined, { locale });
  };

  // Render
  const bgColor = isDark ? discovery.darkBackground : discovery.background;
  const textColor = isDark ? '#fff' : ACCENT;
  // Opaque text tokens preserve contrast on both page and raised search/card surfaces.
  const secondaryText = isDark ? '#BDB1CD' : '#62546F';
  const accentText = isDark ? '#43D8CA' : '#006B72';

  return (
    <AppLayout>
      <Head>
        <title>Tavvy — Discover Real Experiences</title>
      </Head>

      <div className="home-screen">
        <div className="container">
          <main className="main-content">
            {/* Hero Header — Brand Identity */}
            <section className="hero-header">
              <div className="hero-header-top">
                <img
                  src={isDark ? '/tavvy-logo-white.png' : '/tavvy-logo-dark.png'}
                  alt={copy("Tavvy")}
                  className="hero-logo"
                />
              </div>

              <div className="hero-greeting">
                <span className="hero-greeting-time">{greeting}</span>
                <h1 className="hero-greeting-name">{copy(discovery.title)}</h1>
              </div>

              <p className="hero-headline">
                {copy(discovery.subtitle)}
              </p>

              {/* Search */}
              <div style={{ position: 'relative' }}>
              <div className="hero-search">
                <IoSearch size={20} className="search-icon" />
                <input
                  type="text"
                  aria-label={t('home.searchPlaceholder')}
                  placeholder={t('home.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = searchQuery.trim();
                      if (q) handleSearch(q);
                    }
                  }}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchSuggestions([]);
                    }}
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {isSearchFocused && searchSuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="suggestion-icon">
                        {suggestion.icon === 'location' && <IoLocationSharp size={20} />}
                        {suggestion.icon === 'restaurant' && <IoRestaurant size={20} />}
                        {suggestion.icon === 'cafe' && <IoCafe size={20} />}
                        {suggestion.icon === 'beer' && <IoBeer size={20} />}
                        {suggestion.icon === 'car' && <IoCarSport size={20} />}
                        {suggestion.icon === 'shopping' && <IoStorefront size={20} />}
                        {suggestion.icon === 'bed' && <IoBed size={20} />}
                        {suggestion.icon === 'bonfire' && <IoBonfire size={20} />}
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-title">{suggestion.title}</div>
                        <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>

              {/* Quick Actions */}
              <div className="hero-quick-actions">
                <button className="hero-action" onClick={switchToMapMode}>
                  <div className="hero-action-icon" style={{ background: 'rgba(0, 194, 203, 0.12)' }}>
                    <IoLocationSharp size={20} color={isDark ? '#5EEAEF' : '#007F86'} />
                  </div>
                  <span>{t('home.nearMe')}</span>
                </button>
                <button className="hero-action" onClick={switchToMapMode}>
                  <div className="hero-action-icon" style={{ background: 'rgba(138, 5, 190, 0.12)' }}>
                    <FiMapPin size={20} color={isDark ? '#D4A0FF' : '#7905A8'} />
                  </div>
                  <span>{t('home.map')}</span>
                </button>
                <button className="hero-action" onClick={() => router.push('/app/search', undefined, { locale })}>
                  <div className="hero-action-icon" style={{ background: 'rgba(0, 194, 203, 0.12)' }}>
                    <IoSparkles size={20} color={isDark ? '#5EEAEF' : '#007F86'} />
                  </div>
                  <span>{t('home.signals', "Signals")}</span>
                </button>
              </div>
            </section>

            {/* Featured Carousel — rides + every Tavvy feature (broad appeal) */}
            <section
              className="feature-carousel"
              aria-label="Discover Tavvy"
              onFocusCapture={() => setCarouselPaused(true)}
              onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setCarouselPaused(false); }}
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              onTouchStart={(e) => { carouselTouchX.current = e.touches[0].clientX; setCarouselPaused(true); }}
              onTouchEnd={(e) => {
                const start = carouselTouchX.current;
                if (start != null) {
                  const dx = e.changedTouches[0].clientX - start;
                  if (Math.abs(dx) > 40) goToSlide(activeSlide + (dx < 0 ? 1 : -1));
                }
                carouselTouchX.current = null;
                setCarouselPaused(false);
              }}
            >
              <div className="feature-carousel-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                {featureSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    className="feature-slide"
                    tabIndex={index === activeSlide ? 0 : -1}
                    aria-hidden={index !== activeSlide}
                    onClick={() => router.push(slide.route, undefined, { locale })}
                    aria-label={`${copy(slide.title)} — ${copy(slide.subtitle)}`}
                  >
                    <span className="feature-slide-photo"><img src={index === activeSlide || index === (activeSlide + 1) % featureSlides.length ? slide.image : undefined} alt="" loading={index === 0 ? 'eager' : 'lazy'} /></span>
                    <div className="feature-slide-copy">
                      <span className="feature-slide-tag">{copy(slide.tag)}</span>
                      <h2 className="feature-slide-title">{copy(slide.title)}</h2>
                      <p className="feature-slide-subtitle">{copy(slide.subtitle)}</p>
                      <span className="feature-slide-cta">{copy("Explore")}<IoChevronForward size={16} /></span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="feature-dots">
                {featureSlides.map((slide, i) => (
                  <button
                    key={slide.id}
                    aria-pressed={i === activeSlide}
                    className={`feature-dot ${i === activeSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to ${copy(slide.title)}`}
                  />
                ))}
              </div>
            </section>

            {/* Category Grid — explore all of Tavvy (theme-adaptive icons) */}
            <section className="feature-grid-section">
              <div className="section-header"><h2 className="section-title">{t('home.exploreTavvy', "Explore Tavvy")}</h2><Link href="/app/apps" locale={locale} className="see-all">{copy('All tools')} <IoChevronForward /></Link></div>
              <div className="feature-grid">
                {featureGrid.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    className="feature-grid-tile"
                    onClick={() => router.push(item.route, undefined, { locale })}
                    aria-label={copy(item.label)}
                  >
                    <span className="feature-grid-icon"><item.Icon size={24} /></span>
                    <span className="feature-grid-label">{copy(item.label)}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="places-discovery" aria-labelledby="places-discovery-title">
              <div className="section-header">
                <h2 id="places-discovery-title" className="section-title">{copy('Places to explore')}</h2>
                <Link href="/app/map" locale={locale} className="see-all">{t('home.openMap', 'Open map')} <IoChevronForward /></Link>
              </div>
              {loading && userLocation ? <p role="status">{t('home.findingPlaces', 'Finding places around you…')}</p> : nearbyError ? (
                <p role="status">{t('home.placesLoadError', 'We couldn’t load places.')} <button onClick={fetchNearbyPlaces}>{t('common.retry', "Try again")}</button></p>
              ) : trendingPlaces.length ? (
                <div className="places-discovery-grid">
                  {trendingPlaces.slice(0, 3).map(place => {
                    const photo = place.photo_url || place.cover_image_url || place.photos?.[0];
                    const identifier = place.source === 'fsq_raw' ? `fsq:${place.source_id || place.id}` : place.id;
                    return <Link key={place.id} href={`/app/place/${encodeURIComponent(identifier)}`} locale={locale} className="place-discovery-card">
                      <div className="place-discovery-photo"><IoLocationSharp aria-hidden="true" size={32} />{photo && <img src={photo} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} />}</div>
                      <div className="place-discovery-copy"><h3>{place.name}</h3><p>{[place.category, place.city].filter(Boolean).join(' · ')}</p></div>
                    </Link>;
                  })}
                </div>
              ) : <p>{t('home.exploreMapPrompt', 'Open the map or search above to find your next stop.')}</p>}
            </section>

            {/* Onboarding Banner — optional, non-blocking */}
            {showOnboarding && !showOnboardingModal && (
              <div className="onboarding-banner">
                <div className="onboarding-banner-text">
                  <span className="onboarding-banner-icon">👋</span>
                  <span>New here? <strong>Take a quick tour</strong> to learn how Tavvy works.</span>
                </div>
                <div className="onboarding-banner-actions">
                  <button
                    className="onboarding-banner-btn"
                    onClick={() => setShowOnboardingModal(true)}
                  >
                    Show me
                  </button>
                  <button
                    className="onboarding-banner-dismiss"
                    onClick={completeOnboarding}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Onboarding Modal — shown only when user opts in */}
            {showOnboardingModal && (
              <Onboarding onComplete={() => {
                setShowOnboardingModal(false);
                completeOnboarding();
              }} />
            )}

            {/* Mood Section - iOS Style */}
            <section className="mood-section">
              <h2 className="section-title">{t('home.whatsYourMood')}</h2>
              <div className="mood-cards">
                <button 
                  className="mood-card mood-card-hungry"
                  onClick={() => router.push('/app/map?category=Restaurants', undefined, { locale })}
                >
                  <div className="mood-emoji">🍕</div>
                  <div className="mood-content">
                    <h3 className="mood-title">{t('home.hungry')}</h3>
                    <p className="mood-subtitle">{t('home.restaurantsFood')}</p>
                  </div>
                </button>
                <button 
                  className="mood-card mood-card-thirsty"
                  onClick={() => router.push('/app/map?category=Bars', undefined, { locale })}
                >
                  <div className="mood-emoji">🍸</div>
                  <div className="mood-content">
                    <h3 className="mood-title">{t('home.thirsty')}</h3>
                    <p className="mood-subtitle">{t('home.barsCafes')}</p>
                  </div>
                </button>
              </div>
            </section>

            <Link href="/app/happening-now" locale={locale} className="explore-new-card">
              <div className="explore-new-header"><span className="explore-sparkles">✦</span><span>Make a little room for discovery</span></div>
              <h3 className="explore-new-title">{t('home.exploreSomethingNew')}</h3>
              <p className="explore-new-subtitle">{t('home.eventsActivities')} <IoChevronForward /></p>
            </Link>

            {/* Explore Tavvy */}
            <section className="section explore-section" style={{ display: "none" }}>
              <div className="section-header">
                <h2>{t('home.exploreTavvy')}</h2>
                <Link href="/app/explore" locale={locale} className="see-all">
                  {t('common.seeMore')} <IoChevronForward size={16} />
                </Link>
              </div>
              <p className="section-subtitle">{t('home.curatedWorlds')}</p>
              <div className="explore-scroll">
                {exploreItems.map((item) => (
                  <Link key={item.id} href={item.route} className="explore-card" locale={locale}>
                    <div 
                      className="explore-image"
                      style={{ backgroundColor: item.color }}
                    >
                      <span className="explore-emoji">{item.icon}</span>
                    </div>
                    <div className="explore-content">
                      <h3>{item.title}</h3>
                      <div className="explore-meta">
                        <div 
                          className="explore-badge"
                          style={{ backgroundColor: item.color }}
                        >
                          <span>{item.icon}</span>
                        </div>
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Did You Know */}
            <section className="section">
              <div className="did-you-know-card">
                <div className="dyk-icon">💡</div>
                <div className="dyk-content">
                  <h3>{t('home.didYouKnow')}</h3>
                  <p>{t('home.didYouKnowText')}</p>
                </div>
              </div>
            </section>

            {/* Bottom Spacing */}
            <div className="bottom-spacing" />
          </main>
        </div>

        <style jsx>{`
          .home-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          button:focus-visible, a:focus-visible, input:focus-visible {
            outline: 3px solid ${isDark ? '#00C2CB' : '#8A05BE'};
            outline-offset: 4px;
          }
          @media (min-width: 760px) {
            .hero-search { max-width: 740px; }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { transition: none !important; animation: none !important; }
          }
          /* Hero Header */
          .hero-header {
            padding: 30px 0 32px;
            position: relative;
          }

          .hero-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
          }

          .hero-logo {
            height: 34px;
            width: auto;
          }

          .hero-greeting {
            margin-bottom: 6px;
          }

          .hero-greeting-time {
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? '#BDB1CD' : '#6C5D7B'};
            display: block;
            margin-bottom: 2px;
          }

          .hero-greeting-name {
            font-size: clamp(32px, 5vw, 52px);
            line-height: 1.1;
            max-width: 720px;
            font-weight: 800;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0;
            letter-spacing: -0.5px;
          }

          .hero-headline {
            font-size: 17px;
            color: ${isDark ? '#BDB1CD' : '#6C5D7B'};
            font-weight: 400;
            margin: 4px 0 20px;
          }

          .hero-highlight {
            color: ${accentText};
            font-weight: 600;
          }

          /* Search */
          .hero-search {
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.10)' : '#FFFFFF'};
            border-radius: 16px;
            padding: 0 16px;
            height: 52px;
            margin-bottom: 20px;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.20)' : '#998DA5'};
            box-shadow: ${isDark ? '0 2px 10px rgba(0,0,0,0.35)' : '0 5px 16px rgba(23,1,58,0.10), 0 1px 3px rgba(23,1,58,0.06)'};
            transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
            position: relative;
          }

          .hero-search:focus-within {
            border-color: ${isDark ? 'rgba(138, 5, 190, 0.7)' : '#8A05BE'};
            background: ${isDark ? 'rgba(255,255,255,0.13)' : '#FFFFFF'};
            box-shadow: ${isDark ? '0 2px 10px rgba(0,0,0,0.35)' : '0 0 0 3px rgba(138,5,190,0.12), 0 5px 16px rgba(23,1,58,0.10)'};
          }

          .hero-search :global(.search-icon) {
            color: ${secondaryText};
            flex-shrink: 0;
          }

          .hero-search .search-input {
            flex: 1;
            background: none;
            border: none;
            outline: none;
            color: ${isDark ? '#fff' : '#000'};
            font-size: 16px;
            padding: 0 12px;
            font-weight: 400;
          }

          .hero-search .search-input::placeholder {
            opacity: 1;
            color: ${secondaryText};
          }

          .hero-search .clear-btn {
            background: none;
            border: none;
            color: ${secondaryText};
            cursor: pointer;
            padding: 4px;
            display: flex;
          }

          /* Quick Actions */
          .hero-quick-actions {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
          }

          .hero-action {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 12px 8px;
            border-radius: 16px;
            transition: background 0.2s;
          }

          .hero-action:hover {
            background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
          }

          .hero-action-icon {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero-action span {
            font-size: 12px;
            font-weight: 600;
            color: ${secondaryText};
          }

          /* Autocomplete below search */
          .autocomplete-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            right: 0;
            background: ${isDark ? '#1c1c1e' : '#F5F5F5'};
            border-radius: 16px;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#eee'};
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 1000;
            max-height: 360px;
            overflow-y: auto;
          }

          /* Legacy compat */
          .search-input-wrapper {
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5'};
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 16px;
          }

          .search-input-wrapper :global(.search-icon) {
            color: ${secondaryText};
            margin-right: 12px;
          }

          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: ${isDark ? '#fff' : '#000'};
            outline: none;
          }

          .search-input::placeholder {
            opacity: 1;
            color: ${secondaryText};
          }

          .clear-btn {
            background: none;
            border: none;
            color: ${secondaryText};
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .clear-btn:hover {
            color: ${secondaryText};
          }

          /* Autocomplete Dropdown */

          .suggestion-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            cursor: pointer;
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'};
            transition: background 0.2s;
          }

          .suggestion-item:last-child {
            border-bottom: none;
          }

          .suggestion-item:hover {
            background: ${isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB'};
          }

          .suggestion-icon {
            color: ${accentText};
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .suggestion-content {
            flex: 1;
          }

          .suggestion-title {
            font-size: 15px;
            font-weight: 500;
            color: ${isDark ? '#fff' : '#000'};
            margin-bottom: 2px;
          }

          .suggestion-subtitle {
            font-size: 13px;
            color: ${secondaryText};
          }

          /* Quick Actions - iOS Style */
          .quick-actions {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
          }

          .quick-action-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: ${isDark ? '#2C2C2E' : '#F5F5F5'};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isDark ? '#fff' : ACCENT};
            transition: all 0.2s;
          }

          .quick-action-btn:hover .quick-action-icon {
            background: ${isDark ? 'rgba(255,255,255,0.12)' : '#E5E5E5'};
            transform: scale(1.05);
          }

          .quick-action-btn span {
            font-size: 12px;
            font-weight: 500;
            color: ${secondaryText};
          }

          /* Mood Section - iOS Style */
          .mood-section {
            margin-bottom: 32px;
          }

          /* Featured Carousel */
          .feature-carousel {
            position: relative;
            margin: 4px 0 28px;
            overflow: hidden;
          }
          .feature-carousel-track {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform;
          }
          .feature-slide {
            flex: 0 0 100%; min-width: 100%; display: grid; grid-template-columns: 1.3fr 1fr;
            padding: 0; border: 1px solid ${theme.border}; border-radius: 22px; overflow: hidden;
            text-align: left; cursor: pointer; color: ${theme.text}; background: ${theme.surface};
            box-shadow: 0 8px 24px rgba(30, 15, 45, 0.07);
          }
          .feature-slide-photo { display: block; height: 320px; background: ${isDark ? '#30223F' : '#F1EDF6'}; }
          .feature-slide-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .feature-slide-copy { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 30px; }
          .feature-slide-tag { color: ${theme.accent}; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
          .feature-slide-title { color: ${theme.text}; font-size: 30px; font-weight: 750; line-height: 1.15; margin: 0 0 10px; letter-spacing: -0.6px; }
          .feature-slide-subtitle { color: ${theme.textSecondary}; font-size: 16px; line-height: 1.5; margin: 0; }
          .feature-slide-cta { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; margin-top: 22px; color: ${theme.accent}; }
          @media (max-width: 560px) {
            .feature-slide { grid-template-columns: 1fr; }
            .feature-slide-photo { height: 200px; }
            .feature-slide-copy { padding: 20px; }
            .feature-slide-title { font-size: 24px; }
            .feature-slide-subtitle { font-size: 14px; }
            .feature-slide-tag { margin-bottom: 8px; }
            .feature-slide-cta { margin-top: 14px; }
          }
          .feature-dots {
            display: flex;
            justify-content: center;
            gap: 7px;
            margin-top: 14px;
          }
          .feature-dot {
            width: 36px; height: 44px; padding: 0; border: none;
            background: transparent; cursor: pointer; display: grid; place-items: center;
          }
          .feature-dot::after {
            content: ''; width: 7px; height: 7px; border-radius: 99px;
            background: ${isDark ? '#A99CB8' : '#877494'};
          }
          .feature-dot.active::after { width: 22px; background: #8A05BE; }


          .places-discovery { margin: 28px 0; color: ${theme.textSecondary}; }
          .places-discovery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
          .places-discovery :global(.place-discovery-card) { overflow: hidden; border: 1px solid ${theme.border}; border-radius: 18px; background: ${theme.surface}; text-decoration: none; color: ${theme.text}; }
          .place-discovery-photo { height: 150px; position: relative; display: grid; place-items: center; background: ${isDark ? '#30223F' : '#F1EDF6'}; color: ${theme.textTertiary}; }
          .place-discovery-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
          .place-discovery-copy { padding: 16px; }
          .place-discovery-copy h3 { font-size: 17px; line-height: 1.35; margin-bottom: 6px; }
          .place-discovery-copy p { font-size: 14px; color: ${theme.textSecondary}; }
          .places-discovery button { color: ${theme.accent}; padding: 10px; border: none; background: none; cursor: pointer; }
          @media (max-width: 560px) {
            .places-discovery-grid { grid-template-columns: 1fr; }
            .places-discovery :global(.place-discovery-card) { display: flex; align-items: center; }
            .place-discovery-photo { width: 92px; height: 104px; flex-shrink: 0; }
          }

          /* Category Grid */
          .feature-grid-section {
            margin: 26px 0 6px;
          }
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 12px;
          }
          .feature-grid-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 18px 8px;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#EDEDED'};
            border-radius: 18px;
            background: ${isDark ? 'rgba(255,255,255,0.035)' : '#FFFFFF'};
            cursor: pointer;
            transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
          }
          .feature-grid-tile:hover {
            transform: translateY(-2px);
            border-color: rgba(138, 5, 190, 0.4);
            background: ${isDark ? 'rgba(138, 5, 190, 0.12)' : 'rgba(138, 5, 190, 0.05)'};
          }
          .feature-grid-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 15px;
            color: ${isDark ? '#FFFFFF' : '#17013A'};
            background: ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(23, 1, 58, 0.05)'};
          }
          .feature-grid-label {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            color: ${isDark ? 'rgba(255,255,255,0.85)' : '#17013A'};
          }

          .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${secondaryText};
            margin-bottom: 14px;
          }

          .mood-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .mood-card {
            position: relative;
            min-height: 120px;
            border-radius: 20px;
            border: none;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.2s;
            padding: 20px;
          }

          .mood-card:active {
            transform: scale(0.98);
          }

          .mood-card-hungry {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
          }

          .mood-card-thirsty {
            background: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);
          }

          .mood-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(255,255,255,0.25);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 4px 10px;
          }

          .mood-badge-icon {
            font-size: 12px;
          }

          .mood-badge-text {
            font-size: 11px;
            font-weight: 600;
            color: #17013A;
          }

          .mood-emoji {
            position: absolute;
            bottom: 16px;
            right: 16px;
            font-size: 48px;
            opacity: 0.9;
          }

          .mood-content {
            position: relative;
            z-index: 1;
          }

          .mood-title {
            font-size: 20px;
            font-weight: 700;
            color: #17013A;
            margin: 0 0 4px;
          }

          .mood-subtitle {
            font-size: 13px;
            font-weight: 500;
            color: #17013A;
            margin: 0;
          }

          /* Sections */
          .section {
            margin-bottom: 32px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .section-header h2 {
            font-size: 20px;
            font-weight: 700;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0;
          }

          .see-all {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 600;
            color: ${accentText};
            text-decoration: none;
            transition: opacity 0.2s;
          }

          .see-all:hover {
            opacity: 0.8;
          }

          .section-subtitle {
            font-size: 14px;
            color: ${secondaryText};
            margin: 0 0 16px;
          }

          /* Happening Now */
          .happening-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .happening-scroll::-webkit-scrollbar {
            display: none;
          }

          .happening-card {
            flex: 0 0 280px;
            scroll-snap-align: start;
            border-radius: 16px;
            overflow: hidden;
            background: ${isDark ? '#1C1C1E' : '#fff'};
            box-shadow: ${isDark ? "none" : '0 2px 8px rgba(0,0,0,0.08)'};
          }

          .happening-image {
            width: 100%;
            height: 160px;
            background-size: cover;
            background-position: center;
          }

          .happening-content {
            padding: 16px;
          }

          .happening-content h3 {
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0 0 4px;
          }

          .happening-content p {
            font-size: 14px;
            color: ${secondaryText};
            margin: 0;
          }

          /* Explore New Card */
          .home-screen :global(.explore-new-card) {
            display: block;
            color: #fff;
            text-decoration: none;
            position: relative;
            background: linear-gradient(135deg, #4F5AC4 0%, #653D91 100%);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            overflow: hidden;
          }

          .explore-new-header {
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .explore-sparkles {
            font-size: 16px;
          }

          .explore-count {
            font-size: 12px;
            font-weight: 600;
            color: #fff;
          }

          .explore-new-title {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 8px;
          }

          .explore-new-subtitle {
            font-size: 14px;
            color: #fff;
            margin: 0;
          }

          .explore-new-icon {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 64px;
            opacity: 0.3;
          }

          /* Did You Know */
          .did-you-know-card {
            display: flex;
            gap: 16px;
            background: ${isDark ? '#1C1C1E' : '#fff'};
            border-radius: 16px;
            padding: 20px;
            box-shadow: ${isDark ? "none" : '0 2px 8px rgba(0,0,0,0.04)'};
          }

          .dyk-icon {
            font-size: 32px;
            flex-shrink: 0;
          }

          .dyk-content h3 {
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0 0 8px;
          }

          .dyk-content p {
            font-size: 14px;
            color: ${secondaryText};
            margin: 0;
            line-height: 1.5;
          }

          /* Leaderboard */
          .leaderboard-card {
            background: ${isDark ? '#1C1C1E' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            box-shadow: ${isDark ? "none" : '0 2px 8px rgba(0,0,0,0.04)'};
          }

          .leaderboard-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'};
          }

          .leaderboard-row:last-child {
            border-bottom: none;
          }

          .leaderboard-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .leaderboard-badge {
            font-size: 20px;
          }

          .leaderboard-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${TEAL};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 600;
            font-size: 16px;
          }

          .leaderboard-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .leaderboard-name {
            font-size: 15px;
            font-weight: 600;
            color: ${isDark ? '#fff' : ACCENT};
          }

          .leaderboard-streak {
            font-size: 12px;
            color: ${secondaryText};
          }

          .leaderboard-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
          }

          .leaderboard-taps {
            font-size: 18px;
            font-weight: 700;
            color: ${accentText};
          }

          .leaderboard-label {
            font-size: 11px;
            color: ${secondaryText};
            text-transform: uppercase;
          }

          /* Container */
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .main-content {
            padding-bottom: 100px;
          }

          /* Onboarding Banner */
          .onboarding-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: ${isDark ? 'rgba(138, 5, 190, 0.12)' : 'rgba(138, 5, 190, 0.06)'};
            border: 1px solid ${isDark ? 'rgba(138, 5, 190, 0.25)' : 'rgba(138, 5, 190, 0.15)'};
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .onboarding-banner-text {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.8)' : '#333'};
          }

          .onboarding-banner-icon {
            font-size: 20px;
          }

          .onboarding-banner-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }

          .onboarding-banner-btn {
            background: #8A05BE;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }

          .onboarding-banner-btn:hover {
            background: #9B10D4;
          }

          .onboarding-banner-dismiss {
            background: none;
            border: none;
            color: ${secondaryText};
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            padding: 8px 12px;
          }

          .onboarding-banner-dismiss:hover {
            color: ${secondaryText};
          }

          @media (min-width: 760px) {
            .feature-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
          }

          .bottom-spacing {
            height: 40px;
          }
        `}</style>
      </div>
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
