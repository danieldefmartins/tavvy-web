import { useState } from 'react';
import DemoDialog from './DemoDialog';
import { demoReviewChoices } from '../../lib/demoRestaurant';
import type { EvidenceVisit } from '../../lib/placeEvidence';
export default function DemoReview({ onClose, onSave }: { onClose: () => void; onSave: (review: EvidenceVisit) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <DemoDialog title="What was your experience?" onClose={onClose}>
    <p>Tap what stood out. Your taps update this place’s review summary on this device.</p>
    {demoReviewChoices.map(group => <fieldset key={group.title}><legend>{group.title}</legend><div className="choices">{group.choices.map(choice => <button key={choice.slug} aria-pressed={selected.includes(choice.slug)} onClick={() => setSelected(old => old.includes(choice.slug) ? old.filter(s => s !== choice.slug) : [...old, choice.slug])}>{choice.label}</button>)}</div></fieldset>)}
    <button className="demo-primary" disabled={!selected.length} onClick={() => onSave({ reviewId: 'demo-your-review', userId: 'demo-you', visitedAt: new Date().toISOString(), signals: demoReviewChoices.flatMap(g => [...g.choices]).filter(c => selected.includes(c.slug)) })}>Add {selected.length || ''} tap{selected.length === 1 ? '' : 's'}</button>
    <style jsx>{`fieldset{border:0;padding:0;margin:20px 0}legend{font-weight:800;margin-bottom:10px}.choices{display:flex;gap:8px;flex-wrap:wrap}.choices button{padding:11px 12px;border:1px solid #c8d7d1;border-radius:20px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}.choices button[aria-pressed=true]{color:#fff;background:#155d50;border-color:#155d50}`}</style>
  </DemoDialog>;
}
