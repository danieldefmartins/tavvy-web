import { coreForCategory, EvidenceSubject, isCurrentWarning, PlaceEvidence, secondaryGoodSignals, SERIOUS_ISSUE } from './placeEvidence';

export type ReviewTileKey = 'main' | 'good' | 'vibe' | 'headsup';
export type ReviewSummaryStatus = 'loading' | 'ready' | 'empty' | 'unavailable';
export interface ReviewSummaryTile {
  key: ReviewTileKey;
  title: string;
  detail: string;
  count?: number;
  note?: string;
}
export interface ReviewTopic { label: string; count: number; tone: 'positive' | 'neutral' | 'concern'; slug?: string; lastReportedAt?: string; older?: boolean }
export interface ReviewSection { key: ReviewTileKey; title: string; topics: ReviewTopic[] }
export interface ReviewPractical { label: string; count: number }
export interface PlaceReviewSummary { status: ReviewSummaryStatus; tiles: ReviewSummaryTile[]; recentReviewers?: number; coreLabel?: string; sections?: ReviewSection[]; practical?: ReviewPractical[] }

/** Compact projection of the same recent, independent reports used on place details. */
export function buildPlaceReviewSummary(evidence?: PlaceEvidence | null, category?: EvidenceSubject, status?: ReviewSummaryStatus): PlaceReviewSummary {
  const state = status || evidence?.dataStatus || 'unavailable';
  const coreLabel = evidence?.coreLabel || coreForCategory(category).label;
  const unavailable = state === 'loading' ? 'Loading recent reviews…' : state === 'unavailable' ? 'Recent reviews unavailable' : '';
  const core = !unavailable ? evidence?.coreSignals[0] : undefined;
  const good = !unavailable && evidence ? secondaryGoodSignals(evidence, category)[0] : undefined;
  const vibe = !unavailable ? evidence?.vibeSignals[0] : undefined;
  const warning = !unavailable ? evidence?.warnings.find(isCurrentWarning) : undefined;
  const topics = (items: { slug?: string; label: string; reports: number }[], tone: ReviewTopic['tone']): ReviewTopic[] => items.filter(item => item.reports > 0).map(item => ({ slug: item.slug, label: item.label, count: item.reports, tone }));
  const concerns: ReviewTopic[] = !unavailable && evidence ? evidence.warnings.filter(isCurrentWarning)
    .sort((a, b) => Number(SERIOUS_ISSUE.test(`${b.slug} ${b.label}`)) - Number(SERIOUS_ISSUE.test(`${a.slug} ${a.label}`)) || (b.recentReports || 0) - (a.recentReports || 0) || Date.parse(b.lastReportedAt) - Date.parse(a.lastReportedAt))
    .map(item => ({ slug: item.slug, label: item.label, count: item.recentReports || item.reports, tone: 'concern', lastReportedAt: item.lastReportedAt, older: !item.recentReports })) : [];
  const coreConcerns = concerns.filter(topic => evidence?.coreConcerns.some(item => item.label === topic.label));
  const mainTopics = topics(!unavailable && evidence ? evidence.coreSignals : [], 'positive');
  // Keep the most relevant concern visible even when the full panel is collapsed.
  if (coreConcerns.length) mainTopics.splice(Math.min(1, mainTopics.length), 0, ...coreConcerns);
  const coreLabels = new Set(mainTopics.map(topic => topic.label));
  const sections: ReviewSection[] = [
    { key: 'main', title: coreLabel, topics: mainTopics },
    { key: 'good', title: 'The Good', topics: !unavailable && evidence ? topics(secondaryGoodSignals(evidence, category), 'positive') : [] },
    { key: 'vibe', title: coreForCategory(category).vibeLabel || 'The Vibe', topics: !unavailable && evidence ? topics(evidence.vibeSignals.filter(item => !coreLabels.has(item.label)), 'neutral') : [] },
    { key: 'headsup', title: 'Heads Up', topics: concerns.filter(topic => !coreLabels.has(topic.label)) },
  ];
  // Practical details (cash only, reservations) are facts to know, never quality complaints.
  const practical: ReviewPractical[] = !unavailable && evidence ? evidence.practical.map(item => ({ label: item.label, count: item.reports })) : [];
  return { status: state, coreLabel, sections, practical, recentReviewers: unavailable ? undefined : evidence?.recentReviewers, tiles: [
    { key: 'main', title: 'The Main Thing', detail: core ? `${coreLabel}: ${core.label}` : coreLabel, count: core?.reports,
      note: unavailable || (evidence?.coreConcerns.length ? 'Recent concerns reported' : core ? undefined : 'More recent reviews needed') },
    { key: 'good', title: 'The Good', detail: unavailable || good?.label || 'More recent reviews needed', count: good?.reports },
    { key: 'vibe', title: coreForCategory(category).vibeLabel || 'The Vibe', detail: unavailable || vibe?.label || 'More recent reviews needed', count: vibe?.reports },
    { key: 'headsup', title: 'Heads Up', detail: unavailable || warning?.label || 'No recent concerns reported', count: warning ? warning.recentReports || warning.reports : undefined,
      note: !unavailable && !warning && (!evidence || evidence.recentReviewers === 0) ? 'More recent reviews needed' : undefined },
  ] };
}

/** Older API responses remain readable during web/native rollout. Never turn tap strength into people. */
export function reviewSections(summary: PlaceReviewSummary): ReviewSection[] {
  if (summary.sections) return summary.sections;
  return summary.tiles.map(tile => ({ key: tile.key, title: tile.key === 'main' ? summary.coreLabel || (tile.detail.includes(': ') ? tile.detail.split(': ')[0] : 'The main experience') : tile.title,
    topics: tile.count && tile.count > 0 ? [{ label: tile.key === 'main' ? tile.detail.replace(/^[^:]+: /, '') : tile.detail, count: tile.count, tone: tile.key === 'headsup' ? 'concern' : tile.key === 'vibe' ? 'neutral' : 'positive' }] : [] }));
}

/**
 * Search cards: at most three highlight lines. The core word and its concern come first;
 * the remaining lines go to the most relevant Heads Up, then one supporting Good/Vibe word.
 */
export function searchReviewSections(summary: PlaceReviewSummary): ReviewSection[] {
  const sections = reviewSections(summary);
  const find = (key: ReviewTileKey) => sections.find(section => section.key === key);
  const main = find('main');
  const positive = main?.topics.find(topic => topic.tone !== 'concern');
  const concern = main?.topics.find(topic => topic.tone === 'concern');
  const mainTopics = [positive, concern].filter(Boolean) as ReviewTopic[];
  const used = new Set(mainTopics.map(topic => topic.label));
  let budget = 3 - mainTopics.length;
  const rows: ReviewSection[] = main ? [{ ...main, topics: mainTopics }] : [];
  const take = (key: ReviewTileKey) => {
    const section = find(key);
    const topic = section?.topics.find(item => !used.has(item.label));
    if (!section || !topic || budget <= 0) return null;
    budget -= 1; used.add(topic.label);
    return { ...section, topics: [topic] };
  };
  const headsUp = take('headsup');
  const support = take('good') || take('vibe');
  return [...rows, ...(support ? [support] : []), ...(headsUp ? [headsUp] : [])];
}

/**
 * Search cards, one expandable row per section: the core experience's praise, The Good,
 * The Vibe, and every current concern under Heads Up with core (and serious) concerns
 * first, so the most relevant concern is the one visible when the row is collapsed.
 */
export function cardReviewRows(summary: PlaceReviewSummary): ReviewSection[] {
  const sections = reviewSections(summary);
  const find = (key: ReviewTileKey) => sections.find(section => section.key === key);
  const main = find('main'), good = find('good'), vibe = find('vibe'), headsUp = find('headsup');
  const coreConcerns = main ? main.topics.filter(topic => topic.tone === 'concern') : [];
  const concerns = [...coreConcerns, ...(headsUp?.topics || []).filter(topic => !coreConcerns.some(item => item.label === topic.label))];
  return [
    ...(main ? [{ ...main, topics: main.topics.filter(topic => topic.tone !== 'concern') }] : []),
    ...(good ? [good] : []), ...(vibe ? [vibe] : []),
    ...(headsUp || concerns.length ? [{ key: 'headsup' as ReviewTileKey, title: headsUp?.title || 'Heads Up', topics: concerns }] : []),
  ];
}

/** Two rows for comparison: core praise AND concerns, then the most useful supporting evidence. */
export function compactReviewSections(summary: PlaceReviewSummary): ReviewSection[] {
  const sections = reviewSections(summary);
  const main = sections.find(section => section.key === 'main');
  const positive = main?.topics.find(topic => topic.tone !== 'concern');
  const concern = main?.topics.find(topic => topic.tone === 'concern');
  const mainTopics = [positive, concern || main?.topics.filter(topic => topic.tone !== 'concern')[1]].filter(Boolean) as ReviewTopic[];
  const coreLabels = new Set(mainTopics.map(topic => topic.label));
  const supporting = ['headsup', 'vibe', 'good'].map(key => {
    const section = sections.find(section => section.key === key);
    return section && { ...section, topics: section.topics.filter(topic => !coreLabels.has(topic.label)).slice(0, 1) };
  }).find(section => section?.topics.length);
  return [...(main ? [{ ...main, topics: mainTopics }] : []), ...(supporting ? [supporting] : [])];
}
