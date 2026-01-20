/**
 * Home Screen - Main app entry point
 * Ported from tavvy-mobile/screens/HomeScreen.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { fetchPlacesInBounds, searchPlaces, PlaceCard as PlaceCardType } from '../../lib/placeService';
import { spacing, borderRadius } from '../../constants/Colors';

// Categories for filtering
const categories = ['All', 'Restaurants', 'Cafes', 'Bars', 'Shopping', 'RV & Camping', 'Hotels'];

// Default location (San Francisco)
const DEFAULT_LOCATION: [number, number] = [-122.4194, 37.7749];

export default function HomeScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  
  // Data states
  const [places, setPlaces] = useState<PlaceCardType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Greeting
  const [greeting, setGreeting] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
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
          setLocationName('San Francisco');
        }
      );
    } else {
      setUserLocation(DEFAULT_LOCATION);
      setLocationName('San Francisco');
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
      
      const fetchedPlaces = await fetchPlacesInBounds(
        bounds,
        userLocation,
        selectedCategory === 'All' ? undefined : selectedCategory
      );
      
      setPlaces(fetchedPlaces);
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
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
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
          <header className="home-header">
            <div className="header-top">
              <div className="greeting-section">
                <h1 className="greeting" style={{ color: theme.text }}>
                  {greeting}
                </h1>
                {locationName && (
                  <p className="location" style={{ color: theme.textSecondary }}>
                    📍 {locationName}
                  </p>
                )}
              </div>
              <div className="header-actions">
                {user ? (
                  <div 
                    className="avatar"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <a href="/app/apps" className="login-link" style={{ color: theme.primary }}>
                    Log in
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
              <span className="search-icon">🔍</span>
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
                  style={{ color: theme.textSecondary }}
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Category Pills */}
            <div className="categories-scroll">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                  style={{
                    backgroundColor: selectedCategory === category ? theme.primary : theme.surface,
                    color: selectedCategory === category ? '#FFFFFF' : theme.text,
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </header>

          {/* Places List */}
          <main className="places-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ borderColor: theme.primary }} />
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
          </main>
        </div>

        <style jsx>{`
          .home-screen {
            min-height: 100vh;
          }
          
          .home-header {
            position: sticky;
            top: 0;
            z-index: 100;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            background: inherit;
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
          
          .location {
            font-size: 14px;
            margin: 4px 0 0;
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
          }
          
          .login-link {
            font-weight: 600;
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
            transition: border-color 0.2s;
          }
          
          .search-icon {
            font-size: 16px;
            margin-right: 12px;
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
            font-size: 16px;
            cursor: pointer;
            padding: 4px;
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
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .category-pill:hover {
            opacity: 0.9;
          }
          
          .places-container {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
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
            border-width: 3px;
            border-style: solid;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
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
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .empty-state h3 {
            margin: 0 0 8px;
            font-size: 20px;
          }
          
          .empty-state p {
            margin: 0;
            font-size: 14px;
          }
          
          .places-list {
            display: flex;
            flex-direction: column;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
