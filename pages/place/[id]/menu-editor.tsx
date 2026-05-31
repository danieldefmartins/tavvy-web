/**
 * Menu Editor - Restaurant Owner Self-Service
 * Path: pages/place/[id]/menu-editor.tsx
 * URL: tavvy.com/place/[uuid]/menu-editor
 *
 * Features:
 * - Full CRUD for menu items and categories
 * - Settings for menu appearance and promotions
 * - Image upload to Supabase Storage or URL paste
 * - Auth-gated: requires logged-in user
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  is_available: boolean;
  dietary_tags: string[] | null;
  calories: number | null;
  order_url: string | null;
  sort_order: number;
  category_id: string;
  meal_period: string | null;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
  meal_period: string | null;
  menu_id: string;
}

interface Menu {
  id: string;
  place_id: string;
  name: string;
  style: string | null;
  cover_image_url: string | null;
  show_cover: boolean;
  happy_hour_enabled: boolean;
  happy_hour_text: string | null;
  happy_hour_times: string | null;
  chef_recommendation_id: string | null;
  dish_of_day_id: string | null;
  promo_banner_text: string | null;
  promo_banner_enabled: boolean;
  seasonal_special_text: string | null;
  seasonal_special_enabled: boolean;
  welcome_message: string | null;
  tagline: string | null;
}

type ActiveTab = 'items' | 'categories' | 'settings' | 'promotions';

const MEAL_PERIODS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'all_day', label: 'All Day' },
];

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'dairy_free', label: 'Dairy-Free' },
  { value: 'nut_free', label: 'Nut-Free' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'spicy-2', label: 'Spicy (Medium)' },
  { value: 'spicy-3', label: 'Spicy (Hot)' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  // Auth
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [placeName, setPlaceName] = useState('');
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('items');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<MenuCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'item' | 'category'; id: string } | null>(null);

  // ─── Auth Check ───────────────────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setAuthLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load Data ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Place name
      const { data: placeData } = await supabase
        .from('places')
        .select('name')
        .eq('id', id)
        .maybeSingle();
      if (placeData) setPlaceName(placeData.name || '');

      // Menu
      let { data: menuData } = await supabase
        .from('menus')
        .select('*')
        .eq('place_id', id)
        .maybeSingle();

      // If no menu exists, create one
      if (!menuData) {
        const { data: newMenu } = await supabase
          .from('menus')
          .insert({
            place_id: id,
            name: `${placeData?.name || 'Restaurant'} Menu`,
            show_cover: false,
            happy_hour_enabled: false,
            promo_banner_enabled: false,
            seasonal_special_enabled: false,
          })
          .select()
          .single();
        menuData = newMenu;
      }

      if (menuData) {
        setMenu(menuData);

        // Categories
        const { data: catData } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('menu_id', menuData.id)
          .order('sort_order', { ascending: true });
        setCategories(catData || []);

        // Items
        if (catData && catData.length > 0) {
          const catIds = catData.map((c: any) => c.id);
          const { data: itemData } = await supabase
            .from('menu_items')
            .select('*')
            .in('category_id', catIds)
            .order('sort_order', { ascending: true });
          setItems(itemData || []);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.error('[MenuEditor] Load error:', err);
      showToast('Error loading menu data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && user) loadData();
  }, [id, user, loadData]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `menu/${id}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) {
        // If bucket doesn't exist, return null and user can paste URL
        console.warn('Upload failed, use URL instead:', error.message);
        return null;
      }
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      return urlData?.publicUrl || null;
    } catch {
      return null;
    }
  };

  // ─── Item CRUD ────────────────────────────────────────────────────────────

  const saveItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.category_id) {
      showToast('Name and category are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editingItem.name,
        description: editingItem.description || null,
        price: editingItem.price || null,
        image_url: editingItem.image_url || null,
        is_popular: editingItem.is_popular || false,
        is_new: editingItem.is_new || false,
        is_available: editingItem.is_available !== false,
        dietary_tags: editingItem.dietary_tags || [],
        calories: editingItem.calories || null,
        order_url: editingItem.order_url || null,
        sort_order: editingItem.sort_order || 0,
        category_id: editingItem.category_id,
        meal_period: editingItem.meal_period || null,
      };

      if (editingItem.id) {
        // Update
        await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
        showToast('Item updated');
      } else {
        // Insert
        await supabase.from('menu_items').insert(payload);
        showToast('Item added');
      }
      setEditingItem(null);
      await loadData();
    } catch (err) {
      showToast('Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from('menu_items').delete().eq('id', itemId);
    showToast('Item deleted');
    setDeleteConfirm(null);
    await loadData();
  };

  // ─── Category CRUD ────────────────────────────────────────────────────────

  const saveCategory = async () => {
    if (!editingCategory || !editingCategory.name || !menu) {
      showToast('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editingCategory.name,
        description: editingCategory.description || null,
        sort_order: editingCategory.sort_order || 0,
        meal_period: editingCategory.meal_period || null,
        image_url: editingCategory.image_url || null,
        menu_id: menu.id,
      };

      if (editingCategory.id) {
        await supabase.from('menu_categories').update(payload).eq('id', editingCategory.id);
        showToast('Category updated');
      } else {
        await supabase.from('menu_categories').insert(payload);
        showToast('Category added');
      }
      setEditingCategory(null);
      await loadData();
    } catch {
      showToast('Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (catId: string) => {
    // Check for items in this category
    const catItems = items.filter(i => i.category_id === catId);
    if (catItems.length > 0) {
      showToast('Remove all items from this category first');
      setDeleteConfirm(null);
      return;
    }
    await supabase.from('menu_categories').delete().eq('id', catId);
    showToast('Category deleted');
    setDeleteConfirm(null);
    await loadData();
  };

  // ─── Settings Save ────────────────────────────────────────────────────────

  const saveSettings = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      await supabase.from('menus').update({
        name: menu.name,
        cover_image_url: menu.cover_image_url,
        style: menu.style,
        show_cover: menu.show_cover,
      }).eq('id', menu.id);
      showToast('Settings saved');
    } catch {
      showToast('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // ─── Promotions Save ──────────────────────────────────────────────────────

  const savePromotions = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      await supabase.from('menus').update({
        happy_hour_enabled: menu.happy_hour_enabled,
        happy_hour_text: menu.happy_hour_text,
        happy_hour_times: menu.happy_hour_times,
        chef_recommendation_id: menu.chef_recommendation_id,
        dish_of_day_id: menu.dish_of_day_id,
        promo_banner_text: menu.promo_banner_text,
        promo_banner_enabled: menu.promo_banner_enabled,
        seasonal_special_text: menu.seasonal_special_text,
        seasonal_special_enabled: menu.seasonal_special_enabled,
        welcome_message: menu.welcome_message,
        tagline: menu.tagline,
      }).eq('id', menu.id);
      showToast('Promotions saved');
    } catch {
      showToast('Error saving promotions');
    } finally {
      setSaving(false);
    }
  };

  // ─── Auth Gate ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="me-loading">
        <div className="me-spinner" />
        <p>Checking authentication...</p>
        <style jsx>{editorStyles}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="me-auth-gate">
        <div className="me-auth-card">
          <h2>Sign In Required</h2>
          <p>You need to be signed in to manage your restaurant menu.</p>
          <button className="me-btn-primary" onClick={() => router.push('/login')}>
            Sign In
          </button>
        </div>
        <style jsx>{editorStyles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="me-loading">
        <div className="me-spinner" />
        <p>Loading menu editor...</p>
        <style jsx>{editorStyles}</style>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const itemsByCategory = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));

  return (
    <>
      <Head>
        <title>Menu Editor - {placeName} | Tavvy</title>
      </Head>
      <style jsx>{editorStyles}</style>

      <div className="me-container">
        {/* Header */}
        <header className="me-header">
          <div className="me-header-left">
            <button className="me-back" onClick={() => router.push(`/place/${id}`)}>
              &larr;
            </button>
            <div>
              <h1 className="me-title">Menu Editor</h1>
              <p className="me-subtitle">{placeName}</p>
            </div>
          </div>
          <Link href={`/place/${id}/menu`} className="me-preview-link">
            Preview Menu
          </Link>
        </header>

        {/* Tabs */}
        <nav className="me-tabs">
          {(['items', 'categories', 'settings', 'promotions'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              className={`me-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'items' ? 'Menu Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="me-content">
          {/* ══════ ITEMS TAB ══════ */}
          {activeTab === 'items' && (
            <div className="me-items-tab">
              {categories.length === 0 && (
                <div className="me-empty-state">
                  <p>No categories yet. Add a category first to start adding items.</p>
                  <button className="me-btn-primary" onClick={() => setActiveTab('categories')}>
                    Add Category
                  </button>
                </div>
              )}

              {itemsByCategory.map(cat => (
                <div key={cat.id} className="me-category-group">
                  <div className="me-category-group-header">
                    <h3>{cat.name}</h3>
                    <button
                      className="me-btn-add"
                      onClick={() => setEditingItem({ category_id: cat.id, is_available: true, sort_order: cat.items.length })}
                    >
                      + Add Item
                    </button>
                  </div>

                  {cat.items.length === 0 && (
                    <p className="me-empty-cat">No items in this category yet.</p>
                  )}

                  {cat.items.map(item => (
                    <div key={item.id} className={`me-item-row ${!item.is_available ? 'sold-out' : ''}`}>
                      <div className="me-item-thumb">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          <div className="me-item-no-img">No img</div>
                        )}
                      </div>
                      <div className="me-item-info">
                        <span className="me-item-name">{item.name}</span>
                        <span className="me-item-price">
                          {item.price ? `$${item.price.toFixed(2)}` : 'No price'}
                        </span>
                        <div className="me-item-tags">
                          {item.is_popular && <span className="me-tag popular">Popular</span>}
                          {item.is_new && <span className="me-tag new">New</span>}
                          {!item.is_available && <span className="me-tag soldout">Sold Out</span>}
                          {(item.dietary_tags || []).map(tag => (
                            <span key={tag} className="me-tag diet">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="me-item-actions">
                        <button className="me-btn-edit" onClick={() => setEditingItem(item)}>Edit</button>
                        <button className="me-btn-delete" onClick={() => setDeleteConfirm({ type: 'item', id: item.id })}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ══════ CATEGORIES TAB ══════ */}
          {activeTab === 'categories' && (
            <div className="me-categories-tab">
              <div className="me-section-header">
                <h2>Categories</h2>
                <button
                  className="me-btn-primary"
                  onClick={() => setEditingCategory({ sort_order: categories.length, menu_id: menu?.id })}
                >
                  + Add Category
                </button>
              </div>

              {categories.length === 0 && (
                <div className="me-empty-state">
                  <p>No categories yet. Add your first category to organize your menu.</p>
                </div>
              )}

              {categories.map(cat => (
                <div key={cat.id} className="me-cat-row">
                  <div className="me-cat-order">{cat.sort_order}</div>
                  <div className="me-cat-info">
                    <span className="me-cat-name">{cat.name}</span>
                    {cat.meal_period && <span className="me-cat-period">{cat.meal_period}</span>}
                  </div>
                  <div className="me-cat-actions">
                    <button className="me-btn-edit" onClick={() => setEditingCategory(cat)}>Edit</button>
                    <button className="me-btn-delete" onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════ SETTINGS TAB ══════ */}
          {activeTab === 'settings' && menu && (
            <div className="me-settings-tab">
              <h2>Menu Settings</h2>
              <div className="me-form">
                <label className="me-field">
                  <span>Menu Name</span>
                  <input
                    type="text"
                    value={menu.name || ''}
                    onChange={e => setMenu({ ...menu, name: e.target.value })}
                  />
                </label>

                <label className="me-field">
                  <span>Cover Image URL</span>
                  <input
                    type="text"
                    value={menu.cover_image_url || ''}
                    onChange={e => setMenu({ ...menu, cover_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </label>
                {menu.cover_image_url && (
                  <div className="me-img-preview">
                    <img src={menu.cover_image_url} alt="Cover preview" />
                  </div>
                )}

                <label className="me-field">
                  <span>Menu Style</span>
                  <select
                    value={menu.style || 'magazine'}
                    onChange={e => setMenu({ ...menu, style: e.target.value })}
                  >
                    <option value="magazine">Magazine</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </label>

                <label className="me-field-toggle">
                  <input
                    type="checkbox"
                    checked={menu.show_cover}
                    onChange={e => setMenu({ ...menu, show_cover: e.target.checked })}
                  />
                  <span>Show Cover Page</span>
                </label>

                <button className="me-btn-primary" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* ══════ PROMOTIONS TAB ══════ */}
          {activeTab === 'promotions' && menu && (
            <div className="me-promos-tab">
              <h2>Promotions & Highlights</h2>
              <div className="me-form">
                {/* Happy Hour */}
                <div className="me-promo-section">
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={menu.happy_hour_enabled}
                      onChange={e => setMenu({ ...menu, happy_hour_enabled: e.target.checked })}
                    />
                    <span>Happy Hour</span>
                  </label>
                  {menu.happy_hour_enabled && (
                    <>
                      <label className="me-field">
                        <span>Happy Hour Text</span>
                        <input
                          type="text"
                          value={menu.happy_hour_text || ''}
                          onChange={e => setMenu({ ...menu, happy_hour_text: e.target.value })}
                          placeholder="e.g. 50% off cocktails"
                        />
                      </label>
                      <label className="me-field">
                        <span>Times</span>
                        <input
                          type="text"
                          value={menu.happy_hour_times || ''}
                          onChange={e => setMenu({ ...menu, happy_hour_times: e.target.value })}
                          placeholder="e.g. Mon-Fri 4-6pm"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* Chef Recommendation */}
                <label className="me-field">
                  <span>Chef&apos;s Recommendation</span>
                  <select
                    value={menu.chef_recommendation_id || ''}
                    onChange={e => setMenu({ ...menu, chef_recommendation_id: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                {/* Dish of the Day */}
                <label className="me-field">
                  <span>Dish of the Day</span>
                  <select
                    value={menu.dish_of_day_id || ''}
                    onChange={e => setMenu({ ...menu, dish_of_day_id: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                {/* Promo Banner */}
                <div className="me-promo-section">
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={menu.promo_banner_enabled}
                      onChange={e => setMenu({ ...menu, promo_banner_enabled: e.target.checked })}
                    />
                    <span>Promo Banner</span>
                  </label>
                  {menu.promo_banner_enabled && (
                    <label className="me-field">
                      <span>Banner Text</span>
                      <input
                        type="text"
                        value={menu.promo_banner_text || ''}
                        onChange={e => setMenu({ ...menu, promo_banner_text: e.target.value })}
                        placeholder="e.g. Free dessert with any entree"
                      />
                    </label>
                  )}
                </div>

                {/* Seasonal Special */}
                <div className="me-promo-section">
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={menu.seasonal_special_enabled}
                      onChange={e => setMenu({ ...menu, seasonal_special_enabled: e.target.checked })}
                    />
                    <span>Seasonal Special</span>
                  </label>
                  {menu.seasonal_special_enabled && (
                    <label className="me-field">
                      <span>Special Text</span>
                      <input
                        type="text"
                        value={menu.seasonal_special_text || ''}
                        onChange={e => setMenu({ ...menu, seasonal_special_text: e.target.value })}
                        placeholder="e.g. Summer berry pavlova"
                      />
                    </label>
                  )}
                </div>

                {/* Welcome Message */}
                <label className="me-field">
                  <span>Welcome Message</span>
                  <textarea
                    value={menu.welcome_message || ''}
                    onChange={e => setMenu({ ...menu, welcome_message: e.target.value })}
                    placeholder="Welcome to our restaurant..."
                    rows={3}
                  />
                </label>

                {/* Tagline */}
                <label className="me-field">
                  <span>Tagline</span>
                  <input
                    type="text"
                    value={menu.tagline || ''}
                    onChange={e => setMenu({ ...menu, tagline: e.target.value })}
                    placeholder="e.g. Farm to table since 2015"
                  />
                </label>

                <button className="me-btn-primary" onClick={savePromotions} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Promotions'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ══════ ITEM EDIT MODAL ══════ */}
        {editingItem && (
          <div className="me-modal-overlay" onClick={() => setEditingItem(null)}>
            <div className="me-modal" onClick={e => e.stopPropagation()}>
              <div className="me-modal-header">
                <h2>{editingItem.id ? 'Edit Item' : 'Add Item'}</h2>
                <button className="me-modal-close" onClick={() => setEditingItem(null)}>&times;</button>
              </div>
              <div className="me-modal-body">
                <label className="me-field">
                  <span>Name *</span>
                  <input
                    type="text"
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Dish name"
                    autoFocus
                  />
                </label>

                <label className="me-field">
                  <span>Description</span>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Brief description of the dish"
                    rows={2}
                  />
                </label>

                <div className="me-field-row">
                  <label className="me-field">
                    <span>Price ($)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingItem.price ?? ''}
                      onChange={e => setEditingItem({ ...editingItem, price: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="0.00"
                    />
                  </label>

                  <label className="me-field">
                    <span>Calories</span>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.calories ?? ''}
                      onChange={e => setEditingItem({ ...editingItem, calories: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <label className="me-field">
                  <span>Category *</span>
                  <select
                    value={editingItem.category_id || ''}
                    onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </label>

                <label className="me-field">
                  <span>Meal Period</span>
                  <select
                    value={editingItem.meal_period || ''}
                    onChange={e => setEditingItem({ ...editingItem, meal_period: e.target.value || null })}
                  >
                    <option value="">All Day</option>
                    {MEAL_PERIODS.map(mp => (
                      <option key={mp.value} value={mp.value}>{mp.label}</option>
                    ))}
                  </select>
                </label>

                <label className="me-field">
                  <span>Image URL</span>
                  <input
                    type="text"
                    value={editingItem.image_url || ''}
                    onChange={e => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    placeholder="https://... or upload below"
                  />
                </label>

                <label className="me-field">
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      showToast('Uploading...');
                      const url = await uploadImage(file);
                      if (url) {
                        setEditingItem(prev => ({ ...prev, image_url: url }));
                        showToast('Image uploaded');
                      } else {
                        showToast('Upload failed - paste URL instead');
                      }
                    }}
                  />
                </label>

                {editingItem.image_url && (
                  <div className="me-img-preview small">
                    <img src={editingItem.image_url} alt="Preview" />
                  </div>
                )}

                <label className="me-field">
                  <span>Order URL (external link)</span>
                  <input
                    type="text"
                    value={editingItem.order_url || ''}
                    onChange={e => setEditingItem({ ...editingItem, order_url: e.target.value })}
                    placeholder="https://order.restaurant.com/..."
                  />
                </label>

                {/* Dietary Tags */}
                <div className="me-field">
                  <span>Dietary Tags</span>
                  <div className="me-checkbox-grid">
                    {DIETARY_OPTIONS.map(opt => (
                      <label key={opt.value} className="me-checkbox-label">
                        <input
                          type="checkbox"
                          checked={(editingItem.dietary_tags || []).includes(opt.value)}
                          onChange={e => {
                            const tags = editingItem.dietary_tags || [];
                            setEditingItem({
                              ...editingItem,
                              dietary_tags: e.target.checked
                                ? [...tags, opt.value]
                                : tags.filter(t => t !== opt.value),
                            });
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="me-toggle-row">
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={editingItem.is_popular || false}
                      onChange={e => setEditingItem({ ...editingItem, is_popular: e.target.checked })}
                    />
                    <span>Popular</span>
                  </label>
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={editingItem.is_new || false}
                      onChange={e => setEditingItem({ ...editingItem, is_new: e.target.checked })}
                    />
                    <span>New</span>
                  </label>
                  <label className="me-field-toggle">
                    <input
                      type="checkbox"
                      checked={editingItem.is_available !== false}
                      onChange={e => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                    />
                    <span>Available</span>
                  </label>
                </div>

                <label className="me-field">
                  <span>Sort Order</span>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.sort_order ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </label>
              </div>
              <div className="me-modal-footer">
                <button className="me-btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                <button className="me-btn-primary" onClick={saveItem} disabled={saving}>
                  {saving ? 'Saving...' : (editingItem.id ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ CATEGORY EDIT MODAL ══════ */}
        {editingCategory && (
          <div className="me-modal-overlay" onClick={() => setEditingCategory(null)}>
            <div className="me-modal me-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="me-modal-header">
                <h2>{editingCategory.id ? 'Edit Category' : 'Add Category'}</h2>
                <button className="me-modal-close" onClick={() => setEditingCategory(null)}>&times;</button>
              </div>
              <div className="me-modal-body">
                <label className="me-field">
                  <span>Name *</span>
                  <input
                    type="text"
                    value={editingCategory.name || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="e.g. Appetizers"
                    autoFocus
                  />
                </label>

                <label className="me-field">
                  <span>Description</span>
                  <textarea
                    value={editingCategory.description || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </label>

                <label className="me-field">
                  <span>Meal Period</span>
                  <select
                    value={editingCategory.meal_period || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, meal_period: e.target.value || null })}
                  >
                    <option value="">All Day</option>
                    {MEAL_PERIODS.map(mp => (
                      <option key={mp.value} value={mp.value}>{mp.label}</option>
                    ))}
                  </select>
                </label>

                <label className="me-field">
                  <span>Sort Order</span>
                  <input
                    type="number"
                    min="0"
                    value={editingCategory.sort_order ?? 0}
                    onChange={e => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </label>

                <label className="me-field">
                  <span>Image URL</span>
                  <input
                    type="text"
                    value={editingCategory.image_url || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, image_url: e.target.value })}
                    placeholder="Optional category image URL"
                  />
                </label>
              </div>
              <div className="me-modal-footer">
                <button className="me-btn-secondary" onClick={() => setEditingCategory(null)}>Cancel</button>
                <button className="me-btn-primary" onClick={saveCategory} disabled={saving}>
                  {saving ? 'Saving...' : (editingCategory.id ? 'Update' : 'Add Category')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ DELETE CONFIRMATION ══════ */}
        {deleteConfirm && (
          <div className="me-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="me-modal me-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="me-modal-header">
                <h2>Confirm Delete</h2>
                <button className="me-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
              </div>
              <div className="me-modal-body">
                <p>Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
              </div>
              <div className="me-modal-footer">
                <button className="me-btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button
                  className="me-btn-danger"
                  onClick={() => {
                    if (deleteConfirm.type === 'item') deleteItem(deleteConfirm.id);
                    else deleteCategory(deleteConfirm.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && <div className="me-toast">{toast}</div>}
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const editorStyles = `
  .me-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    color: #666;
  }
  .me-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #eee;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: me-spin 0.7s linear infinite;
    margin-bottom: 12px;
  }
  @keyframes me-spin { to { transform: rotate(360deg); } }

  .me-auth-gate {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  }
  .me-auth-card {
    background: #fff;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    text-align: center;
    max-width: 400px;
  }
  .me-auth-card h2 {
    margin: 0 0 12px;
    font-size: 22px;
    color: #1a1a1a;
  }
  .me-auth-card p {
    margin: 0 0 24px;
    color: #666;
    font-size: 15px;
  }

  .me-container {
    min-height: 100vh;
    background: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Header */
  .me-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: #fff;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .me-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .me-back {
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: #8A05BE;
    padding: 4px 8px;
  }
  .me-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .me-subtitle {
    margin: 2px 0 0;
    font-size: 13px;
    color: #888;
  }
  .me-preview-link {
    padding: 8px 16px;
    border-radius: 8px;
    background: #8A05BE;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .me-preview-link:hover { opacity: 0.9; }

  /* Tabs */
  .me-tabs {
    display: flex;
    gap: 0;
    background: #fff;
    border-bottom: 1px solid #eee;
    padding: 0 24px;
    overflow-x: auto;
  }
  .me-tab {
    padding: 14px 20px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .me-tab.active {
    color: #8A05BE;
    border-bottom-color: #8A05BE;
    font-weight: 600;
  }
  .me-tab:hover { color: #8A05BE; }

  /* Content */
  .me-content {
    padding: 24px;
  }

  /* Buttons */
  .me-btn-primary {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #8A05BE;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .me-btn-primary:hover { opacity: 0.9; }
  .me-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .me-btn-secondary {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    color: #333;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  .me-btn-secondary:hover { background: #f5f5f5; }

  .me-btn-danger {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #dc2626;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .me-btn-danger:hover { opacity: 0.9; }

  .me-btn-add {
    padding: 6px 14px;
    border: 1px dashed #8A05BE;
    border-radius: 6px;
    background: rgba(138, 5, 190, 0.04);
    color: #8A05BE;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .me-btn-add:hover { background: rgba(138, 5, 190, 0.1); }

  .me-btn-edit {
    padding: 5px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    color: #333;
    font-size: 12px;
    cursor: pointer;
  }
  .me-btn-edit:hover { border-color: #8A05BE; color: #8A05BE; }

  .me-btn-delete {
    padding: 5px 12px;
    border: 1px solid #fecaca;
    border-radius: 6px;
    background: #fff;
    color: #dc2626;
    font-size: 12px;
    cursor: pointer;
  }
  .me-btn-delete:hover { background: #fef2f2; }

  /* Items Tab */
  .me-category-group {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .me-category-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .me-category-group-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .me-empty-cat {
    color: #999;
    font-size: 13px;
    font-style: italic;
    padding: 12px 0;
  }

  .me-item-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .me-item-row:last-child { border-bottom: none; }
  .me-item-row.sold-out { opacity: 0.5; }

  .me-item-thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f3f3f3;
  }
  .me-item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .me-item-no-img {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #bbb;
  }

  .me-item-info {
    flex: 1;
    min-width: 0;
  }
  .me-item-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .me-item-price {
    display: block;
    font-size: 13px;
    color: #666;
    margin-top: 2px;
  }
  .me-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }
  .me-tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }
  .me-tag.popular { background: #fff3e0; color: #e65100; }
  .me-tag.new { background: #e8f5e9; color: #2e7d32; }
  .me-tag.soldout { background: #ffebee; color: #c62828; }
  .me-tag.diet { background: #f3e5f5; color: #6a1b9a; }

  .me-item-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  /* Categories Tab */
  .me-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .me-section-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .me-cat-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #fff;
    padding: 16px 20px;
    border-radius: 10px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .me-cat-order {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #f3e5f5;
    color: #8A05BE;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .me-cat-info { flex: 1; }
  .me-cat-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .me-cat-period {
    margin-left: 10px;
    font-size: 12px;
    color: #888;
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .me-cat-actions {
    display: flex;
    gap: 6px;
  }

  /* Forms */
  .me-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 600px;
  }
  .me-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .me-field > span {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
  .me-field input[type="text"],
  .me-field input[type="number"],
  .me-field select,
  .me-field textarea {
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
    background: #fff;
  }
  .me-field input:focus,
  .me-field select:focus,
  .me-field textarea:focus {
    outline: none;
    border-color: #8A05BE;
    box-shadow: 0 0 0 3px rgba(138, 5, 190, 0.1);
  }
  .me-field textarea { resize: vertical; }

  .me-field-row {
    display: flex;
    gap: 12px;
  }
  .me-field-row .me-field { flex: 1; }

  .me-field-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }
  .me-field-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #8A05BE;
    cursor: pointer;
  }
  .me-field-toggle span {
    font-weight: 500;
  }

  .me-toggle-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .me-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .me-checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #444;
    cursor: pointer;
  }
  .me-checkbox-label input[type="checkbox"] {
    accent-color: #8A05BE;
  }

  .me-img-preview {
    border-radius: 8px;
    overflow: hidden;
    max-width: 300px;
    border: 1px solid #eee;
  }
  .me-img-preview img {
    width: 100%;
    height: auto;
    display: block;
  }
  .me-img-preview.small {
    max-width: 120px;
  }

  .me-promo-section {
    padding: 16px;
    background: #fafafa;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Empty State */
  .me-empty-state {
    text-align: center;
    padding: 40px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .me-empty-state p {
    color: #666;
    font-size: 15px;
    margin: 0 0 16px;
  }

  /* Modal */
  .me-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .me-modal {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .me-modal.me-modal-sm { max-width: 440px; }

  .me-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
  }
  .me-modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .me-modal-close {
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }
  .me-modal-close:hover { color: #333; }

  .me-modal-body {
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .me-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* Toast */
  .me-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #fff;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    z-index: 2000;
    animation: me-toast-in 0.3s ease;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  }
  @keyframes me-toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .me-header { padding: 16px; }
    .me-content { padding: 16px; }
    .me-tabs { padding: 0 16px; }
    .me-tab { padding: 12px 14px; font-size: 13px; }
    .me-item-row { flex-wrap: wrap; }
    .me-item-actions { width: 100%; justify-content: flex-end; margin-top: 8px; }
    .me-field-row { flex-direction: column; }
    .me-modal { max-height: 95vh; margin: 10px; }
  }
`;

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
