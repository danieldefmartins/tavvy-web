/**
 * MobileBusinessSection — menu editor + mobile business config.
 * Only shown when template is mobile-business.
 */

import React from 'react';
import EditorField from '../shared/EditorField';
import { useEditor } from '../../../../lib/ecard/EditorContext';

interface MobileBusinessSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function MobileBusinessSection({ isDark }: MobileBusinessSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <div>
      <p style={{ fontSize: 13, color: textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
        Configure your mobile business details. Menu items and live session features
        are managed from the live card page.
      </p>
      <EditorField
        label="Business Type"
        value={(card as any).business_type || ''}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'description' as any, value: v })}
        placeholder="e.g. Food Truck, Pop-up Shop"
        isDark={isDark}
      />
      <EditorField
        label="Specialties"
        value={card.description || ''}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'description' as any, value: v })}
        placeholder="e.g. Tacos, BBQ, Vegan bowls"
        multiline
        rows={2}
        isDark={isDark}
      />
    </div>
  );
}
