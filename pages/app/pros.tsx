/**
 * Pros Screen - Service Professionals Marketplace
 * Ported from tavvy-mobile/screens/ProsHomeScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

interface FeaturedProvider {
  id: string;
  business_name: string;
  slug: string;
  profile_image_url?: string;
  category_name?: string;
  rating?: number;
  review_count?: number;
}

export default function ProsScreen() {
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<FeaturedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch service categories
      const categoriesResult = await supabase
        .from('pros_service_categories')
        .select('*');
      
      // Handle the result - may be mock data
      const categoriesData = categoriesResult?.data || [];

      // Fetch featured providers
      const providersResult = await supabase
        .from('pros_providers')
        .select('*');
      
      const providersData = providersResult?.data || [];

      setCategories(categoriesData);
      setFeaturedProviders(providersData.filter((p: any) => p?.is_featured).slice(0, 6));
    } catch (error) {
      console.error('Error fetching pros data:', error);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  // Default categories if none from database
  const defaultCategories: ServiceCategory[] = [
    { id: '1', name: 'Home Services', slug: 'home-services', icon: '🏠' },
    { id: '2', name: 'Plumbing', slug: 'plumbing', icon: '🔧' },
    { id: '3', name: 'Electrical', slug: 'electrical', icon: '⚡' },
    { id: '4', name: 'Cleaning', slug: 'cleaning', icon: '🧹' },
    { id: '5', name: 'Landscaping', slug: 'landscaping', icon: '🌳' },
    { id: '6', name: 'Moving', slug: 'moving', icon: '📦' },
    { id: '7', name: 'Painting', slug: 'painting', icon: '🎨' },
    { id: '8', name: 'HVAC', slug: 'hvac', icon: '❄️' },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <>
      <Head>
        <title>Pros | TavvY</title>
        <meta name="description" content="Find trusted service professionals on TavvY" />
      </Head>

      <AppLayout>
        <div className="pros-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="pros-header">
            <h1 className="title" style={{ color: theme.text }}>
              🔧 TavvY Pros
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Find trusted service professionals
            </p>
          </header>

          {/* Are You a Pro? Banner */}
          <section className="pro-banner" style={{ backgroundColor: theme.primary }}>
            <div className="banner-content">
              <h2 className="banner-title">Are you a service professional?</h2>
              <p className="banner-text">
                Join TavvY Pros to connect with customers and grow your business
              </p>
              <Link href="/app/pros/register" className="banner-button">
                Join as a Pro
              </Link>
            </div>
          </section>

          {/* Service Categories */}
          <section className="categories-section">
            <h2 className="section-title" style={{ color: theme.text }}>
              Browse by Service
            </h2>
            <div className="categories-grid">
              {displayCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/app/pros/category/${category.slug}`}
                  className="category-card"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <span className="category-icon">{category.icon || '🔧'}</span>
                  <span className="category-name" style={{ color: theme.text }}>
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Providers */}
          {featuredProviders.length > 0 && (
            <section className="featured-section">
              <h2 className="section-title" style={{ color: theme.text }}>
                Featured Pros
              </h2>
              <div className="providers-grid">
                {featuredProviders.map((provider) => (
                  <Link
                    key={provider.id}
                    href={`/app/pros/provider/${provider.slug || provider.id}`}
                    className="provider-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="provider-image-container">
                      {provider.profile_image_url ? (
                        <img 
                          src={provider.profile_image_url} 
                          alt={provider.business_name}
                          className="provider-image"
                        />
                      ) : (
                        <div 
                          className="provider-placeholder"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {provider.business_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="provider-info">
                      <h3 className="provider-name" style={{ color: theme.text }}>
                        {provider.business_name}
                      </h3>
                      {provider.category_name && (
                        <span className="provider-category" style={{ color: theme.textSecondary }}>
                          {provider.category_name}
                        </span>
                      )}
                      {provider.rating && (
                        <div className="provider-rating">
                          <span>⭐ {provider.rating.toFixed(1)}</span>
                          {provider.review_count && (
                            <span style={{ color: theme.textTertiary }}>
                              ({provider.review_count})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* How It Works */}
          <section className="how-it-works">
            <h2 className="section-title" style={{ color: theme.text }}>
              How TavvY Pros Works
            </h2>
            <div className="steps-container">
              <div className="step" style={{ backgroundColor: theme.cardBackground }}>
                <span className="step-number" style={{ backgroundColor: theme.primary }}>1</span>
                <h3 style={{ color: theme.text }}>Describe Your Project</h3>
                <p style={{ color: theme.textSecondary }}>
                  Tell us what you need help with
                </p>
              </div>
              <div className="step" style={{ backgroundColor: theme.cardBackground }}>
                <span className="step-number" style={{ backgroundColor: theme.primary }}>2</span>
                <h3 style={{ color: theme.text }}>Get Matched</h3>
                <p style={{ color: theme.textSecondary }}>
                  We'll connect you with qualified pros
                </p>
              </div>
              <div className="step" style={{ backgroundColor: theme.cardBackground }}>
                <span className="step-number" style={{ backgroundColor: theme.primary }}>3</span>
                <h3 style={{ color: theme.text }}>Compare & Hire</h3>
                <p style={{ color: theme.textSecondary }}>
                  Review quotes and choose the best fit
                </p>
              </div>
            </div>
          </section>
        </div>

        <style jsx>{`
          .pros-screen {
            min-height: 100vh;
            padding-bottom: ${spacing.xxl}px;
          }
          
          .pros-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .subtitle {
            font-size: 14px;
            margin: 0;
          }
          
          .pro-banner {
            margin: 0 ${spacing.lg}px ${spacing.xxl}px;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .banner-content {
            padding: ${spacing.xl}px;
            text-align: center;
          }
          
          .banner-title {
            color: white;
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 8px;
          }
          
          .banner-text {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin: 0 0 16px;
          }
          
          .banner-button {
            display: inline-block;
            background: white;
            color: ${theme.primary};
            padding: 12px 24px;
            border-radius: ${borderRadius.md}px;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .banner-button:hover {
            transform: scale(1.02);
          }
          
          .categories-section,
          .featured-section,
          .how-it-works {
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.xxl}px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 ${spacing.md}px;
          }
          
          .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .category-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: ${spacing.lg}px ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .category-card:hover {
            transform: translateY(-2px);
          }
          
          .category-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
          
          .category-name {
            font-size: 13px;
            font-weight: 500;
            text-align: center;
          }
          
          .providers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .provider-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .provider-card:hover {
            transform: translateY(-2px);
          }
          
          .provider-image-container {
            height: 100px;
            overflow: hidden;
          }
          
          .provider-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .provider-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: 700;
          }
          
          .provider-info {
            padding: ${spacing.md}px;
          }
          
          .provider-name {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .provider-category {
            font-size: 12px;
            display: block;
            margin-bottom: 4px;
          }
          
          .provider-rating {
            font-size: 12px;
            display: flex;
            gap: 4px;
          }
          
          .steps-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .step {
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            text-align: center;
          }
          
          .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: white;
            font-weight: 700;
            margin-bottom: 12px;
          }
          
          .step h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px;
          }
          
          .step p {
            font-size: 14px;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
