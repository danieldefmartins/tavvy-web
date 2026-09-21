import { EVIDENCE_ASPECTS, isCurrentWarning, normalizeEvidenceText, PlaceEvidence } from './placeEvidence';
import { EvidenceLoadOptions, EvidencePlace, fetchEvidenceForPlaces } from './placeEvidenceService';

export async function fetchDiscoveryEvidence(places: EvidencePlace[], options?: EvidenceLoadOptions): Promise<Map<string, PlaceEvidence>> {
  return fetchEvidenceForPlaces(places, options);
}

export const DINING_NEEDS = [
  { id: 'food', label: 'Great food', ...EVIDENCE_ASPECTS.food, test: EVIDENCE_ASPECTS.food.positive },
  { id: 'quiet', label: 'Quiet conversation', ...EVIDENCE_ASPECTS.quiet, test: EVIDENCE_ASPECTS.quiet.positive },
  { id: 'quick', label: 'Quick visit', ...EVIDENCE_ASPECTS.quick, test: EVIDENCE_ASPECTS.quick.positive },
  { id: 'value', label: 'Good value', ...EVIDENCE_ASPECTS.value, test: EVIDENCE_ASPECTS.value.positive },
] as const;

export function matchNeed(evidence: PlaceEvidence | undefined, needId: string): { score: number; reason: string } {
  if (!evidence || evidence.dataStatus === 'unavailable') return { score: -1, reason: 'Recent review information is unavailable' };
  if (evidence.recentReviewers === 0) return { score: -1, reason: 'Not enough recent information' };
  const need = DINING_NEEDS.find(n => n.id === needId);
  if (!need) return { score: 0, reason: '' };
  const matches = [...evidence.goodSignals, ...evidence.vibeSignals].filter(s => need.positive.test(normalizeEvidenceText(s.label)));
  const concerns = evidence.warnings.filter(w => isCurrentWarning(w) && need.opposing.test(normalizeEvidenceText(`${w.slug} ${w.label}`)));
  const score = matches.reduce((sum, item) => sum + item.reports, 0) - concerns.reduce((sum, item) => sum + (item.recentReports || item.reports) * 2, 0);
  const positiveReason = matches.length ? matches.map(m => m.label).join(' · ') : 'No recent positive signal for this preference';
  const reason = `${positiveReason}${concerns.length ? ` · Heads up: ${concerns.map(c => c.label).join(', ')}` : ''} · ${evidence.recentReviewers} recent reviewers`;
  return { score, reason };
}
