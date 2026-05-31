/**
 * Menu Item Analytics — Per-Dish View & Share Tracking
 *
 * Tracks view_count and share_count on individual menu_items.
 * Columns to add to menu_items table:
 *   - view_count integer default 0
 *   - share_count integer default 0
 *
 * Fire-and-forget — no await needed from callers.
 */

import { supabase } from './supabaseClient';

/**
 * Increment view_count for a specific menu item.
 * Call when item becomes visible (gallery scroll snap) or expanded (classic menu).
 */
export function trackItemView(itemId: string): void {
  (async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('id, view_count')
        .eq('id', itemId)
        .maybeSingle();

      if (!data) return;

      await supabase
        .from('menu_items')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    } catch (error) {
      console.error('[menuItemAnalytics] trackItemView error:', error);
    }
  })();
}

/**
 * Increment share_count for a specific menu item.
 * Call when a user shares a dish.
 */
export function trackItemShare(itemId: string): void {
  (async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('id, share_count')
        .eq('id', itemId)
        .maybeSingle();

      if (!data) return;

      await supabase
        .from('menu_items')
        .update({ share_count: (data.share_count || 0) + 1 })
        .eq('id', data.id);
    } catch (error) {
      console.error('[menuItemAnalytics] trackItemShare error:', error);
    }
  })();
}
