/**
 * QuickSetup — Step 3 of creation wizard: name, photo, primary color, create.
 */

import React, { useRef, useState } from 'react';
import { IoArrowBack, IoCamera } from 'react-icons/io5';

const ACCENT = '#00C853';

const QUICK_COLORS = [
  '#3B82F6', '#8B5CF6', '#00C853', '#EF4444', '#F59E0B',
  '#EC4899', '#14B8A6', '#1E293B', '#D4AF37', '#0EA5E9',
];

interface QuickSetupProps {
  onBack: () => void;
  onCreate: (data: { fullName: string; title: string; photoFile: File | null; primaryColor: string }) => void;
  creating: boolean;
  isDark: boolean;
}

export default function QuickSetup({ onBack, onCreate, creating, isDark }: QuickSetupProps) {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(QUICK_COLORS[0]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#fff' : '#333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const canCreate = fullName.trim().length >= 2;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
          <IoArrowBack size={22} color={textPrimary} />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: textPrimary, margin: 0 }}>Quick Setup</h2>
          <p style={{ fontSize: 14, color: textSecondary, margin: '2px 0 0' }}>You can edit everything later</p>
        </div>
      </div>

      {/* Photo */}
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div
          onClick={() => photoInputRef.current?.click()}
          style={{
            width: 100, height: 100, borderRadius: '50%', cursor: 'pointer',
            background: photoPreview ? 'none' : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
            border: `2px dashed ${photoPreview ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <IoCamera size={28} color={isDark ? '#64748B' : '#9CA3AF'} />
              <div style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>Photo</div>
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: textSecondary, marginBottom: 6 }}>
          Full Name *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', border: `1px solid ${borderColor}`,
            borderRadius: 12, fontSize: 16, backgroundColor: inputBg, color: inputColor,
            outline: 'none',
          }}
        />
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: textSecondary, marginBottom: 6 }}>
          Title / Role
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. CEO, Designer, Agent"
          style={{
            width: '100%', padding: '14px 16px', border: `1px solid ${borderColor}`,
            borderRadius: 12, fontSize: 16, backgroundColor: inputBg, color: inputColor,
            outline: 'none',
          }}
        />
      </div>

      {/* Primary Color */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: textSecondary, marginBottom: 10 }}>
          Primary Color
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setPrimaryColor(color)}
              style={{
                width: 38, height: 38, borderRadius: 12, border: `2px solid ${primaryColor === color ? '#fff' : 'transparent'}`,
                background: color, cursor: 'pointer', padding: 0,
                boxShadow: primaryColor === color ? `0 0 0 2px ${color}` : 'none',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={() => onCreate({ fullName, title, photoFile, primaryColor })}
        disabled={!canCreate || creating}
        style={{
          width: '100%', padding: '16px 24px', border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed',
          background: canCreate ? `linear-gradient(135deg, ${ACCENT}, #00A843)` : (isDark ? '#334155' : '#D1D5DB'),
          color: canCreate ? '#fff' : textSecondary,
          boxShadow: canCreate ? '0 4px 20px rgba(0,200,83,0.35)' : 'none',
          opacity: creating ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        {creating ? 'Creating...' : 'Create Card'}
      </button>
    </div>
  );
}
