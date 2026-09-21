import { menuAppearance, readDemoMenuAppearance } from '../../../lib/menuAppearance';
import { isDemoRestaurant, demoMenu, demoCategories, demoItems, readDemoCategories, recordDemoEvent, DEMO_HOME, DEMO_ORDER, DEMO_ORDER_KEY, DEMO_GUIDE } from '../../../lib/demoRestaurant';
import DemoBanner from '../../../components/demo/DemoBanner';
/**
 * Menu Gallery Page - Full-Screen Image-First Experience
 * Path: pages/place/[id]/menu-gallery.tsx
 * URL: tavvy.com/place/[uuid]/menu-gallery
 *
 * Features:
 * - Full-screen horizontal scroll (Instagram Stories style)
 * - Big food images on black background
 * - Scroll-snap for one-card-at-a-time swiping
 * - Category filter pills, meal period toggle
 * - Dot indicators for position
 * - Dark, minimal, premium feel
 */

import { dietaryMatch } from '../../../lib/placePresentation';
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
// MenuLanguageToggle removed — cleaner 2-row header
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
  category_id: string;
  category_name?: string;
  meal_period?: string | null;
  calories: number | null; // TODO: add `calories integer` column to menu_items table
  order_url: string | null; // TODO: add `order_url text` column to menu_items table
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  image_url: string | null;
  meal_period: string | null;
}

interface Menu {
  id: string;
  place_id: string;
  name: string;
  style: string | null;
  photo_gallery_enabled?: boolean;
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

type MealPeriod = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'all_day';

type AllergenFilter = 'nut_free' | 'gluten_free' | 'dairy_free' | 'vegan' | 'vegetarian';

const ALLERGEN_FILTERS: { key: AllergenFilter; label: string; icon: string }[] = [
  { key: 'nut_free', label: 'Nut-Free', icon: '🌰' },
  { key: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { key: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { key: 'vegan', label: 'Vegan', icon: '🌱' },
  { key: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
];

const DIETARY_LABELS: Record<string, { icon: string; label: string }> = {
  vegan: { icon: '\u{1F331}', label: 'Vegan' },
  vegetarian: { icon: '\u{1F331}', label: 'Veggie' },
  'gluten-free': { icon: '\u{1F33E}', label: 'GF' },
  gluten_free: { icon: '\u{1F33E}', label: 'GF' },
  gf: { icon: '\u{1F33E}', label: 'GF' },
  dairy_free: { icon: '\u{1F95B}', label: 'DF' },
  nut_free: { icon: '\u{1F330}', label: 'NF' },
  spicy: { icon: '🌶️', label: 'Mild' },
  'spicy-2': { icon: '🌶️🌶️', label: 'Spicy' },
  'spicy-3': { icon: '🌶️🌶️🌶️', label: 'Hot' },
};

export default function MenuGalleryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const isDemo = isDemoRestaurant(id);
  const placeHref = isDemo ? DEMO_HOME : `/app/place/${id}`;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [placeName, setPlaceName] = useState<string>('');
  const [placeSlug, setPlaceSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [noMenu, setNoMenu] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadVersion = useRef(0);
  const [chefDish, setChefDish] = useState<FeaturedDish | null>(null);
  const [dayDish, setDayDish] = useState<FeaturedDish | null>(null);

  // Filters
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [showOtherDishes,setShowOtherDishes]=useState(false);
  const [activeFilters, setActiveFilters] = useState<AllergenFilter[]>([]);

  // Scroll position
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadMenu(id as string);
    }
  }, [id]);

  // Track menu view
  useEffect(() => {
    if (id && !loading && !noMenu && !loadError && menu) {
      if (isDemo) recordDemoEvent('menuViews'); else trackMenuView(id as string);
    }
  }, [id, loading, noMenu, loadError, menu]);

  const loadMenu = async (placeId: string) => {
    const version = ++loadVersion.current;
    setLoading(true); setLoadError(null); setNoMenu(false);
    setMenu(null); setCategories([]); setAllItems([]); setChefDish(null); setDayDish(null); setPlaceName(''); setPlaceSlug('');
    setActiveCategory('all'); setActivePeriod('all'); setActiveIndex(0);
    if (isDemoRestaurant(placeId)) {
      const demoCategories = readDemoCategories();
      const demoItems = demoCategories.flatMap(c => c.items.map(i => ({ ...i, category_id: c.id, category_name: c.name, meal_period: c.meal_period })));
      setPlaceName('Trattoria Tavvy'); setPlaceSlug('demo-trattoria');
      setMenu({ ...demoMenu, ...readDemoMenuAppearance() }); setCategories(demoCategories); setAllItems(demoItems);
      setChefDish(demoItems.find(i => i.id === demoMenu.chef_recommendation_id) || null);
      setDayDish(demoItems.find(i => i.id === demoMenu.dish_of_day_id) || null);
      setLoading(false); return;
    }
    try {
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .select('name, slug')
        .eq('id', placeId)
        .maybeSingle();
      if (version !== loadVersion.current) return;
      if (placeError) throw placeError;

      if (placeData) {
        setPlaceName(placeData.name || '');
        setPlaceSlug(placeData.slug || '');
      }

      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .maybeSingle();
      if (version !== loadVersion.current) return;
      if (menuError) throw menuError;

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
          const { data: featuredData, error: featuredError } = await supabase
            .from('menu_items')
            .select('id, name, price, price_label, image_url')
            .in('id', featuredIds)
            .eq('is_available', true);
      if (version !== loadVersion.current) return;
      if (featuredError) throw featuredError;
          if (featuredData) {
            featuredData.forEach((dish: any) => {
              if (dish.id === menuData.chef_recommendation_id) setChefDish(dish);
              if (dish.id === menuData.dish_of_day_id) setDayDish(dish);
            });
          }
        }
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuData.id)
        .order('sort_order', { ascending: true });
      if (version !== loadVersion.current) return;
      if (categoriesError) throw categoriesError;

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);

        const categoryIds = categoriesData.map((c: any) => c.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoryIds)
          .eq('is_available', true)
          .order('sort_order', { ascending: true });
      if (version !== loadVersion.current) return;
      if (itemsError) throw itemsError;

        if (itemsData) {
          // Attach category name and meal_period to each item
          const catMap: Record<string, MenuCategory> = {};
          categoriesData.forEach((c: any) => { catMap[c.id] = c; });

          const enrichedItems: MenuItem[] = itemsData.map((item: any) => ({
            ...item,
            category_name: catMap[item.category_id]?.name || '',
            meal_period: catMap[item.category_id]?.meal_period || null,
          }));

          setAllItems(enrichedItems);
        }
      }
    } catch (error) {
      console.error('[MenuGallery] Error loading menu:', error);
      if (version === loadVersion.current) setLoadError('We could not load this menu. Please try again.');
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  };

  const itemMatchesFilters = (item:MenuItem) => dietaryMatch(item.dietary_tags,activeFilters)==='match';

  const toggleFilter = (filter: AllergenFilter) => {
    setShowOtherDishes(false);
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Filtered items
  const periodItems = allItems.filter(item => {
    // Meal period filter
    if (activePeriod !== 'all') {
      if (item.meal_period !== activePeriod && item.meal_period !== 'all_day' && item.meal_period !== null) {
        return false;
      }
    }
    // Category filter
    if (activeCategory !== 'all') {
      if (item.category_id !== activeCategory) return false;
    }
    return true;
  });

  const matchingCount=periodItems.filter(itemMatchesFilters).length;
  const filteredItems=periodItems.filter(item=>showOtherDishes||itemMatchesFilters(item));
  useEffect(()=>{setActiveIndex(0);scrollRef.current?.scrollTo({left:0});},[activeCategory,activePeriod,activeFilters,showOtherDishes]);
  // Available periods — fixed order: Breakfast, Lunch, Dinner, All Day
  const availablePeriods: MealPeriod[] = ['all'];
  const periodsInData = new Set(categories.map(c => c.meal_period).filter(Boolean));
  if (periodsInData.has('breakfast')) availablePeriods.push('breakfast');
  if (periodsInData.has('lunch')) availablePeriods.push('lunch');
  if (periodsInData.has('dinner')) availablePeriods.push('dinner');
  if (periodsInData.has('all_day')) availablePeriods.push('all_day');

  const PERIOD_LABELS: Record<MealPeriod, string> = {
    all: 'All',
    dinner: 'Dinner',
    lunch: 'Lunch',
    breakfast: 'Breakfast',
    all_day: 'All Day',
  };

  // Handle scroll to track active index + per-item view analytics
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.clientWidth;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(index);

    // Track item view when card snaps into view
    const itemIndex = index - coverOffset;
    if (itemIndex >= 0 && itemIndex < filteredItems.length) {
      if (!isDemo) trackItemView(filteredItems[itemIndex].id);
    }
  };

  // Reset index when filters change
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activePeriod, activeCategory]);

  const formatPrice = (price: number | null, priceLabel: string | null): string => {
    if (priceLabel) return priceLabel;
    if (price === null || price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  // Cover card offset (1 if cover is shown, 0 otherwise)
  const coverOffset = menu?.show_cover ? 1 : 0;

  // Auto-scroll to dish from ?dish= query param
  useEffect(() => {
    if (!router.isReady || loading || filteredItems.length === 0) return;
    const dishId = router.query.dish as string;
    if (!dishId || !scrollRef.current) return;
    const index = filteredItems.findIndex(item => item.id === dishId);
    if (index >= 0) {
      const actualIndex = index + coverOffset;
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = cardWidth * actualIndex;
      setActiveIndex(actualIndex);
    }
  }, [router.isReady, loading, filteredItems.length]);

  // Share a dish
  const handleShareDish = async (item: MenuItem) => {
    if (!isDemo) trackMenuShare(id as string);
    if (!isDemo) trackItemShare(item.id);
    const shareUrl = `https://tavvy.com/place/${id}/menu-gallery?dish=${item.id}`;
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

  // Loading
  useEffect(() => {
    if (menu && !menuAppearance(menu).galleryEnabled) void router.replace(`/place/${id}/menu${typeof router.query.dish === 'string' ? `?dish=${encodeURIComponent(router.query.dish)}` : ''}`);
  }, [menu, id]);

  if (loading || (menu && !menuAppearance(menu).galleryEnabled)) {
    return (
      <>
        <style jsx global>{galleryStyles}</style>
        <div className="gallery-loading">
          <div className="gallery-spinner" />
        </div>
      </>
    );
  }

  if (loadError) {
    return <><style jsx global>{galleryStyles}</style><div className="gallery-shell">{isDemo && <DemoBanner compact />}<div className="gallery-empty" role="alert"><p>{loadError}</p><button className="gallery-back-link" onClick={() => loadMenu(id as string)}>Try again</button><Link href={placeHref}>Back to restaurant</Link></div></div></>;
  }

  // No menu
  if (noMenu) {
    return (
      <>
        <style jsx global>{galleryStyles}</style>
        <Head>{isDemo && <meta name="robots" content="noindex,nofollow" />}
          <title>{placeName ? `${placeName} Menu` : 'Menu'} | Tavvy</title>
        </Head>
        <div className="gallery-shell">{isDemo && <DemoBanner compact />}
          <div className="gallery-empty">
            <p>No menu available yet.</p>
            <Link href={placeHref} className="gallery-back-link">Back to restaurant</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>{isDemo && <meta name="robots" content="noindex,nofollow" />}
        <title>{placeName ? `${placeName} Menu` : 'Menu Gallery'} | Tavvy</title>
        <meta name="description" content={`Browse the menu at ${placeName} in a beautiful gallery view.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <style jsx global>{galleryStyles}</style>

      <div className="gallery-shell">{isDemo && <DemoBanner compact />}
        {/* ROW 1: Navigation */}
        <div className="gallery-nav">
          <Link href={placeHref} className="gallery-nav-title">← {placeName||'Back to restaurant'}</Link>
          <Link href={`/place/${id}/menu`} className="gallery-nav-classic">List</Link><span className="gallery-nav-classic" aria-current="page">Photos</span>
        </div>

        {/* ROW 2: Meal periods + filter icon */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {availablePeriods.length > 2 && (
            <div className="gallery-periods" style={{ flex: 1 }}>
              {availablePeriods.map(period => (
                <button
                  key={period}
                  className={`gallery-period-btn ${activePeriod === period ? 'active' : ''}`}
                  onClick={() => setActivePeriod(period)}
                >
                  {PERIOD_LABELS[period]}
                </button>
              ))}
            </div>
          )}
          {/* Filter icon — toggles category panel */}
          <button
            aria-label="Filter menu"
            aria-expanded={showCategoryPanel}
            onClick={() => setShowCategoryPanel(!showCategoryPanel)}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: activeCategory !== 'all' ? '2px solid #8A05BE' : '1px solid rgba(255,255,255,0.2)',
              background: activeCategory !== 'all' ? 'rgba(138,5,190,0.2)' : 'rgba(255,255,255,0.06)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeCategory !== 'all' ? '#8A05BE' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {activeCategory !== 'all' && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 8, height: 8,
                borderRadius: '50%', background: '#8A05BE',
              }} />
            )}
          </button>
        </div>

        {/* Filter panel — categories + allergens, hidden by default */}
        {showCategoryPanel && (
          <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto' }}>
              <button
                className={`gallery-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('all'); setShowCategoryPanel(false); }}
              >
                All
              </button>
              {categories
                .filter(cat => {
                  if (activePeriod === 'all') return true;
                  return cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period;
                })
                .map(cat => (
                  <button
                    key={cat.id}
                    className={`gallery-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => { setActiveCategory(cat.id); setShowCategoryPanel(false); }}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '4px 12px 8px', overflowX: 'auto' }}>
              {ALLERGEN_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`gallery-allergen-pill ${activeFilters.includes(f.key) ? 'active' : ''}`}
                  aria-pressed={activeFilters.includes(f.key)} onClick={() => toggleFilter(f.key)}
                >
                  {activeFilters.includes(f.key) ? '✓ ' : `${f.icon} `}{f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeFilters.length>0&&<div className="gallery-dietary-result" role="status"><strong>{matchingCount} dishes match</strong><button onClick={()=>{setActiveFilters([]);setShowOtherDishes(false)}}>Clear</button><button aria-pressed={showOtherDishes} onClick={()=>setShowOtherDishes(!showOtherDishes)}>{showOtherDishes?'Matches only':'Other dishes'}</button><p>Missing dietary tags mean unknown. Ask the restaurant about allergies.</p></div>}
        {/* Gallery Cards - Horizontal Scroll */}
        {filteredItems.length > 0 ? (
          <>
            <div
              className="gallery-scroll"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {/* Cover Card — Full-screen image background */}
              {menu?.show_cover && (
                <div className="gallery-card gallery-cover-card" tabIndex={0} aria-label="Menu cover">
                  <div className="gallery-card-image">
                    {menu.cover_image_url ? (
                      <img src={menu.cover_image_url} alt={placeName} className="gallery-cover-hero-img" />
                    ) : (
                      <div className="gallery-cover-bg" />
                    )}
                    <div className="gallery-card-gradient" />
                    <div className="gallery-cover-content">
                      <h1 className="gallery-cover-name">{placeName}</h1>
                      {menu.tagline && <p className="gallery-cover-tagline">{menu.tagline}</p>}

                      {/* Food thumbnails teaser */}
                      {filteredItems.length > 0 && (
                        <div className="gallery-cover-thumbs">
                          {filteredItems.slice(0, 4).map(item => (
                            <div key={item.id} className="gallery-cover-thumb">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="gallery-thumb-placeholder" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="gallery-cover-pills">
                        {menu.happy_hour_enabled && menu.happy_hour_times && (
                          <span className="gallery-cover-pill pill-happy">🍸 Happy Hour {menu.happy_hour_times}</span>
                        )}
                        {chefDish && (
                          <span className="gallery-cover-pill pill-chef">👨‍🍳 {chefDish.name}</span>
                        )}
                        {dayDish && (
                          <span className="gallery-cover-pill pill-day">⭐ {dayDish.name}</span>
                        )}
                        {menu.promo_banner_enabled && menu.promo_banner_text && (
                          <span className="gallery-cover-pill pill-promo">🎉 {menu.promo_banner_text}</span>
                        )}
                        {menu.seasonal_special_enabled && menu.seasonal_special_text && (
                          <span className="gallery-cover-pill pill-seasonal">🌿 {menu.seasonal_special_text}</span>
                        )}
                      </div>

                      <p className="gallery-cover-swipe">Swipe to start →</p>
                    </div>
                  </div>
                </div>
              )}

              {filteredItems.map((item, idx) => {
                const priceStr = formatPrice(item.price, item.price_label);
                const imageUrl = item.image_url || menu?.cover_image_url || null;
                const matchesFilter = itemMatchesFilters(item);

                return (
                  <div key={item.id} className={`gallery-card ${!matchesFilter ? 'gallery-card-filtered' : ''}`} tabIndex={0} aria-label={item.name}>
                    {/* Dish image, with the restaurant cover as fallback */}
                    <div className="gallery-card-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.name} />
                      ) : (
                        <div className="gallery-card-placeholder">
                          <span>{item.category_name}</span>
                        </div>
                      )}
                      {/* Gradient overlay for text readability */}
                      <div className="gallery-card-gradient" />

                      {/* Allergen warning overlay */}
                      {!matchesFilter && (
                        <div className="gallery-card-allergen-overlay">
                          <span>{dietaryMatch(item.dietary_tags,activeFilters)==='unknown'?'Dietary information not confirmed for these filters':'Other dish — does not match selected filters'}</span>
                        </div>
                      )}

                      {/* Price badge + calories + share (top right) */}
                      <div className="gallery-card-top-right">
                        {priceStr && (
                          <div className="gallery-card-price">
                            {priceStr}{item.calories ? ` · ${item.calories} cal` : ''}
                          </div>
                        )}
                        {item.order_url && (
                          <a
                            href={item.order_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gallery-card-order"
                            aria-label={`Order ${item.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            🛒
                          </a>
                        )}
                        <button
                          className="gallery-card-share"
                          onClick={(e) => { e.stopPropagation(); handleShareDish(item); }}
                          aria-label={`Share ${item.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                        </button>
                      </div>

                      {/* Badges (top left) — enhanced popular */}
                      <div className="gallery-card-badges-top">
                        {item.is_popular && <span className="gallery-badge fire gallery-badge-pulse">🔥 Popular</span>}
                        {item.is_new && <span className="gallery-badge new">{'\u2728'} New</span>}
                      </div>

                      {/* Full text flows below the image and actions. */}
                      <div className="gallery-card-text-block">
                        <h2 className="gallery-card-name">{item.name}</h2>
                        <p className="gallery-card-desc">
                          {item.description || '\u00A0'}
                        </p>
                        <div className="gallery-card-dietary">
                          {item.dietary_tags && item.dietary_tags.length > 0 ? (
                            item.dietary_tags.map(tag => {
                              const info = DIETARY_LABELS[tag.toLowerCase()] || { icon: '', label: tag.replace(/[_-]/g, ' ') };
                              return (
                                <span key={tag} className="gallery-dietary-pill">
                                  {info.icon} {info.label}
                                </span>
                              );
                            })
                          ) : (
                            null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot indicators */}
            {(filteredItems.length + coverOffset) > 1 && (filteredItems.length + coverOffset) <= 20 && (
              <div className="gallery-dots">
                {Array.from({ length: filteredItems.length + coverOffset }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`gallery-dot ${idx === activeIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Counter for large menus */}
            {(filteredItems.length + coverOffset) > 20 && (
              <div className="gallery-counter">
                {activeIndex + 1} / {filteredItems.length + coverOffset}
              </div>
            )}
          </>
        ) : (
          <div className="gallery-empty-items">
            <p>{activeFilters.length?'No dishes with confirmed matching tags. Clear filters or show other dishes.':'No dishes in this category.'}</p>
          </div>
        )}

        {/* Powered by footer with logo */}
        <div className="gallery-footer">
          <button className="gallery-back-link" disabled={activeIndex === 0} onClick={() => scrollRef.current?.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' })}>Previous</button>
          <span aria-live="polite">{filteredItems.length?`${activeIndex + 1} / ${filteredItems.length + coverOffset}`:'0 dishes'}</span>
          <button className="gallery-back-link" disabled={activeIndex >= filteredItems.length + coverOffset - 1} onClick={() => scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' })}>Next</button>
        </div>
      </div>
    </>
  );
}

// ===== STYLES =====
const galleryStyles = `
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
  }

  .gallery-shell {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    color: #fff;
    overflow: hidden;
  }

  /* Loading */
  .gallery-loading {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gallery-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #222;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: gspin 0.7s linear infinite;
  }
  @keyframes gspin { to { transform: rotate(360deg); } }

  /* Empty state */
  .gallery-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #888;
  }
  .gallery-back-link {
    background: none;
    border: 1px solid #333;
    color: #fff;
    padding: 10px 24px;
    border-radius: 24px;
    font-size: 14px;
    cursor: pointer;
  }

  /* Navigation bar */
  .gallery-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap; justify-content: center; gap: 8px;
    padding: 12px 16px;
    padding-top: max(12px, env(safe-area-inset-top));
    z-index: 20;
    position: relative;
    flex-shrink: 0;
  }
  .gallery-nav-back {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
  }
  .gallery-nav-title {
    flex: 1 0 100%; min-width: 0; text-align: center; font-size: 1rem; font-weight: 600; padding: 0 8px; color: #fff; text-decoration: none; overflow-wrap: anywhere;
  }
  .gallery-nav-title:hover {
    opacity: 0.8;
  }
  .gallery-nav-classic {
    font-size: 12px;
    color: #8A05BE;
    text-decoration: none;
    font-weight: 500;
    padding: 6px 12px;
    border: 1px solid rgba(138, 5, 190, 0.4);
    border-radius: 16px;
    white-space: nowrap;
  }

  /* Filters */
  .gallery-filters {
    flex-shrink: 0;
    padding: 0 16px 10px;
    z-index: 10;
  }
  .gallery-periods {
    display: flex;
    gap: 6px;
    margin-bottom: 8px; min-width: 0; overflow-x: auto;
  }
  .gallery-period-btn {
    padding: 6px 14px;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    background: #1a1a1a;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .gallery-period-btn.active {
    background: #8A05BE;
    color: #fff;
  }
  .gallery-categories {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2px;
  }
  .gallery-categories::-webkit-scrollbar { display: none; }
  .gallery-cat-pill {
    padding: 6px 14px;
    border: 1px solid #333;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
    background: transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .gallery-cat-pill.active {
    background: #8A05BE;
    border-color: #8A05BE;
    color: #fff;
  }

  /* Gallery Scroll Container — fills ALL available space */
  .gallery-scroll {
    flex: 1;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    min-height: 0;
  }
  .gallery-scroll::-webkit-scrollbar { display: none; }

  /* Horizontal pages; each card scrolls vertically for its complete content. */
  .gallery-card {
    flex: 0 0 100%; width: 100%; min-width: 0; height: 100%;
    scroll-snap-align: start; position: relative; overflow-y: auto; overflow-x: hidden;
    overscroll-behavior-y: contain; background: #101014;
  }

  /* Image first, followed by normal-flow details inside each scrollable card. */
  .gallery-card-image {
    position: relative; min-height: 100%;
  }
  .gallery-card-image img {
    display: block; width: 100%; height: clamp(180px, 42dvh, 440px); object-fit: cover;
  }
  .gallery-card-placeholder {
    height: clamp(180px, 42dvh, 440px); display: grid; place-items: center; padding: 24px; background: #202026; color: #bbb; overflow-wrap: anywhere;
  }
  /* Gradient only at the very bottom for text readability */
  .gallery-card-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.2) 0%,
      transparent 15%,
      transparent 60%,
      rgba(0,0,0,0.85) 90%,
      rgba(0,0,0,0.95) 100%
    );
    pointer-events: none;
  }

  /* Price and actions wrap below the image. */
  .gallery-card-top-right {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 20px 0;
  }
  .gallery-card-price {
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
  }
  .gallery-card-share {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .gallery-card-share:hover {
    background: rgba(138, 5, 190, 0.7);
  }

  /* Badges flow above the dish details. */
  .gallery-card-badges-top {
    display: flex; flex-wrap: wrap; gap: 6px; padding: 12px 20px 0;
  }
  .gallery-badge {
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 5px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
  }
  .gallery-badge.fire {
    background: rgba(255, 80, 0, 0.7);
  }
  .gallery-badge.new {
    background: rgba(138, 5, 190, 0.7);
  }

  /* Full dish text stays readable without truncation. */
  .gallery-card-text-block {
    position: relative; display: flex; flex-direction: column; gap: 12px; padding: 20px; overflow-wrap: anywhere;
  }
  .gallery-card-name {
    margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1.3; overflow-wrap: anywhere;
  }
  .gallery-card-desc {
    margin: 0; font-size: 1rem; color: #d5d5dd; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .gallery-card-dietary {
    display: flex; gap: 6px; flex-wrap: wrap; align-items: flex-start;
  }
  .gallery-dietary-pill {
    padding: 2px 7px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.75);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.08);
    white-space: nowrap;
  }

  /* Pagination indicators stay outside the scrollable cards. */
  .gallery-dots {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 8px; flex-shrink: 0;
  }
  .gallery-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transition: all 0.2s;
  }
  .gallery-dot.active {
    background: #fff;
    transform: scale(1.3);
  }

  /* Counter for larger menus. */
  .gallery-counter {
    text-align: center; padding: 8px; font-size: .875rem; flex-shrink: 0;
  }

  /* Empty items */
  .gallery-empty-items {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    font-size: 15px;
  }

  /* Footer */
  .gallery-footer {
    flex-shrink: 0;
    padding: 10px 16px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    text-align: center;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gallery-footer-logo {
    height: 18px;
    width: auto;
    opacity: 0.5;
  }

  /* Cover Card */
  .gallery-cover-card .gallery-card-image {
    background: #000;
  }
  .gallery-cover-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center top, #1a0a2e 0%, #000 70%);
  }
  .gallery-cover-content {
    position: relative; display: flex; flex-direction: column; align-items: center; padding: 28px 20px; text-align: center; z-index: 2; min-height: 100%; overflow-wrap: anywhere;
  }
  .gallery-cover-name {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }
  .gallery-cover-tagline {
    margin: 8px 0 0;
    font-size: 15px;
    color: rgba(255,255,255,0.6);
    font-weight: 400;
  }
  .gallery-cover-welcome {
    margin: 20px 0 0;
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    font-style: italic;
    line-height: 1.6;
    max-width: 300px;
  }
  .gallery-cover-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 28px;
    max-width: 320px;
  }
  .gallery-cover-pill {
    padding: 8px 12px; border-radius: 20px; font-size: .875rem; line-height: 1.5; max-width: 100%; white-space: normal; overflow-wrap: anywhere; background: #17171c;
  }
  .pill-happy {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;
  }
  .pill-chef {
    background: rgba(138, 5, 190, 0.15);
    border: 1px solid rgba(138, 5, 190, 0.4);
    color: #c4b5fd;
  }
  .pill-day {
    background: rgba(20, 184, 166, 0.15);
    border: 1px solid rgba(20, 184, 166, 0.4);
    color: #5eead4;
  }
  .pill-promo {
    background: rgba(244, 114, 182, 0.15);
    border: 1px solid rgba(244, 114, 182, 0.4);
    color: #f9a8d4;
  }
  .pill-seasonal {
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.4);
    color: #86efac;
  }
  .gallery-cover-swipe {
    margin: 24px 0 0; font-size: 1rem; color: #ddd;
  }
  @keyframes gallery-swipe-pulse {
    0%, 100% { opacity: 0.35; transform: translateX(0); }
    50% { opacity: 0.7; transform: translateX(4px); }
  }

  /* Cover hero image */
  .gallery-cover-hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Cover food thumbnails teaser */
  .gallery-cover-thumbs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 20px;
    width: 160px;
  }
  .gallery-cover-thumb {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(255,255,255,0.2);
  }
  .gallery-cover-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .gallery-thumb-placeholder {
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.05);
  }

  /* Allergen filter row in gallery */
  .gallery-allergens {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin-top: 8px;
    padding-bottom: 2px;
  }
  .gallery-allergens::-webkit-scrollbar { display: none; }
  .gallery-allergen-pill {
    padding: 5px 12px;
    border: 1px solid #333;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 500;
    color: #aaa;
    background: transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .gallery-allergen-pill.active {
    background: #059669;
    border-color: #059669;
    color: #fff;
    font-weight: 600;
  }

  /* Filtered card */
  .gallery-card-filtered {
    opacity: 0.3;
  }
  .gallery-card-allergen-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    padding: 10px 16px;
    border-radius: 12px;
    z-index: 5;
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    text-align: center;
  }

  /* Order button in gallery */
  .gallery-card-order {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(138, 5, 190, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
    transition: background 0.2s;
  }
  .gallery-card-order:hover {
    background: rgba(138, 5, 190, 0.9);
  }

  /* Enhanced popular badge pulse */
  .gallery-badge-pulse {
    animation: gallery-fire-pulse 1.5s ease-in-out infinite;
  }
  @keyframes gallery-fire-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,80,0,0.4); }
    50% { transform: scale(1.1); box-shadow: 0 0 12px 4px rgba(255,80,0,0.3); }
  }

  .gallery-card:not(.gallery-cover-card) .gallery-card-gradient { display: none; }
  .gallery-cover-thumbs .gallery-cover-thumb img { height: 100%; width: 100%; }
  .gallery-cover-card .gallery-cover-hero-img { position: absolute; height: 100%; opacity: .3; }
  .gallery-cover-card .gallery-card-gradient { background: rgba(0,0,0,.45); }
  .gallery-card-price, .gallery-dietary-pill, .gallery-badge { max-width: 100%; white-space: normal; overflow-wrap: anywhere; }
  .gallery-card-share, .gallery-card-order { flex-shrink: 0; width: 44px; height: 44px; }
  .gallery-card-allergen-overlay { position: static; transform: none; margin: 12px 20px 0; }
  .gallery-card-filtered { opacity: 1; }
  .gallery-footer { flex-wrap: wrap; gap: 10px; }
  .gallery-footer a { color: #ddd; font-size: .875rem; }
  .gallery-footer button { padding: 6px 10px; }
  .gallery-footer button:disabled { opacity: .4; cursor: default; }
  .gallery-cover-name { font-size: 2rem; }
  .gallery-cover-pills { width: 100%; }
  .gallery-scroll { overflow-y: hidden; }
  .gallery-nav-classic { color: #d8b4fe; }
  .gallery-card:focus-visible, .gallery-shell a:focus-visible, .gallery-shell button:focus-visible { outline: 2px solid #d8b4fe; outline-offset: -2px; }
  @media (max-height: 500px) { .gallery-shell { overflow-y: auto; } .gallery-scroll { flex: 0 0 65dvh; } }

  /* Smooth momentum scrolling feel */
  @media (hover: hover) {
    .gallery-scroll {
      scroll-behavior: smooth;
    }
  }

  html,body,.gallery-shell,.gallery-loading{background:var(--background);color:var(--text)}
  .gallery-nav,.gallery-periods,.gallery-footer,.gallery-card-info,.gallery-empty{background:var(--background);color:var(--text)}
  .gallery-nav-title,.gallery-nav-back,.gallery-card-name,.gallery-card-title,.gallery-empty h2{color:var(--text)}
  .gallery-nav-classic,.gallery-footer a,.gallery-back-link{color:var(--link)}
  .gallery-card-desc,.gallery-empty p,.gallery-card-category,.gallery-empty-sub{color:var(--text-secondary)}
  .gallery-cat-pill,.gallery-allergen-pill,.gallery-period-btn{background:var(--surface);color:var(--text-secondary);border-color:var(--border)}
  .gallery-cat-pill.active,.gallery-period-btn.active{background:#74209A;color:#fff}.gallery-allergen-pill.active{background:#086B54;color:#fff}
  .gallery-dietary-result{padding:8px 12px;color:var(--text);background:var(--surface);font-size:13px;flex-shrink:0}.gallery-dietary-result button{min-height:40px;margin-left:10px;color:var(--link);background:transparent;border:0;text-decoration:underline}.gallery-dietary-result p{margin:0;color:var(--text-secondary)}
  .gallery-cover-title,.gallery-cover-subtitle,.gallery-cover-hint{color:#fff}.gallery-card-filtered{opacity:1}
  .gallery-card:not(.gallery-cover-card){background:var(--surface)}.gallery-dietary-pill{font-size:13px;color:var(--text-secondary);background:var(--background);border-color:var(--border)}.gallery-card-placeholder{color:var(--text-secondary);background:var(--surface)}.gallery-footer button{min-height:44px}.gallery-dot{background:var(--border)}.gallery-dot.active{background:var(--link)}
`;

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
