/**
 * Saved Places Screen
 * View user's saved/bookmarked places
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import PlaceCard from '../../components/PlaceCard';
import { FiArrowLeft, FiBookmark, FiSearch, FiTrash2 } from 'react-icons/fi';

interface SavedPlace {
  id: string;
  place_id: string;
  created_at: string;
  place: {
    id: string;
    name: string;
    slug?: string;
    category?: string;
    address?: string;
    city?: string;
    photo_url?: string;
  };
}

export default function SavedScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { user } = useAuth();

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchSavedPlaces();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select(`
          id,
          place_id,
          created_at,
          place:places(id, name, slug, category, address, city, photo_url)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedPlaces(data as any);
      }
    } catch (error) {
      console.error('Error fetching saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedId: string) => {
    try {
      await supabase
        .from('saved_places')
        .delete()
        .eq('id', savedId);
      
      setSavedPlaces(prev => prev.filter(p => p.id !== savedId));
    } catch (error) {
      console.error('Error removing saved place:', error);
    }
  };

  const filteredPlaces = savedPlaces.filter(saved =>
    saved.place?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    saved.place?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <AppLayout>
        <div className="auth-prompt" style={{ backgroundColor: theme.background }}>
          <FiBookmark size={64} color={theme.textTertiary} />
          <h1 style={{ color: theme.text }}>Sign in to view saved places</h1>
          <p style={{ color: theme.textSecondary }}>
            Save your favorite places and access them anytime
          </p>
          <Link href="/app/login" className="sign-in-button" style={{ backgroundColor: theme.primary }}>
            Sign In
          </Link>
          <style jsx>{`
            .auth-prompt {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
              text-align: center;
            }
            h1 { font-size: 24px; font-weight: 700; margin: 24px 0 12px; }
            p { font-size: 16px; margin: 0 0 32px; max-width: 300px; }
            .sign-in-button {
              display: block;
              padding: 16px 48px;
              border-radius: ${borderRadius.lg}px;
              color: white;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
            }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Saved Places | TavvY</title>
        <meta name="description" content="Your saved places on TavvY" />
      </Head>

      <AppLayout>
        <div className="saved-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="saved-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Saved Places</h1>
            <div style={{ width: 40 }} />
          </header>

          {/* Search */}
          <div className="search-section">
            <div className="search-container" style={{ backgroundColor: theme.surface }}>
              <FiSearch size={18} color={theme.textSecondary} />
              <input
                type="text"
                placeholder="Search saved places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="empty-state">
                <FiBookmark size={64} color={theme.textTertiary} />
                <h3 style={{ color: theme.text }}>
                  {searchQuery ? 'No matching places' : 'No saved places yet'}
                </h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Tap the bookmark icon on any place to save it here'}
                </p>
                {!searchQuery && (
                  <Link href="/app" className="explore-link" style={{ color: theme.primary }}>
                    Explore Places
                  </Link>
                )}
              </div>
            ) : (
              <div className="places-list">
                {filteredPlaces.map((saved) => (
                  <div key={saved.id} className="saved-item">
                    <Link href={`/place/${saved.place?.slug || saved.place_id}`} className="place-link">
                      <PlaceCard
                        place={{
                          id: saved.place?.id || saved.place_id,
                          name: saved.place?.name || 'Unknown Place',
                          category: saved.place?.category,
                          address: saved.place?.address,
                          city: saved.place?.city,
                          photo_url: saved.place?.photo_url,
                        }}
                        compact
                      />
                    </Link>
                    <button 
                      className="remove-button"
                      onClick={() => handleRemove(saved.id)}
                      style={{ backgroundColor: theme.surface }}
                    >
                      <FiTrash2 size={18} color="#EF4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .saved-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .saved-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .saved-header h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .search-section {
            padding: 0 ${spacing.lg}px ${spacing.md}px;
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
          
          .content {
            padding: 0 ${spacing.lg}px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 60px;
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
            padding: 60px 20px;
          }
          
          .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            margin: ${spacing.lg}px 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0 0 ${spacing.lg}px;
            max-width: 280px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .explore-link {
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
          }
          
          .places-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .saved-item {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
          }
          
          .place-link {
            flex: 1;
            text-decoration: none;
          }
          
          .remove-button {
            width: 44px;
            height: 44px;
            border-radius: ${borderRadius.md}px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
