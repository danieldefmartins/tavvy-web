/** One existing link, with keyboard-accessible ordering controls. */
import React from 'react';
import { IoTrash, IoArrowUp, IoArrowDown } from 'react-icons/io5';
import { getPlatformIcon, SOCIAL_PLATFORMS } from './PlatformPicker';
import { LinkItem } from '../../../../lib/ecard';
interface LinkEditorProps {
  link: LinkItem;
  onUpdateTitle: (title: string) => void;
  onUpdateUrl: (url: string) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDark?: boolean;
}
export default function LinkEditor({ link, onUpdateTitle, onUpdateUrl, onRemove, onMoveUp, onMoveDown, isDark = false }: LinkEditorProps) {
  const color = isDark ? '#fff' : '#202124', border = isDark ? '#475569' : '#D1D5DB';
  const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
  const label = link.title || platform?.name || link.platform;
  const button: React.CSSProperties = { minWidth:44,minHeight:44,display:'inline-flex',alignItems:'center',justifyContent:'center',border:`1px solid ${border}`,borderRadius:8,background:'transparent',color,cursor:'pointer' };
  const input: React.CSSProperties = {boxSizing:'border-box',width:'100%',minWidth:0,minHeight:44,padding:'10px',border:`1px solid ${border}`,borderRadius:8,fontSize:14,background:isDark?'#1E293B':'#fff',color};
  return <div data-link-id={link.id} style={{padding:12,borderRadius:12,background:isDark?'rgba(255,255,255,0.04)':'#FAFAFA',border:`1px solid ${border}`,minWidth:0}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,color,minWidth:0}}>{getPlatformIcon(link.platform,20)}<span style={{fontSize:13,flex:1}}>{platform?.name || link.platform}{(link.is_active===false||link.is_active===null)?' · Hidden':''}</span>
      <button type="button" style={{...button,opacity:onMoveUp?1:.35}} onClick={onMoveUp} disabled={!onMoveUp} aria-label={`Move ${label} up`}><IoArrowUp/></button>
      <button type="button" style={{...button,opacity:onMoveDown?1:.35}} onClick={onMoveDown} disabled={!onMoveDown} aria-label={`Move ${label} down`}><IoArrowDown/></button>
      <button type="button" onClick={onRemove} style={{...button,color:isDark?'#FCA5A5':'#B42318'}} aria-label={`Remove ${label}`}><IoTrash/></button>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <input aria-label={`${platform?.name || link.platform} link title`} type="text" value={link.title||''} onChange={e=>onUpdateTitle(e.target.value)} placeholder={`${platform?.name || link.platform} title`} style={input}/>
      <input aria-label={`${platform?.name || link.platform} link address`} type="text" value={link.url??link.value??''} onChange={e=>onUpdateUrl(e.target.value)} placeholder={platform?.placeholder||'URL or value'} style={input}/>
    </div>
  </div>;
}
