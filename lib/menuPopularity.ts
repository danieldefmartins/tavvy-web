/**
 * Menu Popularity — Auto-Popular Badge from Signal Data
 *
 * Matches menu item names against signal labels with high tap counts.
 * If a signal with >100 taps fuzzy-matches a dish name, mark it as popular.
 */

import { supabase } from './supabaseClient';

interface SignalTapData {
  signal_label: string;
  tap_count: number;
}

interface MenuItemRow {
  id: string;
  name: string;
  is_popular: boolean;
}

/**
 * Simple word-match: returns true if any word in dishName appears in signalLabel
 * or vice versa (case-insensitive, ignoring short words < 3 chars).
 */
function fuzzyMatch(dishName: string, signalLabel: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  const dishWords = normalize(dishName).split(/\s+/).filter(w => w.length >= 3);
  const signalWords = normalize(signalLabel).split(/\s+/).filter(w => w.length >= 3);

  // Check if any dish word appears in signal label or vice versa
  for (const dw of dishWords) {
    for (const sw of signalWords) {
      if (dw.includes(sw) || sw.includes(dw)) return true;
    }
  }
  return false;
}

/**
 * Given a place_id, determines which menu items should be auto-popular
 * based on signal tap data.
 *
 * Returns the list of menu item IDs that should be marked popular.
 */
export async function computePopularity(placeId: string): Promise<string[]> {
  // 1. Get signal taps for this place (signal labels + tap counts)
  const { data: signalData } = await supabase
    .from('place_review_signal_taps')
    .select('signal_label, tap_count')
    .eq('place_id', placeId);

  if (!signalData || signalData.length === 0) return [];

  // Filter to high-scoring signals (>100 taps)
  const hotSignals: SignalTapData[] = signalData.filter(
    (s: any) => (s.tap_count || 0) > 100
  );

  if (hotSignals.length === 0) return [];

  // 2. Get menu items for this place
  const { data: menuData } = await supabase
    .from('menus')
    .select('id')
    .eq('place_id', placeId)
    .maybeSingle();

  if (!menuData) return [];

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuData.id);

  if (!categories || categories.length === 0) return [];

  const categoryIds = categories.map((c: any) => c.id);

  const { data: items } = await supabase
    .from('menu_items')
    .select('id, name, is_popular')
    .in('category_id', categoryIds);

  if (!items || items.length === 0) return [];

  // 3. Match items against hot signals
  const popularIds: string[] = [];

  for (const item of items as MenuItemRow[]) {
    for (const signal of hotSignals) {
      if (fuzzyMatch(item.name, signal.signal_label)) {
        popularIds.push(item.id);
        break;
      }
    }
  }

  return popularIds;
}

/**
 * Sync popularity: computes which items should be popular and updates the DB.
 * Sets is_popular=true for matched items, false for others.
 */
export async function syncPopularity(placeId: string): Promise<{ updated: number }> {
  const popularIds = await computePopularity(placeId);

  // Get all menu items for this place
  const { data: menuData } = await supabase
    .from('menus')
    .select('id')
    .eq('place_id', placeId)
    .maybeSingle();

  if (!menuData) return { updated: 0 };

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuData.id);

  if (!categories || categories.length === 0) return { updated: 0 };

  const categoryIds = categories.map((c: any) => c.id);

  const { data: allItems } = await supabase
    .from('menu_items')
    .select('id')
    .in('category_id', categoryIds);

  if (!allItems) return { updated: 0 };

  // Reset all to not popular
  const allIds = allItems.map((i: any) => i.id);
  if (allIds.length > 0) {
    await supabase
      .from('menu_items')
      .update({ is_popular: false })
      .in('id', allIds);
  }

  // Set matched ones to popular
  if (popularIds.length > 0) {
    await supabase
      .from('menu_items')
      .update({ is_popular: true })
      .in('id', popularIds);
  }

  return { updated: popularIds.length };
}
