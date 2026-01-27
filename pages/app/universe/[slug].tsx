/**
 * Universe Landing Screen
 * Shows places within a specific universe
 * Matches mobile app UniverseLandingScreen exactly
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Hero section with universe image and info
 * - Search and filter functionality
 * - Places grid with signal badges
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import PlaceCard from '../../../components/PlaceCard';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { IoFlame, IoThumbsUp, IoSparkles, IoAlertCircle } from 'react-icons/io5';

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  cover_image_url?: string;
  total_signals?: number;
}

interface Place {
  id: string;
  name: string;
  category?: string;
  address_line1?: string;
  city?: string;
  photos?: string[];
  signals?: any[];
}

export default function UniverseDetailScreen() {
  const router = useRouter();
  const { slug } = router.query;
  const { theme } = useThemeContext();

  const [universe, setUniverse] = useState<Universe | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (slug) {
      fetchUniverseData();
    }
  }, [slug]);

  const fetchUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch universe details
      const { data: universeData, error: universeError } = await supabase
        .from('atlas_universes')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (universeError) throw universeError;
      setUniverse(universeData);

      // Fetch places in this universe
      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('*, signals(*)')
        .eq('universe_id', universeData.id)
        .limit(50);

      if (!placesError) {
        setPlaces(placesData || []);
      }
    } catch (error) {
      console.error('Error fetching universe:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-screen" style={{ backgroundColor: theme.background }}>
          <div className="loading-spinner" />
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid ${theme.surface};
              border-top-color: ${theme.primary};
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  if (!universe) {
    return (
      <AppLayout>
        <div className="error-screen" style={{ backgroundColor: theme.background }}>
          <span className="error-icon">🌌</span>
          <h1 style={{ color: theme.text }}>Universe not found</h1>
          <button onClick={() => router.push('/app/explore')} style={{ color: theme.primary }}>
            Back to Universes
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
            .error-icon { font-size: 64px; margin-bottom: 16px; }
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{universe.name} | TavvY</title>
        <meta name="description" content={universe.description || `Explore ${universe.name} on TavvY`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="universe-detail" style={{ backgroundColor: theme.background }}>
          {/* Hero Section */}
          <div className="hero-section">
            <img 
              src={universe.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
              alt={universe.name}
              className="hero-image"
            />
            <div className="hero-overlay">
              <button 
                className="back-button"
                onClick={() => router.back()}
              >
                <FiArrowLeft size={24} color="white" />
              </button>
              <div className="hero-content">
                {universe.icon && <span className="universe-icon">{universe.icon}</span>}
                <h1 className="universe-name">{universe.name}</h1>
                {universe.description && (
                  <p className="universe-description">{universe.description}</p>
                )}
                <div className="universe-stats">
                  <span>{places.length} places</span>
                  {universe.total_signals && <span>• {universe.total_signals} signals</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-section" style={{ backgroundColor: theme.background }}>
            <div className="search-container" style={{ backgroundColor: theme.surface }}>
              <FiSearch size={18} color={theme.textSecondary} />
              <input
                type="text"
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
          </div>

          {/* Places List */}
          <div className="places-section">
            {filteredPlaces.length === 0 ? (
              <div className="empty-state">
                <span>🗺️</span>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery ? 'No places match your search' : 'No places in this universe yet'}
                </p>
              </div>
            ) : (
              <div className="places-list">
                {filteredPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place as any} />
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .universe-detail {
            min-height: 100vh;
          }
          
          .hero-section {
            position: relative;
            height: 280px;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(transparent 30%, rgba(0,0,0,0.8));
            padding: ${spacing.lg}px;
            display: flex;
            flex-direction: column;
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
            margin-top: env(safe-area-inset-top, 0);
          }
          
          .hero-content {
            margin-top: auto;
          }
          
          .universe-icon {
            font-size: 40px;
            display: block;
            margin-bottom: ${spacing.sm}px;
          }
          
          .universe-name {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .universe-description {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 ${spacing.sm}px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .universe-stats {
            font-size: 13px;
            color: rgba(255,255,255,0.7);
          }
          
          .universe-stats span {
            margin-right: ${spacing.sm}px;
          }
          
          .search-section {
            padding: ${spacing.lg}px;
            position: sticky;
            top: 0;
            z-index: 10;
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
          
          .places-section {
            padding: 0 ${spacing.lg}px ${spacing.xxl}px;
          }
          
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }
          
          .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: ${spacing.md}px;
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
