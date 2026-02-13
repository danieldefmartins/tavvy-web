/**
 * City Detail Screen
 * Browse places in a specific city
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import PlaceCard from '../../../components/PlaceCard';
import { FiArrowLeft, FiSearch, FiMapPin, FiGrid, FiList } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface City {
  id: string;
  name: string;
  slug: string;
  state?: string;
  country?: string;
  cover_image_url?: string;
  description?: string;
  population?: number;
}

interface Place {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  address?: string;
  city?: string;
  photo_url?: string;
  rating?: number;
  review_count?: number;
}

export default function CityDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { theme } = useThemeContext();

  const [city, setCity] = useState<City | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: '🏠' },
    { id: 'restaurants', name: 'Restaurants', icon: '🍽️' },
    { id: 'hotels', name: 'Hotels', icon: '🏨' },
    { id: 'attractions', name: 'Attractions', icon: '🎡' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  ];

  useEffect(() => {
    if (slug) {
      fetchCityData();
    }
  }, [slug]);

  const fetchCityData = async () => {
    setLoading(true);
    try {
      // Fetch city info
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (!cityError && cityData) {
        setCity(cityData);

        // Fetch places in this city
        const { data: placesData, error: placesError } = await supabase
          .from('places')
          .select('*')
          .eq('city_slug', slug)
          .limit(50);

        if (!placesError) {
          setPlaces(placesData || []);
        }
      } else {
        // Create a placeholder city from slug
        setCity({
          id: slug as string,
          name: (slug as string).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          slug: slug as string,
        });
      }
    } catch (error) {
      console.error('Error fetching city:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = places.filter(place => {
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!city && !loading) {
    return (
      <AppLayout hideTabBar>
        <div className="error-screen" style={{ backgroundColor: theme.background }}>
          <span>🏙️</span>
          <h1 style={{ color: theme.text }}>City not found</h1>
          <button onClick={() => router.push('/app/cities', undefined, { locale })} style={{ color: theme.primary }}>
            Browse Cities
          </button>
          <style jsx>{`
            .error-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              text-align: center;
            }
            span { font-size: 64px; margin-bottom: 16px; }
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{city?.name || 'City'} | TavvY</title>
        <meta name="description" content={city?.description || `Explore ${city?.name} on TavvY`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="city-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="city-header">
            <img 
              src={city?.cover_image_url || `https://source.unsplash.com/800x400/?${city?.name},city`}
              alt={city?.name}
              className="cover-image"
            />
            <div className="header-overlay">
              <button className="back-button" onClick={() => router.back()}>
                <FiArrowLeft size={24} color="white" />
              </button>
              <div className="city-info">
                <h1>{city?.name}</h1>
                {city?.state && city?.country && (
                  <p><FiMapPin size={14} /> {city.state}, {city.country}</p>
                )}
              </div>
            </div>
          </header>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container" style={{ backgroundColor: theme.surface }}>
              <FiSearch size={18} color={theme.textSecondary} />
              <input
                type="text"
                placeholder={`Search places in ${city?.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
            <div className="view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                style={{ backgroundColor: viewMode === 'grid' ? theme.primary : theme.surface }}
              >
                <FiGrid size={18} color={viewMode === 'grid' ? 'white' : theme.textSecondary} />
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                style={{ backgroundColor: viewMode === 'list' ? theme.primary : theme.surface }}
              >
                <FiList size={18} color={viewMode === 'list' ? 'white' : theme.textSecondary} />
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? theme.primary : theme.surface,
                  color: selectedCategory === cat.id ? 'white' : theme.text,
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Description */}
          {city?.description && (
            <div className="description-section">
              <p style={{ color: theme.textSecondary }}>{city.description}</p>
            </div>
          )}

          {/* Places */}
          <section className="places-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : `Places in ${city?.name}`}
            </h2>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="empty-state">
                <span>🏙️</span>
                <h3 style={{ color: theme.text }}>No places found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery ? 'Try a different search' : `Be the first to add a place in ${city?.name}`}
                </p>
              </div>
            ) : (
              <div className={`places-${viewMode}`}>
                {filteredPlaces.map((place) => (
                  <Link key={place.id} href={`/place/${place.slug || place.id}`} locale={locale}>
                    <PlaceCard
                      place={{
                        id: place.id,
                        name: place.name,
                        category: place.category || 'Place',
                        address: place.address,
                        city: place.city,
                        photo_url: place.photo_url,
                      }}
                      compact={viewMode === 'list'}
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .city-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .city-header {
            position: relative;
            height: 220px;
          }
          
          .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(rgba(0,0,0,0.3), transparent 30%, rgba(0,0,0,0.7));
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .city-info h1 {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .city-info p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .search-section {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
          }
          
          .search-container {
            flex: 1;
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
          
          .view-toggle {
            display: flex;
            gap: 4px;
          }
          
          .view-toggle button {
            width: 44px;
            height: 44px;
            border-radius: ${borderRadius.md}px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            padding: 0 ${spacing.lg}px ${spacing.md}px;
            overflow-x: auto;
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
          }
          
          .description-section {
            padding: 0 ${spacing.lg}px ${spacing.md}px;
          }
          
          .description-section p {
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          
          .places-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .places-section h2 {
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
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0;
          }
          
          .places-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .places-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
