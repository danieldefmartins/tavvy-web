import React from 'react';
import { MENU_STYLES, menuAppearance } from '../lib/menuAppearance';
type Value = { style: string | null; photo_gallery_enabled?: boolean | null };
export default function MenuAppearanceSettings({ value, onChange }: { value: Value; onChange: (next: {style: string; photo_gallery_enabled: boolean}) => void }) {
  const selected = menuAppearance(value);
  return <fieldset id="appearance" className="appearance-settings"><legend>Menu design</legend>
    <p>Choose your menu’s look and how it opens. Guests can switch between the text menu and the photo menu with one tap.</p>
    <div className="appearance-options">{MENU_STYLES.map(option => <label key={option.value} className={`appearance-option ${selected.style === option.value ? 'selected' : ''}`}>
      <input type="radio" name="menu-style" value={option.value} checked={selected.style === option.value} onChange={() => onChange({ style: option.value, photo_gallery_enabled: selected.galleryEnabled })} />
      <span className={`appearance-preview ${option.value}`} aria-hidden="true"><b>At our table</b><span>Fresh pasta</span><small>Tomato, basil, parmesan · 24</small>{option.value === 'visual' && <span className="preview-photo">Photo</span>}</span>
      <strong>{option.label}</strong><span>{option.description}</span>
    </label>)}</div>
    <label className="appearance-gallery"><input type="checkbox" checked={selected.galleryEnabled} onChange={e => onChange({ style: selected.style, photo_gallery_enabled: e.target.checked })} /> Photo gallery</label>
    <p>Keep the full-screen photo menu available with every design. Turning it off keeps your uploaded images for later.</p>
    <style jsx>{`.appearance-settings{border:0;padding:0;margin:16px 0;color:var(--text,#28251f)}legend{font-weight:700;font-size:20px}.appearance-settings p{font-size:14px;line-height:1.5;color:var(--text-secondary,#635d53)}.appearance-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.appearance-option{display:flex;flex-direction:column;gap:8px;border:2px solid var(--border,#ddd);padding:14px;border-radius:14px;cursor:pointer;min-width:0}.appearance-option.selected{border-color:#7e22a2}.appearance-option>span:last-child{font-size:13px;line-height:1.5}.appearance-option input{align-self:flex-start;min-width:20px;min-height:20px}.appearance-preview{display:flex;flex-direction:column;gap:6px;padding:18px 12px;min-height:136px;background:#fff;color:#28251f;box-shadow:0 1px 5px #0001;font-family:Arial,sans-serif}.appearance-preview.elegant_ivory{background:#f7f3ea;font-family:Georgia,serif}.appearance-preview b{font-size:18px}.appearance-preview small{font-size:10px}.preview-photo{border-radius:8px;padding:10px;background:#e8ddd1;text-align:center;font-size:11px}.appearance-gallery{display:flex;gap:10px;align-items:center;min-height:48px;margin-top:16px;font-weight:600}.appearance-gallery input{width:20px;height:20px}`}</style>
  </fieldset>;
}
