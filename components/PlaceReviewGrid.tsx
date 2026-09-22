import React, { useState } from 'react';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { compactReviewSections, reviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

export interface ReviewSummaryProps {
  summary: PlaceReviewSummary; explain?: boolean; mode?: 'compact' | 'full'; selectedTopic?: string | null;
  onSelect?: (section: ReviewTileKey, topic: ReviewTopic) => void;
}
/** Shared presentation. Historical name retained for callers; there is no four-tile grid. */
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect }: ReviewSummaryProps) {
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const [expanded, setExpanded] = useState<string[]>([]);
  const compact = mode === 'compact';
  const sections = compact ? compactReviewSections(summary) : reviewSections(summary);
  const count = summary.recentReviewers || 0;
  const label = summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable';
  if (summary.status !== 'ready') return <div className="review-empty" role="status" style={{ color: theme.textSecondary, fontSize: 12, lineHeight: '18px', paddingBlock: compact ? 2 : 14 }}>{copy(label)}</div>;
  const topicContent = (topic: ReviewTopic) => <>{topic.tone === 'concern' && <span aria-hidden="true">! </span>}{topic.label} <b>{topic.count}</b>{topic.older && <small> · {copy('Older report')}{topic.lastReportedAt ? ` · ${topic.lastReportedAt.slice(0, 10)}` : ''}</small>}</>;
  return <div className={`review-summary-content ${compact ? 'compact' : 'full'}`} data-review-summary={summary.status} aria-label={copy('Recent reviews')}>
    {sections.map(section => {
      const topics = compact || expanded.includes(section.key) ? section.topics : section.topics.slice(0, 6);
      return <div key={section.key} className={`review-row ${section.key}`} data-review-section={section.key}>
        <span className="label">{copy(section.title)}</span>
        <div className="topics">
          {topics.map(topic => !compact && onSelect ? <button type="button" key={topic.slug || topic.label} className={`topic ${topic.tone}`} aria-pressed={selectedTopic === topic.label} aria-label={`${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`} onClick={() => onSelect(section.key, topic)}>{topicContent(topic)}<span className="chevron" aria-hidden="true">›</span></button>
            : <span key={topic.slug || topic.label} className={`topic ${topic.tone}`}>{topicContent(topic)}</span>)}
          {!topics.length && <span className="empty">{copy(section.key === 'headsup' && count > 0 ? (sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern')) ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed')}</span>}
          {!compact && section.topics.length > 6 && <button type="button" className="more" aria-expanded={expanded.includes(section.key)} onClick={() => setExpanded(previous => previous.includes(section.key) ? previous.filter(key => key !== section.key) : [...previous, section.key])}>{copy(expanded.includes(section.key) ? 'Show less' : 'Show all')}</button>}
        </div>
      </div>;
    })}
    <div className="evidence-note">{copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} reviewers · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count))}</div>
    {!compact && <p className="legend">{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')}{onSelect && <> {copy('Choose a topic to see experiences.')}</>}</p>}
    <style jsx>{`
      .review-summary-content{color:${theme.text};text-align:start;min-width:0}.review-row{min-width:0}.compact .review-row{display:flex;align-items:baseline;gap:8px;margin-bottom:5px}.label{font-size:12px;line-height:18px;font-weight:650;flex-shrink:0;color:${theme.textSecondary}}.main>.label{color:${isDark ? '#D9B6FF' : '#74209A'}}.topics{display:flex;align-items:baseline;flex-wrap:wrap;gap:5px 10px;min-width:0}.topic{font-size:13px;line-height:19px;overflow-wrap:anywhere}.topic b{font-variant-numeric:tabular-nums;font-weight:750;color:${theme.text};margin-inline-start:3px}.concern{color:${isDark ? '#FFD38A' : '#885000'}}.empty,.evidence-note,.legend{font-size:11px;line-height:17px;color:${theme.textSecondary}}.evidence-note{margin-top:7px}.full .review-row{padding:12px 0;border-bottom:1px solid ${theme.border}}.full .label{display:block;font-size:13px;margin-bottom:7px}.full .main>.label{font-size:17px;line-height:23px;font-weight:750}.full .topic{display:inline-flex;align-items:center;gap:4px;background:${theme.surface};border:1px solid ${theme.border};border-radius:10px;padding:9px 11px;min-height:44px;box-sizing:border-box;text-align:start;font-family:inherit;color:${theme.text}}.full .concern{color:${isDark ? '#FFD38A' : '#885000'}}button.topic{cursor:pointer}button.topic[aria-pressed=true]{border-color:${theme.primary};box-shadow:0 0 0 1px ${theme.primary}}button:focus-visible{outline:3px solid ${theme.primary};outline-offset:2px}.chevron{margin-inline-start:5px;color:${theme.textSecondary}}.more{border:0;background:none;color:${isDark ? '#D9B6FF' : theme.primary};font:inherit;font-size:12px;min-height:44px;cursor:pointer}.legend{margin:5px 0 0}.full .evidence-note{margin-top:12px;font-size:12px}.topic small{font-size:11px}
    `}</style>
  </div>;
}
