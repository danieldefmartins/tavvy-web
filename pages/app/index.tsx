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
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { fetchPlacesInBounds, searchPlaces, PlaceCard as PlaceCardType } from '../../lib/placeService';
import { searchPlaces as typesenseSearchPlaces, getAutocompleteSuggestions } from '../../lib/typesenseService';
import { spacing, borderRadius, Colors } from '../../constants/Colors';
import { 
  FiSearch, FiX, FiMapPin, FiUser, FiChevronRight, FiMenu,
  FiCoffee, FiHome as FiHotel, FiShoppingBag, FiDroplet
} from 'react-icons/fi';
import { 
  IoRestaurant, IoCafe, IoBeer, IoCarSport, IoBed, 
  IoBonfire, IoStorefront, IoSparkles, IoChevronForward,
  IoLocationSharp, IoSearch
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// ============================================
// CONSTANTS
// ============================================

// Theme colors matching mobile app
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#000000'; // Pure black for dark mode
const ACCENT = '#0F1233';
const TEAL = '#14B8A6';
const GREEN = '#10B981';

// Categories for filtering - matching mobile app with icons
const categories = [
  { id: 'restaurants', name: 'Restaurants', icon: IoRestaurant, color: '#EF4444' },
  { id: 'cafes', name: 'Cafes', icon: IoCafe, color: '#8B5CF6' },
  { id: 'bars', name: 'Bars', icon: IoBeer, color: '#F59E0B' },
  { id: 'gas', name: 'Gas', icon: IoCarSport, color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: IoStorefront, color: '#EC4899' },
  { id: 'hotels', name: 'Hotels', icon: IoBed, color: '#6366F1' },
  { id: 'rv-camping', name: 'RV & Camping', icon: IoBonfire, color: '#F97316' },
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
  { id: 'airports', title: 'Airports', subtitle: 'Terminals, lounges & more', icon: '✈️', color: '#3B82F6', route: '/app/explore' },
  { id: 'theme-parks', title: 'Theme Parks', subtitle: 'Rides, shows & attractions', icon: '🎢', color: '#EC4899', route: '/app/explore' },
  { id: 'rv-camping', title: 'RV & Camping', subtitle: 'Parks, sites & amenities', icon: '🏕️', color: '#F97316', route: '/app/rv-camping' },
];

// Top contributors mock data
const topContributors = [
  { rank: 1, name: 'Sarah M.', taps: 1247, badge: '🥇', streak: 45 },
  { rank: 2, name: 'Mike R.', taps: 1089, badge: '🥈', streak: 32 },
  { rank: 3, name: 'Jenny W.', taps: 956, badge: '🥉', streak: 28 },
  { rank: 4, name: 'Tom C.', taps: 823, badge: '⭐', streak: 21 },
  { rank: 5, name: 'Lisa K.', taps: 712, badge: '⭐', streak: 18 },
];

// Mock stories data
const mockStories = [
  { id: '1', name: 'Your Story', image: null, isUser: true },
  { id: '2', name: 'Cafe Luna', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop', hasNew: true },
  { id: '3', name: 'The Grill', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop', hasNew: true },
  { id: '4', name: 'Brew Co', image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=100&h=100&fit=crop', hasNew: false },
  { id: '5', name: 'Pizza Place', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop', hasNew: true },
];

// Mock happening now data
const mockHappeningNow = [
  { id: '1', title: 'Happy Hour at The Pub', subtitleKey: 'hoursLeft', subtitleValue: '2', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', type: 'event' },
  { id: '2', title: 'Live Music Tonight', subtitleKey: 'startsAt', subtitleValue: '8 PM', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', type: 'event' },
  { id: '3', title: 'Food Truck Festival', subtitleKey: 'allDayToday', subtitleValue: '', image: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=300&fit=crop', type: 'event' },
];

// Search suggestion interface
interface SearchSuggestion {
  id: string;
  type: 'place' | 'category' | 'recent';
  title: string;
  subtitle: string;
  icon: string;
  data?: any;
}

// Location fallback is handled by IP geolocation - see getLocationFromIP()

export default function HomeScreen() {
  const { theme, isDark, setThemeMode } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  
  // View mode
  const [viewMode, setViewMode] = useState<'standard' | 'map'>('standard');
  
  // Data states
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<PlaceCardType[]>([]);
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
      setGreeting('Good night');
    }
  }, []);

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

  // Get user location with IP-based fallback
  useEffect(() => {
    let locationTimeout: NodeJS.Timeout;
    let locationResolved = false;

    const setLocationFromIP = async () => {
      if (locationResolved) return;
      
      console.log('[Location] Trying IP-based geolocation...');
      const ipLocation = await getLocationFromIP();
      
      if (!locationResolved) {
        locationResolved = true;
        if (ipLocation) {
          setUserLocation(ipLocation.coords);
          setLocationName(ipLocation.city);
        } else {
          // Ultimate fallback if IP geolocation also fails
          console.log('[Location] All methods failed, using New York as fallback');
          setUserLocation([-74.006, 40.7128]); // New York
          setLocationName('New York, NY');
        }
      }
    };

    // Set a timeout - if browser geolocation takes too long, try IP-based
    locationTimeout = setTimeout(() => {
      console.log('[Location] Browser geolocation timeout - trying IP fallback');
      setLocationFromIP();
    }, 5000); // 5 second timeout

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          if (!locationResolved) {
            locationResolved = true;
            const loc: [number, number] = [position.coords.longitude, position.coords.latitude];
            console.log('[Location] Browser geolocation success:', loc);
            setUserLocation(loc);
            reverseGeocode(loc);
          }
        },
        async (error) => {
          clearTimeout(locationTimeout);
          console.log('[Location] Browser geolocation error:', error.message);
          await setLocationFromIP();
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } else {
      clearTimeout(locationTimeout);
      setLocationFromIP();
    }

    return () => {
      clearTimeout(locationTimeout);
    };
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
    setLoading(true);
    try {
      const bounds = {
        ne: [userLocation[0] + 0.1, userLocation[1] + 0.1] as [number, number],
        sw: [userLocation[0] - 0.1, userLocation[1] - 0.1] as [number, number],
      };
      
      const categoryFilter = selectedCategory ? 
        categories.find(c => c.id === selectedCategory)?.name : undefined;
      
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

    // Debounce search by 300ms
    searchDebounceRef.current = setTimeout(async () => {
      const suggestions: SearchSuggestion[] = [];
      const query = searchQuery.toLowerCase();

      // Search for matching categories
      const matchingCategories = SEARCHABLE_CATEGORIES
        .filter(c => c.name.toLowerCase().includes(query))
        .slice(0, 2);
      
      matchingCategories.forEach(cat => {
        suggestions.push({
          id: `category-${cat.name}`,
          type: 'category',
          title: cat.name,
          subtitle: 'Category',
          icon: cat.icon,
          data: cat,
        });
      });

      // Search for matching places using Typesense
      try {
        const typesenseResults = await typesenseSearchPlaces({
          query: searchQuery,
          latitude: userLocation?.[1],
          longitude: userLocation?.[0],
          radiusKm: 50,
          limit: 5,
        });

        typesenseResults.places.forEach(place => {
          suggestions.push({
            id: `place-${place.fsq_place_id}`,
            type: 'place',
            title: place.name,
            subtitle: `${place.category || 'Place'} • ${place.locality || 'Nearby'}`,
            icon: 'location',
            data: place,
          });
        });
      } catch (error) {
        console.error('[Search] Typesense search error:', error);
      }

      setSearchSuggestions(suggestions);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, userLocation]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchNearbyPlaces();
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchPlaces(searchQuery, userLocation);
      setPlaces(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
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
      case 'place':
        // Navigate to place details
        const place = suggestion.data;
        if (place.fsq_place_id) {
          // Use fsq: prefix for consistency
          console.log('[HomeScreen] Navigating to place:', place.fsq_place_id);
          router.push(`/place/fsq:${place.fsq_place_id}`, undefined, { locale });
        } else if (place.id) {
          console.log('[HomeScreen] Navigating to place by ID:', place.id);
          router.push(`/place/${place.id}`, undefined, { locale });
        }
        break;
      case 'category':
        // Navigate to map with category filter
        const categoryName = suggestion.data.name;
        router.push(`/app/map?category=${encodeURIComponent(categoryName, undefined, { locale })}`);
        break;
      case 'recent':
        setSearchQuery(suggestion.title);
        handleSearch();
        break;
    }
  };

  // Switch to map mode
  const switchToMapMode = () => {
    router.push('/app/map', undefined, { locale });
  };

  // Render
  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#fff' : ACCENT;

  return (
    <AppLayout>
      <Head>
        <title>Tavvy - Find Your Perfect Spot</title>
      </Head>

      <div className="home-screen">
        <div className="container">
          <main className="main-content">
            {/* Greeting Section - iOS Style */}
            <section className="greeting-section">
              <div className="greeting-row">
                <div>
                  <div className="greeting-text">{greeting}</div>
                  <h1 className="greeting-name">there 👋</h1>
                </div>
                <button 
                  className="theme-toggle-btn"
                  onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                >
                  {isDark ? '🌙' : '🌞'}
                </button>
              </div>
              <div className="tagline">
                <span className="tagline-dot">•</span>
                <span className="tagline-text">{t('home.tagline')}</span>
              </div>
            </section>

            {/* Search Card - iOS Style */}
            <div className="search-card">
              <div className="search-input-wrapper">
                <IoSearch size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="What are you in the mood for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    // Delay to allow click on suggestions
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
              
              {/* Quick Action Buttons */}
              <div className="quick-actions">
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    <IoLocationSharp size={24} />
                  </div>
                  <span>{t('home.nearMe')}</span>
                </button>
                <button className="quick-action-btn" onClick={switchToMapMode}>
                  <div className="quick-action-icon">
                    <FiMapPin size={24} />
                  </div>
                  <span>{t('home.map')}</span>
                </button>
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    <IoSparkles size={24} />
                  </div>
                  <span>{t('home.surprise')}</span>
                </button>
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    ⭐
                  </div>
                  <span>{t('home.saved')}</span>
                </button>
              </div>
            </div>

            {/* Mood Section - iOS Style */}
            <section className="mood-section">
              <h2 className="section-title">{t('home.whatsYourMood')}</h2>
              <div className="mood-cards">
                <button 
                  className="mood-card mood-card-hungry"
                  onClick={() => router.push('/app/map?category=Restaurants', undefined, { locale })}
                >
                  <div className="mood-badge">
                    <span className="mood-badge-icon">🔥</span>
                    <span className="mood-badge-text">{t('home.popular')}</span>
                  </div>
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
                  <div className="mood-badge">
                    <span className="mood-badge-icon">📈</span>
                    <span className="mood-badge-text">{t('home.trending')}</span>
                  </div>
                  <div className="mood-emoji">🍸</div>
                  <div className="mood-content">
                    <h3 className="mood-title">{t('home.thirsty')}</h3>
                    <p className="mood-subtitle">{t('home.barsCafes')}</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Live Now Section */}
            <section className="section">
              <div className="section-header">
                <h2>{t('home.liveNow')}</h2>
                <Link href="/app/explore" locale={locale} className="see-all">
                  See All <IoChevronForward size={16} />
                </Link>
              </div>
              <div className="happening-scroll">
                {mockHappeningNow.map((item) => (
                  <div key={item.id} className="happening-card">
                    <div 
                      className="happening-image"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <div className="happening-content">
                      <h3>{item.title}</h3>
                      <p>{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Explore Something New - iOS Style */}
            <div className="explore-new-card">
              <div className="explore-new-header">
                <span className="explore-sparkles">✨</span>
                <span className="explore-count">3 {t('home.experiencesNearby')}</span>
              </div>
              <h3 className="explore-new-title">{t('home.exploreSomethingNew')}</h3>
              <p className="explore-new-subtitle">{t('home.eventsActivities')}</p>
              <div className="explore-new-icon">🌟</div>
            </div>

            {/* Explore Tavvy */}
            <section className="section explore-section" style={{ display: 'none' }}>
              <div className="section-header">
                <h2>Explore Tavvy</h2>
                <Link href="/app/explore" locale={locale} className="see-all">
                  See All <IoChevronForward size={16} />
                </Link>
              </div>
              <p className="section-subtitle">Curated worlds of experiences</p>
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

            {/* Top Contributors */}
            <section className="section">
              <div className="section-header">
                <h2>🏆 Top Contributors</h2>
                {/* See All button removed - LeaderboardScreen not yet implemented */}
              </div>
              <p className="section-subtitle">{t('home.communityMembers')}</p>
              <div className="leaderboard-card">
                {topContributors.map((user, index) => (
                  <div key={user.rank} className="leaderboard-row">
                    <div className="leaderboard-left">
                      <span className="leaderboard-badge">{user.badge}</span>
                      <div className="leaderboard-avatar">
                        <span>{user.name.charAt(0)}</span>
                      </div>
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">{user.name}</span>
                        <span className="leaderboard-streak">🔥 {user.streak} {t('home.dayStreak')}</span>
                      </div>
                    </div>
                    <div className="leaderboard-right">
                      <span className="leaderboard-taps">{user.taps.toLocaleString()}</span>
                      <span className="leaderboard-label">{t('home.taps')}</span>
                    </div>
                  </div>
                ))}
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

          /* Greeting Section - iOS Style */
          .greeting-section {
            padding: 32px 0 24px;
          }

          .greeting-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }

          .theme-toggle-btn {
            background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            border: none;
            border-radius: 12px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .theme-toggle-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'};
            transform: scale(1.05);
          }

          .theme-toggle-btn:active {
            transform: scale(0.95);
          }

          .greeting-text {
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#666'};
            margin-bottom: 2px;
          }

          .greeting-name {
            font-size: 32px;
            font-weight: 600;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0 0 12px;
          }

          .tagline {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .tagline-dot {
            color: ${TEAL};
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
          }

          .tagline-text {
            color: ${TEAL};
            font-size: 12px;
            font-weight: 500;
          }

          /* Search Card - iOS Style */
          .search-card {
            background: ${isDark ? '#1C1C1E' : '#fff'};
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 24px;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'};
            position: relative;
          }

          .search-input-wrapper {
            display: flex;
            align-items: center;
            background: ${isDark ? '#2C2C2E' : '#F5F5F5'};
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 16px;
          }

          .search-input-wrapper .search-icon {
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
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
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
          }

          .clear-btn {
            background: none;
            border: none;
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .clear-btn:hover {
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#666'};
          }

          /* Autocomplete Dropdown */
          .autocomplete-dropdown {
            position: absolute;
            top: 76px;
            left: 20px;
            right: 20px;
            background: ${isDark ? '#2C2C2E' : '#fff'};
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            overflow: hidden;
            z-index: 1000;
            max-height: 400px;
            overflow-y: auto;
          }

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
            color: ${TEAL};
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
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
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
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          /* Mood Section - iOS Style */
          .mood-section {
            margin-bottom: 32px;
          }

          .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
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
            color: #fff;
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
            color: #fff;
            margin: 0 0 4px;
          }

          .mood-subtitle {
            font-size: 13px;
            font-weight: 500;
            color: rgba(255,255,255,0.9);
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
            color: ${TEAL};
            text-decoration: none;
            transition: opacity 0.2s;
          }

          .see-all:hover {
            opacity: 0.8;
          }

          .section-subtitle {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#666'};
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
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
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
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#666'};
            margin: 0;
          }

          /* Explore New Card */
          .explore-new-card {
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            overflow: hidden;
          }

          .explore-new-header {
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
            color: rgba(255,255,255,0.9);
          }

          .explore-new-title {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 8px;
          }

          .explore-new-subtitle {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
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
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'};
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
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            margin: 0;
            line-height: 1.5;
          }

          /* Leaderboard */
          .leaderboard-card {
            background: ${isDark ? '#1C1C1E' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'};
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
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
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
            color: ${TEAL};
          }

          .leaderboard-label {
            font-size: 11px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
            text-transform: uppercase;
          }

          /* Container */
          .container {
            max-width: 640px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .main-content {
            padding-bottom: 100px;
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
