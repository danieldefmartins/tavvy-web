/**
 * Apps Screen - Tools & shortcuts
 * Pixel-perfect match to iOS Tavvy V2 Apps Screen
 * 
 * Features:
 * - Profile icon (top right) → navigates to login
 * - Search bar
 * - Featured section (horizontal scroll)
 * - All Apps grid
 * - Appearance toggle (bottom)
 * - Dark/Light theme support
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { 
  FiSearch, FiUser, FiSun, FiMoon
} from 'react-icons/fi';
import { 
  IoConstruct, IoCar, IoPlanet, IoTrain, IoWallet, 
  IoBusinessOutline, IoHeart, IoPersonOutline, IoAddCircle,
  IoHome, IoSparkles, IoBook, IoSettings
} from 'react-icons/io5';

// Featured apps (large cards, horizontal scroll)
const FEATURED_APPS = [
  {
    id: 'pros',
    name: 'Pros',
    icon: IoConstruct,
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    href: '/app/pros',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: IoBook,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    href: '/app/atlas',
  },
  {
    id: 'ecard',
    name: 'eCard',
    icon: IoHeart,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    href: '/app/ecard',
  },
];

// All apps grid
const ALL_APPS = [
  {
    id: 'universes',
    name: 'Universes',
    icon: IoPlanet,
    color: '#14B8A6',
    href: '/app/explore',
  },
  {
    id: 'onthego',
    name: 'On The Go',
    icon: IoCar,
    color: '#10B981',
    href: '/app/onthego',
  },
  {
    id: 'rides',
    name: 'Rides',
    icon: IoTrain,
    color: '#EF4444',
    href: '/app/rides',
  },
  {
    id: 'rv-camping',
    name: 'RV & Cam...',
    icon: IoCar,
    color: '#F97316',
    href: '/app/rv-camping',
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: IoHeart,
    color: '#EF4444',
    href: '/app/messages',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: IoWallet,
    color: '#8B5CF6',
    href: '/app/wallet',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: IoBusinessOutline,
    color: '#3B82F6',
    href: '/app/cities',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: IoHeart,
    color: '#EC4899',
    href: '/app/saved',
  },
  {
    id: 'account',
    name: 'Account',
    icon: IoPersonOutline,
    color: '#94A3B8',
    href: '/app/profile',
  },
  {
    id: 'create',
    name: 'Create',
    icon: IoAddCircle,
    color: '#10B981',
    href: '/app/create',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: IoHome,
    color: '#14B8A6',
    href: '/app/realtors',
  },
  {
    id: 'happening',
    name: 'Happening',
    icon: IoSparkles,
    color: '#EC4899',
    href: '/app/happening-now',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: IoSettings,
    color: '#64748B',
    href: '/app/settings',
  },
];

export default function AppsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = themeMode === 'dark';

  const handleProfileClick = () => {
    if (user) {
      router.push('/app/profile');
    } else {
      router.push('/app/login');
    }
  };

  const filteredApps = ALL_APPS.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Apps | TavvY</title>
        <meta name="description" content="TavvY apps and tools" />
      </Head>

      <AppLayout>
        <div className="apps-screen">
          {/* Header */}
          <header className="header">
            <h1>Apps</h1>
            <button className="profile-btn" onClick={handleProfileClick}>
              <div className="profile-icon">
                {user ? (
                  <span>{user.email?.charAt(0).toUpperCase()}</span>
                ) : (
                  <FiUser size={20} />
                )}
              </div>
            </button>
          </header>

          {/* Subtitle */}
          <p className="subtitle">Tools & shortcuts</p>

          {/* Search Bar */}
          <div className="search-container">
            <FiSearch className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Featured Section */}
          {!searchQuery && (
            <>
              <h2 className="section-title">Featured</h2>
              <div className="featured-scroll">
                {FEATURED_APPS.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Link key={app.id} href={app.href} className="featured-card">
                      <div className="featured-icon" style={{ background: app.gradient }}>
                        <Icon size={48} color="#fff" />
                      </div>
                      <span className="featured-name">{app.name}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* All Apps Section */}
          <h2 className="section-title">All Apps</h2>
          <div className="apps-grid">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link key={app.id} href={app.href} className="app-item">
                  <div className="app-icon" style={{ backgroundColor: app.color }}>
                    <Icon size={32} color="#fff" />
                  </div>
                  <span className="app-name">{app.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Appearance Section */}
          <h2 className="section-title appearance-title">Appearance</h2>
          <div className="appearance-toggle">
            <button
              className={`theme-btn ${!isDark ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <FiSun size={18} />
              <span>Light</span>
            </button>
            <button
              className={`theme-btn ${isDark ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <FiMoon size={18} />
              <span>Dark</span>
            </button>
          </div>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .apps-screen {
            min-height: 100vh;
            background-color: ${isDark ? '#000000' : '#FFFFFF'};
            padding: 0 20px;
            padding-top: max(20px, env(safe-area-inset-top));
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .header h1 {
            font-size: 34px;
            font-weight: 700;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            margin: 0;
          }

          .profile-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
          }

          .profile-icon {
            width: 44px;
            height: 44px;
            border-radius: 22px;
            background-color: ${isDark ? '#2A2A2A' : '#F5F5F5'};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            font-weight: 600;
            font-size: 16px;
          }

          /* Subtitle */
          .subtitle {
            font-size: 16px;
            color: ${isDark ? '#8B5CF6' : '#7C3AED'};
            margin: 0 0 20px 0;
          }

          /* Search Bar */
          .search-container {
            position: relative;
            margin-bottom: 28px;
          }

          .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: ${isDark ? '#666666' : '#999999'};
          }

          .search-input {
            width: 100%;
            padding: 14px 16px 14px 46px;
            background-color: ${isDark ? '#2A2A2A' : '#F5F5F5'};
            border: none;
            border-radius: 12px;
            font-size: 16px;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            outline: none;
          }

          .search-input::placeholder {
            color: ${isDark ? '#666666' : '#999999'};
          }

          /* Section Titles */
          .section-title {
            font-size: 22px;
            font-weight: 700;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            margin: 0 0 16px 0;
          }

          .appearance-title {
            margin-top: 40px;
          }

          /* Featured Section */
          .featured-scroll {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            margin-bottom: 32px;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .featured-scroll::-webkit-scrollbar {
            display: none;
          }

          .featured-card {
            flex-shrink: 0;
            width: 160px;
            text-decoration: none;
            cursor: pointer;
          }

          .featured-icon {
            width: 160px;
            height: 160px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            transition: transform 0.2s;
          }

          .featured-card:hover .featured-icon {
            transform: scale(1.02);
          }

          .featured-name {
            display: block;
            font-size: 17px;
            font-weight: 600;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            text-align: center;
          }

          /* All Apps Grid */
          .apps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 16px;
            margin-bottom: 32px;
          }

          .app-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            cursor: pointer;
          }

          .app-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            transition: transform 0.2s;
          }

          .app-item:hover .app-icon {
            transform: scale(1.05);
          }

          .app-name {
            font-size: 12px;
            font-weight: 500;
            color: ${isDark ? '#CCCCCC' : '#666666'};
            text-align: center;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Appearance Toggle */
          .appearance-toggle {
            display: flex;
            gap: 12px;
            margin-bottom: 32px;
          }

          .theme-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            background-color: ${isDark ? '#2A2A2A' : '#F5F5F5'};
            border: none;
            border-radius: 16px;
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#CCCCCC' : '#666666'};
            cursor: pointer;
            transition: all 0.2s;
          }

          .theme-btn.active {
            background-color: ${isDark ? '#3B82F6' : '#3B82F6'};
            color: #FFFFFF;
          }

          .theme-btn:hover:not(.active) {
            background-color: ${isDark ? '#333333' : '#EEEEEE'};
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 40px;
          }

          /* Responsive */
          @media (max-width: 640px) {
            .apps-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 16px 12px;
            }

            .app-icon {
              width: 56px;
              height: 56px;
            }

            .featured-card {
              width: 140px;
            }

            .featured-icon {
              width: 140px;
              height: 140px;
            }
          }

          @media (min-width: 768px) {
            .apps-screen {
              max-width: 600px;
              margin: 0 auto;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
