/**
 * CivicSection — political/civic card fields.
 * Only shown when template is civic-card* or politician-generic.
 */

import React from 'react';
import EditorField from '../shared/EditorField';
import { useEditor } from '../../../../lib/ecard/EditorContext';

interface CivicSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function CivicSection({ isDark }: CivicSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  const set = (field: string, value: string) =>
    dispatch({ type: 'SET_FIELD', field: field as any, value });

  return (
    <div>
      <EditorField
        label="Ballot Number"
        value={card.ballot_number || ''}
        onChange={(v) => set('ballot_number', v)}
        placeholder="e.g. 12345"
        isDark={isDark}
      />
      <EditorField
        label="Party Name"
        value={card.party_name || ''}
        onChange={(v) => set('party_name', v)}
        placeholder="e.g. Democratic Party"
        isDark={isDark}
      />
      <EditorField
        label="Office Running For"
        value={card.office_running_for || ''}
        onChange={(v) => set('office_running_for', v)}
        placeholder="e.g. Mayor, City Council"
        isDark={isDark}
      />
      <EditorField
        label="Election Year"
        value={card.election_year || ''}
        onChange={(v) => set('election_year', v)}
        placeholder="e.g. 2026"
        type="number"
        isDark={isDark}
      />
      <EditorField
        label="Campaign Slogan"
        value={card.campaign_slogan || ''}
        onChange={(v) => set('campaign_slogan', v)}
        placeholder="Your campaign slogan"
        isDark={isDark}
      />
      <EditorField
        label="Region"
        value={card.region || ''}
        onChange={(v) => set('region', v)}
        placeholder="e.g. São Paulo, District 5"
        isDark={isDark}
      />
    </div>
  );
}
