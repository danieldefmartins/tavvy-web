/**
 * ZipCodePrompt — Modal that prompts users to enter their ZIP code
 * Shown when a user without a ZIP code tries to endorse or review
 */
import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface ZipCodePromptProps {
  isOpen: boolean;
  isDark: boolean;
  onSubmit: (zipCode: string, address?: { line1?: string; city?: string; state?: string; country?: string }) => void;
  onClose: () => void;
}

export default function ZipCodePrompt({ isOpen, isDark, onSubmit, onClose }: ZipCodePromptProps) {
  const { t } = useTranslation('common');
  const [zipCode, setZipCode] = useState('');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', country: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!zipCode.trim()) {
      setError(t('geo.zipRequired', 'Please enter your ZIP code'));
      return;
    }
    onSubmit(
      zipCode.trim(),
      showFullAddress ? {
        line1: address.line1.trim() || undefined,
        city: address.city.trim() || undefined,
        state: address.state.trim() || undefined,
        country: address.country.trim() || undefined,
      } : undefined
    );
  };

  const bg = isDark ? '#1E293B' : '#fff';
  const text = isDark ? '#F1F5F9' : '#1F2937';
  const textSec = isDark ? '#94A3B8' : '#6B7280';
  const inputBg = isDark ? '#0F172A' : '#F9FAFB';
  const inputBorder = isDark ? '#334155' : '#D1D5DB';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: bg, borderRadius: 16, padding: 24,
        maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
          <h3 style={{ color: text, fontSize: 20, fontWeight: 700, margin: 0 }}>
            {t('geo.whereAreYou', 'Where are you from?')}
          </h3>
          <p style={{ color: textSec, fontSize: 14, margin: '8px 0 0' }}>
            {t('geo.helpTransparency', 'This helps provide transparency about where endorsements and reviews come from.')}
          </p>
        </div>

        {/* ZIP Code (required) */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: textSec, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
            {t('geo.zipCode', 'ZIP Code')} *
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={e => { setZipCode(e.target.value); setError(''); }}
            placeholder="e.g. 33101"
            maxLength={10}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${error ? '#EF4444' : inputBorder}`,
              backgroundColor: inputBg, color: text, fontSize: 16,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
        </div>

        {/* Optional full address toggle */}
        <button
          onClick={() => setShowFullAddress(!showFullAddress)}
          style={{
            background: 'none', border: 'none', color: '#6366F1',
            fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12,
          }}
        >
          {showFullAddress
            ? t('geo.hideAddress', '− Hide full address')
            : t('geo.addAddress', '+ Add full address (optional)')
          }
        </button>

        {/* Full address fields */}
        {showFullAddress && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={address.line1}
              onChange={e => setAddress({ ...address, line1: e.target.value })}
              placeholder={t('geo.addressLine', 'Street address')}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${inputBorder}`, backgroundColor: inputBg,
                color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={address.city}
                onChange={e => setAddress({ ...address, city: e.target.value })}
                placeholder={t('geo.city', 'City')}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${inputBorder}`, backgroundColor: inputBg,
                  color: text, fontSize: 14, outline: 'none',
                }}
              />
              <input
                type="text"
                value={address.state}
                onChange={e => setAddress({ ...address, state: e.target.value })}
                placeholder={t('geo.state', 'State')}
                style={{
                  width: 80, padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${inputBorder}`, backgroundColor: inputBg,
                  color: text, fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <input
              type="text"
              value={address.country}
              onChange={e => setAddress({ ...address, country: e.target.value })}
              placeholder={t('geo.country', 'Country')}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${inputBorder}`, backgroundColor: inputBg,
                color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: 14, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff', fontSize: 16, fontWeight: 600,
            border: 'none', cursor: 'pointer', marginTop: 8,
          }}
        >
          {t('geo.continue', 'Continue')}
        </button>

        <p style={{ color: textSec, fontSize: 11, textAlign: 'center', margin: '12px 0 0' }}>
          {t('geo.privacy', 'Your exact address is never shared publicly. Only aggregated ZIP code data is shown.')}
        </p>
      </div>
    </div>
  );
}
