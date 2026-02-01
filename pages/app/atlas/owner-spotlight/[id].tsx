/**
 * OWNER SPOTLIGHT SCREEN - Atlas v2.0
 * Pixel-perfect port from tavvy-mobile/screens/OwnerSpotlightScreen.tsx
 * 
 * Features:
 * - Profile-style page for business owner spotlights
 * - Owner profile with verified badge
 * - Posts grid
 * - About section
 * - Business info
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import AppLayout from '../../../../components/AppLayout';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  IoArrowBack, 
  IoShareOutline, 
  IoCheckmarkCircle,
  IoHeart,
  IoEye,
  IoLocationOutline,
  IoCallOutline,
  IoGlobeOutline
} from 'react-icons/io5';

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_BG = '#F0FDFA';

type TabType = 'posts' | 'about' | 'business';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  author_id?: string;
  author_name?: string;
  author_avatar_url?: string;
  primary_place_id?: string;
}

interface OwnerData {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  business_name?: string;
  is_verified?: boolean;
  post_count?: number;
  follower_count?: number;
  love_count?: number;
}

interface OwnerPost {
  id: string;
  title: string;
  slug: string;
  cover_image_url?: string;
  view_count?: number;
  love_count?: number;
}

interface PlaceData {
  id: string;
  name: string;
  category: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
}

// Placeholder images
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200';
const PLACEHOLDER_POST = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300';

export default function OwnerSpotlightScreen() {
  const router = useRouter();
  const { locale } = router;
  const { id } = router.query;
  const { theme, isDark } = useThemeContext();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  // Data states
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [posts, setPosts] = useState<OwnerPost[]>([]);
  const [place, setPlace] = useState<PlaceData | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      // Fetch the article
      const { data: articleData, error: articleError } = await supabase
        .from('atlas_articles')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!articleError && articleData) {
        setArticle(articleData);

        // Extract owner data from article
        const ownerData: OwnerData = {
          id: articleData.author_id || articleData.id,
          name: articleData.author_name || 'Business Owner',
          avatar_url: articleData.author_avatar_url,
          bio: articleData.excerpt || articleData.content?.substring(0, 200),
          business_name: articleData.title?.replace('Meet the Owner: ', '') || 'Local Business',
          is_verified: true,
          post_count: 12,
          follower_count: 2400,
          love_count: 156,
        };
        setOwner(ownerData);

        // Fetch owner's other posts
        if (articleData.author_id) {
          const { data: authorPosts } = await supabase
            .from('atlas_articles')
            .select('id, title, slug, cover_image_url, view_count, love_count')
            .eq('author_id', articleData.author_id)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(12);

          if (authorPosts) {
            setPosts(authorPosts);
          }
        }

        // Fetch linked place data if available
        if (articleData.primary_place_id) {
          const { data: placeData } = await supabase
            .from('fsq_places_raw')
            .select('id, name, fsq_category_labels, address, locality, region')
            .eq('id', articleData.primary_place_id)
            .single();

          if (placeData) {
            setPlace({
              id: placeData.id,
              name: placeData.name,
              category: placeData.fsq_category_labels?.[0] || 'Business',
              address: placeData.address,
              city: placeData.locality,
              state: placeData.region,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num?.toString() || '0';
  };

  const handleShare = async () => {
    if (navigator.share && owner) {
      try {
        await navigator.share({
          title: owner.name,
          text: `Check out ${owner.name} on TavvY`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const backgroundColor = theme.background;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const surfaceColor = theme.surface;

  if (loading || !owner) {
    return (
      <AppLayout hideTabBar>
        <div className="loading-screen" style={{ backgroundColor }}>
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
              border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
              border-top-color: ${TEAL_PRIMARY};
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{owner.name} | TavvY Atlas</title>
        <meta name="description" content={owner.bio || `${owner.name} on TavvY`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="spotlight-screen">
          {/* Header */}
          <header className="header">
            <button className="back-button" onClick={() => router.back()}>
              <IoArrowBack size={24} color={textColor} />
            </button>
            <h1 className="header-title">{owner.business_name}</h1>
            <button className="share-button" onClick={handleShare}>
              <IoShareOutline size={24} color={textColor} />
            </button>
          </header>

          {/* Profile Section */}
          <div className="profile-section">
            <div className="avatar-container">
              <img
                src={owner.avatar_url || PLACEHOLDER_AVATAR}
                alt={owner.name}
                className="avatar"
              />
              {owner.is_verified && (
                <div className="verified-badge">
                  <IoCheckmarkCircle size={24} color={TEAL_PRIMARY} />
                </div>
              )}
            </div>

            <h2 className="owner-name">{owner.name}</h2>
            <p className="business-name">{owner.business_name}</p>

            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat">
                <span className="stat-value">{owner.post_count || 0}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatNumber(owner.follower_count || 0)}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatNumber(owner.love_count || 0)}</span>
                <span className="stat-label">Loves</span>
              </div>
            </div>

            {/* Follow Button */}
            <button
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tab-bar">
            {(['posts', 'about', 'business'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <main className="content">
            {activeTab === 'posts' && (
              <div className="posts-tab">
                {posts.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📷</span>
                    <h3>No posts yet</h3>
                    <p>Posts will appear here</p>
                  </div>
                ) : (
                  <div className="posts-grid">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/app/article/${post.slug || post.id}`}
                        className="post-card"
                      >
                        <img
                          src={post.cover_image_url || PLACEHOLDER_POST}
                          alt={post.title}
                        />
                        <div className="post-overlay">
                          <div className="post-stats">
                            <span><IoEye size={14} /> {formatNumber(post.view_count || 0)}</span>
                            <span><IoHeart size={14} /> {formatNumber(post.love_count || 0)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="about-tab">
                <div className="about-section">
                  <h3>About</h3>
                  <p>{owner.bio || 'No bio available'}</p>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="business-tab">
                {place ? (
                  <div className="business-card">
                    <h3>{place.name}</h3>
                    <span className="business-category">{place.category}</span>
                    
                    {place.address && (
                      <div className="business-info-row">
                        <IoLocationOutline size={20} color={TEAL_PRIMARY} />
                        <span>{place.address}, {place.city}, {place.state}</span>
                      </div>
                    )}

                    {place.phone && (
                      <div className="business-info-row">
                        <IoCallOutline size={20} color={TEAL_PRIMARY} />
                        <span>{place.phone}</span>
                      </div>
                    )}

                    {place.website && (
                      <div className="business-info-row">
                        <IoGlobeOutline size={20} color={TEAL_PRIMARY} />
                        <a href={place.website} target="_blank" rel="noopener noreferrer">
                          {place.website}
                        </a>
                      </div>
                    )}

                    <Link href={`/place/${place.id}`} className="view-place-button">
                      View on TavvY
                    </Link>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">🏪</span>
                    <h3>Business info coming soon</h3>
                    <p>Details about this business will appear here</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          .spotlight-screen {
            min-height: 100vh;
            background-color: ${backgroundColor};
            padding-bottom: 40px;
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: 20px;
            background: ${backgroundColor};
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .back-button,
          .share-button {
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-title {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0;
          }

          /* Profile Section */
          .profile-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: ${isDark ? TEAL_PRIMARY + '15' : TEAL_BG};
          }

          .avatar-container {
            position: relative;
            margin-bottom: 16px;
          }

          .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid ${TEAL_PRIMARY};
          }

          .verified-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            background: white;
            border-radius: 50%;
            padding: 2px;
          }

          .owner-name {
            font-size: 24px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 4px;
          }

          .business-name {
            font-size: 15px;
            color: ${TEAL_PRIMARY};
            margin: 0 0 20px;
            font-weight: 500;
          }

          /* Stats Row */
          .stats-row {
            display: flex;
            gap: 40px;
            margin-bottom: 20px;
          }

          .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
          }

          .stat-label {
            font-size: 13px;
            color: ${secondaryTextColor};
          }

          /* Follow Button */
          .follow-button {
            padding: 12px 48px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            background: ${TEAL_PRIMARY};
            color: white;
            border: 2px solid ${TEAL_PRIMARY};
          }

          .follow-button.following {
            background: transparent;
            color: ${TEAL_PRIMARY};
          }

          .follow-button:hover {
            opacity: 0.9;
          }

          /* Tab Bar */
          .tab-bar {
            display: flex;
            background: ${surfaceColor};
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
          }

          .tab-button {
            flex: 1;
            padding: 16px;
            background: none;
            border: none;
            font-size: 14px;
            font-weight: 600;
            color: ${secondaryTextColor};
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }

          .tab-button.active {
            color: ${TEAL_PRIMARY};
            border-bottom-color: ${TEAL_PRIMARY};
          }

          /* Content */
          .content {
            padding: 20px;
          }

          /* Posts Grid */
          .posts-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }

          .post-card {
            position: relative;
            aspect-ratio: 1;
            overflow: hidden;
          }

          .post-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.2s;
          }

          .post-card:hover img {
            transform: scale(1.05);
          }

          .post-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .post-card:hover .post-overlay {
            opacity: 1;
          }

          .post-stats {
            display: flex;
            gap: 16px;
            color: white;
            font-size: 14px;
            font-weight: 600;
          }

          .post-stats span {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          /* About Tab */
          .about-section h3 {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 12px;
          }

          .about-section p {
            font-size: 15px;
            color: ${secondaryTextColor};
            line-height: 1.6;
            margin: 0;
          }

          /* Business Tab */
          .business-card {
            background: ${surfaceColor};
            border-radius: 16px;
            padding: 20px;
          }

          .business-card h3 {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 4px;
          }

          .business-category {
            display: inline-block;
            font-size: 13px;
            color: ${TEAL_PRIMARY};
            margin-bottom: 16px;
          }

          .business-info-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'};
          }

          .business-info-row span,
          .business-info-row a {
            font-size: 14px;
            color: ${textColor};
          }

          .business-info-row a {
            color: ${TEAL_PRIMARY};
            text-decoration: none;
          }

          .view-place-button {
            display: block;
            text-align: center;
            padding: 14px;
            margin-top: 16px;
            background: ${TEAL_PRIMARY};
            color: white;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            transition: opacity 0.2s;
          }

          .view-place-button:hover {
            opacity: 0.9;
          }

          /* Empty State */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 20px;
            text-align: center;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-state h3 {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 8px;
          }

          .empty-state p {
            font-size: 14px;
            color: ${secondaryTextColor};
            margin: 0;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .posts-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
