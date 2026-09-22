import React, { useId, useState } from 'react';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { cardReviewRows, reviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

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
const Chevron = () => <svg className="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

/**
 * Shared presentation: every displayed topic is one row whose background is its frequency bar
 * (people who mentioned it out of recent reviewers, one scale per place), with the word and the
 * count on top. Bar length is frequency, never quality or severity; concerns keep their "!"
 * marker so a rarely mentioned serious concern stays visible. Compact mode is the search card
 * (one expandable row per section); full mode is the place page (rows select a topic to show
 * matching experiences). Historical name retained for callers; there is no four-tile grid.
 */
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect }: ReviewSummaryProps) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const id = useId();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [about, setAbout] = useState(false);
  const compact = mode === 'compact';
  const sections = compact ? cardReviewRows(summary) : reviewSections(summary);
  const count = summary.recentReviewers || 0;
  const label = summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable';
  if (summary.status !== 'ready') return <div className="review-empty" role="status" style={{ color: theme.textSecondary, fontSize: 12, lineHeight: '18px', paddingBlock: compact ? 2 : 14 }}>{copy(label)}</div>;
  const toneColor: Record<Tone, string> = { positive: isDark ? '#58D9DE' : '#067A80', neutral: isDark ? '#D9B6FF' : '#74209A', concern: isDark ? '#FFD38A' : '#885000' };
  const fillTint: Record<Tone, string> = { positive: isDark ? '#204b4c' : '#b6e9e8', neutral: isDark ? '#4b315f' : '#e3cef4', concern: isDark ? '#5a3c18' : '#f8dca6' };
  const trackColor = isDark ? '#29252f' : '#f1f0f4';
  const showBars = count >= BAR_MIN_PEOPLE;
  const evidenceLine = copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} people · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count));
  const hasMainConcern = sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern'));
  const emptyText = (key: ReviewTileKey) => copy(key === 'headsup' && count > 0 ? (hasMainConcern ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed');
  const width = (topic: ReviewTopic) => showBars ? `${Math.max(2, Math.round((topic.count / Math.max(count, 1)) * 100))}%` : '0%';
  const toneOf = (section: ReviewTileKey, topic: ReviewTopic): Tone => topic.tone === 'concern' ? 'concern' : SECTION_TONE[section] === 'neutral' && section !== 'main' ? 'neutral' : 'positive';
  const toggle = (key: string) => setExpanded(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]);
  const labelColor = (section: ReviewTileKey) => section === 'main' ? toneColor.neutral : theme.textSecondary;

  const wordOf = (topic: ReviewTopic) => {
    const olderDate = topic.lastReportedAt ? topic.lastReportedAt.slice(0, 10) : '';
    return <span className="word" title={compact && topic.older ? `${copy('Older report')}${olderDate ? ` · ${olderDate}` : ''}` : undefined}>
      {topic.tone === 'concern' && <span className="mark" aria-hidden="true">!</span>}
      {topic.label}
      {topic.older && <small className="older"> · {compact ? copy('Older') : copy('Older report')}{!compact && olderDate ? ` · ${olderDate}` : ''}</small>}
    </span>;
  };

  // One row: the bar is the background; label (optional), word and count sit on it.
  const barRow = (section: ReviewTileKey, topic: ReviewTopic, options: { title?: string; onClick?: () => void; expandedState?: boolean; controls?: string; pressed?: boolean; ariaLabel?: string } = {}) => {
    const tone = toneOf(section, topic);
    const inner = <>
      <span className="fill" aria-hidden="true" style={{ width: width(topic), background: fillTint[tone] }} />
      {options.title && <span className="wlabel" style={{ color: labelColor(section) }}>{copy(options.title)}</span>}
      {wordOf(topic)}
      <b className="count">{topic.count}</b>
      {options.expandedState !== undefined && <Chevron />}
    </>;
    const style = { background: trackColor };
    return options.onClick
      ? <button type="button" key={topic.slug || topic.label} className={`wrow ${topic.tone}`} data-review-topic={topic.tone} style={style} aria-expanded={options.expandedState} aria-controls={options.controls} aria-pressed={options.pressed} aria-label={options.ariaLabel} onClick={options.onClick}>{inner}</button>
      : <span key={topic.slug || topic.label} className={`wrow ${topic.tone}`} data-review-topic={topic.tone} style={style}>{inner}</span>;
  };

  const rows = sections.map(section => {
    const open = expanded.includes(section.key);
    const main = section.key === 'main';
    if (compact) {
      const [top, ...rest] = section.topics;
      const controls = `${id}-${section.key}-more`;
      return <div key={section.key} className={`review-row ${section.key}`} data-review-section={section.key}>
        {top
          ? barRow(section.key, top, { title: section.title, onClick: rest.length ? () => toggle(section.key) : undefined, expandedState: rest.length ? open : undefined, controls: rest.length ? controls : undefined })
          : <span className="wrow empty-row" style={{ background: trackColor }}><span className="wlabel" style={{ color: labelColor(section.key) }}>{copy(section.title)}</span><span className="empty">{emptyText(section.key)}</span></span>}
        {open && rest.length > 0 && <div className="more" id={controls}>{rest.map(topic => barRow(section.key, topic))}</div>}
      </div>;
    }
    // The place page reads praise first, then the concerns reported beside it, on the same scale.
    const ordered = main ? [...section.topics.filter(topic => topic.tone !== 'concern'), ...section.topics.filter(topic => topic.tone === 'concern')] : section.topics;
    const topics = !main && !open ? ordered.slice(0, FULL_INITIAL_TOPICS) : ordered;
    return <div key={section.key} className={`review-row ${section.key}`} data-review-section={section.key}>
      <span className="label" style={{ color: toneColor[SECTION_TONE[section.key]] }}>{!main && <span className="dot" aria-hidden="true" style={{ background: ACCENT[SECTION_TONE[section.key]] }} />}{copy(section.title)}</span>
      <div className="rows">
        {topics.map(topic => barRow(section.key, topic, onSelect ? { onClick: () => onSelect(section.key, topic), pressed: selectedTopic === topic.label, ariaLabel: `${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}` } : {}))}
        {!topics.length && <span className="empty">{emptyText(section.key)}</span>}
      </div>
      {!main && section.topics.length > FULL_INITIAL_TOPICS && <button type="button" className="more-btn" aria-expanded={open} onClick={() => toggle(section.key)}>{copy(open ? 'Show less' : 'Show all')}</button>}
    </div>;
  });

  // Rows are built by helpers above, outside the returned JSX, so scoped styled-jsx classes
  // would not reach them; the stylesheet is global and anchored to the .tvr root instead.
  return <div className={`tvr review-summary-content ${compact ? 'compact' : 'full'}`} data-review-summary={summary.status} aria-label={copy('Recent reviews')}>
    {compact && <div className="evidence-note head"><b>{copy('Reviews')}</b> · {evidenceLine}</div>}
    {!compact && <div className="evidence-line">
      <span className="evidence-note">{evidenceLine}</span>
      <button type="button" className="about" aria-expanded={about} aria-controls={`${id}-about`} onClick={() => setAbout(value => !value)}><span className="info" aria-hidden="true">i</span>{copy('About these numbers')}</button>
    </div>}
    {!compact && about && <p className="legend" id={`${id}-about`}>{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')}{showBars && <> {copy('Bars show how many of the {{count}} people mentioned it').replace('{{count}}', String(count))}.</>}{onSelect && <> {copy('Choose a topic to see experiences.')}</>}</p>}
    {rows}
    {!compact && !!summary.practical?.length && <div className="review-row practical" data-review-practical="true">
      <span className="label" style={{ color: theme.textSecondary }}><span className="dot" aria-hidden="true" style={{ background: theme.textSecondary }} />{copy('Good to know')}</span>
      <div className="chips">{summary.practical.map(item => <span key={item.label} className="chip" style={{ background: theme.surface, borderColor: theme.border, color: theme.textSecondary }}>{item.label}<b>{item.count}</b></span>)}</div>
    </div>}
    <style jsx global>{`
      .tvr{color:${theme.text};text-align:start;min-width:0}.tvr .review-row{min-width:0}
      .tvr .empty,.tvr .evidence-note,.tvr .legend{font-size:11px;line-height:17px;color:${theme.textSecondary}}
      .tvr .mark{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:${ACCENT.concern};color:#17013A;font-size:9.5px;font-weight:900;line-height:1;flex:none;margin-inline-end:5px;vertical-align:-2px}
      .tvr .wrow{position:relative;isolation:isolate;display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:6px 11px;border:0;border-radius:8px;overflow:hidden;font:inherit;color:${theme.text};text-align:start;cursor:default}
      .tvr button.wrow{cursor:pointer}.tvr button.wrow:focus-visible{outline:3px solid ${theme.primary};outline-offset:2px}
      @media(pointer:coarse){.tvr .wrow{min-height:44px}}
      .tvr .wrow .fill{position:absolute;z-index:-1;inset-block:0;inset-inline-start:0;border-radius:8px 4px 4px 8px;pointer-events:none}
      .tvr .wlabel{flex:none;font-size:11px;line-height:1.3;font-weight:600}
      .tvr .word{flex:1;min-width:0;overflow-wrap:anywhere;font-size:14px;line-height:1.3;font-weight:600;color:${theme.text}}.tvr .older{font-size:11px;font-weight:600;opacity:.85}
      .tvr .count{flex:none;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;color:${theme.text}}
      .tvr .chev{flex:none;color:${theme.textSecondary};transition:transform .15s}.tvr button.wrow[aria-expanded=true] .chev{transform:rotate(180deg)}
      .tvr button.wrow[aria-pressed=true] .word{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
      .tvr .empty-row .empty{flex:1}

      .tvr.compact .head{font-size:12px;line-height:17px;margin-bottom:8px}.tvr.compact .head b{color:${theme.text};font-weight:800}
      .tvr.compact .review-row+.review-row{margin-top:6px}
      .tvr.compact .more{display:flex;flex-direction:column;gap:3px;padding:3px 0 2px}.tvr.compact .more .wrow{padding-inline-start:23px;min-height:32px}.tvr.compact .more .wrow::after{content:'';flex:0 0 14px}

      .tvr.full .evidence-line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}.tvr.full .evidence-note{font-size:13px;line-height:18px;font-weight:650;color:${theme.text}}
      .tvr .about{display:inline-flex;align-items:center;gap:6px;border:0;background:none;padding:0 2px;min-height:44px;font:inherit;font-size:12px;font-weight:600;color:${theme.textSecondary};cursor:pointer}.tvr .info{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1.5px solid currentColor;font-size:10px;font-weight:800;font-style:italic;line-height:1}
      .tvr .legend{margin:0 0 10px}
      .tvr.full .review-row{padding:8px 0 4px}
      .tvr.full .label{display:flex;align-items:center;gap:7px;font-size:11.5px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}.tvr.full .main>.label{font-size:20px;line-height:25px;letter-spacing:-.3px;text-transform:none;margin-bottom:8px}
      .tvr .dot{width:7px;height:7px;border-radius:50%;flex:none}
      .tvr.full .rows{display:flex;flex-direction:column;gap:5px}
      .tvr.full .wrow{min-height:44px;padding:8px 12px}.tvr.full .word{font-size:15px}.tvr.full .main .word{font-size:15.5px}
      .tvr .more-btn{border:0;background:none;color:${toneColor.neutral};font:inherit;font-size:12px;font-weight:700;min-height:44px;cursor:pointer;text-align:start;padding:0 2px}
      .tvr .chips{display:flex;flex-wrap:wrap;gap:7px;padding:4px 0 6px}.tvr .chip{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border:1px solid;border-radius:20px;font-size:12.5px;font-weight:600}.tvr .chip b{font-weight:800;font-variant-numeric:tabular-nums}
    `}</style>
  </div>;
}
