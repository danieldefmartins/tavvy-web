import ToolHeader from '../../components/ToolHeader';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { filterWallet, readWallet, removeWalletCard, saveWalletCard, walletCard, WalletCard } from '../../lib/wallet';

function downloadContact(card: WalletCard) {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const text = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escape(card.companyName)}`, `ORG:${escape(card.companyName)}`, card.phone && `TEL;TYPE=WORK:${escape(card.phone)}`, card.email && `EMAIL;TYPE=WORK:${escape(card.email)}`, 'END:VCARD'].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/vcard;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'contact.vcf'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function WalletPage() {
  const { user, loading } = useAuth();
  return <AppLayout><Head><title>Wallet | Tavvy</title></Head>{loading ? <p role="status">Loading account…</p> : <AccountWallet key={user?.id || 'guest'} userId={user?.id || null} />}</AppLayout>;
}
function AccountWallet({ userId }: { userId: string | null }) {
  const { theme } = useThemeContext();
  const router = useRouter();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState('');
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const version = useRef(0);
  const detailVersion = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; version.current++; detailVersion.current++; }; }, []);
  async function refresh() {
    const request = ++version.current;
    setLoading(true); setError('');
    try { const result = await readWallet(supabase, userId); if (active.current && request === version.current) setCards(result); }
    catch { if (active.current && request === version.current) setError('Unable to load your wallet. Please retry.'); }
    finally { if (active.current && request === version.current) setLoading(false); }
  }
  useEffect(() => { void refresh(); }, [userId]);
  async function openCard(value: string) {
    if (!value.trim()) return;
    const request = ++detailVersion.current;
    setSelected(null); setDetailError(''); setDetailLoading(true);
    try {
      let id = value.trim();
      if (/^https?:\/\//i.test(id)) {
        const link = new URL(id);
        id = link.searchParams.get('card') || decodeURIComponent(link.pathname.split('/').filter(Boolean).pop() || '');
      }
      const field = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) ? 'id' : 'slug';
      const { data, error } = await supabase.from('pro_cards').select('*').eq(field, id).single();
      if (error || !data) throw error || new Error('Missing card');
      if (active.current && request === detailVersion.current) setSelected(data);
    } catch { if (active.current && request === detailVersion.current) setDetailError('This Pro card could not be loaded. Check the card link and try again.'); }
    finally { if (active.current && request === detailVersion.current) setDetailLoading(false); }
  }
  useEffect(() => { if (typeof router.query.card === 'string') { setLookup(router.query.card); void openCard(router.query.card); } }, [router.query.card]);
  async function mutate(card: WalletCard, remove: boolean) {
    if (busy || !userId) return;
    if (remove && !window.confirm(`Remove ${card.companyName} from your wallet?`)) return;
    setBusy(true); setError(''); version.current++;
    try {
      if (remove) await removeWalletCard(supabase, userId, card.id);
      else await saveWalletCard(supabase, userId, card);
      if (!active.current) return;
      setCards(previous => remove ? previous.filter(c => c.id !== card.id) : [card, ...previous.filter(c => c.id !== card.id)]);
    } catch { if (active.current) setError(`Unable to ${remove ? 'remove' : 'save'} this card. Please retry.`); }
    finally { if (active.current) { setBusy(false); setLoading(false); } }
  }
  function actions(card: WalletCard) {
    return <div className="actions">
      {card.phone && <><a href={`tel:${card.phone}`}>Call</a><a href={`sms:${card.phone}`}>Text</a></>}
      {card.email && <a href={`mailto:${card.email}`}>Email</a>}
      <button onClick={() => downloadContact(card)}>Save contact</button>
      {userId && <button disabled={busy} onClick={() => void mutate(card, cards.some(c => c.id === card.id))}>{cards.some(c => c.id === card.id) ? 'Remove from wallet' : 'Save to wallet'}</button>}
    </div>;
  }
  const visible = filterWallet(cards, query);
  return <main className="wallet" style={{ color: theme.text, background: theme.background }}>
    <ToolHeader title="Wallet" subtitle="Your saved cards and contact details." />
    {!userId && <p><Link href="/app/login?redirect=%2Fapp%2Fwallet">Sign in</Link> to save and sync your wallet. You can still open a Pro card below.</p>}
    <form onSubmit={event => { event.preventDefault(); void openCard(lookup); }}><label htmlFor="wallet-lookup">Open a Pro card link</label><div className="actions"><input id="wallet-lookup" required value={lookup} onChange={event => setLookup(event.target.value)} placeholder="Paste a Pro card link" /><button disabled={detailLoading}>Open card</button></div></form>
    {detailLoading && <p role="status">Loading card…</p>}
    {detailError && <p role="alert">{detailError} <button onClick={() => void openCard(lookup)}>Retry</button></p>}
    {selected && <section className="detail" aria-label="Pro card details"><button onClick={() => { detailVersion.current++; setSelected(null); }}>Close card</button><h2>{selected.company_name}</h2><p>{selected.tagline}</p><p>{[selected.category, selected.city, selected.state].filter(Boolean).join(' · ')}</p>{selected.about_text && <p>{selected.about_text}</p>}{Array.isArray(selected.services) && selected.services.length > 0 && <><h3>Services</h3><ul>{selected.services.map((service: string, index: number) => <li key={index}>{service}</li>)}</ul></>}{actions(walletCard(selected))}</section>}
    {userId && <><div className="actions"><label htmlFor="wallet-search">Search saved cards</label><input id="wallet-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, category or location" /><button onClick={() => void refresh()} disabled={loading || busy}>Refresh</button></div>
    {error && <p role="alert">{error} <button disabled={busy} onClick={() => void refresh()}>Retry</button></p>}
    {busy && <p role="status">Updating wallet…</p>}{loading ? <p role="status">Loading wallet…</p> : visible.length === 0 ? <p>{query ? 'No matching cards.' : 'Your wallet is empty. Open a Pro card above to save it.'}</p> : <div className="cards">{visible.map(card => <article key={card.id}><button className="card-title" onClick={() => { setLookup(card.id); void openCard(card.id); }}><h2>{card.companyName}</h2></button><p>{[card.category, card.city, card.state].filter(Boolean).join(' · ')}</p>{actions(card)}</article>)}</div>}</>}
    <style jsx>{`
      .wallet { max-width: 1000px; margin: auto; padding: 28px 20px 110px; min-height: 85vh; }
      h1 { font-size: 32px; margin: 20px 0 8px; } p { line-height: 1.6; margin: 12px 0; }
      form, .detail { margin: 24px 0; padding: 20px; border: 1px solid #9ca3af; border-radius: 18px; }
      .actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin: 14px 0; }
      input::placeholder { color: ${theme.textSecondary}; opacity: 1; }
      input { color: ${theme.text}; background: ${theme.surface}; border: 1px solid #9ca3af; border-radius: 8px; padding: 12px; flex: 1; min-width: 180px; }
      button, .actions a { padding: 10px 14px; border: 1px solid #9ca3af; border-radius: 8px; cursor: pointer; color: inherit; background: transparent; }
      button:disabled { opacity: .5; cursor: wait; } .cards { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 16px; }
      article { padding: 20px; border: 1px solid #9ca3af; border-radius: 18px; } .card-title { text-align: left; border: 0; padding: 0; } h2 { font-size: 21px; } a { text-decoration: underline; }
    `}</style>
  </main>;
}

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
