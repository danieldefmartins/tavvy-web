import { coreForCategory, EvidenceSubject, isCurrentWarning, PlaceEvidence, secondaryGoodSignals } from './placeEvidence';

export type ReviewTileKey = 'main' | 'good' | 'vibe' | 'headsup';
export type ReviewSummaryStatus = 'loading' | 'ready' | 'empty' | 'unavailable';
export interface ReviewSummaryTile {
  key: ReviewTileKey;
  title: string;
  detail: string;
  count?: number;
  note?: string;
}
export interface PlaceReviewSummary { status: ReviewSummaryStatus; tiles: ReviewSummaryTile[] }

/** Compact projection of the same recent, independent reports used on place details. */
export function buildPlaceReviewSummary(evidence?: PlaceEvidence | null, category?: EvidenceSubject, status?: ReviewSummaryStatus): PlaceReviewSummary {
  const state = status || evidence?.dataStatus || 'unavailable';
  const coreLabel = evidence?.coreLabel || coreForCategory(category).label;
  const unavailable = state === 'loading' ? 'Loading recent reviews…' : state === 'unavailable' ? 'Recent reviews unavailable' : '';
  const core = !unavailable ? evidence?.coreSignals[0] : undefined;
  const good = !unavailable && evidence ? secondaryGoodSignals(evidence, category)[0] : undefined;
  const vibe = !unavailable ? evidence?.vibeSignals[0] : undefined;
  const warning = !unavailable ? evidence?.warnings.find(isCurrentWarning) : undefined;
  return { status: state, tiles: [
    { key: 'main', title: 'The Main Thing', detail: core ? `${coreLabel}: ${core.label}` : coreLabel, count: core?.reports,
      note: unavailable || (evidence?.coreConcerns.length ? 'Recent concerns reported' : core ? undefined : 'More recent reviews needed') },
    { key: 'good', title: 'The Good', detail: unavailable || good?.label || 'More recent reviews needed', count: good?.reports },
    { key: 'vibe', title: coreForCategory(category).vibeLabel || 'The Vibe', detail: unavailable || vibe?.label || 'More recent reviews needed', count: vibe?.reports },
    { key: 'headsup', title: 'Heads Up', detail: unavailable || warning?.label || 'No recent concerns reported', count: warning ? warning.recentReports || warning.reports : undefined,
      note: !unavailable && !warning && (!evidence || evidence.recentReviewers === 0) ? 'More recent reviews needed' : undefined },
  ] };
}
