/**
 * TemplatePicker — template selection grid with previews.
 * Shows all templates, locks premium ones for non-pro users.
 */

import React from 'react';
import { TEMPLATES, Template } from '../../../../config/eCardTemplates';
import { IoLockClosed } from 'react-icons/io5';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onSelect: (templateId: string, colorSchemeId?: string) => void;
  isPro: boolean;
  isDark?: boolean;
  filterCategory?: string; // 'business' | 'personal' | 'politician' — used during creation
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
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
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
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 12,
              borderRadius: 14,
              border: `2px solid ${isSelected ? '#00C853' : border}`,
              background: cardBg,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              transition: 'border-color 0.2s, transform 0.15s',
              textAlign: 'center',
            }}
          >
            {/* Color preview swatch */}
            <div style={{
              width: '100%',
              height: 80,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${firstScheme?.primary || '#667eea'}, ${firstScheme?.secondary || '#764ba2'})`,
              marginBottom: 8,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <IoLockClosed size={12} color="#fff" />
                </div>
              )}
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: textPrimary,
              marginBottom: 2,
            }}>
              {template.name}
            </span>
            <span style={{
              fontSize: 11,
              color: textSecondary,
              lineHeight: 1.3,
            }}>
              {template.isPremium ? 'Pro' : 'Free'}
            </span>

            {/* Selected check */}
            {isSelected && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 22,
                height: 22,
                borderRadius: 11,
                background: '#00C853',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
