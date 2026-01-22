/**
 * Realtors Hub Screen
 * Find and connect with real estate professionals
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiStar, FiPhone, FiMail, FiChevronRight } from 'react-icons/fi';

interface Realtor {
  id: string;
  name: string;
  company?: string;
  photo_url?: string;
  location?: string;
  rating?: number;
  reviews_count?: number;
  specialties?: string[];
  phone?: string;
  email?: string;
}

// Sample realtors for display
const SAMPLE_REALTORS: Realtor[] = [
  { id: '1', name: 'Sarah Johnson', company: 'Luxury Homes Realty', location: 'Miami, FL', rating: 4.9, reviews_count: 127, specialties: ['Luxury', 'Waterfront'] },
  { id: '2', name: 'Michael Chen', company: 'Urban Living Group', location: 'New York, NY', rating: 4.8, reviews_count: 89, specialties: ['Condos', 'Investment'] },
  { id: '3', name: 'Emily Rodriguez', company: 'Family First Realty', location: 'Los Angeles, CA', rating: 4.7, reviews_count: 156, specialties: ['Family Homes', 'Schools'] },
  { id: '4', name: 'David Thompson', company: 'Commercial Experts', location: 'Chicago, IL', rating: 4.9, reviews_count: 203, specialties: ['Commercial', 'Office'] },
];

const SPECIALTIES = ['All', 'Luxury', 'Condos', 'Family Homes', 'Commercial', 'Investment', 'Waterfront'];

export default function RealtorsHubScreen() {
  const { theme } = useThemeContext();
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
        .from('realtors')
        .select('*')
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
    const matchesSearch = realtor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      realtor.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      realtor.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === 'All' || 
      realtor.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <>
      <Head>
        <title>Realtors | TavvY</title>
        <meta name="description" content="Find trusted real estate professionals on TavvY" />
      </Head>

      <AppLayout>
        <div className="realtors-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="realtors-header" style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}>
            <h1>🏠 Realtors</h1>
            <p>Find trusted real estate professionals</p>
            
            {/* Search */}
            <div className="search-container">
              <FiSearch size={18} color="rgba(255,255,255,0.7)" />
              <input
                type="text"
                placeholder="Search realtors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {/* Specialty Filter */}
          <div className="specialty-filter">
            {SPECIALTIES.map((specialty) => (
              <button
                key={specialty}
                className={`specialty-chip ${selectedSpecialty === specialty ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(specialty)}
                style={{
                  backgroundColor: selectedSpecialty === specialty ? '#0D9488' : theme.surface,
                  color: selectedSpecialty === specialty ? 'white' : theme.text,
                }}
              >
                {specialty}
              </button>
            ))}
          </div>

          {/* Realtors List */}
          <section className="realtors-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredRealtors.length === 0 ? (
              <div className="empty-state">
                <span>🏠</span>
                <p style={{ color: theme.textSecondary }}>No realtors found</p>
              </div>
            ) : (
              <div className="realtors-list">
                {filteredRealtors.map((realtor) => (
                  <Link 
                    key={realtor.id}
                    href={`/app/realtor/${realtor.id}`}
                    className="realtor-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="realtor-photo">
                      {realtor.photo_url ? (
                        <img src={realtor.photo_url} alt={realtor.name} />
                      ) : (
                        <div className="photo-placeholder" style={{ backgroundColor: theme.primary }}>
                          {realtor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="realtor-info">
                      <h3 style={{ color: theme.text }}>{realtor.name}</h3>
                      {realtor.company && (
                        <p className="company" style={{ color: theme.textSecondary }}>{realtor.company}</p>
                      )}
                      {realtor.location && (
                        <p className="location" style={{ color: theme.textTertiary }}>
                          <FiMapPin size={12} /> {realtor.location}
                        </p>
                      )}
                      {realtor.rating && (
                        <div className="rating">
                          <FiStar size={14} color="#F59E0B" fill="#F59E0B" />
                          <span style={{ color: theme.text }}>{realtor.rating}</span>
                          <span style={{ color: theme.textTertiary }}>({realtor.reviews_count} reviews)</span>
                        </div>
                      )}
                      {realtor.specialties && realtor.specialties.length > 0 && (
                        <div className="specialties">
                          {realtor.specialties.slice(0, 2).map((s, i) => (
                            <span key={i} className="specialty-tag" style={{ backgroundColor: theme.surface, color: theme.text }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <FiChevronRight size={20} color={theme.textTertiary} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .realtors-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .realtors-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.xl}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .realtors-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .realtors-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            background: rgba(255,255,255,0.2);
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: white;
            outline: none;
          }
          
          .search-container input::placeholder {
            color: rgba(255,255,255,0.7);
          }
          
          .specialty-filter {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .specialty-filter::-webkit-scrollbar {
            display: none;
          }
          
          .specialty-chip {
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .realtors-section {
            padding: 0 ${spacing.lg}px;
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
            border-top-color: #0D9488;
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
          
          .realtors-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .realtor-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .realtor-card:hover {
            transform: translateX(4px);
          }
          
          .realtor-photo {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            overflow: hidden;
          }
          
          .realtor-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: 600;
          }
          
          .realtor-info {
            flex: 1;
          }
          
          .realtor-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .company {
            font-size: 13px;
            margin: 0 0 2px;
          }
          
          .location {
            font-size: 12px;
            margin: 0 0 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            margin-bottom: 6px;
          }
          
          .specialties {
            display: flex;
            gap: 6px;
          }
          
          .specialty-tag {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: ${borderRadius.full}px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
