/** Normalize category arrays and legacy serialized arrays without evaluating data. */
export function getPlaceCategories(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(getPlaceCategories);
  if (typeof value !== 'string' || !value.trim()) return [];
  const text = value.trim();
  if (text.startsWith('[')) {
    try { const parsed: unknown = JSON.parse(text); if (Array.isArray(parsed)) return getPlaceCategories(parsed); } catch { /* Legacy single-quoted array. */ }
    if (text.startsWith("['") && text.endsWith("']")) return text.slice(2, -2).split(/',\s*'/).map(s => s.trim()).filter(Boolean);
  }
  // Some imported records already split serialized arrays into string fragments.
  const label = text.replace(/^\[\s*['"]?|['"]?\s*\]$/g, '').trim();
  return label ? [label] : [];
}
