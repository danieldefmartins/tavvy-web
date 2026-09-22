import { coreForCategory, EvidenceSubject, isCoreSignal } from './placeEvidence';
import { matchesSignalSearch, SignalTapSelection } from './signalTapSelection';

export interface ComposerSignal { id: string; slug: string; label: string; signal_type: 'best_for' | 'vibe' | 'heads_up'; icon_emoji?: string }
export interface ComposerChoice extends ComposerSignal { sources: ComposerSignal[] }
export interface ComposerSection { key: 'main' | 'good' | 'vibe' | 'headsup'; title: string; signals: ComposerChoice[] }

const normalized = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s\-_.,!?&'’/()]+/g, ' ').trim();
// Deliberate synonyms only. Slow kitchen/service, quiet rooms/atmosphere, etc.
// describe different experiences and must remain separate.
const synonyms = [
  ['Great Food', 'Amazing Food', 'Delicious Food'],
  ['Great Cocktails', 'Good Cocktails'],
  ['Good for Dates', 'Perfect Date Spot', 'Date Night Perfect', 'Date Night'],
  ['Good for Groups', 'Great for Groups'],
  ['Outdoor Seating', 'Outdoor Dining'],
  ['Trendy', 'Trendy Spot'],
  ['Lively', 'Lively & Energetic', 'Buzzy & Energetic'],
  ['Noisy', 'Very Noisy'],
  ['Great Wine List', 'Excellent Wine List'],
  ['Needs Cleaning', 'Dirty'],
];
const aliases = new Map(synonyms.flatMap(labels => labels.map(label => [normalized(label), normalized(labels[0])] as const)));
const preferred = new Map(synonyms.map(labels => [normalized(labels[0]), labels[0]]));

/** Display one choice without deleting catalog IDs or rewriting saved reviews. */
export function reviewComposerChoices(signals: ComposerSignal[]): ComposerChoice[] {
  const groups = new Map<string, ComposerSignal[]>();
  const seen = new Set<string>();
  for (const signal of signals) {
    if (seen.has(signal.id)) continue;
    seen.add(signal.id);
    const label = normalized(signal.label);
    const key = `${signal.signal_type === 'heads_up' ? 'concern' : 'positive'}:${aliases.get(label) || label}`;
    groups.set(key, [...(groups.get(key) || []), signal]);
  }
  return Array.from(groups.values()).map(sources => {
    const labelKey = aliases.get(normalized(sources[0].label)) || normalized(sources[0].label);
    const ideal = preferred.get(labelKey);
    // Prefer an existing canonical label, then a specific category over generic,
    // and finally a stable slug. Input/database pagination order cannot change it.
    sources.sort((a, b) => Number(normalized(b.label) === normalized(ideal || '')) - Number(normalized(a.label) === normalized(ideal || '')) || Number(a.slug.startsWith('generic_')) - Number(b.slug.startsWith('generic_')) || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id));
    return { ...sources[0], sources };
  });
}

export function reviewChoiceIntensity(selection: SignalTapSelection, choice: ComposerChoice): number {
  return Math.max(0, ...choice.sources.map(source => selection[source.id] || 0));
}
export function toggleComposerChoice(selection: SignalTapSelection, choice: ComposerChoice): SignalTapSelection {
  const next = { ...selection };
  if (reviewChoiceIntensity(selection, choice)) choice.sources.forEach(source => { delete next[source.id]; });
  else next[choice.id] = 1;
  return next;
}
export function emphasizeComposerChoice(selection: SignalTapSelection, choice: ComposerChoice, intensity: number): SignalTapSelection {
  const next = { ...selection };
  // Preserve original selected IDs in an edited review; never add duplicate taps.
  choice.sources.forEach(source => { if (next[source.id]) next[source.id] = intensity; });
  return next;
}
export function selectedReviewChoices(signals: ComposerSignal[], selection: SignalTapSelection): ComposerChoice[] {
  return reviewComposerChoices(signals).filter(choice => reviewChoiceIntensity(selection, choice));
}
export function reviewChoiceCount(signals: ComposerSignal[], selection: SignalTapSelection): number {
  const known = new Set(signals.map(signal => signal.id));
  return selectedReviewChoices(signals, selection).length + Object.keys(selection).filter(id => !known.has(id)).length;
}

/** A neutral first section. Both praise and concerns are visible before expansion. */
export function reviewComposerSections(signals: ComposerSignal[], subject?: EvidenceSubject, query = ''): ComposerSection[] {
  const filtered = reviewComposerChoices(signals).filter(choice => choice.sources.some(signal => matchesSignalSearch(signal, query)));
  const main = filtered.filter(choice => choice.sources.some(signal => isCoreSignal(subject, signal)));
  const mainIds = new Set(main.map(signal => signal.id));
  const praise = main.filter(signal => signal.signal_type !== 'heads_up');
  const concerns = main.filter(signal => signal.signal_type === 'heads_up');
  const balanced: ComposerChoice[] = [];
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

export function visibleReviewChoices(section: ComposerSection, selection: SignalTapSelection, expanded: boolean, limit = 6): ComposerChoice[] {
  if (expanded) return section.signals;
  const first = new Set(section.signals.slice(0, limit).map(signal => signal.id));
  return section.signals.filter(signal => first.has(signal.id) || !!reviewChoiceIntensity(selection, signal));
}
