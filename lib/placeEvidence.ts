import { rvPlaceBucket } from './rvCategories';

export type EvidenceSubject = string | { category?: string | null; subcategory?: string | null };
export type EvidenceCategory = 'good' | 'vibe' | 'headsup';
export const EVIDENCE_RULES_VERSION = '2026-09-21.1';
export type EvidenceDataStatus = 'ready' | 'empty' | 'unavailable';
export type WarningStatus = 'current' | 'unconfirmed' | 'faded' | 'improved';

export interface EvidenceVisit {
  reviewId: string;
  userId: string;
  visitedAt: string;
  dateSource?: 'reported' | 'review_created';
  signals: { slug: string; label: string; category: EvidenceCategory; intensity?: number }[];
}

export interface WarningEvidence {
  slug: string;
  label: string;
  status: WarningStatus;
  reports: number;
  recentReports?: number;
  laterVisits: number;
  directImprovementReports: number;
  lastReportedAt: string;
}

export interface PlaceEvidence {
  dataStatus?: EvidenceDataStatus;
  unavailableReason?: string;
  rulesVersion?: string;
  asOf?: string;
  coreLabel: string;
  coreSignals: { slug?: string; label: string; reports: number }[];
  coreConcerns: { slug?: string; label: string; reports: number }[];
  goodSignals: { slug?: string; label: string; reports: number }[];
  vibeSignals: { slug?: string; label: string; reports: number }[];
  warnings: WarningEvidence[];
  practical: { label: string; reports: number; lastReportedAt: string }[];
  recentReviewers: number;
  confidence: 'limited' | 'developing' | 'strong';
}

type CoreDefinition = { label: string; match: RegExp; vibeLabel?: string };
const CORE: Record<string, CoreDefinition> = {
  cruise_ship: { label: 'The onboard experience', match: /cabin|sleep|bed|food|dining|comfort|clean|upkeep|maintain|show|entertainment/i },
  restaurant: { label: 'The food', match: /food|dish|pasta|pizza|sauce|flavo[u]?r|taste|fresh|portion|steak|seafood|sushi|brunch|breakfast|coffee|dessert|authentic/i },
  hotel: { label: 'The sleep', match: /sleep|bed|mattress|pillow|quiet|noise|room|clean/i },
  cafe: { label: 'The coffee & food', match: /coffee|espresso|pastry|food|fresh|taste|flavo[u]?r/i },
  bar: { label: 'The drinks', match: /drink|cocktail|beer|wine|bar|service/i },
  nightlife: { label: 'The night out', match: /music|drink|crowd|dance|service|fun/i },
  rv_camping: { label: 'The stay', match: /site|camp|hookup|water|power|quiet|clean|sleep/i },
  airport: { label: 'The travel experience', match: /terminal|security|navigation|clean|wait|service/i },
  attraction: { label: 'The experience', match: /ride|show|fun|experience|wait|value/i },
  entertainment: { label: 'The experience', match: /show|performance|fun|experience|value/i },
  park: { label: 'The outdoor experience', match: /trail|nature|clean|safe|accessible|play/i },
  outdoors: { label: 'The outdoor experience', match: /trail|nature|clean|safe|accessible/i },
  shopping: { label: 'The shopping experience', match: /selection|quality|service|value|stock/i },
  beauty: { label: 'The result', match: /result|service|quality|skill|care/i },
  health: { label: 'The care', match: /care|service|professional|clean|wait/i },
  fitness: { label: 'The workout', match: /equipment|class|trainer|clean|workout/i },
  automotive: { label: 'The service', match: /service|repair|fuel|quality|wait|price/i },
  home_services: { label: 'The work', match: /quality|work|reliable|professional|service/i },
  professional: { label: 'The service', match: /expert|professional|service|reliable|result/i },
  financial: { label: 'The service', match: /service|help|clear|trust|wait/i },
  pets: { label: 'The pet care', match: /care|gentle|clean|service|pet/i },
  education: { label: 'The learning', match: /teach|learn|support|class|quality/i },
  arts: { label: 'The experience', match: /art|exhibit|experience|show|quality/i },
  transportation: { label: 'The journey', match: /reliable|clean|wait|route|service/i },
  government: { label: 'The service', match: /service|wait|help|clear|accessible/i },
  religious: { label: 'The community', match: /welcome|community|service|support|music/i },
  events: { label: 'The event experience', match: /event|venue|sound|service|seating/i },
  city: { label: 'The place', match: /walk|food|culture|safety|transit|nature/i },
};

// These domains have a structured catalog. Match stable tap IDs, never a word
// such as "camp" in Camp Store or "water" as a claim of safe drinking water.
const tapCore = (label: string, slugs: string[]): CoreDefinition => ({ label,
  match: new RegExp(`^(?:${slugs.map(slug => slug.replace(/_/g, ' ')).join('|')})(?:\\s|$)`, 'i') });
const SITE_TAPS = ['rv_level_sites','rv_spacious_sites','rv_big_sites','rv_paved_sites','rv_pull_through','rv_quiet_nights','rv_quiet_peaceful','rv_quiet_hours','rv_easy_access','rv_big_rig_friendly','rv_well_maintained','rv_heads_up_tight_sites','rv_tight_spaces','rv_heads_up_bad_roads','rv_difficult_access','rv_dusty_muddy','rv_heads_up_noisy_neighbors','rv_noisy','rv_heads_up_flooding'];
const RV_SITE = tapCore('The campsite', [...SITE_TAPS,'rv_good_hookups','rv_full_hookups','rv_water_hookup','rv_sewer_hookup','rv_30_amp','rv_50_amp']);
const RV_OVERNIGHT = tapCore('The overnight stay', SITE_TAPS);
const RV_DUMP = tapCore('The dump stop', ['dump_clean','dump_easy_access','dump_well_marked','dump_hard_to_find','dump_often_full','dump_poorly_maintained','dump_tight_maneuvering']);
const OUTDOOR = tapCore('The outdoor experience', ['outdoor_great_trails','outdoor_beautiful_scenery','outdoor_great_views','outdoor_wildlife','outdoor_easy_trails','outdoor_clean_park','outdoor_good_fishing','outdoor_heads_up_bad_trail','outdoor_heads_up_crowded','outdoor_heads_up_no_shade','outdoor_heads_up_steep','outdoor_heads_up_bugs','park_great_trails','park_well_maintained','park_clean_facilities','park_crowded','park_bugs']);
const RIDE = tapCore('The ride experience', ['tp_smooth_ride','tp_well_themed','tp_unique_experience','tp_must_ride','tp_amazing_rides','tp_thrill_rides','tp_thrilling','tp_rough_ride','tp_motion_sickness','tp_frequent_breakdowns','tp_scary_intense','tp_gets_wet','tp_claustrophobic','tp_heads_up_rides_closed']);
const THEME_PARK = tapCore('The attractions', ['tp_smooth_ride','tp_well_themed','tp_unique_experience','tp_must_ride','tp_amazing_rides','tp_thrill_rides','tp_thrilling','tp_great_shows','tp_night_shows','tp_rough_ride','tp_frequent_breakdowns','tp_heads_up_rides_closed']);

export function normalizeEvidenceText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

export function coreForCategory(subject?: EvidenceSubject): CoreDefinition {
  const category = typeof subject === 'string' ? subject : subject?.category || '';
  const subcategory = typeof subject === 'string' ? '' : subject?.subcategory || '';
  const bucket = rvPlaceBucket({ tavvy_category: category, tavvy_subcategory: subcategory });
  if (bucket === 'dump-stations') return RV_DUMP;
  if (bucket === 'overnight-parking' || bucket === 'boondocking') return RV_OVERNIGHT;
  if (bucket === 'national-parks') return OUTDOOR;
  if (bucket === 'beaches') return { ...OUTDOOR, label: 'The beach experience' };
  if (bucket) return RV_SITE;
  // A provider taxonomy is a path; its final leaf is the actual business type.
  const leaf = (value: string) => normalizeEvidenceText(value.split('>').at(-1)!.replace(/[\[\]]/g, ''));
  const key = leaf(subcategory || category);
  if (/^(rv & camping|rv camping|camping)$/.test(key)) return RV_SITE;
  if (/^(realtor|realtors|real estate agent|real estate agents|real estate)$/.test(key)) return { label: 'The real estate service', match: /expert|negotiat|market knowledge|local knowledge|communicat|responsive|result|professional/i, vibeLabel: 'Their Style' };
  if (/^(ride|rides|theme park ride|theme park attraction|roller coaster)$/.test(key)) return RIDE;
  if (/^(theme park|amusement park)$/.test(key)) return THEME_PARK;
  if (/^(park|parks|outdoors|outdoor recreation|national park)$/.test(key)) return OUTDOOR;
  const exactKey = key.replace(/ /g, '_');
  const exact = CORE[exactKey] || CORE[exactKey.replace(/s$/, '')];
  if (exact) return exact;
  if (/\b(mobile coffee|coffee carts?)\b/.test(key)) return CORE.cafe;
  if (/\b(food trucks?|catering|ice cream)\b/.test(key)) return CORE.restaurant;
  if (/\b(mobile pet|pet groom\w*|dog train\w*|mobile vet)\b/.test(key)) return CORE.pets;
  if (/\b(barbers?|hair stylists?|nail tech\w*)\b/.test(key)) return CORE.beauty;
  if (/\b(car wash|auto detail\w*|mobile mechanic|tire service)\b/.test(key)) return CORE.automotive;
  if (/\b(restaurants?|pizzerias?|diners?|bistros?|steakhouses?|eater(?:y|ies))\b/.test(key)) return CORE.restaurant;
  if (/\b(hotels?|motels?|inns?|resorts?|lodging)\b/.test(key)) return CORE.hotel;
  if (/\b(cafes?|coffee shops?|coffeehouses?)\b/.test(key)) return CORE.cafe;
  if (/\b(bars?|pubs?|taverns?|brewer(?:y|ies))\b/.test(key)) return CORE.bar;
  if (/\b(campgrounds?|camping|rv parks?)\b/.test(key)) return CORE.rv_camping;
  if (/\bhome services?\b/.test(key)) return CORE.home_services;
  if (subcategory && leaf(category) !== key) return coreForCategory(category);
  return { label: 'The main experience', match: /quality|service|experience|clean|well.maintained/i };
}

export function isCoreSignal(subject: EvidenceSubject | undefined, signal: { slug?: string; label: string }) {
  return coreForCategory(subject).match.test(signalText(signal));
}

export function secondaryGoodSignals(evidence: PlaceEvidence, subject?: EvidenceSubject) {
  const coreLabels = new Set(evidence.coreSignals.map(signal => signal.label));
  return evidence.goodSignals.filter(signal => !isCoreSignal(subject, signal) && !coreLabels.has(signal.label));
}

// Positive and opposing signals are curated separately. A missing mention is never proof of repair.
export const EVIDENCE_ASPECTS = {
  food: { positive: /food|dish|pasta|pizza|sauce|flavo[u]?r|taste|fresh|portion|steak|seafood|sushi|dessert|authentic/i, opposing: /food|dish|pasta|pizza|sauce|taste|flavo[u]?r|stale|undercook|overcook|cold meal|bland|burnt|small portion/i },
  quiet: { positive: /quiet|peaceful|low noise|easy conversation/i, opposing: /noisy|noise|loud|hard to hear/i },
  quick: { positive: /fast service|quick service|short wait|seated quickly|prompt service/i, opposing: /long wait|slow service|wait for table|delayed|slow kitchen/i },
  value: { positive: /good value|great value|affordable|generous portion|fair price|budget friendly/i, opposing: /expensive|overpriced|poor value|small portion|hidden fee|pricey/i },
  cleanliness: { positive: /clean|spotless/i, opposing: /dirty|unclean|unsanitary/i },
} as const;
export const SERIOUS_ISSUE = /food.safety|food.poison|allergen|allerg(y|ic)|unsafe|inaccessible|not.accessible|discriminat|harass/i;
const PRACTICAL_DETAIL = /cash.only|no.reservations|reservation.required/i;
const reviewerKey = (visit: EvidenceVisit) => visit.userId || `review:${visit.reviewId}`;
const signalText = (signal: { slug?: string; label: string }) => normalizeEvidenceText(`${signal.slug || ''} ${signal.label}`);
const signalKey = (signal: { slug: string; label: string }) => normalizeEvidenceText(signal.slug || signal.label);
export function isCurrentWarning(warning: WarningEvidence) { return warning.status === 'current' || warning.status === 'unconfirmed'; }

export function buildPlaceEvidence(visits: EvidenceVisit[], category?: EvidenceSubject, now = new Date()): PlaceEvidence {
  const cutoff = now.getTime() - 180 * 86400000;
  // Every visit contributes to issue history. A newer visit cannot erase an older complaint.
  const valid = visits.filter(v => Number.isFinite(Date.parse(v.visitedAt)) && Date.parse(v.visitedAt) <= now.getTime());
  const recent = valid.filter(v => Date.parse(v.visitedAt) >= cutoff);
  const count = (category: EvidenceCategory, match?: RegExp) => {
    const map = new Map<string, { slug: string; label: string; users: Set<string> }>();
    for (const visit of recent) for (const signal of visit.signals) {
      if (signal.category !== category || (match && !match.test(signalText(signal)))) continue;
      const key = signalKey(signal);
      if (!map.has(key)) map.set(key, { slug: signal.slug, label: signal.label, users: new Set() });
      map.get(key)!.users.add(reviewerKey(visit));
    }
    return [...map.values()].map(s => ({ slug: s.slug, label: s.label, reports: s.users.size })).sort((a, b) => b.reports - a.reports || a.label.localeCompare(b.label));
  };
  const core = coreForCategory(category);
  const coreSignals = count('good', core.match).slice(0, 4);
  const warningKeys = new Map<string, { slug: string; label: string; visits: Map<string, EvidenceVisit> }>();
  for (const visit of valid) for (const signal of visit.signals) {
    if (signal.category !== 'headsup') continue;
    const key = signalKey(signal);
    if (!warningKeys.has(key)) warningKeys.set(key, { slug: signal.slug || key, label: signal.label, visits: new Map() });
    // Duplicate taps/revisions of the same visit never increase a count.
    warningKeys.get(key)!.visits.set(visit.reviewId, visit);
  }
  const practical = [...warningKeys.values()].filter(data => PRACTICAL_DETAIL.test(signalText(data)))
    .map(data => ({ label: data.label, reports: new Set([...data.visits.values()].map(reviewerKey)).size, lastReportedAt: [...data.visits.values()].sort((a, b) => Date.parse(b.visitedAt) - Date.parse(a.visitedAt))[0].visitedAt }))
    .filter(item => Date.parse(item.lastReportedAt) >= cutoff);
  const warnings = [...warningKeys.entries()].filter(([, data]) => !PRACTICAL_DETAIL.test(signalText(data))).map(([key, data]): WarningEvidence => {
    const occurrences = [...data.visits.values()];
    const lastReportedAt = occurrences.sort((a, b) => Date.parse(b.visitedAt) - Date.parse(a.visitedAt))[0].visitedAt;
    const reporters = new Set(occurrences.map(reviewerKey));
    // Only distinct later accounts with positive reports qualify; a complainant cannot clear their own issue by posting repeatedly.
    const laterByUser = new Map<string, EvidenceVisit>();
    for (const visit of recent) {
      if (!visit.userId || reporters.has(reviewerKey(visit)) || Date.parse(visit.visitedAt) <= Date.parse(lastReportedAt)) continue;
      if (!visit.signals.some(s => s.category === 'good') || visit.signals.some(s => s.category === 'headsup' && signalKey(s) === key)) continue;
      const previous = laterByUser.get(visit.userId);
      if (!previous || Date.parse(visit.visitedAt) > Date.parse(previous.visitedAt)) laterByUser.set(visit.userId, visit);
    }
    const later = [...laterByUser.values()];
    // A quiet lounge does not demonstrate that a noisy cabin improved.
    const counterpart = data.slug === 'cruise_noisy_cabins' ? /cruise restful cabins|restful cabins/i
      : [EVIDENCE_ASPECTS.quick, EVIDENCE_ASPECTS.quiet, EVIDENCE_ASPECTS.cleanliness].find(aspect => aspect.opposing.test(signalText(data)))?.positive;
    const directImprovementReports = counterpart ? later.filter(v => v.signals.some(s => s.category !== 'headsup' && counterpart.test(signalText(s)))).length : 0;
    const recentReports = new Set(occurrences.filter(v => Date.parse(v.visitedAt) >= cutoff).map(reviewerKey)).size;
    const aged = Date.parse(lastReportedAt) < cutoff;
    const serious = SERIOUS_ISSUE.test(signalText(data));
    const status: WarningStatus = !serious && aged && later.length >= 5 && directImprovementReports >= 3 ? 'improved'
      : !serious && aged && later.length >= 5 ? 'faded'
      : recentReports >= 2 ? 'current' : 'unconfirmed';
    return { slug: data.slug, label: data.label, status, reports: reporters.size, recentReports, laterVisits: later.length, directImprovementReports, lastReportedAt };
  }).sort((a, b) => Date.parse(b.lastReportedAt) - Date.parse(a.lastReportedAt));
  return {
    dataStatus: valid.length ? 'ready' : 'empty', rulesVersion: EVIDENCE_RULES_VERSION, asOf: now.toISOString(),
    coreLabel: core.label, coreSignals,
    coreConcerns: warnings.filter(w => isCurrentWarning(w) && core.match.test(signalText(w))).map(w => ({ slug: w.slug, label: w.label, reports: w.recentReports || w.reports })),
    goodSignals: count('good').slice(0, 20), vibeSignals: count('vibe').slice(0, 20), warnings, practical,
    recentReviewers: new Set(recent.map(reviewerKey)).size,
    confidence: (coreSignals[0]?.reports || 0) >= 10 ? 'strong' : (coreSignals[0]?.reports || 0) >= 5 ? 'developing' : 'limited',
  };
}

export function unavailablePlaceEvidence(category?: EvidenceSubject, reason = 'Recent review information is temporarily unavailable', now = new Date()): PlaceEvidence {
  return { ...buildPlaceEvidence([], category, now), dataStatus: 'unavailable', unavailableReason: reason };
}

/** Shared search/card summary: historical warnings never reappear as current signals. */
export function currentEvidenceSignals(evidence?: PlaceEvidence | null): { label: string; category: EvidenceCategory; count: number; slug?: string }[] {
  if (!evidence || evidence.dataStatus === 'unavailable') return [];
  return [
    ...evidence.goodSignals.slice(0, 2).map(s => ({ label: s.label, category: 'good' as const, count: s.reports })),
    ...evidence.vibeSignals.slice(0, 1).map(s => ({ label: s.label, category: 'vibe' as const, count: s.reports })),
    ...evidence.warnings.filter(isCurrentWarning).slice(0, 1).map(w => ({ label: w.label, slug: w.slug, category: 'headsup' as const, count: w.recentReports || w.reports })),
  ];
}
