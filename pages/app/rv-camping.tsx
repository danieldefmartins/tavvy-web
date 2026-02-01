/**
 * RV & Camping Browse Screen
 * Find RV parks, campgrounds, and outdoor destinations
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiFilter } from 'react-icons/fi';
import { UnifiedHeader } from '../../components/UnifiedHeader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  address_line1?: string;
  city?: string;
  region?: string;
  photos?: string[];
  signals?: any[];
  latitude?: number;
  longitude?: number;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏕️' },
  { id: 'rv-parks', name: 'RV Parks', icon: '🚐' },
  { id: 'campgrounds', name: 'Campgrounds', icon: '⛺' },
  { id: 'glamping', name: 'Glamping', icon: '🏠' },
  { id: 'national-parks', name: 'National Parks', icon: '🌲' },
  { id: 'beaches', name: 'Beaches', icon: '🏖️' },
];

export default function RVCampingScreen() {
  const { theme } = useThemeContext();
  const [places, setPlaces] = useState<Place[]>([]);
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchPlaces();
  }, [selectedCategory]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('places')
        .select('*, signals(*)')
        .eq('tavvy_category', 'rv_camping')
        .limit(50);

      const { data, error } = await query;

      if (!error) {
        setPlaces(data || []);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>RV & Camping | TavvY</title>
        <meta name="description" content="Find RV parks, campgrounds, and outdoor destinations on TavvY" />
      </Head>

      <AppLayout>
        <div className="rv-screen" style={{ backgroundColor: theme.background }}>
          {/* Unified Header */}
          <UnifiedHeader
            screenKey="rvCamping"
            title="RV & Camping"
            searchPlaceholder="Search campgrounds..."
            showBackButton={false}
            onSearch={setSearchQuery}
          />

          {/* Category Filter */}
          <div className="category-filter">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? '#EA580C' : theme.surface,
                  color: selectedCategory === cat.id ? 'white' : theme.text,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Places List */}
          <section className="places-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : 'Popular Destinations'}
            </h2>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p style={{ color: theme.textSecondary }}>Finding campgrounds...</p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="empty-state">
                <span>🏕️</span>
                <h3 style={{ color: theme.text }}>No places found</h3>
                <p style={{ color: theme.textSecondary }}>
                  Try adjusting your search or explore a different category
                </p>
              </div>
            ) : (
              <div className="places-list">
                {filteredPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place as any} />
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .rv-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .rv-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.xl}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .rv-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .rv-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            background: rgba(255,255,255,0.2);
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: white;
            outline: none;
          }
          
          .search-container input::placeholder {
            color: rgba(255,255,255,0.7);
          }
          
          .category-filter {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .category-filter::-webkit-scrollbar {
            display: none;
          }
          
          .category-chip {
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
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${theme.surface};
            border-top-color: #EA580C;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: ${spacing.md}px;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
          
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
            text-align: center;
          }
          
          .empty-state span {
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
          
          .places-list {
            display: flex;
            flex-direction: column;
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
