/**
 * ContactSection -- Email, phone, website, location, address, and contact visibility toggle.
 */

import React, { useState } from 'react';
import { IoCall, IoChevronDown } from 'react-icons/io5';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';

interface ContactSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function ContactSection({ isDark, isPro }: ContactSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [addressOpen, setAddressOpen] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const toggleBg = isDark ? '#1E293B' : '#F3F4F6';
  const toggleActive = '#00C853';
  const toggleInactive = isDark ? '#475569' : '#D1D5DB';
  const labelColor = isDark ? '#94A3B8' : '#6B7280';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const collapsibleBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <EditorSection
      id="contact"
      title="Contact Info"
      icon={<IoCall size={20} />}
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Show Contact Info Toggle */}
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
          Show contact info on card
        </span>
        <button
          onClick={() => handleFieldChange('show_contact_info', !card.show_contact_info)}
          style={{
            position: 'relative',
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: card.show_contact_info !== false ? toggleActive : toggleInactive,
            transition: 'background 0.2s',
            padding: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: card.show_contact_info !== false ? 22 : 2,
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

      {/* Email */}
      <EditorField
        label="Email"
        value={card.email || ''}
        onChange={(v) => handleFieldChange('email', v)}
        placeholder="you@example.com"
        type="email"
        isDark={isDark}
      />

      {/* Phone */}
      <EditorField
        label="Phone"
        value={card.phone || ''}
        onChange={(v) => handleFieldChange('phone', v)}
        placeholder="+1 (555) 123-4567"
        type="tel"
        isDark={isDark}
      />

      {/* Website */}
      <EditorField
        label="Website"
        value={card.website || ''}
        onChange={(v) => handleFieldChange('website', v)}
        placeholder="https://yourwebsite.com"
        type="url"
        isDark={isDark}
      />

      {/* Website Label */}
      <EditorField
        label="Website Label"
        value={card.website_label || ''}
        onChange={(v) => handleFieldChange('website_label', v)}
        placeholder="e.g. Visit My Site"
        isDark={isDark}
        maxLength={40}
      />

      {/* City / Location */}
      <EditorField
        label="City / Location"
        value={card.city || ''}
        onChange={(v) => handleFieldChange('city', v)}
        placeholder="e.g. San Francisco, CA"
        isDark={isDark}
      />

      {/* Collapsible Full Address */}
      <div
        style={{
          marginTop: 6,
          border: `1px solid ${collapsibleBorder}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setAddressOpen(!addressOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '12px 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            gap: 8,
          }}
        >
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: labelColor, textAlign: 'left' }}>
            Full Address (optional)
          </span>
          <IoChevronDown
            size={14}
            color={labelColor}
            style={{
              transition: 'transform 0.2s',
              transform: addressOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {addressOpen && (
          <div style={{ padding: '0 14px 14px' }}>
            <EditorField
              label="Address Line 1"
              value={card.address_1 || ''}
              onChange={(v) => handleFieldChange('address_1', v)}
              placeholder="123 Main Street"
              isDark={isDark}
            />
            <EditorField
              label="Address Line 2"
              value={card.address_2 || ''}
              onChange={(v) => handleFieldChange('address_2', v)}
              placeholder="Suite 100"
              isDark={isDark}
            />
            <EditorField
              label="ZIP / Postal Code"
              value={card.zip_code || ''}
              onChange={(v) => handleFieldChange('zip_code', v)}
              placeholder="94102"
              isDark={isDark}
              maxLength={10}
            />
          </div>
        )}
      </div>
    </EditorSection>
  );
}
