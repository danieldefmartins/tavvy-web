/**
 * TemplatePicker — horizontal scroll carousel of realistic card previews.
 * Renders each template using FullCardPreview at ~0.28 scale.
 */

import React from 'react';
import { TEMPLATES, Template } from '../../../../config/eCardTemplates';
import { FullCardPreview } from '../../wizard/FullCardPreview';
import { IoLockClosed } from 'react-icons/io5';

const ACCENT = '#00C853';
const PREVIEW_SCALE = 0.28;
const CONTAINER_WIDTH = 140;
const CONTAINER_HEIGHT = 220;
const INNER_WIDTH = Math.round(CONTAINER_WIDTH / PREVIEW_SCALE); // ~500

interface TemplatePickerProps {
  selectedTemplateId: string;
  onSelect: (templateId: string, colorSchemeId?: string) => void;
  isPro: boolean;
  isDark?: boolean;
  filterCategory?: string;
}

// Group templates for filtering
const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  business: ['biz-traditional', 'biz-modern', 'biz-minimalist', 'business-card', 'pro-card', 'pro-corporate', 'pro-creative', 'cover-card', 'mobile-business'],
  personal: ['basic', 'blogger', 'full-width', 'premium-static', 'pro-realtor'],
  politician: ['civic-card', 'civic-card-flag', 'civic-card-bold', 'civic-card-clean', 'civic-card-rally', 'politician-generic'],
};

export default function TemplatePicker({
  selectedTemplateId,
  onSelect,
  isPro,
  isDark = false,
  filterCategory,
}: TemplatePickerProps) {
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  const filtered = filterCategory
    ? TEMPLATES.filter(t => TEMPLATE_CATEGORIES[filterCategory]?.includes(t.id))
    : TEMPLATES;

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      paddingBottom: 4,
      marginLeft: -2,
      marginRight: -2,
      paddingLeft: 2,
      paddingRight: 2,
    }}>
      {filtered.map((template) => {
        const isSelected = selectedTemplateId === template.id;
        const isLocked = template.isPremium && !isPro;
        const firstScheme = template.colorSchemes[0];

        return (
          <button
            key={template.id}
            onClick={() => {
              if (isLocked) return;
              onSelect(template.id, firstScheme?.id);
            }}
            style={{
              flexShrink: 0,
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 8,
              paddingBottom: 10,
              borderRadius: 14,
              border: `2px solid ${isSelected ? ACCENT : border}`,
              background: cardBg,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.2s',
              textAlign: 'center',
              width: CONTAINER_WIDTH + 16,
            }}
          >
            {/* Scaled card preview */}
            <div style={{
              width: CONTAINER_WIDTH,
              height: CONTAINER_HEIGHT,
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 8,
              position: 'relative',
              backgroundColor: firstScheme?.cardBg || firstScheme?.primary || '#333',
            }}>
              <div style={{
                width: INNER_WIDTH,
                transformOrigin: 'top left',
                transform: `scale(${PREVIEW_SCALE})`,
              }}>
                <FullCardPreview tmpl={template} />
              </div>

              {/* Lock overlay */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IoLockClosed size={14} color="#fff" />
                  </div>
                </div>
              )}

              {/* Selected check */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: ACCENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Template name + badge */}
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: textPrimary,
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: CONTAINER_WIDTH,
            }}>
              {template.name}
            </span>
            <span style={{
              fontSize: 10,
              color: textSecondary,
              lineHeight: 1.3,
            }}>
              {template.isPremium ? 'Pro' : 'Free'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
