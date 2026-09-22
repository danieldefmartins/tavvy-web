import React, { useId, useState } from 'react';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { cardReviewRows, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

export interface ReviewSummaryProps {
  summary: PlaceReviewSummary; explain?: boolean; mode?: 'compact' | 'full'; selectedTopic?: string | null;
  /** Full mode: a row selects its word (to show matching experiences). */
  onSelect?: (section: ReviewTileKey, topic: ReviewTopic) => void;
  /** Compact mode: a row opens the place's reviews instead of expanding in place (Overview teaser). */
  onOpen?: (section: ReviewTileKey, topic: ReviewTopic) => void;
}
type Tone = ReviewTopic['tone'];
const SECTION_TONE: Record<ReviewTileKey, Tone> = { main: 'neutral', good: 'positive', vibe: 'neutral', headsup: 'concern' };
const ACCENT: Record<Tone, string> = { positive: '#00C2CB', neutral: '#8A05BE', concern: '#F5A623' };
// Bars need enough people to mean something; below this a tiny sample would look like a full bar.
const BAR_MIN_PEOPLE = 5;
const Chevron = () => <svg className="chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

/**
 * Shared presentation: one row per section (the core experience, The Good, The Vibe, Heads Up).
 * A row's background is its frequency bar (people who mentioned it out of recent reviewers, one
 * scale per place) with the section label, the word and the count on top; a chevron opens the
 * section's other words. Bar length is frequency, never quality or severity; concerns keep their
 * "!" marker so a rarely mentioned serious concern stays visible. Compact mode is the search card
 * and the Overview teaser; full mode is the Reviews tab, where every word can be selected to show
 * matching experiences. Historical name retained for callers; there is no four-tile grid.
 */
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect, onOpen }: ReviewSummaryProps) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const id = useId();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [about, setAbout] = useState(false);
  const compact = mode === 'compact';
  const sections = cardReviewRows(summary);
  const count = summary.recentReviewers || 0;
  const label = summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable';
  if (summary.status !== 'ready') return <div className="review-empty" role="status" style={{ color: theme.textSecondary, fontSize: 12, lineHeight: '18px', paddingBlock: compact ? 2 : 14 }}>{copy(label)}</div>;
  const toneColor: Record<Tone, string> = { positive: isDark ? '#58D9DE' : '#067A80', neutral: isDark ? '#D9B6FF' : '#74209A', concern: isDark ? '#FFD38A' : '#885000' };
  const fillTint: Record<Tone, string> = { positive: isDark ? '#204b4c' : '#b6e9e8', neutral: isDark ? '#4b315f' : '#e3cef4', concern: isDark ? '#5a3c18' : '#f8dca6' };
  const trackColor = isDark ? '#29252f' : '#f1f0f4';
  // Accent for labels and controls: the logo's teal (text-safe shades), not the purple used for atmosphere.
  const accent = isDark ? '#58D9DE' : '#067A80';
  const showBars = count >= BAR_MIN_PEOPLE;
  const evidenceLine = copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} people · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count));
  const hasConcern = sections.some(row => row.key === 'headsup' && row.topics.length > 0);
  const emptyText = (key: ReviewTileKey) => copy(key === 'headsup' && count > 0 ? (hasConcern ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed');
  const width = (topic: ReviewTopic) => showBars ? `${Math.max(2, Math.round((topic.count / Math.max(count, 1)) * 100))}%` : '0%';
  const toneOf = (section: ReviewTileKey, topic: ReviewTopic): Tone => topic.tone === 'concern' ? 'concern' : SECTION_TONE[section] === 'neutral' && section !== 'main' ? 'neutral' : 'positive';
  const toggle = (key: string) => setExpanded(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]);
  const labelColor = (section: ReviewTileKey) => section === 'main' ? accent : theme.textSecondary;
  const selectLabel = (topic: ReviewTopic) => `${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`;

  const wordOf = (topic: ReviewTopic) => {
    const olderDate = topic.lastReportedAt ? topic.lastReportedAt.slice(0, 10) : '';
    return <span className="word" title={compact && topic.older ? `${copy('Older report')}${olderDate ? ` · ${olderDate}` : ''}` : undefined}>
      {topic.tone === 'concern' && <span className="mark" aria-hidden="true">!</span>}
      {topic.label}
      {topic.older && <small className="older"> · {compact ? copy('Older') : copy('Older report')}{!compact && olderDate ? ` · ${olderDate}` : ''}</small>}
    </span>;
  };
  const fillOf = (section: ReviewTileKey, topic: ReviewTopic) => <span className="fill" aria-hidden="true" style={{ width: width(topic), background: fillTint[toneOf(section, topic)] }} />;

  // Compact: the whole row is one control (expand, or open the reviews).
  const compactRow = (section: ReviewTileKey, topic: ReviewTopic, title: string | null, rest: number, open: boolean, controls: string) => {
    const content = <>{fillOf(section, topic)}{title && <span className="wlabel" style={{ color: labelColor(section) }}>{copy(title)}</span>}{wordOf(topic)}<b className="count">{topic.count}</b>{rest > 0 && !onOpen && <Chevron />}</>;
    const action = onOpen ? () => onOpen(section, topic) : rest > 0 ? () => toggle(section) : undefined;
    return action
      ? <button type="button" key={topic.slug || topic.label} className={`wrow ${topic.tone}`} data-review-topic={topic.tone} style={{ background: trackColor }} aria-expanded={onOpen ? undefined : open} aria-controls={onOpen || !rest ? undefined : controls} onClick={action}>{content}</button>
      : <span key={topic.slug || topic.label} className={`wrow ${topic.tone}`} data-review-topic={topic.tone} style={{ background: trackColor }}>{content}</span>;
  };

  // Full: the row selects its word; a separate chevron opens the section's other words.
  const fullRow = (section: ReviewTileKey, topic: ReviewTopic, title: string | null, rest: number, open: boolean, controls: string) => {
    const pressed = selectedTopic === topic.label;
    return <div key={topic.slug || topic.label} className={`wrow ${topic.tone} shell`} data-review-topic={topic.tone} style={{ background: trackColor }}>
      {fillOf(section, topic)}
      {onSelect
        ? <button type="button" className="wsel" aria-pressed={pressed} aria-label={selectLabel(topic)} onClick={() => onSelect(section, topic)}>{title && <span className="wlabel" style={{ color: labelColor(section) }}>{copy(title)}</span>}{wordOf(topic)}<b className="count">{topic.count}</b></button>
        : <span className="wsel">{title && <span className="wlabel" style={{ color: labelColor(section) }}>{copy(title)}</span>}{wordOf(topic)}<b className="count">{topic.count}</b></span>}
      {rest > 0 && <button type="button" className="wtoggle" aria-expanded={open} aria-controls={controls} aria-label={copy(open ? 'Show less' : 'Show all')} onClick={() => toggle(section)}><Chevron /></button>}
    </div>;
  };

  const rows = sections.map(section => {
    const open = expanded.includes(section.key);
    const [top, ...rest] = section.topics;
    const controls = `${id}-${section.key}-more`;
    return <div key={section.key} className={`review-row ${section.key}`} data-review-section={section.key}>
      {top
        ? (compact ? compactRow(section.key, top, section.title, rest.length, open, controls) : fullRow(section.key, top, section.title, rest.length, open, controls))
        : <span className="wrow empty-row" style={{ background: trackColor }}><span className="wlabel" style={{ color: labelColor(section.key) }}>{copy(section.title)}</span><span className="empty">{emptyText(section.key)}</span></span>}
      {open && rest.length > 0 && <div className="more" id={controls}>{rest.map(topic => compact ? compactRow(section.key, topic, null, 0, false, controls) : fullRow(section.key, topic, null, 0, false, controls))}</div>}
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
      .tvr{color:${theme.text};text-align:start;min-width:0}.tvr .review-row{min-width:0}.tvr .review-row+.review-row{margin-top:6px}
      .tvr .empty,.tvr .evidence-note,.tvr .legend{font-size:11px;line-height:17px;color:${theme.textSecondary}}
      .tvr .mark{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:${ACCENT.concern};color:#17013A;font-size:9.5px;font-weight:900;line-height:1;flex:none;margin-inline-end:5px;vertical-align:-2px}
      .tvr .wrow{position:relative;isolation:isolate;display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:6px 11px;border:0;border-radius:8px;overflow:hidden;font:inherit;color:${theme.text};text-align:start;cursor:default}
      .tvr .wrow.shell{padding:0}
      .tvr button.wrow{cursor:pointer}.tvr button.wrow:focus-visible,.tvr .wsel:focus-visible,.tvr .wtoggle:focus-visible{outline:3px solid ${ACCENT.positive};outline-offset:-3px}
      @media(pointer:coarse){.tvr .wrow{min-height:44px}}
      .tvr .wrow .fill{position:absolute;z-index:-1;inset-block:0;inset-inline-start:0;border-radius:8px 4px 4px 8px;pointer-events:none}
      .tvr .wsel{display:flex;flex:1;min-width:0;align-items:center;gap:8px;min-height:inherit;padding:6px 11px;border:0;background:none;font:inherit;color:inherit;text-align:start}.tvr button.wsel{cursor:pointer}
      .tvr .wtoggle{flex:none;width:44px;align-self:stretch;border:0;background:none;color:${theme.textSecondary};cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
      .tvr .wlabel{flex:none;font-size:11px;line-height:1.3;font-weight:600}
      .tvr .word{flex:1;min-width:0;overflow-wrap:anywhere;font-size:14px;line-height:1.3;font-weight:600;color:${theme.text}}.tvr .older{font-size:11px;font-weight:600;opacity:.85}
      .tvr .count{flex:none;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;color:${theme.text}}
      .tvr .chev{flex:none;color:${theme.textSecondary};transition:transform .15s}.tvr button.wrow[aria-expanded=true] .chev,.tvr .wtoggle[aria-expanded=true] .chev{transform:rotate(180deg)}
      .tvr .wsel[aria-pressed=true] .word{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
      .tvr .empty-row .empty{flex:1}
      .tvr .more{display:flex;flex-direction:column;gap:3px;padding:3px 0 2px}.tvr .more .wrow{padding-inline-start:12px;min-height:32px}.tvr.compact .more .wrow::after{content:'';flex:0 0 15px}.tvr.full .more .wrow.shell{padding-inline-start:0}.tvr.full .more .wsel{padding-inline-start:23px}.tvr.full .more .wrow.shell::after{content:'';flex:0 0 44px}

      .tvr.compact .head{font-size:12px;line-height:17px;margin-bottom:8px}.tvr.compact .head b{color:${theme.text};font-weight:800}

      .tvr.full .evidence-line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.tvr.full .evidence-note{font-size:13px;line-height:18px;font-weight:650;color:${theme.text}}
      .tvr .about{display:inline-flex;align-items:center;gap:6px;border:0;background:none;padding:0 2px;min-height:44px;font:inherit;font-size:12px;font-weight:600;color:${theme.textSecondary};cursor:pointer}.tvr .info{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1.5px solid currentColor;font-size:10px;font-weight:800;font-style:italic;line-height:1}
      .tvr .legend{margin:0 0 10px}
      .tvr.full .wrow{min-height:44px}.tvr.full .word{font-size:15px}.tvr.full .wlabel{font-size:12px}
      .tvr.full .review-row.practical{margin-top:12px}
      .tvr .label{display:flex;align-items:center;gap:7px;font-size:11.5px;line-height:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
      .tvr .dot{width:7px;height:7px;border-radius:50%;flex:none}
      .tvr .chips{display:flex;flex-wrap:wrap;gap:7px;padding:4px 0 6px}.tvr .chip{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border:1px solid;border-radius:20px;font-size:12.5px;font-weight:600}.tvr .chip b{font-weight:800;font-variant-numeric:tabular-nums}
    `}</style>
  </div>;
}
