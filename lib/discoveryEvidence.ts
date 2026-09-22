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
  const support = evidence.aspectSupport?.[needId];
  // Ranking only, never a percentage: one account contributes once per aspect.
  // Five neutral observations temper very small samples without inventing reviews.
  const positive = support?.positive ?? Math.max(0, ...matches.map(item => item.reports));
  const negative = support?.concerns ?? Math.max(0, ...concerns.map(item => item.recentReports || 0));
  const respondents = support?.respondents ?? Math.max(positive, negative);
  const score = respondents ? (positive - negative) / (respondents + 5) : -1;

  const positiveReason = matches.length ? matches.map(m => m.label).join(' · ') : 'No recent positive signal for this preference';
  const reason = `${positiveReason}${concerns.length ? ` · Heads up: ${concerns.map(c => c.label).join(', ')}` : ''} · ${evidence.recentReviewers} recent reviewers`;
  return { score, reason };
}
