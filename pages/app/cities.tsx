/**
 * Cities Browse Screen
 * Browse and rate cities
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { loadActiveCities, matchesCity } from '../../lib/cities';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ToolHeader from '../../components/ToolHeader';

interface City {
  id: string;
  name: string;
  slug?: string;
  state?: string;
  country?: string;
  cover_image_url?: string;
  thumbnail_image_url?: string;
  total_signals?: number;
  population?: number;
  culture?: string;
  best_time_to_visit?: string;
}

const CITY_FALLBACK_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600';

export default function CitiesBrowseScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme, isDark } = useThemeContext();
  const { t } = useTranslation('common');
  const [cities, setCities] = useState<City[]>([]);
  const [featured, setFeatured] = useState<City[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCities();

  }, []);

  const handleBackPress = () => {
    router.push('/app');
  };

  const fetchCities = async () => {
    setLoading(true); setLoadError('');
    try {
      const data = await loadActiveCities(supabase);
      setCities(data);
      setFeatured(data.filter(city => city.is_featured));
    } catch (error) {
      setCities([]); setFeatured([]);
      setLoadError('Cities could not be loaded. Please try again.');
    } finally { setLoading(false); }
  };
  const filteredCities = cities.filter(city => matchesCity(city, searchQuery));

  return (
    <AppLayout>
      <Head>
        <title>Cities | TavvY</title>
        <meta name="description" content="Explore and rate cities on TavvY" />
      </Head>

        <div className="cities-screen" style={{ backgroundColor: theme.background }}>
          <ToolHeader title="Cities" subtitle="Discover urban adventures.">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 14px', minHeight: 48, borderRadius: 14, background: theme.surface, border: `1px solid ${theme.border}` }}>
              <FiSearch aria-hidden color={theme.textSecondary} />
              <input type="search" aria-label="Search cities" placeholder="Search cities..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} style={{ minWidth: 0, width: '100%', minHeight: 44, background: 'transparent', color: theme.text, border: 0, fontSize: 16 }} />
            </div>
          </ToolHeader>

          {/* Featured This Month */}
          {!searchQuery && featured.length > 0 && (
            <section className="featured-section">
              <div className="featured-head">
                <span className="featured-kicker">★ Featured cities</span>
                <h2 style={{ color: theme.text }}>Explore featured cities</h2>
                <p className="featured-sub" style={{ color: theme.textSecondary }}>
                  Discover cities and their local culture.
                </p>
              </div>
              <div className="featured-scroll">
                {featured.map((city) => {
                  const meta = { event: city.best_time_to_visit, reason: city.culture };
                  return (
                    <Link
                      key={city.id}
                      href={`/app/city/${city.id}`}
                      locale={locale}
                      className="feature-card"
                      style={{
                        flex: '0 0 82vw',
                        maxWidth: 420,
                        scrollSnapAlign: 'start',
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#EDEDED',
                      }}
                    >
                      <div className="feature-card-media">
                        <img
                          src={city.cover_image_url || CITY_FALLBACK_IMG}
                          alt={city.name}
                          className="feature-card-img"
                          onError={(e) => { if (!e.currentTarget.src.includes('photo-1477959858617')) e.currentTarget.src = CITY_FALLBACK_IMG; }}
                        />
                        <span className="feature-card-badge">Featured</span>
                      </div>
                      <div className="feature-card-body">
                        <h3 className="feature-card-title" style={{ color: theme.text }}>{city.name}</h3>
                        <span className="feature-card-loc" style={{ color: theme.textSecondary }}>
                          <FiMapPin size={11} /> {city.state}
                        </span>
                        {meta.event && <span className="feature-card-event">{meta.event}</span>}
                        {meta.reason && (
                          <p className="feature-card-reason" style={{ color: theme.textSecondary }}>{meta.reason}</p>
                        )}
                        <span className="feature-card-cta">Read about {city.name} →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cities List */}
          <section className="cities-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : 'All Cities'}
            </h2>
            
            {loadError ? (<div role="alert" className="empty-state"><p>{loadError}</p><button onClick={fetchCities}>Retry</button></div>) : loading ? (
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
                    locale={locale}
                    className="city-row"
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      padding: 14,
                      borderRadius: 18,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#EDEDED'}`,
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                      textDecoration: 'none',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    <img
                      src={city.cover_image_url || city.thumbnail_image_url || CITY_FALLBACK_IMG}
                      alt={city.name}
                      onError={(e) => { if (!e.currentTarget.src.includes('photo-1477959858617')) e.currentTarget.src = CITY_FALLBACK_IMG; }}
                      style={{ float: 'right', width: 120, height: 120, borderRadius: 14, objectFit: 'cover', margin: '0 0 10px 14px' }}
                    />
                    <h3 style={{ color: theme.text, fontSize: 17, fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.2px' }}>
                      {city.name}
                    </h3>
                    <div style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 7 }}>
                      <FiMapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                      {city.state}, {city.country || ''}
                    </div>
                    {city.culture && (
                      <p style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                        {city.culture.length > 240 ? city.culture.slice(0, 240).trim() + '…' : city.culture}
                      </p>
                    )}
                    {city.best_time_to_visit && (
                      <div style={{ color: isDark ? '#D7B3F0' : '#8A05BE', fontSize: 11, fontWeight: 600, marginTop: 8, clear: 'both' }}>
                        Best time to visit: {city.best_time_to_visit}
                      </div>
                    )}
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
            padding: 4px ${spacing.lg}px ${spacing.xl}px;
          }

          .featured-head { margin-bottom: 6px; }

          .featured-kicker {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: ${isDark ? '#D7B3F0' : '#8A05BE'};
            margin-bottom: 6px;
          }

          .featured-section h2 {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.4px;
            margin: 0 0 4px;
          }

          .featured-sub {
            font-size: 13px;
            margin: 0;
            line-height: 1.4;
          }

          .featured-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding: 14px 0 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .featured-scroll::-webkit-scrollbar { display: none; }

          .feature-card {
            display: flex;
            flex-direction: column;
            flex: 0 0 90vw;
            max-width: 480px;
            scroll-snap-align: start;
            border-radius: 20px;
            overflow: hidden;
            text-decoration: none;
            border: 1px solid transparent;
            box-shadow: 0 10px 26px rgba(0,0,0,0.22);
            transition: transform 0.2s ease;
          }
          .feature-card:hover { transform: translateY(-3px); }

          .feature-card-media { position: relative; height: 190px; }
          .feature-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .feature-card-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(138,5,190,0.92);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 999px;
            backdrop-filter: blur(4px);
          }
          .feature-card-body {
            padding: 14px 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .feature-card-title { font-size: 18px; font-weight: 800; margin: 0; letter-spacing: -0.3px; }
          .feature-card-loc { font-size: 12px; display: flex; align-items: center; gap: 4px; }
          .feature-card-event {
            align-self: flex-start;
            margin-top: 4px;
            font-size: 11px;
            font-weight: 700;
            color: ${isDark ? '#43D8CA' : '#006B72'};
            background: rgba(0,194,203,0.12);
            padding: 3px 9px;
            border-radius: 999px;
          }
          .feature-card-reason { font-size: 13px; line-height: 1.45; margin: 6px 0 0; }
          .feature-card-cta { margin-top: 10px; font-size: 13px; font-weight: 700; color: ${isDark ? '#D7B3F0' : '#8A05BE'}; }
          
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
            gap: 12px;
          }

          /* Row layout is inline (styled-jsx scoping is unreliable on this page);
             this only adds a hover nicety. */
          .city-row { transition: transform 0.15s ease, box-shadow 0.15s ease; }
          .city-row:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(0,0,0,0.14) !important;
          }
        `}</style>
      </AppLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
