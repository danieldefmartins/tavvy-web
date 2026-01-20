/**
 * Explore Screen - Universe Discovery
 * Ported from tavvy-mobile/screens/UniverseDiscoveryScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  cover_image_url?: string;
  place_count?: number;
}

export default function ExploreScreen() {
  const { theme } = useThemeContext();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUniverses();
  }, []);

  const fetchUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .order('name');

      if (error) throw error;
      setUniverses(data || []);
    } catch (error) {
      console.error('Error fetching universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniverses = universes.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Explore Universes | TavvY</title>
        <meta name="description" content="Discover TavvY Universes - curated collections of places" />
      </Head>

      <AppLayout>
        <div className="explore-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="explore-header">
            <h1 className="title" style={{ color: theme.text }}>
              🪐 Universes
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Discover curated collections of places
            </p>
            
            {/* Search */}
            <div 
              className="search-container"
              style={{ 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              }}
            >
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search universes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
          </header>

          {/* Universe Grid */}
          <main className="universes-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" style={{ borderColor: theme.primary }} />
                <p style={{ color: theme.textSecondary }}>Loading universes...</p>
              </div>
            ) : filteredUniverses.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🌌</span>
                <h3 style={{ color: theme.text }}>No universes found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery ? 'Try a different search term' : 'Check back soon for new universes'}
                </p>
              </div>
            ) : (
              <div className="universes-grid">
                {filteredUniverses.map((universe) => (
                  <Link 
                    key={universe.id} 
                    href={`/app/universe/${universe.slug || universe.id}`}
                    className="universe-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="universe-image-container">
                      {universe.cover_image_url ? (
                        <img 
                          src={universe.cover_image_url} 
                          alt={universe.name}
                          className="universe-image"
                        />
                      ) : (
                        <div 
                          className="universe-placeholder"
                          style={{ backgroundColor: theme.surface }}
                        >
                          <span className="universe-icon">
                            {universe.icon || '🪐'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="universe-info">
                      <h3 className="universe-name" style={{ color: theme.text }}>
                        {universe.icon && <span>{universe.icon} </span>}
                        {universe.name}
                      </h3>
                      {universe.description && (
                        <p className="universe-description" style={{ color: theme.textSecondary }}>
                          {universe.description}
                        </p>
                      )}
                      {universe.place_count !== undefined && (
                        <span className="universe-count" style={{ color: theme.textTertiary }}>
                          {universe.place_count} places
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .explore-screen {
            min-height: 100vh;
          }
          
          .explore-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .subtitle {
            font-size: 14px;
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
            border-width: 1px;
            border-style: solid;
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
          
          .universes-container {
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
          
          .universes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .universe-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .universe-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          }
          
          .universe-image-container {
            height: 120px;
            overflow: hidden;
          }
          
          .universe-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .universe-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .universe-icon {
            font-size: 40px;
          }
          
          .universe-info {
            padding: ${spacing.md}px;
          }
          
          .universe-name {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .universe-description {
            font-size: 13px;
            margin: 0 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .universe-count {
            font-size: 12px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
