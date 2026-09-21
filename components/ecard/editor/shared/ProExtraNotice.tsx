import { useReleaseCopy } from '../../../../hooks/useReleaseCopy';
import React from 'react';
import Link from 'next/link';

/** Shown before an add action; dismissing never changes existing card content. */
export default function ProExtraNotice({ feature, isDark, onDismiss }: { feature: string; isDark: boolean; onDismiss: () => void }) {
  const copy = useReleaseCopy();
  return <div role="alert" data-pro-extra-notice style={{padding:16,margin:'12px 0',border:'1px solid #9B6FC4',borderRadius:12,background:isDark?'#302139':'#F7F0FD',color:isDark?'#F3E8FF':'#41225C'}}>
    <p style={{margin:'0 0 12px',fontSize:14,lineHeight:1.5}}>{copy(feature)} — {copy("Requires Pro")}. {copy("Your existing content stays on your card.")}</p>
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <button type="button" onClick={onDismiss} style={{minHeight:44,padding:'8px 12px',border:'1px solid currentColor',borderRadius:8,background:"transparent",color:'inherit',cursor:'pointer'}}>{copy("Keep editing")}</button>
      <Link href="/app/ecard/premium" style={{color:'inherit',fontWeight:600,minHeight:44,display:'inline-flex',alignItems:'center'}}>{copy("View Pro plan")}</Link>
    </div>
  </div>;
}
