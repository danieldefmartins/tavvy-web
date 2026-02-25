/**
 * LinkEditor — single link item editor with platform icon, title, url, and remove.
 */

import React from 'react';
import { IoTrash, IoReorderTwo } from 'react-icons/io5';
import { getPlatformIcon, SOCIAL_PLATFORMS } from './PlatformPicker';
import { LinkItem } from '../../../../lib/ecard';

interface LinkEditorProps {
  link: LinkItem;
  onUpdateTitle: (title: string) => void;
  onUpdateUrl: (url: string) => void;
  onRemove: () => void;
  isDark?: boolean;
}

export default function LinkEditor({
  link,
  onUpdateTitle,
  onUpdateUrl,
  onRemove,
  isDark = false,
}: LinkEditorProps) {
  const inputBg = isDark ? '#1E293B' : '#fff';
  const inputColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      background: cardBg,
      border: `1px solid ${borderColor}`,
      alignItems: 'flex-start',
    }}>
      {/* Drag handle + platform icon */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        paddingTop: 4,
        flexShrink: 0,
      }}>
        <IoReorderTwo size={16} color={isDark ? '#64748B' : '#9CA3AF'} />
        {getPlatformIcon(link.platform, 20)}
      </div>

      {/* Fields */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={link.title || ''}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder={`${platform?.name || link.platform} title`}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: inputBg,
            color: inputColor,
            outline: 'none',
          }}
        />
        <input
          type="text"
          value={link.url || link.value || ''}
          onChange={(e) => onUpdateUrl(e.target.value)}
          placeholder={platform?.placeholder || 'URL or value'}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            fontSize: 13,
            backgroundColor: inputBg,
            color: inputColor,
            outline: 'none',
          }}
        />
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          borderRadius: 6,
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        <IoTrash size={16} color="#EF4444" />
      </button>
    </div>
  );
}
