/**
 * eCard Hub Screen
 * Main entry point for eCard feature - shows existing cards or create new option
 * Ported from tavvy-mobile/screens/ecard/ECardHubScreen.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { getUserCards, CardData } from '../../../lib/ecard';
import { 
  IoArrowBack, 
  IoAdd, 
  IoEye, 
  IoHandLeft, 
  IoChevronForward,
  IoIdCard,
  IoBulb,
  IoRefresh,
} from 'react-icons/io5';

// Brand colors
const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#000000';

export default function ECardHubScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { user, loading: authLoading } = useAuth();
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCards = useCallback(async () => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserCards(user.id);
      setCards(data);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCards();
  };

  const handleEditCard = (card: CardData) => {
    router.push(`/app/ecard/dashboard?cardId=${card.id}`);
  };

  const handleCreateNew = () => {
    router.push('/app/ecard/create');
  };

  const handleViewCard = (card: CardData) => {
    router.push(`/app/ecard/preview?cardId=${card.id}`);
  };

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  // Calculate totals
  const totalViews = cards.reduce((sum, card) => sum + (card.view_count || 0), 0);
  const totalTaps = cards.reduce((sum, card) => sum + (card.tap_count || 0), 0);

  if (loading) {
    return (
      <>
        <Head>
          <title>My eCards | TavvY</title>
        </Head>
        <AppLayout>
          <div className="loading-screen" style={{ backgroundColor: bgColor }}>
            <div className="loading-spinner" />
            <p style={{ color: isDark ? '#fff' : '#333' }}>Loading your cards...</p>
            <style jsx>{`
              .loading-screen {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
              }
              .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
                border-top-color: ${ACCENT_GREEN};
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My eCards | TavvY</title>
        <meta name="description" content="Manage your digital business cards" />
      </Head>

      <AppLayout>
        <div className="ecard-hub" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <h1 style={{ color: isDark ? '#fff' : '#333' }}>My eCards</h1>
            <button className="refresh-btn" onClick={onRefresh}>
              <IoRefresh size={20} color={isDark ? '#fff' : '#333'} className={refreshing ? 'spinning' : ''} />
            </button>
          </header>

          {/* Hero Section */}
          <div className="hero-section">
            <h2 style={{ color: isDark ? '#fff' : '#111' }}>Your Digital Business Cards</h2>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
              Create, customize, and share your professional identity
            </p>
          </div>

          {/* Cards Grid */}
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="card-tile" onClick={() => handleEditCard(card)}>
                <div 
                  className="card-gradient"
                  style={{ 
                    background: `linear-gradient(135deg, ${card.gradient_color_1 || '#667eea'}, ${card.gradient_color_2 || '#764ba2'})` 
                  }}
                >
                  {/* Status Badge */}
                  <div className={`status-badge ${card.is_published ? 'published' : 'draft'}`}>
                    {card.is_published ? 'Live' : 'Draft'}
                  </div>

                  {/* Profile Photo */}
                  <div className="card-photo-container">
                    {card.profile_photo_url ? (
                      <img src={card.profile_photo_url} alt={card.full_name} className="card-photo" />
                    ) : (
                      <div className="card-photo-placeholder">
                        <IoIdCard size={24} color="rgba(255,255,255,0.5)" />
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <h3 className="card-name">{card.full_name || 'Untitled Card'}</h3>
                  {card.title && <p className="card-title">{card.title}</p>}

                  {/* Stats Row */}
                  <div className="stats-row">
                    <div className="stat">
                      <IoEye size={12} color="rgba(255,255,255,0.7)" />
                      <span>{card.view_count || 0}</span>
                    </div>
                    <div className="stat">
                      <IoHandLeft size={12} color="rgba(255,255,255,0.7)" />
                      <span>{card.tap_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="card-actions" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                  <span style={{ color: isDark ? '#94A3B8' : '#666' }}>Edit Card</span>
                  <IoChevronForward size={16} color={isDark ? '#94A3B8' : '#666'} />
                </div>
              </div>
            ))}

            {/* Create New Tile */}
            <div className="card-tile" onClick={handleCreateNew}>
              <div className="create-new-gradient" style={{ backgroundColor: isDark ? '#1E293B' : '#F5F5F5' }}>
                <div className="create-new-icon">
                  <IoAdd size={40} color={ACCENT_GREEN} />
                </div>
                <h3 className="create-new-title" style={{ color: isDark ? '#fff' : '#333' }}>Create New</h3>
                <p className="create-new-subtitle" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }}>
                  Start fresh with a new card
                </p>
              </div>
              <div className="card-actions" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                <span style={{ color: isDark ? '#94A3B8' : '#666' }}>Get Started</span>
                <IoChevronForward size={16} color={isDark ? '#94A3B8' : '#666'} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {cards.length > 0 && (
            <div className="quick-stats">
              <h3 style={{ color: isDark ? '#fff' : '#333' }}>Quick Stats</h3>
              <div className="stats-cards">
                <div className="stat-card" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                  <span className="stat-value" style={{ color: isDark ? '#fff' : '#333' }}>{totalViews}</span>
                  <span className="stat-label" style={{ color: isDark ? '#94A3B8' : '#666' }}>Total Views</span>
                </div>
                <div className="stat-card" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                  <span className="stat-value" style={{ color: isDark ? '#fff' : '#333' }}>{totalTaps}</span>
                  <span className="stat-label" style={{ color: isDark ? '#94A3B8' : '#666' }}>Total Taps</span>
                </div>
                <div className="stat-card" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                  <span className="stat-value" style={{ color: isDark ? '#fff' : '#333' }}>{cards.length}</span>
                  <span className="stat-label" style={{ color: isDark ? '#94A3B8' : '#666' }}>Cards</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {cards.length === 0 && (
            <div className="empty-state">
              <IoIdCard size={64} color="#E0E0E0" />
              <h3 style={{ color: isDark ? '#fff' : '#333' }}>No cards yet</h3>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#666' }}>
                Create your first digital business card and start sharing your professional identity
              </p>
              <button className="create-button" onClick={handleCreateNew}>
                <IoAdd size={20} color="#fff" />
                <span>Create Your First Card</span>
              </button>
            </div>
          )}

          {/* Pro Tip */}
          <div className="pro-tip" style={{ backgroundColor: isDark ? '#1E293B' : '#FFF9E6' }}>
            <div className="pro-tip-icon">
              <IoBulb size={20} color="#FFB300" />
            </div>
            <div className="pro-tip-content">
              <h4 style={{ color: isDark ? '#fff' : '#333' }}>Pro Tip</h4>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#666' }}>
                Share your card link on social media bios, email signatures, and business materials for maximum reach.
              </p>
            </div>
          </div>

          {/* Bottom Spacing */}
          <div style={{ height: 100 }} />
        </div>

        <style jsx>{`
          .ecard-hub {
            min-height: 100vh;
            padding-bottom: 20px;
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .back-btn, .refresh-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            border-radius: 8px;
          }

          .back-btn:hover, .refresh-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          }

          .header h1 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          /* Hero Section */
          .hero-section {
            padding: 0 20px 24px;
          }

          .hero-section h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .hero-section p {
            font-size: 14px;
            margin: 0;
          }

          /* Cards Grid */
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            padding: 0 20px;
          }

          @media (max-width: 480px) {
            .cards-grid {
              grid-template-columns: 1fr;
            }
          }

          .card-tile {
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .card-tile:hover {
            transform: translateY(-2px);
          }

          .card-gradient {
            padding: 16px;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          .status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }

          .status-badge.published {
            background: rgba(0, 200, 83, 0.2);
            color: #00C853;
          }

          .status-badge.draft {
            background: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.8);
          }

          .card-photo-container {
            width: 56px;
            height: 56px;
            border-radius: 28px;
            overflow: hidden;
            margin-bottom: 12px;
            border: 2px solid rgba(255, 255, 255, 0.3);
          }

          .card-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .card-photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
          }

          .card-name {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .card-title {
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .stats-row {
            display: flex;
            gap: 16px;
            margin-top: auto;
            padding-top: 12px;
          }

          .stat {
            display: flex;
            align-items: center;
            gap: 4px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
          }

          .card-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            font-size: 13px;
          }

          /* Create New Tile */
          .create-new-gradient {
            padding: 16px;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px dashed ${isDark ? 'rgba(255,255,255,0.2)' : '#E0E0E0'};
            border-radius: 16px 16px 0 0;
            margin: -2px -2px 0 -2px;
          }

          .create-new-icon {
            width: 64px;
            height: 64px;
            border-radius: 32px;
            background: ${isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.1)'};
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
          }

          .create-new-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }

          .create-new-subtitle {
            font-size: 12px;
            margin: 0;
            text-align: center;
          }

          /* Quick Stats */
          .quick-stats {
            padding: 24px 20px;
          }

          .quick-stats h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px;
          }

          .stats-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .stat-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 12px;
          }

          /* Empty State */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px 20px;
            text-align: center;
          }

          .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            margin: 16px 0 8px;
          }

          .empty-state p {
            font-size: 14px;
            margin: 0 0 24px;
            max-width: 280px;
          }

          .create-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 24px;
            background: linear-gradient(90deg, ${ACCENT_GREEN}, #00A843);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .create-button:hover {
            transform: scale(1.02);
          }

          /* Pro Tip */
          .pro-tip {
            margin: 24px 20px;
            padding: 16px;
            border-radius: 12px;
            display: flex;
            gap: 12px;
          }

          .pro-tip-icon {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            background: rgba(255, 179, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .pro-tip-content h4 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
          }

          .pro-tip-content p {
            font-size: 13px;
            margin: 0;
            line-height: 1.4;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
