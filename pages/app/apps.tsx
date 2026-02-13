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
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
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
    nameKey: 'apps.pros',
    icon: IoConstruct,
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    href: '/app/pros',
  },
  {
    id: 'atlas',
    nameKey: 'apps.atlas',
    icon: IoBook,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    href: '/app/atlas',
  },
  {
    id: 'ecard',
    nameKey: 'apps.ecard',
    icon: IoHeart,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    href: '/app/ecard',
  },
];

// All apps grid
const ALL_APPS = [
  {
    id: 'universes',
    nameKey: 'apps.universes',
    icon: IoPlanet,
    color: '#14B8A6',
    href: '/app/explore',
  },
  {
    id: 'onthego',
    nameKey: 'apps.onTheGo',
    icon: IoCar,
    color: '#10B981',
    href: '/app/onthego',
  },
  {
    id: 'rides',
    nameKey: 'apps.rides',
    icon: IoTrain,
    color: '#EF4444',
    href: '/app/rides',
  },
  {
    id: 'rv-camping',
    nameKey: 'apps.rvCamping',
    icon: IoCar,
    color: '#F97316',
    href: '/app/rv-camping',
  },
  {
    id: 'messages',
    nameKey: 'apps.messages',
    icon: IoHeart,
    color: '#EF4444',
    href: '/app/messages',
  },
  {
    id: 'wallet',
    nameKey: 'apps.wallet',
    icon: IoWallet,
    color: '#8B5CF6',
    href: '/app/wallet',
  },
  {
    id: 'cities',
    nameKey: 'apps.cities',
    icon: IoBusinessOutline,
    color: '#3B82F6',
    href: '/app/cities',
  },
  {
    id: 'saved',
    nameKey: 'apps.saved',
    icon: IoHeart,
    color: '#EC4899',
    href: '/app/saved',
  },
  {
    id: 'account',
    nameKey: 'apps.account',
    icon: IoPersonOutline,
    color: '#94A3B8',
    href: '/app/profile',
  },
  {
    id: 'create',
    nameKey: 'apps.create',
    icon: IoAddCircle,
    color: '#10B981',
    href: '/app/create',
  },
  {
    id: 'realtors',
    nameKey: 'apps.realtors',
    icon: IoHome,
    color: '#14B8A6',
    href: '/app/realtors',
  },
  {
    id: 'happening',
    nameKey: 'apps.happening',
    icon: IoSparkles,
    color: '#EC4899',
    href: '/app/happening-now',
  },
  {
    id: 'settings',
    nameKey: 'apps.settingsApp',
    icon: IoSettings,
    color: '#64748B',
    href: '/app/settings',
  },
];

export default function AppsScreen() {
  const router = useRouter();
  const { locale } = router;
  const { themeMode, setThemeMode } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = themeMode === 'dark';

  const handleProfileClick = () => {
    if (user) {
      router.push('/app/profile', undefined, { locale });
    } else {
      router.push('/app/login', undefined, { locale });
    }
  };

  const filteredApps = ALL_APPS.filter(app =>
    t(app.nameKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>{t('navigation.apps')} | TavvY</title>
        <meta name="description" content="TavvY apps and tools" />
      </Head>

      <AppLayout>
        <div className="apps-screen">
          {/* Header */}
          <header className="header">
            <h1>{t('navigation.apps')}</h1>
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
          <p className="subtitle">{t('apps.subtitle')}</p>

          {/* Search Bar */}
          <div className="search-container">
            <FiSearch className="search-icon" size={18} />
            <input
              type="text"
              placeholder={t('apps.searchApps')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Featured Section */}
          {!searchQuery && (
            <>
              <h2 className="section-title">{t('apps.featured')}</h2>
              <div className="featured-scroll">
                {FEATURED_APPS.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Link key={app.id} href={app.href} className="featured-card" locale={locale}>
                      <div className="featured-icon" style={{ background: app.gradient }}>
                        <Icon size={48} color="#fff" />
                      </div>
                      <span className="featured-name">{t(app.nameKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* All Apps Section */}
          <h2 className="section-title">{t('apps.allApps')}</h2>
          <div className="apps-grid">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link key={app.id} href={app.href} className="app-item" locale={locale}>
                  <div className="app-icon" style={{ backgroundColor: app.color }}>
                    <Icon size={32} color="#fff" />
                  </div>
                  <span className="app-name">{t(app.nameKey)}</span>
                </Link>
              );
            })}
          </div>

          {/* Appearance Section */}
          <h2 className="section-title appearance-title">{t('apps.appearance')}</h2>
          <div className="appearance-toggle">
            <button
              className={`theme-btn ${!isDark ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <FiSun size={18} />
              <span>{t('apps.light')}</span>
            </button>
            <button
              className={`theme-btn ${isDark ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <FiMoon size={18} />
              <span>{t('apps.dark')}</span>
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
          }

          .featured-scroll::-webkit-scrollbar {
            display: none;
          }

          .featured-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            flex-shrink: 0;
          }

          .featured-icon {
            width: 100px;
            height: 100px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .featured-name {
            font-size: 14px;
            font-weight: 600;
            color: ${isDark ? '#FFFFFF' : '#000000'};
          }

          /* Apps Grid */
          .apps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 12px;
          }

          .app-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-decoration: none;
          }

          .app-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .app-name {
            font-size: 12px;
            font-weight: 500;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            text-align: center;
            line-height: 1.2;
          }

          /* Appearance Toggle */
          .appearance-toggle {
            display: flex;
            gap: 12px;
          }

          .theme-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px;
            border-radius: 12px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            background-color: ${isDark ? '#2A2A2A' : '#F5F5F5'};
            color: ${isDark ? '#FFFFFF' : '#000000'};
          }

          .theme-btn.active {
            background-color: #3B82F6;
            color: #FFFFFF;
          }

          .bottom-spacing {
            height: 40px;
          }

          @media (max-width: 380px) {
            .apps-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
}
