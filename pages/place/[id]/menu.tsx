/**
 * Digital Menu Page - Magazine Style
 * Path: pages/place/[id]/menu.tsx
 * URL: tavvy.com/place/[uuid]/menu
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
  const [chefDish, setChefDish] = useState<FeaturedDish | null>(null);
  const [dayDish, setDayDish] = useState<FeaturedDish | null>(null);

  useEffect(() => {
    if (id) {
      loadMenu(id as string);
    }
  }, [id]);

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
        {/* Cover Page */}
        {menu?.show_cover && (
          <div className="menu-cover-page">
            {/* Hero Image */}
            {menu.cover_image_url && (
              <div className="menu-cover">
                <img src={menu.cover_image_url} alt={`${placeName} menu`} className="menu-cover-img" />
                <div className="menu-cover-overlay" />
              </div>
            )}

            {/* Restaurant Name + Tagline */}
            <div className="menu-cover-intro">
              <h1 className="menu-cover-name">{placeName}</h1>
              {menu.tagline && <p className="menu-cover-tagline">{menu.tagline}</p>}
              {menu.welcome_message && <p className="menu-cover-welcome">{menu.welcome_message}</p>}
            </div>

            {/* Promotional Cards Row */}
            {(menu.happy_hour_enabled || chefDish || dayDish || menu.promo_banner_enabled || menu.seasonal_special_enabled) && (
              <div className="menu-cover-cards">
                {menu.happy_hour_enabled && menu.happy_hour_text && (
                  <div className="menu-promo-card card-happy-hour">
                    <div className="menu-promo-card-icon">🍸</div>
                    <div className="menu-promo-card-content">
                      <span className="menu-promo-card-label">Happy Hour</span>
                      <span className="menu-promo-card-text">{menu.happy_hour_text}</span>
                      {menu.happy_hour_times && (
                        <span className="menu-promo-card-times">{menu.happy_hour_times}</span>
                      )}
                    </div>
                  </div>
                )}

                {chefDish && (
                  <div className="menu-promo-card card-chef">
                    {chefDish.image_url && (
                      <img src={chefDish.image_url} alt={chefDish.name} className="menu-promo-card-dish-img" />
                    )}
                    <div className="menu-promo-card-content">
                      <span className="menu-promo-card-label">👨‍🍳 Chef&apos;s Pick</span>
                      <span className="menu-promo-card-text">{chefDish.name}</span>
                      {(chefDish.price || chefDish.price_label) && (
                        <span className="menu-promo-card-price">{formatPrice(chefDish.price, chefDish.price_label)}</span>
                      )}
                    </div>
                  </div>
                )}

                {dayDish && (
                  <div className="menu-promo-card card-day">
                    {dayDish.image_url && (
                      <img src={dayDish.image_url} alt={dayDish.name} className="menu-promo-card-dish-img" />
                    )}
                    <div className="menu-promo-card-content">
                      <span className="menu-promo-card-label">⭐ Dish of the Day</span>
                      <span className="menu-promo-card-text">{dayDish.name}</span>
                      {(dayDish.price || dayDish.price_label) && (
                        <span className="menu-promo-card-price">{formatPrice(dayDish.price, dayDish.price_label)}</span>
                      )}
                    </div>
                  </div>
                )}

                {menu.promo_banner_enabled && menu.promo_banner_text && (
                  <div className="menu-promo-card card-promo">
                    <div className="menu-promo-card-icon">🎉</div>
                    <div className="menu-promo-card-content">
                      <span className="menu-promo-card-label">Special Offer</span>
                      <span className="menu-promo-card-text">{menu.promo_banner_text}</span>
                    </div>
                  </div>
                )}

                {menu.seasonal_special_enabled && menu.seasonal_special_text && (
                  <div className="menu-promo-card card-seasonal">
                    <div className="menu-promo-card-icon">🌿</div>
                    <div className="menu-promo-card-content">
                      <span className="menu-promo-card-label">Seasonal Special</span>
                      <span className="menu-promo-card-text">{menu.seasonal_special_text}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cover image (fallback when show_cover is off) */}
        {!menu?.show_cover && menu?.cover_image_url && (
          <div className="menu-cover">
            <img src={menu.cover_image_url} alt={`${placeName} menu`} className="menu-cover-img" />
            <div className="menu-cover-overlay" />
          </div>
        )}

        <div className="menu-header">
          <button className="menu-back-btn" onClick={() => router.back()}>
            ← Back
          </button>
          <div className="menu-title-section">
            <h1 className="menu-title">{menu?.name || `${placeName} Menu`}</h1>
            {placeName && <Link href={`/place/${id}`}><p className="menu-subtitle" style={{ cursor: 'pointer' }}>{placeName}</p></Link>}
          </div>
          <Link href={`/place/${id}/menu-gallery`} className="menu-gallery-link">
            View Gallery Mode
          </Link>
        </div>

        {/* Meal Period Tabs */}
        {availablePeriods.length > 2 && (
          <div className="menu-periods">
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

                  return (
                    <div
                      key={item.id}
                      id={`menu-item-${item.id}`}
                      className={`menu-item ${displayImage ? 'has-image' : ''} ${isExpanded ? 'expanded' : ''} ${highlightedDish === item.id ? 'highlighted' : ''}`}
                      onClick={() => router.push(`/place/${id}/menu-gallery?dish=${item.id}`)}
                    >
                      <div className="menu-item-content">
                        <div className="menu-item-text">
                          <div className="menu-item-name-row">
                            <span className="menu-item-name">{item.name}</span>
                            {item.is_popular && <span className="menu-badge popular" title="Popular">{'\u{1F525}'}</span>}
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
                            {dietaryStr && (
                              <span className="menu-item-dietary">{dietaryStr}</span>
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
          <span className="menu-powered">Powered by <strong>Tavvy</strong></span>
        </div>
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
  .menu-badge.popular {
    animation: menu-pulse 2s ease-in-out infinite;
  }
  @keyframes menu-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
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

  /* Cover Page */
  .menu-cover-page {
    position: relative;
    overflow: hidden;
  }
  .menu-cover-page .menu-cover {
    height: 280px;
  }
  .menu-cover-page .menu-cover-overlay {
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);
  }
  .menu-cover-intro {
    padding: 28px 24px 20px;
    text-align: center;
    background: #fff;
  }
  .menu-cover-name {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    font-family: 'Georgia', serif;
    letter-spacing: -0.5px;
  }
  .menu-cover-tagline {
    margin: 6px 0 0;
    font-size: 15px;
    color: #666;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 400;
  }
  .menu-cover-welcome {
    margin: 14px auto 0;
    font-size: 14px;
    color: #555;
    font-style: italic;
    line-height: 1.6;
    max-width: 480px;
  }

  /* Promo Cards Row */
  .menu-cover-cards {
    display: flex;
    gap: 12px;
    padding: 16px 20px 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    background: #fff;
  }
  .menu-cover-cards::-webkit-scrollbar { display: none; }

  .menu-promo-card {
    min-width: 200px;
    max-width: 240px;
    flex-shrink: 0;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }
  .menu-promo-card-icon {
    font-size: 24px;
  }
  .menu-promo-card-content {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .menu-promo-card-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-promo-card-text {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-promo-card-times {
    font-size: 12px;
    opacity: 0.8;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-promo-card-price {
    font-size: 15px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .menu-promo-card-dish-img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 4px;
  }

  /* Card Variants */
  .card-happy-hour {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 1px solid #fcd34d;
  }
  .card-happy-hour .menu-promo-card-label {
    color: #92400e;
  }
  .card-happy-hour .menu-promo-card-text {
    color: #78350f;
  }
  .card-happy-hour .menu-promo-card-times {
    color: #a16207;
  }

  .card-chef {
    background: linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%);
    border: 1px solid #c4b5fd;
  }
  .card-chef .menu-promo-card-label {
    color: #6b21a8;
  }
  .card-chef .menu-promo-card-text {
    color: #4c1d95;
  }
  .card-chef .menu-promo-card-price {
    color: #7c3aed;
  }

  .card-day {
    background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
    border: 1px solid #5eead4;
  }
  .card-day .menu-promo-card-label {
    color: #115e59;
  }
  .card-day .menu-promo-card-text {
    color: #134e4a;
  }
  .card-day .menu-promo-card-price {
    color: #0d9488;
  }

  .card-promo {
    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
    border: 1px solid #f9a8d4;
  }
  .card-promo .menu-promo-card-label {
    color: #9d174d;
  }
  .card-promo .menu-promo-card-text {
    color: #831843;
  }

  .card-seasonal {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #86efac;
  }
  .card-seasonal .menu-promo-card-label {
    color: #166534;
  }
  .card-seasonal .menu-promo-card-text {
    color: #14532d;
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
    .menu-cover-intro {
      background: #0a0a0a;
    }
    .menu-cover-name {
      color: #fff;
    }
    .menu-cover-tagline {
      color: #999;
    }
    .menu-cover-welcome {
      color: #888;
    }
    .menu-cover-cards {
      background: #0a0a0a;
    }
    .card-happy-hour {
      background: linear-gradient(135deg, #1a1500 0%, #2a1f00 100%);
      border-color: #5c4a00;
    }
    .card-happy-hour .menu-promo-card-label { color: #fbbf24; }
    .card-happy-hour .menu-promo-card-text { color: #fde68a; }
    .card-happy-hour .menu-promo-card-times { color: #d97706; }
    .card-chef {
      background: linear-gradient(135deg, #1a0a2e 0%, #2d1254 100%);
      border-color: #6b21a8;
    }
    .card-chef .menu-promo-card-label { color: #c4b5fd; }
    .card-chef .menu-promo-card-text { color: #e9d5ff; }
    .card-chef .menu-promo-card-price { color: #a78bfa; }
    .card-day {
      background: linear-gradient(135deg, #022c22 0%, #064e3b 100%);
      border-color: #0d9488;
    }
    .card-day .menu-promo-card-label { color: #5eead4; }
    .card-day .menu-promo-card-text { color: #99f6e4; }
    .card-day .menu-promo-card-price { color: #2dd4bf; }
    .card-promo {
      background: linear-gradient(135deg, #2a0a1e 0%, #4a1035 100%);
      border-color: #9d174d;
    }
    .card-promo .menu-promo-card-label { color: #f9a8d4; }
    .card-promo .menu-promo-card-text { color: #fbcfe8; }
    .card-seasonal {
      background: linear-gradient(135deg, #052e16 0%, #14532d 100%);
      border-color: #16a34a;
    }
    .card-seasonal .menu-promo-card-label { color: #86efac; }
    .card-seasonal .menu-promo-card-text { color: #bbf7d0; }
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
