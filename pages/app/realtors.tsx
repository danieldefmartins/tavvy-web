/**
 * Realtors Hub Screen
 * Find and connect with real estate professionals
 * 
 * NEW DARK THEME DESIGN - Matches the new Tavvy app design language
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiStar, FiChevronRight, FiZap } from 'react-icons/fi';
import ToolHeader from '../../components/ToolHeader';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Realtor {
  id: string;
  business_name: string;
  contact_name?: string;
  photo_url?: string;
  service_areas?: string[];
  rating?: number;
  reviews_count?: number;
  specialties?: string[];
  is_verified?: boolean;
  is_active?: boolean;
}

const SPECIALTIES = ['All', 'Luxury', 'First-Time', 'Investment', 'Relocation', 'Commercial', 'Waterfront'];

export default function RealtorsHubScreen() {
  const { theme, isDark } = useThemeContext();
  const accent = isDark ? '#D7B3F0' : '#8A05BE';
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    fetchRealtors();
  }, []);

  const fetchRealtors = async () => {
    setLoading(true); setLoadError('');
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('provider_type', 'realtor')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRealtors((data || []).map(row => ({
        id: row.id, business_name: row.business_name,
        contact_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        photo_url: row.profile_photo_url || row.logo_url, service_areas: row.service_areas || [],
        rating: row.average_rating, reviews_count: row.total_reviews || 0,
        specialties: row.specialties || [], is_verified: row.is_verified, is_active: row.is_active,
      })));
    } catch (error) {
      setLoadError('Could not load realtors. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRealtors = realtors.filter(realtor => {
    const name = realtor.business_name || realtor.contact_name || '';
    const location = realtor.service_areas?.join(', ') || '';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === 'All' || 
      realtor.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const featuredRealtor = filteredRealtors.find(r => r.is_verified && (r.reviews_count || 0) > 0 && r.rating && r.rating >= 4.8);
  const popularRealtors = filteredRealtors.filter(r => r.id !== featuredRealtor?.id).slice(0, 4);

  return (
    <div style={{ display: 'contents' }}>
      <Head>
        <title>Realtors | TavvY</title>
        <meta name="description" content="Find trusted real estate professionals on TavvY" />
      </Head>

      <AppLayout>
        <div className="realtors-screen">
          <ToolHeader title="Realtors" subtitle="Find a real estate professional." />
          <div className="realtors-header">
            {/* Search Bar */}
            <div className="search-container">
              <FiSearch size={20} color={theme.textSecondary} />
              <input
                type="text"
                aria-label="Search realtors" placeholder="Search realtors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Specialty Filter Pills */}
          <div className="filter-pills">
            {SPECIALTIES.map((specialty) => (
              <button
                key={specialty}
                className={`filter-pill ${selectedSpecialty === specialty ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(specialty)}
              >
                {specialty}
              </button>
            ))}
          </div>

          {/* Smart Match CTA */}
          <section className="smart-match-section">
            <div className="smart-match-card" onClick={() => router.push('/app/realtors/match/start', undefined, { locale })}>
              <div className="smart-match-icon">
                <FiZap size={24} color="#C9A227" />
              </div>
              <div className="smart-match-content">
                <h3>Smart Match</h3>
                <p>Answer a few questions and explore realtors for your needs.</p>
              </div>
              <FiChevronRight size={24} color={theme.textSecondary} />
            </div>
          </section>

          {/* Featured Realtor */}
          {featuredRealtor && !searchQuery && (
            <section className="featured-section">
              <h2>Featured Realtor</h2>
              <Link href={`/app/realtor/${featuredRealtor.id}`} className="featured-card" locale={locale}>
                <div className="featured-badge">FEATURED</div>
                <div className="featured-image">
                  {featuredRealtor.photo_url ? (
                    <img src={featuredRealtor.photo_url} alt={featuredRealtor.business_name} />
                  ) : (
                    <div className="featured-placeholder">
                      {(featuredRealtor.contact_name || featuredRealtor.business_name).charAt(0)}
                    </div>
                  )}
                </div>
                <div className="featured-info">
                  <h3>{featuredRealtor.contact_name || featuredRealtor.business_name}</h3>
                  <p className="featured-location">
                    <FiMapPin size={14} />
                    {featuredRealtor.service_areas?.[0] || 'Multiple Locations'}
                  </p>
                  <div className="featured-rating">
                    <FiStar size={14} color="#F59E0B" fill="#F59E0B" />
                    <span>{featuredRealtor.rating}</span>
                    <span className="review-count">({featuredRealtor.reviews_count} reviews)</span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Popular Realtors Grid */}
          <section className="popular-section">
            <h2>{searchQuery ? 'Search Results' : 'Popular Realtors'}</h2>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : loadError ? (
              <p role="alert">{loadError} <button onClick={fetchRealtors}>Retry</button></p>
            ) : popularRealtors.length === 0 ? (
              <div className="empty-state">
                <span>🏠</span>
                <p>No realtors found</p>
              </div>
            ) : (
              <div className="realtors-grid">
                {popularRealtors.map((realtor) => (
                  <Link 
                    key={realtor.id}
                    href={`/app/realtor/${realtor.id}`}
                    locale={locale}
                    className="realtor-card"
                  >
                    <div className="realtor-image">
                      {realtor.is_verified && (
                        <div className="trending-badge">Verified</div>
                      )}
                      {realtor.photo_url ? (
                        <img src={realtor.photo_url} alt={realtor.business_name} />
                      ) : (
                        <div className="image-placeholder">
                          {(realtor.contact_name || realtor.business_name).charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="realtor-details">
                      <h3>{realtor.contact_name || realtor.business_name}</h3>
                      <p className="realtor-location">
                        {realtor.service_areas?.[0] || 'Multiple Locations'}
                      </p>
                      {!!realtor.rating && (
                        <div className="realtor-rating">
                          <FiStar size={12} color="#F59E0B" fill="#F59E0B" />
                          <span>{realtor.rating}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Browse All Link */}
          <section className="browse-all-section">
            <Link href="/app/realtors/browse" locale={locale} className="browse-all-link">
              Browse All Realtors
              <FiChevronRight size={20} />
            </Link>
          </section>
        </div>

        <style jsx>{`
          .realtors-header :global(.back-link) { display: inline-block; margin-bottom: 16px; color: ${accent}; }
          .realtors-screen {
            min-height: 100vh;
            background: ${theme.background}; color: ${theme.text};
            padding-bottom: 100px;
          }
          
          .realtors-header {
            padding: 20px;
            background: ${theme.background};
          }
          
          .realtors-header h1 {
            font-size: 32px;
            font-weight: 700;
            color: ${theme.text};
            margin: 0 0 4px;
          }
          
          .subtitle {
            font-size: 16px;
            color: ${accent};
            margin: 0 0 20px;
            font-style: italic;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: 12px;
            background: ${theme.surface};
            padding: 14px 18px;
            border-radius: 12px;
            border: 1px solid #252532;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: ${theme.text};
            outline: none;
          }
          
          .search-container input::placeholder {
            color: ${theme.textSecondary};
          }
          
          .filter-pills {
            display: flex;
            gap: 10px;
            padding: 16px 20px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .filter-pills::-webkit-scrollbar {
            display: none;
          }
          
          .filter-pill {
            padding: 10px 18px;
            border-radius: 20px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            background: ${theme.surface};
            color: ${theme.textSecondary};
          }
          
          .filter-pill.active {
            background: #8A05BE;
            color: #FFFFFF;
          }
          
          .filter-pill:hover:not(.active) {
            background: ${theme.surface};
          }
          
          .smart-match-section {
            padding: 0 20px 24px;
          }
          
          .smart-match-card {
            display: flex;
            align-items: center;
            gap: 16px;
            background: linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%);
            padding: 20px;
            border-radius: 16px;
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .smart-match-card:hover {
            transform: scale(1.02);
          }
          
          .smart-match-icon {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .smart-match-content {
            flex: 1;
          }
          
          .smart-match-content h3 {
            font-size: 18px;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0 0 4px;
          }
          
          .smart-match-content p {
            font-size: 13px;
            color: #FFFFFF;
            margin: 0;
            line-height: 1.4;
          }
          
          .featured-section {
            padding: 0 20px 24px;
          }
          
          .featured-section h2,
          .popular-section h2 {
            font-size: 18px;
            font-weight: 600;
            color: ${theme.text};
            margin: 0 0 16px;
          }
          
          .realtors-screen :global(.featured-card) {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            background: ${theme.surface};
            padding: 16px;
            border-radius: 16px;
            text-decoration: none;
            overflow: hidden;
          }
          
          .featured-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #8A05BE;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            z-index: 1;
          }
          
          .featured-image {
            width: 100px;
            height: 100px;
            border-radius: 12px;
            overflow: hidden;
            flex-shrink: 0;
          }
          
          .featured-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .featured-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 36px;
            font-weight: 600;
          }
          
          .featured-info {
            flex: 1;
          }
          
          .featured-info h3 {
            font-size: 18px;
            font-weight: 600;
            color: ${theme.text};
            margin: 0 0 8px;
          }
          
          .featured-location {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: ${theme.textSecondary};
            margin: 0 0 8px;
          }
          
          .featured-rating {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: ${theme.text};
          }
          
          .review-count {
            color: ${theme.textSecondary};
          }
          
          .popular-section {
            padding: 0 20px 24px;
          }
          
          .realtors-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .realtors-screen :global(.realtor-card) {
            background: ${theme.surface};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .realtors-screen :global(.realtor-card:hover) {
            transform: scale(1.02);
          }
          
          .realtor-image {
            position: relative;
            width: 100%;
            aspect-ratio: 4/3;
            overflow: hidden;
          }
          
          .realtor-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .image-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 48px;
            font-weight: 600;
          }
          
          .trending-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(239, 68, 68, 0.9);
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
          }
          
          .realtor-details {
            padding: 14px;
          }
          
          .realtor-details h3 {
            font-size: 15px;
            font-weight: 600;
            color: ${theme.text};
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .realtor-location {
            font-size: 13px;
            color: ${theme.textSecondary};
            margin: 0 0 6px;
          }
          
          .realtor-rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: ${theme.text};
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 60px;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #252532;
            border-top-color: ${accent};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
          
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }
          
          .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: 16px;
          }
          
          .empty-state p {
            color: ${theme.textSecondary};
            font-size: 16px;
          }
          
          .browse-all-section {
            padding: 0 20px 40px;
          }
          
          .realtors-screen :global(.browse-all-link) {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: ${theme.surface};
            color: ${accent};
            padding: 16px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            transition: background 0.2s;
          }
          
          .realtors-screen :global(.browse-all-link:hover) {
            background: ${theme.surface};
          }
          
          @media (max-width: 480px) {
            .realtors-header h1 {
              font-size: 28px;
            }
            
            .realtors-grid {
              gap: 12px;
            }
            
            .realtor-details h3 {
              font-size: 14px;
            }
          }
        `}</style>
      </AppLayout>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
