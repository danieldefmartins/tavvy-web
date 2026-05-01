/**
 * Onboarding — First-time user introduction to Tavvy's signal system
 *
 * Shows a 3-step modal overlay explaining:
 * 1. Stars are dead — why Tavvy exists
 * 2. How signals work — The Good, The Vibe, Heads Up
 * 3. Start exploring — CTA to dismiss and begin
 *
 * Only shows once per device (localStorage flag: tavvy_onboarded)
 */

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'tavvy_onboarded';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Stars are dead.',
    subtitle: 'Welcome to the future of reviews.',
    description: 'A "4.5 stars" tells you nothing about the food, the vibe, or the service. Tavvy replaces meaningless numbers with real signals from real people.',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3, color: '#D4A843', textDecoration: 'line-through' }}>★★★★☆</div>
        <div style={{ fontSize: 14, color: '#6B6B80', fontStyle: 'italic' }}>What does this even mean?</div>
      </div>
    ),
  },
  {
    title: 'Three signal types.',
    subtitle: 'Everything you need to know, instantly.',
    description: 'Every place has three categories of signals. Tap to share what stood out — the more people agree, the stronger the signal becomes.',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C2CB', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>The Good</div>
            <div style={{ fontSize: 13, color: '#9394A1' }}>What this place does best</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 22 }}>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(0,194,203,0.12)', color: '#5EEAEF', border: '1px solid rgba(0,194,203,0.2)' }}>🍕 Amazing Food</span>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(0,194,203,0.12)', color: '#5EEAEF', border: '1px solid rgba(0,194,203,0.2)' }}>⏰ Punctual</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8A05BE', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>The Vibe</div>
            <div style={{ fontSize: 13, color: '#9394A1' }}>What it feels like</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 22 }}>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(138,5,190,0.12)', color: '#C77DFF', border: '1px solid rgba(138,5,190,0.2)' }}>🛋️ Cozy Vibes</span>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(138,5,190,0.12)', color: '#C77DFF', border: '1px solid rgba(138,5,190,0.2)' }}>💑 Date Night</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F5A623', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#F1F5F9' }}>Heads Up</div>
            <div style={{ fontSize: 13, color: '#9394A1' }}>What to watch out for</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 22 }}>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(245,166,35,0.12)', color: '#FFB84D', border: '1px solid rgba(245,166,35,0.2)' }}>🐌 Slow Service</span>
          <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: 'rgba(245,166,35,0.12)', color: '#FFB84D', border: '1px solid rgba(245,166,35,0.2)' }}>💰 Cash Only</span>
        </div>
      </div>
    ),
  },
  {
    title: 'You\'re ready.',
    subtitle: 'Start exploring real experiences.',
    description: 'Browse places, tap signals that match your experience, and help others make confident decisions. No more guessing.',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 56 }}>🚀</div>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #8A05BE, #00C2CB)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Real experiences, not fake stars.
        </div>
      </div>
    ),
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="onboarding-overlay"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="onboarding-modal"
        style={{ transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)' }}
      >
        {/* Skip button */}
        {!isLast && (
          <button className="onboarding-skip" onClick={handleSkip}>
            Skip
          </button>
        )}

        {/* Visual */}
        <div className="onboarding-visual">
          {current.visual}
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-subtitle">{current.subtitle}</p>
          <p className="onboarding-description">{current.description}</p>
        </div>

        {/* Dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="onboarding-dot"
              style={{
                background: i === step ? '#8A05BE' : 'rgba(255,255,255,0.15)',
                width: i === step ? 24 : 8,
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button className="onboarding-cta" onClick={handleNext}>
          {isLast ? 'Start Exploring' : 'Next'}
        </button>
      </div>

      <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 24px;
          transition: opacity 0.3s ease;
        }

        .onboarding-modal {
          background: #1E0A3C;
          border-radius: 28px;
          padding: 40px 32px 32px;
          max-width: 420px;
          width: 100%;
          position: relative;
          border: 1px solid rgba(138, 5, 190, 0.2);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .onboarding-skip {
          position: absolute;
          top: 16px;
          right: 20px;
          background: none;
          border: none;
          color: #6B6B80;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
        }

        .onboarding-skip:hover {
          color: #9394A1;
        }

        .onboarding-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;
          margin-bottom: 28px;
        }

        .onboarding-content {
          text-align: center;
          margin-bottom: 28px;
        }

        .onboarding-title {
          font-size: 28px;
          font-weight: 900;
          color: #F1F5F9;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .onboarding-subtitle {
          font-size: 16px;
          font-weight: 600;
          color: #00C2CB;
          margin-bottom: 12px;
        }

        .onboarding-description {
          font-size: 15px;
          color: #9394A1;
          line-height: 1.6;
          max-width: 340px;
          margin: 0 auto;
        }

        .onboarding-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-bottom: 24px;
        }

        .onboarding-dot {
          height: 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .onboarding-cta {
          width: 100%;
          padding: 16px;
          background: #8A05BE;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .onboarding-cta:hover {
          background: #9B10D4;
          transform: translateY(-1px);
        }

        @media (max-width: 480px) {
          .onboarding-modal {
            padding: 32px 24px 24px;
          }
          .onboarding-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to check if onboarding should be shown
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem(STORAGE_KEY);
      if (!onboarded) {
        setShowOnboarding(true);
      }
    } catch {}
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}
