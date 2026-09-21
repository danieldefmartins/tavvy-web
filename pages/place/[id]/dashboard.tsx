import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import { getKitchenOrders, transitionOrder, RestaurantOrder, NEXT_ORDER_STATUS, OrderStatus } from '../../../lib/orderService';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
const labels: Record<string, string> = { pending: 'New', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', served: 'Served', cancelled: 'Cancelled' };
const actions: Record<string, string> = { pending: 'Confirm', confirmed: 'Start preparing', preparing: 'Mark ready', ready: 'Mark served' };
export default function OrderDashboard() {
    const router = useRouter(), id = typeof router.query.id === 'string' ? router.query.id : '';
    const { theme } = useThemeContext();
    const [orders, setOrders] = useState<RestaurantOrder[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(''), [history, setHistory] = useState(false), [ticket, setTicket] = useState<RestaurantOrder | null>(null);
    const refresh = useCallback(async () => { if (!id)
        return; try {
        const rows = await getKitchenOrders(id);
        setOrders(rows);
        setError('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Orders unavailable');
        setOrders([]);
    }
    finally {
        setLoading(false);
    } }, [id]);
    useEffect(() => { if (!id)
        return; void refresh(); const channel = supabase.channel(`kitchen-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `place_id=eq.${id}` }, () => void refresh()).subscribe(); const timer = setInterval(refresh, 15000); return () => { clearInterval(timer); void supabase.removeChannel(channel); }; }, [id, refresh]);
    const change = async (order: RestaurantOrder, next: OrderStatus) => { let reason: string | undefined; if (next === 'cancelled') {
        const answer = window.prompt('Reason for cancelling this order');
        if (!answer?.trim())
            return;
        reason = answer.trim();
    } setBusy(order.id); try {
        const updated = await transitionOrder(order, next, reason);
        setOrders(previous => previous.map(row => row.id === updated.id ? updated : row));
        if (next === 'confirmed')
            setTicket(updated);
        setError('');
    }
    catch (e) {
        await refresh();
        setError(e instanceof Error ? e.message : 'Order update failed');
    }
    finally {
        setBusy('');
    } };
    const visible = orders.filter(order => history ? ['served', 'cancelled'].includes(order.status) : !['served', 'cancelled'].includes(order.status));
    return <><Head><title>Kitchen orders · Tavvy</title></Head><main style={{ background: theme.background, color: theme.text, minHeight: '100vh', padding: 24 }}>
 <header><Link href={`/app/business/${id}`}>← Restaurant workspace</Link><h1>Kitchen orders</h1><p>Orders are confirmed here. Payments are handled by your restaurant.</p><nav><Link href={`/place/${id}/ordering-settings`}>Ordering settings</Link><button onClick={() => setHistory(!history)}>{history ? 'Active orders' : 'Order history'}</button><button onClick={() => void refresh()}>Refresh</button></nav></header>
 {error && <p role="alert">{error} <Link href={`/app/login?returnUrl=${encodeURIComponent(router.asPath)}`}>Sign in</Link></p>}
 {loading ? <p role="status">Loading orders…</p> : !error && !visible.length ? <p>No {history ? 'past' : 'active'} orders.</p> : <section className="orders">{visible.map(order => <article key={order.id}>
 <div className="order-head"><strong>Table {order.table_number}</strong><span>{labels[order.status]}</span></div><p>#{order.order_number} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{order.customer_name ? ` · ${order.customer_name}` : ''}</p>
 <ul>{order.items.map(item => <li key={item.id}><strong>{item.quantity} × {item.name}</strong> <span>${(item.price * item.quantity).toFixed(2)}</span>{item.notes && <p>Kitchen note: {item.notes}</p>}</li>)}</ul>{order.notes && <p><strong>Order note:</strong> {order.notes}</p>}{order.cancel_reason && <p>Cancellation: {order.cancel_reason}</p>}
 <p className="total">${order.total.toFixed(2)} <small>Subtotal ${order.subtotal.toFixed(2)} · Tax ${order.tax.toFixed(2)}</small></p>
 <div className="actions">{NEXT_ORDER_STATUS[order.status] && <button disabled={busy === order.id} onClick={() => void change(order, NEXT_ORDER_STATUS[order.status]!)}>{actions[order.status]}</button>}{!['served', 'cancelled'].includes(order.status) && <button disabled={busy === order.id} onClick={() => void change(order, 'cancelled')}>Cancel</button>}<button onClick={() => setTicket(order)}>Ticket</button></div>
 </article>)}</section>}
 {ticket && <div className="ticket-overlay" role="dialog" aria-modal="true" aria-label="Order ticket"><div className="ticket"><h2>Table {ticket.table_number}</h2><p>#{ticket.order_number}</p>{ticket.items.map(item => <div key={item.id}><strong>{item.quantity} × {item.name}</strong>{item.notes && <p>{item.notes}</p>}</div>)}{ticket.notes && <p>{ticket.notes}</p>}<button onClick={() => window.print()}>Print ticket</button><button onClick={() => setTicket(null)}>Close</button></div></div>}
 </main><style jsx>{`header{max-width:1400px;margin:auto auto 28px}h1{margin-bottom:8px}nav,.actions,.order-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.order-head{justify-content:space-between;font-size:20px}.orders{max-width:1400px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}article{border:1px solid ${theme.border};border-radius:18px;background:${theme.surface};padding:20px}button{font:inherit;min-height:44px;border:1px solid ${theme.border};background:${theme.surface};color:inherit;border-radius:10px;padding:10px 14px;cursor:pointer}button:disabled{opacity:.5}ul{padding-left:20px}li{margin:14px 0}li span{float:right}li p{margin:4px 0}.total{font-size:22px;font-weight:700}.total small{display:block;font-size:13px;font-weight:400;margin-top:6px}.ticket-overlay{position:fixed;inset:0;background:#0008;display:grid;place-items:center;z-index:100}.ticket{background:white;color:#111;padding:26px;border-radius:14px;max-width:400px}.ticket>div{margin:14px 0}@media print{main>header,main>section,main>p{display:none}.ticket-overlay{position:static;background:white}.ticket button{display:none}.ticket{border:0}}`}</style></>;
}
export const getServerSideProps = async ({ locale }: {
    locale?: string;
}) => ({ props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } });
