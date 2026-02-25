/**
 * AdvancedSection — form block config, pro credentials, service area.
 * Only shown for pro templates. Collapsed by default.
 */

import React from 'react';
import EditorField from '../shared/EditorField';
import { useEditor } from '../../../../lib/ecard/EditorContext';

interface AdvancedSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function AdvancedSection({ isDark, isPro }: AdvancedSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const creds = card.pro_credentials || {};
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const toggleBadge = (field: string) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value: !(card as any)[field] });
  };

  const ToggleRow = ({ label, field, checked }: { label: string; field: string; checked: boolean }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${borderColor}`,
    }}>
      <span style={{ fontSize: 14, color: isDark ? '#E2E8F0' : '#374151' }}>{label}</span>
      <button
        onClick={() => toggleBadge(field)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? '#00C853' : (isDark ? '#334155' : '#D1D5DB'),
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 10, background: '#fff',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div>
      {/* Professional Badges */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{
          fontSize: 14, fontWeight: 600, marginBottom: 8,
          color: isDark ? '#E2E8F0' : '#374151',
        }}>
          Professional Badges
        </h4>
        <ToggleRow label="Licensed" field="show_licensed_badge" checked={!!card.show_licensed_badge} />
        <ToggleRow label="Insured" field="show_insured_badge" checked={!!card.show_insured_badge} />
        <ToggleRow label="Bonded" field="show_bonded_badge" checked={!!card.show_bonded_badge} />
        <ToggleRow label="Tavvy Verified" field="show_tavvy_verified_badge" checked={!!card.show_tavvy_verified_badge} />
      </div>

      {/* Professional Category */}
      <EditorField
        label="Professional Category"
        value={card.professional_category || ''}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'professional_category' as any, value: v })}
        placeholder="e.g. Real Estate, Marketing"
        isDark={isDark}
      />

      {/* Form Block Toggle */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{
          fontSize: 14, fontWeight: 600, marginBottom: 8,
          color: isDark ? '#E2E8F0' : '#374151',
        }}>
          Contact Form
        </h4>
        <ToggleRow
          label="Show contact form on card"
          field="form_block"
          checked={!!card.form_block}
        />
        <p style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>
          When enabled, visitors can send you messages through your card.
        </p>
      </div>
    </div>
  );
}
