/**
 * Customer Ordering Page
 * Path: pages/place/[id]/order.tsx
 * URL: tavvy.com/place/[uuid]/order?table=5
 *
 * Features:
 * - Scanned via QR code at table
 * - Full menu with category/meal period filters
 * - Add to cart with "+" buttons
 * - Floating cart button with item count
 * - Cart drawer with quantity controls, item notes, special requests
 * - Place order → inserts into orders + order_items tables
 * - Real-time order status via Supabase realtime
 * - Mobile-first, dark/light theme support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  dietary_tags: string[] | null;
  calories: number | null;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
  meal_period: string | null;
  items: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
}

interface StatusUpdate {
  status: string;
  timestamp: string;
}

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  all_day: 'All Day',
};

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Sent',
  confirmed: 'Confirmed by Waiter',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
};
const STATUS_ICONS: Record<string, string> = {
  pending: '📤',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '🔔',
  served: '🍽️',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderPage() {
  const router = useRouter();
  const { id, table } = router.query;
  const tableNumber = table as string;

  // Menu state
  const [placeName, setPlaceName] = useState('');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Order state
  const [placingOrder, setPlacingOrder] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusUpdate[]>([]);
  const [orderView, setOrderView] = useState(false);
  const [showQrScan, setShowQrScan] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Animation state for add-to-cart feedback
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);

  // ─── Load Menu ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (id) loadMenu(id as string);
  }, [id]);

  const loadMenu = async (placeId: string) => {
    setLoading(true);
    try {
      const { data: placeData } = await supabase
        .from('places')
        .select('name')
        .eq('id', placeId)
        .maybeSingle();

      if (placeData) setPlaceName(placeData.name || '');

      const { data: menuData } = await supabase
        .from('menus')
        .select('id')
        .eq('place_id', placeId)
        .maybeSingle();

      if (!menuData) {
        setLoading(false);
        return;
      }

      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });

      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map((c: any) => c.id);
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('id, name, description, price, price_label, image_url, is_popular, is_new, dietary_tags, calories, category_id')
          .in('category_id', categoryIds)
          .order('sort_order', { ascending: true });

        const categoriesWithItems: MenuCategory[] = categoriesData.map((cat: any) => ({
          ...cat,
          items: (itemsData || []).filter((item: any) => item.category_id === cat.id),
        }));

        setCategories(categoriesWithItems);
      }
    } catch (error) {
      console.error('[OrderPage] Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Cart Operations ────────────────────────────────────────────────────────

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 600);
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(ci => {
        if (ci.menuItem.id === itemId) {
          const newQty = ci.quantity + delta;
          return newQty <= 0 ? null : { ...ci, quantity: newQty };
        }
        return ci;
      }).filter(Boolean) as CartItem[];
      return updated;
    });
  }, []);

  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(ci =>
        ci.menuItem.id === itemId ? { ...ci, notes } : ci
      )
    );
  }, []);

  const cartTotal = cart.reduce((sum, ci) => sum + (ci.menuItem.price || 0) * ci.quantity, 0);
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const taxRate = 0.0875; // 8.75% typical
  const taxAmount = cartTotal * taxRate;
  const orderTotal = cartTotal + taxAmount;

  // ─── QR Scan Verification ───────────────────────────────────────────────────

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!showQrScan) return;

    let scanning = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Simple QR detection via canvas polling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const checkQR = () => {
          if (!scanning || !videoRef.current || !ctx) return;
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          if (canvas.width === 0) { requestAnimationFrame(checkQR); return; }

          ctx.drawImage(videoRef.current, 0, 0);

          // Use BarcodeDetector API if available (Chrome, Safari)
          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            detector.detect(canvas).then((codes: any[]) => {
              if (codes.length > 0) {
                const url = codes[0].rawValue;
                // Verify it contains our place ID or table route
                if (url.includes(id as string) || url.includes('/table/')) {
                  scanning = false;
                  stopCamera();
                  setShowQrScan(false);
                  setQrVerified(true);
                  placeOrder();
                }
              } else if (scanning) {
                requestAnimationFrame(checkQR);
              }
            }).catch(() => { if (scanning) requestAnimationFrame(checkQR); });
          } else {
            // No BarcodeDetector — allow manual fallback after 3 seconds
            setTimeout(() => {
              if (scanning) {
                // Auto-verify if they already have the table number from URL
                if (tableNumber) {
                  scanning = false;
                  stopCamera();
                  setShowQrScan(false);
                  setQrVerified(true);
                  placeOrder();
                }
              }
            }, 3000);
          }
        };

        requestAnimationFrame(checkQR);
      } catch (err) {
        // Camera not available — skip verification if table number exists
        if (tableNumber) {
          setShowQrScan(false);
          placeOrder();
        }
      }
    };

    startCamera();
    return () => { scanning = false; stopCamera(); };
  }, [showQrScan]);

  // ─── Place Order ────────────────────────────────────────────────────────────

  const placeOrder = async () => {
    if (cart.length === 0 || !id) return;
    setPlacingOrder(true);

    try {
      // Get current user (optional)
      const { data: { user } } = await supabase.auth.getUser();

      // Generate order number
      const orderNumber = `${Date.now().toString(36).toUpperCase()}`;

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          place_id: id as string,
          table_number: tableNumber || null,
          customer_id: user?.id || null,
          customer_name: customerName || null,
          order_number: orderNumber,
          status: 'pending',
          subtotal: cartTotal,
          tax: taxAmount,
          total: orderTotal,
          special_requests: specialRequests || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cart.map(ci => ({
        order_id: orderData.id,
        menu_item_id: ci.menuItem.id,
        name: ci.menuItem.name,
        price: ci.menuItem.price || 0,
        quantity: ci.quantity,
        notes: ci.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Set order and switch to confirmation view
      setOrder(orderData);
      setStatusHistory([{ status: 'pending', timestamp: orderData.created_at }]);
      setOrderView(true);
      setCartOpen(false);
      setCart([]);
      setSpecialRequests('');

      // Subscribe to realtime updates
      subscribeToOrder(orderData.id);
    } catch (error) {
      console.error('[OrderPage] Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ─── Realtime Subscription ──────────────────────────────────────────────────

  const subscribeToOrder = (orderId: string) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          const newStatus = payload.new.status;
          setOrder(prev => prev ? { ...prev, status: newStatus } : prev);
          setStatusHistory(prev => {
            if (prev.find(s => s.status === newStatus)) return prev;
            return [...prev, { status: newStatus, timestamp: new Date().toISOString() }];
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // ─── Filters ────────────────────────────────────────────────────────────────

  const filteredCategories = activePeriod === 'all'
    ? categories
    : categories.filter(cat =>
        cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period
      );

  const availablePeriods: MealPeriod[] = ['all'];
  const periodsInData = new Set(categories.map(c => c.meal_period).filter(Boolean));
  if (periodsInData.has('breakfast')) availablePeriods.push('breakfast');
  if (periodsInData.has('lunch')) availablePeriods.push('lunch');
  if (periodsInData.has('dinner')) availablePeriods.push('dinner');
  if (periodsInData.has('all_day')) availablePeriods.push('all_day');

  const formatPrice = (price: number | null, priceLabel: string | null): string => {
    if (priceLabel) return priceLabel;
    if (price === null || price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  // ─── Render: Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Head><title>Loading... | Tavvy</title></Head>
        <style jsx global>{orderStyles}</style>
        <div className="order-loading">
          <div className="order-spinner" />
          <p>Loading menu...</p>
        </div>
      </>
    );
  }

  // ─── Render: Order Confirmation ─────────────────────────────────────────────

  if (orderView && order) {
    const currentStatusIdx = ORDER_STATUSES.indexOf(order.status);

    return (
      <>
        <Head><title>Order #{order.order_number} | Tavvy</title></Head>
        <style jsx global>{orderStyles}</style>
        <div className="order-page">
          <div className="order-confirmation">
            <div className="order-conf-header">
              <div className="order-conf-emoji">🎉</div>
              <h1>Order sent to kitchen!</h1>
              <p className="order-conf-number">Order #{order.order_number}</p>
              {tableNumber && <span className="order-table-badge">Table {tableNumber}</span>}
            </div>

            <div className="order-status-track">
              {ORDER_STATUSES.map((status, idx) => {
                const isActive = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const historyEntry = statusHistory.find(s => s.status === status);
                return (
                  <div key={status} className={`order-status-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="order-status-dot">
                      <span className="order-status-icon">{STATUS_ICONS[status]}</span>
                    </div>
                    <div className="order-status-info">
                      <span className="order-status-label">{STATUS_LABELS[status]}</span>
                      {historyEntry && (
                        <span className="order-status-time">
                          {new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {idx < ORDER_STATUSES.length - 1 && (
                      <div className={`order-status-line ${idx < currentStatusIdx ? 'filled' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="order-conf-total">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>

            <button className="order-new-btn" onClick={() => { setOrderView(false); setOrder(null); }}>
              Order More Items
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Render: Menu + Cart ────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>{placeName ? `Order at ${placeName}` : 'Order'} | Tavvy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <style jsx global>{orderStyles}</style>

      <div className="order-page">
        {/* Header */}
        <div className="order-header">
          <div className="order-header-info">
            <h1 className="order-place-name">{placeName}</h1>
            {tableNumber && <span className="order-table-badge">Table {tableNumber}</span>}
          </div>
        </div>

        {/* Meal Period Tabs */}
        {availablePeriods.length > 2 && (
          <div className="order-periods">
            {availablePeriods.map(period => (
              <button
                key={period}
                className={`order-period-tab ${activePeriod === period ? 'active' : ''}`}
                onClick={() => setActivePeriod(period)}
              >
                {MEAL_PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        <div className="order-menu">
          {filteredCategories.map(category => (
            <div key={category.id} className="order-category">
              <h2 className="order-category-name">{category.name}</h2>
              {category.description && (
                <p className="order-category-desc">{category.description}</p>
              )}

              <div className="order-items">
                {category.items.map(item => {
                  const inCart = cart.find(ci => ci.menuItem.id === item.id);
                  const justAdded = addedItemId === item.id;

                  return (
                    <div key={item.id} className={`order-item ${justAdded ? 'just-added' : ''}`}>
                      <div className="order-item-content">
                        {item.image_url && (
                          <div className="order-item-img-wrap">
                            <img src={item.image_url} alt={item.name} className="order-item-img" />
                          </div>
                        )}
                        <div className="order-item-text">
                          <div className="order-item-name-row">
                            <span className="order-item-name">{item.name}</span>
                            {item.is_popular && <span className="order-item-badge popular">Popular</span>}
                            {item.is_new && <span className="order-item-badge new">New</span>}
                          </div>
                          {item.description && (
                            <p className="order-item-desc">{item.description}</p>
                          )}
                          <div className="order-item-meta">
                            {formatPrice(item.price, item.price_label) && (
                              <span className="order-item-price">{formatPrice(item.price, item.price_label)}</span>
                            )}
                            {item.calories && (
                              <span className="order-item-cal">{item.calories} cal</span>
                            )}
                          </div>
                        </div>
                        <button
                          className={`order-add-btn ${inCart ? 'in-cart' : ''}`}
                          onClick={() => addToCart(item)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          {inCart ? inCart.quantity : '+'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="order-empty">
              <p>No items available for this period.</p>
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {cartCount > 0 && !cartOpen && (
          <button className="order-cart-fab" onClick={() => setCartOpen(true)}>
            <span className="order-cart-fab-icon">🛒</span>
            <span className="order-cart-fab-text">View Cart</span>
            <span className="order-cart-fab-count">{cartCount}</span>
            <span className="order-cart-fab-total">${cartTotal.toFixed(2)}</span>
          </button>
        )}

        {/* Cart Drawer */}
        {cartOpen && (
          <div className="order-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="order-cart-drawer" onClick={e => e.stopPropagation()}>
              <div className="order-cart-header">
                <h2>Your Order</h2>
                <button className="order-cart-close" onClick={() => setCartOpen(false)}>✕</button>
              </div>

              <div className="order-cart-items">
                {cart.map(ci => (
                  <div key={ci.menuItem.id} className="order-cart-item">
                    <div className="order-cart-item-top">
                      <span className="order-cart-item-name">{ci.menuItem.name}</span>
                      <span className="order-cart-item-price">
                        ${((ci.menuItem.price || 0) * ci.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="order-cart-item-controls">
                      <div className="order-qty-control">
                        <button className="order-qty-btn" onClick={() => updateQuantity(ci.menuItem.id, -1)}>−</button>
                        <span className="order-qty-value">{ci.quantity}</span>
                        <button className="order-qty-btn" onClick={() => updateQuantity(ci.menuItem.id, 1)}>+</button>
                      </div>
                      <input
                        type="text"
                        className="order-cart-item-notes"
                        placeholder="Add note (e.g. no onions)"
                        value={ci.notes}
                        onChange={e => updateItemNotes(ci.menuItem.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-cart-extras">
                <textarea
                  className="order-special-requests"
                  placeholder="Special requests for the kitchen..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  rows={2}
                />
                <input
                  type="text"
                  className="order-customer-name"
                  placeholder="Your name (optional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div className="order-cart-totals">
                <div className="order-cart-total-row">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="order-cart-total-row">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="order-cart-total-row total">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="order-place-btn"
                onClick={() => setShowQrScan(true)}
                disabled={placingOrder || cart.length === 0}
              >
                {placingOrder ? 'Placing Order...' : `Place Order — $${orderTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}

        {/* QR Scan Verification Modal */}
        {showQrScan && (
          <div className="qr-scan-overlay">
            <div className="qr-scan-modal">
              <button className="qr-scan-close" onClick={() => { setShowQrScan(false); stopCamera(); }}>✕</button>
              <div className="qr-scan-icon">📷</div>
              <h2 className="qr-scan-title">Scan QR at your table</h2>
              <p className="qr-scan-desc">Point your camera at the QR code on your table to confirm your order</p>
              <div className="qr-scan-camera">
                <video ref={videoRef} autoPlay playsInline className="qr-scan-video" />
                <div className="qr-scan-frame" />
              </div>
              <button
                className="qr-scan-manual-btn"
                onClick={() => { setShowQrScan(false); stopCamera(); placeOrder(); }}
              >
                Enter table number manually instead
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const orderStyles = `
  * { box-sizing: border-box; }

  .order-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    color: #999;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }
  .order-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #eee;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: order-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes order-spin { to { transform: rotate(360deg); } }

  .order-page {
    min-height: 100vh;
    max-width: 640px;
    margin: 0 auto;
    background: #fafafa;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    padding-bottom: 100px;
    position: relative;
  }

  /* Header */
  .order-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #fff;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }
  .order-header-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .order-place-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
  }
  .order-table-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background: #8A05BE;
    color: #fff;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Meal Period Tabs */
  .order-periods {
    display: flex;
    gap: 4px;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #eee;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .order-period-tab {
    padding: 8px 18px;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    background: #f3f3f3;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .order-period-tab.active {
    background: #8A05BE;
    color: #fff;
    font-weight: 600;
  }

  /* Menu */
  .order-menu {
    padding: 16px 20px;
  }
  .order-category {
    margin-bottom: 32px;
  }
  .order-category-name {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #1a1a1a;
    margin: 0 0 4px;
    padding-bottom: 12px;
    border-bottom: 2px solid #1a1a1a;
  }
  .order-category-desc {
    font-size: 13px;
    color: #888;
    margin: 0 0 12px;
    font-style: italic;
  }
  .order-items {
    display: flex;
    flex-direction: column;
  }
  .order-item {
    padding: 14px 0;
    border-bottom: 1px solid #eee;
    transition: background 0.2s;
  }
  .order-item:last-child { border-bottom: none; }
  .order-item.just-added {
    animation: order-flash 0.6s ease;
  }
  @keyframes order-flash {
    0% { background: rgba(138, 5, 190, 0.12); }
    100% { background: transparent; }
  }
  .order-item-content {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .order-item-img-wrap {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .order-item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .order-item-text {
    flex: 1;
    min-width: 0;
  }
  .order-item-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .order-item-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .order-item-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 8px;
    text-transform: uppercase;
  }
  .order-item-badge.popular {
    background: #ff6b00;
    color: #fff;
  }
  .order-item-badge.new {
    background: #059669;
    color: #fff;
  }
  .order-item-desc {
    font-size: 13px;
    color: #888;
    margin: 3px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }
  .order-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .order-item-price {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .order-item-cal {
    font-size: 12px;
    color: #999;
  }

  /* Add Button */
  .order-add-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 50%;
    border: 2px solid #8A05BE;
    background: #fff;
    color: #8A05BE;
    font-size: 22px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .order-add-btn:hover {
    background: #8A05BE;
    color: #fff;
    transform: scale(1.1);
  }
  .order-add-btn:active {
    transform: scale(0.95);
  }
  .order-add-btn.in-cart {
    background: #8A05BE;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
  }

  /* Floating Cart Button */
  .order-cart-fab {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: #8A05BE;
    color: #fff;
    border: none;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(138, 5, 190, 0.4);
    z-index: 30;
    transition: transform 0.2s, box-shadow 0.2s;
    max-width: 90%;
    animation: order-fab-in 0.3s ease;
  }
  @keyframes order-fab-in {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  .order-cart-fab:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 12px 40px rgba(138, 5, 190, 0.5);
  }
  .order-cart-fab-icon { font-size: 18px; }
  .order-cart-fab-text { font-weight: 600; }
  .order-cart-fab-count {
    background: #fff;
    color: #8A05BE;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
  }
  .order-cart-fab-total {
    font-weight: 700;
  }

  /* Cart Overlay & Drawer */
  .order-cart-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: order-overlay-in 0.2s ease;
  }
  @keyframes order-overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .order-cart-drawer {
    width: 100%;
    max-width: 640px;
    max-height: 85vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    display: flex;
    flex-direction: column;
    animation: order-drawer-in 0.3s ease;
    overflow: hidden;
  }
  @keyframes order-drawer-in {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .order-cart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }
  .order-cart-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .order-cart-close {
    background: #f3f3f3;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  /* Cart Items */
  .order-cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
    -webkit-overflow-scrolling: touch;
  }
  .order-cart-item {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .order-cart-item:last-child { border-bottom: none; }
  .order-cart-item-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .order-cart-item-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .order-cart-item-price {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .order-cart-item-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .order-qty-control {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }
  .order-qty-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f8f8f8;
    font-size: 18px;
    font-weight: 600;
    color: #8A05BE;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .order-qty-btn:hover { background: #f0e6f8; }
  .order-qty-btn:active { background: #e6d0f2; }
  .order-qty-value {
    width: 32px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .order-cart-item-notes {
    flex: 1;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #333;
    outline: none;
    transition: border-color 0.2s;
  }
  .order-cart-item-notes:focus {
    border-color: #8A05BE;
  }
  .order-cart-item-notes::placeholder { color: #bbb; }

  /* Cart Extras */
  .order-cart-extras {
    padding: 12px 24px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }
  .order-special-requests {
    width: 100%;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    color: #333;
    resize: none;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }
  .order-special-requests:focus { border-color: #8A05BE; }
  .order-special-requests::placeholder { color: #bbb; }
  .order-customer-name {
    width: 100%;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    color: #333;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }
  .order-customer-name:focus { border-color: #8A05BE; }
  .order-customer-name::placeholder { color: #bbb; }

  /* Cart Totals */
  .order-cart-totals {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    flex-shrink: 0;
  }
  .order-cart-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
    padding: 4px 0;
  }
  .order-cart-total-row.total {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px solid #eee;
  }

  /* Place Order Button */
  .order-place-btn {
    margin: 0 24px 24px;
    padding: 18px;
    border: none;
    border-radius: 14px;
    background: #8A05BE;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    flex-shrink: 0;
  }
  .order-place-btn:hover { opacity: 0.9; }
  .order-place-btn:active { transform: scale(0.98); }
  .order-place-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Order Confirmation */
  .order-confirmation {
    padding: 40px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
  }
  .order-conf-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .order-conf-emoji {
    font-size: 64px;
    margin-bottom: 12px;
    animation: order-bounce 0.6s ease;
  }
  @keyframes order-bounce {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  .order-conf-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px;
  }
  .order-conf-number {
    font-size: 14px;
    color: #666;
    margin: 0 0 12px;
  }

  /* Status Tracker */
  .order-status-track {
    width: 100%;
    max-width: 400px;
    padding: 24px 0;
  }
  .order-status-step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    position: relative;
    padding-bottom: 24px;
    opacity: 0.4;
    transition: opacity 0.3s;
  }
  .order-status-step.active { opacity: 1; }
  .order-status-step.current .order-status-dot {
    box-shadow: 0 0 0 4px rgba(138, 5, 190, 0.2);
  }
  .order-status-dot {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    background: #f3f3f3;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  .order-status-step.active .order-status-dot {
    background: #f0e6f8;
  }
  .order-status-step.current .order-status-dot {
    background: #8A05BE;
  }
  .order-status-step.current .order-status-icon {
    filter: brightness(10);
  }
  .order-status-icon { font-size: 18px; }
  .order-status-info {
    display: flex;
    flex-direction: column;
    padding-top: 8px;
  }
  .order-status-label {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .order-status-time {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }
  .order-status-line {
    position: absolute;
    left: 19px;
    top: 44px;
    width: 2px;
    height: calc(100% - 44px);
    background: #eee;
    transition: background 0.3s;
  }
  .order-status-line.filled { background: #8A05BE; }

  .order-conf-total {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    padding: 16px 0;
    border-top: 1px solid #eee;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 16px;
  }

  .order-new-btn {
    margin-top: 24px;
    padding: 14px 32px;
    border: 2px solid #8A05BE;
    border-radius: 12px;
    background: transparent;
    color: #8A05BE;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .order-new-btn:hover {
    background: #8A05BE;
    color: #fff;
  }

  .order-empty {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-style: italic;
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .order-loading { background: #0a0a0a; color: #666; }
    .order-spinner { border-color: #333; border-top-color: #8A05BE; }
    .order-page { background: #0a0a0a; }
    .order-header { background: #111; border-bottom-color: #222; }
    .order-place-name { color: #fff; }
    .order-periods { background: #111; border-bottom-color: #222; }
    .order-period-tab { background: #1a1a1a; color: #999; }
    .order-period-tab.active { background: #8A05BE; color: #fff; }
    .order-category-name { color: #fff; border-bottom-color: #444; }
    .order-category-desc { color: #777; }
    .order-item { border-bottom-color: #1a1a1a; }
    .order-item-name { color: #fff; }
    .order-item-desc { color: #777; }
    .order-item-price { color: #fff; }
    .order-item-cal { color: #666; }
    .order-add-btn { background: #111; border-color: #8A05BE; }
    .order-add-btn.in-cart { background: #8A05BE; }
    .order-cart-drawer { background: #111; }
    .order-cart-header { border-bottom-color: #222; }
    .order-cart-header h2 { color: #fff; }
    .order-cart-close { background: #222; color: #aaa; }
    .order-cart-item { border-bottom-color: #1a1a1a; }
    .order-cart-item-name { color: #fff; }
    .order-cart-item-price { color: #fff; }
    .order-qty-control { border-color: #333; }
    .order-qty-btn { background: #1a1a1a; }
    .order-qty-btn:hover { background: #2a1a3a; }
    .order-qty-value { color: #fff; }
    .order-cart-item-notes { background: #1a1a1a; border-color: #333; color: #fff; }
    .order-cart-item-notes::placeholder { color: #555; }
    .order-special-requests { background: #1a1a1a; border-color: #333; color: #fff; }
    .order-special-requests::placeholder { color: #555; }
    .order-customer-name { background: #1a1a1a; border-color: #333; color: #fff; }
    .order-customer-name::placeholder { color: #555; }
    .order-cart-totals { border-top-color: #222; }
    .order-cart-total-row { color: #aaa; }
    .order-cart-total-row.total { color: #fff; border-top-color: #333; }
    .order-conf-header h1 { color: #fff; }
    .order-conf-number { color: #888; }
    .order-status-label { color: #fff; }
    .order-status-time { color: #666; }
    .order-status-dot { background: #1a1a1a; }
    .order-status-step.active .order-status-dot { background: #2a1a3a; }
    .order-status-line { background: #333; }
    .order-conf-total { color: #fff; border-top-color: #333; }
    .order-new-btn { border-color: #8A05BE; color: #8A05BE; }
    .order-new-btn:hover { background: #8A05BE; color: #fff; }
    .order-cart-extras { border-top-color: #222; }
  }

  /* QR Scan Verification Modal */
  .qr-scan-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .qr-scan-modal {
    background: #fff;
    border-radius: 24px;
    padding: 32px 24px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    position: relative;
  }
  .qr-scan-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
  }
  .qr-scan-icon { font-size: 48px; margin-bottom: 12px; }
  .qr-scan-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px;
    color: #111;
  }
  .qr-scan-desc {
    font-size: 14px;
    color: #666;
    margin: 0 0 20px;
    line-height: 1.5;
  }
  .qr-scan-camera {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    background: #000;
    margin-bottom: 16px;
  }
  .qr-scan-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .qr-scan-frame {
    position: absolute;
    inset: 20%;
    border: 3px solid #8A05BE;
    border-radius: 12px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.3);
  }
  .qr-scan-manual-btn {
    background: none;
    border: none;
    color: #8A05BE;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Responsive */
  @media (min-width: 768px) {
    .order-page {
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }
  }
`;

export const getServerSideProps = async ({ params, locale }: { params: { id: string }; locale: string }) => {

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
