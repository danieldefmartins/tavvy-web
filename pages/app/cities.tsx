/**
 * Cities Browse Screen
 * Browse and rate cities
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { UnifiedHeader } from '../../components/UnifiedHeader';

interface City {
  id: string;
  name: string;
  state?: string;
  country?: string;
  image_url?: string;
  total_signals?: number;
  population?: number;
}

// Featured cities for display
const FEATURED_CITIES = [
  { id: '1', name: 'New York', state: 'NY', country: 'USA', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800' },
  { id: '2', name: 'Los Angeles', state: 'CA', country: 'USA', image_url: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800' },
  { id: '3', name: 'Chicago', state: 'IL', country: 'USA', image_url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800' },
  { id: '4', name: 'Miami', state: 'FL', country: 'USA', image_url: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800' },
  { id: '5', name: 'San Francisco', state: 'CA', country: 'USA', image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800' },
  { id: '6', name: 'Seattle', state: 'WA', country: 'USA', image_url: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800' },
];

export default function CitiesBrowseScreen() {
  const { theme } = useThemeContext();
  const [cities, setCities] = useState<City[]>(FEATURED_CITIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('tavvy_cities')
        .select('*')
        .eq('is_active', true)
        .order('population', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Cities | TavvY</title>
        <meta name="description" content="Explore and rate cities on TavvY" />
      </Head>

      <AppLayout>
        <div className="cities-screen" style={{ backgroundColor: theme.background }}>
          {/* Unified Header */}
          <UnifiedHeader
            screenKey="cities"
            title="Cities"
            searchPlaceholder="Search cities..."
            showBackButton={false}
            onSearch={setSearchQuery}
          />

          {/* Featured Section */}
          {!searchQuery && (
            <section className="featured-section">
              <h2 style={{ color: theme.text }}>Featured Cities</h2>
              <div className="featured-scroll">
                {cities.slice(0, 4).map((city) => (
                  <Link 
                    key={city.id}
                    href={`/app/city/${city.id}`}
                    className="featured-card"
                  >
                    <img 
                      src={city.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800'}
                      alt={city.name}
                      className="featured-image"
                    />
                    <div className="featured-overlay">
                      <h3>{city.name}</h3>
                      <span>{city.state}, {city.country || 'USA'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Cities List */}
          <section className="cities-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : 'All Cities'}
            </h2>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="empty-state">
                <span>🏙️</span>
                <p style={{ color: theme.textSecondary }}>No cities found</p>
              </div>
            ) : (
              <div className="cities-list">
                {filteredCities.map((city) => (
                  <Link 
                    key={city.id}
                    href={`/app/city/${city.id}`}
                    className="city-item"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="city-image-container">
                      <img 
                        src={city.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400'}
                        alt={city.name}
                        className="city-image"
                      />
                    </div>
                    <div className="city-info">
                      <h3 style={{ color: theme.text }}>{city.name}</h3>
                      <p style={{ color: theme.textSecondary }}>
                        <FiMapPin size={12} /> {city.state}, {city.country || 'USA'}
                      </p>
                      {city.total_signals && (
                        <span className="city-signals" style={{ color: theme.primary }}>
                          {city.total_signals} signals
                        </span>
                      )}
                    </div>
                    <FiChevronRight size={20} color={theme.textTertiary} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .cities-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .cities-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .header-content h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .header-content p {
            font-size: 14px;
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .featured-section {
            padding: 0 ${spacing.lg}px ${spacing.xl}px;
          }
          
          .featured-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .featured-scroll {
            display: flex;
            gap: ${spacing.md}px;
            overflow-x: auto;
            padding-bottom: ${spacing.sm}px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .featured-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .featured-card {
            position: relative;
            min-width: 200px;
            height: 140px;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
          }
          
          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .featured-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: ${spacing.md}px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
          }
          
          .featured-overlay h3 {
            color: white;
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }
          
          .featured-overlay span {
            color: rgba(255,255,255,0.8);
            font-size: 12px;
          }
          
          .cities-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .cities-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 40px;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
          
          .empty-state {
            text-align: center;
            padding: 40px;
          }
          
          .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: ${spacing.md}px;
          }
          
          .cities-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .city-item {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .city-item:hover {
            transform: translateX(4px);
          }
          
          .city-image-container {
            width: 60px;
            height: 60px;
            border-radius: ${borderRadius.md}px;
            overflow: hidden;
          }
          
          .city-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .city-info {
            flex: 1;
          }
          
          .city-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .city-info p {
            font-size: 13px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .city-signals {
            font-size: 12px;
            font-weight: 500;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
