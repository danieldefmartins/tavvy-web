/**
 * Home Screen - Main app entry point
 * Pixel-perfect port from tavvy-mobile/screens/HomeScreen.tsx
 * 
 * Features:
 * - Time-based greeting
 * - Location display
 * - Search bar with suggestions
 * - Category filter pills
 * - Trending Near You section
 * - Place cards with signals
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { fetchPlacesInBounds, searchPlaces, PlaceCard as PlaceCardType } from '../../lib/placeService';
import { spacing, borderRadius, Colors } from '../../constants/Colors';
import { FiSearch, FiX, FiMapPin, FiUser, FiChevronRight } from 'react-icons/fi';

// Categories for filtering - matching mobile app
const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️' },
  { id: 'cafes', name: 'Cafes', icon: '☕' },
  { id: 'bars', name: 'Bars', icon: '🍺' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'rv-camping', name: 'RV & Camping', icon: '🏕️' },
  { id: 'hotels', name: 'Hotels', icon: '🏨' },
  { id: 'attractions', name: 'Attractions', icon: '🎢' },
];

// Trending categories for the explore section
const trendingCategories = [
  { id: 'cities', name: 'Cities', icon: '🏙️', color: '#3B82F6' },
  { id: 'universes', name: 'Universes', icon: '🪐', color: '#8B5CF6' },
  { id: 'experiences', name: 'Experiences', icon: '✨', color: '#10B981' },
  { id: 'happening', name: 'Happening Now', icon: '🔥', color: '#F97316' },
];

// Default location (San Francisco)
const DEFAULT_LOCATION: [number, number] = [-122.4194, 37.7749];

export default function HomeScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  
  // Data states
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<PlaceCardType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
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

  // Get user location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(loc);
          reverseGeocode(loc);
        },
        (error) => {
          console.log('Location error:', error);
          setUserLocation(DEFAULT_LOCATION);
          setLocationName('San Francisco, CA');
        }
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setLocationName('San Francisco, CA');
    }
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
    if (!userLocation) return;
    
    setLoading(true);
    try {
      // Create bounds around user location (roughly 5 mile radius)
      const bounds = {
        ne: [userLocation[0] + 0.1, userLocation[1] + 0.1] as [number, number],
        sw: [userLocation[0] - 0.1, userLocation[1] - 0.1] as [number, number],
      };
      
      const categoryFilter = selectedCategory === 'all' ? undefined : 
        categories.find(c => c.id === selectedCategory)?.name;
      
      const fetchedPlaces = await fetchPlacesInBounds(
        bounds,
        userLocation,
        categoryFilter
      );
      
      setPlaces(fetchedPlaces);
      
      // Set trending places (first 4 with most signals)
      const sorted = [...fetchedPlaces].sort((a, b) => 
        (b.signals?.length || 0) - (a.signals?.length || 0)
      );
      setTrendingPlaces(sorted.slice(0, 4));
    } catch (error) {
      console.error('Error fetching places:', error);
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
    setSelectedCategory(categoryId);
    setSearchQuery('');
  };

  return (
    <>
      <Head>
        <title>Home | TavvY</title>
        <meta name="description" content="Discover places with TavvY's signal-based reviews" />
      </Head>

      <AppLayout>
        <div className="home-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="home-header" style={{ backgroundColor: theme.background }}>
            {/* Top Row: Greeting + Avatar */}
            <div className="header-top">
              <div className="greeting-section">
                <h1 className="greeting" style={{ color: theme.text }}>
                  {greeting}
                </h1>
                <button className="location-btn" style={{ color: theme.textSecondary }}>
                  <FiMapPin size={14} />
                  <span>{locationName || 'Getting location...'}</span>
                </button>
              </div>
              <div className="header-actions">
                {user ? (
                  <a href="/app/apps" className="avatar" style={{ backgroundColor: theme.primary }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </a>
                ) : (
                  <a href="/app/login" className="avatar-btn">
                    <FiUser size={24} color={theme.textSecondary} />
                  </a>
                )}
              </div>
            </div>
            
            {/* Search Bar */}
            <div 
              className="search-container"
              style={{ 
                backgroundColor: theme.inputBackground,
                borderColor: isSearchFocused ? theme.primary : theme.inputBorder,
              }}
            >
              <FiSearch size={20} color={theme.textSecondary} />
              <input
                type="text"
                className="search-input"
                placeholder="Search places, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ color: theme.text }}
              />
              {searchQuery && (
                <button 
                  className="clear-button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchNearbyPlaces();
                  }}
                >
                  <FiX size={18} color={theme.textSecondary} />
                </button>
              )}
            </div>
            
            {/* Category Pills */}
            <div className="categories-scroll">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                  style={{
                    backgroundColor: selectedCategory === category.id ? theme.primary : theme.surface,
                    color: selectedCategory === category.id ? '#FFFFFF' : theme.text,
                  }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            {/* Trending Near You Section */}
            {trendingPlaces.length > 0 && !searchQuery && (
              <section className="trending-section">
                <div className="section-header">
                  <h2 style={{ color: theme.text }}>Trending Near You</h2>
                  <button className="see-all-btn" style={{ color: theme.primary }}>
                    See All <FiChevronRight size={16} />
                  </button>
                </div>
                <div className="trending-scroll">
                  {trendingPlaces.map((place) => (
                    <div key={place.id} className="trending-card">
                      <PlaceCard place={place} showQuickActions={false} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Explore Categories */}
            {!searchQuery && (
              <section className="explore-section">
                <div className="section-header">
                  <h2 style={{ color: theme.text }}>Explore</h2>
                </div>
                <div className="explore-grid">
                  {trendingCategories.map((cat) => (
                    <a 
                      key={cat.id} 
                      href={`/app/${cat.id === 'universes' ? 'explore' : cat.id}`}
                      className="explore-card"
                      style={{ backgroundColor: cat.color }}
                    >
                      <span className="explore-icon">{cat.icon}</span>
                      <span className="explore-name">{cat.name}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Places List */}
            <section className="places-section">
              <div className="section-header">
                <h2 style={{ color: theme.text }}>
                  {searchQuery ? 'Search Results' : 'Places Near You'}
                </h2>
              </div>
              
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p style={{ color: theme.textSecondary }}>Finding places near you...</p>
                </div>
              ) : places.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🗺️</span>
                  <h3 style={{ color: theme.text }}>No places found</h3>
                  <p style={{ color: theme.textSecondary }}>
                    Try adjusting your search or exploring a different area
                  </p>
                </div>
              ) : (
                <div className="places-list">
                  {places.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>

        <style jsx>{`
          .home-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .home-header {
            position: sticky;
            top: 0;
            z-index: 100;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${spacing.lg}px;
          }
          
          .greeting-section {
            flex: 1;
          }
          
          .greeting {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .location-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            padding: 4px 0;
            font-size: 14px;
            cursor: pointer;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
          }
          
          .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 16px;
            text-decoration: none;
          }
          
          .avatar-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${theme.surface};
            text-decoration: none;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
            border-width: 1px;
            border-style: solid;
            margin-bottom: ${spacing.md}px;
            gap: 12px;
          }
          
          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .search-input::placeholder {
            color: ${theme.inputPlaceholder};
          }
          
          .clear-button {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            overflow-x: auto;
            padding-bottom: ${spacing.sm}px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .category-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .category-pill:hover {
            transform: scale(1.02);
          }
          
          .category-icon {
            font-size: 16px;
          }
          
          .main-content {
            padding: 0 ${spacing.lg}px;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${spacing.md}px;
          }
          
          .section-header h2 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }
          
          .see-all-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .trending-section {
            margin-bottom: ${spacing.xxl}px;
          }
          
          .trending-scroll {
            display: flex;
            gap: ${spacing.md}px;
            overflow-x: auto;
            padding-bottom: ${spacing.sm}px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .trending-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .trending-card {
            min-width: 280px;
            max-width: 280px;
          }
          
          .explore-section {
            margin-bottom: ${spacing.xxl}px;
          }
          
          .explore-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.md}px;
          }
          
          .explore-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: ${spacing.xl}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .explore-card:hover {
            transform: scale(1.02);
          }
          
          .explore-icon {
            font-size: 32px;
            margin-bottom: ${spacing.sm}px;
          }
          
          .explore-name {
            color: white;
            font-size: 14px;
            font-weight: 600;
          }
          
          .places-section {
            margin-bottom: ${spacing.xxl}px;
          }
          
          .places-list {
            display: flex;
            flex-direction: column;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: ${spacing.md}px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            text-align: center;
          }
          
          .empty-icon {
            font-size: 64px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0;
          }
          
          @media (min-width: 768px) {
            .explore-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .trending-card {
              min-width: 320px;
              max-width: 320px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
