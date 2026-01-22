/**
 * Pro Provider Profile Screen
 * View details of a service professional
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import AppLayout from '../../../../components/AppLayout';
import { supabase } from '../../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../../constants/Colors';
import { FiArrowLeft, FiStar, FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, FiCheck, FiShare2 } from 'react-icons/fi';

interface Provider {
  id: string;
  business_name: string;
  slug?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  description?: string;
  location?: string;
  address?: string;
  rating?: number;
  review_count?: number;
  phone?: string;
  email?: string;
  website?: string;
  is_verified?: boolean;
  services?: string[];
  hours?: Record<string, string>;
  years_in_business?: number;
  license_number?: string;
  insurance_verified?: boolean;
}

interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { id } = router.query;
  const { theme } = useThemeContext();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews'>('about');

  useEffect(() => {
    if (id) {
      fetchProviderData();
    }
  }, [id]);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from('pros_providers')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!providerError && providerData) {
        setProvider(providerData);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('pros_reviews')
        .select('*')
        .eq('provider_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!reviewsError) {
        setReviews(reviewsData || []);
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && provider) {
      try {
        await navigator.share({
          title: provider.business_name,
          text: `Check out ${provider.business_name} on TavvY Pros`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  if (loading) {
    return (
      <AppLayout hideTabBar>
        <div className="loading-screen" style={{ backgroundColor: theme.background }}>
          <div className="loading-spinner" />
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid ${theme.surface};
              border-top-color: ${theme.primary};
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  if (!provider) {
    return (
      <AppLayout hideTabBar>
        <div className="error-screen" style={{ backgroundColor: theme.background }}>
          <span>🔧</span>
          <h1 style={{ color: theme.text }}>Provider not found</h1>
          <button onClick={() => router.push('/app/pros')} style={{ color: theme.primary }}>
            Back to Pros
          </button>
          <style jsx>{`
            .error-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              text-align: center;
            }
            span { font-size: 64px; margin-bottom: 16px; }
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{provider.business_name} | TavvY Pros</title>
        <meta name="description" content={provider.description || `${provider.business_name} on TavvY Pros`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="provider-profile" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="profile-header">
            <img 
              src={provider.cover_image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'}
              alt={provider.business_name}
              className="cover-image"
            />
            <div className="header-overlay">
              <div className="header-actions">
                <button className="action-btn" onClick={() => router.back()}>
                  <FiArrowLeft size={24} color="white" />
                </button>
                <button className="action-btn" onClick={handleShare}>
                  <FiShare2 size={20} color="white" />
                </button>
              </div>
            </div>
          </header>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-photo">
              {provider.profile_image_url ? (
                <img src={provider.profile_image_url} alt={provider.business_name} />
              ) : (
                <div className="photo-placeholder" style={{ backgroundColor: theme.primary }}>
                  {provider.business_name.charAt(0)}
                </div>
              )}
              {provider.is_verified && (
                <span className="verified-badge">
                  <FiCheck size={14} />
                </span>
              )}
            </div>

            <h1 style={{ color: theme.text }}>{provider.business_name}</h1>
            
            {provider.location && (
              <p className="location" style={{ color: theme.textSecondary }}>
                <FiMapPin size={14} /> {provider.location}
              </p>
            )}

            {provider.rating && (
              <div className="rating-row">
                <FiStar size={18} color="#F59E0B" fill="#F59E0B" />
                <span className="rating-value" style={{ color: theme.text }}>{provider.rating.toFixed(1)}</span>
                <span style={{ color: theme.textTertiary }}>({provider.review_count || 0} reviews)</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              {provider.phone && (
                <a href={`tel:${provider.phone}`} className="quick-action" style={{ backgroundColor: theme.surface }}>
                  <FiPhone size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Call</span>
                </a>
              )}
              {provider.email && (
                <a href={`mailto:${provider.email}`} className="quick-action" style={{ backgroundColor: theme.surface }}>
                  <FiMail size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Email</span>
                </a>
              )}
              {provider.website && (
                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="quick-action" style={{ backgroundColor: theme.surface }}>
                  <FiGlobe size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Website</span>
                </a>
              )}
            </div>

            {/* Get Quote Button */}
            <Link href={`/app/pros/request?provider=${provider.id}`} className="quote-button" style={{ backgroundColor: theme.primary }}>
              Request a Quote
            </Link>
          </div>

          {/* Tabs */}
          <div className="tabs-container" style={{ borderColor: theme.border }}>
            {(['about', 'services', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  color: activeTab === tab ? theme.primary : theme.textSecondary,
                  borderColor: activeTab === tab ? theme.primary : 'transparent',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'about' && (
              <div className="about-section">
                {provider.description && (
                  <div className="info-block">
                    <h3 style={{ color: theme.text }}>About</h3>
                    <p style={{ color: theme.textSecondary }}>{provider.description}</p>
                  </div>
                )}

                <div className="info-block">
                  <h3 style={{ color: theme.text }}>Business Info</h3>
                  <div className="info-list">
                    {provider.years_in_business && (
                      <div className="info-item" style={{ backgroundColor: theme.surface }}>
                        <span className="info-label" style={{ color: theme.textSecondary }}>Years in Business</span>
                        <span className="info-value" style={{ color: theme.text }}>{provider.years_in_business}</span>
                      </div>
                    )}
                    {provider.license_number && (
                      <div className="info-item" style={{ backgroundColor: theme.surface }}>
                        <span className="info-label" style={{ color: theme.textSecondary }}>License #</span>
                        <span className="info-value" style={{ color: theme.text }}>{provider.license_number}</span>
                      </div>
                    )}
                    {provider.insurance_verified && (
                      <div className="info-item" style={{ backgroundColor: theme.surface }}>
                        <span className="info-label" style={{ color: theme.textSecondary }}>Insurance</span>
                        <span className="info-value verified" style={{ color: '#10B981' }}>
                          <FiCheck size={14} /> Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {provider.address && (
                  <div className="info-block">
                    <h3 style={{ color: theme.text }}>Location</h3>
                    <p style={{ color: theme.textSecondary }}>{provider.address}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="services-section">
                {provider.services && provider.services.length > 0 ? (
                  <div className="services-list">
                    {provider.services.map((service, index) => (
                      <div key={index} className="service-item" style={{ backgroundColor: theme.surface }}>
                        <FiCheck size={16} color="#10B981" />
                        <span style={{ color: theme.text }}>{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '40px' }}>
                    No services listed yet
                  </p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-section">
                {reviews.length > 0 ? (
                  <div className="reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-card" style={{ backgroundColor: theme.surface }}>
                        <div className="review-header">
                          <span className="reviewer-name" style={{ color: theme.text }}>{review.author_name}</span>
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <FiStar 
                                key={i} 
                                size={14} 
                                color="#F59E0B" 
                                fill={i < review.rating ? '#F59E0B' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="review-text" style={{ color: theme.textSecondary }}>{review.text}</p>
                        <span className="review-date" style={{ color: theme.textTertiary }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '40px' }}>
                    No reviews yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .provider-profile {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .profile-header {
            position: relative;
            height: 180px;
          }
          
          .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .header-actions {
            display: flex;
            justify-content: space-between;
          }
          
          .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .profile-info {
            padding: ${spacing.lg}px;
            text-align: center;
            margin-top: -50px;
          }
          
          .profile-photo {
            position: relative;
            width: 100px;
            height: 100px;
            margin: 0 auto ${spacing.md}px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid ${theme.background};
          }
          
          .profile-photo img {
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
            font-size: 36px;
            font-weight: 600;
          }
          
          .verified-badge {
            position: absolute;
            bottom: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            background: #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            border: 2px solid ${theme.background};
          }
          
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .location {
            font-size: 14px;
            margin: 0 0 ${spacing.sm}px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }
          
          .rating-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .rating-value {
            font-size: 18px;
            font-weight: 600;
          }
          
          .quick-actions {
            display: flex;
            justify-content: center;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .quick-action {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: ${spacing.md}px ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
          }
          
          .quick-action span {
            font-size: 12px;
            font-weight: 500;
          }
          
          .quote-button {
            display: block;
            width: 100%;
            padding: 16px;
            border-radius: ${borderRadius.lg}px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
          }
          
          .tabs-container {
            display: flex;
            border-bottom: 1px solid;
            margin: ${spacing.lg}px ${spacing.lg}px 0;
          }
          
          .tab {
            flex: 1;
            padding: ${spacing.md}px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .tab-content {
            padding: ${spacing.lg}px;
          }
          
          .info-block {
            margin-bottom: ${spacing.xl}px;
          }
          
          .info-block h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .info-block p {
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          
          .info-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.md}px;
          }
          
          .info-label {
            font-size: 14px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 500;
          }
          
          .info-value.verified {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .services-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .service-item {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.md}px;
          }
          
          .reviews-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .review-card {
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${spacing.sm}px;
          }
          
          .reviewer-name {
            font-weight: 600;
          }
          
          .review-rating {
            display: flex;
            gap: 2px;
          }
          
          .review-text {
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .review-date {
            font-size: 12px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
