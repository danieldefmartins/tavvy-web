/**
 * Search Screen (Typesense-powered via canonical API)
 * Lightning-fast search for places with filters
 *
 * Now uses /api/search/places — no direct Typesense or Supabase ILIKE calls.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { searchPlaces, searchAutocomplete, SearchHit } from '../../lib/searchClient';
import { spacing, borderRadius } from '../../constants/Colors';
import PlaceCard from '../../components/PlaceCard';
import { FiSearch, FiX, FiClock } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (q || category) {
      setSearchQuery((q as string) || (category as string) || '');
      performSearch((q as string) || (category as string) || '');
    }
  }, [q, category]);

  // Autocomplete suggestions via canonical API
  useEffect(() => {
    if (searchQuery.length < 2 || hasSearched) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      try {
        const hits = await searchAutocomplete(searchQuery, {
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          limit: 8,
          signal: controller.signal,
        });
        setSuggestions(hits);
        setShowSuggestions(hits.length > 0);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Autocomplete error:', error);
        }
      }
    }, 300);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery, hasSearched, userLocation]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      const response = await searchPlaces({
        q: query,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: userLocation ? 50 : undefined,
        limit: 50,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResults(response.hits);
        setSearchTime(response.searchTimeMs);
        setTotalFound(response.found);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setResults([]);
        setTotalFound(0);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/search?q=${encodeURIComponent(searchQuery)}`, undefined, { shallow: true });
      performSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    setShowSuggestions(false);
    if (abortRef.current) abortRef.current.abort();
    router.push('/app/search', undefined, { shallow: true, locale });
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    router.push(`/app/search?q=${encodeURIComponent(term)}`, undefined, { shallow: true });
    performSearch(term);
  };

  const handleSuggestionClick = (hit: SearchHit) => {
    setSearchQuery(hit.name);
    setShowSuggestions(false);
    router.push(`/app/search?q=${encodeURIComponent(hit.name)}`, undefined, { shallow: true });
    performSearch(hit.name);
  };

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
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
          <header className="search-header">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container" style={{ backgroundColor: theme.surface }}>
                <FiSearch size={20} color={theme.textSecondary} />
                <input
                  type="text"
                  placeholder="Search places, categories, cities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (hasSearched) setHasSearched(false);
                  }}
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

            {/* Autocomplete suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" style={{ backgroundColor: theme.surface }}>
                {suggestions.map((hit) => (
                  <button
                    key={hit.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(hit)}
                    style={{ color: theme.text }}
                  >
                    <FiSearch size={14} color={theme.textSecondary} />
                    <div>
                      <div className="suggestion-name">{hit.name}</div>
                      <div className="suggestion-detail" style={{ color: theme.textSecondary }}>
                        {[hit.locality, hit.region].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="search-content">
            {!hasSearched ? (
              <>
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
                <button className="browse-button" onClick={handleClear} style={{ color: theme.primary }}>
                  Browse Categories
                </button>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <p style={{ color: theme.textSecondary }}>
                    {totalFound.toLocaleString()} result{totalFound !== 1 ? 's' : ''} for "{searchQuery}"
                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                      <FiClock size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                      {searchTime}ms
                    </span>
                  </p>
                </div>
                <div className="results-list">
                  {results.map((hit) => (
                    <Link
                      key={hit.id}
                      href={`/place/${hit.fsq_place_id}`}
                      locale={locale}
                      className="result-item"
                    >
                      <PlaceCard
                        place={{
                          id: hit.id,
                          name: hit.name,
                          category: hit.categories?.[0] || 'Place',
                          city: hit.locality,
                          address: [hit.address, hit.locality, hit.region].filter(Boolean).join(', '),
                        }}
                        compact
                      />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .search-screen { min-height: 100vh; padding-bottom: 100px; }
          .search-header { padding: ${spacing.lg}px; position: sticky; top: 0; background: ${theme.background}; z-index: 10; }
          .search-form { display: flex; gap: ${spacing.sm}px; }
          .search-input-container { flex: 1; display: flex; align-items: center; gap: ${spacing.sm}px; padding: 12px 16px; border-radius: ${borderRadius.md}px; }
          .search-input-container input { flex: 1; border: none; background: transparent; font-size: 16px; outline: none; }
          .clear-button { background: none; border: none; cursor: pointer; padding: 4px; }
          .search-button { padding: 12px 20px; border-radius: ${borderRadius.md}px; border: none; color: white; font-size: 16px; font-weight: 600; cursor: pointer; }
          .suggestions-dropdown { position: absolute; left: ${spacing.lg}px; right: ${spacing.lg}px; top: 100%; border-radius: ${borderRadius.md}px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 20; overflow: hidden; }
          .suggestion-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; border: none; background: transparent; cursor: pointer; text-align: left; }
          .suggestion-item:hover { background: rgba(0,0,0,0.05); }
          .suggestion-name { font-size: 14px; font-weight: 500; }
          .suggestion-detail { font-size: 12px; margin-top: 2px; }
          .search-content { padding: 0 ${spacing.lg}px; }
          .popular-section { margin-bottom: ${spacing.xl}px; }
          .popular-section h2 { font-size: 18px; font-weight: 600; margin: 0 0 ${spacing.md}px; }
          .popular-tags { display: flex; flex-wrap: wrap; gap: ${spacing.sm}px; }
          .popular-tag { padding: 8px 16px; border-radius: ${borderRadius.full}px; border: none; font-size: 14px; cursor: pointer; }
          .loading-container { display: flex; flex-direction: column; align-items: center; padding: 60px; }
          .loading-spinner { width: 32px; height: 32px; border: 3px solid ${theme.surface}; border-top-color: ${theme.primary}; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: ${spacing.md}px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .empty-state { text-align: center; padding: 60px 20px; }
          .empty-state h3 { font-size: 20px; font-weight: 600; margin: ${spacing.lg}px 0 ${spacing.sm}px; }
          .empty-state p { font-size: 14px; margin: 0 0 ${spacing.lg}px; }
          .browse-button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; }
          .results-header { padding: ${spacing.sm}px 0 ${spacing.md}px; }
          .results-header p { font-size: 14px; margin: 0; }
          .results-list { display: flex; flex-direction: column; gap: ${spacing.md}px; }
          .result-item { text-decoration: none; }
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
