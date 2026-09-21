import { useReleaseCopy } from '../../hooks/useReleaseCopy';
/**
 * Search Screen
 * Search for places with filters
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import PlaceCard from '../../components/PlaceCard';
import { FiSearch, FiX, FiFilter, FiMapPin } from 'react-icons/fi';
import { isDiningSearch } from '../../lib/searchIntent';
import { DINING_NEEDS } from '../../lib/discoveryEvidence';
import { DEMO_RESTAURANT_HREF, matchesDemoRestaurantQuery, shouldOfferDemoRestaurant } from '../../lib/demoPlace';
import { parseSearchQuery } from '../../lib/smartQueryParser';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Place {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  address?: string;
  city?: string;
  photo_url?: string;
  rating?: number;
  tavvy_category?: string;
  matchReason?: string;
  matchScore?: number;
  isDemo?: boolean;
}

const POPULAR_SEARCHES = [
  'Restaurants', 'Coffee', 'Bars', 'Pizza', 'Sushi', 
  'Mexican', 'Italian', 'Brunch', 'Breakfast', 'Lunch'
];

export default function SearchScreen() {
  const copy = useReleaseCopy();
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');
  const { q, category } = router.query;
  const { theme } = useThemeContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locationLabel, setLocationLabel] = useState('Any location');
  const [dining, setDining] = useState(false);
  const [diningNeed, setDiningNeed] = useState('');
  const [checkingReviews, setCheckingReviews] = useState(false);
  const requestIdRef = useRef(0);
  const scrollKey = () => `tavvy:search-scroll:${router.asPath}`;

  useEffect(() => {
    const remember = () => { try { sessionStorage.setItem(scrollKey(), String(window.scrollY)); } catch {} };
    router.events.on('routeChangeStart', remember);
    return () => router.events.off('routeChangeStart', remember);
  }, [router.asPath]);

  useEffect(() => {
    if (!router.isReady) return;
    const query = typeof router.query.q === 'string' ? router.query.q : typeof category === 'string' ? category : '';
    const where = typeof router.query.where === 'string' ? router.query.where : '';
    const need = typeof router.query.need === 'string' ? router.query.need : '';
    setSearchQuery(query); setLocationInput(where); setDiningNeed(need);
    if (query) void performSearch(query, where, need);
    else { requestIdRef.current++; setResults([]); setHasSearched(false); setLoading(false); setCheckingReviews(false); setSearchError(''); }
  }, [router.isReady, router.query.q, router.query.where, router.query.need, router.query.location, router.query.lat, router.query.lng, category]);

  const performSearch = async (query: string, where = '', need = '') => {
    const requestId = ++requestIdRef.current;
    const illustrativeDemo: Place = { id: 'demo-restaurant', name: 'Trattoria Tavvy', category: 'Italian restaurant', city: 'Winter Park', photo_url: '/images/demo-trattoria/pasta.jpg', isDemo: true };
    let demoResult: Place[] = matchesDemoRestaurantQuery(query) ? [illustrativeDemo] : [];
    setLoading(true); setCheckingReviews(false); setSearchError(''); setHasSearched(true);
    const params = new URLSearchParams({ q: query, limit: '50', evidence: 'defer', ...(where ? { where } : {}), ...(need ? { need } : {}) });
    for (const [key, apiKey] of [["location","location"],['lat','userLat'],['lng','userLng'],['minLat','minLat'],['maxLat','maxLat'],['minLng','minLng'],['maxLng','maxLng']]) {
      const value = router.query[key]; if (typeof value === 'string') params.set(apiKey, value);
    }
    if (parseSearchQuery(query).useCurrentLocation && !params.has('userLat')) {
      setLocationLabel('Current location needed');
      setSearchError('Use your location or enter a city to search nearby.'); setResults([]); setDining(isDiningSearch(query)); setLoading(false); return;
    }
    try {
      const response = await fetch(`/api/search?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Search is temporarily unavailable.');
      if (!Array.isArray(payload.suggestions)) throw new Error('Search is temporarily unavailable.');
      if (requestId !== requestIdRef.current) return;
      if (shouldOfferDemoRestaurant(query, payload.suggestions, payload.partial)) demoResult = [illustrativeDemo];
      setResults([...demoResult, ...payload.suggestions]);
      setDining(!!payload.dining || isDiningSearch(query));
      setLocationLabel(payload.location?.label || 'Any location');
      requestAnimationFrame(() => { try { window.scrollTo(0, Number(sessionStorage.getItem(scrollKey())) || 0); } catch {} });
      setLoading(false);
      if (payload.evidencePending) {
        setCheckingReviews(true);
        params.set('evidence', 'full');
        try {
          const enrichedResponse = await fetch(`/api/search?${params}`);
          const enriched = await enrichedResponse.json();
          if (!enrichedResponse.ok || !Array.isArray(enriched.suggestions)) throw new Error('Guest reports unavailable');
          if (requestId === requestIdRef.current) {
            const byId = new Map(enriched.suggestions.map((place: any) => [place.id, place]));
            const merged = payload.suggestions.map((place: any) => byId.get(place.id) || { ...place, evidenceStatus: 'unavailable', reviewSummary: undefined });
            if (need) merged.sort((a: any,b: any) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
            setResults([...demoResult, ...merged]);
          }
        } catch {
          if (requestId === requestIdRef.current) setResults(previous => previous.map(place => ({ ...place, evidenceStatus: 'unavailable', reviewSummary: undefined })));
        } finally { if (requestId === requestIdRef.current) setCheckingReviews(false); }
      }
    } catch (error) {
      if (requestId === requestIdRef.current) { setSearchError(error instanceof Error ? error.message : 'Search unavailable'); setResults(demoResult); }
    } finally { if (requestId === requestIdRef.current) setLoading(false); }
  };
  const navigateSearch = (query: string, where = '', need = diningNeed, extra: Record<string,string> = {}) => {
    const parsed = parseSearchQuery(query);
    const text = query.trim();
    if (parsed.city || parsed.useCurrentLocation) where = '';
    const previousScope = !where.trim() && !parsed.city && (!parsed.useCurrentLocation || router.query.location !== 'map') ? Object.fromEntries(["location",'lat','lng','minLat','maxLat','minLng','maxLng'].flatMap(key => typeof router.query[key] === 'string' ? [[key, router.query[key] as string]] : [])) : {};
    if (parsed.useCurrentLocation || extra.location === 'current') {
      for (const key of ['minLat','maxLat','minLng','maxLng']) delete previousScope[key];
      previousScope.location = 'current';
    }
    void router.push({ pathname: '/app/search', query: { q: text, ...(where.trim() ? { where: where.trim() } : {}), ...(need ? { need } : {}), ...previousScope, ...extra } }, undefined, { shallow: true });
  };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (searchQuery.trim()) navigateSearch(searchQuery); };
  const handleClear = () => { setLocationInput(''); setDiningNeed(''); void router.push('/app/search', undefined, { shallow: true, locale }); };
  const handlePopularSearch = (term: string) => navigateSearch(term);
  const useLocation = () => {
    if (!navigator.geolocation) { setSearchError("Location is unavailable. Enter a city instead."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(position => {
      setLocationInput('');
      navigateSearch(parseSearchQuery(searchQuery || "restaurants").placeName, '', diningNeed, { location: 'current', lat: String(position.coords.latitude), lng: String(position.coords.longitude) });
    }, () => { setLoading(false); setSearchError('Location access was not available. Enter a city to continue.'); }, { timeout: 10000 });
  };

  return (
    <>
      <Head>
        <title>{searchQuery ? `${searchQuery} - Search` : copy("Search")} | TavvY</title>
        <meta name={"description"} content="Search for places on TavvY" />
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
                  placeholder={copy("Search places, categories, cities...")}
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
              <button type={"submit"} className="search-button" style={{ backgroundColor: theme.primary }}>
                {copy("Search")}</button>
            </form>
            <button type="button" className="near-me-button" onClick={useLocation}>{copy("Near me")}</button>
            <p className="resolved-location" role="status">{copy(locationLabel)}{checkingReviews ? ' · '+copy('Checking guest reports…') : ''}</p>
          </header>

          {/* Content */}
          <div className="search-content">
            {(dining || isDiningSearch(searchQuery)) && <section className="dining-needs">
              <h2 style={{ color: theme.text }}>{copy("What matters for this meal?")}</h2>
              <div className="need-list">{DINING_NEEDS.map(need => <button key={need.id} type="button" aria-pressed={diningNeed === need.id} onClick={() => {
                const next = diningNeed === need.id ? '' : need.id;
                if (searchQuery.trim()) navigateSearch(searchQuery, '', next, Object.fromEntries(["location",'lat','lng'].flatMap(key => typeof router.query[key] === 'string' ? [[key, router.query[key] as string]] : []))); else setDiningNeed(next);
              }}>{copy(need.label)}</button>)}</div>
            </section>}
            {!!searchError && <p role="alert" style={{ color: theme.text }}>{copy(searchError)}</p>}
            {!hasSearched ? (
              <>
                {/* Popular Searches */}
                <section className="popular-section">
                  <h2 style={{ color: theme.text }}>{copy("Popular Searches")}</h2>
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
                      { name: "Restaurants", icon: '🍽️' },
                      { name: 'Coffee & Tea', icon: '☕' },
                      { name: 'Bars & Nightlife', icon: '🍺' },
                      { name: "Shopping", icon: '🛍️' },
                      { name: "Hotels", icon: '🏨' },
                      { name: "Attractions", icon: '🎡' },
                      { name: "Services", icon: '🔧' },
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
                <p style={{ color: theme.textSecondary }}>{copy('Searching…')}</p>
              </div>
            ) : searchError && results.length === 0 ? (
              <div className="empty-state"><h3 style={{ color: theme.text }}>{copy('Search is temporarily unavailable.')}</h3><p style={{ color: theme.textSecondary }}>{copy(searchError)}</p><button className="browse-button" onClick={() => performSearch(searchQuery, locationInput, diningNeed)} style={{ color: theme.primary }}>{copy('Retry search')}</button></div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <FiSearch size={48} color={theme.textTertiary} />
                <h3 style={{ color: theme.text }}>{copy("No results found")}</h3>
                <p style={{ color: theme.textSecondary }}>
                  {copy('Try another search or location.')}
                </p>
                <button 
                  className="browse-button"
                  onClick={handleClear}
                  style={{ color: theme.primary }}
                >
                  {copy('Categories')}
                </button>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <Link href={{ pathname: '/app/map', query: router.query }} locale={locale}>Show on map</Link>
                  <p style={{ color: theme.textSecondary }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
                <div className="results-list">
                  {results.map((place) => place.isDemo ? (
                    <Link key={place.id} href={DEMO_RESTAURANT_HREF} locale={locale} className="demo-result">
                      <img src={place.photo_url} alt="Trattoria Tavvy pasta" />
                      <span><strong>{place.name}</strong><small>{copy("Illustrative demo")}</small><em>{copy("View demo")}</em></span>
                    </Link>
                  ) : (
                    <div key={place.id} className="result-item">
                      <PlaceCard place={place} compact showQuickActions={false} showReviewSummary />
                      {diningNeed && <p className="match-reason" style={{ color: theme.textSecondary }}>{place.matchReason}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .near-me-button { min-height: 40px; margin-top: 8px; padding: 6px 12px; border: 1px solid ${theme.border}; border-radius: 10px; color: ${theme.text}; background: ${theme.surface}; cursor: pointer; }
          .resolved-location { margin: 8px 0 0; color: ${theme.textSecondary}; font-size: 13px; }
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
          .dining-needs { margin-bottom: 18px; }
          .dining-needs h2 { font-size: 17px; margin: 0 0 10px; }
          .need-list { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
          .need-list button { flex: none; border: 1px solid #00AEB8; border-radius: 20px; background: ${theme.surface}; color: ${theme.text}; padding: 9px 12px; font-size: 13px; }
          .need-list button[aria-pressed="true"] { background: #00C2CB; color: #17013A; font-weight: 700; }
          .match-reason { font-size: 12px; margin: 4px 12px 14px; }
          
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
          .demo-result { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; background: ${theme.surface}; color: ${theme.text}; text-decoration: none; }
          .demo-result img { width: 76px; height: 76px; border-radius: 12px; object-fit: cover; }
          .demo-result span { display: flex; flex-direction: column; gap: 4px; }
          .demo-result strong { font-size: 17px; }
          .demo-result small { color: ${theme.textSecondary}; font-size: 13px; }
          .demo-result em { color: #006B72; font-size: 12px; font-style: normal; font-weight: 700; }
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
