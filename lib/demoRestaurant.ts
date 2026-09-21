import type { EvidenceVisit } from './placeEvidence';

// Fictional sales-demo data. Never insert these records into merchant tables.
export const DEMO_ID = 'demo-trattoria';
export const DEMO_HOME = '/app/demo/restaurant';
export const DEMO_MENU = `/place/${DEMO_ID}/menu`;
export const DEMO_ORDER = `/place/${DEMO_ID}/order?table=7`;
export const DEMO_CARD = '/app/demo/restaurant-card';
export const DEMO_GUIDE = '/app/demo/restaurant-showcase';
export const DEMO_ORDER_KEY = 'tavvy:restaurant-demo:order:v1';
export const DEMO_REVIEW_KEY = 'tavvy:restaurant-demo:review:v1';
export const DEMO_MENU_KEY = 'tavvy:restaurant-demo:menu:v1';
export const DEMO_STORY_KEY = 'tavvy:restaurant-demo:story:v1';
export const DEMO_STATS_KEY = 'tavvy:restaurant-demo:stats:v1';
export const isDemoRestaurant = (id: unknown) => id === DEMO_ID;
export const demoImage = (name: string) => `/images/demo-trattoria/${name}.jpg`;

function item(id: string, name: string, description: string, price: number, image: string | null, dietary: string[] = [], popular = false, isNew = false) {
  return { id: `demo-${id}`, name, description, price, price_label: null, image_url: image ? demoImage(image) : null,
    dietary_tags: dietary, is_popular: popular, is_new: isNew, linked_photo_ids: [] as string[],
    calories: null, duration_minutes: null, order_url: DEMO_ORDER, is_available: true };
}
export const demoCategories = [
  { id: 'demo-antipasti', name: 'A little something to start', description: 'Made for sharing around the table.', sort_order: 0, image_url: null, meal_period: 'all_day', items: [
    item('burrata', 'Burrata & Heirloom Tomatoes', 'Creamy burrata, sun-ripened tomatoes, basil and extra virgin olive oil.', 18, 'burrata', ['vegetarian', 'gluten_free'], true),
    item('focaccia', 'Warm Rosemary Focaccia', 'House-baked bread, rosemary, flaky sea salt and olive oil.', 8, null, ['vegan', 'dairy_free']),
    item('olives', 'Citrus-Marinated Olives', 'Castelvetrano olives, orange peel, fennel seed and herbs.', 7, null, ['vegan', 'gluten_free', 'dairy_free']),
  ] },
  { id: 'demo-lunch', name: 'A slower lunch', description: 'A good reason to take your time.', sort_order: 1, image_url: null, meal_period: 'lunch', items: [
    item('pizza', 'Margherita', 'Wood-fired dough, San Marzano tomato, fior di latte and fresh basil.', 20, 'pizza', ['vegetarian'], true),
    item('panino', 'Roasted Vegetable Panino', 'Zucchini, sweet peppers and basil on warm focaccia.', 15, null, ['vegan', 'dairy_free']),
    item('salad', 'Little Garden Salad', 'Seasonal greens, shaved fennel, cucumber and lemon vinaigrette.', 12, null, ['vegan', 'gluten_free', 'dairy_free']),
  ] },
  { id: 'demo-pasta', name: 'Pasta, made here', description: 'Rolled by hand. Finished to order.', sort_order: 2, image_url: null, meal_period: 'dinner', items: [
    item('rigatoni', 'Rigatoni al Pomodoro', 'Fresh rigatoni, slow-simmered tomato, basil and Parmigiano Reggiano.', 24, 'pasta', ['vegetarian'], true),
    item('tagliatelle', 'Tagliatelle al Ragù', 'House-made ribbons with slow-braised beef ragù and aged parmesan.', 28, null),
    item('risotto', 'Wild Mushroom Risotto', 'Carnaroli rice, roasted mushrooms, thyme and parmesan.', 26, null, ['vegetarian', 'gluten_free'], false, true),
  ] },
  { id: 'demo-dolci', name: 'Leave room for dolci', description: 'The sweetest part of staying a little longer.', sort_order: 3, image_url: null, meal_period: 'all_day', items: [
    item('tiramisu', 'Tiramisu della Casa', 'Espresso-soaked sponge, mascarpone cream and a dusting of cocoa.', 12, 'tiramisu', ['vegetarian'], true),
    item('sorbet', 'Lemon Sorbet', 'Bright, refreshing Sicilian-style lemon sorbet.', 8, null, ['vegan', 'gluten_free', 'dairy_free']),
    item('affogato', 'Affogato', 'Vanilla gelato with a warm shot of our house espresso.', 10, null, ['vegetarian', 'gluten_free']),
  ] },
  { id: 'demo-drinks', name: 'Raise a glass', description: 'Something for every kind of evening.', sort_order: 4, image_url: null, meal_period: 'all_day', items: [
    item('spritz', 'Blood Orange Spritz', 'Blood orange, sparkling wine and a splash of soda.', 13, null, ['vegan', 'gluten_free']),
    item('zero-spritz', 'Garden Spritz · Zero Proof', 'Cucumber, basil, lemon and sparkling water.', 9, null, ['vegan', 'gluten_free']),
    item('espresso', 'Espresso', 'A small, rich finish from our house coffee blend.', 4, null, ['vegan', 'gluten_free']),
    item('sparkling', 'Sparkling Mineral Water', 'Chilled sparkling water for the table.', 6, null, ['vegan', 'gluten_free']),
  ] },
];
export const demoItems = demoCategories.flatMap(c => c.items.map(i => ({ ...i, category_id: c.id, category_name: c.name, meal_period: c.meal_period })));
export function readDemoCategories() {
  let edits: Record<string, { price?: number; available?: boolean }> = {};
  try { edits = JSON.parse(localStorage.getItem(DEMO_MENU_KEY) || '{}') || {}; } catch {}
  return demoCategories.map(c => ({ ...c, items: c.items.filter(i => edits[i.id]?.available !== false).map(i => ({ ...i, price: typeof edits[i.id]?.price === 'number' && Number.isFinite(edits[i.id].price) && edits[i.id].price! >= 0 ? edits[i.id].price! : i.price })) }));
}
export function recordDemoEvent(key: 'placeViews' | 'menuViews' | 'ecardViews' | 'orders' | 'reviews' | 'stories') {
  try { const stats = JSON.parse(localStorage.getItem(DEMO_STATS_KEY) || '{}'); stats[key] = (Number(stats[key]) || 0) + 1; localStorage.setItem(DEMO_STATS_KEY, JSON.stringify(stats)); } catch {}
}
export const demoMenu = {
  id: 'demo-menu', place_id: DEMO_ID, name: 'At our table', style: 'magazine', cover_image_url: demoImage('dining-room'),
  show_cover: true, happy_hour_enabled: true, happy_hour_text: 'Aperitivo, together', happy_hour_times: 'Tuesday–Friday · 4–6 PM',
  chef_recommendation_id: 'demo-rigatoni', dish_of_day_id: 'demo-burrata', promo_banner_enabled: true,
  promo_banner_text: 'Pasta + a glass · $32', seasonal_special_enabled: true, seasonal_special_text: 'Heirloom tomato season',
  welcome_message: 'Fresh pasta. Good company. Stay a little longer.', tagline: 'A little Italy. A lot of heart.',
};
export function demoVisits(now = new Date()): EvidenceVisit[] {
  const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  return [{ reviewId: 'demo-old-wait', userId: 'demo-visitor-old', visitedAt: ago(245), signals: [{ slug: 'restaurant_long_wait', label: 'Long Wait for Table', category: 'headsup' as const }] },
    ...[84, 72, 58, 42, 25, 11, 5, 2].map((days, i) => ({
      reviewId: `demo-review-${i}`, userId: `demo-visitor-${i}`, visitedAt: ago(days), signals: [
        { slug: 'restaurant_fresh_pasta', label: 'Fresh Pasta', category: 'good' as const },
        { slug: 'restaurant_friendly_service', label: 'Friendly Service', category: 'good' as const },
        { slug: 'restaurant_cozy', label: 'Cozy & Intimate', category: 'vibe' as const },
        ...(i % 2 === 0 ? [{ slug: 'restaurant_short_wait', label: 'Short Wait', category: 'good' as const }] : []),
        ...(i === 3 || i === 5 ? [{ slug: 'restaurant_noisy', label: 'Lively at Peak Hours', category: 'headsup' as const }] : []),
      ],
    }))];
}
export const demoReviewChoices = [
  { title: 'The Main Thing · The food', choices: [{ slug: 'restaurant_fresh_pasta', label: 'Fresh Pasta', category: 'good' }, { slug: 'restaurant_amazing_sauce', label: 'Amazing Sauce', category: 'good' }, { slug: 'restaurant_food_cold', label: 'Food Arrived Cold', category: 'headsup' }] },
  { title: 'The Good', choices: [{ slug: 'restaurant_friendly_service', label: 'Friendly Service', category: 'good' }, { slug: 'restaurant_short_wait', label: 'Short Wait', category: 'good' }] },
  { title: 'The Vibe', choices: [{ slug: 'restaurant_cozy', label: 'Cozy & Intimate', category: 'vibe' }, { slug: 'restaurant_date_night', label: 'Date Night', category: 'vibe' }] },
  { title: 'Heads Up', choices: [{ slug: 'restaurant_noisy', label: 'Lively at Peak Hours', category: 'headsup' }, { slug: 'restaurant_long_wait', label: 'Long Wait for Table', category: 'headsup' }] },
] as const;
