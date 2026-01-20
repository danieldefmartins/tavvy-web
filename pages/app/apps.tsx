/**
 * Apps Screen - Menu and Profile
 * Ported from tavvy-mobile/screens/AppsScreen.tsx
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';

interface MenuTile {
  id: string;
  title: string;
  icon: string;
  href: string;
  requiresAuth?: boolean;
  description?: string;
}

const menuTiles: MenuTile[] = [
  { id: 'saved', title: 'Saved Places', icon: '❤️', href: '/app/saved', requiresAuth: true },
  { id: 'profile', title: 'My Profile', icon: '👤', href: '/app/profile', requiresAuth: true },
  { id: 'add-place', title: 'Add a Place', icon: '➕', href: '/app/add-place', requiresAuth: true },
  { id: 'cities', title: 'Rate Cities', icon: '🏙️', href: '/app/cities' },
  { id: 'rides', title: 'Rides', icon: '🚗', href: '/app/rides' },
  { id: 'rv-camping', title: 'RV & Camping', icon: '🏕️', href: '/app/rv-camping' },
  { id: 'realtors', title: 'Realtors', icon: '🏠', href: '/app/realtors' },
  { id: 'pro-dashboard', title: 'Pro Dashboard', icon: '📊', href: '/app/pros/dashboard', requiresAuth: true },
];

const settingsItems = [
  { id: 'settings', title: 'Settings', icon: '⚙️', href: '/app/settings' },
  { id: 'help', title: 'Help & Support', icon: '❓', href: '/app/help' },
  { id: 'guidelines', title: 'Community Guidelines', icon: '📋', href: '/app/guidelines' },
  { id: 'privacy', title: 'Privacy Policy', icon: '🔒', href: '/privacy' },
  { id: 'terms', title: 'Terms of Service', icon: '📄', href: '/terms' },
];

export default function AppsScreen() {
  const { theme, themeMode, setThemeMode } = useThemeContext();
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleTileClick = (tile: MenuTile) => {
    if (tile.requiresAuth && !user) {
      router.push('/app/login');
      return;
    }
    router.push(tile.href);
  };

  return (
    <>
      <Head>
        <title>Apps | TavvY</title>
        <meta name="description" content="TavvY Apps and Settings" />
      </Head>

      <AppLayout>
        <div className="apps-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="apps-header">
            <h1 className="title" style={{ color: theme.text }}>
              📱 Apps
            </h1>
          </header>

          {/* User Section */}
          <section className="user-section">
            {user ? (
              <div className="user-card" style={{ backgroundColor: theme.cardBackground }}>
                <div 
                  className="user-avatar"
                  style={{ backgroundColor: theme.primary }}
                >
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h2 className="user-name" style={{ color: theme.text }}>
                    {user.user_metadata?.display_name || user.email?.split('@')[0]}
                  </h2>
                  <p className="user-email" style={{ color: theme.textSecondary }}>
                    {user.email}
                  </p>
                </div>
                <Link href="/app/profile" className="edit-profile-link">
                  Edit
                </Link>
              </div>
            ) : (
              <div className="auth-card" style={{ backgroundColor: theme.cardBackground }}>
                <h2 style={{ color: theme.text }}>Welcome to TavvY</h2>
                <p style={{ color: theme.textSecondary }}>
                  Sign in to save places, leave reviews, and more
                </p>
                <div className="auth-buttons">
                  <Link href="/app/login" className="auth-button primary" style={{ backgroundColor: theme.primary }}>
                    Log In
                  </Link>
                  <Link href="/app/signup" className="auth-button secondary" style={{ borderColor: theme.primary, color: theme.primary }}>
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Menu Tiles Grid */}
          <section className="tiles-section">
            <div className="tiles-grid">
              {menuTiles.map((tile) => (
                <button
                  key={tile.id}
                  className="menu-tile"
                  style={{ backgroundColor: theme.cardBackground }}
                  onClick={() => handleTileClick(tile)}
                >
                  <span className="tile-icon">{tile.icon}</span>
                  <span className="tile-title" style={{ color: theme.text }}>
                    {tile.title}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Theme Toggle */}
          <section className="theme-section">
            <h3 className="section-title" style={{ color: theme.text }}>
              Appearance
            </h3>
            <div className="theme-options" style={{ backgroundColor: theme.cardBackground }}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                  onClick={() => setThemeMode(mode)}
                  style={{
                    backgroundColor: themeMode === mode ? theme.primary : 'transparent',
                    color: themeMode === mode ? '#FFFFFF' : theme.text,
                  }}
                >
                  {mode === 'light' && '☀️ '}
                  {mode === 'dark' && '🌙 '}
                  {mode === 'system' && '📱 '}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Settings List */}
          <section className="settings-section">
            <h3 className="section-title" style={{ color: theme.text }}>
              Settings & Support
            </h3>
            <div className="settings-list" style={{ backgroundColor: theme.cardBackground }}>
              {settingsItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="settings-item"
                  style={{ 
                    borderBottomColor: index < settingsItems.length - 1 ? theme.border : 'transparent',
                  }}
                >
                  <span className="settings-icon">{item.icon}</span>
                  <span className="settings-title" style={{ color: theme.text }}>
                    {item.title}
                  </span>
                  <span className="settings-arrow" style={{ color: theme.textTertiary }}>›</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Sign Out Button */}
          {user && (
            <section className="signout-section">
              <button
                className="signout-button"
                onClick={handleSignOut}
                disabled={loggingOut}
                style={{ 
                  backgroundColor: theme.cardBackground,
                  color: theme.error,
                }}
              >
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </section>
          )}

          {/* App Version */}
          <footer className="app-footer">
            <p style={{ color: theme.textTertiary }}>
              TavvY Web v1.0.0
            </p>
          </footer>
        </div>

        <style jsx>{`
          .apps-screen {
            min-height: 100vh;
            padding-bottom: ${spacing.xxl}px;
          }
          
          .apps-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .user-section {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
          }
          
          .user-card {
            display: flex;
            align-items: center;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .user-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: 700;
            margin-right: ${spacing.md}px;
          }
          
          .user-info {
            flex: 1;
          }
          
          .user-name {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .user-email {
            font-size: 14px;
            margin: 0;
          }
          
          .edit-profile-link {
            color: ${theme.primary};
            font-weight: 600;
            text-decoration: none;
          }
          
          .auth-card {
            padding: ${spacing.xl}px;
            border-radius: ${borderRadius.lg}px;
            text-align: center;
          }
          
          .auth-card h2 {
            font-size: 20px;
            margin: 0 0 8px;
          }
          
          .auth-card p {
            font-size: 14px;
            margin: 0 0 ${spacing.lg}px;
          }
          
          .auth-buttons {
            display: flex;
            gap: ${spacing.md}px;
            justify-content: center;
          }
          
          .auth-button {
            padding: 12px 24px;
            border-radius: ${borderRadius.md}px;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .auth-button:hover {
            transform: scale(1.02);
          }
          
          .auth-button.primary {
            color: white;
          }
          
          .auth-button.secondary {
            background: transparent;
            border-width: 2px;
            border-style: solid;
          }
          
          .tiles-section {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
          }
          
          .tiles-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: ${spacing.md}px;
          }
          
          @media (max-width: 600px) {
            .tiles-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          .menu-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: ${spacing.lg}px ${spacing.sm}px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .menu-tile:hover {
            transform: translateY(-2px);
          }
          
          .tile-icon {
            font-size: 28px;
            margin-bottom: 8px;
          }
          
          .tile-title {
            font-size: 12px;
            font-weight: 500;
            text-align: center;
          }
          
          .theme-section,
          .settings-section,
          .signout-section {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            margin: 0 0 ${spacing.sm}px;
            opacity: 0.7;
          }
          
          .theme-options {
            display: flex;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .theme-option {
            flex: 1;
            padding: 12px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .settings-list {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .settings-item {
            display: flex;
            align-items: center;
            padding: ${spacing.md}px ${spacing.lg}px;
            text-decoration: none;
            border-bottom-width: 1px;
            border-bottom-style: solid;
            transition: background-color 0.2s;
          }
          
          .settings-item:hover {
            background-color: ${theme.surface};
          }
          
          .settings-icon {
            font-size: 20px;
            margin-right: ${spacing.md}px;
          }
          
          .settings-title {
            flex: 1;
            font-size: 16px;
          }
          
          .settings-arrow {
            font-size: 20px;
          }
          
          .signout-button {
            width: 100%;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          
          .signout-button:hover {
            opacity: 0.9;
          }
          
          .signout-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .app-footer {
            text-align: center;
            padding: ${spacing.xl}px;
          }
          
          .app-footer p {
            font-size: 12px;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
