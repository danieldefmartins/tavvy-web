import { supabase } from './supabaseClient';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
export interface OrderLine {
    id: string;
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    status: OrderStatus;
}
export interface RestaurantOrder {
    id: string;
    place_id: string;
    table_number: string;
    order_number: string;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    total: number;
    notes: string | null;
    customer_name: string | null;
    created_at: string;
    confirmed_at: string | null;
    prepared_at: string | null;
    served_at: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    items: OrderLine[];
}
export interface OrderingContext {
    enabled: boolean;
    configured: boolean;
    ready: boolean;
    tableValid: boolean;
    tableNumber: string | null;
    taxBasisPoints: number | null;
}
export interface OrderDraft {
    placeId: string;
    tableNumber: string;
    items: {
        menu_item_id: string;
        quantity: number;
        notes: string;
    }[];
    notes: string;
    customerName: string;
    expectedTotal: number;
}
export const ORDER_LIMITS = { quantity: 20, lines: 30, totalQuantity: 100, itemNotes: 500, notes: 1000, name: 80 };
export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'served' };
export function orderRequestKey(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function')
        return globalThis.crypto.randomUUID();
    // Correlation identifier only; authorization is always auth.uid() on the server.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.floor(Math.random() * 16); return (c === 'x' ? r : (r & 3) | 8).toString(16); });
}
export function orderEstimate(items: {
    price: number | null;
    quantity: number;
}[], taxBasisPoints: number | null) {
    const subtotalCents = items.reduce((sum, item) => sum + Math.round((item.price || 0) * 100 + 1e-8) * item.quantity, 0);
    const taxCents = taxBasisPoints === null ? null : Math.round(subtotalCents * taxBasisPoints / 10000 + 1e-8);
    return { subtotal: subtotalCents / 100, tax: taxCents === null ? null : taxCents / 100, total: taxCents === null ? null : (subtotalCents + taxCents) / 100 };
}
export function validateOrderDraft(draft: OrderDraft) {
    if (!draft.tableNumber.trim() || draft.tableNumber.length > 32)
        throw new Error('Confirm your table number with the restaurant.');
    if (!draft.items.length || draft.items.length > ORDER_LIMITS.lines)
        throw new Error('Choose between 1 and 30 menu items.');
    if (draft.notes.length > ORDER_LIMITS.notes || draft.customerName.length > ORDER_LIMITS.name)
        throw new Error('Shorten your order notes or name.');
    const ids = new Set<string>();
    let quantity = 0;
    for (const item of draft.items) {
        if (ids.has(item.menu_item_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > ORDER_LIMITS.quantity || item.notes.length > ORDER_LIMITS.itemNotes)
            throw new Error('Use 1–20 of each dish and notes up to 500 characters.');
        ids.add(item.menu_item_id);
        quantity += item.quantity;
    }
    if (quantity > ORDER_LIMITS.totalQuantity || !Number.isFinite(draft.expectedTotal) || draft.expectedTotal < 0)
        throw new Error('Please review the quantities and total.');
}
export function parseTableQR(value: string, placeId: string): string | null {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || !['tavvy.com', 'www.tavvy.com'].includes(url.hostname) || url.pathname !== `/place/${placeId}/order`)
            return null;
        const table = url.searchParams.get('table')?.trim();
        return table && table.length <= 32 ? table : null;
    }
    catch {
        return null;
    }
}
export function normalizeOrder(row: any): RestaurantOrder { return { ...row, subtotal: Number(row.subtotal), tax: Number(row.tax), total: Number(row.total), items: (row.items || row.order_items || []).map((item: any) => ({ ...item, price: Number(item.price), quantity: Number(item.quantity) })) }; }
export async function getOrderingContext(placeId: string, tableNumber?: string): Promise<OrderingContext> {
    const { data, error } = await supabase.rpc('get_place_ordering_context', { p_place_id: placeId, p_table_number: tableNumber || null });
    if (error || !data)
        throw new Error('Ordering is not available yet. Please ask the restaurant.');
    return data as OrderingContext;
}
export async function submitOrder(draft: OrderDraft, idempotencyKey: string): Promise<RestaurantOrder> {
    validateOrderDraft(draft);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
        throw new Error('Sign in to place an order.');
    const { data, error } = await supabase.rpc('submit_place_order', { p_place_id: draft.placeId, p_table_number: draft.tableNumber.trim(), p_items: draft.items.map(({ menu_item_id, quantity, notes }) => ({ menu_item_id, quantity, notes })), p_notes: draft.notes, p_customer_name: draft.customerName, p_idempotency_key: idempotencyKey, p_expected_total: draft.expectedTotal });
    if (error)
        throw new Error(error.message.replace(/^MENU_CHANGED:\s*/, ''));
    return normalizeOrder(data);
}
export async function getOrder(orderId: string): Promise<RestaurantOrder> { const { data, error } = await supabase.from('orders').select('*,items:order_items(*)').eq('id', orderId).single(); if (error)
    throw new Error('Unable to refresh your order.'); return normalizeOrder(data); }
export async function getKitchenOrders(placeId: string): Promise<RestaurantOrder[]> {
    const { data: allowed, error: accessError } = await supabase.rpc('has_verified_restaurant_claim', { p_place_id: placeId });
    if (accessError || !allowed)
        throw new Error('Sign in with a verified restaurant owner account to open kitchen orders.');
    // Fetch the active queue separately so busy order history cannot hide new orders.
    const active: RestaurantOrder[] = [];
    for (let offset = 0;; offset += 200) {
        const { data, error } = await supabase.from('orders').select('*,items:order_items(*)').eq('place_id', placeId).in('status', ['pending', 'confirmed', 'preparing', 'ready']).order('created_at', { ascending: true }).order('id', { ascending: true }).range(offset, offset + 199);
        if (error)
            throw new Error('Orders could not be loaded. Please retry.');
        active.push(...(data || []).map(normalizeOrder));
        if (!data || data.length < 200)
            break;
    }
    const { data: history, error } = await supabase.from('orders').select('*,items:order_items(*)').eq('place_id', placeId).in('status', ['served', 'cancelled']).order('created_at', { ascending: false }).limit(200);
    if (error)
        throw new Error('Order history could not be loaded. Please retry.');
    return [...active, ...(history || []).map(normalizeOrder)];
}
export async function transitionOrder(order: Pick<RestaurantOrder, 'id' | 'status'>, next: OrderStatus, reason?: string): Promise<RestaurantOrder> {
    const { data, error } = await supabase.rpc('transition_place_order', { p_order_id: order.id, p_expected_status: order.status, p_next_status: next, p_reason: reason || null });
    if (error)
        throw new Error(error.message.replace(/^MENU_CHANGED:\s*/, ''));
    return normalizeOrder(data);
}
export async function configureOrdering(placeId: string, enabled: boolean, taxBasisPoints: number) { const { error } = await supabase.rpc('configure_place_ordering', { p_place_id: placeId, p_enabled: enabled, p_tax_basis_points: taxBasisPoints }); if (error)
    throw new Error(error.message); }
export async function setOrderingTable(placeId: string, table: string, active: boolean) { const { error } = await supabase.rpc('set_ordering_table', { p_place_id: placeId, p_table_number: table, p_active: active }); if (error)
    throw new Error(error.message); }
