/**
 * Pros Category Screen
 * Browse service providers in a specific category
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import AppLayout from '../../../../components/AppLayout';
import { supabase } from '../../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../../constants/Colors';
import { FiArrowLeft, FiSearch, FiStar, FiMapPin, FiPhone, FiChevronRight } from 'react-icons/fi';

interface Provider {
  id: string;
  business_name: string;
  slug?: string;
  profile_image_url?: string;
  description?: string;
  location?: string;
  rating?: number;
  review_count?: number;
  phone?: string;
  is_verified?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

// Category data mapping
const CATEGORY_DATA: Record<string, Category> = {
  'home-services': { id: '1', name: 'Home Services', slug: 'home-services', icon: '🏠', description: 'General home maintenance and repairs' },
  'plumbing': { id: '2', name: 'Plumbing', slug: 'plumbing', icon: '🔧', description: 'Plumbing repairs, installation, and maintenance' },
  'electrical': { id: '3', name: 'Electrical', slug: 'electrical', icon: '⚡', description: 'Electrical work and installations' },
  'cleaning': { id: '4', name: 'Cleaning', slug: 'cleaning', icon: '🧹', description: 'Professional cleaning services' },
  'landscaping': { id: '5', name: 'Landscaping', slug: 'landscaping', icon: '🌳', description: 'Lawn care and landscaping' },
  'moving': { id: '6', name: 'Moving', slug: 'moving', icon: '📦', description: 'Moving and relocation services' },
  'painting': { id: '7', name: 'Painting', slug: 'painting', icon: '🎨', description: 'Interior and exterior painting' },
  'hvac': { id: '8', name: 'HVAC', slug: 'hvac', icon: '❄️', description: 'Heating, ventilation, and air conditioning' },
};

export default function ProsCategoryScreen() {
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { theme } = useThemeContext();

  const [category, setCategory] = useState<Category | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (slug) {
      const categorySlug = slug as string;
      setCategory(CATEGORY_DATA[categorySlug] || { id: '0', name: categorySlug.replace(/-/g, ' '), slug: categorySlug });
      fetchProviders(categorySlug);
    }
  }, [slug]);

  const fetchProviders = async (categorySlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pros_providers')
        .select('*')
        .eq('category_slug', categorySlug)
        .order('rating', { ascending: false })
        .limit(50);

      if (!error) {
        setProviders(data || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!category) {
    return (
      <AppLayout>
        <div className="loading-screen" style={{ backgroundColor: theme.background }}>
          <div className="loading-spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{category.name} Pros | TavvY</title>
        <meta name="description" content={category.description || `Find ${category.name} professionals on TavvY`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="category-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="category-header" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color="white" />
            </button>
            <div className="header-content">
              <span className="category-icon">{category.icon || '🔧'}</span>
              <h1>{category.name}</h1>
              {category.description && <p>{category.description}</p>}
            </div>
            
            {/* Search */}
            <div className="search-container">
              <FiSearch size={18} color="rgba(255,255,255,0.7)" />
              <input
                type="text"
                placeholder={`Search ${category.name.toLowerCase()} pros...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {/* Request Quote CTA */}
          <div className="quote-cta" style={{ backgroundColor: theme.cardBackground }}>
            <div className="cta-content">
              <h3 style={{ color: theme.text }}>Need a {category.name} Pro?</h3>
              <p style={{ color: theme.textSecondary }}>Get free quotes from top-rated professionals</p>
            </div>
            <Link href={`/app/pros/request?category=${slug}`} className="cta-button" style={{ backgroundColor: theme.primary }}>
              Get Quotes
            </Link>
          </div>

          {/* Providers List */}
          <section className="providers-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : `${category.name} Professionals`}
            </h2>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="empty-state">
                <span>{category.icon || '🔧'}</span>
                <h3 style={{ color: theme.text }}>No providers found</h3>
                <p style={{ color: theme.textSecondary }}>
                  Be the first {category.name.toLowerCase()} pro in your area!
                </p>
                <Link href="/app/pros/register" locale={locale} className="register-link" style={{ color: theme.primary }}>
                  Register as a Pro
                </Link>
              </div>
            ) : (
              <div className="providers-list">
                {filteredProviders.map((provider) => (
                  <Link 
                    key={provider.id}
                    href={`/app/pros/provider/${provider.slug || provider.id}`}
                    className="provider-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="provider-photo">
                      {provider.profile_image_url ? (
                        <img src={provider.profile_image_url} alt={provider.business_name} />
                      ) : (
                        <div className="photo-placeholder" style={{ backgroundColor: theme.primary }}>
                          {provider.business_name.charAt(0)}
                        </div>
                      )}
                      {provider.is_verified && (
                        <span className="verified-badge">✓</span>
                      )}
                    </div>
                    <div className="provider-info">
                      <h3 style={{ color: theme.text }}>{provider.business_name}</h3>
                      {provider.location && (
                        <p className="location" style={{ color: theme.textSecondary }}>
                          <FiMapPin size={12} /> {provider.location}
                        </p>
                      )}
                      {provider.rating && (
                        <div className="rating">
                          <FiStar size={14} color="#F59E0B" fill="#F59E0B" />
                          <span style={{ color: theme.text }}>{provider.rating.toFixed(1)}</span>
                          {provider.review_count && (
                            <span style={{ color: theme.textTertiary }}>({provider.review_count} reviews)</span>
                          )}
                        </div>
                      )}
                      {provider.description && (
                        <p className="description" style={{ color: theme.textTertiary }}>
                          {provider.description.substring(0, 80)}...
                        </p>
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
          .category-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .category-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.2);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: ${spacing.md}px;
          }
          
          .header-content {
            margin-bottom: ${spacing.lg}px;
          }
          
          .category-icon {
            font-size: 40px;
            display: block;
            margin-bottom: ${spacing.sm}px;
          }
          
          .header-content h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .header-content p {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            margin: 0;
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
          
          .quote-cta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: ${spacing.lg}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .cta-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .cta-content p {
            font-size: 13px;
            margin: 0;
          }
          
          .cta-button {
            padding: 10px 20px;
            border-radius: ${borderRadius.md}px;
            color: white;
            font-weight: 600;
            text-decoration: none;
            white-space: nowrap;
          }
          
          .providers-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .providers-section h2 {
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
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0 0 ${spacing.md}px;
          }
          
          .register-link {
            font-weight: 600;
            text-decoration: none;
          }
          
          .providers-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .provider-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .provider-card:hover {
            transform: translateX(4px);
          }
          
          .provider-photo {
            position: relative;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            overflow: hidden;
          }
          
          .provider-photo img {
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
          
          .verified-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            background: #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            border: 2px solid ${theme.cardBackground};
          }
          
          .provider-info {
            flex: 1;
          }
          
          .provider-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .location {
            font-size: 13px;
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
            margin-bottom: 4px;
          }
          
          .description {
            font-size: 12px;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
