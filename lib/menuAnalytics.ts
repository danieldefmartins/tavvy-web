/**
 * Menu Analytics - View & Share Tracking
 *
 * Tracks view_count, share_count, and last_viewed_at on the menus table.
 * Columns to add to menus table:
 *   - view_count integer default 0
 *   - share_count integer default 0
 *   - last_viewed_at timestamptz
 */

import { supabase } from './supabaseClient';

/**
 * Increment the view count for a menu by place_id.
 * Fires on each menu page load (client-side).
 * Uses a simple update with increment pattern.
 */
export async function trackMenuView(placeId: string): Promise<void> {
  try {
    // First get the menu id for this place
    const { data: menu } = await supabase
      .from('menus')
      .select('id, view_count')
      .eq('place_id', placeId)
      .maybeSingle();

    if (!menu) return;

    const currentCount = menu.view_count || 0;

    await supabase
      .from('menus')
      .update({
        view_count: currentCount + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', menu.id);
  } catch (error) {
    // Silently fail - analytics should never break the UX
    console.error('[menuAnalytics] trackMenuView error:', error);
  }
}

/**
 * Increment the share count for a menu by place_id.
 * Call this when a user shares a menu item.
 */
export async function trackMenuShare(placeId: string): Promise<void> {
  try {
    const { data: menu } = await supabase
      .from('menus')
      .select('id, share_count')
      .eq('place_id', placeId)
      .maybeSingle();

    if (!menu) return;

    const currentCount = menu.share_count || 0;

    await supabase
      .from('menus')
      .update({
        share_count: currentCount + 1,
      })
      .eq('id', menu.id);
  } catch (error) {
    console.error('[menuAnalytics] trackMenuShare error:', error);
  }
}
