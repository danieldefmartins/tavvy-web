import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { useExperienceEditor } from '../lib/useExperienceEditor';
import design from '../config/design.json';

export default function ExperiencePathEditor({ pathId, onSaved, onCancel }: { pathId: string; onSaved: (id: string) => void; onCancel: () => void }) {
  const { user } = useAuth();
  const { isDark } = useThemeContext();
  const palette = isDark ? design.dark : design.light;
  const editor = useExperienceEditor(supabase, pathId, user?.id);
  const { draft, setDraft } = editor;
  if (!user) return <div><h1>Create an experience path</h1><p>Sign in to collect real places into a path of your own.</p><Link href={`/app/login?redirect=${encodeURIComponent(`/app/experience/${pathId}?edit=1`)}`}>Sign in</Link></div>;
  if (editor.loading) return <p role="status">Opening your path…</p>;
  if (editor.loadError) return <div role="alert"><p>{editor.loadError}</p><button onClick={editor.retry}>Retry</button><button onClick={onCancel}>Back</button></div>;
  const save = async (publish: boolean) => { const id = await editor.save(publish); if (id) onSaved(id); };
  return <div className="editor"><p className="eyebrow">YOUR PLACES, YOUR PLAN</p><h1>{pathId === 'new' ? 'Create a path' : 'Edit your path'}</h1><p className="intro">Bring a few real places together. Save a private draft or publish it for others to discover.</p>
    <fieldset disabled={editor.saving}>
      <label>Path title<input maxLength={200} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Give your path a name" /></label>
      <label>About this path<textarea maxLength={5000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="What makes these places worth visiting together?" /></label>
      <div className="row"><label>Category (optional)<input maxLength={80} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} /></label><label>Duration in minutes (optional)<input inputMode="numeric" value={draft.duration_minutes} onChange={e => setDraft({ ...draft, duration_minutes: e.target.value })} /></label></div>
      <label>Cover image URL (optional)<input type="url" value={draft.cover_image_url} onChange={e => setDraft({ ...draft, cover_image_url: e.target.value })} placeholder="https://…" /></label>
      <h2>Your stops</h2><p>Add places in the order you would visit them. You can move or remove a stop before saving.</p>
      {draft.stops.length === 0 && <p>No stops yet. Search for a place below.</p>}
      <ol>{draft.stops.map((stop, index) => <li key={`${stop.place_id}-${index}`}><div className="stop-heading"><strong>{index + 1}. {stop.name}</strong><div className="stop-actions"><button type="button" aria-label={`Move ${stop.name} up`} disabled={index === 0} onClick={() => editor.move(index, -1)}>↑</button><button type="button" aria-label={`Move ${stop.name} down`} disabled={index === draft.stops.length - 1} onClick={() => editor.move(index, 1)}>↓</button><button type="button" onClick={() => editor.remove(index)}>Remove</button></div></div><label>Note for this stop<textarea maxLength={2000} value={stop.note} onChange={e => setDraft({ ...draft, stops: draft.stops.map((item, i) => i === index ? { ...item, note: e.target.value } : item) })} /></label></li>)}</ol>
      <label>Find a place<input value={editor.query} onChange={e => editor.setQuery(e.target.value)} placeholder="Search by place name" /></label>
      {editor.searching ? <p role="status">Finding places…</p> : editor.searchError ? <div role="alert"><p>{editor.searchError}</p><button type="button" onClick={editor.retrySearch}>Retry search</button></div> : editor.query.trim().length >= 2 && editor.places.length === 0 ? <p>No places found. Try a more specific name.</p> : <div className="results">{editor.places.map(place => <button type="button" key={place.id} disabled={draft.stops.length >= 100} onClick={() => editor.add(place)}><strong>{place.name}</strong><span>{[place.city, place.region].filter(Boolean).join(', ') || 'Location not listed'}</span><span>Add stop +</span></button>)}</div>}
      {editor.places.length === 20 && <p>Showing the first 20 matches. Refine the name if your place is missing.</p>}
      {editor.error && <p role="alert">{editor.error}</p>}
      <div className="actions"><button type="button" className="primary" onClick={() => save(true)}>{editor.saving ? 'Saving…' : editor.published ? 'Save published changes' : 'Publish path'}</button><button type="button" onClick={() => save(false)}>{editor.published ? 'Make private & save' : 'Save private draft'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
    <style jsx>{`.editor{max-width:780px;margin:24px auto;color:${palette.text}}.eyebrow{font-size:11px;letter-spacing:1.3px;color:${palette.link};font-weight:700}h1{font-size:32px;letter-spacing:-.8px;margin:12px 0}h2{font-size:21px;margin:28px 0 8px}p{line-height:1.6;color:${palette.textSecondary}}fieldset{border:0;padding:0;margin:24px 0}label{display:flex;flex-direction:column;gap:8px;font-size:14px;font-weight:600;margin-bottom:18px}input,textarea{font:inherit;padding:13px;border:1px solid ${palette.border};border-radius:12px;color:${palette.text};background:${palette.surface};min-width:0;width:100%;box-sizing:border-box}textarea{min-height:90px;resize:vertical}input::placeholder,textarea::placeholder{color:${palette.textSecondary}}.row{display:flex;gap:16px}.row label{flex:1}ol{padding:0;list-style:none}li{padding:18px;border:1px solid ${palette.border};border-radius:16px;background:${palette.surface};margin-bottom:14px}.stop-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.stop-actions,.actions{display:flex;gap:8px;flex-wrap:wrap}button{border:1px solid ${palette.border};background:${palette.surface};color:${palette.link};padding:12px 15px;border-radius:12px;font:inherit;cursor:pointer}button:disabled{opacity:.5;cursor:default}.primary{background:${design.primary};color:white;border-color:${design.primary}}.results{display:grid;gap:8px}.results button{display:flex;align-items:flex-start;flex-direction:column;text-align:left;gap:6px}.results span{font-size:12px;color:${palette.textSecondary}}.actions{margin-top:26px}input:focus,textarea:focus,button:focus-visible{outline:2px solid ${palette.link};outline-offset:2px}@media(max-width:550px){.row{display:block}.stop-heading{align-items:flex-start;flex-direction:column}}`}</style>
  </div>;
}
