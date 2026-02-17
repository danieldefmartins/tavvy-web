/**
 * User Profile Screen
 * View and edit user profile
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiEdit2, FiMapPin, FiCalendar, FiStar, FiBookmark, FiSettings, FiLogOut } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface UserProfile {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at?: string;
  review_count?: number;
  saved_count?: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const { user, signOut } = useAuth();
  const { t } = useTranslation('common');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'saved'>('reviews');

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Create profile from user data
        setProfile({
          user_id: user?.id || '',
          display_name: user?.user_metadata?.full_name || user?.user_metadata?.display_name,
          avatar_url: user?.user_metadata?.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/app', undefined, { locale });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="auth-prompt" style={{ backgroundColor: theme.background }}>
          <span>👤</span>
          <h1 style={{ color: theme.text }}>Sign in to view your profile</h1>
          <p style={{ color: theme.textSecondary }}>
            Create an account to save places, leave reviews, and more
          </p>
          <Link href="/app/login" locale={locale} className="sign-in-button" style={{ backgroundColor: theme.primary }}>
            Sign In
          </Link>
          <Link href="/app/signup" locale={locale} className="sign-up-link" style={{ color: theme.primary }}>
            Don't have an account? Sign Up
          </Link>
          <style jsx>{`
            .auth-prompt {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
              text-align: center;
            }
            span { font-size: 64px; margin-bottom: 24px; }
            h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px; }
            p { font-size: 16px; margin: 0 0 32px; max-width: 300px; }
            .sign-in-button {
              display: block;
              padding: 16px 48px;
              border-radius: ${borderRadius.lg}px;
              color: white;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
              margin-bottom: 16px;
            }
            .sign-up-link {
              font-size: 14px;
              text-decoration: none;
            }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | TavvY</title>
        <meta name="description" content="Your TavvY profile" />
      </Head>

      <AppLayout requiredAccess="authenticated">
        <div className="profile-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="profile-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Profile</h1>
            <Link href="/app/settings" locale={locale} className="settings-button">
              <FiSettings size={24} color={theme.text} />
            </Link>
          </header>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="avatar-container">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || 'User'} className="avatar" />
              ) : (
                <div className="avatar-placeholder" style={{ backgroundColor: theme.primary }}>
                  {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button className="edit-avatar" style={{ backgroundColor: theme.surface }}>
                <FiEdit2 size={16} color={theme.text} />
              </button>
            </div>

            <h2 style={{ color: theme.text }}>
              {profile?.display_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'TavvY User'}
            </h2>
            
            {profile?.username && (
              <p className="username" style={{ color: theme.textSecondary }}>@{profile.username}</p>
            )}

            {profile?.bio && (
              <p className="bio" style={{ color: theme.textSecondary }}>{profile.bio}</p>
            )}

            <div className="meta-row">
              {(profile?.city || profile?.state) && (
                <span style={{ color: theme.textTertiary }}>
                  <FiMapPin size={14} /> {[profile.city, profile.state].filter(Boolean).join(', ')}
                </span>
              )}
              <span style={{ color: theme.textTertiary }}>
                <FiCalendar size={14} /> Joined {formatDate(profile?.created_at || user?.created_at)}
              </span>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat" style={{ backgroundColor: theme.surface }}>
                <FiStar size={20} color={theme.primary} />
                <span className="stat-value" style={{ color: theme.text }}>{profile?.review_count || 0}</span>
                <span className="stat-label" style={{ color: theme.textSecondary }}>Reviews</span>
              </div>
              <div className="stat" style={{ backgroundColor: theme.surface }}>
                <FiBookmark size={20} color={theme.primary} />
                <span className="stat-value" style={{ color: theme.text }}>{profile?.saved_count || 0}</span>
                <span className="stat-label" style={{ color: theme.textSecondary }}>Saved</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link href="/app/profile/edit" locale={locale} className="edit-button" style={{ borderColor: theme.border, color: theme.text }}>
              <FiEdit2 size={16} /> Edit Profile
            </Link>
          </div>

          {/* Tabs */}
          <div className="tabs-container" style={{ borderColor: theme.border }}>
            <button
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
              style={{
                color: activeTab === 'reviews' ? theme.primary : theme.textSecondary,
                borderColor: activeTab === 'reviews' ? theme.primary : 'transparent',
              }}
            >
              <FiStar size={18} /> My Reviews
            </button>
            <button
              className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
              style={{
                color: activeTab === 'saved' ? theme.primary : theme.textSecondary,
                borderColor: activeTab === 'saved' ? theme.primary : 'transparent',
              }}
            >
              <FiBookmark size={18} /> Saved
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'reviews' ? (
              <div className="empty-state">
                <FiStar size={48} color={theme.textTertiary} />
                <h3 style={{ color: theme.text }}>No reviews yet</h3>
                <p style={{ color: theme.textSecondary }}>
                  Start exploring and leave your first review!
                </p>
                <Link href="/app" locale={locale} className="explore-link" style={{ color: theme.primary }}>
                  Explore Places
                </Link>
              </div>
            ) : (
              <div className="empty-state">
                <FiBookmark size={48} color={theme.textTertiary} />
                <h3 style={{ color: theme.text }}>No saved places</h3>
                <p style={{ color: theme.textSecondary }}>
                  Save places you want to visit later
                </p>
                <Link href="/app" locale={locale} className="explore-link" style={{ color: theme.primary }}>
                  Explore Places
                </Link>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="sign-out-section">
            <button className="sign-out-button" onClick={handleSignOut} style={{ color: '#EF4444' }}>
              <FiLogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        <style jsx>{`
          .profile-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .profile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button,
          .settings-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
          }
          
          .profile-header h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .profile-info {
            padding: 0 ${spacing.lg}px;
            text-align: center;
          }
          
          .avatar-container {
            position: relative;
            width: 100px;
            height: 100px;
            margin: 0 auto ${spacing.md}px;
          }
          
          .avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .avatar-placeholder {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
            font-weight: 600;
          }
          
          .edit-avatar {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .username {
            font-size: 14px;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .bio {
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 ${spacing.md}px;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .meta-row {
            display: flex;
            justify-content: center;
            gap: ${spacing.lg}px;
            margin-bottom: ${spacing.lg}px;
            font-size: 13px;
          }
          
          .meta-row span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .stats-row {
            display: flex;
            justify-content: center;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: ${spacing.md}px ${spacing.xl}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .stat-value {
            font-size: 20px;
            font-weight: 700;
          }
          
          .stat-label {
            font-size: 12px;
          }
          
          .edit-button {
            display: inline-flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 10px 24px;
            border-radius: ${borderRadius.md}px;
            border: 1px solid;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            margin-bottom: ${spacing.lg}px;
          }
          
          .tabs-container {
            display: flex;
            border-bottom: 1px solid;
            margin: 0 ${spacing.lg}px;
          }
          
          .tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.md}px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .tab-content {
            padding: ${spacing.xl}px ${spacing.lg}px;
          }
          
          .empty-state {
            text-align: center;
            padding: 40px 0;
          }
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: ${spacing.md}px 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0 0 ${spacing.md}px;
          }
          
          .explore-link {
            font-weight: 600;
            text-decoration: none;
          }
          
          .sign-out-section {
            padding: ${spacing.xl}px ${spacing.lg}px;
            border-top: 1px solid ${theme.border};
            margin-top: ${spacing.xl}px;
          }
          
          .sign-out-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            width: 100%;
            padding: ${spacing.md}px;
            background: none;
            border: none;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
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
