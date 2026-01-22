/**
 * Apps Screen - Tools & shortcuts dashboard
 * Pixel-perfect port from tavvy-mobile/screens/AppsScreen.tsx
 * 
 * Features:
 * - Large gradient tiles with white icons
 * - Correct app order: Pros, Realtors, Cities, Atlas, RV & Camping, Universes, Rides, Experiences, Happening Now, then others
 * - Dark/Light mode toggle
 * - User profile section
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { 
  FiTool, FiHome, FiMap, FiBook, FiSun, FiMoon, 
  FiGlobe, FiTruck, FiStar, FiZap, FiHeart, FiUser, 
  FiPlus, FiSettings, FiLogOut, FiLogIn, FiHelpCircle
} from 'react-icons/fi';

// App tiles configuration matching mobile app
const APP_TILES = [
  // Row 1: Pros, Realtors, Cities
  {
    id: 'pros',
    name: 'Pros',
    icon: FiTool,
    gradientColors: ['#3B82F6', '#1D4ED8'],
    href: '/app/pros',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: FiHome,
    gradientColors: ['#14B8A6', '#0D9488'],
    href: '/app/realtors',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: FiMap,
    gradientColors: ['#60A5FA', '#3B82F6'],
    href: '/app/cities',
  },
  // Row 2: Atlas, RV & Camping, Universes
  {
    id: 'atlas',
    name: 'Atlas',
    icon: FiBook,
    gradientColors: ['#818CF8', '#6366F1'],
    href: '/app/atlas',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: FiTruck,
    gradientColors: ['#FB923C', '#EA580C'],
    href: '/app/rv-camping',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: FiGlobe,
    gradientColors: ['#2DD4BF', '#14B8A6'],
    href: '/app/explore',
  },
  // Row 3: Rides, Experiences, Happening Now
  {
    id: 'rides',
    name: 'Rides',
    icon: FiTruck,
    gradientColors: ['#F87171', '#EF4444'],
    href: '/app/rides',
  },
  {
    id: 'experiences',
    name: 'Experiences',
    icon: FiStar,
    gradientColors: ['#A78BFA', '#8B5CF6'],
    href: '/app/experiences',
  },
  {
    id: 'happening',
    name: 'Happening Now',
    icon: FiZap,
    gradientColors: ['#F472B6', '#EC4899'],
    href: '/app/happening-now',
  },
  // Row 4+: Quick Finds, Saved, Account
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: FiZap,
    gradientColors: ['#FBBF24', '#F59E0B'],
    href: '/app/quick-finds',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: FiHeart,
    gradientColors: ['#FB7185', '#F43F5E'],
    href: '/app/saved',
    requiresAuth: true,
  },
  {
    id: 'account',
    name: 'Account',
    icon: FiUser,
    gradientColors: ['#94A3B8', '#64748B'],
    href: '/app/profile',
    requiresAuth: true,
  },
];

const settingsItems = [
  { id: 'settings', title: 'Settings', icon: FiSettings, href: '/app/settings' },
  { id: 'help', title: 'Help & Support', icon: FiHelpCircle, href: '/app/help' },
  { id: 'privacy', title: 'Privacy Policy', icon: FiBook, href: '/privacy' },
  { id: 'terms', title: 'Terms of Service', icon: FiBook, href: '/terms' },
];

export default function AppsScreen() {
  const router = useRouter();
  const { theme, isDark, themeMode, setThemeMode } = useThemeContext();
  const { user, signOut, loading: authLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleTilePress = (tile: typeof APP_TILES[0]) => {
    if (tile.requiresAuth && !user) {
      router.push('/app/login');
      return;
    }
    router.push(tile.href);
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/app');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Head>
        <title>Apps | TavvY</title>
        <meta name="description" content="TavvY apps and tools" />
      </Head>

      <AppLayout requiredAccess="authenticated">
        <div className="apps-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="apps-header">
            <h1 style={{ color: theme.text }}>Apps</h1>
            
            {/* Theme Toggle */}
            <button 
              className="theme-toggle"
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              style={{ backgroundColor: theme.surface }}
            >
              {isDark ? (
                <FiSun size={20} color={theme.text} />
              ) : (
                <FiMoon size={20} color={theme.text} />
              )}
            </button>
          </header>

          {/* User Section */}
          <section className="user-section">
            {user ? (
              <div className="user-card" style={{ backgroundColor: theme.cardBackground }}>
                <div className="user-avatar" style={{ backgroundColor: theme.primary }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <p className="user-name" style={{ color: theme.text }}>
                    {user.user_metadata?.display_name || user.email?.split('@')[0]}
                  </p>
                  <p className="user-email" style={{ color: theme.textSecondary }}>
                    {user.email}
                  </p>
                </div>
                <button 
                  className="sign-out-btn"
                  onClick={handleSignOut}
                  disabled={loggingOut}
                >
                  <FiLogOut size={20} color={theme.error} />
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  href="/app/login"
                  className="auth-btn primary"
                  style={{ backgroundColor: theme.primary }}
                >
                  <FiLogIn size={20} />
                  <span>Sign In</span>
                </Link>
                <Link 
                  href="/app/signup"
                  className="auth-btn secondary"
                  style={{ backgroundColor: theme.surface, color: theme.text }}
                >
                  <FiUser size={20} />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </section>

          {/* App Tiles Grid */}
          <section className="tiles-section">
            <div className="tiles-grid">
              {APP_TILES.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.id}
                    className="app-tile"
                    onClick={() => handleTilePress(tile)}
                    style={{
                      background: `linear-gradient(135deg, ${tile.gradientColors[0]}, ${tile.gradientColors[1]})`,
                    }}
                  >
                    <Icon size={32} color="white" />
                    <span className="tile-name">{tile.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Theme Options */}
          <section className="theme-section">
            <h3 className="section-title" style={{ color: theme.textSecondary }}>
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
                  {mode === 'light' && <FiSun size={16} />}
                  {mode === 'dark' && <FiMoon size={16} />}
                  {mode === 'system' && '📱'}
                  <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Settings Section */}
          <section className="settings-section">
            <h3 className="section-title" style={{ color: theme.textSecondary }}>
              Settings
            </h3>
            <div className="settings-list" style={{ backgroundColor: theme.cardBackground }}>
              {settingsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.id}
                    href={item.href} 
                    className="settings-item"
                    style={{ 
                      borderBottomColor: index < settingsItems.length - 1 ? theme.border : 'transparent',
                    }}
                  >
                    <Icon size={20} color={theme.text} />
                    <span style={{ color: theme.text }}>{item.title}</span>
                    <span className="arrow" style={{ color: theme.textTertiary }}>›</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Version Info */}
          <footer className="version-info">
            <p style={{ color: theme.textSecondary }}>TavvY Web App v1.0.0</p>
          </footer>
        </div>

        <style jsx>{`
          .apps-screen {
            min-height: 100vh;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: 100px;
          }
          
          .apps-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: ${spacing.xl}px;
          }
          
          .apps-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .theme-toggle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .theme-toggle:hover {
            transform: scale(1.05);
          }
          
          .user-section {
            margin-bottom: ${spacing.xl}px;
          }
          
          .user-card {
            display: flex;
            align-items: center;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            gap: ${spacing.md}px;
          }
          
          .user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: 600;
          }
          
          .user-info {
            flex: 1;
          }
          
          .user-name {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
          }
          
          .user-email {
            font-size: 14px;
            margin: 4px 0 0;
          }
          
          .sign-out-btn {
            background: none;
            border: none;
            padding: ${spacing.sm}px;
            cursor: pointer;
          }
          
          .auth-buttons {
            display: flex;
            gap: ${spacing.md}px;
          }
          
          .auth-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
          }
          
          .auth-btn:hover {
            transform: scale(1.02);
          }
          
          .auth-btn.primary {
            color: white;
          }
          
          .tiles-section {
            margin-bottom: ${spacing.xl}px;
          }
          
          .tiles-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: ${spacing.md}px;
          }
          
          .app-tile {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .app-tile:hover {
            transform: scale(1.03);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }
          
          .tile-name {
            color: white;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
          }
          
          .theme-section,
          .settings-section {
            margin-bottom: ${spacing.xl}px;
          }
          
          .section-title {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .theme-options {
            display: flex;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .theme-option {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
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
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            text-decoration: none;
            border-bottom-width: 1px;
            border-bottom-style: solid;
            transition: background-color 0.2s;
          }
          
          .settings-item:hover {
            background-color: ${theme.primaryLight};
          }
          
          .settings-item span {
            flex: 1;
          }
          
          .arrow {
            font-size: 20px;
          }
          
          .version-info {
            text-align: center;
            padding: ${spacing.xl}px;
          }
          
          .version-info p {
            font-size: 12px;
            margin: 0;
          }
          
          @media (max-width: 480px) {
            .tiles-grid {
              gap: ${spacing.sm}px;
            }
            
            .tile-name {
              font-size: 11px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
