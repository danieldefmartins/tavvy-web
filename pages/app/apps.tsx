/**
 * Apps Screen - Tools & shortcuts dashboard
 * Pixel-perfect port from tavvy-mobile/screens/AppsScreen.tsx
 * 
 * Features:
 * - Navy header with Tavvy logo
 * - Light/Dark mode toggle
 * - Personal Login / Pro Login buttons
 * - App icon grid with colored backgrounds
 * - "More tools coming soon" footer
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
  FiPlus, FiSettings, FiLogOut, FiLogIn, FiHelpCircle,
  FiBriefcase, FiMenu
} from 'react-icons/fi';
import { 
  IoConstruct, IoHome, IoBusinessOutline, IoBook, IoCar,
  IoPlanet, IoTrain, IoLeaf, IoSparkles, IoWallet, IoFlash,
  IoHeart, IoPersonOutline, IoAddCircle
} from 'react-icons/io5';

// Theme colors
const ACCENT = '#0F1233';
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#0F172A';

// App tiles configuration matching mobile app exactly
const APP_TILES = [
  // Row 1: Pros, Realtors, Cities
  {
    id: 'pros',
    name: 'Pros',
    icon: IoConstruct,
    color: '#3B82F6',
    href: '/app/pros',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: IoHome,
    color: '#10B981',
    href: '/app/realtors',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: IoBusinessOutline,
    color: '#60A5FA',
    href: '/app/cities',
  },
  // Row 2: Atlas, RV & Camping, Universes
  {
    id: 'atlas',
    name: 'Atlas',
    icon: IoBook,
    color: '#818CF8',
    href: '/app/atlas',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: IoCar,
    color: '#F97316',
    href: '/app/rv-camping',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: IoPlanet,
    color: '#14B8A6',
    href: '/app/explore',
  },
  // Row 3: Rides, Experiences, Happening Now
  {
    id: 'rides',
    name: 'Rides',
    icon: IoTrain,
    color: '#EF4444',
    href: '/app/rides',
  },
  {
    id: 'experiences',
    name: 'Experiences',
    icon: IoLeaf,
    color: '#A78BFA',
    href: '/app/experiences',
  },
  {
    id: 'happening',
    name: 'Happening Now',
    icon: IoSparkles,
    color: '#EC4899',
    href: '/app/happening-now',
  },
  // Row 4: Wallet, Quick Finds, Saved
  {
    id: 'wallet',
    name: 'Wallet',
    icon: IoWallet,
    color: '#818CF8',
    href: '/app/wallet',
  },
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: IoFlash,
    color: '#FBBF24',
    href: '/app/quick-finds',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: IoHeart,
    color: '#FB7185',
    href: '/app/saved',
    requiresAuth: true,
  },
  // Row 5: Account, (empty), Create
  {
    id: 'account',
    name: 'Account',
    icon: IoPersonOutline,
    color: '#94A3B8',
    href: '/app/profile',
    requiresAuth: true,
  },
  {
    id: 'create',
    name: 'Create',
    icon: IoAddCircle,
    color: '#10B981',
    href: '/app/create',
    requiresAuth: true,
  },
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

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  return (
    <>
      <Head>
        <title>Apps | TavvY</title>
        <meta name="description" content="TavvY apps and tools" />
      </Head>

      <AppLayout>
        <div className="apps-screen">
          {/* Navy Header */}
          <header className="nav-header">
            <div className="nav-content">
              <img 
                src="/brand/tavvy-logo-white.png" 
                alt="Tavvy" 
                className="nav-logo"
              />
              <button className="menu-btn">
                <FiMenu size={24} color="#fff" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            {/* Theme Toggle */}
            <div className="theme-toggle-wrap">
              <div className="theme-toggle">
                <button
                  className={`theme-btn ${!isDark ? 'active' : ''}`}
                  onClick={() => setThemeMode('light')}
                >
                  Light
                </button>
                <button
                  className={`theme-btn ${isDark ? 'active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Apps Title */}
            <div className="apps-header">
              <h1>Apps</h1>
              <p>Tools & shortcuts</p>
            </div>

            {/* Login Buttons */}
            <div className="login-buttons">
              {user ? (
                <div className="user-info-row">
                  <div className="user-avatar">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.user_metadata?.display_name || user.email?.split('@')[0]}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <button className="logout-btn" onClick={handleSignOut}>
                    <FiLogOut size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/app/login" className="login-btn personal">
                    <FiUser size={18} />
                    <span>Personal Login</span>
                  </Link>
                  <Link href="/app/pros/login" className="login-btn pro">
                    <FiBriefcase size={18} />
                    <span>Pro Login</span>
                  </Link>
                </>
              )}
            </div>

            {/* App Tiles Grid */}
            <div className="tiles-grid">
              {APP_TILES.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.id}
                    className="app-tile"
                    onClick={() => handleTilePress(tile)}
                  >
                    <div 
                      className="tile-icon"
                      style={{ backgroundColor: tile.color }}
                    >
                      <Icon size={28} color="#fff" />
                    </div>
                    <span className="tile-name">{tile.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Coming Soon */}
            <p className="coming-soon">More tools coming soon</p>
          </main>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .apps-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          /* Navy Header */
          .nav-header {
            background-color: ${ACCENT};
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .nav-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .nav-logo {
            height: 32px;
            width: auto;
          }

          .menu-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          /* Main Content */
          .main-content {
            padding: 0 20px;
          }

          /* Theme Toggle */
          .theme-toggle-wrap {
            display: flex;
            justify-content: center;
            padding: 16px 0;
          }

          .theme-toggle {
            display: flex;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.12)'};
            border-radius: 12px;
            padding: 4px;
          }

          .theme-btn {
            padding: 10px 24px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#6B6B6B'};
            cursor: pointer;
            transition: all 0.2s;
          }

          .theme-btn.active {
            background: ${ACCENT};
            color: #fff;
          }

          /* Apps Header */
          .apps-header {
            margin-bottom: 20px;
          }

          .apps-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 4px;
          }

          .apps-header p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
            margin: 0;
          }

          /* Login Buttons */
          .login-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }

          .login-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
          }

          .login-btn.personal {
            background: transparent;
            border: 2px solid ${isDark ? 'rgba(16, 185, 129, 0.5)' : '#10B981'};
            color: #10B981;
          }

          .login-btn.pro {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#ddd'};
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          .login-btn:hover {
            transform: scale(1.02);
          }

          /* User Info Row */
          .user-info-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 12px;
          }

          .user-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            font-weight: 600;
          }

          .user-details {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .user-name {
            font-size: 15px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
          }

          .user-email {
            font-size: 13px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#666'};
          }

          .logout-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#999'};
          }

          /* Tiles Grid */
          .tiles-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          .app-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
          }

          .tile-icon {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          }

          .app-tile:hover .tile-icon {
            transform: scale(1.05);
          }

          .tile-name {
            font-size: 12px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            text-align: center;
          }

          /* Coming Soon */
          .coming-soon {
            text-align: center;
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
            margin: 32px 0;
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (min-width: 768px) {
            .tiles-grid {
              grid-template-columns: repeat(4, 1fr);
            }

            .tile-icon {
              width: 80px;
              height: 80px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
