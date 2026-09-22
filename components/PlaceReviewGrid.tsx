import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { reviewSummaryCopy, reviewMentionCopy } from '../lib/reviewSummaryCopy';
import React from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import type { PlaceReviewSummary, ReviewTileKey } from '../lib/placeReviewSummary';

const COLORS: Record<ReviewTileKey, [string, string, string]> = {
  main: ['#2455A6', '#ADC8FF', 'rgba(69,121,214,.12)'],
  good: ['#067A80', '#58D9DE', 'rgba(0,194,203,.12)'],
  vibe: ['#74209A', '#D9B6FF', 'rgba(138,5,190,.10)'],
  headsup: ['#885000', '#FFD38A', 'rgba(245,166,35,.12)'],
};
export default function PlaceReviewGrid({ summary, explain = false }: { summary: PlaceReviewSummary; explain?: boolean }) {
  const { isDark, theme } = useThemeContext();
  const copy = useReleaseCopy();
  if (explain && summary.status !== 'ready') return <div style={{borderRadius:12,padding:12,background:theme.surface,color:theme.text}}>
    <b style={{fontSize:13}}>{copy('Tavvy reviews')}</b>
    <p role="status" style={{fontSize:12,lineHeight:1.5,color:theme.textSecondary,margin:'5px 0 0'}}>{copy(summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable')}</p>
  </div>;
  return <div className="review-grid" data-review-summary={summary.status} aria-label={copy("Recent reviews")}>
    {explain && <div style={{gridColumn:'1 / -1',padding:'2px 0',color:theme.text}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8,flexWrap:'wrap'}}><b style={{fontSize:13}}>{copy('Tavvy reviews')}</b>{!!summary.recentReviewers && <span style={{fontSize:11,color:theme.textSecondary}}>{summary.recentReviewers} {copy(summary.recentReviewers === 1 ? 'recent reviewer' : 'recent reviewers')}</span>}</div>
      <p style={{fontSize:11,lineHeight:1.5,margin:'4px 0 0',color:theme.textSecondary}}>{copy('What recent visitors experienced')}</p>
    </div>}
    {summary.tiles.map(tile => <span className="review-tile" key={tile.key} data-review-tile={tile.key} style={{ background: COLORS[tile.key][2], borderColor: theme.border }}>
      <strong style={{ color: COLORS[tile.key][isDark ? 1 : 0] }}>{reviewSummaryCopy(tile.title, copy)}</strong>
      <span className="detail">{reviewSummaryCopy(tile.detail, copy)}</span>
      {tile.count != null && tile.count > 0 && <span className="note">{reviewMentionCopy(tile.count, copy)}</span>}
      {tile.note && <span className="note">{reviewSummaryCopy(tile.note, copy)}</span>}
    </span>)}
    <style jsx>{`.review-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.review-tile{display:flex;flex-direction:column;gap:5px;min-width:0;padding:10px;border:1px solid;border-radius:12px;text-align:left;overflow-wrap:anywhere;color:${theme.text}}strong{font-size:11px;line-height:1.3;font-weight:700}.detail{font-size:12px;line-height:1.4;font-weight:600}.note{font-size:11px;line-height:1.35;font-weight:400;color:${theme.textSecondary}}`}</style>
  </div>;
}
