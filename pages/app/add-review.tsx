/**
 * AddReview Page - Single-Page Signal Tap Review
 * MATCHES the mockup design:
 * - Single scrollable page with all 3 categories visible
 * - Large icon tile grid layout
 * - Fire emoji (🔥) for intensity (tap again to increase)
 * - Checkmark on selected tiles
 * - Category section headers as colored badges
 * - Heads Up warning about negative reviews
 * - Proper login/signup modal for unauthenticated users
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../../components/AppLayout';
import { 
  fetchSignalsForPlace, 
  SignalsByCategory, 
  Signal,
  CATEGORY_COLORS,
  SIGNAL_LABELS,
  ReviewSignalTap
} from '../../lib/signalService';
import { submitReview, updateReview, fetchUserReview } from '../../lib/reviews';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';

// Category config
const CATEGORIES = [
  {
    id: 'best_for' as const,
    title: 'Best For',
    accent: '#0A84FF',
    accentBg: 'rgba(10, 132, 255, 0.15)',
    limit: 5,
  },
  {
    id: 'vibe' as const,
    title: 'Vibe',
    accent: '#8B5CF6',
    accentBg: 'rgba(139, 92, 246, 0.15)',
    limit: 5,
  },
  {
    id: 'heads_up' as const,
    title: 'Heads Up',
    accent: '#FF9500',
    accentBg: 'rgba(255, 149, 0, 0.15)',
    limit: 2,
  },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

export default function AddReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  
  const { placeId, placeName, primaryCategory, subcategory } = router.query;
  
  // State
  const [tapCounts, setTapCounts] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Dynamic signals from database
  const [signals, setSignals] = useState<SignalsByCategory>({
    best_for: [],
    vibe: [],
    heads_up: [],
  });

  // Load signals and existing review
  useEffect(() => {
    if (!placeId || typeof placeId !== 'string') return;
    loadData(placeId);
  }, [placeId]);

  const loadData = async (pid: string) => {
    try {
      setIsLoading(true);
      
      const placeSignals = await fetchSignalsForPlace(pid);
      setSignals(placeSignals);

      const { review, signals: existingSignals } = await fetchUserReview(pid);
      
      if (review) {
        setExistingReviewId(review.id);
        const counts: { [key: string]: number } = {};
        existingSignals.forEach(signal => {
          counts[signal.signalId] = signal.intensity;
        });
        setTapCounts(counts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTap = (signalId: string, categoryId: CategoryId) => {
    const currentCount = tapCounts[signalId] || 0;
    const category = CATEGORIES.find(c => c.id === categoryId)!;
    
    const categorySignals = signals[categoryId];
    const categorySignalIds = categorySignals.map(s => s.id);
    
    // Count currently selected items in this category
    const currentCategorySelectionCount = Object.keys(tapCounts).filter(
      key => categorySignalIds.includes(key) && tapCounts[key] > 0
    ).length;

    // Block if trying to add new item at limit
    if (currentCount === 0 && currentCategorySelectionCount >= category.limit) {
      return; // Silently block
    }

    // Cycle: 0 → 1 → 2 → 3 → 0
    const newCount = currentCount < 3 ? currentCount + 1 : 0;
    
    if (newCount === 0) {
      const { [signalId]: _, ...rest } = tapCounts;
      setTapCounts(rest);
    } else {
      setTapCounts({ ...tapCounts, [signalId]: newCount });
    }
  };

  const handleSubmit = async () => {
    if (!placeId || typeof placeId !== 'string') return;

    const selectedCount = Object.keys(tapCounts).filter(k => tapCounts[k] > 0).length;
    if (selectedCount === 0) {
      setSubmitError('Please select at least one signal before submitting.');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const reviewSignals: ReviewSignalTap[] = Object.entries(tapCounts).map(([signalId, intensity]) => ({
      signalId,
      intensity,
    }));

    let result;
    
    if (existingReviewId) {
      result = await updateReview(existingReviewId, placeId, reviewSignals);
    } else {
      result = await submitReview(
        placeId,
        (placeName as string) || 'Unknown Place',
        reviewSignals
      );
    }

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } else {
      setSubmitError(typeof result.error === 'string' ? result.error : 'Failed to submit review. Please try again.');
    }
  };

  // Total selected across all categories
  const totalSelected = Object.keys(tapCounts).filter(k => tapCounts[k] > 0).length;

  // Render fire emojis for intensity
  const renderIntensity = (count: number) => {
    if (count === 0) return null;
    return '🔥'.repeat(count);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#000' : '#F5F5F7',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: isDark ? '#8E8E93' : '#666', fontSize: 16 }}>Loading signals...</p>
          </div>
        </div>
        <style jsx>{`
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(0,0,0,0.1);
            border-top-color: #0A84FF;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </AppLayout>
    );
  }

  if (submitSuccess) {
    return (
      <AppLayout>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#000' : '#F5F5F7',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: isDark ? '#fff' : '#000', fontSize: 24, fontWeight: 700 }}>
              {existingReviewId ? 'Review Updated!' : 'Review Submitted!'}
            </h2>
            <p style={{ color: isDark ? '#8E8E93' : '#666', marginTop: 8 }}>
              Thanks for helping the community!
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Add Review | TavvY</title>
      </Head>
      
      <div className="review-page">
        {/* Close bar */}
        <div className="close-bar">
          <div className="close-bar-inner">
            <button className="close-btn" onClick={() => router.back()} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="close-bar-title">{placeName ? String(placeName) : 'Add Review'}</span>
            <div style={{ width: 36 }} />
          </div>
        </div>

        <div className="review-container">
          
          {/* Header */}
          <div className="review-header">
            <div className="header-left">
              <h1 className="header-title">What Stood Out?</h1>
              {totalSelected > 0 && (
                <span className="selected-badge">{totalSelected} selected</span>
              )}
            </div>
            <p className="header-subtitle">Tap to select &middot; Tap again to make it stronger</p>
          </div>

          {/* Place name */}
          {placeName && (
            <div className="place-badge">
              <span>📍</span>
              <span>{placeName}</span>
            </div>
          )}

          {/* All 3 categories on one page */}
          {CATEGORIES.map((category) => {
            const categorySignals = signals[category.id];
            const categorySignalIds = categorySignals.map(s => s.id);
            const categorySelectedCount = Object.keys(tapCounts).filter(
              key => categorySignalIds.includes(key) && tapCounts[key] > 0
            ).length;

            return (
              <div key={category.id} className="category-section">
                {/* Category badge header */}
                <div className="category-header">
                  <span 
                    className="category-badge"
                    style={{ 
                      backgroundColor: category.accent,
                      color: '#fff',
                    }}
                  >
                    {category.title}
                  </span>
                  {categorySelectedCount > 0 && (
                    <span className="category-count" style={{ color: category.accent }}>
                      {categorySelectedCount}/{category.limit}
                    </span>
                  )}
                </div>

                {/* Heads Up warning */}
                {category.id === 'heads_up' && (
                  <div className="heads-up-warning">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-text">
                      <strong>Heads Up is a negative review.</strong> These signals warn others about potential issues. Heads Up taps that don&apos;t receive another tap within 6 months will automatically fade away.
                    </div>
                  </div>
                )}

                {/* Signal tile grid */}
                {categorySignals.length === 0 ? (
                  <div className="empty-signals">
                    <p>No signals available for this category</p>
                  </div>
                ) : (
                  <div className="signal-grid">
                    {categorySignals.map((signal) => {
                      const count = tapCounts[signal.id] || 0;
                      const isSelected = count > 0;
                      
                      return (
                        <button
                          key={signal.id}
                          className={`signal-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleTap(signal.id, category.id)}
                          style={{
                            backgroundColor: isSelected ? category.accent : (isDark ? '#2C2C2E' : '#F0F0F5'),
                            borderColor: isSelected ? category.accent : 'transparent',
                          }}
                        >
                          {/* Checkmark badge */}
                          {isSelected && (
                            <div className="tile-check" style={{ backgroundColor: category.accent }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                          
                          {/* Icon */}
                          <div className="tile-icon">
                            {signal.icon_emoji}
                          </div>
                          
                          {/* Label */}
                          <div className={`tile-label ${isSelected ? 'selected-label' : ''}`}>
                            {signal.label}
                          </div>
                          
                          {/* Fire intensity */}
                          {isSelected && count > 0 && (
                            <div className="tile-intensity">
                              {renderIntensity(count)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Error message */}
          {submitError && (
            <div className="error-message">
              {submitError}
            </div>
          )}

          {/* Continue button */}
          <div className="submit-area">
            <button
              className="continue-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || totalSelected === 0}
            >
              {isSubmitting ? 'Submitting...' : (
                totalSelected > 0 
                  ? `Continue → ` 
                  : 'Select signals to continue'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-icon">🔐</div>
            <h2 className="auth-modal-title">Sign in to submit your review</h2>
            <p className="auth-modal-subtitle">
              Your {totalSelected} signal{totalSelected !== 1 ? 's' : ''} will be saved. Create an account or log in to share your experience with the community.
            </p>
            
            <button
              className="auth-btn auth-btn-primary"
              onClick={() => {
                const returnUrl = router.asPath;
                router.push(`/app/signup?redirect=${encodeURIComponent(returnUrl)}`);
              }}
            >
              Create Account
            </button>
            
            <button
              className="auth-btn auth-btn-secondary"
              onClick={() => {
                const returnUrl = router.asPath;
                router.push(`/app/login?redirect=${encodeURIComponent(returnUrl)}`);
              }}
            >
              Log In
            </button>
            
            <button
              className="auth-btn-dismiss"
              onClick={() => setShowAuthModal(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .review-page {
          min-height: 100vh;
          background-color: ${isDark ? '#000' : '#F5F5F7'};
          padding-bottom: 40px;
        }

        /* Close bar */
        .close-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(245,245,247,0.85)'};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
        }

        .close-bar-inner {
          max-width: 480px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          color: ${isDark ? '#fff' : '#333'};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .close-btn:active {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'};
        }

        .close-bar-title {
          font-size: 15px;
          font-weight: 600;
          color: ${isDark ? '#ccc' : '#444'};
          text-align: center;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 8px;
        }

        .review-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* Header */
        .review-header {
          padding: 20px 0 8px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 4px;
        }

        .header-title {
          font-size: 28px;
          font-weight: 800;
          color: ${isDark ? '#fff' : '#111'};
          margin: 0;
          letter-spacing: -0.5px;
        }

        .selected-badge {
          font-size: 16px;
          font-weight: 700;
          color: #0A84FF;
        }

        .header-subtitle {
          font-size: 15px;
          color: ${isDark ? '#8E8E93' : '#666'};
          margin: 0;
        }

        /* Place badge */
        .place-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
          padding: 6px 12px;
          border-radius: 16px;
          margin: 12px 0 8px;
          font-size: 13px;
          font-weight: 500;
          color: ${isDark ? '#8E8E93' : '#666'};
        }

        /* Category sections */
        .category-section {
          margin-top: 24px;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .category-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .category-count {
          font-size: 13px;
          font-weight: 600;
        }

        /* Heads Up warning */
        .heads-up-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: ${isDark ? 'rgba(255, 149, 0, 0.1)' : '#FFF8F0'};
          border: 1.5px solid ${isDark ? 'rgba(255, 149, 0, 0.3)' : '#FFD699'};
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        .warning-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .warning-text {
          font-size: 13px;
          color: ${isDark ? '#FFB84D' : '#8B5E00'};
          line-height: 1.4;
        }

        .warning-text strong {
          display: block;
          margin-bottom: 2px;
          font-size: 13px;
          color: ${isDark ? '#FF9500' : '#7A4D00'};
        }

        /* Signal grid - tile layout */
        .signal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .empty-signals {
          text-align: center;
          padding: 24px;
          color: ${isDark ? '#636366' : '#999'};
          font-size: 14px;
        }

        /* Signal tile */
        .signal-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 8px 10px;
          border-radius: 16px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 100px;
          -webkit-tap-highlight-color: transparent;
        }

        .signal-tile:active {
          transform: scale(0.95);
        }

        .signal-tile.selected {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Checkmark */
        .tile-check {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Icon */
        .tile-icon {
          font-size: 32px;
          margin-bottom: 6px;
          line-height: 1;
        }

        /* Label */
        .tile-label {
          font-size: 12px;
          font-weight: 500;
          color: ${isDark ? '#ccc' : '#444'};
          text-align: center;
          line-height: 1.2;
          word-break: break-word;
        }

        .selected-label {
          color: #fff;
          font-weight: 600;
        }

        /* Fire intensity */
        .tile-intensity {
          font-size: 14px;
          margin-top: 4px;
          line-height: 1;
        }

        /* Error */
        .error-message {
          margin-top: 16px;
          padding: 12px;
          background: #FEE2E2;
          border-radius: 12px;
          color: #991B1B;
          font-size: 14px;
          text-align: center;
        }

        /* Submit area */
        .submit-area {
          padding: 24px 0 20px;
          position: sticky;
          bottom: 0;
          background: linear-gradient(transparent, ${isDark ? '#000' : '#F5F5F7'} 20%);
          padding-top: 32px;
        }

        .continue-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 16px;
          border: none;
          background: #0A84FF;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          letter-spacing: 0.2px;
        }

        .continue-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .continue-btn:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Auth Modal Overlay */
        .auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .auth-modal {
          background: ${isDark ? '#1C1C1E' : '#fff'};
          border-radius: 24px;
          padding: 32px 24px;
          max-width: 360px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .auth-modal-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .auth-modal-title {
          font-size: 22px;
          font-weight: 700;
          color: ${isDark ? '#fff' : '#111'};
          margin: 0 0 8px;
        }

        .auth-modal-subtitle {
          font-size: 15px;
          color: ${isDark ? '#8E8E93' : '#666'};
          margin: 0 0 24px;
          line-height: 1.4;
        }

        .auth-btn {
          width: 100%;
          padding: 14px 24px;
          border-radius: 14px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-bottom: 10px;
        }

        .auth-btn:active {
          opacity: 0.8;
        }

        .auth-btn-primary {
          background: #0A84FF;
          color: #fff;
        }

        .auth-btn-secondary {
          background: ${isDark ? '#2C2C2E' : '#F0F0F5'};
          color: ${isDark ? '#fff' : '#333'};
          border: 1px solid ${isDark ? '#38383A' : '#E5E5EA'};
        }

        .auth-btn-dismiss {
          background: none;
          border: none;
          color: ${isDark ? '#636366' : '#999'};
          font-size: 14px;
          cursor: pointer;
          padding: 8px;
          margin-top: 4px;
        }

        .auth-btn-dismiss:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 360px) {
          .signal-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </AppLayout>
  );
}
