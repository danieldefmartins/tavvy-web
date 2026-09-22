import React, { useId, useState } from 'react';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { reviewSections, searchReviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

export interface ReviewSummaryProps {
  summary: PlaceReviewSummary; explain?: boolean; mode?: 'compact' | 'full'; selectedTopic?: string | null;
  onSelect?: (section: ReviewTileKey, topic: ReviewTopic) => void;
}
type Tone = ReviewTopic['tone'];
const SECTION_TONE: Record<ReviewTileKey, Tone> = { main: 'neutral', good: 'positive', vibe: 'neutral', headsup: 'concern' };
const ACCENT: Record<Tone, string> = { positive: '#00C2CB', neutral: '#8A05BE', concern: '#F5A623' };
// Bars need enough people to mean something; below this a tiny sample would look like a full bar.
const BAR_MIN_PEOPLE = 5;
const FULL_INITIAL_TOPICS = 3;

/**
 * Shared presentation: every displayed topic is word + people count + a thin frequency bar
 * on one scale per place (people who mentioned it out of recent reviewers). Bar length is
 * frequency, never quality or severity; concerns keep their "!" marker so a rarely mentioned
 * serious concern stays visible. Historical name retained for callers; there is no four-tile grid.
 */
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect }: ReviewSummaryProps) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const id = useId();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [about, setAbout] = useState(false);
  const compact = mode === 'compact';
  const sections = compact ? searchReviewSections(summary) : reviewSections(summary);
  const count = summary.recentReviewers || 0;
  const label = summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable';
  if (summary.status !== 'ready') return <div className="review-empty" role="status" style={{ color: theme.textSecondary, fontSize: 12, lineHeight: '18px', paddingBlock: compact ? 2 : 14 }}>{copy(label)}</div>;
  const toneColor: Record<Tone, string> = { positive: isDark ? '#58D9DE' : '#067A80', neutral: isDark ? '#D9B6FF' : '#74209A', concern: isDark ? '#FFD38A' : '#885000' };
  const showBars = count >= BAR_MIN_PEOPLE;
  const evidenceLine = copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} people · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count));
  const hasMainConcern = sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern'));
  const emptyText = (key: ReviewTileKey) => copy(key === 'headsup' && count > 0 ? (hasMainConcern ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed');
  const interactive = !compact && !!onSelect;
  const width = (topic: ReviewTopic) => `${Math.max(2, Math.round((topic.count / Math.max(count, 1)) * 100))}%`;

  const topicRow = (section: ReviewTileKey, topic: ReviewTopic, first: boolean, title: string) => {
    const tone: Tone = topic.tone === 'concern' ? 'concern' : SECTION_TONE[section] === 'neutral' && section !== 'main' ? 'neutral' : 'positive';
    const selected = selectedTopic === topic.label;
    const olderDate = topic.lastReportedAt ? topic.lastReportedAt.slice(0, 10) : '';
    const word = <span className="word" style={{ color: topic.tone === 'concern' ? toneColor.concern : theme.text }} title={compact && topic.older ? `${copy('Older report')}${olderDate ? ` · ${olderDate}` : ''}` : undefined}>
      {topic.tone === 'concern' && <span className="mark" aria-hidden="true">!</span>}
      {topic.label}
      {topic.older && <small className="older"> · {copy('Older report')}{!compact && olderDate ? ` · ${olderDate}` : ''}</small>}
    </span>;
    const bar = showBars && <span className="track"><span className="fill" style={{ width: width(topic), background: ACCENT[tone] }} /></span>;
    const number = <b className="count" style={{ color: toneColor[tone] }}>{topic.count}</b>;
    if (compact) return <div key={topic.slug || topic.label} className={`topic ${topic.tone}`} data-review-topic={topic.tone}>
      <span className="line">{first && <span className="rlabel" style={{ color: toneColor[SECTION_TONE[section]] }}>{copy(title)}</span>}{word}{number}</span>
      {bar}
    </div>;
    const content = <><span className="top">{word}{number}</span>{bar}</>;
    return interactive
      ? <button type="button" key={topic.slug || topic.label} className={`topic ${topic.tone}`} data-review-topic={topic.tone} aria-pressed={selected} aria-label={`${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`} onClick={() => onSelect!(section, topic)}>{content}</button>
      : <span key={topic.slug || topic.label} className={`topic ${topic.tone}`} data-review-topic={topic.tone}>{content}</span>;
  };

  const rows = sections.map(section => {
    const open = expanded.includes(section.key);
    const main = section.key === 'main';
    // The core experience is already capped by the evidence builder; supporting sections start short.
    const truncate = !compact && !main && !open;
    // The place page reads praise first, then the concerns reported beside it, on the same scale.
    const ordered = main && !compact ? [...section.topics.filter(topic => topic.tone !== 'concern'), ...section.topics.filter(topic => topic.tone === 'concern')] : section.topics;
    const topics = truncate ? ordered.slice(0, FULL_INITIAL_TOPICS) : ordered;
    return <div key={section.key} className={`review-row ${section.key}`} data-review-section={section.key}>
      {!compact && <span className="label" style={{ color: toneColor[SECTION_TONE[section.key]] }}>{!main && <span className="dot" aria-hidden="true" style={{ background: ACCENT[SECTION_TONE[section.key]] }} />}{copy(section.title)}</span>}
      <div className="topics">
        {topics.map((topic, index) => topicRow(section.key, topic, index === 0, section.title))}
        {!topics.length && (compact ? <div className="topic empty-line"><span className="line"><span className="rlabel" style={{ color: toneColor[SECTION_TONE[section.key]] }}>{copy(section.title)}</span><span className="empty">{emptyText(section.key)}</span></span></div> : <span className="empty">{emptyText(section.key)}</span>)}
        {!compact && !main && section.topics.length > FULL_INITIAL_TOPICS && <button type="button" className="more" aria-expanded={open} onClick={() => setExpanded(previous => open ? previous.filter(key => key !== section.key) : [...previous, section.key])}>{copy(open ? 'Show less' : 'Show all')}</button>}
      </div>
    </div>;
  });

  // Rows are built by helpers above, outside the returned JSX, so scoped styled-jsx classes
  // would not reach them; the stylesheet is global and anchored to the .tvr root instead.
  return <div className={`tvr review-summary-content ${compact ? 'compact' : 'full'}`} data-review-summary={summary.status} aria-label={copy('Recent reviews')}>
    {!compact && <div className="evidence-line">
      <span className="evidence-note">{evidenceLine}</span>
      <button type="button" className="about" aria-expanded={about} aria-controls={`${id}-about`} onClick={() => setAbout(value => !value)}><span className="info" aria-hidden="true">i</span>{copy('About these numbers')}</button>
    </div>}
    {!compact && about && <p className="legend" id={`${id}-about`}>{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')}{showBars && <> {copy('Bars show how many of the {{count}} people mentioned it').replace('{{count}}', String(count))}.</>}{onSelect && <> {copy('Choose a topic to see experiences.')}</>}</p>}
    {rows}
    {compact && <div className="evidence-note head"><b>{copy('Reviews')}</b> · {evidenceLine}</div>}
    {!compact && !!summary.practical?.length && <div className="review-row practical" data-review-practical="true">
      <span className="label" style={{ color: theme.textSecondary }}><span className="dot" aria-hidden="true" style={{ background: theme.textSecondary }} />{copy('Good to know')}</span>
      <div className="chips">{summary.practical.map(item => <span key={item.label} className="chip" style={{ background: theme.surface, borderColor: theme.border, color: theme.textSecondary }}>{item.label}<b>{item.count}</b></span>)}</div>
    </div>}
    <style jsx global>{`
      .tvr{color:${theme.text};text-align:start;min-width:0}.tvr .review-row{min-width:0}
      .tvr .empty,.tvr .evidence-note,.tvr .legend{font-size:11px;line-height:17px;color:${theme.textSecondary}}
      .tvr .mark{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:${ACCENT.concern};color:#17013A;font-size:10.5px;font-weight:900;line-height:1;flex:none;margin-inline-end:5px;vertical-align:-2px}
      .tvr .word{min-width:0;overflow-wrap:anywhere;font-weight:700}.tvr .older{font-size:11px;font-weight:600;opacity:.85}
      .tvr .track{display:block;height:6px;border-radius:3px;background:${isDark ? 'rgba(255,255,255,.09)' : 'rgba(23,1,58,.08)'};overflow:hidden}.tvr .fill{display:block;height:100%;border-radius:3px}
      .tvr .count{font-variant-numeric:tabular-nums;font-weight:800;flex:none}

      .tvr.compact{display:flex;flex-direction:column}
      .tvr.compact .head{order:-1;font-size:11.5px;line-height:16px;margin-bottom:5px}.tvr.compact .head b{color:${theme.text};font-weight:800}
      .tvr.compact .topics{display:flex;flex-direction:column;gap:4px}
      .tvr.compact .topic{display:flex;flex-direction:column;gap:3px;min-width:0}
      .tvr.compact .line{display:flex;align-items:baseline;gap:6px;min-width:0}
      .tvr.compact .rlabel{flex:none;max-width:38%;font-size:10px;line-height:16px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tvr.compact .word{flex:1;font-size:13px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tvr.compact .word .mark{width:13px;height:13px;font-size:9px;margin-inline-end:4px}
      .tvr.compact .track{height:3px}.tvr.compact .count{font-size:13px;line-height:18px}
      .tvr.compact .review-row+.review-row{margin-top:4px}

      .tvr.full .evidence-line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}.tvr.full .evidence-note{font-size:13px;line-height:18px;font-weight:650;color:${theme.text}}
      .tvr .about{display:inline-flex;align-items:center;gap:6px;border:0;background:none;padding:0 2px;min-height:44px;font:inherit;font-size:12px;font-weight:600;color:${theme.textSecondary};cursor:pointer}.tvr .info{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1.5px solid currentColor;font-size:10px;font-weight:800;font-style:italic;line-height:1}
      .tvr .legend{margin:0 0 10px}
      .tvr.full .review-row{padding:10px 0 4px;border-top:1px solid ${theme.border}}
      .tvr.full .review-row.main{border-top:0;padding:14px 14px 10px;border-radius:16px;margin-bottom:6px;background:linear-gradient(135deg,${isDark ? 'rgba(138,5,190,.22)' : 'rgba(138,5,190,.07)'},${isDark ? 'rgba(0,194,203,.10)' : 'rgba(0,194,203,.06)'});border:1px solid ${theme.border}}
      .tvr.full .label{display:flex;align-items:center;gap:7px;font-size:11.5px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}.tvr.full .main>.label{font-size:21px;line-height:26px;letter-spacing:-.3px;text-transform:none;margin-bottom:6px}
      .tvr .dot{width:7px;height:7px;border-radius:50%;flex:none}
      .tvr.full .topics{display:flex;flex-direction:column}
      .tvr.full .topic{display:flex;flex-direction:column;align-items:stretch;gap:5px;width:100%;min-height:44px;padding:6px 0;border:0;border-radius:8px;background:none;font-family:inherit;color:inherit;text-align:start}
      .tvr.full .top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.tvr.full .word{font-size:15px;line-height:1.3}.tvr.full .main .word{font-size:15.5px}.tvr.full .count{font-size:15px}
      .tvr button.topic{cursor:pointer}.tvr button.topic[aria-pressed=true] .word{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}.tvr button:focus-visible{outline:3px solid ${theme.primary};outline-offset:2px}
      .tvr .more{border:0;background:none;color:${toneColor.neutral};font:inherit;font-size:12px;font-weight:700;min-height:44px;cursor:pointer;text-align:start;padding:0 2px}
      .tvr .chips{display:flex;flex-wrap:wrap;gap:7px;padding:4px 0 6px}.tvr .chip{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border:1px solid;border-radius:20px;font-size:12.5px;font-weight:600}.tvr .chip b{font-weight:800;font-variant-numeric:tabular-nums}
    `}</style>
  </div>;
}
