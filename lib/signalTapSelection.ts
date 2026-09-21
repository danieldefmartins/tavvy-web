/** Same 0 → 1 → 2 → 3 → removed interaction as native AddReviewScreen. */
export type SignalTapSelection = Record<string, number>;
export function cycleSignalTap(previous: SignalTapSelection, signalId: string): SignalTapSelection {
  const next = { ...previous };
  const strength = previous[signalId] || 0;
  if (strength >= 3) delete next[signalId];
  else next[signalId] = strength + 1;
  return next;
}
export function restoreSignalTaps(signals: { signalId: string; intensity: number }[]): SignalTapSelection {
  return Object.fromEntries(signals.filter(s => Number.isInteger(s.intensity) && s.intensity >= 1 && s.intensity <= 3).map(s => [s.signalId, s.intensity]));
}
export function selectedSignalTaps(selection: SignalTapSelection): { signalId: string; intensity: number }[] {
  return Object.entries(selection).map(([signalId, intensity]) => ({ signalId, intensity }));
}

export function matchesSignalSearch(signal: { label: string; slug?: string }, query: string): boolean {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = `${signal.label} ${signal.slug || ''}`.replace(/[_-]/g, ' ').toLocaleLowerCase();
  return words.every(word => text.includes(word));
}
