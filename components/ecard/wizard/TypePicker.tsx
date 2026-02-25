/**
 * TypePicker — Step 1 of creation wizard: choose card type.
 * Business, Personal, or Politician (with inline country picker).
 */

import React, { useState, useMemo } from 'react';
import {
  IoBusinessOutline, IoPerson, IoFlagOutline,
  IoChevronForward, IoChevronBack, IoSearch, IoClose,
} from 'react-icons/io5';

const ACCENT = '#00C853';

const COUNTRIES = [
  { code: 'BR', name: 'Brazil', nameLocal: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}', featured: true, template: 'civic-card' },
  { code: 'US', name: 'United States', nameLocal: 'Estados Unidos', flag: '\u{1F1FA}\u{1F1F8}', featured: false, template: 'politician-generic' },
  { code: 'GB', name: 'United Kingdom', nameLocal: 'Reino Unido', flag: '\u{1F1EC}\u{1F1E7}', featured: false, template: 'politician-generic' },
  { code: 'CA', name: 'Canada', nameLocal: 'Canad\u00e1', flag: '\u{1F1E8}\u{1F1E6}', featured: false, template: 'politician-generic' },
  { code: 'MX', name: 'Mexico', nameLocal: 'M\u00e9xico', flag: '\u{1F1F2}\u{1F1FD}', featured: false, template: 'politician-generic' },
  { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', nameLocal: 'Argentina', featured: false, template: 'politician-generic' },
  { code: 'CO', name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}', nameLocal: 'Colombia', featured: false, template: 'politician-generic' },
  { code: 'PT', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}', nameLocal: 'Portugal', featured: false, template: 'politician-generic' },
  { code: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', nameLocal: 'Espa\u00f1a', featured: false, template: 'politician-generic' },
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}', nameLocal: 'France', featured: false, template: 'politician-generic' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', nameLocal: 'Deutschland', featured: false, template: 'politician-generic' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', nameLocal: 'Australia', featured: false, template: 'politician-generic' },
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}', nameLocal: '\u092d\u093e\u0930\u0924', featured: false, template: 'politician-generic' },
  { code: 'NG', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', nameLocal: 'Nigeria', featured: false, template: 'politician-generic' },
  { code: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', nameLocal: '\u65e5\u672c', featured: false, template: 'politician-generic' },
];

interface TypePickerProps {
  onSelect: (type: string, countryCode?: string, template?: string) => void;
  isDark: boolean;
}

export default function TypePicker({ onSelect, isDark }: TypePickerProps) {
  const [showCountries, setShowCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : '#888888';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7';

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.nameLocal.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  if (showCountries) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setShowCountries(false)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
            <IoChevronBack size={22} color={textPrimary} />
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, margin: 0 }}>Select your country</h2>
            <p style={{ fontSize: 13, color: textSecondary, margin: '2px 0 0' }}>Choose where the politician operates</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12, marginBottom: 16,
          background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
          border: `1px solid ${border}`,
        }}>
          <IoSearch size={18} color={textSecondary} />
          <input
            type="text" placeholder="Search country..." value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: textPrimary }}
            autoFocus
          />
          {countrySearch && (
            <button onClick={() => setCountrySearch('')} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}>
              <IoClose size={16} color={textSecondary} />
            </button>
          )}
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => onSelect('politician', country.code, country.template)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 12, width: '100%',
                background: country.featured ? (isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.06)') : 'transparent',
                border: country.featured ? `1.5px solid ${ACCENT}33` : 'none',
                borderBottom: country.featured ? undefined : `1px solid ${border}`,
                cursor: 'pointer', textAlign: 'left', marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{country.flag}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: country.featured ? 600 : 500, color: textPrimary, display: 'block' }}>{country.name}</span>
                {country.nameLocal !== country.name && <span style={{ fontSize: 12, color: textSecondary }}>{country.nameLocal}</span>}
              </div>
              {country.featured && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: ACCENT, color: '#fff' }}>Civic Card</span>
              )}
              <IoChevronForward size={16} color={textSecondary} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const TYPE_OPTIONS = [
    { id: 'business', name: 'Business', desc: 'For your company, store, or service', icon: IoBusinessOutline, gradient: ['#3B82F6', '#1D4ED8'] },
    { id: 'personal', name: 'Personal', desc: 'Your personal brand & link page', icon: IoPerson, gradient: ['#8B5CF6', '#6D28D9'] },
    { id: 'politician', name: 'Politician', desc: 'For public servants & candidates', icon: IoFlagOutline, gradient: [ACCENT, '#00A843'] },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: textPrimary, margin: '0 0 8px' }}>What kind of card?</h2>
      <p style={{ fontSize: 15, color: textSecondary, margin: '0 0 24px' }}>Select the type that best fits your needs</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TYPE_OPTIONS.map(({ id, name, desc, icon: Icon, gradient }) => (
          <button
            key={id}
            onClick={() => id === 'politician' ? setShowCountries(true) : onSelect(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', borderRadius: 16,
              background: cardBg, border: `1px solid ${border}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'transform 0.15s',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={26} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: 17, fontWeight: 600, color: textPrimary, display: 'block' }}>{name}</span>
              <span style={{ fontSize: 13, color: textSecondary }}>{desc}</span>
            </div>
            <IoChevronForward size={18} color={textSecondary} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
