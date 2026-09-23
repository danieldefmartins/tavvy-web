const HEADS_UP_ACK_KEY = '@tavvy_headsup_ack';
import React, { useId, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { EvidenceSubject } from '../lib/placeEvidence';
import { SignalTapSelection } from '../lib/signalTapSelection';
import { ComposerSignal, reviewComposerSections, reviewChoiceIntensity, toggleComposerChoice, emphasizeComposerChoice, selectedReviewChoices, visibleReviewChoices, ComposerChoice } from '../lib/reviewComposer';

export default function ReviewChoices({ signals, subject, selected, onChange, disabled = false, maxSelections = 100 }: {
  signals: ComposerSignal[]; subject?: EvidenceSubject; selected: SignalTapSelection;
  onChange: (next: SignalTapSelection) => void; disabled?: boolean; maxSelections?: number;
}) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [headsUpPrompt, setHeadsUpPrompt] = useState<ComposerChoice | null>(null);
  // First Heads Up in a review gets a one-time explanation: it counts against the place. Remembered per browser.
  const pick = (choice: ComposerChoice) => {
    if (choice.signal_type === 'heads_up' && !reviewChoiceIntensity(selected, choice)) {
      let seen = false; try { seen = !!localStorage.getItem(HEADS_UP_ACK_KEY); } catch {}
      if (!seen) { setHeadsUpPrompt(choice); return; }
    }
    onChange(toggleComposerChoice(selected, choice));
  };
  const confirmHeadsUp = () => { if (!headsUpPrompt) return; try { localStorage.setItem(HEADS_UP_ACK_KEY, new Date().toISOString()); } catch {} onChange(toggleComposerChoice(selected, headsUpPrompt)); setHeadsUpPrompt(null); };
  const sections = reviewComposerSections(signals, subject, query).filter(section => section.signals.length);
  const choices = selectedReviewChoices(signals, selected);
  const atLimit = Object.keys(selected).length >= maxSelections;
  const searching = !!query.trim();
  const activeKey = active ?? sections[0]?.key;
  const accent = isDark ? '#D9B6FF' : theme.primary;
  return <div className="review-choices">
    <p className="help">{copy('Choose what you experienced. Tap again to remove. Every section is optional.')}</p>
    <label className="search"><Search size={17} aria-hidden="true"/><input type="search" value={query} disabled={disabled} onChange={event => setQuery(event.target.value)} placeholder={copy('Find a word')} aria-label={copy('Find a word')}/></label>
    {sections.map(section => {
      const open = searching || activeKey === section.key;
      const all = searching || expanded.includes(section.key);
      const count = section.signals.filter(choice => reviewChoiceIntensity(selected, choice)).length;
      const visible = visibleReviewChoices(section, selected, all, 8);
      return <section className={section.key} key={section.key} aria-label={copy(section.title)}>
        <h3><button type="button" className="section-toggle" aria-expanded={open} aria-controls={`${id}-${section.key}`} disabled={disabled || searching} onClick={() => setActive(open ? '' : section.key)}>
          <span>{copy(section.title)}</span>{count > 0 && <span className="count">{count}<Check size={12} aria-hidden="true"/></span>}<ChevronDown className={open ? 'up' : ''} size={18} aria-hidden="true"/>
        </button></h3>
        {open && <div id={`${id}-${section.key}`} className="section-body">
          <div className="choices">{visible.map(choice => {
            const intensity = reviewChoiceIntensity(selected, choice);
            return <button type="button" className={`choice ${intensity ? 'selected' : ''}`} key={choice.id} aria-pressed={!!intensity} disabled={disabled || (atLimit && !intensity)} onClick={() => pick(choice)}>
              {intensity > 0 && <Check size={15} aria-hidden="true"/>}<span>{choice.label}</span>{intensity > 1 && <small>×{intensity}</small>}
            </button>;
          })}</div>
          {!searching && section.signals.length > 8 && <button type="button" className="more" disabled={disabled} aria-expanded={all} onClick={() => setExpanded(previous => all ? previous.filter(key => key !== section.key) : [...previous, section.key])}>{copy(all ? 'Show less' : 'More words')}</button>}
        </div>}
      </section>;
    })}
    {headsUpPrompt && <div role="dialog" aria-modal="true" aria-labelledby={`${id}-headsup`} className="headsup-note">
      <h4 id={`${id}-headsup`}>{copy('A quick note on Heads Up')}</h4>
      <p>{copy('Heads Up tells other people what to watch out for, and it counts against this place. Add it when it would genuinely help someone decide.')}</p>
      <div className="headsup-actions"><button type="button" className="secondary" onClick={() => setHeadsUpPrompt(null)}>{copy('Not now')}</button><button type="button" className="primary" onClick={confirmHeadsUp}>{copy('Add it')}</button></div>
    </div>}
    {!sections.length && <p role="status" className="help">{copy(searching ? 'No matching words. Your selections are kept.' : 'Review words are unavailable. Please try again.')}</p>}
    {atLimit && <p role="status" className="help">{copy('Selection limit reached. Remove a word to choose another.')}</p>}
    {choices.length > 0 && <details className="emphasis"><summary>{copy('Add emphasis (optional)')}</summary><p className="help">{copy('Emphasis describes your experience. It never counts as extra people.')}</p>{choices.map(choice => <div className="strength" key={choice.id}><span>{choice.label}</span><div role="group" aria-label={choice.label}>{[1, 2, 3].map(value => <button type="button" key={value} disabled={disabled} aria-pressed={reviewChoiceIntensity(selected, choice) === value} aria-label={`${choice.label} · ${value}`} onClick={() => onChange(emphasizeComposerChoice(selected, choice, value))}>{value}</button>)}</div></div>)}</details>}
    <style jsx>{`
      .headsup-note{margin:0 0 14px;padding:14px 16px;border-radius:14px;border:1px solid rgba(245,166,35,.45);background:rgba(245,166,35,.10)}.headsup-note h4{margin:0 0 6px;font-size:15px;color:${theme.text}}.headsup-note p{margin:0 0 12px;font-size:14px;line-height:1.5;color:${theme.textSecondary}}.headsup-actions{display:flex;gap:10px;justify-content:flex-end}.headsup-actions button{font:inherit;min-height:40px;padding:0 16px;border-radius:10px;cursor:pointer;border:1px solid ${theme.border};background:transparent;color:${theme.text}}.headsup-actions .primary{background:#8A05BE;border-color:#8A05BE;color:#fff;font-weight:600}
      .help{font-size:13px;line-height:20px;color:${theme.textSecondary};margin:0 0 14px}.search{display:flex;gap:9px;align-items:center;min-height:44px;padding:0 12px;margin-bottom:10px;border-radius:12px;background:${theme.surface};border:1px solid ${theme.border};color:${theme.textSecondary}}input{font:inherit;font-size:14px;width:100%;min-width:0;padding:11px 0;border:0;background:transparent;color:${theme.text};outline:none}.search:focus-within{outline:2px solid ${accent}}
      section{border-bottom:1px solid ${theme.border}}h3{margin:0}.section-toggle{display:flex;align-items:center;gap:9px;width:100%;min-height:56px;padding:12px 0;border:0;background:none;color:${theme.text};font:inherit;font-size:15px;font-weight:650;cursor:pointer;text-align:start}.section-toggle>span:first-child{flex:1}.main .section-toggle{font-size:18px;color:${accent}}.section-toggle:disabled{opacity:1}.section-toggle :global(.up){transform:rotate(180deg)}.count{display:inline-flex;align-items:center;gap:4px;background:${isDark ? '#33213F' : '#F4EAF9'};color:${accent};padding:4px 7px;border-radius:8px;font-size:12px}.section-body{padding-bottom:16px}.choices{display:flex;flex-wrap:wrap;gap:8px}.choice{display:inline-flex;align-items:center;gap:6px;min-height:44px;max-width:100%;border:1px solid ${theme.border};border-radius:12px;padding:10px 12px;color:${theme.text};background:${theme.background};font:inherit;font-size:14px;text-align:start;cursor:pointer}.choice.selected{background:${isDark ? '#33213F' : '#F4EAF9'};border-color:${accent};font-weight:600}.choice small{font-size:11px}.more{font:inherit;font-size:13px;min-height:44px;border:0;background:none;color:${accent};cursor:pointer;padding:8px 0}button:focus-visible,summary:focus-visible{outline:3px solid ${accent};outline-offset:2px}button:disabled{opacity:.6;cursor:default}.emphasis{padding:15px 0}.emphasis summary{font-size:13px;color:${theme.textSecondary};cursor:pointer;min-height:44px;display:flex;align-items:center}.strength{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:8px 0;font-size:13px;color:${theme.text}}.strength>div{display:flex;flex-shrink:0;gap:5px}.strength button{min-width:44px;min-height:44px;border:1px solid ${theme.border};border-radius:9px;background:${theme.surface};color:${theme.text};cursor:pointer}.strength button[aria-pressed=true]{border-color:${accent};font-weight:750}
    `}</style>
  </div>;
}
