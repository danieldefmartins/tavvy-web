import { menuAppearance, readDemoMenuAppearance } from '../../../lib/menuAppearance';
import { isDemoRestaurant, demoMenu, demoCategories, demoItems, readDemoCategories, recordDemoEvent, DEMO_HOME, DEMO_ORDER, DEMO_ORDER_KEY, DEMO_GUIDE } from '../../../lib/demoRestaurant';
/**
 * Menu Gallery Page - Full-Screen Image-First Experience
 * Path: pages/place/[id]/menu-gallery.tsx
 * URL: tavvy.com/place/[uuid]/menu-gallery
 *
 * The whole screen is the menu: each dish is a full-bleed photo page with its details over the lower
 * part, swiped horizontally (scroll-snap). A floating bar holds back, the position and the switch to
 * the text menu; period, category and dietary filters float under it. No place details on top and
 * no arrows underneath (pointer devices get mid-height step buttons). Always dark.
 * The owner's Menu design decides whether /menu opens here or in the text list (lib/menuAppearance).
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
    return <><style jsx global>{galleryStyles}</style><div className="gallery-shell"><div className="gallery-empty" role="alert"><p>{loadError}</p><button className="gallery-back-link" onClick={() => loadMenu(id as string)}>Try again</button><Link href={placeHref}>Back to restaurant</Link></div></div></>;
  }

  // No menu
  if (noMenu) {
    return (
      <>
        <style jsx global>{galleryStyles}</style>
        <Head>{isDemo && <meta name="robots" content="noindex,nofollow" />}
          <title>{placeName ? `${placeName} Menu` : 'Menu'} | Tavvy</title>
        </Head>
        <div className="gallery-shell">
          <div className="gallery-empty">
            <p>No menu available yet.</p>
            <Link href={placeHref} className="gallery-back-link">Back to restaurant</Link>
          </div>
        </div>
      </>
    );
  }

  const total = filteredItems.length + coverOffset;
  const categoryPills = categories.filter(cat => activePeriod === 'all' || cat.meal_period === activePeriod || cat.meal_period === 'all_day' || !cat.meal_period);
  const step = (direction: 1 | -1) => scrollRef.current?.scrollBy({ left: direction * scrollRef.current.clientWidth, behavior: 'smooth' });

  return (
    <>
      <Head>{isDemo && <meta name="robots" content="noindex,nofollow" />}
        <title>{placeName ? `${placeName} Menu` : 'Menu Gallery'} | Tavvy</title>
        <meta name="description" content={`Browse the menu at ${placeName} in a beautiful gallery view.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <style jsx global>{galleryStyles}</style>

      <div className="gallery-shell">
        <div className="gallery-stage">
          {/* The menu is the whole screen: no place details on top, no arrows underneath.
              A floating bar holds back, the position and the switch to the text menu; the filters float under it. */}
          <div className="gallery-top">
            <div className="gallery-top-row">
              <Link href={placeHref} className="gallery-icon-btn" aria-label={`Back to ${placeName || 'restaurant'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
              </Link>
              <span className="gallery-position" aria-live="polite">{filteredItems.length ? `${activeIndex + 1} / ${total}` : '0 dishes'}</span>
              <Link href={`/place/${id}/menu?view=list`} className="gallery-icon-btn" aria-label="Text menu" title="Text menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </Link>
            </div>

            <div className="gallery-filter-row">
              <div className="gallery-pills" role="group" aria-label="Menu filters">
                <button type="button" className={`gallery-pill ${activePeriod === 'all' && activeCategory === 'all' ? 'active' : ''}`} aria-pressed={activePeriod === 'all' && activeCategory === 'all'} onClick={() => { setActivePeriod('all'); setActiveCategory('all'); }}>All</button>
                {availablePeriods.filter(period => period !== 'all').map(period => (
                  <button type="button" key={period} className={`gallery-pill ${activePeriod === period ? 'active' : ''}`} aria-pressed={activePeriod === period} onClick={() => setActivePeriod(activePeriod === period ? 'all' : period)}>{PERIOD_LABELS[period]}</button>
                ))}
                {categoryPills.map(cat => (
                  <button type="button" key={cat.id} className={`gallery-pill ${activeCategory === cat.id ? 'active' : ''}`} aria-pressed={activeCategory === cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}>{cat.name}</button>
                ))}
              </div>
              <button type="button" className={`gallery-icon-btn ${activeFilters.length ? 'on' : ''}`} aria-label="Dietary filters" aria-expanded={showCategoryPanel} onClick={() => setShowCategoryPanel(open => !open)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {activeFilters.length > 0 && <span className="gallery-dot-badge">{activeFilters.length}</span>}
              </button>
            </div>

            {showCategoryPanel && (
              <div className="gallery-panel">
                <div className="gallery-pills wrap">
                  {ALLERGEN_FILTERS.map(f => (
                    <button type="button" key={f.key} className={`gallery-pill diet ${activeFilters.includes(f.key) ? 'active' : ''}`} aria-pressed={activeFilters.includes(f.key)} onClick={() => toggleFilter(f.key)}>
                      {activeFilters.includes(f.key) ? '✓ ' : `${f.icon} `}{f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeFilters.length > 0 && <div className="gallery-dietary-result" role="status"><strong>{matchingCount} dishes match</strong><button type="button" onClick={() => { setActiveFilters([]); setShowOtherDishes(false); }}>Clear</button><button type="button" aria-pressed={showOtherDishes} onClick={() => setShowOtherDishes(!showOtherDishes)}>{showOtherDishes ? 'Matches only' : 'Other dishes'}</button><p>Missing dietary tags mean unknown. Ask the restaurant about allergies.</p></div>}
          </div>

          {filteredItems.length > 0 ? (
            <div className="gallery-scroll" ref={scrollRef} onScroll={handleScroll}>
              {/* Cover page */}
              {menu?.show_cover && (
                <div className="gallery-card gallery-cover-card" tabIndex={0} aria-label="Menu cover">
                  {menu.cover_image_url ? <img src={menu.cover_image_url} alt="" className="gallery-card-bg" /> : <div className="gallery-card-bg gallery-cover-bg" />}
                  <div className="gallery-card-shade" />
                  <div className="gallery-card-body">
                    <div className="gallery-cover-content">
                      <h1 className="gallery-cover-name">{placeName}</h1>
                      {menu.tagline && <p className="gallery-cover-tagline">{menu.tagline}</p>}

                      <div className="gallery-cover-thumbs">
                        {filteredItems.slice(0, 4).map(item => (
                          <div key={item.id} className="gallery-cover-thumb">
                            {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="gallery-thumb-placeholder" />}
                          </div>
                        ))}
                      </div>

                      <div className="gallery-cover-pills">
                        {menu.happy_hour_enabled && menu.happy_hour_times && <span className="gallery-cover-pill pill-happy">🍸 Happy Hour {menu.happy_hour_times}</span>}
                        {chefDish && <span className="gallery-cover-pill pill-chef">👨‍🍳 {chefDish.name}</span>}
                        {dayDish && <span className="gallery-cover-pill pill-day">⭐ {dayDish.name}</span>}
                        {menu.promo_banner_enabled && menu.promo_banner_text && <span className="gallery-cover-pill pill-promo">🎉 {menu.promo_banner_text}</span>}
                        {menu.seasonal_special_enabled && menu.seasonal_special_text && <span className="gallery-cover-pill pill-seasonal">🌿 {menu.seasonal_special_text}</span>}
                      </div>

                      <p className="gallery-cover-swipe">Swipe to start →</p>
                    </div>
                  </div>
                </div>
              )}

              {/* One full-screen page per dish: the photo fills the screen, the details sit over its lower part. */}
              {filteredItems.map(item => {
                const priceStr = formatPrice(item.price, item.price_label);
                const imageUrl = item.image_url || menu?.cover_image_url || null;
                const matchesFilter = itemMatchesFilters(item);
                return (
                  <div key={item.id} className={`gallery-card ${!matchesFilter ? 'gallery-card-filtered' : ''}`} tabIndex={0} aria-label={item.name}>
                    {imageUrl ? <img src={imageUrl} alt={item.name} className="gallery-card-bg" /> : <div className="gallery-card-bg gallery-card-placeholder"><span>{item.category_name}</span></div>}
                    <div className="gallery-card-shade" />
                    <div className="gallery-card-body">
                      <div className="gallery-card-spacer" aria-hidden="true" />
                      <div className="gallery-card-text-block">
                        {!matchesFilter && (
                          <div className="gallery-card-allergen-overlay">
                            {dietaryMatch(item.dietary_tags, activeFilters) === 'unknown' ? 'Dietary information not confirmed for these filters' : 'Other dish — does not match selected filters'}
                          </div>
                        )}
                        {(item.is_popular || item.is_new) && (
                          <div className="gallery-card-badges-top">
                            {item.is_popular && <span className="gallery-badge fire gallery-badge-pulse">🔥 Popular</span>}
                            {item.is_new && <span className="gallery-badge new">{'✨'} New</span>}
                          </div>
                        )}
                        {item.category_name && <p className="gallery-card-category">{item.category_name}</p>}
                        <h2 className="gallery-card-name">{item.name}</h2>
                        {item.description && <p className="gallery-card-desc">{item.description}</p>}
                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                          <div className="gallery-card-dietary">
                            {item.dietary_tags.map(tag => {
                              const info = DIETARY_LABELS[tag.toLowerCase()] || { icon: '', label: tag.replace(/[_-]/g, ' ') };
                              return <span key={tag} className="gallery-dietary-pill">{info.icon} {info.label}</span>;
                            })}
                          </div>
                        )}
                        <div className="gallery-card-actions">
                          <div className="gallery-card-price">{priceStr}{item.calories ? <small> · {item.calories} cal</small> : null}</div>
                          {item.order_url && (
                            <a href={item.order_url} target="_blank" rel="noopener noreferrer" className="gallery-card-order" aria-label={`Order ${item.name}`} onClick={e => e.stopPropagation()}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            </a>
                          )}
                          <button type="button" className="gallery-card-share" onClick={e => { e.stopPropagation(); handleShareDish(item); }} aria-label={`Share ${item.name}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="gallery-empty-items">
              <p>{activeFilters.length ? 'No dishes with confirmed matching tags. Clear filters or show other dishes.' : 'No dishes in this category.'}</p>
            </div>
          )}

          {/* Pointer devices get step buttons at mid-height; phones swipe. */}
          {filteredItems.length > 0 && (
            <>
              <button type="button" className="gallery-step prev" aria-label="Previous dish" disabled={activeIndex === 0} onClick={() => step(-1)}>‹</button>
              <button type="button" className="gallery-step next" aria-label="Next dish" disabled={activeIndex >= total - 1} onClick={() => step(1)}>›</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ===== STYLES =====
const galleryStyles = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }

  /* The photo menu is always dark and full-screen, whatever the app theme. */
  .gallery-shell {
    position: fixed; inset: 0; background: #000; color: #fff; display: flex; flex-direction: column; align-items: stretch; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }
  .gallery-stage { position: relative; flex: 1; min-height: 0; width: 100%; }
  @media (min-width: 720px) { .gallery-shell { align-items: center; } .gallery-stage { max-width: 560px; } }

  /* Loading / empty / error */
  .gallery-loading { position: fixed; inset: 0; background: #000; display: flex; align-items: center; justify-content: center; }
  .gallery-spinner { width: 32px; height: 32px; border: 3px solid #222; border-top-color: #fff; border-radius: 50%; animation: gspin 0.7s linear infinite; }
  @keyframes gspin { to { transform: rotate(360deg); } }
  .gallery-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; text-align: center; color: #aaa; }
  .gallery-empty a { color: #fff; }
  .gallery-back-link { background: none; border: 1px solid #444; color: #fff; padding: 10px 24px; border-radius: 24px; font: inherit; font-size: 14px; cursor: pointer; text-decoration: none; }
  .gallery-empty-items { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; color: #aaa; font-size: 15px; }

  /* Floating top bar over the photo */
  .gallery-top {
    position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: max(10px, env(safe-area-inset-top)) 12px 16px; pointer-events: none;
    background: linear-gradient(to bottom, rgba(0,0,0,.7), rgba(0,0,0,.35) 65%, transparent);
  }
  .gallery-top > * { pointer-events: auto; }
  .gallery-top-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .gallery-icon-btn {
    position: relative; width: 40px; height: 40px; padding: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.18); color: #fff; text-decoration: none; cursor: pointer;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  }
  .gallery-icon-btn.on { background: #fff; color: #111; border-color: #fff; }
  .gallery-position { font-size: 13px; font-weight: 600; letter-spacing: .02em; color: rgba(255,255,255,.9); font-variant-numeric: tabular-nums; text-shadow: 0 1px 6px rgba(0,0,0,.6); }
  .gallery-filter-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  .gallery-pills { display: flex; gap: 6px; flex: 1; min-width: 0; padding: 2px 0; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
  .gallery-pills::-webkit-scrollbar { display: none; }
  .gallery-pills.wrap { flex-wrap: wrap; overflow: visible; }
  .gallery-pill {
    flex-shrink: 0; min-height: 34px; padding: 7px 14px; border-radius: 20px; white-space: nowrap; cursor: pointer;
    border: 1px solid rgba(255,255,255,.18); background: rgba(0,0,0,.42); color: #fff; font: inherit; font-size: 13px; font-weight: 600;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  }
  .gallery-pill.active { background: #fff; color: #111; border-color: #fff; }
  .gallery-pill.diet.active { background: #34d399; border-color: #34d399; color: #062b1f; }
  .gallery-dot-badge { position: absolute; top: -3px; right: -3px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #34d399; color: #062b1f; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .gallery-panel { margin-top: 10px; padding: 12px; border-radius: 16px; background: rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .gallery-dietary-result { margin-top: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); font-size: 13px; color: #fff; }
  .gallery-dietary-result button { min-height: 36px; margin-left: 10px; color: #fff; background: transparent; border: 0; text-decoration: underline; font: inherit; cursor: pointer; }
  .gallery-dietary-result p { margin: 4px 0 0; color: rgba(255,255,255,.7); }

  /* Full-bleed pages, one per dish */
  .gallery-scroll { position: absolute; inset: 0; display: flex; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
  .gallery-scroll::-webkit-scrollbar { display: none; }
  .gallery-card { position: relative; flex: 0 0 100%; width: 100%; height: 100%; min-width: 0; scroll-snap-align: start; overflow: hidden; background: #0b0b0e; }
  .gallery-card-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .gallery-card-placeholder { display: grid; place-items: center; padding: 24px; background: radial-gradient(ellipse at center, #26262e, #0b0b0e 75%); color: #bbb; font-size: 14px; letter-spacing: .1em; text-transform: uppercase; }
  .gallery-cover-bg { background: radial-gradient(ellipse at center top, #1a0a2e 0%, #000 70%); }
  .gallery-card-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,.05) 24%, rgba(0,0,0,0) 42%, rgba(0,0,0,.55) 66%, rgba(0,0,0,.92) 100%); }
  .gallery-cover-card .gallery-card-shade { background: rgba(0,0,0,.55); }
  .gallery-card-filtered .gallery-card-bg { filter: grayscale(.6) brightness(.55); }

  /* Details sit over the lower part of the photo. Long text scrolls over the still image;
     the spacer keeps the photo visible on the first look and margin-top:auto keeps short text at the bottom. */
  .gallery-card-body { position: absolute; inset: 0; display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-width: none; }
  .gallery-card-body::-webkit-scrollbar { display: none; }
  .gallery-card-spacer { flex: 0 0 min(44dvh, 420px); }
  .gallery-card-text-block { margin-top: auto; padding: 20px 20px calc(22px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 10px; overflow-wrap: anywhere; }
  .gallery-card-category { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.72); }
  .gallery-card-name { margin: 0; font-size: clamp(26px, 7vw, 34px); font-weight: 800; line-height: 1.15; letter-spacing: -.01em; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,.5); }
  .gallery-card-desc { margin: 0; font-size: 15.5px; line-height: 1.55; color: rgba(255,255,255,.88); white-space: pre-wrap; text-shadow: 0 1px 8px rgba(0,0,0,.6); }
  .gallery-card-badges-top { display: flex; flex-wrap: wrap; gap: 6px; }
  .gallery-badge { padding: 5px 10px; border-radius: 16px; font-size: 12px; font-weight: 700; color: #fff; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .gallery-badge.fire { background: rgba(255,80,0,.75); border-color: transparent; }
  .gallery-badge.new { background: rgba(138,5,190,.75); border-color: transparent; }
  .gallery-card-dietary { display: flex; flex-wrap: wrap; gap: 6px; }
  .gallery-dietary-pill { padding: 4px 9px; border-radius: 10px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.85); background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.1); white-space: nowrap; }
  .gallery-card-actions { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
  .gallery-card-price { flex: 1; min-width: 0; font-size: 22px; font-weight: 800; letter-spacing: -.01em; color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 2px 10px rgba(0,0,0,.5); }
  .gallery-card-price small { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7); }
  .gallery-card-share, .gallery-card-order {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none;
    border: 1px solid rgba(255,255,255,.18); background: rgba(0,0,0,.45); color: #fff; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  }
  .gallery-card-order { background: #fff; color: #111; border-color: #fff; }
  .gallery-card-allergen-overlay { padding: 10px 14px; border-radius: 12px; background: rgba(0,0,0,.65); border: 1px solid rgba(255,255,255,.14); font-size: 13px; color: rgba(255,255,255,.9); }

  /* Cover page */
  .gallery-cover-content { margin: auto 0; padding: calc(150px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: center; text-align: center; overflow-wrap: anywhere; }
  .gallery-cover-name { margin: 0; font-size: clamp(30px, 8vw, 40px); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; color: #fff; text-shadow: 0 2px 14px rgba(0,0,0,.6); }
  .gallery-cover-tagline { margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,.78); }
  .gallery-cover-thumbs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 22px; width: 164px; }
  .gallery-cover-thumb { width: 79px; height: 79px; border-radius: 12px; overflow: hidden; border: 2px solid rgba(255,255,255,.25); }
  .gallery-cover-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gallery-thumb-placeholder { width: 100%; height: 100%; background: rgba(255,255,255,.08); }
  .gallery-cover-pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 26px; max-width: 340px; }
  .gallery-cover-pill { padding: 8px 12px; border-radius: 20px; font-size: 14px; line-height: 1.4; max-width: 100%; overflow-wrap: anywhere; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .pill-happy { background: rgba(251,191,36,.15); border-color: rgba(251,191,36,.4); color: #fbbf24; }
  .pill-chef { background: rgba(138,5,190,.15); border-color: rgba(138,5,190,.4); color: #d8b4fe; }
  .pill-day { background: rgba(20,184,166,.15); border-color: rgba(20,184,166,.4); color: #5eead4; }
  .pill-promo { background: rgba(244,114,182,.15); border-color: rgba(244,114,182,.4); color: #f9a8d4; }
  .pill-seasonal { background: rgba(74,222,128,.15); border-color: rgba(74,222,128,.4); color: #86efac; }
  .gallery-cover-swipe { margin: 26px 0 0; font-size: 15px; color: rgba(255,255,255,.85); animation: gallery-swipe-pulse 1.6s ease-in-out infinite; }
  @keyframes gallery-swipe-pulse { 0%, 100% { opacity: .6; transform: translateX(0); } 50% { opacity: 1; transform: translateX(4px); } }
  .gallery-badge-pulse { animation: gallery-fire-pulse 1.5s ease-in-out infinite; }
  @keyframes gallery-fire-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,80,0,.4); } 50% { box-shadow: 0 0 12px 4px rgba(255,80,0,.3); } }
  @media (prefers-reduced-motion: reduce) { .gallery-cover-swipe, .gallery-badge-pulse { animation: none; } }

  /* Pointer devices get step buttons at mid-height; phones swipe. */
  .gallery-step { display: none; }
  @media (hover: hover) and (pointer: fine) {
    .gallery-step {
      display: inline-flex; position: absolute; top: 50%; transform: translateY(-50%); z-index: 15; width: 44px; height: 44px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer;
      border: 1px solid rgba(255,255,255,.2); background: rgba(0,0,0,.5); color: #fff; font-size: 28px; line-height: 1; padding: 0 0 3px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    }
    .gallery-step.prev { left: 12px; } .gallery-step.next { right: 12px; }
    .gallery-step:disabled { opacity: .25; cursor: default; }
    .gallery-scroll { scroll-behavior: smooth; }
  }
  .gallery-card:focus-visible, .gallery-shell a:focus-visible, .gallery-shell button:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
`;

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
