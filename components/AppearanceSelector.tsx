import React, { useId } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

/** Explicit appearance choices retain the device-following default. */
export default function AppearanceSelector() {
  const { themeMode, setThemeMode, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const id = useId();
  return <fieldset className="appearance-selector">
    <legend>{copy('Appearance')}</legend>
    <p>{copy('Choose how Tavvy looks on this device.')}</p>
    <div className="choices">
      {([
        ['system', 'Use device setting'],
        ['light', 'Light'],
        ['dark', 'Dark'],
      ] as const).map(([mode, label]) => <label key={mode} className={themeMode === mode ? 'selected' : ''}>
        <input type="radio" name={`appearance-${id}`} value={mode} checked={themeMode === mode}
          onChange={() => setThemeMode(mode)} />
        <span>{copy(label)}</span>
      </label>)}
    </div>
    <style jsx>{`
      .appearance-selector{border:0;margin:0;padding:0;min-width:0;width:100%;color:var(--text)}
      legend{padding:0;font-size:20px;font-weight:700;letter-spacing:-.3px}
      p{margin:6px 0 16px;font-size:14px;line-height:1.5;color:var(--text-secondary)}
      .choices{display:flex;flex-wrap:wrap;gap:8px}
      label{display:flex;align-items:center;gap:10px;min-height:48px;padding:12px 16px;border:1px solid var(--border);border-radius:12px;cursor:pointer;background:var(--surface);font-size:15px;line-height:1.4}
      label.selected{border-color:var(--link);background:${isDark ? '#3A254B' : '#F0E7F8'}}
      input{width:18px;height:18px;margin:0;flex-shrink:0;accent-color:var(--link)}
      label:focus-within{outline:3px solid var(--link);outline-offset:3px}
      @media(max-width:480px){.choices{display:grid;grid-template-columns:1fr 1fr}label:first-child{grid-column:1 / -1}}
    `}</style>
  </fieldset>;
}
