import { coreForCategory, EvidenceSubject, isCoreSignal } from './placeEvidence';
import { matchesSignalSearch, SignalTapSelection } from './signalTapSelection';

export interface ComposerSignal { id: string; slug: string; label: string; signal_type: 'best_for' | 'vibe' | 'heads_up'; icon_emoji?: string }
export interface ComposerSection { key: 'main' | 'good' | 'vibe' | 'headsup'; title: string; signals: ComposerSignal[] }

/** A neutral first section. Both praise and concerns are visible before expansion. */
export function reviewComposerSections(signals: ComposerSignal[], subject?: EvidenceSubject, query = ''): ComposerSection[] {
  const filtered = signals.filter(signal => matchesSignalSearch(signal, query));
  const main = filtered.filter(signal => isCoreSignal(subject, signal));
  const mainIds = new Set(main.map(signal => signal.id));
  const praise = main.filter(signal => signal.signal_type !== 'heads_up');
  const concerns = main.filter(signal => signal.signal_type === 'heads_up');
  const balanced: ComposerSignal[] = [];
  for (let index = 0; index < Math.max(praise.length, concerns.length); index++) {
    if (praise[index]) balanced.push(praise[index]);
    if (concerns[index]) balanced.push(concerns[index]);
  }
  return [
    { key: 'main', title: coreForCategory(subject).label, signals: balanced },
    { key: 'good', title: 'The Good', signals: filtered.filter(signal => signal.signal_type === 'best_for' && !mainIds.has(signal.id)) },
    { key: 'vibe', title: coreForCategory(subject).vibeLabel || 'The Vibe', signals: filtered.filter(signal => signal.signal_type === 'vibe' && !mainIds.has(signal.id)) },
    { key: 'headsup', title: 'Heads Up', signals: filtered.filter(signal => signal.signal_type === 'heads_up' && !mainIds.has(signal.id)) },
  ];
}

/** A second tap removes the choice; saved emphasis survives until explicitly edited. */
export function toggleReviewChoice(selection: SignalTapSelection, id: string): SignalTapSelection {
  const next = { ...selection };
  if (next[id]) delete next[id]; else next[id] = 1;
  return next;
}

export function visibleReviewChoices(section: ComposerSection, selection: SignalTapSelection, expanded: boolean, limit = 6): ComposerSignal[] {
  if (expanded) return section.signals;
  const first = new Set(section.signals.slice(0, limit).map(signal => signal.id));
  return section.signals.filter(signal => first.has(signal.id) || !!selection[signal.id]);
}
