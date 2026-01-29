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
import { UnifiedHeader } from '../../components/UnifiedHeader';

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

// Sample realtors for display
const SAMPLE_REALTORS: Realtor[] = [
  { id: '1', business_name: 'Sarah Johnson Realty', contact_name: 'Sarah Johnson', service_areas: ['Miami, FL'], rating: 4.9, reviews_count: 127, specialties: ['Luxury', 'Waterfront'], is_verified: true },
  { id: '2', business_name: 'Urban Living Group', contact_name: 'Michael Chen', service_areas: ['New York, NY'], rating: 4.8, reviews_count: 89, specialties: ['Condos', 'Investment'], is_verified: true },
  { id: '3', business_name: 'Family First Realty', contact_name: 'Emily Rodriguez', service_areas: ['Los Angeles, CA'], rating: 4.7, reviews_count: 156, specialties: ['Family Homes', 'First-Time'], is_verified: false },
  { id: '4', business_name: 'Commercial Experts', contact_name: 'David Thompson', service_areas: ['Chicago, IL'], rating: 4.9, reviews_count: 203, specialties: ['Commercial', 'Investment'], is_verified: true },
  { id: '5', business_name: 'Coastal Properties', contact_name: 'Jennifer Lee', service_areas: ['San Diego, CA'], rating: 4.6, reviews_count: 78, specialties: ['Waterfront', 'Luxury'], is_verified: true },
  { id: '6', business_name: 'Metro Realty Partners', contact_name: 'Robert Wilson', service_areas: ['Austin, TX'], rating: 4.8, reviews_count: 134, specialties: ['Relocation', 'First-Time'], is_verified: false },
];

const SPECIALTIES = ['All', 'Luxury', 'First-Time', 'Investment', 'Relocation', 'Commercial', 'Waterfront'];

export default function RealtorsHubScreen() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const [realtors, setRealtors] = useState<Realtor[]>(SAMPLE_REALTORS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    fetchRealtors();
  }, []);

  const fetchRealtors = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('provider_type', 'realtor')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setRealtors(data);
      }
    } catch (error) {
      console.error('Error fetching realtors:', error);
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

  const featuredRealtor = filteredRealtors.find(r => r.is_verified && r.rating && r.rating >= 4.8);
  const popularRealtors = filteredRealtors.filter(r => r.id !== featuredRealtor?.id).slice(0, 6);

  return (
    <>
      <Head>
        <title>Realtors | TavvY</title>
        <meta name="description" content="Find trusted real estate professionals on TavvY" />
      </Head>

      <AppLayout>
        <div className="realtors-screen">
          {/* Header */}
          <div className="realtors-header">
            <h1>Realtors</h1>
            <p className="subtitle">Find your perfect agent.</p>
            
            {/* Search Bar */}
            <div className="search-container">
              <FiSearch size={20} color="#6B7280" />
              <input
                type="text"
                placeholder="Search realtors..."
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
            <div className="smart-match-card" onClick={() => router.push('/app/realtors/match/start')}>
              <div className="smart-match-icon">
                <FiZap size={24} color="#C9A227" />
              </div>
              <div className="smart-match-content">
                <h3>Smart Match</h3>
                <p>Answer a few questions and get matched with the perfect realtor for your needs.</p>
              </div>
              <FiChevronRight size={24} color="#6B7280" />
            </div>
          </section>

          {/* Featured Realtor */}
          {featuredRealtor && !searchQuery && (
            <section className="featured-section">
              <h2>Featured Realtor</h2>
              <Link href={`/app/realtor/${featuredRealtor.id}`} className="featured-card">
                <div className="featured-badge">TOP RATED</div>
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
                    className="realtor-card"
                  >
                    <div className="realtor-image">
                      {realtor.is_verified && (
                        <div className="trending-badge">🔥 Trending</div>
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
                      {realtor.rating && (
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
            <Link href="/app/realtors/browse" className="browse-all-link">
              Browse All Realtors
              <FiChevronRight size={20} />
            </Link>
          </section>
        </div>

        <style jsx>{`
          .realtors-screen {
            min-height: 100vh;
            background: #0A0A0F;
            padding-bottom: 100px;
          }
          
          .realtors-header {
            padding: 60px 20px 20px;
            background: linear-gradient(180deg, #0F1520 0%, #0A0A0F 100%);
          }
          
          .realtors-header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 4px;
          }
          
          .subtitle {
            font-size: 16px;
            color: #3B82F6;
            margin: 0 0 20px;
            font-style: italic;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #1A1A24;
            padding: 14px 18px;
            border-radius: 12px;
            border: 1px solid #252532;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: #FFFFFF;
            outline: none;
          }
          
          .search-container input::placeholder {
            color: #6B7280;
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
            background: #1A1A24;
            color: #9CA3AF;
          }
          
          .filter-pill.active {
            background: #3B82F6;
            color: #FFFFFF;
          }
          
          .filter-pill:hover:not(.active) {
            background: #252532;
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
            color: rgba(255, 255, 255, 0.7);
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
            color: #FFFFFF;
            margin: 0 0 16px;
          }
          
          .featured-card {
            position: relative;
            display: flex;
            align-items: center;
            gap: 16px;
            background: #1A1A24;
            padding: 16px;
            border-radius: 16px;
            text-decoration: none;
            overflow: hidden;
          }
          
          .featured-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #3B82F6;
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
            color: #FFFFFF;
            margin: 0 0 8px;
          }
          
          .featured-location {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #9CA3AF;
            margin: 0 0 8px;
          }
          
          .featured-rating {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #FFFFFF;
          }
          
          .review-count {
            color: #6B7280;
          }
          
          .popular-section {
            padding: 0 20px 24px;
          }
          
          .realtors-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .realtor-card {
            background: #1A1A24;
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .realtor-card:hover {
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
            color: #FFFFFF;
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .realtor-location {
            font-size: 13px;
            color: #9CA3AF;
            margin: 0 0 6px;
          }
          
          .realtor-rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #FFFFFF;
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
            border-top-color: #3B82F6;
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
            color: #6B7280;
            font-size: 16px;
          }
          
          .browse-all-section {
            padding: 0 20px 40px;
          }
          
          .browse-all-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #1A1A24;
            color: #3B82F6;
            padding: 16px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            transition: background 0.2s;
          }
          
          .browse-all-link:hover {
            background: #252532;
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
    </>
  );
}
