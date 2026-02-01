/**
 * Experiences Screen
 * Browse local experiences and activities
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiMapPin, FiCalendar, FiClock, FiUsers } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Experience {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  category?: string;
  location?: string;
  price?: number;
  duration_hours?: number;
  max_participants?: number;
  rating?: number;
  review_count?: number;
}

const EXPERIENCE_CATEGORIES = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'food-tours', name: 'Food Tours', icon: '🍽️' },
  { id: 'outdoor', name: 'Outdoor', icon: '🏕️' },
  { id: 'cultural', name: 'Cultural', icon: '🎭' },
  { id: 'wellness', name: 'Wellness', icon: '🧘' },
  { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  { id: 'workshops', name: 'Workshops', icon: '🎨' },
];

export default function ExperiencesScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('rating', { ascending: false })
        .limit(50);

      if (!error) {
        setExperiences(data || []);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiences = experiences.filter(exp => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>Experiences | TavvY</title>
        <meta name="description" content="Discover unique local experiences on TavvY" />
      </Head>

      <AppLayout>
        <div className="experiences-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="experiences-header" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            <h1>✨ Experiences</h1>
            <p>Discover unique local activities</p>
            
            {/* Search */}
            <div className="search-container">
              <FiSearch size={18} color="rgba(255,255,255,0.7)" />
              <input
                type="text"
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {/* Category Pills */}
          <div className="categories-scroll">
            {EXPERIENCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? theme.primary : theme.surface,
                  color: selectedCategory === cat.id ? 'white' : theme.text,
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Experiences Grid */}
          <section className="experiences-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredExperiences.length === 0 ? (
              <div className="empty-state">
                <span>✨</span>
                <h3 style={{ color: theme.text }}>No experiences found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery ? 'Try a different search' : 'Check back soon for new experiences'}
                </p>
              </div>
            ) : (
              <div className="experiences-grid">
                {filteredExperiences.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/app/experience/${exp.slug || exp.id}`}
                    className="experience-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="card-image">
                      {exp.cover_image_url ? (
                        <img src={exp.cover_image_url} alt={exp.title} />
                      ) : (
                        <div className="image-placeholder" style={{ backgroundColor: theme.surface }}>
                          ✨
                        </div>
                      )}
                      {exp.category && (
                        <span className="category-badge" style={{ backgroundColor: theme.primary }}>
                          {exp.category}
                        </span>
                      )}
                    </div>
                    <div className="card-content">
                      <h3 style={{ color: theme.text }}>{exp.title}</h3>
                      {exp.location && (
                        <p className="location" style={{ color: theme.textSecondary }}>
                          <FiMapPin size={12} /> {exp.location}
                        </p>
                      )}
                      <div className="meta-row">
                        {exp.duration_hours && (
                          <span style={{ color: theme.textTertiary }}>
                            <FiClock size={12} /> {exp.duration_hours}h
                          </span>
                        )}
                        {exp.max_participants && (
                          <span style={{ color: theme.textTertiary }}>
                            <FiUsers size={12} /> Up to {exp.max_participants}
                          </span>
                        )}
                      </div>
                      {exp.price !== undefined && (
                        <p className="price" style={{ color: theme.text }}>
                          From <strong>${exp.price}</strong> per person
                        </p>
                      )}
                      {exp.rating && (
                        <div className="rating">
                          <span>⭐ {exp.rating.toFixed(1)}</span>
                          {exp.review_count && (
                            <span style={{ color: theme.textTertiary }}>({exp.review_count})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .experiences-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .experiences-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .experiences-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .experiences-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
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
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .category-pill {
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
          }
          
          .experiences-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 60px;
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
            padding: 60px 20px;
          }
          
          .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: ${spacing.md}px;
          }
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0;
          }
          
          .experiences-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .experience-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .experience-card:hover {
            transform: translateY(-4px);
          }
          
          .card-image {
            position: relative;
            height: 180px;
          }
          
          .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
          }
          
          .category-badge {
            position: absolute;
            top: ${spacing.sm}px;
            left: ${spacing.sm}px;
            padding: 4px 10px;
            border-radius: ${borderRadius.full}px;
            color: white;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .card-content {
            padding: ${spacing.md}px;
          }
          
          .card-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .location {
            font-size: 13px;
            margin: 0 0 ${spacing.sm}px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .meta-row {
            display: flex;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.sm}px;
            font-size: 12px;
          }
          
          .meta-row span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .price {
            font-size: 14px;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
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
