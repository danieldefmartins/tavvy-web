import { supabase } from './supabaseClient';

/** Product categories offered in the "what do you want to review next?" survey. */
export const REVIEW_WISHLIST_CATEGORIES: { id: string; label: string }[] = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'cars', label: 'Cars' },
  { id: 'handbags_fashion', label: 'Handbags & fashion' },
  { id: 'home_appliances', label: 'Home & appliances' },
  { id: 'beauty', label: 'Beauty & skincare' },
  { id: 'other', label: 'Something else' },
];

export interface ReviewWishlistAnswer {
  platform: 'ios' | 'android' | 'web';
  userId?: string | null;
  missingPlaces?: string;
  productCategories: string[];
  otherText?: string;
  locale?: string;
}

/** Stores one survey answer. Empty answers are rejected client-side so the table only holds real signal. */
export async function submitReviewWishlist(answer: ReviewWishlistAnswer): Promise<void> {
  const missing = (answer.missingPlaces || '').trim().slice(0, 1000);
  const other = (answer.otherText || '').trim().slice(0, 500);
  if (!missing && !other && answer.productCategories.length === 0) throw new Error('Tell us at least one thing first.');
  const { error } = await supabase.from('review_wishlist_responses').insert({
    user_id: answer.userId ?? null, platform: answer.platform,
    missing_places: missing || null, product_categories: answer.productCategories, other_text: other || null,
    locale: answer.locale ?? null,
  });
  if (error) throw new Error('Could not send your answer. Please try again.');
}
