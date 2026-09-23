import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { REVIEW_WISHLIST_CATEGORIES, submitReviewWishlist } from '../lib/reviewWishlist';

const DONE_KEY = '@tavvy_review_wishlist_done';
const PURPLE = '#8A05BE';

/** Tools page block: bold "Add a place" call-to-action + a short survey about what people want to review next. */
export default function ReviewWishlistCard() {
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [missing, setMissing] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { try { if (localStorage.getItem(DONE_KEY)) setDone(true); } catch {} }, []);
  const toggle = (id: string) => setCategories(old => old.includes(id) ? old.filter(c => c !== id) : [...old, id]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setError('');
    try {
      await submitReviewWishlist({ platform: 'web', userId: user?.id ?? null, missingPlaces: missing, productCategories: categories, otherText: other, locale: router.locale });
      setDone(true); setOpen(false);
      try { localStorage.setItem(DONE_KEY, new Date().toISOString()); } catch {}
    } catch (err) { setError((err as Error).message); }
    finally { setSending(false); }
  }
  const accent = isDark ? '#D8B4FE' : PURPLE;
  const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 80, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 12, fontSize: 15, font: 'inherit', color: theme.text, background: theme.surface, resize: 'vertical' };
  const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, padding: '0 22px', borderRadius: 14, background: PURPLE, color: '#fff', fontSize: 16, fontWeight: 700, border: 0, cursor: 'pointer', textDecoration: 'none' };
  return <section aria-labelledby="review-wishlist-title" style={{ border: `1px solid ${isDark ? '#4D365E' : '#E0D0EE'}`, background: isDark ? '#2A1740' : '#F3E8FA', borderRadius: 20, padding: 22, margin: '0 0 30px' }}>
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: accent, margin: '0 0 10px' }}>REVIEW ANYTHING</p>
    <h2 id="review-wishlist-title" style={{ fontSize: 22, letterSpacing: -0.4, margin: 0, color: theme.text }}>What places are you missing?</h2>
    <p style={{ fontSize: 14, lineHeight: 1.5, color: theme.textSecondary, margin: '8px 0 0', maxWidth: 560 }}>On Tavvy you can review anything that can get a review: a restaurant, a ride, a park, even a public bathroom. If it is not here yet, add it.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 16 }}>
      <Link href="/app/add" style={btn}><span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>+</span>Add a place</Link>
      {!done && !open && <button type="button" onClick={() => setOpen(true)} style={{ background: 'transparent', border: 0, color: accent, fontWeight: 700, fontSize: 14, cursor: 'pointer', minHeight: 44, padding: '0 8px' }}>Help us decide what comes next ▾</button>}
      {done && <span style={{ fontSize: 13, color: theme.textSecondary }}>Thanks! We read every answer.</span>}
    </div>
    {open && !done && <form onSubmit={send} style={{ marginTop: 18, display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, fontWeight: 700, color: theme.text }}>Would you also review general products?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{REVIEW_WISHLIST_CATEGORIES.map(c => { const on = categories.includes(c.id); return <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle(c.id)} style={{ minHeight: 38, padding: '0 14px', borderRadius: 19, border: `1px solid ${on ? PURPLE : theme.border}`, background: on ? PURPLE : theme.surface, color: on ? '#fff' : theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{c.label}</button>; })}</div>
      <label style={{ display: 'grid', gap: 6, fontWeight: 700, color: theme.text }}>What are you missing on Tavvy?<textarea value={missing} onChange={e => setMissing(e.target.value)} maxLength={1000} placeholder="Places, products, anything you would love to review" style={input} /></label>
      {categories.includes('other') && <label style={{ display: 'grid', gap: 6, fontWeight: 700, color: theme.text }}>Which products?<input value={other} onChange={e => setOther(e.target.value)} maxLength={500} style={{ ...input, minHeight: 44 }} /></label>}
      {error && <p role="alert" style={{ margin: 0, color: '#DC2626', fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="submit" disabled={sending} style={{ ...btn, opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending…' : 'Send'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: theme.textSecondary, fontWeight: 600, cursor: 'pointer', minHeight: 44, padding: '0 12px' }}>Not now</button>
      </div>
    </form>}
  </section>;
}
