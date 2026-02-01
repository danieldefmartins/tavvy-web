/**
 * Universes Screen - Web Version V2
 * EXACT pixel-perfect port from iOS Tavvy V2
 * 
 * Design: Black background, blue accents, featured universe hero,
 * category filters, popular universes grid
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  IoSearchOutline, IoRocketOutline, IoAirplaneOutline,
  IoLeafOutline, IoBusinessOutline, IoFlameOutline
} from 'react-icons/io5';
import { tavvyTheme, getThemeColors, getBrandColor } from '../../styles/tavvyTheme';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Universe {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  place_count?: number;
}

const CATEGORY_ICONS = [
  { id: 'all', icon: IoRocketOutline, label: 'All' },
  { id: 'airports', icon: IoAirplaneOutline, label: 'Airports' },
  { id: 'nature', icon: IoLeafOutline, label: 'Nature' },
  { id: 'urban', icon: IoBusinessOutline, label: 'Urban' },
];

export default function UniversesScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { isDark } = useThemeContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [featuredUniverse, setFeaturedUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const featured = data.find(u => u.is_featured);
        setFeaturedUniverse(featured || data[0]);
        setUniverses(data);
      }
    } catch (error) {
      console.error('Error loading universes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Force dark mode to match iOS V2 design
  const colors = getThemeColors(true);
  const brandColor = getBrandColor('universes');

  return (
    <>
      <Head>
        <title>Universes | TavvY</title>
        <meta name="description" content="Explore curated worlds" />
      </Head>

      <AppLayout>
        <div style={{
          minHeight: '100vh',
          paddingBottom: '80px'
        }}>

          {/* Header */}
          <div style={{ padding: '24px 20px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: colors.text,
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>
              Universes
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.textSecondary,
              margin: 0,
              fontWeight: '500'
            }}>
              Explore curated worlds.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '0 20px 24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: colors.surface,
              borderRadius: '12px'
            }}>
              <IoSearchOutline size={20} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search parks, airports, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: colors.text,
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Featured Universe */}
          {featuredUniverse && (
            <div style={{ padding: '0 20px 32px' }}>
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '320px',
                cursor: 'pointer'
              }}
              onClick={() => router.push(`/app/universe/${featuredUniverse.id}`)}>
                {/* Background Image */}
                <img
                  src={featuredUniverse.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                  alt={featuredUniverse.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
                }} />

                {/* Content */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  right: '20px',
                  bottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(102, 126, 234, 0.3)',
                    border: '1px solid rgba(102, 126, 234, 0.5)',
                    borderRadius: '6px',
                    alignSelf: 'flex-start'
                  }}>
                    <span style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      FEATURED UNIVERSE
                    </span>
                  </div>

                  {/* Title and CTA */}
                  <div>
                    <h2 style={{
                      fontSize: '36px',
                      fontWeight: '700',
                      color: '#fff',
                      margin: '0 0 8px 0',
                      textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      {featuredUniverse.name}
                    </h2>
                    {featuredUniverse.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#fff',
                        margin: '0 0 16px 0',
                        opacity: 0.9
                      }}>
                        {featuredUniverse.category}
                      </p>
                    )}
                    <button style={{
                      padding: '12px 24px',
                      backgroundColor: brandColor,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandColorHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandColor}>
                      Explore Universe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter by Category */}
          <div style={{ padding: '0 20px 32px' }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.text,
              margin: '0 0 16px 0'
            }}>
              Filter by Category
            </h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {CATEGORY_ICONS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px',
                      minWidth: '80px',
                      backgroundColor: isSelected ? brandColor : colors.surface,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={28} color={isSelected ? '#fff' : colors.text} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: isSelected ? '#fff' : colors.text
                    }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Universes */}
          <div style={{ padding: '0 20px' }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.text,
              margin: '0 0 16px 0'
            }}>
              Popular Universes
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {universes.slice(0, 8).map((universe) => (
                <Link
                  key={universe.id}
                  href={`/app/universe/${universe.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <img
                      src={universe.cover_image_url || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                      alt={universe.name}
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      padding: '12px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.text,
                        margin: '0 0 4px 0'
                      }}>
                        {universe.name}
                      </h4>
                      {universe.is_active && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <IoFlameOutline size={14} color={tavvyTheme.colors.status.active} />
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: tavvyTheme.colors.status.active
                          }}>
                            Active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

// Cache-busting comment

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
