/**
 * StyleSection -- Template, color scheme, gradients, banner, logo,
 * photo size, button style, font, and font color.
 */

import React, { useState } from 'react';
import { IoBrush, IoLockClosed } from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { PHOTO_SIZES, BUTTON_STYLES } from '../../../../lib/ecard';
import { FONTS } from '../../../../config/eCardFonts';
import EditorSection from '../shared/EditorSection';
import ImageUploader from '../shared/ImageUploader';
import TemplatePicker from '../shared/TemplatePicker';
import ColorSchemePicker from '../shared/ColorSchemePicker';

interface StyleSectionProps {
  isDark: boolean;
  isPro: boolean;
}

const FONT_COLOR_OPTIONS: { id: string | null; label: string; color: string | null }[] = [
  { id: null, label: 'Auto', color: null },
  { id: '#000000', label: 'Black', color: '#000000' },
  { id: '#FFFFFF', label: 'White', color: '#FFFFFF' },
];

export default function StyleSection({ isDark, isPro }: StyleSectionProps) {
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

  const handleTemplateSelect = (templateId: string, colorSchemeId?: string) => {
    dispatch({ type: 'SET_TEMPLATE', templateId, colorSchemeId });
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    dispatch({ type: 'SET_FIELD', field: 'color_scheme_id', value: schemeId });
  };

  const handleBannerSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    dispatch({ type: 'SET_FIELD', field: 'banner_image_url', value: previewUrl });
    dispatch({ type: 'SET_PENDING_UPLOAD', key: 'banner_image', file });
  };

  const handleBannerRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'banner_image_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'banner_image' });
  };

  const handleLogoSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    dispatch({ type: 'SET_FIELD', field: 'company_logo_url', value: previewUrl });
    dispatch({ type: 'SET_PENDING_UPLOAD', key: 'logo', file });
  };

  const handleLogoRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'company_logo_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'logo' });
  };

  const isCustomFontColor =
    card.font_color != null && !['#000000', '#FFFFFF'].includes(card.font_color);

  return (
    <EditorSection
      id="style"
      title="Style & Design"
      icon={<IoBrush size={20} />}
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Template Picker ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Template</SectionLabel>
        <TemplatePicker
          selectedTemplateId={card.template_id || 'classic'}
          onSelect={handleTemplateSelect}
          isPro={isPro}
          isDark={isDark}
        />
      </div>

      {/* ===== Color Scheme ===== */}
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

      {/* ===== Gradient Colors ===== */}
      <div style={{ marginBottom: 28 }}>
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
        {/* Preview */}
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

      {/* ===== Banner Image ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Banner Image</SectionLabel>
        <ImageUploader
          imageUrl={card.banner_image_url}
          onFileSelect={handleBannerSelect}
          onRemove={handleBannerRemove}
          label="Upload Banner"
          shape="banner"
          isDark={isDark}
        />
      </div>

      {/* ===== Company Logo ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Company Logo</SectionLabel>
        <ImageUploader
          imageUrl={card.company_logo_url}
          onFileSelect={handleLogoSelect}
          onRemove={handleLogoRemove}
          label="Upload Logo"
          shape="rounded"
          width={60}
          isDark={isDark}
        />
      </div>

      {/* ===== Photo Size ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Photo Size</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PHOTO_SIZES.map((size) => {
            const isSelected = (card.profile_photo_size || 'medium') === size.id;
            return (
              <button
                key={size.id}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'profile_photo_size', value: size.id })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? '#00C853' : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#00C853' : textPrimary,
                  transition: 'all 0.15s',
                }}
              >
                {size.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Button Style ===== */}
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
                  border: `2px solid ${isSelected ? '#00C853' : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#00C853' : textPrimary,
                  transition: 'all 0.15s',
                }}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Button Color ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Button Color</SectionLabel>
        <p style={{ fontSize: 12, color: textSecondary, margin: '0 0 10px' }}>
          Override the default button background. Leave on Auto to use theme colors.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'button_color', value: null })}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `2px solid ${!card.button_color ? '#00C853' : borderColor}`,
              background: !card.button_color
                ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                : cardBg,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: !card.button_color ? 600 : 400,
              color: !card.button_color ? '#00C853' : textPrimary,
            }}
          >
            Auto
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={card.button_color || '#f8f9fa'}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'button_color', value: e.target.value })}
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
              value={card.button_color || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  dispatch({ type: 'SET_FIELD', field: 'button_color', value: v });
                }
              }}
              placeholder="#f8f9fa"
              maxLength={7}
              style={{
                width: 90,
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
      </div>

      {/* ===== Icon Color ===== */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel isDark={isDark}>Icon Color</SectionLabel>
        <p style={{ fontSize: 12, color: textSecondary, margin: '0 0 10px' }}>
          Override the default icon accent color. Leave on Auto to use theme colors.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'icon_color', value: null })}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `2px solid ${!card.icon_color ? '#00C853' : borderColor}`,
              background: !card.icon_color
                ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                : cardBg,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: !card.icon_color ? 600 : 400,
              color: !card.icon_color ? '#00C853' : textPrimary,
            }}
          >
            Auto
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={card.icon_color || '#333333'}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'icon_color', value: e.target.value })}
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
              value={card.icon_color || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  dispatch({ type: 'SET_FIELD', field: 'icon_color', value: v });
                }
              }}
              placeholder="#333333"
              maxLength={7}
              style={{
                width: 90,
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
      </div>

      {/* ===== Font Selector ===== */}
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
                  border: `2px solid ${isSelected ? '#00C853' : borderColor}`,
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
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                    }}
                  >
                    <IoLockClosed size={10} color={textSecondary} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Font Color ===== */}
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
                  border: `2px solid ${isSelected ? '#00C853' : borderColor}`,
                  background: isSelected
                    ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                    : cardBg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#00C853' : textPrimary,
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
              border: `2px solid ${isCustomFontColor ? '#00C853' : borderColor}`,
              background: isCustomFontColor
                ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                : cardBg,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isCustomFontColor ? 600 : 400,
              color: isCustomFontColor ? '#00C853' : textPrimary,
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

        {/* Custom color picker (shown when custom is selected) */}
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
    </EditorSection>
  );
}

/* ===== Helper Components ===== */

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
