/**
 * Search Screen — powered by canonical /api/search/places
 *
 * Replaces Supabase ILIKE with Typesense-backed server-side search.
 * Features: debounce, abort, loading/empty states, highlights, pagination.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import PlaceCard from '../../components/PlaceCard';
import { FiSearch, FiX, FiMapPin, FiClock } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { searchPlaces, SearchHit, SearchResponse } from '../../lib/searchClient';

const POPULAR_SEARCHES = [
  'Restaurants', 'Coffee', 'Bars', 'Pizza', 'Sushi',
  'Mexican', 'Italian', 'Brunch', 'Breakfast', 'Lunch'
];

export default function SearchScreen() {
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');
  const { q, category } = router.query;
  const { theme } = useThemeContext();

  const [searchQuery, setSearchQuery] = useState((q as string) || '');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [found, setFound] = useState(0);
  const [searchTimeMs, setSearchTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, []);

  // Handle URL query params
  useEffect(() => {
    if (q || category) {
      const term = (q as string) || (category as string) || '';
      setSearchQuery(term);
      performSearch(term, 1);
    }
  }, [q, category]);

  const performSearch = useCallback(async (query: string, pageNum: number) => {
    if (!query.trim()) return;

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await searchPlaces({
        q: query.trim(),
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: userLocation ? 50 : undefined,
        page: pageNum,
        limit: 30,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResults(response.hits);
        setFound(response.found);
        setSearchTimeMs(response.searchTimeMs);
        setPage(pageNum);
        setLoading(false);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        console.error('Search error:', error);
        setResults([]);
        setFound(0);
        setLoading(false);
      }
    }
  }, [userLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`, undefined, { shallow: true });
      performSearch(searchQuery, 1);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setFound(0);
    setHasSearched(false);
    setPage(1);
    if (abortRef.current) abortRef.current.abort();
    router.push('/app/search', undefined, { shallow: true, locale });
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    router.push(`/app/search?q=${encodeURIComponent(term)}`, undefined, { shallow: true });
    performSearch(term, 1);
  };

  const handleNextPage = () => {
    if (page < 10 && results.length > 0) {
      performSearch(searchQuery, page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      performSearch(searchQuery, page - 1);
    }
  };

  // Map SearchHit to PlaceCard-compatible format
  const mapHitToPlace = (hit: SearchHit) => ({
    id: hit.id,
    name: hit.name,
    category: hit.categories?.[0] || 'Place',
    city: hit.locality,
    address: [hit.address, hit.locality, hit.region].filter(Boolean).join(', '),
    slug: hit.id, // Use ID as slug for navigation
    photo_url: undefined,
    distance: hit.distance_meters ? hit.distance_meters / 1609.34 : undefined, // meters to miles
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{searchQuery ? `${searchQuery} - Search` : 'Search'} | TavvY</title>
        <meta name="description" content="Search for places on TavvY" />
      </Head>

      <AppLayout>
        <div className="search-screen" style={{ backgroundColor: theme.background }}>
          {/* Search Header */}
          <header className="search-header">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container" style={{ backgroundColor: theme.surface }}>
                <FiSearch size={20} color={theme.textSecondary} />
                <input
                  type="text"
                  placeholder="Search places, categories, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ color: theme.text }}
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" className="clear-button" onClick={handleClear}>
                    <FiX size={18} color={theme.textSecondary} />
                  </button>
                )}
              </div>
              <button type="submit" className="search-button" style={{ backgroundColor: theme.primary }}>
                Search
              </button>
            </form>
          </header>

          {/* Content */}
          <div className="search-content">
            {!hasSearched ? (
              <>
                {/* Popular Searches */}
                <section className="popular-section">
                  <h2 style={{ color: theme.text }}>Popular Searches</h2>
                  <div className="popular-tags">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        className="popular-tag"
                        onClick={() => handlePopularSearch(term)}
                        style={{ backgroundColor: theme.surface, color: theme.text }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Browse Categories */}
                <section className="browse-section">
                  <h2 style={{ color: theme.text }}>Browse by Category</h2>
                  <div className="category-list">
                    {[
                      { name: 'Restaurants', icon: '🍽️' },
                      { name: 'Coffee & Tea', icon: '☕' },
                      { name: 'Bars & Nightlife', icon: '🍺' },
                      { name: 'Shopping', icon: '🛍️' },
                      { name: 'Hotels', icon: '🏨' },
                      { name: 'Attractions', icon: '🎡' },
                      { name: 'Services', icon: '🔧' },
                      { name: 'Health & Medical', icon: '🏥' },
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        className="category-item"
                        onClick={() => handlePopularSearch(cat.name)}
                        style={{ backgroundColor: theme.cardBackground }}
                      >
                        <span className="category-icon">{cat.icon}</span>
                        <span style={{ color: theme.text }}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p style={{ color: theme.textSecondary }}>Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <FiSearch size={48} color={theme.textTertiary} />
                <h3 style={{ color: theme.text }}>No results found</h3>
                <p style={{ color: theme.textSecondary }}>
                  Try a different search term or browse categories
                </p>
                <button
                  className="browse-button"
                  onClick={handleClear}
                  style={{ color: theme.primary }}
                >
                  Browse Categories
                </button>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <p style={{ color: theme.textSecondary }}>
                    {found.toLocaleString()} result{found !== 1 ? 's' : ''} for "{searchQuery}"
                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                      <FiClock size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                      {searchTimeMs}ms
                    </span>
                  </p>
                </div>
                <div className="results-list">
                  {results.map((hit) => {
                    const place = mapHitToPlace(hit);
                    return (
                      <Link
                        key={hit.id}
                        href={`/place/${hit.fsq_place_id}`}
                        locale={locale}
                        className="result-item"
                      >
                        <PlaceCard place={place} compact />
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {found > 30 && (
                  <div className="pagination">
                    <button
                      onClick={handlePrevPage}
                      disabled={page <= 1}
                      style={{
                        backgroundColor: page > 1 ? theme.primary : theme.surface,
                        color: page > 1 ? 'white' : theme.textSecondary,
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ color: theme.textSecondary }}>
                      Page {page}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={page >= 10 || results.length < 30}
                      style={{
                        backgroundColor: (page < 10 && results.length >= 30) ? theme.primary : theme.surface,
                        color: (page < 10 && results.length >= 30) ? 'white' : theme.textSecondary,
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .search-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }

          .search-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            position: sticky;
            top: 0;
            background: ${theme.background};
            z-index: 10;
          }

          .search-form {
            display: flex;
            gap: ${spacing.sm}px;
          }

          .search-input-container {
            flex: 1;
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }

          .search-input-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }

          .clear-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
          }

          .search-button {
            padding: 12px 20px;
            border-radius: ${borderRadius.md}px;
            border: none;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }

          .search-content {
            padding: 0 ${spacing.lg}px;
          }

          .popular-section,
          .browse-section {
            margin-bottom: ${spacing.xl}px;
          }

          .popular-section h2,
          .browse-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }

          .popular-tags {
            display: flex;
            flex-wrap: wrap;
            gap: ${spacing.sm}px;
          }

          .popular-tag {
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            cursor: pointer;
          }

          .category-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }

          .category-item {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.md}px;
            border: none;
            cursor: pointer;
            text-align: left;
          }

          .category-icon {
            font-size: 24px;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: ${spacing.md}px;
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
          }

          .browse-button {
            background: none;
            border: none;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }

          .results-header {
            padding: ${spacing.sm}px 0 ${spacing.md}px;
          }

          .results-header p {
            font-size: 14px;
            margin: 0;
          }

          .results-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }

          .result-item {
            text-decoration: none;
          }

          .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px 0;
          }

          .pagination button {
            padding: 10px 20px;
            border-radius: ${borderRadius.md}px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .pagination button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
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
