/**
 * TemplateColorSection -- Template picker, color scheme, and gradient colors.
 * Split from the monolithic StyleSection for better UX.
 */

import React from 'react';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import TemplatePicker from '../shared/TemplatePicker';
import ColorSchemePicker from '../shared/ColorSchemePicker';

interface TemplateColorSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function TemplateColorSection({ isDark, isPro }: TemplateColorSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';

  const handleTemplateSelect = (templateId: string, colorSchemeId?: string) => {
    dispatch({ type: 'SET_TEMPLATE', templateId, colorSchemeId });
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    dispatch({ type: 'SET_FIELD', field: 'color_scheme_id', value: schemeId });
  };

  return (
    <>
      {/* Template Picker */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Template</SectionLabel>
        <TemplatePicker
          selectedTemplateId={card.template_id || 'classic'}
          onSelect={handleTemplateSelect}
          isPro={isPro}
          isDark={isDark}
        />
      </div>

      {/* Color Scheme */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Color Scheme</SectionLabel>
        <ColorSchemePicker
          templateId={card.template_id || 'classic'}
          selectedSchemeId={card.color_scheme_id}
          onSelect={handleColorSchemeSelect}
          isPro={isPro}
          isDark={isDark}
        />
      </div>

      {/* Gradient Colors */}
      <div>
        <SectionLabel isDark={isDark}>Gradient Colors</SectionLabel>
        <div style={{ display: 'flex', gap: 12 }}>
          <ColorInput
            label="Color 1"
            value={card.gradient_color_1 || '#667eea'}
            onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'gradient_color_1', value: v })}
            isDark={isDark}
          />
          <ColorInput
            label="Color 2"
            value={card.gradient_color_2 || '#764ba2'}
            onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'gradient_color_2', value: v })}
            isDark={isDark}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${card.gradient_color_1 || '#667eea'}, ${card.gradient_color_2 || '#764ba2'})`,
            border: `1px solid ${borderColor}`,
          }}
        />
      </div>
    </>
  );
}

/* ── Helper Components ── */

function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: isDark ? '#94A3B8' : '#6B7280',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {children}
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';
  const labelColor = isDark ? '#94A3B8' : '#6B7280';

  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: 12, color: labelColor, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 36,
            height: 36,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            cursor: 'pointer',
            padding: 2,
            background: inputBg,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          style={{
            flex: 1,
            padding: '8px 10px',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            fontSize: 13,
            backgroundColor: inputBg,
            color: inputColor,
            outline: 'none',
            fontFamily: 'monospace',
          }}
        />
      </div>
    </div>
  );
}
