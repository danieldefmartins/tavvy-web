/**
 * Universe Detail Screen - Web Version V2
 * Port from iOS UniverseLandingScreen.tsx with V2 dark design system
 * 
 * Features:
 * - Hero image with universe name and location
 * - Stats bar (Places, Signals, Parks, Entrances)
 * - Tab navigation (Places, Map, Signals, Info)
 * - Search and zone filters
 * - Sub-universes (planets) horizontal scroll
 * - Quick actions (Entrances, Dining, Restrooms, Parking)
 * - Places list with cards
 * - V2 design system matching Pros page
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  IoArrowBack, IoHeartOutline, IoShareOutline, IoLocation,
  IoSearch, IoExitOutline, IoRestaurantOutline, IoWaterOutline,
  IoCarOutline, IoLocationOutline, IoSparkles
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// V2 Design System Colors
const COLORS = {
  primaryBlue: '#6B7FFF',
  accentTeal: '#00CED1',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  errorRed: '#EF4444',
};

// Default placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Get category-based fallback image
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'family': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'themed': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'unique': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  return imageMap.default;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
};

interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  banner_image_url?: string;
  thumbnail_image_url?: string;
  total_signals?: number;
  place_count?: number;
  sub_universe_count?: number;
  parent_universe_id?: string;
}

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  total_signals?: number;
  thumbnail_url?: string;
}

export default function UniverseDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { slug } = router.query;
  const { theme, isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [subUniverses, setSubUniverses] = useState<Universe[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (slug) {
      loadUniverseData();
    }
  }, [slug]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch the universe details - try by slug first, then by id
      let universeData = null;
      
      const { data: bySlug } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (bySlug) {
        universeData = bySlug;
      } else {
        const { data: byId } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        universeData = byId;
      }

      if (!universeData) {
        setLoading(false);
        return;
      }
      
      setUniverse(universeData);

      // Fetch sub-universes (planets)
      const { data: subUniversesData } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeData.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      // Fetch places linked to this universe
      const { data: placesData } = await supabase
        .from('atlas_universe_places')
        .select(`
          place:places(
            id,
            name,
            tavvy_category,
            tavvy_subcategory,
            total_signals,
            thumbnail_url
          )
        `)
        .eq('universe_id', universeData.id)
        .order('display_order', { ascending: true });

      if (placesData) {
        const extractedPlaces = placesData
          .map((item: any) => item.place)
          .filter(Boolean);
        setPlaces(extractedPlaces);
      }

    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? '#121212' : '#FAFAFA';
  const surfaceColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const surfaceAltColor = isDark ? '#2A2A2A' : '#F3F4F6';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  // Build stats
  const stats = [
    { val: String(universe?.place_count || places.length || 0), label: "Places" },
    { val: formatNumber(universe?.total_signals || 0), label: "Signals" },
    { val: String(universe?.sub_universe_count || subUniverses.length || 0), label: "Parks" },
    { val: "—", label: "Entrances" }
  ];

  // Build zones
  const zones = [
    "All Zones",
    ...subUniverses.map(su => su.name)
  ];

  // Quick actions
  const quickActions = [
    { icon: IoExitOutline, label: "Entrances" },
    { icon: IoRestaurantOutline, label: "Dining" },
    { icon: IoWaterOutline, label: "Restrooms" },
    { icon: IoCarOutline, label: "Parking" }
  ];

  if (loading) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: secondaryTextColor }}>Loading universe...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!universe) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <IoLocationOutline size={48} color={secondaryTextColor} />
            <div style={{ fontSize: 16, color: textColor, marginTop: 16 }}>Universe not found</div>
            <button onClick={() => router.back()} style={{ marginTop: 16, padding: '8px 16px', background: COLORS.primaryBlue, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{universe.name} | TavvY Universe</title>
        <meta name="description" content={universe.description || `Explore ${universe.name}`} />
      </Head>

      <AppLayout>
        <div className="universe-detail" style={{ backgroundColor: bgColor, minHeight: '100vh' }}>
          {/* Hero Section */}
          <div className="hero-container">
            <img 
              src={universe.banner_image_url || PLACEHOLDER_IMAGE} 
              alt={universe.name}
              className="hero-image"
            />
            <div className="hero-overlay" />
            
            {/* Hero Nav */}
            <div className="hero-nav">
              <button className="nav-button" onClick={() => router.back()}>
                <IoArrowBack size={24} />
              </button>
              <div className="nav-actions">
                <button className="nav-button">
                  <IoHeartOutline size={24} />
                </button>
                <button className="nav-button">
                  <IoShareOutline size={24} />
                </button>
              </div>
            </div>

            {/* Hero Content */}
            <div className="hero-content">
              <div className="universe-badge">
                <span className="universe-badge-icon">🌌</span>
                <span className="universe-badge-text">UNIVERSE</span>
              </div>
              <h1 className="hero-title">{universe.name}</h1>
              <div className="hero-meta">
                <IoLocation size={14} color="#fff" />
                <span>{universe.location || 'Location TBD'}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="stats-container" style={{ backgroundColor: surfaceColor, borderColor }}>
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{stat.val}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="tabs-container" style={{ borderColor }}>
            {["Places", "Map", "Signals", "Info"].map((tab) => (
              <button 
                key={tab} 
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="filter-section">
            <div className="search-bar" style={{ backgroundColor: surfaceAltColor }}>
              <IoSearch size={16} color={secondaryTextColor} />
              <input 
                type="text" 
                placeholder="Search in this universe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, color: textColor, fontSize: 14 }}
              />
            </div>
            
            {zones.length > 1 && (
              <div className="zones-container">
                {zones.map((zone) => (
                  <button 
                    key={zone}
                    className={`zone-chip ${activeZone === zone ? 'active' : ''}`}
                    onClick={() => setActiveZone(zone)}
                    style={{ backgroundColor: activeZone === zone ? COLORS.primaryBlue : surfaceColor, borderColor }}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Universes (Planets) Section */}
          {subUniverses.length > 0 && (
            <div className="section">
              <h2 className="section-title">Parks & Areas</h2>
              <div className="sub-universes-scroll">
                {subUniverses.map((subUniverse) => (
                  <Link 
                    key={subUniverse.id} 
                    href={`/app/universe/${subUniverse.slug || subUniverse.id}`}
                    locale={locale}
                    className="sub-universe-card"
                    style={{ backgroundColor: surfaceColor, borderColor }}
                  >
                    <img 
                      src={subUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE} 
                      alt={subUniverse.name}
                      className="sub-universe-image"
                    />
                    <div className="sub-universe-content">
                      <div className="sub-universe-name">{subUniverse.name}</div>
                      <div className="sub-universe-count">{subUniverse.place_count || 0} places</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Map Preview */}
          <button className="map-preview" style={{ backgroundColor: surfaceColor, borderColor }}>
            <span className="map-icon">🗺️</span>
            <span className="map-text">View Universe Map →</span>
          </button>

          {/* Quick Actions */}
          <div className="quick-actions">
            {quickActions.map((action, i) => (
              <button key={i} className="action-button" style={{ backgroundColor: surfaceColor, borderColor }}>
                <action.icon size={24} color={COLORS.primaryBlue} />
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Places List */}
          <div className="section">
            <div className="places-header">
              <h2 className="places-title">Places in this Universe</h2>
              <span className="places-count">{places.length} places</span>
            </div>

            {places.length > 0 ? (
              <div className="places-list">
                {places.map((place) => (
                  <Link 
                    key={place.id} 
                    href={`/place/${place.id}`}
                    locale={locale}
                    className="place-card"
                    style={{ backgroundColor: surfaceColor, borderColor }}
                  >
                    <img 
                      src={place.thumbnail_url || getCategoryFallbackImage(place.tavvy_category || '')} 
                      alt={place.name}
                      className="place-image"
                    />
                    <div className="place-content">
                      <div className="place-name">{place.name}</div>
                      <div className="place-category">{place.tavvy_category || 'Attraction'}</div>
                      <div className="place-tags">
                        <div className="place-tag">
                          <IoSparkles size={12} color={COLORS.accentTeal} />
                          <span>{place.total_signals || 0} signals</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <IoLocationOutline size={48} color={secondaryTextColor} />
                <div className="empty-text">No places added yet</div>
              </div>
            )}
          </div>

          <div style={{ height: 100 }} />

          <style jsx>{`
            .universe-detail {
              padding-bottom: 80px;
            }

            /* Hero Section */
            .hero-container {
              position: relative;
              height: 400px;
              overflow: hidden;
            }

            .hero-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .hero-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
            }

            .hero-nav {
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 10;
            }

            .nav-button {
              width: 40px;
              height: 40px;
              background: rgba(255, 255, 255, 0.9);
              border: none;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .nav-button:hover {
              transform: scale(1.1);
            }

            .nav-actions {
              display: flex;
              gap: 8px;
            }

            .hero-content {
              position: absolute;
              bottom: 24px;
              left: 20px;
              right: 20px;
              z-index: 10;
            }

            .universe-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              padding: 6px 12px;
              border-radius: 20px;
              margin-bottom: 12px;
            }

            .universe-badge-icon {
              font-size: 16px;
            }

            .universe-badge-text {
              font-size: 11px;
              font-weight: 700;
              color: #FFFFFF;
              letter-spacing: 1px;
            }

            .hero-title {
              font-size: 36px;
              font-weight: 800;
              color: #FFFFFF;
              margin: 0 0 8px;
              text-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }

            .hero-meta {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 14px;
              color: #FFFFFF;
              opacity: 0.9;
            }

            /* Stats Bar */
            .stats-container {
              display: flex;
              padding: 20px;
              border-bottom: 1px solid;
              gap: 20px;
            }

            .stat-item {
              flex: 1;
              text-align: center;
            }

            .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: ${COLORS.successGreen};
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 12px;
              font-weight: 600;
              color: ${secondaryTextColor};
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            /* Tabs */
            .tabs-container {
              display: flex;
              padding: 0 20px;
              border-bottom: 1px solid;
              gap: 24px;
            }

            .tab-item {
              padding: 16px 0;
              font-size: 15px;
              font-weight: 600;
              color: ${secondaryTextColor};
              background: none;
              border: none;
              border-bottom: 2px solid transparent;
              cursor: pointer;
              transition: all 0.2s;
            }

            .tab-item.active {
              color: ${COLORS.primaryBlue};
              border-bottom-color: ${COLORS.primaryBlue};
            }

            /* Filter Section */
            .filter-section {
              padding: 20px;
            }

            .search-bar {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 16px;
              border-radius: 12px;
              margin-bottom: 12px;
            }

            .zones-container {
              display: flex;
              gap: 8px;
              overflow-x: auto;
              padding-bottom: 8px;
              scrollbar-width: none;
            }

            .zones-container::-webkit-scrollbar {
              display: none;
            }

            .zone-chip {
              padding: 8px 16px;
              border: 1px solid;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              color: ${textColor};
              cursor: pointer;
              white-space: nowrap;
              transition: all 0.2s;
            }

            .zone-chip.active {
              color: #FFFFFF;
            }

            /* Section */
            .section {
              padding: 0 20px 24px;
            }

            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: ${textColor};
              margin: 0 0 16px;
            }

            /* Sub-Universes */
            .sub-universes-scroll {
              display: flex;
              gap: 12px;
              overflow-x: auto;
              padding-bottom: 8px;
              scrollbar-width: none;
            }

            .sub-universes-scroll::-webkit-scrollbar {
              display: none;
            }

            .sub-universe-card {
              min-width: 200px;
              border: 1px solid;
              border-radius: 12px;
              overflow: hidden;
              text-decoration: none;
              transition: transform 0.2s;
            }

            .sub-universe-card:hover {
              transform: translateY(-2px);
            }

            .sub-universe-image {
              width: 100%;
              height: 120px;
              object-fit: cover;
            }

            .sub-universe-content {
              padding: 12px;
            }

            .sub-universe-name {
              font-size: 14px;
              font-weight: 600;
              color: ${textColor};
              margin-bottom: 4px;
            }

            .sub-universe-count {
              font-size: 12px;
              color: ${secondaryTextColor};
            }

            /* Map Preview */
            .map-preview {
              margin: 0 20px 24px;
              padding: 16px;
              border: 1px solid;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 12px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .map-preview:hover {
              transform: translateY(-2px);
            }

            .map-icon {
              font-size: 24px;
            }

            .map-text {
              font-size: 15px;
              font-weight: 600;
              color: ${textColor};
            }

            /* Quick Actions */
            .quick-actions {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              padding: 0 20px 24px;
            }

            .action-button {
              padding: 16px;
              border: 1px solid;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .action-button:hover {
              transform: translateY(-2px);
            }

            .action-label {
              font-size: 12px;
              font-weight: 500;
              color: ${textColor};
              text-align: center;
            }

            /* Places */
            .places-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }

            .places-title {
              font-size: 20px;
              font-weight: 700;
              color: ${textColor};
              margin: 0;
            }

            .places-count {
              font-size: 14px;
              color: ${secondaryTextColor};
            }

            .places-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .place-card {
              display: flex;
              gap: 16px;
              padding: 12px;
              border: 1px solid;
              border-radius: 12px;
              text-decoration: none;
              transition: transform 0.2s;
            }

            .place-card:hover {
              transform: translateY(-2px);
            }

            .place-image {
              width: 80px;
              height: 80px;
              border-radius: 8px;
              object-fit: cover;
              flex-shrink: 0;
            }

            .place-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .place-name {
              font-size: 16px;
              font-weight: 600;
              color: ${textColor};
              margin-bottom: 4px;
            }

            .place-category {
              font-size: 13px;
              color: ${secondaryTextColor};
              margin-bottom: 8px;
            }

            .place-tags {
              display: flex;
              gap: 8px;
            }

            .place-tag {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 4px 8px;
              background: rgba(0, 206, 209, 0.1);
              border-radius: 6px;
              font-size: 12px;
              color: ${COLORS.accentTeal};
            }

            /* Empty State */
            .empty-state {
              text-align: center;
              padding: 60px 20px;
            }

            .empty-text {
              font-size: 16px;
              color: ${secondaryTextColor};
              margin-top: 16px;
            }

            @media (max-width: 768px) {
              .quick-actions {
                grid-template-columns: repeat(2, 1fr);
              }

              .hero-title {
                font-size: 28px;
              }
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
