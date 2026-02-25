/**
 * ColorSchemePicker — color scheme swatches for the selected template.
 */

import React from 'react';
import { getTemplateById, ColorScheme } from '../../../../config/eCardTemplates';
import { IoLockClosed } from 'react-icons/io5';

interface ColorSchemePickerProps {
  templateId: string;
  selectedSchemeId: string | undefined;
  onSelect: (schemeId: string) => void;
  isPro: boolean;
  isDark?: boolean;
}

export default function ColorSchemePicker({
  templateId,
  selectedSchemeId,
  onSelect,
  isPro,
  isDark = false,
}: ColorSchemePickerProps) {
  const template = getTemplateById(templateId);
  if (!template) return null;

  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {template.colorSchemes.map((scheme) => {
        const isSelected = selectedSchemeId === scheme.id;
        const isLocked = !scheme.isFree && !isPro;

        return (
          <button
            key={scheme.id}
            onClick={() => !isLocked && onSelect(scheme.id)}
            title={scheme.name}
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `2px solid ${isSelected ? '#00C853' : 'transparent'}`,
              background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary || scheme.primary})`,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.5 : 1,
              transition: 'border-color 0.2s, transform 0.15s',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {isLocked && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
              }}>
                <IoLockClosed size={12} color="#fff" />
              </div>
            )}
            {isSelected && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
