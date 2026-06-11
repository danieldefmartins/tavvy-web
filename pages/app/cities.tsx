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
  { slug: 'new-york-city', event: 'NYC Pride', reason: "June ends with the world's largest Pride march — over two million people fill the streets for the final-Sunday parade." },
  { slug: 'chicago', event: 'Chicago Blues Festival', reason: 'The world’s largest free blues festival takes over Millennium Park in early June — three days of legendary live music.' },
  { slug: 'nashville', event: 'CMA Fest', reason: 'Four nights of country music and stadium shows turn downtown Music City into its biggest party every June.' },
  { slug: 'san-francisco', event: 'SF Pride', reason: "One of the planet's largest Pride celebrations paints the city in color across the last weekend of June." },
  { slug: 'new-orleans', event: 'Creole Tomato Festival', reason: 'The historic French Market celebrates summer’s first harvest with Creole cooking, live jazz, and parades in mid-June.' },
];
const FEATURED_SLUGS = FEATURED_THIS_MONTH.map((f) => f.slug);

export default function CitiesBrowseScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme, isDark } = useThemeContext();
  const [cities, setCities] = useState<City[]>([]);
  const [featured, setFeatured] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCities();
    fetchFeatured();
  }, []);

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
                    <Link key={city.id} href={`/app/city/${city.id}`} locale={locale} className="feature-card">
                      <div className="feature-card-media">
                        <img src={city.cover_image_url} alt={city.name} className="feature-card-img" />
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
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#EDEDED',
                    }}
                  >
                    <img
                      className="city-row-img"
                      src={city.cover_image_url || city.thumbnail_image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400'}
                      alt={city.name}
                    />
                    <div className="city-row-body">
                      <h3 className="city-row-title" style={{ color: theme.text }}>{city.name}</h3>
                      <span className="city-row-loc" style={{ color: theme.textSecondary }}>
                        <FiMapPin size={11} /> {city.state}, {city.country || 'USA'}
                      </span>
                      {city.culture && (
                        <p className="city-row-desc" style={{ color: theme.textSecondary }}>{city.culture}</p>
                      )}
                      {city.best_time_to_visit && (
                        <span className="city-row-meta" style={{ color: theme.primary }}>
                          Best time to visit: {city.best_time_to_visit}
                        </span>
                      )}
                    </div>
                    <FiChevronRight size={18} color={theme.textSecondary} className="city-row-chev" />
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
            flex: 0 0 85vw;
            max-width: 460px;
            scroll-snap-align: start;
            border-radius: 20px;
            overflow: hidden;
            text-decoration: none;
            background: ${isDark ? 'rgba(255,255,255,0.04)' : '#fff'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#EDEDED'};
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

          .city-row {
            display: flex;
            align-items: stretch;
            gap: 14px;
            padding: 10px;
            border-radius: 18px;
            border: 1px solid transparent;
            text-decoration: none;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .city-row:hover {
            transform: translateY(-2px);
            border-color: rgba(138, 5, 190, 0.4);
            box-shadow: 0 8px 22px rgba(0,0,0,0.14);
          }

          .city-row-img {
            width: 112px;
            min-height: 112px;
            align-self: stretch;
            flex-shrink: 0;
            border-radius: 14px;
            object-fit: cover;
            display: block;
          }

          .city-row-body {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3px;
            padding: 2px 0;
          }
          .city-row-title { font-size: 17px; font-weight: 700; margin: 0; letter-spacing: -0.2px; }
          .city-row-loc { font-size: 12px; display: flex; align-items: center; gap: 4px; }
          .city-row-desc {
            font-size: 12.5px;
            line-height: 1.4;
            margin: 4px 0 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .city-row-meta { font-size: 11px; font-weight: 600; margin-top: 4px; }
          .city-row-chev { flex-shrink: 0; align-self: center; }
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
