import React from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import type { PlaceReviewSummary, ReviewTileKey } from '../lib/placeReviewSummary';

const COLORS: Record<ReviewTileKey, [string, string, string]> = {
  main: ['#2455A6', '#ADC8FF', 'rgba(69,121,214,.12)'],
  good: ['#067A80', '#58D9DE', 'rgba(0,194,203,.12)'],
  vibe: ['#74209A', '#D9B6FF', 'rgba(138,5,190,.10)'],
  headsup: ['#885000', '#FFD38A', 'rgba(245,166,35,.12)'],
};
export default function PlaceReviewGrid({ summary }: { summary: PlaceReviewSummary }) {
  const { isDark, theme } = useThemeContext();
  return <div className="review-grid" data-review-summary={summary.status} aria-label="Recent reviews">
    {summary.tiles.map(tile => <span className="review-tile" key={tile.key} data-review-tile={tile.key} style={{ background: COLORS[tile.key][2], borderColor: theme.border }}>
      <strong style={{ color: COLORS[tile.key][isDark ? 1 : 0] }}>{tile.title}</strong>
      <span className="detail">{tile.detail}</span>
      {tile.count != null && tile.count > 0 && <span className="note">{tile.count} {tile.count === 1 ? 'person' : 'people'} mentioned this</span>}
      {tile.note && <span className="note">{tile.note}</span>}
    </span>)}
    <style jsx>{`.review-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.review-tile{display:flex;flex-direction:column;gap:5px;min-width:0;padding:10px;border:1px solid;border-radius:12px;text-align:left;overflow-wrap:anywhere;color:${theme.text}}strong{font-size:11px;line-height:1.3;font-weight:700}.detail{font-size:12px;line-height:1.4;font-weight:600}.note{font-size:11px;line-height:1.35;font-weight:400;color:${theme.textSecondary}}`}</style>
  </div>;
}
