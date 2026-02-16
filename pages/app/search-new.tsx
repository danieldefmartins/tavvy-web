/**
 * Search Screen (Typesense-powered)
 * Lightning-fast search for places with filters
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { searchPlaces as searchPlacesTypesense, getAutocompleteSuggestions } from '../../lib/typesenseService';
import { spacing, borderRadius } from '../../constants/Colors';
import PlaceCard from '../../components/PlaceCard';
import { FiSearch, FiX, FiFilter, FiMapPin, FiClock } from 'react-icons/fi';
import type { PlaceCard as PlaceCardType } from '../../lib/placeService';
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
  const [results, setResults] = useState<PlaceCardType[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (q || category) {
      setSearchQuery((q as string) || (category as string) || '');
      performSearch((q as string) || (category as string) || '');
    }
  }, [q, category]);

  // Autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2 && !hasSearched) {
        try {
          const sugg = await getAutocompleteSuggestions(searchQuery, 8);
          setSuggestions(sugg);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, hasSearched]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);

    try {
      // Try Typesense first (fast!)
      const result = await searchPlacesTypesense({
        query,
        limit: 50,
      });

      setResults(result.places as unknown as PlaceCardType[]);
      setSearchTime(result.searchTimeMs);
      setTotalFound(result.totalFound);
      
      console.log(`[Search] Typesense returned ${result.totalFound} results in ${result.searchTimeMs}ms`);
    } catch (error) {
      console.error('Typesense search failed, falling back to Supabase:', error);
      
      // Fallback to Supabase
      try {
        const { data, error: supabaseError } = await supabase
          .from('places')
          .select('*')
          .or(`name.ilike.%${query}%,category.ilike.%${query}%,city.ilike.%${query}%`)
          .limit(50);

        if (!supabaseError) {
          setResults(data || []);
          setTotalFound(data?.length || 0);
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
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
    router.push('/app/search', undefined, { shallow: true, locale });
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    router.push(`/app/search?q=${encodeURIComponent(term)}`, undefined, { shallow: true });
    performSearch(term);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    router.push(`/app/search?q=${encodeURIComponent(suggestion)}`, undefined, { shallow: true });
    performSearch(suggestion);
  };

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
              <div className="search-input-container" style={{ backgroundColor: theme.surface, position: 'relative' }}>
                <FiSearch size={20} color={theme.textSecondary} />
                <input
                  type="text"
                  placeholder="Search places, categories, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  style={{ color: theme.text }}
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" className="clear-button" onClick={handleClear}>
                    <FiX size={18} color={theme.textSecondary} />
                  </button>
                )}
                
                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown" style={{ 
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }}>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{ color: theme.text }}
                      >
                        <FiSearch size={16} color={theme.textSecondary} />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="search-button" style={{ backgroundColor: theme.primary }}>
                Search
              </button>
            </form>
            
            {/* Search Stats */}
            {hasSearched && !loading && (
              <div className="search-stats" style={{ color: theme.textSecondary }}>
                <FiClock size={14} />
                <span>
                  Found {totalFound.toLocaleString()} results in {searchTime}ms
                </span>
              </div>
            )}
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

                {/* Quick Tips */}
                <section className="tips-section">
                  <h3 style={{ color: theme.text }}>Search Tips</h3>
                  <ul style={{ color: theme.textSecondary }}>
                    <li>Try searching by place name, category, or city</li>
                    <li>Use specific terms for better results (e.g., "Italian restaurant")</li>
                    <li>Autocomplete suggestions appear as you type</li>
                  </ul>
                </section>
              </>
            ) : loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p style={{ color: theme.textSecondary }}>Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-grid">
                {results.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiSearch size={48} color={theme.textSecondary} />
                <h3 style={{ color: theme.text }}>No results found</h3>
                <p style={{ color: theme.textSecondary }}>
                  Try different keywords or browse popular searches above
                </p>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .search-screen {
            min-height: 100vh;
            padding-bottom: 80px;
          }

          .search-header {
            position: sticky;
            top: 0;
            z-index: 100;
            padding: ${spacing.md}px;
            background: ${theme.background};
            border-bottom: 1px solid ${theme.border};
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
            padding: ${spacing.sm}px ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            position: relative;
          }

          .search-input-container input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 16px;
          }

          .clear-button {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .search-button {
            padding: ${spacing.sm}px ${spacing.lg}px;
            border: none;
            border-radius: ${borderRadius.lg}px;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }

          .suggestions-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            border: 1px solid;
            border-radius: ${borderRadius.md}px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
          }

          .suggestion-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.sm}px ${spacing.md}px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            transition: background 0.2s;
          }

          .suggestion-item:hover {
            background: ${theme.surface};
          }

          .search-stats {
            display: flex;
            align-items: center;
            gap: ${spacing.xs}px;
            margin-top: ${spacing.sm}px;
            font-size: 14px;
          }

          .search-content {
            padding: ${spacing.lg}px;
          }

          .popular-section {
            margin-bottom: ${spacing.xl}px;
          }

          .popular-section h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: ${spacing.md}px;
          }

          .popular-tags {
            display: flex;
            flex-wrap: wrap;
            gap: ${spacing.sm}px;
          }

          .popular-tag {
            padding: ${spacing.sm}px ${spacing.md}px;
            border: none;
            border-radius: ${borderRadius.full}px;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .popular-tag:hover {
            transform: scale(1.05);
          }

          .tips-section {
            margin-top: ${spacing.xl}px;
          }

          .tips-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: ${spacing.md}px;
          }

          .tips-section ul {
            list-style: none;
            padding: 0;
          }

          .tips-section li {
            padding: ${spacing.sm}px 0;
            padding-left: ${spacing.md}px;
            position: relative;
          }

          .tips-section li:before {
            content: "•";
            position: absolute;
            left: 0;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: ${spacing.xxl}px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${theme.border};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: ${spacing.md}px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: ${spacing.md}px;
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: ${spacing.xxl}px;
            text-align: center;
          }

          .empty-state h3 {
            margin-top: ${spacing.md}px;
            margin-bottom: ${spacing.sm}px;
            font-size: 20px;
          }

          @media (max-width: 768px) {
            .results-grid {
              grid-template-columns: 1fr;
            }
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
