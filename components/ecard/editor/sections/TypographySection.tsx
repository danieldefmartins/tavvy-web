/**
 * TypographySection -- Font selector, font color, and button style.
 * Split from the monolithic StyleSection for better UX.
 */

import React, { useState } from 'react';
import { IoLockClosed } from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { BUTTON_STYLES } from '../../../../lib/ecard';
import { FONTS } from '../../../../config/eCardFonts';

interface TypographySectionProps {
  isDark: boolean;
  isPro: boolean;
}

const ACCENT = '#00C853';

const FONT_COLOR_OPTIONS: { id: string | null; label: string; color: string | null }[] = [
  { id: null, label: 'Auto', color: null },
  { id: '#000000', label: 'Black', color: '#000000' },
  { id: '#FFFFFF', label: 'White', color: '#FFFFFF' },
];

export default function TypographySection({ isDark, isPro }: TypographySectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [customFontColor, setCustomFontColor] = useState(
    card.font_color && !['#000000', '#FFFFFF'].includes(card.font_color)
      ? card.font_color
      : '#333333'
  );

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';

  const isCustomFontColor =
    card.font_color != null && !['#000000', '#FFFFFF'].includes(card.font_color);

  return (
    <>
      {/* Button Style */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Button Style</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BUTTON_STYLES.map((style) => {
            const isSelected = (card.button_style || 'fill') === style.id;
            return (
              <button
                key={style.id}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'button_style', value: style.id })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? ACCENT : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? ACCENT : textPrimary,
                  transition: 'all 0.15s',
                }}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Button Color */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Button Color</SectionLabel>
        <ColorSwatchPicker
          value={card.button_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'button_color', value: v })}
          isDark={isDark}
        />
      </div>

      {/* Icon Color */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Icon Color</SectionLabel>
        <ColorSwatchPicker
          value={card.icon_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'icon_color', value: v })}
          isDark={isDark}
        />
      </div>

      {/* Social Media Icon Color */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Social Media Icon Color</SectionLabel>
        <SocialIconColorPicker
          value={card.social_icon_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'social_icon_color', value: v })}
          isDark={isDark}
        />
      </div>

      {/* Font Selector */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Font</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {FONTS.map((font) => {
            const isSelected = (card.font_style || 'default') === font.id;
            const isLocked = font.isPremium && !isPro;

            return (
              <button
                key={font.id}
                onClick={() => {
                  if (isLocked) return;
                  dispatch({ type: 'SET_FIELD', field: 'font_style', value: font.id });
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? ACCENT : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: textPrimary,
                    fontWeight: font.style.fontWeight as any,
                    fontStyle: font.style.fontStyle,
                    letterSpacing: font.style.letterSpacing,
                  }}
                >
                  {font.preview}
                </span>
                <span style={{ fontSize: 10, color: textSecondary, textAlign: 'center' }}>
                  {font.name}
                </span>
                {isLocked && (
                  <div style={{ position: 'absolute', top: 4, right: 4 }}>
                    <IoLockClosed size={10} color={textSecondary} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Color */}
      <div>
        <SectionLabel isDark={isDark}>Font Color</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FONT_COLOR_OPTIONS.map((opt) => {
            const isSelected = card.font_color === opt.id;
            return (
              <button
                key={opt.label}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'font_color', value: opt.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? ACCENT : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? ACCENT : textPrimary,
                  transition: 'all 0.15s',
                }}
              >
                {opt.color ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: opt.color,
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                ) : null}
                {opt.label}
              </button>
            );
          })}

          {/* Custom color option */}
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'font_color', value: customFontColor })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              border: `2px solid ${isCustomFontColor ? ACCENT : borderColor}`,
              background: isCustomFontColor
                ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                : cardBg,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isCustomFontColor ? 600 : 400,
              color: isCustomFontColor ? ACCENT : textPrimary,
              transition: 'all 0.15s',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                background: customFontColor,
                border: `1px solid ${borderColor}`,
              }}
            />
            Custom
          </button>
        </div>

        {/* Custom color picker */}
        {isCustomFontColor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input
              type="color"
              value={card.font_color || customFontColor}
              onChange={(e) => {
                setCustomFontColor(e.target.value);
                dispatch({ type: 'SET_FIELD', field: 'font_color', value: e.target.value });
              }}
              style={{
                width: 40,
                height: 40,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                cursor: 'pointer',
                padding: 2,
                background: inputBg,
              }}
            />
            <input
              type="text"
              value={card.font_color || customFontColor}
              onChange={(e) => {
                const val = e.target.value;
                setCustomFontColor(val);
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                  dispatch({ type: 'SET_FIELD', field: 'font_color', value: val });
                }
              }}
              placeholder="#333333"
              maxLength={7}
              style={{
                width: 100,
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
        )}
      </div>
    </>
  );
}

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

const COLOR_PRESETS = [
  { color: '#1e293b', name: 'Navy' },
  { color: '#c9a84c', name: 'Gold' },
  { color: '#ef4444', name: 'Red' },
  { color: '#10b981', name: 'Green' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#f97316', name: 'Orange' },
  { color: '#111111', name: 'Black' },
  { color: '#f8f9fa', name: 'White' },
  { color: '#7A5330', name: 'Bronze' },
];

function ColorSwatchPicker({
  value,
  onChange,
  isDark,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  isDark: boolean;
}) {
  const [showCustom, setShowCustom] = React.useState(false);
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';

  const isPreset = value && COLOR_PRESETS.some(p => p.color === value);
  const isCustom = value && !isPreset;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        {/* Auto */}
        <button
          onClick={() => { onChange(null); setShowCustom(false); }}
          title="Auto (theme default)"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `2px solid ${!value ? ACCENT : borderColor}`,
            background: cardBg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
            color: !value ? ACCENT : (isDark ? '#94A3B8' : '#6B7280'),
            position: 'relative',
          }}
        >
          A
          {!value && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: ACCENT, border: `2px solid ${isDark ? '#1E293B' : '#fff'}` }} />
          )}
        </button>

        {/* Presets */}
        {COLOR_PRESETS.map((preset) => {
          const sel = value === preset.color;
          return (
            <button
              key={preset.color}
              onClick={() => { onChange(preset.color); setShowCustom(false); }}
              title={preset.name}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: `2px solid ${sel ? ACCENT : borderColor}`,
                background: preset.color, cursor: 'pointer',
                position: 'relative',
                boxShadow: sel ? '0 0 0 1px ' + ACCENT : 'none',
              }}
            >
              {sel && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: ACCENT, border: `2px solid ${isDark ? '#1E293B' : '#fff'}` }} />
              )}
            </button>
          );
        })}

        {/* Custom */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          title="Custom color"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `2px solid ${isCustom ? ACCENT : borderColor}`,
            background: isCustom ? value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
            cursor: 'pointer', position: 'relative',
          }}
        >
          {isCustom && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: ACCENT, border: `2px solid ${isDark ? '#1E293B' : '#fff'}` }} />
          )}
        </button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <input
            type="color"
            value={value || '#333333'}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: 40, height: 40,
              border: `1px solid ${borderColor}`,
              borderRadius: 8, cursor: 'pointer',
              padding: 2, background: inputBg,
            }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            placeholder="#333333"
            maxLength={7}
            style={{
              width: 100, padding: '8px 10px',
              border: `1px solid ${borderColor}`,
              borderRadius: 8, fontSize: 13,
              backgroundColor: inputBg, color: inputColor,
              outline: 'none', fontFamily: 'monospace',
            }}
          />
        </div>
      )}
    </div>
  );
}

const SOCIAL_ICON_OPTIONS: { id: string | null; label: string; swatch: string | null }[] = [
  { id: null, label: 'Standard', swatch: null },
  { id: '#FFFFFF', label: 'White', swatch: '#FFFFFF' },
  { id: '#000000', label: 'Black', swatch: '#000000' },
];

function SocialIconColorPicker({
  value,
  onChange,
  isDark,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  isDark: boolean;
}) {
  const [showCustom, setShowCustom] = React.useState(false);
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';

  const isPreset = value && SOCIAL_ICON_OPTIONS.some(o => o.id === value);
  const isCustom = value && !isPreset;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        {SOCIAL_ICON_OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <button
              key={opt.label}
              onClick={() => { onChange(opt.id); setShowCustom(false); }}
              title={opt.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `2px solid ${sel ? ACCENT : borderColor}`,
                background: sel
                  ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                  : cardBg,
                cursor: 'pointer', position: 'relative',
              }}
            >
              {opt.swatch && (
                <div style={{
                  width: 18, height: 18, borderRadius: 6,
                  background: opt.swatch,
                  border: `1px solid ${opt.swatch === '#FFFFFF' ? '#ddd' : 'transparent'}`,
                }} />
              )}
              <span style={{
                fontSize: 13, fontWeight: sel ? 600 : 500,
                color: sel ? ACCENT : (isDark ? '#94A3B8' : '#6B7280'),
              }}>
                {opt.label}
              </span>
            </button>
          );
        })}

        {/* Custom */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          title="Custom color"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 10,
            border: `2px solid ${isCustom ? ACCENT : borderColor}`,
            background: isCustom
              ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
              : cardBg,
            cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 6,
            background: isCustom ? value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
          }} />
          <span style={{
            fontSize: 13, fontWeight: isCustom ? 600 : 500,
            color: isCustom ? ACCENT : (isDark ? '#94A3B8' : '#6B7280'),
          }}>
            Custom
          </span>
        </button>
      </div>

      {showCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <input
            type="color"
            value={value || '#333333'}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: 40, height: 40,
              border: `1px solid ${borderColor}`,
              borderRadius: 8, cursor: 'pointer',
              padding: 2, background: inputBg,
            }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            placeholder="#333333"
            maxLength={7}
            style={{
              width: 100, padding: '8px 10px',
              border: `1px solid ${borderColor}`,
              borderRadius: 8, fontSize: 13,
              backgroundColor: inputBg, color: inputColor,
              outline: 'none', fontFamily: 'monospace',
            }}
          />
        </div>
      )}
    </div>
  );
}
