import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import { configureOrdering, setOrderingTable } from '../../../lib/orderService';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
export default function OrderingSettings() {
    const router = useRouter(), id = typeof router.query.id === 'string' ? router.query.id : '';
    const { theme } = useThemeContext();
    const [allowed, setAllowed] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [enabled, setEnabled] = useState(false), [tax, setTax] = useState(''), [tables, setTables] = useState<{
        id: string;
        table_number: string;
        is_active: boolean;
    }[]>([]), [table, setTable] = useState(''), [qrTable, setQrTable] = useState(''), [busy, setBusy] = useState(false);
    const qrElement = useRef<HTMLDivElement>(null), qr = useRef<any>(null);
    const load = async () => { if (!id)
        return; try {
        const { data: access, error: e } = await supabase.rpc('has_verified_restaurant_claim', { p_place_id: id });
        if (e || !access)
            throw new Error('Sign in with a verified restaurant owner account.');
        setAllowed(true);
        const [settings, rows] = await Promise.all([supabase.from('place_ordering_settings').select('*').eq('place_id', id).maybeSingle(), supabase.from('restaurant_tables').select('id,table_number,is_active').eq('place_id', id).order('table_number')]);
        if (settings.error || rows.error)
            throw new Error('Ordering setup is not available yet.');
        setEnabled(!!settings.data?.enabled);
        setTax(settings.data?.tax_basis_points === null || settings.data?.tax_basis_points === undefined ? '' : String(settings.data.tax_basis_points / 100));
        setTables(rows.data || []);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Settings unavailable');
    }
    finally {
        setLoading(false);
    } };
    useEffect(() => { void load(); }, [id]);
    useEffect(() => { let cancelled = false; if (!qrTable)
        return; import('qr-code-styling').then(({ default: QRCode }) => { if (cancelled || !qrElement.current)
        return; qrElement.current.innerHTML = ''; qr.current = new QRCode({ width: 220, height: 220, type: 'svg', data: `https://tavvy.com/place/${id}/order?table=${encodeURIComponent(qrTable)}`, margin: 12, qrOptions: { errorCorrectionLevel: 'M' } }); qr.current.append(qrElement.current); }); return () => { cancelled = true; }; }, [qrTable, id]);
    const save = async () => { const rate = Number(tax); if (!tax.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100 || Math.abs(rate * 10000 - Math.round(rate * 10000)) > .00001) {
        setError('Enter a tax percentage from 0 to 100, with up to four decimal places.');
        return;
    } setBusy(true); setError(''); try {
        await configureOrdering(id, enabled, Math.round(rate * 1000000) / 10000);
        setMessage(enabled ? 'Ordering enabled for active tables.' : 'Ordering paused.');
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const updateTable = async (number: string, active: boolean) => { setBusy(true); setError(''); try {
        await setOrderingTable(id, number, active);
        setTable('');
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    return <main style={{ background: theme.background, color: theme.text, minHeight: '100vh', padding: 24 }}><div className="wrap"><Link href={`/app/business/${id}`}>← Restaurant workspace</Link><h1>Table ordering</h1><p>Guests sign in to send an order. Your kitchen confirms it here. Payments are handled by your restaurant.</p>{loading ? <p>Checking restaurant access…</p> : !allowed ? <Link href={`/app/login?returnUrl=${encodeURIComponent(router.asPath)}`}>Sign in</Link> : <>
 <section><h2>1. Add your tables</h2><p>Only active tables accept orders.</p><form onSubmit={event => { event.preventDefault(); void updateTable(table, true); }}><label>Table number<input required maxLength={32} value={table} onChange={event => setTable(event.target.value)}/></label><button disabled={busy}>Add table</button></form>{tables.map(row => <div className="table-row" key={row.id}><strong>Table {row.table_number}</strong><span>{row.is_active ? 'Active' : 'Inactive'}</span><button disabled={busy} onClick={() => void updateTable(row.table_number, !row.is_active)}>{row.is_active ? 'Deactivate' : 'Activate'}</button>{row.is_active && <button onClick={() => setQrTable(row.table_number)}>Table QR</button>}</div>)}</section>
 <section><h2>2. Confirm your tax and availability</h2><p>Enter the rate your restaurant applies to this menu. Enter 0 only if no tax applies. All displayed prices are in dollars.</p><label>Tax percentage<input type="number" min="0" max="100" step="0.0001" value={tax} onChange={event => setTax(event.target.value)} placeholder="Enter rate"/></label><label className="check"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)}/>Accept new orders</label><p>An active Tavvy Menu and at least one active table are required.</p><button disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save ordering settings'}</button></section><Link href={`/place/${id}/dashboard`}>Open kitchen orders →</Link>
 {qrTable && <section><h2>Table {qrTable} QR</h2><div ref={qrElement} role="img" aria-label={`Order at table ${qrTable}`}/><button onClick={() => qr.current?.download({ name: `tavvy-table-${qrTable}`, extension: 'svg' })}>Download QR</button><a href={`/place/${id}/order?table=${encodeURIComponent(qrTable)}`}>Open customer ordering</a></section>}</>}{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}</div><style jsx>{`.wrap{max-width:760px;margin:auto}section{padding:24px;margin:20px 0;border:1px solid ${theme.border};border-radius:16px;background:${theme.surface}}label{display:block;margin:12px 0}input{display:block;padding:12px;min-height:44px;margin-top:8px;border:1px solid ${theme.border};border-radius:8px;color:inherit;background:${theme.background};font:inherit}.check{display:flex;align-items:center;gap:12px}.check input{margin:0}.table-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}button{min-height:44px;padding:10px 14px;font:inherit;color:inherit;border:1px solid ${theme.border};border-radius:10px;background:${theme.background};cursor:pointer}button:disabled{opacity:.5}a{margin-right:14px}`}</style></main>;
}
export const getServerSideProps = async ({ locale }: {
    locale?: string;
}) => ({ props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } });
