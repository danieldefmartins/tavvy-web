/**
 * AddReview Page - 3-Step Wizard
 * MATCHES iOS AddReviewScreen.tsx EXACTLY
 * 
 * Steps:
 * 1. The Good (best_for) - Blue - Max 5 selections
 * 2. The Vibe (vibe) - Purple - Max 5 selections
 * 3. Heads Up (heads_up) - Orange - Max 2 selections
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

// ============================================
// WIZARD STEPS (matches iOS STEPS exactly)
// ============================================
const STEPS = [
  {
    id: 'best_for' as const,
    title: 'The Good',
    subtitle: 'What did you like? Tap the highlights.',
    limit: 5,
    accent: '#0A84FF',
    icon: '👍',
    bgLight: '#E0F2FE',
    bgDark: '#0A1628',
  },
  {
    id: 'vibe' as const,
    title: 'The Vibe',
    subtitle: "How's the atmosphere? Set the scene.",
    limit: 5,
    accent: '#8B5CF6',
    icon: '✨',
    bgLight: '#F3E8FF',
    bgDark: '#1A1A2E',
  },
  {
    id: 'heads_up' as const,
    title: 'Heads Up',
    subtitle: 'Any warnings? Help others prepare.',
    limit: 2,
    accent: '#FF9500',
    icon: '⚠️',
    bgLight: '#FEF3C7',
    bgDark: '#1F1410',
  },
] as const;

type StepId = typeof STEPS[number]['id'];

export default function AddReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  
  const { placeId, placeName, primaryCategory, subcategory } = router.query;
  
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tapCounts, setTapCounts] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Dynamic signals from database
  const [signals, setSignals] = useState<SignalsByCategory>({
    best_for: [],
    vibe: [],
    heads_up: [],
  });

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Load signals and existing review
  useEffect(() => {
    if (!placeId || typeof placeId !== 'string') return;
    loadData(placeId);
  }, [placeId]);

  const loadData = async (pid: string) => {
    try {
      setIsLoading(true);
      
      // Load signals for this place's category
      const placeSignals = await fetchSignalsForPlace(pid);
      setSignals(placeSignals);

      // Load existing review if any
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

  const handleTap = (signalId: string) => {
    const currentCount = tapCounts[signalId] || 0;
    
    const currentSignals = signals[currentStep.id];
    const currentSignalIds = currentSignals.map(s => s.id);
    
    // Count currently selected items in this category
    const currentCategorySelectionCount = Object.keys(tapCounts).filter(
      key => currentSignalIds.includes(key) && tapCounts[key] > 0
    ).length;

    // Block if trying to add new item at limit
    if (currentCount === 0 && currentCategorySelectionCount >= currentStep.limit) {
      alert(`You can only select ${currentStep.limit} items for this section.`);
      return;
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

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!placeId || typeof placeId !== 'string') return;

    const selectedCount = Object.keys(tapCounts).length;
    if (selectedCount === 0) {
      alert('Please select at least one signal before submitting.');
      return;
    }

    if (!user) {
      alert('Please log in to submit a review.');
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

  // Get selected count for current step
  const currentStepSignalIds = signals[currentStep.id].map(s => s.id);
  const currentStepSelectedCount = Object.keys(tapCounts).filter(
    key => currentStepSignalIds.includes(key) && tapCounts[key] > 0
  ).length;

  // Total selected across all steps
  const totalSelected = Object.keys(tapCounts).filter(k => tapCounts[k] > 0).length;

  // Progress
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#000' : '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: isDark ? '#8E8E93' : '#666', fontSize: 16 }}>Loading signals...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#000' : '#fff',
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
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Add Review | TavvY</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDark ? currentStep.bgDark : currentStep.bgLight,
        transition: 'background-color 0.3s ease',
      }}>
        {/* Max width wrapper for desktop */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: isDark ? currentStep.bgDark : currentStep.bgLight,
          }}>
            <button
              onClick={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: 'none',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              ←
            </button>
            
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#8E8E93' : '#666',
            }}>
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
            
            {totalSelected > 0 && (
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: currentStep.accent,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                padding: '4px 10px',
                borderRadius: 12,
              }}>
                {totalSelected} selected
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{
            height: 4,
            width: '100%',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderRadius: 2,
            marginBottom: 24,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: currentStep.accent,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Place Name Badge */}
          {placeName && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              padding: '6px 12px',
              borderRadius: 16,
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 12 }}>📍</span>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? '#8E8E93' : '#666',
              }}>
                {placeName}
              </span>
            </div>
          )}

          {/* Step Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontSize: 34,
              fontWeight: 800,
              color: isDark ? '#fff' : '#111',
              letterSpacing: -0.5,
              marginBottom: 8,
              lineHeight: 1.1,
            }}>
              {currentStep.icon} {currentStep.title}
            </h1>
            <p style={{
              fontSize: 18,
              color: isDark ? '#8E8E93' : '#666',
              fontWeight: 500,
            }}>
              {currentStep.subtitle}
            </p>
          </div>

          {/* Heads Up Warning */}
          {currentStep.id === 'heads_up' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
              border: '2px solid #F43F5E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <span style={{
                flex: 1,
                color: isDark ? '#FCA5A5' : '#991B1B',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.4,
              }}>
                Heads Up taps that don't receive another tap within 6 months will automatically fade away.
              </span>
            </div>
          )}

          {/* Signal Selection Card */}
          <div style={{
            backgroundColor: isDark ? '#1C1C1E' : '#fff',
            borderRadius: 24,
            padding: 16,
            minHeight: 200,
            boxShadow: isDark ? 'none' : '0 10px 20px rgba(0,0,0,0.05)',
            border: isDark ? '1px solid #38383A' : 'none',
          }}>
            {/* Selection count */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <span style={{
                fontSize: 12,
                color: isDark ? '#636366' : '#999',
              }}>
                {currentStepSelectedCount}/{currentStep.limit} selected
              </span>
              <span style={{
                fontSize: 12,
                color: isDark ? '#636366' : '#999',
              }}>
                Tap to select · Tap again to increase intensity
              </span>
            </div>

            {/* Signal Grid */}
            {signals[currentStep.id].length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ color: isDark ? '#8E8E93' : '#666', fontSize: 16 }}>
                  No signals available for this category
                </p>
                <p style={{ color: isDark ? '#636366' : '#999', fontSize: 14, marginTop: 8 }}>
                  Generic signals will be shown instead
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                {signals[currentStep.id].map((signal) => {
                  const count = tapCounts[signal.id] || 0;
                  const isSelected = count > 0;
                  
                  return (
                    <button
                      key={signal.id}
                      onClick={() => handleTap(signal.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 14px',
                        borderRadius: 20,
                        border: isSelected 
                          ? `2px solid ${currentStep.accent}` 
                          : `1px solid ${isDark ? '#38383A' : '#E5E5EA'}`,
                        backgroundColor: isSelected 
                          ? (isDark ? `${currentStep.accent}20` : `${currentStep.accent}15`)
                          : (isDark ? '#2C2C2E' : '#F5F5F5'),
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{signal.icon_emoji}</span>
                      <span style={{
                        fontSize: 14,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected 
                          ? currentStep.accent 
                          : (isDark ? '#fff' : '#333'),
                      }}>
                        {signal.label}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#fff',
                          backgroundColor: currentStep.accent,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 2,
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {submitError && (
            <div style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#FEE2E2',
              borderRadius: 12,
              color: '#991B1B',
              fontSize: 14,
              textAlign: 'center',
            }}>
              {submitError}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '24px 0 40px',
          }}>
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: 16,
                  border: `1px solid ${isDark ? '#38383A' : '#E5E5EA'}`,
                  backgroundColor: 'transparent',
                  color: isDark ? '#fff' : '#333',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '16px 24px',
                borderRadius: 16,
                border: 'none',
                backgroundColor: currentStep.accent,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isSubmitting ? 'Submitting...' : (isLastStep ? 'Submit Review' : 'Next →')}
            </button>
          </div>

          {/* Skip option */}
          {!isLastStep && (
            <div style={{ textAlign: 'center', paddingBottom: 24 }}>
              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#636366' : '#999',
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Skip this step
              </button>
            </div>
          )}
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
