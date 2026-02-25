/**
 * SocialSection -- Featured social icons (max 4) with URL input for each.
 */

import React, { useState } from 'react';
import { IoShareSocial, IoClose, IoAdd } from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import PlatformPicker, { FEATURED_PLATFORMS, getPlatformIcon } from '../shared/PlatformPicker';
import { PLATFORM_ICONS } from '../../../../lib/ecard';

interface SocialSectionProps {
  isDark: boolean;
  isPro: boolean;
}

const MAX_FEATURED = 4;

export default function SocialSection({ isDark, isPro }: SocialSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const featuredSocials = card.featured_socials || [];
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleBg = isDark ? '#1E293B' : '#F3F4F6';
  const toggleActive = '#00C853';
  const toggleInactive = isDark ? '#475569' : '#D1D5DB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';

  const handleAddSocial = (platformId: string) => {
    if (featuredSocials.length >= MAX_FEATURED) return;
    dispatch({ type: 'ADD_FEATURED_SOCIAL', social: { platform: platformId, url: '' } });
    setPickerOpen(false);
  };

  const handleUpdateUrl = (platform: string, url: string) => {
    dispatch({ type: 'UPDATE_FEATURED_SOCIAL', platform, url });
  };

  const handleRemove = (platform: string) => {
    dispatch({ type: 'REMOVE_FEATURED_SOCIAL', platform });
  };

  const excludedIds = featuredSocials.map((s) => s.platform);

  return (
    <EditorSection
      id="social"
      title="Featured Socials"
      icon={<IoShareSocial size={20} />}
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Show Social Icons Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          padding: '10px 14px',
          borderRadius: 10,
          background: toggleBg,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: textPrimary }}>
          Show social icons on card
        </span>
        <button
          onClick={() =>
            dispatch({ type: 'SET_FIELD', field: 'show_social_icons', value: !card.show_social_icons })
          }
          style={{
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: card.show_social_icons !== false ? toggleActive : toggleInactive,
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: card.show_social_icons !== false ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: 10,
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      {/* Current Featured Socials */}
      {featuredSocials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {featuredSocials.map((social) => {
            const platformInfo = FEATURED_PLATFORMS.find((p) => p.id === social.platform);
            const iconInfo = PLATFORM_ICONS[social.platform];

            return (
              <div
                key={social.platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                {/* Platform icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: iconInfo?.bgColor || '#8E8E93',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getPlatformIcon(social.platform, 18, '#fff')}
                </div>

                {/* URL input */}
                <input
                  type="text"
                  value={social.url || ''}
                  onChange={(e) => handleUpdateUrl(social.platform, e.target.value)}
                  placeholder={`${platformInfo?.name || social.platform} URL`}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 8,
                    fontSize: 13,
                    backgroundColor: inputBg,
                    color: inputColor,
                    outline: 'none',
                  }}
                />

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(social.platform)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 6,
                    cursor: 'pointer',
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  <IoClose size={18} color="#EF4444" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Count indicator */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: textSecondary }}>
          {featuredSocials.length} / {MAX_FEATURED} selected
        </span>
      </div>

      {/* Add button / Picker */}
      {featuredSocials.length < MAX_FEATURED && (
        <>
          {!pickerOpen ? (
            <button
              onClick={() => setPickerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                border: `1px dashed ${borderColor}`,
                borderRadius: 10,
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: '#00C853',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <IoAdd size={18} />
              Add Social
            </button>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: textSecondary }}>
                  Choose a platform
                </span>
                <button
                  onClick={() => setPickerOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <IoClose size={18} color={textSecondary} />
                </button>
              </div>
              <PlatformPicker
                platforms={FEATURED_PLATFORMS}
                onSelect={handleAddSocial}
                excludeIds={excludedIds}
                isDark={isDark}
              />
            </div>
          )}
        </>
      )}
    </EditorSection>
  );
}
