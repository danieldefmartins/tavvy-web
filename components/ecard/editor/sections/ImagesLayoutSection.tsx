/**
 * ImagesLayoutSection -- Banner, logo, photo size, and background type.
 * Split from the monolithic StyleSection for better UX.
 */

import React from 'react';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { PHOTO_SIZES } from '../../../../lib/ecard';
import ImageUploader from '../shared/ImageUploader';

interface ImagesLayoutSectionProps {
  isDark: boolean;
  isPro: boolean;
}

const ACCENT = '#00C853';

export default function ImagesLayoutSection({ isDark, isPro }: ImagesLayoutSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';

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

  return (
    <>
      {/* Banner Image */}
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

      {/* Company Logo */}
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

      {/* Photo Size */}
      <div>
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
                {size.name}
              </button>
            );
          })}
        </div>
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
