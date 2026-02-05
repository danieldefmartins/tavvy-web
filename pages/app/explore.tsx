/**
 * Universes Screen - Explore curated worlds
 * Fixed layout with proper structure
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { IoSearch, IoRocketOutline, IoAirplaneOutline, IoLeafOutline, IoBusinessOutline, IoChevronBack, IoPersonCircleOutline } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  place_count?: number;
  total_signals?: number;
  is_featured?: boolean;
  category_id?: string;
  location?: string;
}

const CATEGORY_FILTERS = [
  { id: 'theme-parks', icon: IoRocketOutline, label: 'Theme Parks' },
  { id: 'airports', icon: IoAirplaneOutline, label: 'Airports' },
  { id: 'national-parks', icon: IoLeafOutline, label: 'Parks' },
  { id: 'cities', icon: IoBusinessOutline, label: 'Cities' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function ExploreScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
  const [popularUniverses, setPopularUniverses] = useState<Universe[]>([]);
  const [searchResults, setSearchResults] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchUniverses();
  }, [activeCategory]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchUniverses(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUniverses = async () => {
    setLoading(true);
    try {
      const [featuredResult, universesResult] = await Promise.all([
        supabase.from('atlas_universes').select('*').eq('is_featured', true).limit(1),
        supabase.from('atlas_universes').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      if (featuredResult.data?.[0]) setFeaturedUniverse(featuredResult.data[0]);
      if (universesResult.data) setPopularUniverses(universesResult.data);
    } catch (error) {
      console.error('Error fetching universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUniverses = async (query: string) => {
    try {
      const { data } = await supabase
        .from('atlas_universes')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
      </Head>

      <AppLayout>
        <div style={{
          minHeight: '100vh',
          backgroundColor: theme.background,
          paddingBottom: 100,
        }}>
          {/* HEADER - Back | Title | Profile (WHITE) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border}`,
            backgroundColor: theme.background,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IoChevronBack size={24} />
            </button>
            
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 700,
                color: theme.text,
                margin: 0,
              }}>Universes</h1>
              <p style={{
                fontSize: 12,
                color: COLORS.accent,
                margin: '2px 0 0',
              }}>Explore curated worlds.</p>
            </div>
            
            <Link
              href="/app/profile"
              style={{
                color: '#FFFFFF',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IoPersonCircleOutline size={28} />
            </Link>
          </div>

          {/* SEARCH BAR */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: theme.surface,
              padding: '12px 14px',
              borderRadius: 12,
            }}>
              <IoSearch size={20} color={theme.textSecondary} />
              <input
                type="text"
                placeholder="Search parks, airports, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 15,
                  color: theme.text,
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: theme.textSecondary,
                    color: theme.background,
                    border: 'none',
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >✕</button>
              )}
            </div>
          </div>

          {isSearching ? (
            /* SEARCH RESULTS */
            <div style={{ padding: '0 16px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>
                {searching ? 'Searching...' : `Results for "${searchQuery}"`}
              </h2>
              {searching ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{
                    width: 32, height: 32,
                    border: `3px solid ${theme.surface}`,
                    borderTopColor: COLORS.accent,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }} />
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <span style={{ fontSize: 40 }}>🔍</span>
                  <h3 style={{ color: theme.text, margin: '12px 0 6px' }}>No universes found</h3>
                  <p style={{ color: theme.textSecondary, fontSize: 13 }}>Try a different search term</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {searchResults.map((u) => (
                    <Link
                      key={u.id}
                      href={`/app/universe/${u.slug || u.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        backgroundColor: theme.surface,
                        borderRadius: 12,
                        textDecoration: 'none',
                      }}
                    >
                      <img
                        src={u.thumbnail_image_url || PLACEHOLDER_IMAGE}
                        alt={u.name}
                        style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
                      />
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: 0 }}>{u.name}</h3>
                        <p style={{ fontSize: 13, color: theme.textSecondary, margin: '4px 0 0' }}>{u.location || 'Explore Now'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* FEATURED UNIVERSE - Medium size (150px) */}
              {featuredUniverse && (
                <Link
                  href={`/app/universe/${featuredUniverse.slug || featuredUniverse.id}`}
                  style={{
                    display: 'block',
                    margin: '0 16px 16px',
                    borderRadius: 14,
                    overflow: 'hidden',
                    height: 150,
                    position: 'relative',
                    textDecoration: 'none',
                  }}
                >
                  <img
                    src={featuredUniverse.banner_image_url || PLACEHOLDER_IMAGE}
                    alt={featuredUniverse.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    border: `1.5px solid ${COLORS.accent}`,
                    padding: '3px 8px',
                    borderRadius: 5,
                  }}>
                    <span style={{ color: COLORS.accent, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                      FEATURED
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '40px 12px 12px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  }}>
                    <h2 style={{ color: '#FFF', fontSize: 18, fontWeight: 700, margin: 0 }}>
                      {featuredUniverse.name}
                    </h2>
                    <p style={{ color: '#D1D5DB', fontSize: 12, margin: '4px 0 0' }}>
                      {featuredUniverse.location || 'Tap to explore'}
                    </p>
                  </div>
                </Link>
              )}

              {/* CATEGORY FILTERS - Clean grid */}
              <div style={{ padding: '0 16px', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 10px' }}>
                  Filter by Category
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                }}>
                  {CATEGORY_FILTERS.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeCategory === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveCategory(isActive ? null : filter.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '12px 4px',
                          backgroundColor: theme.surface,
                          border: isActive ? `2px solid ${COLORS.accent}` : 'none',
                          borderRadius: 12,
                          color: isActive ? COLORS.accent : theme.textSecondary,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={22} />
                        <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center' }}>
                          {filter.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POPULAR UNIVERSES - Full width cards */}
              <div style={{ padding: '0 16px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 12px' }}>
                  Popular Universes
                </h2>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{
                      width: 32, height: 32,
                      border: `3px solid ${theme.surface}`,
                      borderTopColor: COLORS.accent,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 10px',
                    }} />
                    <p style={{ color: theme.textSecondary, fontSize: 13 }}>Loading...</p>
                  </div>
                ) : popularUniverses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <span style={{ fontSize: 40 }}>🌌</span>
                    <h3 style={{ color: theme.text, margin: '12px 0 6px' }}>No universes found</h3>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {popularUniverses.map((u) => (
                      <Link
                        key={u.id}
                        href={`/app/universe/${u.slug || u.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          backgroundColor: theme.surface,
                          borderRadius: 12,
                          overflow: 'hidden',
                          textDecoration: 'none',
                        }}
                      >
                        <img
                          src={u.thumbnail_image_url || PLACEHOLDER_IMAGE}
                          alt={u.name}
                          style={{
                            width: 100,
                            height: 80,
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{ flex: 1, padding: '8px 12px 8px 0' }}>
                          <h3 style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: theme.text,
                            margin: '0 0 4px',
                          }}>{u.name}</h3>
                          <p style={{
                            fontSize: 12,
                            color: theme.textSecondary,
                            margin: '0 0 6px',
                          }}>{u.location || 'Explore Now'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12 }}>🔥</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.activityHigh }}>Active</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
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
