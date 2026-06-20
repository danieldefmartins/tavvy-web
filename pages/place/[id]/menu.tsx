/**
 * Digital Services Page - Magazine Style
 * Path: pages/place/[id]/menu.tsx
 * URL: tavvy.com/place/[uuid]/services
 *
 * Features:
 * - Meal period tabs (Breakfast, Lunch, Dinner, All Day)
 * - Categories within each period
 * - Popular/New badges, dietary icons
 * - Customer photos linked to items
 * - Magazine-style premium layout
 * - Owner CTA if no menu exists
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import MenuLanguageToggle from '../../../components/MenuLanguageToggle';
import { trackMenuView, trackMenuShare } from '../../../lib/menuAnalytics';
import { trackItemView, trackItemShare } from '../../../lib/menuItemAnalytics';

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
  linked_photo_ids: string[] | null;
  calories: number | null; // TODO: add `calories integer` column to menu_items table
  order_url: string | null; // TODO: add `order_url text` column to menu_items table
  duration_minutes: number | null;
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

interface Place {
  id: string;
  tavvy_category: string;
}

interface FeaturedDish {
  id: string;
  name: string;
  price: number | null;
  price_label: string | null;
  image_url: string | null;
}

interface PlacePhoto {
  id: string;
  url: string;
  caption: string | null;
}

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

type AllergenFilter = 'nut_free' | 'gluten_free' | 'dairy_free' | 'vegan' | 'vegetarian';

const ALLERGEN_FILTERS: { key: AllergenFilter; label: string; icon: string }[] = [
  { key: 'nut_free', label: 'Nut-Free', icon: '🌰' },
  { key: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { key: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { key: 'vegan', label: 'Vegan', icon: '🌱' },
  { key: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
];

const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  all_day: 'All Day',
};

const DIETARY_ICONS: Record<string, string> = {
  vegan: '🌱',
  vegetarian: '🌱',
  'gluten-free': '🌾',
  gluten_free: '🌾',
  gf: '🌾',
  dairy_free: '🥛',
  nut_free: '🌰',
  spicy: '🌶️',
  'spicy-2': '🌶️🌶️',
  'spicy-3': '🌶️🌶️🌶️',
  halal: '☕',
  kosher: '✡️',
};

export default function MenuPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [placeName, setPlaceName] = useState<string>('');
  const [placeSlug, setPlaceSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [noMenu, setNoMenu] = useState(false);
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');
  const [linkedPhotos, setLinkedPhotos] = useState<Record<string, PlacePhoto>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showAllergenPanel, setShowAllergenPanel] = useState(false);
  const [chefDish, setChefDish] = useState<FeaturedDish | null>(null);
  const [dayDish, setDayDish] = useState<FeaturedDish | null>(null);
  const [activeFilters, setActiveFilters] = useState<AllergenFilter[]>([]);
  const [showFullMenu, setShowFullMenu] = useState(false);

  useEffect(() => {
    if (id) {
      loadMenu(id as string);
    }
  }, [id]);

  // Track menu view
  useEffect(() => {
    if (id && !loading && !noMenu) {
      trackMenuView(id as string);
    }
  }, [id, loading, noMenu]);

  const loadMenu = async (placeId: string) => {
    setLoading(true);
    try {
      // Get place name
      const { data: placeData } = await supabase
        .from('places')
        .select('name, slug')
        .eq('id', placeId)
        .maybeSingle();

      if (placeData) {
        setPlaceName(placeData.name || '');
        setPlaceSlug(placeData.slug || '');
      }

      // Get menu
      const { data: menuData } = await supabase
        .from('menus')
        .select('*')
        .eq('place_id', placeId)
        .maybeSingle();

      if (!menuData) {
        setNoMenu(true);
        setLoading(false);
        return;
      }

      setMenu(menuData);

      // Load featured dishes if cover is enabled
      if (menuData.show_cover) {
        const featuredIds = [menuData.chef_recommendation_id, menuData.dish_of_day_id].filter(Boolean);
        if (featuredIds.length > 0) {
          const { data: featuredData } = await supabase
            .from('menu_items')
            .select('id, name, price, price_label, image_url')
            .in('id', featuredIds);
          if (featuredData) {
            featuredData.forEach((dish: any) => {
              if (dish.id === menuData.chef_recommendation_id) setChefDish(dish);
              if (dish.id === menuData.dish_of_day_id) setDayDish(dish);
            });
          }
        }
      }

      // Get categories with items
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });

      if (categoriesData && categoriesData.length > 0) {
        // Get all items for these categories
        const categoryIds = categoriesData.map((c: any) => c.id);
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoryIds)
          .order('sort_order', { ascending: true });

        // Group items by category
        const categoriesWithItems: MenuCategory[] = categoriesData.map((cat: any) => ({
          ...cat,
          items: (itemsData || []).filter((item: any) => item.category_id === cat.id),
        }));

        setCategories(categoriesWithItems);

        // Load linked photos
        const allPhotoIds: string[] = [];
        (itemsData || []).forEach((item: any) => {
          if (item.linked_photo_ids && Array.isArray(item.linked_photo_ids)) {
            allPhotoIds.push(...item.linked_photo_ids);
          }
        });

        if (allPhotoIds.length > 0) {
          const uniqueIds = [...new Set(allPhotoIds)];
          const { data: photosData } = await supabase
            .from('place_photos')
            .select('id, url, caption')
            .in('id', uniqueIds);

          if (photosData) {
            const photoMap: Record<string, PlacePhoto> = {};
            photosData.forEach((p: any) => { photoMap[p.id] = p; });
            setLinkedPhotos(photoMap);
          }
        }
      }
    } catch (error) {
      console.error('[MenuPage] Error loading menu:', error);
      setNoMenu(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by meal period
  const filteredCategories = activePeriod === 'all'
    ? categories
    : categories.filter(cat =>
        cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period
      );

  // Determine which meal periods are available
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

  const getDietaryIcons = (tags: string[] | null): string => {
    if (!tags || tags.length === 0) return '';
    return tags.map(tag => DIETARY_ICONS[tag.toLowerCase()] || '').filter(Boolean).join(' ');
  };

  const itemMatchesFilters = (item: MenuItem): boolean => {
    if (activeFilters.length === 0) return true;
    const tags = (item.dietary_tags || []).map(t => t.toLowerCase().replace('-', '_'));
    return activeFilters.every(filter => {
      // Match filter key against dietary tags (handle gf alias)
      if (filter === 'gluten_free') return tags.includes('gluten_free') || tags.includes('gf') || tags.includes('gluten-free');
      return tags.includes(filter);
    });
  };

  const toggleFilter = (filter: AllergenFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Auto-scroll to dish from ?dish= query param
  const [highlightedDish, setHighlightedDish] = useState<string | null>(null);
  useEffect(() => {
    if (!router.isReady || loading || categories.length === 0) return;
    const dishId = router.query.dish as string;
    if (!dishId) return;
    setHighlightedDish(dishId);
    setTimeout(() => {
      const el = document.getElementById(`menu-item-${dishId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    // Clear highlight after 3s
    setTimeout(() => setHighlightedDish(null), 3300);
  }, [router.isReady, loading, categories.length]);

  // Share a menu item
  const handleShareItem = async (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    trackMenuShare(id as string);
    trackItemShare(item.id);
    const slug = placeSlug || id;
    const shareUrl = `https://tavvy.com/place/${id}/menu?dish=${item.id}`;
    const priceStr = formatPrice(item.price, item.price_label);
    const shareText = `${item.name} at ${placeName}${priceStr ? ` — ${priceStr}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: item.name, text: shareText, url: shareUrl });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Link copied to clipboard!');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout hideTabBar>
        <style jsx global>{menuStyles}</style>
        <div className="menu-loading">
          <div className="menu-spinner" />
          <p>Loading menu...</p>
        </div>
      </AppLayout>
    );
  }

  // No menu state - Owner CTA
  if (noMenu) {
    return (
      <AppLayout hideTabBar>
        <style jsx global>{menuStyles}</style>
        <Head>
          <title>{placeName ? `${placeName} Menu` : 'Menu'} | Tavvy</title>
        </Head>
        <div className="menu-container">
          <div className="menu-header">
            <button className="menu-back-btn" onClick={() => router.back()}>
              ← Back
            </button>
          </div>
          <div className="menu-empty">
            <div className="menu-empty-icon">📋</div>
            <h2>No Menu Available Yet</h2>
            <p>This restaurant hasn&apos;t added their digital menu to Tavvy yet.</p>
            <div className="menu-empty-cta">
              <h3>Are you the owner?</h3>
              <p>Create a beautiful digital menu that your customers will love. Showcase your dishes with stunning photos and keep your menu always up to date.</p>
              <button className="menu-claim-btn" onClick={() => router.push('/app')}>
                Add Your Menu
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideTabBar>
      <Head>
        <title>{placeName ? `${placeName} Menu` : 'Menu'} | Tavvy</title>
        <meta name="description" content={`Browse the menu at ${placeName}. View dishes, prices, and photos from real customers on Tavvy.`} />
        <meta property="og:title" content={`${placeName} Menu | Tavvy`} />
        <meta property="og:description" content={`Explore the full menu at ${placeName} with photos, prices, and dietary info.`} />
        {menu?.cover_image_url && <meta property="og:image" content={menu.cover_image_url} />}
      </Head>

      <style jsx global>{menuStyles}</style>

      <div className="menu-container">
        {/* Cover Page — Visual, Luxury Landing */}
        {menu?.show_cover && !showFullMenu && (
          <div className="menu-cover-page">
            {/* Full-Width Hero with Gradient Overlay */}
            <div className="menu-hero">
              <img
                src={menu.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop'}
                alt={placeName}
                className="menu-hero-img"
              />
              <div className="menu-hero-gradient" />
              <div className="menu-hero-text">
                <Link href={`/place/${id}`}>
                  <h1 className="menu-hero-name" style={{ cursor: 'pointer' }}>{placeName}</h1>
                </Link>
                {menu.tagline && <p className="menu-hero-tagline">{menu.tagline}</p>}
                {menu.welcome_message && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontStyle: 'italic', margin: '8px 0 0', maxWidth: 360 }}>
                    {menu.welcome_message}
                  </p>
                )}
              </div>
            </div>

            {/* See Full Menu CTA */}
            <div className="menu-cover-cta-wrap">
              <button className="menu-cover-cta" onClick={() => setShowFullMenu(true)}>
                See Full Menu
              </button>
            </div>

            {/* Visual Promo Tiles Grid */}
            {(menu.happy_hour_enabled || chefDish || dayDish || menu.promo_banner_enabled || menu.seasonal_special_enabled) && (
              <div className="menu-promo-grid">
                {menu.happy_hour_enabled && menu.happy_hour_text && (
                  <div className="menu-tile tile-happy-hour">
                    <div className="menu-tile-bg-icon">🍸</div>
                    <div className="menu-tile-content">
                      <span className="menu-tile-label">Happy Hour</span>
                      <span className="menu-tile-headline">{menu.happy_hour_text}</span>
                      {menu.happy_hour_times && (
                        <span className="menu-tile-sub">{menu.happy_hour_times}</span>
                      )}
                    </div>
                  </div>
                )}

                {chefDish && (
                  <div
                    className="menu-tile tile-chef"
                    onClick={() => {
                      setShowFullMenu(true);
                      setTimeout(() => {
                        const el = document.getElementById(`menu-item-${chefDish.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                  >
                    {chefDish.image_url ? (
                      <img src={chefDish.image_url} alt={chefDish.name} className="menu-tile-img" />
                    ) : (
                      <div className="menu-tile-img-placeholder" />
                    )}
                    <div className="menu-tile-img-overlay" />
                    <div className="menu-tile-content overlay-content">
                      <span className="menu-tile-label">Chef&apos;s Pick</span>
                      <span className="menu-tile-headline">{chefDish.name}</span>
                      {(chefDish.price || chefDish.price_label) && (
                        <span className="menu-tile-price">{formatPrice(chefDish.price, chefDish.price_label)}</span>
                      )}
                    </div>
                  </div>
                )}

                {dayDish && (
                  <div
                    className="menu-tile tile-day"
                    onClick={() => {
                      setShowFullMenu(true);
                      setTimeout(() => {
                        const el = document.getElementById(`menu-item-${dayDish.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                  >
                    {dayDish.image_url ? (
                      <img src={dayDish.image_url} alt={dayDish.name} className="menu-tile-img" />
                    ) : (
                      <div className="menu-tile-img-placeholder" />
                    )}
                    <div className="menu-tile-img-overlay" />
                    <div className="menu-tile-content overlay-content">
                      <span className="menu-tile-label">Dish of the Day</span>
                      <span className="menu-tile-headline">{dayDish.name}</span>
                      {(dayDish.price || dayDish.price_label) && (
                        <span className="menu-tile-price">{formatPrice(dayDish.price, dayDish.price_label)}</span>
                      )}
                    </div>
                  </div>
                )}

                {menu.promo_banner_enabled && menu.promo_banner_text && (
                  <div className="menu-tile tile-promo">
                    <div className="menu-tile-bg-icon">🎉</div>
                    <div className="menu-tile-content">
                      <span className="menu-tile-label">Special Offer</span>
                      <span className="menu-tile-headline">{menu.promo_banner_text}</span>
                    </div>
                  </div>
                )}

                {menu.seasonal_special_enabled && menu.seasonal_special_text && (
                  <div className="menu-tile tile-seasonal">
                    <div className="menu-tile-bg-icon">🌿</div>
                    <div className="menu-tile-content">
                      <span className="menu-tile-label">Seasonal</span>
                      <span className="menu-tile-headline">{menu.seasonal_special_text}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Powered by footer on cover */}
            <div className="menu-cover-footer">
              <img src="/tavvy-logo-white.png" alt="Tavvy" style={{ height: 18, opacity: 0.5 }} />
            </div>
          </div>
        )}

        {/* Cover image (fallback when show_cover is off, or after user taps See Full Menu) */}
        {((!menu?.show_cover || showFullMenu) && menu?.cover_image_url) && (
          <div className="menu-cover">
            <img src={menu.cover_image_url} alt={`${placeName} menu`} className="menu-cover-img" />
            <div className="menu-cover-overlay" />
          </div>
        )}

        {(!menu?.show_cover || showFullMenu) && (
        <>
        {/* ROW 1: Header */}
        <div className="menu-header">
          <button className="menu-back-btn" onClick={() => menu?.show_cover ? setShowFullMenu(false) : router.back()}>
            ← {menu?.show_cover ? 'Cover' : 'Back'}
          </button>
          <div className="menu-title-section">
            <h1 className="menu-title">{menu?.name || `${placeName} Menu`}</h1>
            {placeName && <Link href={`/place/${id}`}><p className="menu-subtitle" style={{ cursor: 'pointer' }}>{placeName}</p></Link>}
          </div>
          <Link href={`/place/${id}/menu-gallery`} className="menu-gallery-link">
            Gallery
          </Link>
        </div>

        {/* ROW 2: Meal periods + filter icon */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, borderBottom: '1px solid #f0f0f0' }}>
          {availablePeriods.length > 2 && (
            <div className="menu-periods" style={{ flex: 1, borderBottom: 'none' }}>
              {availablePeriods.map(period => (
                <button
                  key={period}
                  className={`menu-period-tab ${activePeriod === period ? 'active' : ''}`}
                  onClick={() => setActivePeriod(period)}
                >
                  {MEAL_PERIOD_LABELS[period]}
                </button>
              ))}
            </div>
          )}
          {/* Filter icon — toggles allergen panel */}
          <button
            onClick={() => setShowAllergenPanel(!showAllergenPanel)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: activeFilters.length > 0 ? '2px solid #8A05BE' : '1px solid #ddd',
              background: activeFilters.length > 0 ? 'rgba(138,5,190,0.08)' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
            aria-label="Filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeFilters.length > 0 ? '#8A05BE' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {activeFilters.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 16, height: 16,
                borderRadius: '50%', background: '#8A05BE', color: '#fff',
                fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{activeFilters.length}</span>
            )}
          </button>
        </div>

        {/* Allergen filter panel — hidden by default, shown on filter icon tap */}
        {showAllergenPanel && (
          <div className="menu-allergen-filters">
            {ALLERGEN_FILTERS.map(f => (
              <button
                key={f.key}
                className={`menu-allergen-pill ${activeFilters.includes(f.key) ? 'active' : ''}`}
                onClick={() => toggleFilter(f.key)}
              >
                {activeFilters.includes(f.key) ? '✓ ' : `${f.icon} `}{f.label}
              </button>
            ))}
          </div>
        )}

        {/* Categories & Items */}
        <div className="menu-content">
          {filteredCategories.map(category => (
            <div key={category.id} className="menu-category">
              <div className="menu-category-header">
                {category.image_url && (
                  <div className="menu-category-img-wrap">
                    <img src={category.image_url} alt={category.name} className="menu-category-img" />
                  </div>
                )}
                <div className="menu-category-info">
                  <h2 className="menu-category-name">{category.name}</h2>
                  {category.description && (
                    <p className="menu-category-desc">{category.description}</p>
                  )}
                </div>
              </div>

              <div className="menu-items">
                {category.items.map(item => {
                  const itemPhotos = (item.linked_photo_ids || [])
                    .map(pid => linkedPhotos[pid])
                    .filter(Boolean);
                  const displayImage = item.image_url || (itemPhotos.length > 0 ? itemPhotos[0].url : null);
                  const dietaryStr = getDietaryIcons(item.dietary_tags);
                  const isExpanded = expandedItem === item.id;
                  const matchesFilter = itemMatchesFilters(item);

                  return (
                    <div
                      key={item.id}
                      id={`menu-item-${item.id}`}
                      className={`menu-item ${displayImage ? 'has-image' : ''} ${isExpanded ? 'expanded' : ''} ${highlightedDish === item.id ? 'highlighted' : ''} ${!matchesFilter ? 'filtered-out' : ''}`}
                      onClick={() => { trackItemView(item.id); router.push(`/place/${id}/menu-gallery?dish=${item.id}`); }}
                    >
                      {!matchesFilter && <span className="menu-item-allergen-warn">⚠️</span>}
                      <div className="menu-item-content">
                        <div className="menu-item-text">
                          <div className="menu-item-name-row">
                            <span className="menu-item-name">{item.name}</span>
                            {item.is_popular && <span className="menu-badge popular" title="Popular">🔥 Popular</span>}
                            {item.is_new && <span className="menu-badge new" title="New">{'\u2728'}</span>}
                            <button
                              className="menu-item-share"
                              onClick={(e) => handleShareItem(item, e)}
                              aria-label="Share item"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                              </svg>
                            </button>
                          </div>
                          {item.description && (
                            <p className="menu-item-desc">{item.description}</p>
                          )}
                          <div className="menu-item-meta">
                            {formatPrice(item.price, item.price_label) && (
                              <span className="menu-item-price">
                                {formatPrice(item.price, item.price_label)}
                              </span>
                            )}
                            {item.calories && (
                              <span className="menu-item-calories">{item.calories} cal</span>
                            )}
                            {dietaryStr && (
                              <span className="menu-item-dietary">{dietaryStr}</span>
                            )}
                            {item.order_url && (
                              <a
                                href={item.order_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="menu-item-order-btn"
                                onClick={(e) => e.stopPropagation()}
                              >
                                🛒 Order
                              </a>
                            )}
                          </div>
                        </div>
                        {displayImage && (
                          <div className="menu-item-img-wrap">
                            <img src={displayImage} alt={item.name} className="menu-item-img" />
                          </div>
                        )}
                      </div>

                      {/* Expanded: show all linked photos */}
                      {isExpanded && itemPhotos.length > 1 && (
                        <div className="menu-item-photos">
                          {itemPhotos.map(photo => (
                            <div key={photo.id} className="menu-item-photo">
                              <img src={photo.url} alt={photo.caption || item.name} />
                              {photo.caption && <span className="menu-item-photo-cap">{photo.caption}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="menu-empty-period">
              <p>No items for this meal period.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="menu-footer">
          <p>Prices may vary. Ask your server for today&apos;s specials.</p>
          <img src="/tavvy-logo-white.png" alt="Tavvy" style={{ height: 18, opacity: 0.5 }} />
        </div>
        </>
        )}
      </div>
    </AppLayout>
  );
}

// ===== STYLES =====
const menuStyles = `
  .menu-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    color: #999;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }
  .menu-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #333;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: menu-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes menu-spin {
    to { transform: rotate(360deg); }
  }

  .menu-container {
    min-height: 100vh;
    background: #fafafa;
    font-family: 'Georgia', 'Times New Roman', serif;
    max-width: 640px;
    margin: 0 auto;
    position: relative;
  }

  /* Cover Image */
  .menu-cover {
    position: relative;
    height: 240px;
    overflow: hidden;
  }
  .menu-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .menu-cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);
  }

  /* Header */
  .menu-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fff;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .menu-back-btn {
    background: none;
    border: none;
    font-size: 16px;
    font-weight: 600;
    color: #8A05BE;
    cursor: pointer;
    padding: 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-title-section {
    flex: 1;
  }
  .menu-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    font-family: 'Georgia', serif;
    letter-spacing: -0.3px;
  }
  .menu-subtitle {
    font-size: 13px;
    color: #666;
    margin: 2px 0 0;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-gallery-link {
    font-size: 12px;
    color: #8A05BE;
    text-decoration: none;
    font-weight: 500;
    padding: 6px 12px;
    border: 1px solid rgba(138, 5, 190, 0.3);
    border-radius: 16px;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s;
  }
  .menu-gallery-link:hover {
    background: rgba(138, 5, 190, 0.08);
  }

  /* Meal Period Tabs */
  .menu-periods {
    display: flex;
    gap: 4px;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #eee;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .menu-period-tab {
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
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-period-tab.active {
    background: #8A05BE;
    color: #fff;
    font-weight: 600;
  }

  /* Content */
  .menu-content {
    padding: 20px;
  }

  /* Category */
  .menu-category {
    margin-bottom: 36px;
  }
  .menu-category-header {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 2px solid #1a1a1a;
  }
  .menu-category-img-wrap {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .menu-category-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .menu-category-info {
    flex: 1;
  }
  .menu-category-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -0.2px;
    text-transform: uppercase;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13px;
    letter-spacing: 1.5px;
  }
  .menu-category-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
    font-style: italic;
  }

  /* Items */
  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .menu-item {
    padding: 14px 0;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.15s;
  }
  .menu-item:last-child {
    border-bottom: none;
  }
  .menu-item:hover {
    background: rgba(138, 5, 190, 0.02);
  }
  .menu-item-content {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .menu-item-text {
    flex: 1;
    min-width: 0;
  }
  .menu-item-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .menu-item-name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-badge {
    font-size: 14px;
    display: inline-flex;
    align-items: center;
  }
  .menu-item.highlighted {
    background: rgba(138, 5, 190, 0.08);
    border-radius: 8px;
    transition: background 0.5s ease;
  }
  .menu-item-share {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: color 0.2s, background 0.2s;
    margin-left: auto;
  }
  .menu-item-share:hover {
    color: #8A05BE;
    background: rgba(138, 5, 190, 0.08);
  }
  /* popular badge styles defined below in cover section */
  .menu-item-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
    line-height: 1.5;
    font-style: italic;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .menu-item.expanded .menu-item-desc {
    -webkit-line-clamp: unset;
  }
  .menu-item-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 6px;
  }
  .menu-item-price {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-item-dietary {
    font-size: 14px;
    letter-spacing: 2px;
  }

  /* Item Image */
  .menu-item-img-wrap {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .menu-item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Expanded item photos */
  .menu-item-photos {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .menu-item-photo {
    width: 120px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  .menu-item-photo img {
    width: 100%;
    height: 90px;
    object-fit: cover;
  }
  .menu-item-photo-cap {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: #fff;
    font-size: 10px;
    padding: 4px 6px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Empty states */
  .menu-empty {
    padding: 60px 24px;
    text-align: center;
  }
  .menu-empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  .menu-empty h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-empty > p {
    font-size: 15px;
    color: #666;
    margin: 0 0 32px;
  }
  .menu-empty-cta {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    text-align: left;
  }
  .menu-empty-cta h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-empty-cta p {
    font-size: 14px;
    color: #666;
    margin: 0 0 16px;
    line-height: 1.5;
  }
  .menu-claim-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 10px;
    background: #8A05BE;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: opacity 0.2s;
  }
  .menu-claim-btn:hover {
    opacity: 0.9;
  }

  .menu-empty-period {
    text-align: center;
    padding: 40px 20px;
    color: #999;
    font-style: italic;
  }

  /* Footer */
  .menu-footer {
    padding: 24px 20px 40px;
    text-align: center;
    border-top: 1px solid #eee;
    margin-top: 20px;
  }
  .menu-footer p {
    font-size: 12px;
    color: #999;
    margin: 0 0 8px;
    font-style: italic;
  }
  .menu-powered {
    font-size: 12px;
    color: #bbb;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-powered strong {
    color: #8A05BE;
    font-weight: 700;
  }

  /* ===== NEW VISUAL COVER PAGE ===== */
  .menu-cover-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #000;
  }
  .menu-hero {
    position: relative;
    height: 56vh;
    min-height: 320px;
    overflow: hidden;
  }
  .menu-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .menu-hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.9) 100%);
  }
  .menu-hero-text {
    position: absolute;
    bottom: 32px;
    left: 24px;
    right: 24px;
    z-index: 2;
  }
  .menu-hero-name {
    margin: 0;
    font-size: 36px;
    font-weight: 800;
    color: #fff;
    font-family: 'Georgia', serif;
    letter-spacing: -1px;
    line-height: 1.1;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  .menu-hero-tagline {
    margin: 8px 0 0;
    font-size: 16px;
    color: rgba(255,255,255,0.8);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 400;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .menu-cover-cta-wrap {
    padding: 24px 24px 20px;
    background: #000;
  }
  .menu-cover-cta {
    display: block;
    width: 100%;
    padding: 18px 32px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #8A05BE 0%, #a855f7 100%);
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 8px 32px rgba(138, 5, 190, 0.4);
    letter-spacing: -0.3px;
  }
  .menu-cover-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(138, 5, 190, 0.5);
  }
  .menu-cover-cta:active {
    transform: translateY(0);
  }
  .menu-promo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 0 24px 32px;
    background: #000;
  }
  .menu-tile {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .menu-tile:hover { transform: scale(1.02); }
  .menu-tile-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .menu-tile-img-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  .menu-tile-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
  }
  .menu-tile-bg-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%);
    font-size: 48px;
    opacity: 0.3;
  }
  .menu-tile-content {
    position: relative;
    z-index: 2;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .menu-tile-content.overlay-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .menu-tile-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(255,255,255,0.7);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-tile-headline {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-tile-sub {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-tile-price {
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .tile-happy-hour {
    background: linear-gradient(135deg, #92400e 0%, #78350f 100%);
  }
  .tile-happy-hour .menu-tile-label { color: #fbbf24; }
  .tile-promo {
    background: linear-gradient(135deg, #9d174d 0%, #be185d 50%, #ec4899 100%);
  }
  .tile-promo .menu-tile-label { color: #fce7f3; }
  .tile-seasonal {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%);
  }
  .tile-seasonal .menu-tile-label { color: #a7f3d0; }
  .menu-cover-footer {
    padding: 16px 24px 32px;
    text-align: center;
    background: #000;
  }

  /* ===== ALLERGEN FILTER ROW ===== */
  .menu-allergen-filters {
    display: flex;
    gap: 8px;
    padding: 10px 20px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    background: #fff;
    border-bottom: 1px solid #eee;
  }
  .menu-allergen-filters::-webkit-scrollbar { display: none; }
  .menu-allergen-pill {
    padding: 6px 14px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    flex-shrink: 0;
  }
  .menu-allergen-pill.active {
    background: #059669;
    border-color: #059669;
    color: #fff;
    font-weight: 600;
  }
  .menu-item.filtered-out {
    opacity: 0.3;
    position: relative;
  }
  .menu-item-allergen-warn {
    position: absolute;
    top: 14px;
    right: 8px;
    font-size: 14px;
    z-index: 2;
  }
  .menu-item-calories {
    font-size: 13px;
    color: #999;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-item-order-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    background: rgba(138, 5, 190, 0.1);
    color: #8A05BE;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s;
    margin-left: auto;
  }
  .menu-item-order-btn:hover {
    background: rgba(138, 5, 190, 0.2);
  }
  .menu-badge.popular {
    font-size: 12px;
    font-weight: 700;
    background: linear-gradient(135deg, #ff6b00, #ff3d00);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    animation: menu-pulse-big 1.5s ease-in-out infinite;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  @keyframes menu-pulse-big {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,0,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 0 12px 4px rgba(255,107,0,0.2); }
  }

  /* Responsive */
  @media (min-width: 768px) {
    .menu-container {
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }
    .menu-item-img-wrap {
      width: 90px;
      height: 90px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .menu-allergen-filters {
      background: #111;
      border-bottom-color: #222;
    }
    .menu-allergen-pill {
      background: #1a1a1a;
      border-color: #333;
      color: #aaa;
    }
    .menu-allergen-pill.active {
      background: #059669;
      border-color: #059669;
      color: #fff;
    }
    .menu-item-calories {
      color: #666;
    }
    .menu-item-order-btn {
      background: rgba(138, 5, 190, 0.2);
    }
    .menu-container {
      background: #0a0a0a;
    }
    .menu-header {
      background: #111;
      border-bottom-color: #222;
    }
    .menu-title {
      color: #fff;
    }
    .menu-subtitle {
      color: #888;
    }
    .menu-periods {
      background: #111;
      border-bottom-color: #222;
    }
    .menu-period-tab {
      background: #1a1a1a;
      color: #999;
    }
    .menu-period-tab.active {
      background: #8A05BE;
      color: #fff;
    }
    .menu-category-header {
      border-bottom-color: #333;
    }
    .menu-category-name {
      color: #fff;
    }
    .menu-category-desc {
      color: #888;
    }
    .menu-item {
      border-bottom-color: #1a1a1a;
    }
    .menu-item:hover {
      background: rgba(138, 5, 190, 0.05);
    }
    .menu-item-name {
      color: #fff;
    }
    .menu-item-desc {
      color: #888;
    }
    .menu-item-price {
      color: #fff;
    }
    .menu-footer {
      border-top-color: #222;
    }
    .menu-empty h2 {
      color: #fff;
    }
    .menu-empty > p {
      color: #888;
    }
    .menu-empty-cta {
      background: #111;
    }
    .menu-empty-cta h3 {
      color: #fff;
    }
    .menu-empty-cta p {
      color: #888;
    }
  }
`;

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
