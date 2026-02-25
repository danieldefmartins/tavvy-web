/**
 * ImageUploader — photo/banner/logo upload component with preview.
 */

import React, { useRef } from 'react';
import { IoCamera, IoTrash } from 'react-icons/io5';

interface ImageUploaderProps {
  imageUrl: string | null | undefined;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  label?: string;
  shape?: 'circle' | 'rounded' | 'banner';
  width?: number;
  height?: number;
  isDark?: boolean;
}

export default function ImageUploader({
  imageUrl,
  onFileSelect,
  onRemove,
  label = 'Upload Photo',
  shape = 'circle',
  width = 100,
  height,
  isDark = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const h = height || (shape === 'banner' ? 120 : width);

  const borderRadius = shape === 'circle' ? '50%' : shape === 'banner' ? 12 : 16;
  const placeholderBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          // Reset so same file can be re-selected
          e.target.value = '';
        }}
      />
      {imageUrl ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: shape === 'banner' ? '100%' : width,
            height: h,
            borderRadius,
            overflow: 'hidden',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: shape === 'banner' ? '100%' : width,
            height: h,
            borderRadius,
            background: placeholderBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            border: `2px dashed ${isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB'}`,
          }}
        >
          <IoCamera size={28} color={isDark ? '#64748B' : '#9CA3AF'} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
            color: isDark ? '#E2E8F0' : '#374151',
          }}
        >
          {imageUrl ? 'Change' : label}
        </button>
        {imageUrl && (
          <button
            onClick={onRemove}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <IoTrash size={12} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
