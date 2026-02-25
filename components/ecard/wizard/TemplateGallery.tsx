/**
 * TemplateGallery — Step 2 of creation wizard: choose template.
 * Larger previews than the editor's TemplatePicker.
 */

import React from 'react';
import { TEMPLATES, Template, ColorScheme } from '../../../config/eCardTemplates';
import { IoLockClosed, IoArrowBack } from 'react-icons/io5';

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
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';

  // Filter templates by card type
  const templates = TEMPLATES.filter(t => {
    const category = TEMPLATE_CATEGORIES[cardType];
    if (category) return category.includes(t.id);
    return true;
  });

  // If politician with specific country template, put that first
  const sorted = countryTemplate
    ? [...templates.filter(t => t.id === countryTemplate), ...templates.filter(t => t.id !== countryTemplate)]
    : templates;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
          <IoArrowBack size={22} color={textPrimary} />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: textPrimary, margin: 0 }}>Choose your look</h2>
          <p style={{ fontSize: 14, color: textSecondary, margin: '2px 0 0' }}>Pick a template to start with</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorted.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const isLocked = template.isPremium && !isPro;
          const firstScheme = template.colorSchemes[0];

          return (
            <div key={template.id}>
              {/* Template card */}
              <button
                onClick={() => {
                  if (isLocked) return;
                  onSelect(template.id, firstScheme.id);
                }}
                style={{
                  width: '100%',
                  position: 'relative',
                  borderRadius: 16,
                  border: `2px solid ${isSelected ? ACCENT : border}`,
                  background: cardBg,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.6 : 1,
                  overflow: 'hidden',
                  textAlign: 'left',
                  padding: 0,
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Preview gradient */}
                <div style={{
                  height: 120,
                  background: `linear-gradient(135deg, ${firstScheme.primary}, ${firstScheme.secondary || firstScheme.primary})`,
                  position: 'relative',
                }}>
                  {isLocked && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <IoLockClosed size={12} color="#fff" />
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Pro</span>
                    </div>
                  )}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      width: 26, height: 26, borderRadius: 13, background: ACCENT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, display: 'block', marginBottom: 4 }}>
                    {template.name}
                  </span>
                  <span style={{ fontSize: 13, color: textSecondary, lineHeight: 1.4 }}>
                    {template.description}
                  </span>
                </div>
              </button>

              {/* Color scheme dots below selected template */}
              {isSelected && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingLeft: 4, flexWrap: 'wrap' }}>
                  {template.colorSchemes.map((scheme) => {
                    const isSchemeSelected = selectedColorSchemeId === scheme.id;
                    const schemeLocked = !scheme.isFree && !isPro;
                    return (
                      <button
                        key={scheme.id}
                        onClick={() => !schemeLocked && onSelect(template.id, scheme.id)}
                        title={scheme.name}
                        style={{
                          width: 32, height: 32, borderRadius: 10, padding: 0,
                          border: `2px solid ${isSchemeSelected ? ACCENT : 'transparent'}`,
                          background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary || scheme.primary})`,
                          cursor: schemeLocked ? 'not-allowed' : 'pointer',
                          opacity: schemeLocked ? 0.4 : 1,
                          transition: 'border-color 0.2s',
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
