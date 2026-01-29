/**
 * Home Screen - Main app entry point
 * Pixel-perfect port from tavvy-mobile/screens/HomeScreen.tsx
 * 
 * Features:
 * - Navy header with Tavvy logo
 * - Standard/Map view toggle
 * - "Find a place that fits your moment" title
 * - Search bar
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
  { id: '1', title: 'Happy Hour at The Pub', subtitle: '2 hours left', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', type: 'event' },
  { id: '2', title: 'Live Music Tonight', subtitle: 'Starts at 8 PM', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', type: 'event' },
  { id: '3', title: 'Food Truck Festival', subtitle: 'All day today', image: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=400&h=300&fit=crop', type: 'event' },
];

// Location fallback is handled by IP geolocation - see getLocationFromIP()

export default function HomeScreen() {
  const { theme, isDark, setThemeMode } = useThemeContext();
  const { user } = useAuth();
  const router = useRouter();
  
  // View mode
  const [viewMode, setViewMode] = useState<'standard' | 'map'>('standard');
  
  // Data states
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<PlaceCardType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Greeting
  const [greeting, setGreeting] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon');
    } else if (hour >= 17 && hour < 21) {
      setGreeting('Good evening');
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
      
      console.log('[Places] Fetched', fetchedPlaces.length, 'places');
      setPlaces(fetchedPlaces);
      
      // Set trending places (first 6 with most signals)
      const sorted = [...fetchedPlaces].sort((a, b) => 
        (b.signals?.length || 0) - (a.signals?.length || 0)
      );
      setTrendingPlaces(sorted.slice(0, 6));
      console.log('[Places] Set', sorted.slice(0, 6).length, 'trending places');
    } catch (error) {
      console.error('[Places] Error fetching places:', error);
      // Set empty arrays on error so we don't show loading forever
      setPlaces([]);
      setTrendingPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
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

  // Switch to map mode
  const switchToMapMode = () => {
    router.push('/app/map');
  };

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  return (
    <>
      <Head>
        <title>Home | TavvY</title>
        <meta name="description" content="Discover places with TavvY's signal-based reviews" />
      </Head>

      <AppLayout>
        <div className="home-screen">
          {/* Main Content */}
          <main className="main-content">
            {/* Greeting Section - iOS Style */}
            <div className="greeting-section">
              <div className="greeting-row">
                <div>
                  <div className="greeting-text">{greeting}</div>
                  <h1 className="greeting-name">there 👋</h1>
                </div>
                <button 
                  className="theme-toggle-btn"
                  onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="tagline">
                <span className="tagline-dot">•</span>
                <span className="tagline-text">Find your perfect spot in seconds. Not hours.</span>
              </div>
            </div>

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
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
              </div>
              
              {/* Quick Action Buttons */}
              <div className="quick-actions">
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    <IoLocationSharp size={24} />
                  </div>
                  <span>Near Me</span>
                </button>
                <button className="quick-action-btn" onClick={switchToMapMode}>
                  <div className="quick-action-icon">
                    <FiMapPin size={24} />
                  </div>
                  <span>Map</span>
                </button>
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    <IoSparkles size={24} />
                  </div>
                  <span>Surprise</span>
                </button>
                <button className="quick-action-btn">
                  <div className="quick-action-icon">
                    ⭐
                  </div>
                  <span>Saved</span>
                </button>
              </div>
            </div>

            {/* Mood Cards Section - iOS Style */}
            <div className="mood-section">
              <h2 className="section-title">WHAT'S YOUR MOOD?</h2>
              <div className="mood-cards">
                <button className="mood-card mood-card-hungry">
                  <div className="mood-badge">
                    <span className="mood-icon">🔥</span>
                    <span className="mood-label">Popular</span>
                  </div>
                  <div className="mood-content">
                    <h3 className="mood-title">Hungry</h3>
                    <p className="mood-subtitle">Restaurants & Food</p>
                  </div>
                  <div className="mood-emoji">🍕</div>
                </button>
                
                <button className="mood-card mood-card-thirsty">
                  <div className="mood-badge">
                    <span className="mood-icon">📈</span>
                    <span className="mood-label">Trending</span>
                  </div>
                  <div className="mood-content">
                    <h3 className="mood-title">Thirsty</h3>
                    <p className="mood-subtitle">Bars & Cafes</p>
                  </div>
                  <div className="mood-emoji">🍸</div>
                </button>
              </div>
            </div>

            {/* Live Now - iOS Style */}
            <section className="section">
              <div className="section-header">
                <h2><span className="live-dot">•</span> Live Now</h2>
                <Link href="/app/happening-now" className="see-all">
                  See All <IoChevronForward size={16} />
                </Link>
              </div>
              <div className="happening-scroll">
                {mockHappeningNow.map((item) => (
                  <div key={item.id} className="happening-card">
                    <img src={item.image} alt={item.title} />
                    <div className="happening-overlay">
                      <span className="happening-badge">🔥 Live</span>
                      <h3>{item.title}</h3>
                      <p>{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Near You */}
            <section className="section">
              <div className="section-header">
                <h2>Trending Near You</h2>
                <button className="see-all" onClick={switchToMapMode}>
                  See All <IoChevronForward size={16} />
                </button>
              </div>
              <div className="trending-scroll">
                {loading ? (
                  <div className="loading-card">
                    <div className="loading-spinner" />
                    <p>Discovering places...</p>
                  </div>
                ) : trendingPlaces.length === 0 ? (
                  <div className="empty-card">
                    <IoLocationSharp size={32} />
                    <p>No places found nearby</p>
                    <span>Pull down to refresh</span>
                  </div>
                ) : (
                  trendingPlaces.map((place, index) => (
                    <Link 
                      key={place.id} 
                      href={`/place/${place.id}`}
                      className="trending-card"
                    >
                      <div className="trending-image">
                        <img 
                          src={place.cover_image_url || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop`} 
                          alt={place.name}
                        />
                        <div className="trending-gradient" />
                        <div className="trending-badge">
                          {place.category === 'Restaurant' ? '🍽️' : 
                           place.category === 'Cafe' ? '☕' : '📍'}
                        </div>
                        <div className="trending-content">
                          <h3>{place.name}</h3>
                          <p>{place.category} • {place.city || 'Nearby'}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* Explore Something New - iOS Style */}
            <div className="explore-new-card">
              <div className="explore-new-header">
                <span className="explore-sparkles">✨</span>
                <span className="explore-count">3 experiences nearby</span>
              </div>
              <h3 className="explore-new-title">Explore Something New</h3>
              <p className="explore-new-subtitle">Events, activities & hidden gems</p>
              <div className="explore-new-icon">🌟</div>
            </div>

            {/* Explore Tavvy */}
            <section className="section explore-section" style={{ display: 'none' }}>
              <div className="section-header">
                <h2>Explore Tavvy</h2>
                <Link href="/app/explore" className="see-all">
                  See All <IoChevronForward size={16} />
                </Link>
              </div>
              <p className="section-subtitle">Curated worlds of experiences</p>
              <div className="explore-scroll">
                {exploreItems.map((item) => (
                  <Link key={item.id} href={item.route} className="explore-card">
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
                  <h3>Did you know?</h3>
                  <p>Tavvy uses tap-based signals instead of star ratings to give you honest, structured insights about places.</p>
                </div>
              </div>
            </section>

            {/* Top Contributors */}
            <section className="section">
              <div className="section-header">
                <h2>🏆 Top Contributors</h2>
                {/* See All button removed - LeaderboardScreen not yet implemented */}
              </div>
              <p className="section-subtitle">Community members making a difference</p>
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
                        <span className="leaderboard-streak">🔥 {user.streak} day streak</span>
                      </div>
                    </div>
                    <div className="leaderboard-right">
                      <span className="leaderboard-taps">{user.taps.toLocaleString()}</span>
                      <span className="leaderboard-label">taps</span>
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
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 24px;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'};
          }

          .search-input-wrapper {
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5'};
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
            background: ${isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5'};
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

          .mood-icon {
            font-size: 12px;
          }

          .mood-label {
            font-size: 10px;
            font-weight: 500;
            color: rgba(255,255,255,0.9);
          }

          .mood-content {
            position: absolute;
            bottom: 12px;
            left: 12px;
            right: 12px;
          }

          .mood-title {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }

          .mood-subtitle {
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            margin: 0;
          }

          .mood-emoji {
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 36px;
            opacity: 0.9;
          }

          /* Live Now Section - iOS Style */
          .section {
            margin-bottom: 32px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .section-header h2 {
            font-size: 16px;
            font-weight: 700;
            color: ${isDark ? '#fff' : ACCENT};
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .live-dot {
            color: #FF3B30;
            font-size: 24px;
            line-height: 0;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .see-all {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 600;
            color: ${TEAL};
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: none;
          }

          .happening-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .happening-scroll::-webkit-scrollbar {
            display: none;
          }

          .happening-card {
            position: relative;
            min-width: 280px;
            height: 180px;
            border-radius: 20px;
            overflow: hidden;
            cursor: pointer;
          }

          .happening-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .happening-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          }

          .happening-badge {
            display: inline-block;
            background: rgba(255,59,48,0.9);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 12px;
            margin-bottom: 8px;
          }

          .happening-overlay h3 {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 4px;
          }

          .happening-overlay p {
            font-size: 13px;
            color: rgba(255,255,255,0.8);
            margin: 0;
          }

          /* Navy Header */
          .nav-header {
            background-color: ${ACCENT};
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .nav-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .nav-logo {
            height: 32px;
            width: auto;
          }

          .menu-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          /* Main Content */
          .main-content {
            padding: 0 20px;
          }

          /* Segment Control */
          .segment-wrap {
            display: flex;
            justify-content: center;
            padding: 16px 0;
          }

          .segment {
            display: flex;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.12)'};
            border-radius: 12px;
            padding: 4px;
          }

          .segment-item {
            padding: 10px 24px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#6B6B6B'};
            cursor: pointer;
            transition: all 0.2s;
          }

          .segment-item.active {
            background: ${ACCENT};
            color: #fff;
          }

          /* Title */
          .main-title {
            font-size: 28px;
            font-weight: 700;
            color: ${isDark ? '#fff' : ACCENT};
            line-height: 1.2;
            margin: 8px 0 20px;
            padding: 0;
          }

          /* Search Bar */
          .search-wrapper {
            margin-bottom: 20px;
          }

          .search-bar {
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.14)'};
            border-radius: 16px;
            padding: 14px 16px;
            gap: 10px;
            transition: border-color 0.2s;
          }

          .search-bar.focused {
            border-color: ${theme.primary};
          }

          .search-icon {
            color: ${isDark ? 'rgba(255,255,255,0.35)' : '#8A8A8A'};
          }

          .search-bar input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: ${isDark ? '#fff' : '#111'};
            outline: none;
          }

          .search-bar input::placeholder {
            color: ${isDark ? 'rgba(255,255,255,0.35)' : '#A0A0A0'};
          }

          .clear-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#8E8E93'};
          }

          /* Category Row */
          .category-row {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding-bottom: 8px;
            margin-bottom: 12px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .category-row::-webkit-scrollbar {
            display: none;
          }

          .category-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            cursor: pointer;
            min-width: 64px;
          }

          .category-icon-wrap {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .category-name {
            font-size: 11px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            white-space: nowrap;
          }

          .category-item.selected .category-name {
            color: ${isDark ? '#fff' : '#111'};
            font-weight: 600;
          }

          /* Hint Text */
          .hint-text {
            font-size: 13px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin-bottom: 20px;
          }

          /* Stories */
          .stories-section {
            margin-bottom: 24px;
          }

          .stories-row {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .stories-row::-webkit-scrollbar {
            display: none;
          }

          .story-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            cursor: pointer;
          }

          .story-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            padding: 3px;
            background: ${isDark ? '#333' : '#e5e5e5'};
          }

          .story-avatar.has-new {
            background: linear-gradient(135deg, #F97316, #EC4899, #8B5CF6);
          }

          .story-avatar.is-user {
            background: ${isDark ? '#333' : '#e5e5e5'};
          }

          .story-avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid ${bgColor};
          }

          .story-add {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${isDark ? '#1E293B' : '#f5f5f5'};
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid ${bgColor};
          }

          .story-add span {
            font-size: 24px;
            color: ${theme.primary};
          }

          .story-name {
            font-size: 11px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            max-width: 64px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: ${isDark ? '#fff' : '#000'};
            margin: 0;
          }

          .see-all {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 15px;
            font-weight: 600;
            color: #0F8A8A;
            text-decoration: none;
            background: none;
            border: none;
            cursor: pointer;
          }

          .section-subtitle {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: -8px 0 16px;
          }

          /* Happening Now */
          .happening-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .happening-scroll::-webkit-scrollbar {
            display: none;
          }

          .happening-card {
            position: relative;
            min-width: 70%;
            max-width: 70%;
            height: 180px;
            border-radius: 16px;
            overflow: hidden;
          }

          .happening-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .happening-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
          }

          .happening-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            color: #fff;
            margin-bottom: 8px;
          }

          .happening-overlay h3 {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 4px;
          }

          .happening-overlay p {
            font-size: 13px;
            color: rgba(255,255,255,0.8);
            margin: 0;
          }

          /* Trending */
          .trending-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .trending-scroll::-webkit-scrollbar {
            display: none;
          }

          .trending-card {
            min-width: 70%;
            max-width: 70%;
            text-decoration: none;
          }

          .trending-image {
            position: relative;
            height: 180px;
            border-radius: 16px;
            overflow: hidden;
            background: ${isDark ? '#1E293B' : '#1F2937'};
          }

          .trending-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .trending-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60%;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
          }

          .trending-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(0,0,0,0.5);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
          }

          .trending-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
          }

          .trending-content h3 {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 4px;
          }

          .trending-content p {
            font-size: 13px;
            color: rgba(255,255,255,0.7);
            margin: 0;
          }

          .loading-card, .empty-card {
            min-width: 70%;
            height: 180px;
            border-radius: 16px;
            background: ${isDark ? '#1E293B' : '#f5f5f5'};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${isDark ? '#333' : '#ddd'};
            border-top-color: ${ACCENT};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-card p, .empty-card p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: 0;
          }

          .empty-card span {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
          }

          .empty-card svg {
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
          }

          /* Explore Tavvy */
          .explore-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .explore-scroll::-webkit-scrollbar {
            display: none;
          }

          .explore-card {
            min-width: 70%;
            max-width: 70%;
            border-radius: 16px;
            overflow: hidden;
            background: ${isDark ? '#1E293B' : '#111827'};
            text-decoration: none;
          }

          .explore-image {
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .explore-emoji {
            font-size: 48px;
          }

          .explore-content {
            padding: 12px 16px;
          }

          .explore-content h3 {
            font-size: 16px;
            font-weight: 600;
            color: #E5E7EB;
            margin: 0 0 8px;
          }

          .explore-meta {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .explore-badge {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }

          .explore-meta span:last-child {
            font-size: 13px;
            color: #9CA3AF;
          }

          /* Did You Know */
          .did-you-know-card {
            display: flex;
            gap: 16px;
            padding: 16px;
            background: ${isDark ? '#1E293B' : '#FFF9E6'};
            border-radius: 16px;
          }

          .dyk-icon {
            font-size: 24px;
            color: #FFD60A;
          }

          .dyk-content h3 {
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#000'};
            margin: 0 0 4px;
          }

          .dyk-content p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            margin: 0;
            line-height: 1.4;
          }

          /* Leaderboard */
          .leaderboard-card {
            background: ${isDark ? '#1E293B' : '#fff'};
            border-radius: 16px;
            overflow: hidden;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .leaderboard-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0'};
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
            width: 28px;
            text-align: center;
          }

          .leaderboard-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #E8F4FD;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .leaderboard-avatar span {
            font-size: 16px;
            font-weight: 700;
            color: #0A84FF;
          }

          .leaderboard-info {
            display: flex;
            flex-direction: column;
          }

          .leaderboard-name {
            font-size: 15px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#000'};
          }

          .leaderboard-streak {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
          }

          .leaderboard-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }

          .leaderboard-taps {
            font-size: 18px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#000'};
          }

          .leaderboard-label {
            font-size: 11px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (min-width: 768px) {
            .happening-card,
            .trending-card,
            .explore-card {
              min-width: 320px;
              max-width: 320px;
            }

            .main-title {
              font-size: 32px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
