/**
 * TemplateGallery — Step 2 of creation wizard: choose template.
 * Full-size realistic card previews in a horizontal scroll-snap carousel.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { TEMPLATES, Template } from '../../../config/eCardTemplates';
import { IoLockClosed, IoArrowBack } from 'react-icons/io5';
import { FullCardPreview } from './FullCardPreview';

const ACCENT = '#00C853';

// Same category mapping as TemplatePicker
const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  business: ['biz-traditional', 'biz-modern', 'biz-minimalist', 'business-card', 'pro-card', 'pro-corporate', 'pro-creative', 'cover-card', 'mobile-business'],
  personal: ['basic', 'blogger', 'full-width', 'premium-static', 'pro-realtor'],
  politician: ['civic-card', 'civic-card-flag', 'civic-card-bold', 'civic-card-clean', 'civic-card-rally', 'politician-generic'],
};

interface TemplateGalleryProps {
  cardType: string;
  countryTemplate?: string; // Pre-selected template for politician flow
  selectedTemplateId: string | null;
  selectedColorSchemeId: string | null;
  onSelect: (templateId: string, colorSchemeId: string) => void;
  onBack: () => void;
  isPro: boolean;
  isDark: boolean;
}

export default function TemplateGallery({
  cardType,
  countryTemplate,
  selectedTemplateId,
  selectedColorSchemeId,
  onSelect,
  onBack,
  isPro,
  isDark,
}: TemplateGalleryProps) {
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const surfaceBg = isDark ? '#1A1A1A' : '#F5F5F5';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isInitialMount = useRef(true);

  // Filter templates by card type (memoized to stabilize useEffect deps)
  const sorted = useMemo(() => {
    const category = TEMPLATE_CATEGORIES[cardType];
    const filtered = category
      ? TEMPLATES.filter(t => category.includes(t.id))
      : TEMPLATES;

    // If politician with specific country template, put that first
    return countryTemplate
      ? [...filtered.filter(t => t.id === countryTemplate), ...filtered.filter(t => t.id !== countryTemplate)]
      : filtered;
  }, [cardType, countryTemplate]);

  // Set up IntersectionObserver to track the current visible card
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setCurrentIndex(idx);
            }
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: 0.5,
      }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observerRef.current!.observe(ref);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sorted.length]);

  // Auto-select when the current visible card changes
  useEffect(() => {
    if (sorted.length === 0) return;
    const template = sorted[currentIndex];
    if (!template) return;

    const isLocked = template.isPremium && !isPro;
    if (isLocked) return;

    // On initial mount, select the first template or the pre-selected one
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (selectedTemplateId) {
        // If we already have a selection, scroll to it
        const existingIdx = sorted.findIndex(t => t.id === selectedTemplateId);
        if (existingIdx >= 0 && existingIdx !== 0) {
          setTimeout(() => {
            cardRefs.current[existingIdx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }, 100);
          return;
        }
      }
    }

    // Select the current scheme or fall back to the first
    const currentSchemeId = selectedTemplateId === template.id && selectedColorSchemeId
      ? selectedColorSchemeId
      : template.colorSchemes[0]?.id;

    if (currentSchemeId) {
      onSelect(template.id, currentSchemeId);
    }
  }, [currentIndex, sorted, isPro]);

  // Get the currently visible template for showing color schemes
  const visibleTemplate = sorted[currentIndex] || null;
  const visibleSchemes = visibleTemplate?.colorSchemes || [];

  // Scroll to a specific dot
  const scrollToIndex = useCallback((index: number) => {
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
          <IoArrowBack size={22} color={textPrimary} />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: textPrimary, margin: 0 }}>Choose your look</h2>
          <p style={{ fontSize: 14, color: textSecondary, margin: '2px 0 0' }}>Swipe to browse templates</p>
        </div>
      </div>

      {/* Horizontal scroll-snap carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          gap: 16,
          padding: '0 5vw',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="template-gallery-scroll"
      >
        {sorted.map((template, index) => {
          const isSelected = selectedTemplateId === template.id;
          const isLocked = template.isPremium && !isPro;

          return (
            <div
              key={template.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              data-index={index}
              style={{
                flexShrink: 0,
                width: '90vw',
                maxWidth: 380,
                scrollSnapAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Phone frame */}
              <div
                onClick={() => {
                  if (!isLocked) {
                    onSelect(template.id, template.colorSchemes[0]?.id || '');
                  }
                }}
                style={{
                  width: '100%',
                  maxHeight: 540,
                  borderRadius: 28,
                  border: `3px solid ${isSelected ? ACCENT : border}`,
                  background: isDark ? '#111' : '#fff',
                  overflow: 'hidden',
                  boxShadow: isSelected
                    ? `0 8px 32px ${ACCENT}30`
                    : '0 4px 24px rgba(0,0,0,0.08)',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.65 : 1,
                  position: 'relative',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                }}
              >
                {/* Scaled preview container */}
                <div style={{
                  width: '181.8%', // ~100/0.55 to reverse the scale
                  transformOrigin: 'top left',
                  transform: 'scale(0.55)',
                  pointerEvents: 'none',
                }}>
                  <FullCardPreview tmpl={template} />
                </div>

                {/* Lock overlay for premium templates */}
                {isLocked && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 25,
                  }}>
                    <div style={{
                      padding: '8px 18px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(6px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <IoLockClosed size={16} color="#fff" />
                      <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>Pro</span>
                    </div>
                  </div>
                )}

                {/* Selection checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 30, height: 30, borderRadius: 15, background: ACCENT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Template name + badge below card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? textPrimary : textSecondary,
                  textAlign: 'center',
                }}>
                  {template.name}
                </span>
                {isLocked && (
                  <div style={{
                    padding: '2px 8px', borderRadius: 6,
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <IoLockClosed size={10} color={textSecondary} />
                    <span style={{ fontSize: 10, color: textSecondary, fontWeight: 600 }}>Pro</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
        flexWrap: 'wrap',
        padding: '0 20px',
      }}>
        {sorted.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            style={{
              width: currentIndex === index ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: currentIndex === index ? ACCENT : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'),
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 0.25s, background 0.25s',
            }}
          />
        ))}
      </div>

      {/* Color scheme swatches for the currently visible template */}
      {visibleTemplate && visibleSchemes.length > 1 && (
        <div style={{ marginTop: 16, padding: '0 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 8, textAlign: 'center' }}>
            Color schemes
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {visibleSchemes.map((scheme) => {
              const isSchemeSelected = selectedTemplateId === visibleTemplate.id && selectedColorSchemeId === scheme.id;
              const schemeLocked = !scheme.isFree && !isPro;
              return (
                <button
                  key={scheme.id}
                  onClick={() => !schemeLocked && onSelect(visibleTemplate.id, scheme.id)}
                  title={scheme.name}
                  style={{
                    width: 36, height: 36, borderRadius: 12, padding: 0,
                    border: `2.5px solid ${isSchemeSelected ? ACCENT : 'transparent'}`,
                    background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary || scheme.primary})`,
                    cursor: schemeLocked ? 'not-allowed' : 'pointer',
                    opacity: schemeLocked ? 0.35 : 1,
                    transition: 'border-color 0.2s, transform 0.15s',
                    transform: isSchemeSelected ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isSchemeSelected ? `0 2px 8px ${ACCENT}40` : '0 1px 4px rgba(0,0,0,0.1)',
                    position: 'relative',
                  }}
                >
                  {schemeLocked && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      <IoLockClosed size={10} color="#fff" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hide scrollbar with injected style */}
      <style>{`
        .template-gallery-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
