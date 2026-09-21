/** Only app-authored summary phrases may be translated; report/signal text is untouched. */
const SYSTEM_PHRASES = new Set([
  'The Main Thing', 'The Good', 'The Vibe', 'Heads Up', 'Recent reviews',
  'Loading recent reviews…', 'Recent reviews unavailable', 'More recent reviews needed',
  'Recent concerns reported', 'No recent concerns reported', 'The campsite', 'The beach experience', 'The food',
]);
export function reviewSummaryCopy(value: string, copy: (message: string) => string): string {
  return SYSTEM_PHRASES.has(value) ? copy(value) : value;
}
export function reviewMentionCopy(count: number, copy: (message: string) => string): string {
  return count === 1 ? copy('One person mentioned this') : copy('{{count}} people mentioned this').replace('{{count}}', String(count));
}
