import React, { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { EvidenceSubject } from '../lib/placeEvidence';
import { SignalTapSelection } from '../lib/signalTapSelection';
import { ComposerSignal, reviewComposerSections, toggleReviewChoice, visibleReviewChoices } from '../lib/reviewComposer';

export default function ReviewChoices({ signals, subject, selected, onChange, disabled = false, maxSelections = 100 }: {
  signals: ComposerSignal[]; subject?: EvidenceSubject; selected: SignalTapSelection;
  onChange: (next: SignalTapSelection) => void; disabled?: boolean; maxSelections?: number;
}) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const sections = reviewComposerSections(signals, subject, query);
  const choices = signals.filter(signal => selected[signal.id]);
  const atLimit = Object.keys(selected).length >= maxSelections;
  return <div className="review-choices">
    <p className="help">{copy('Choose what you experienced. Tap again to remove. Every section is optional.')}</p>
    <label className="search"><Search size={17} aria-hidden="true"/><input type="search" value={query} disabled={disabled} onChange={event => setQuery(event.target.value)} placeholder={copy('Find a word')} aria-label={copy('Find a word')}/></label>
    {sections.filter(section => section.signals.length).map(section => {
      const all = !!query.trim() || expanded.includes(section.key);
      const visible = visibleReviewChoices(section, selected, all, section.key === 'main' ? 8 : 4);
      return <section className={section.key} key={section.key} aria-label={copy(section.title)}>
        <h3>{copy(section.title)}</h3>
        <div className="choices">{visible.map(signal => <button type="button" className={`choice ${selected[signal.id] ? 'selected' : ''}`} key={signal.id} aria-pressed={!!selected[signal.id]} disabled={disabled || (atLimit && !selected[signal.id])} onClick={() => onChange(toggleReviewChoice(selected, signal.id))}>
          {selected[signal.id] && <Check size={15} aria-hidden="true"/>}<span>{signal.label}</span>{selected[signal.id] > 1 && <small>×{selected[signal.id]}</small>}
        </button>)}</div>
        {!query.trim() && section.signals.length > (section.key === 'main' ? 8 : 4) && <button type="button" className="more" disabled={disabled} aria-expanded={all} onClick={() => setExpanded(previous => all ? previous.filter(key => key !== section.key) : [...previous, section.key])}>{copy(all ? 'Show less' : 'More words')}</button>}
      </section>;
    })}
    {!sections.some(section => section.signals.length) && <p role="status" className="help">{copy(query.trim() ? 'No matching words. Your selections are kept.' : 'Review words are unavailable. Please try again.')}</p>}
    {atLimit && <p role="status" className="help">{copy('Selection limit reached. Remove a word to choose another.')}</p>}
    {choices.length > 0 && <details className="emphasis"><summary>{copy('Add emphasis (optional)')}</summary><p className="help">{copy('Emphasis describes your experience. It never counts as extra people.')}</p>{choices.map(signal => <div className="strength" key={signal.id}><span>{signal.label}</span><div role="group" aria-label={signal.label}>{[1, 2, 3].map(value => <button type="button" key={value} disabled={disabled} aria-pressed={selected[signal.id] === value} aria-label={`${signal.label} · ${value}`} onClick={() => onChange({ ...selected, [signal.id]: value })}>{value}</button>)}</div></div>)}</details>}
    <style jsx>{`
      .help{font-size:13px;line-height:20px;color:${theme.textSecondary};margin:0 0 14px}.search{display:flex;gap:9px;align-items:center;min-height:44px;padding:0 12px;border-radius:12px;background:${theme.surface};border:1px solid ${theme.border};color:${theme.textSecondary}}input{font:inherit;font-size:14px;width:100%;min-width:0;padding:11px 0;border:0;background:transparent;color:${theme.text};outline:none}.search:focus-within{outline:2px solid ${theme.primary}}section{padding:17px 0 14px;border-bottom:1px solid ${theme.border}}h3{font-size:14px;margin:0 0 10px;color:${theme.text};font-weight:650}.main h3{font-size:19px;color:${isDark ? '#D9B6FF' : '#74209A'}}.choices{display:flex;flex-wrap:wrap;gap:8px}.choice{display:inline-flex;align-items:center;gap:6px;min-height:44px;border:1px solid ${theme.border};border-radius:12px;padding:10px 12px;color:${theme.text};background:${theme.background};font:inherit;font-size:14px;text-align:start;cursor:pointer}.choice.selected{background:${isDark ? '#33213F' : '#F4EAF9'};border-color:${isDark ? '#D9B6FF' : '#8A05BE'};font-weight:600}.choice small{font-size:11px}.more{font:inherit;font-size:12px;min-height:44px;border:0;background:none;color:${isDark ? '#D9B6FF' : theme.primary};cursor:pointer;padding:8px 0}button:focus-visible,summary:focus-visible{outline:3px solid ${theme.primary};outline-offset:2px}button:disabled{opacity:.6;cursor:default}.emphasis{padding:15px 0}.emphasis summary{font-size:13px;color:${theme.textSecondary};cursor:pointer;min-height:32px}.strength{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:8px 0;font-size:13px;color:${theme.text}}.strength>div{display:flex;flex-shrink:0;gap:5px}.strength button{min-width:44px;min-height:44px;border:1px solid ${theme.border};border-radius:9px;background:${theme.surface};color:${theme.text};cursor:pointer}.strength button[aria-pressed=true]{border-color:${theme.primary};font-weight:750}
    `}</style>
  </div>;
}
