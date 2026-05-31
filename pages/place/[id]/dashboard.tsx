/**
 * Restaurant Order Dashboard
 * Path: pages/place/[id]/dashboard.tsx
 * URL: tavvy.com/place/[uuid]/dashboard
 *
 * Kanban-style real-time order management for restaurant staff.
 * Designed for tablet (landscape) primary use, works on phone.
 * Dark theme, large tap targets, Supabase realtime subscriptions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  place_id: string;
  table_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items: OrderItem[];
  special_notes: string | null;
  total_amount: number;
  created_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  prepared_at: string | null;
  served_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

interface PlaceInfo {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hr ago';
  return `${diffHr} hrs ago`;
}

function isUrgent(dateStr: string): boolean {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs > 5 * 60 * 1000; // >5 minutes
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderDashboard({ place }: { place: PlaceInfo }) {
  const router = useRouter();
  const { id } = router.query;
  const placeId = (id as string) || place?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [servedOrders, setServedOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderCountRef = useRef(0);

  // ── Audio notification ────────────────────────────────────────────────────

  useEffect(() => {
    // Create a subtle ding sound using AudioContext
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdW2Ii4eBe3x9g4OIi4Z/dXF0e4KHi4iDfXl5fYKGiYmFgHx5e3+DhoiIhYF8ent+goWIiIWBfHp7foKFiIiFgXx6e36ChYiIhYF8ent+goWIiIWBfHp7foKFiIiFgX18e36ChYiHhIF9e3t+goWHh4SAfHt7foGFh4eEgH17e36BhYeHhIB9e3t+gYWHh4SAfXt8foGFh4aDgH17fH6BhIaGg4B9fHx+gYSGhoOAfXx8foGEhoaDgH18fH6BhIaGg4B9fHx+gYSGhoOAfX18foGEhYWDgH19fH6BhIWFg4B9fX1+gYOFhYOAfX19foGDhYWDgH5+fX6Bg4WFg4B+fn1+gYOFhYKAfn5+foGDhISDgH5+fn6Bg4SEg4B+fn5+gYOEhIOAfn5+foCDhISDgH9+fn6Ag4SEgoB/fn5+gIODhIKAf35/foCDg4OCgH9/f36Ag4ODgoB/f39+gIODg4KAf39/foCCg4OCgH9/f3+AgoODgoCAf39/gIKDg4KAgH9/f4CCgoKCgICAf3+AgoKCgoCAf4B/gIKCgoKAgIB/gIGCgoKBgICAf4CBgoKCgYCAgH+AgYKBgoGAgIB/gIGCgYKBgICAgICBgoGBgYCAgICAgYKBgYGAgICAgIGBgYGBgICAgICBgYGBgYCAgICAgYGBgYGAgICAgICBgYGBgICAgICAgYGBgYCAgICAgICBgYGBgICAgICA'
      );
      audioRef.current.volume = 0.3;
    }
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // ── Load orders ───────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    if (!placeId) return;

    const { data: activeData } = await supabase
      .from('orders')
      .select('*')
      .eq('place_id', placeId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (activeData) {
      // Check if new orders arrived
      const pendingCount = activeData.filter(o => o.status === 'pending').length;
      if (pendingCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        playNotification();
      }
      prevOrderCountRef.current = pendingCount;
      setOrders(activeData as Order[]);
    }

    // Load last 20 served/cancelled for history
    const { data: historyData } = await supabase
      .from('orders')
      .select('*')
      .eq('place_id', placeId)
      .in('status', ['served', 'cancelled'])
      .order('served_at', { ascending: false })
      .limit(20);

    if (historyData) {
      setServedOrders(historyData as Order[]);
    }

    setLoading(false);
  }, [placeId, playNotification]);

  // ── Initial load + realtime subscription ──────────────────────────────────

  useEffect(() => {
    if (!placeId) return;

    loadOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`orders-${placeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `place_id=eq.${placeId}`,
        },
        (payload: any) => {
          const newOrder = payload.new as Order;
          const eventType = payload.eventType;

          if (eventType === 'INSERT') {
            if (['pending', 'confirmed', 'preparing', 'ready'].includes(newOrder.status)) {
              setOrders(prev => [...prev, newOrder]);
              if (newOrder.status === 'pending') {
                playNotification();
                // Update tab title
                document.title = `(*) New Order - ${place.name} Dashboard`;
                setTimeout(() => {
                  document.title = `${place.name} - Order Dashboard | Tavvy`;
                }, 5000);
              }
            }
          } else if (eventType === 'UPDATE') {
            if (['served', 'cancelled'].includes(newOrder.status)) {
              setOrders(prev => prev.filter(o => o.id !== newOrder.id));
              setServedOrders(prev => [newOrder, ...prev].slice(0, 20));
            } else {
              setOrders(prev =>
                prev.map(o => (o.id === newOrder.id ? newOrder : o))
              );
            }
          } else if (eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Auto-refresh fallback every 30s
    const interval = setInterval(loadOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [placeId, loadOrders, playNotification, place?.name]);

  // ── Print ticket ──────────────────────────────────────────────────────────

  const printTicket = (order: any) => {
    const items = order.order_items || [];
    const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderNum = order.order_number || order.id.slice(0, 6).toUpperCase();

    const ticketHtml = `
      <html><head><title>Order ${orderNum}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 8px; max-width: 300px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .table-num { font-size: 28px; font-weight: bold; }
        .order-num { font-size: 14px; color: #555; }
        .time { font-size: 14px; }
        .items { margin: 12px 0; }
        .item { margin-bottom: 8px; }
        .item-name { font-weight: bold; font-size: 16px; }
        .item-note { font-size: 13px; color: #555; padding-left: 12px; }
        .notes { border-top: 1px dashed #000; padding-top: 8px; margin-top: 12px; font-size: 13px; }
        .footer { text-align: center; border-top: 2px dashed #000; padding-top: 8px; margin-top: 12px; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="header">
        <div class="table-num">TABLE ${order.table_number || '—'}</div>
        <div class="order-num">#${orderNum}</div>
        <div class="time">${time}</div>
      </div>
      <div class="items">
        ${items.map((item: any) => `
          <div class="item">
            <div class="item-name">${item.quantity}x ${item.name}</div>
            ${item.notes ? `<div class="item-note">→ ${item.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ${order.special_requests ? `<div class="notes"><strong>NOTES:</strong> ${order.special_requests}</div>` : ''}
      <div class="footer">Tavvy · ${place?.name || ''}</div>
      </body></html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    }
  };

  // ── Order actions ─────────────────────────────────────────────────────────

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    extraFields: Record<string, any> = {}
  ) => {
    const updates: Record<string, any> = { status: newStatus, ...extraFields };

    if (newStatus === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (newStatus === 'preparing') {
      // no extra timestamp needed beyond confirmed_at
    } else if (newStatus === 'ready') {
      updates.prepared_at = new Date().toISOString();
    } else if (newStatus === 'served') {
      updates.served_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('[Dashboard] Error updating order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return;
    await updateOrderStatus(cancelModal, 'cancelled', {
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason.trim(),
    });
    setCancelModal(null);
    setCancelReason('');
  };

  // ── Computed values ───────────────────────────────────────────────────────

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = [...orders, ...servedOrders].filter(
    o => new Date(o.created_at) >= todayStart
  );
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Head>
          <title>{place?.name || 'Loading'} - Order Dashboard | Tavvy</title>
        </Head>
        <style jsx global>{dashboardStyles}</style>
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{place.name} - Order Dashboard | Tavvy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <style jsx global>{dashboardStyles}</style>

      <div className="dash-root">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-left">
            <h1 className="dash-title">{place.name}</h1>
            <span className="dash-subtitle">Order Dashboard</span>
          </div>
          <div className="dash-header-stats">
            <div className="dash-stat">
              <span className="dash-stat-value">{todayOrders.length}</span>
              <span className="dash-stat-label">Orders Today</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat-value">${todayRevenue.toFixed(2)}</span>
              <span className="dash-stat-label">Revenue</span>
            </div>
          </div>
          <div className="dash-header-right">
            <button
              className={`dash-toggle ${isOpen ? 'open' : 'closed'}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="dash-toggle-dot" />
              {isOpen ? 'Open' : 'Closed'}
            </button>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="dash-board">
          {/* New Orders Column */}
          <div className="dash-column">
            <div className="dash-column-header col-new">
              <span className="dash-col-title">New Orders</span>
              <span className="dash-col-count">{pendingOrders.length}</span>
            </div>
            <div className="dash-column-body">
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onConfirm={() => { updateOrderStatus(order.id, 'confirmed'); printTicket(order); }}
                  onCancel={() => setCancelModal(order.id)}
                  column="pending"
                />
              ))}
              {pendingOrders.length === 0 && (
                <div className="dash-empty-col">No new orders</div>
              )}
            </div>
          </div>

          {/* Confirmed Column */}
          <div className="dash-column">
            <div className="dash-column-header col-confirmed">
              <span className="dash-col-title">Confirmed</span>
              <span className="dash-col-count">{confirmedOrders.length}</span>
            </div>
            <div className="dash-column-body">
              {confirmedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => updateOrderStatus(order.id, 'preparing')}
                  actionLabel="Start Preparing"
                  column="confirmed"
                />
              ))}
              {confirmedOrders.length === 0 && (
                <div className="dash-empty-col">No confirmed orders</div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div className="dash-column">
            <div className="dash-column-header col-preparing">
              <span className="dash-col-title">Preparing</span>
              <span className="dash-col-count">{preparingOrders.length}</span>
            </div>
            <div className="dash-column-body">
              {preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => updateOrderStatus(order.id, 'ready')}
                  actionLabel="Mark Ready"
                  column="preparing"
                />
              ))}
              {preparingOrders.length === 0 && (
                <div className="dash-empty-col">No orders preparing</div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="dash-column">
            <div className="dash-column-header col-ready">
              <span className="dash-col-title">Ready</span>
              <span className="dash-col-count">{readyOrders.length}</span>
            </div>
            <div className="dash-column-body">
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => updateOrderStatus(order.id, 'served')}
                  actionLabel="Mark Served"
                  column="ready"
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="dash-empty-col">All served!</div>
              )}
            </div>
          </div>
        </main>

        {/* Order History */}
        <div className="dash-history-section">
          <button
            className="dash-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} Order History ({servedOrders.length})
          </button>
          {showHistory && (
            <div className="dash-history-list">
              {servedOrders.map(order => (
                <div key={order.id} className={`dash-history-item ${order.status}`}>
                  <span className="dash-history-table">Table {order.table_number}</span>
                  <span className="dash-history-items">
                    {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </span>
                  <span className="dash-history-total">${(order.total_amount || 0).toFixed(2)}</span>
                  <span className={`dash-history-status ${order.status}`}>
                    {order.status === 'cancelled' ? 'Cancelled' : 'Served'}
                  </span>
                  <span className="dash-history-time">{timeAgo(order.served_at || order.cancelled_at || order.created_at)}</span>
                </div>
              ))}
              {servedOrders.length === 0 && (
                <p className="dash-history-empty">No recent orders</p>
              )}
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {cancelModal && (
          <div className="dash-modal-overlay" onClick={() => setCancelModal(null)}>
            <div className="dash-modal" onClick={e => e.stopPropagation()}>
              <h3>Cancel Order</h3>
              <p>Please provide a reason for cancellation:</p>
              <textarea
                className="dash-modal-input"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g., Item out of stock, customer request..."
                rows={3}
                autoFocus
              />
              <div className="dash-modal-actions">
                <button
                  className="dash-btn dash-btn-cancel-modal"
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                >
                  Go Back
                </button>
                <button
                  className="dash-btn dash-btn-confirm-cancel"
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Not accepting indicator */}
        {!isOpen && (
          <div className="dash-closed-banner">
            Not accepting new orders
          </div>
        )}
      </div>
    </>
  );
}

// ── Order Card Component ──────────────────────────────────────────────────────

function OrderCard({
  order,
  onConfirm,
  onCancel,
  onAction,
  actionLabel,
  column,
}: {
  order: Order;
  onConfirm?: () => void;
  onCancel?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  column: 'pending' | 'confirmed' | 'preparing' | 'ready';
}) {
  const urgent = isUrgent(order.created_at);

  return (
    <div className={`dash-card ${column} ${urgent ? 'urgent' : ''}`}>
      <div className="dash-card-top">
        <span className="dash-card-table">Table {order.table_number}</span>
        <span className={`dash-card-time ${urgent ? 'urgent' : ''}`}>
          {timeAgo(order.created_at)}
        </span>
      </div>

      <div className="dash-card-items">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="dash-card-item">
            <span className="dash-card-qty">{item.quantity}x</span>
            <span className="dash-card-item-name">{item.name}</span>
          </div>
        ))}
      </div>

      {order.special_notes && (
        <div className="dash-card-notes">
          {order.special_notes}
        </div>
      )}

      <div className="dash-card-bottom">
        <span className="dash-card-total">${(order.total_amount || 0).toFixed(2)}</span>

        {column === 'pending' && (
          <div className="dash-card-actions">
            <button className="dash-btn dash-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="dash-btn dash-btn-confirm" onClick={onConfirm}>
              Confirm
            </button>
          </div>
        )}

        {column !== 'pending' && onAction && (
          <div className="dash-card-actions">
            <button className="dash-btn dash-btn-action" onClick={onAction}>
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Server Side Props ─────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  // Create server-side Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://scasgwrikoqdwlwlwcff.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYXNnd3Jpa29xZHdsd2x3Y2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODUxODEsImV4cCI6MjA4MjU2MTE4MX0.83ARHv2Zj6oJpbojPCIT0ljL8Ze2JqMBztLVueGXXhs';
  const serverSupabase = createClient(supabaseUrl, supabaseKey);

  // Validate place exists
  const { data: placeData, error } = await serverSupabase
    .from('places')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();

  if (!placeData || error) {
    return { notFound: true };
  }

  return {
    props: {
      place: placeData,
    },
  };
};

// ── Styles ────────────────────────────────────────────────────────────────────

const dashboardStyles = `
  /* Reset for fullscreen dashboard */
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100%;
  }
  #__next {
    height: 100%;
  }

  .dash-root {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0d0d0f;
    color: #e4e4e7;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    -webkit-user-select: none;
    user-select: none;
  }

  /* Loading */
  .dash-loading {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0d0d0f;
    color: #71717a;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .dash-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #27272a;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: dash-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes dash-spin {
    to { transform: rotate(360deg); }
  }

  /* Header */
  .dash-header {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    background: #18181b;
    border-bottom: 1px solid #27272a;
    gap: 24px;
    flex-shrink: 0;
  }
  .dash-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .dash-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fafafa;
    letter-spacing: -0.3px;
  }
  .dash-subtitle {
    font-size: 12px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
  .dash-header-stats {
    display: flex;
    gap: 24px;
    margin-left: auto;
  }
  .dash-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .dash-stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #fafafa;
  }
  .dash-stat-label {
    font-size: 11px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .dash-header-right {
    margin-left: 24px;
  }
  .dash-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 24px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .dash-toggle.open {
    background: #166534;
    color: #bbf7d0;
  }
  .dash-toggle.closed {
    background: #7f1d1d;
    color: #fecaca;
  }
  .dash-toggle-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .dash-toggle.open .dash-toggle-dot {
    background: #4ade80;
    box-shadow: 0 0 8px #4ade80;
  }
  .dash-toggle.closed .dash-toggle-dot {
    background: #f87171;
    box-shadow: 0 0 8px #f87171;
  }

  /* Kanban Board */
  .dash-board {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 12px;
    padding: 16px;
    overflow: hidden;
  }

  /* Column */
  .dash-column {
    display: flex;
    flex-direction: column;
    background: #18181b;
    border-radius: 16px;
    overflow: hidden;
    min-height: 0;
  }
  .dash-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 2px solid;
    flex-shrink: 0;
  }
  .dash-column-header.col-new {
    border-bottom-color: #3b82f6;
  }
  .dash-column-header.col-confirmed {
    border-bottom-color: #22c55e;
  }
  .dash-column-header.col-preparing {
    border-bottom-color: #f97316;
  }
  .dash-column-header.col-ready {
    border-bottom-color: #14b8a6;
  }
  .dash-col-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #a1a1aa;
  }
  .dash-col-count {
    font-size: 13px;
    font-weight: 700;
    background: #27272a;
    color: #e4e4e7;
    padding: 2px 10px;
    border-radius: 12px;
  }
  .dash-column-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    -webkit-overflow-scrolling: touch;
  }
  .dash-column-body::-webkit-scrollbar {
    width: 4px;
  }
  .dash-column-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .dash-column-body::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 2px;
  }
  .dash-empty-col {
    text-align: center;
    padding: 32px 12px;
    color: #52525b;
    font-size: 13px;
    font-style: italic;
  }

  /* Order Card */
  .dash-card {
    background: #1f1f23;
    border-radius: 12px;
    padding: 14px;
    border-left: 4px solid transparent;
    transition: transform 0.15s, box-shadow 0.15s;
    animation: dash-card-in 0.3s ease-out;
  }
  @keyframes dash-card-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .dash-card.pending {
    border-left-color: #3b82f6;
  }
  .dash-card.confirmed {
    border-left-color: #22c55e;
  }
  .dash-card.preparing {
    border-left-color: #f97316;
  }
  .dash-card.ready {
    border-left-color: #14b8a6;
  }
  .dash-card.urgent {
    animation: dash-urgent-pulse 2s ease-in-out infinite;
  }
  @keyframes dash-urgent-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3); }
  }

  .dash-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .dash-card-table {
    font-size: 18px;
    font-weight: 800;
    color: #fafafa;
    letter-spacing: -0.3px;
  }
  .dash-card-time {
    font-size: 12px;
    color: #71717a;
    font-weight: 500;
  }
  .dash-card-time.urgent {
    color: #ef4444;
    font-weight: 700;
  }

  .dash-card-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .dash-card-item {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .dash-card-qty {
    font-size: 13px;
    font-weight: 700;
    color: #a1a1aa;
    min-width: 24px;
  }
  .dash-card-item-name {
    font-size: 14px;
    color: #e4e4e7;
    font-weight: 500;
  }

  .dash-card-notes {
    background: #422006;
    border: 1px solid #854d0e;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 12px;
    color: #fef08a;
    font-weight: 500;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .dash-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid #27272a;
  }
  .dash-card-total {
    font-size: 16px;
    font-weight: 700;
    color: #fafafa;
  }
  .dash-card-actions {
    display: flex;
    gap: 8px;
  }

  /* Buttons */
  .dash-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    touch-action: manipulation;
  }
  .dash-btn:active {
    transform: scale(0.96);
  }
  .dash-btn-confirm {
    background: #166534;
    color: #bbf7d0;
  }
  .dash-btn-cancel {
    background: #7f1d1d;
    color: #fecaca;
  }
  .dash-btn-action {
    background: #8A05BE;
    color: #fff;
  }
  .dash-btn-action:hover {
    opacity: 0.9;
  }

  /* History */
  .dash-history-section {
    flex-shrink: 0;
    background: #18181b;
    border-top: 1px solid #27272a;
  }
  .dash-history-toggle {
    width: 100%;
    padding: 12px 24px;
    border: none;
    background: none;
    color: #71717a;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: color 0.2s;
  }
  .dash-history-toggle:hover {
    color: #a1a1aa;
  }
  .dash-history-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 0 24px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .dash-history-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #1f1f23;
    font-size: 13px;
  }
  .dash-history-table {
    font-weight: 700;
    color: #a1a1aa;
    min-width: 70px;
  }
  .dash-history-items {
    flex: 1;
    color: #71717a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dash-history-total {
    font-weight: 600;
    color: #e4e4e7;
    min-width: 60px;
    text-align: right;
  }
  .dash-history-status {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 4px;
    min-width: 65px;
    text-align: center;
  }
  .dash-history-status.served {
    background: #052e16;
    color: #4ade80;
  }
  .dash-history-status.cancelled {
    background: #450a0a;
    color: #f87171;
  }
  .dash-history-time {
    color: #52525b;
    font-size: 12px;
    min-width: 70px;
    text-align: right;
  }
  .dash-history-empty {
    text-align: center;
    color: #52525b;
    font-style: italic;
    padding: 16px;
  }

  /* Cancel Modal */
  .dash-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }
  .dash-modal {
    background: #1f1f23;
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 420px;
    border: 1px solid #27272a;
  }
  .dash-modal h3 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 700;
    color: #fafafa;
  }
  .dash-modal p {
    margin: 0 0 16px;
    color: #a1a1aa;
    font-size: 14px;
  }
  .dash-modal-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #3f3f46;
    border-radius: 10px;
    background: #0d0d0f;
    color: #e4e4e7;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    margin-bottom: 20px;
    box-sizing: border-box;
  }
  .dash-modal-input:focus {
    outline: none;
    border-color: #8A05BE;
  }
  .dash-modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  .dash-btn-cancel-modal {
    background: #27272a;
    color: #a1a1aa;
  }
  .dash-btn-confirm-cancel {
    background: #991b1b;
    color: #fecaca;
  }
  .dash-btn-confirm-cancel:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Closed Banner */
  .dash-closed-banner {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #7f1d1d;
    color: #fecaca;
    padding: 12px 32px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 700;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: dash-banner-in 0.3s ease-out;
  }
  @keyframes dash-banner-in {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Mobile/Phone (portrait) — stack columns vertically with horizontal scroll */
  @media (max-width: 768px) {
    .dash-header {
      flex-wrap: wrap;
      padding: 12px 16px;
      gap: 12px;
    }
    .dash-header-stats {
      gap: 16px;
    }
    .dash-stat-value {
      font-size: 18px;
    }
    .dash-board {
      grid-template-columns: repeat(4, 280px);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px;
      gap: 10px;
    }
    .dash-card-table {
      font-size: 16px;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .dash-title {
      font-size: 16px;
    }
    .dash-board {
      grid-template-columns: repeat(4, 250px);
    }
  }

  /* Large tablets and desktops */
  @media (min-width: 1200px) {
    .dash-board {
      gap: 16px;
      padding: 20px 24px;
    }
    .dash-card {
      padding: 16px;
    }
    .dash-card-table {
      font-size: 20px;
    }
  }
`;
