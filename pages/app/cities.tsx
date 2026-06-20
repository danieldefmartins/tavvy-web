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
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { UnifiedHeader } from '../../components/UnifiedHeader';

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

// Editorial "Featured this month" picks — curated for the current month with a real
// recurring event/festival so there's a reason to read about each city.
const FEATURED_MONTH_LABEL = 'June';
const FEATURED_THIS_MONTH = [
  { slug: 'new-york-city', event: 'Summer in the City', reason: "Summer kicks off with free SummerStage concerts in Central Park, rooftop dining, and golden evenings strolling the High Line." },
  { slug: 'chicago', event: 'Chicago Blues Festival', reason: "The world's largest free blues festival fills Millennium Park in early June — live music, food trucks, and lakefront fun for everyone." },
  { slug: 'nashville', event: 'CMA Fest', reason: "Four days of country music and family-friendly block parties turn downtown Music City into one big celebration." },
  { slug: 'san-francisco', event: 'Golden Gate Summer', reason: "Sunny days for biking across the Golden Gate Bridge, exploring Golden Gate Park, and free Sunday concerts at Stern Grove." },
  { slug: 'new-orleans', event: 'Creole Tomato Festival', reason: "The historic French Market celebrates summer's harvest with Creole cooking, live jazz, and family fun in mid-June." },
];
const FEATURED_SLUGS = FEATURED_THIS_MONTH.map((f) => f.slug);
const CITY_FALLBACK_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600';

export default function CitiesBrowseScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme, isDark } = useThemeContext();
  const { t } = useTranslation('common');
  const [cities, setCities] = useState<City[]>([]);
  const [featured, setFeatured] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCities();
    fetchFeatured();
  }, []);

  const handleBackPress = () => {
    router.push('/app');
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('tavvy_cities')
        .select('id,name,slug,state,country,cover_image_url,thumbnail_image_url,population,culture,best_time_to_visit')
        .eq('is_active', true)
        .order('population', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pull the curated featured cities (by slug) so we always have their real cover image + data
  const fetchFeatured = async () => {
    try {
      const { data } = await supabase
        .from('tavvy_cities')
        .select('id,name,slug,state,country,cover_image_url,culture')
        .in('slug', FEATURED_SLUGS);
      if (data) {
        // keep them in the curated order
        const ordered = FEATURED_THIS_MONTH
          .map((f) => data.find((c) => c.slug === f.slug))
          .filter(Boolean) as City[];
        setFeatured(ordered);
      }
    } catch (error) {
      console.error('Error fetching featured cities:', error);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <Head>
        <title>Cities | TavvY</title>
        <meta name="description" content="Explore and rate cities on TavvY" />
      </Head>

        <div className="cities-screen" style={{ backgroundColor: theme.background }}>
          {/* Unified Header */}
          <UnifiedHeader
            screenKey="cities"
            title="Cities"
            searchPlaceholder="Search cities..."
            showBackButton={false}
            onSearch={setSearchQuery}
          />

          {/* Featured This Month */}
          {!searchQuery && featured.length > 0 && (
            <section className="featured-section">
              <div className="featured-head">
                <span className="featured-kicker">★ Featured in {FEATURED_MONTH_LABEL}</span>
                <h2 style={{ color: theme.text }}>Where to go this month</h2>
                <p className="featured-sub" style={{ color: theme.textSecondary }}>
                  Cities worth a trip right now — picked for what’s happening this June.
                </p>
              </div>
              <div className="featured-scroll">
                {featured.map((city) => {
                  const meta = FEATURED_THIS_MONTH.find((f) => f.slug === city.slug);
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
                        <span className="feature-card-badge">{FEATURED_MONTH_LABEL}</span>
                      </div>
                      <div className="feature-card-body">
                        <h3 className="feature-card-title" style={{ color: theme.text }}>{city.name}</h3>
                        <span className="feature-card-loc" style={{ color: theme.textSecondary }}>
                          <FiMapPin size={11} /> {city.state}
                        </span>
                        {meta && <span className="feature-card-event">{meta.event}</span>}
                        {meta && (
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
            
            {loading ? (
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
                      {city.state}, {city.country || 'USA'}
                    </div>
                    {city.culture && (
                      <p style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                        {city.culture.length > 240 ? city.culture.slice(0, 240).trim() + '…' : city.culture}
                      </p>
                    )}
                    {city.best_time_to_visit && (
                      <div style={{ color: theme.primary, fontSize: 11, fontWeight: 600, marginTop: 8, clear: 'both' }}>
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
            color: #8A05BE;
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
            color: #00C2CB;
            background: rgba(0,194,203,0.12);
            padding: 3px 9px;
            border-radius: 999px;
          }
          .feature-card-reason { font-size: 13px; line-height: 1.45; margin: 6px 0 0; }
          .feature-card-cta { margin-top: 10px; font-size: 13px; font-weight: 700; color: #8A05BE; }
          
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
