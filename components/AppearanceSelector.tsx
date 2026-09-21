import React from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

/** Changing the switch creates an explicit preference; the default follows the device. */
export default function AppearanceSelector() {
  const { setThemeMode, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  return <div className="appearance-switch-row">
    <span className="appearance-title">{copy('Appearance')}</span>
    <div className="appearance-control">
      <span className={!isDark ? 'active' : ''}>{copy('Light')}</span>
      <button type="button" role="switch" aria-label={copy('Dark mode')} aria-checked={isDark}
        onClick={() => setThemeMode(isDark ? 'light' : 'dark')} className={isDark ? 'switch on' : 'switch'}>
        <span className="thumb" />
      </button>
      <span className={isDark ? 'active' : ''}>{copy('Dark')}</span>
    </div>
    <style jsx>{`
      .appearance-switch-row{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;color:var(--text);font-size:15px}
      .appearance-title{font-weight:600}.appearance-control{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text-secondary)}
      .appearance-control .active{color:var(--text);font-weight:700}
      .switch{width:48px;height:28px;padding:3px;border:1px solid var(--border);border-radius:999px;background:#d8d8df;cursor:pointer;transition:background .18s;flex:none}
      .switch.on{background:var(--link)}.thumb{display:block;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0003;transition:transform .18s}.switch.on .thumb{transform:translateX(20px)}
      .switch:focus-visible{outline:3px solid var(--link);outline-offset:3px}
    `}</style>
  </div>;
}
