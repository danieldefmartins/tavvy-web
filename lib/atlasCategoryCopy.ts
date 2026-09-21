/** Translate only the known Atlas taxonomy, never renamed or user-authored content. */
const ATLAS_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  "airports": "Airports",
  "campuses": "Campuses",
  "cities": "Cities",
  "family-kids": "Family & Kids",
  "food-drink": "Food & Drink",
  "hospitals": "Hospitals",
  "malls": "Malls",
  "national-parks": "National Parks",
  "ports": "Ports",
  "stadiums": "Stadiums",
  "theme-parks": "Theme Parks",
  "travel-tips": "Travel Tips",
  "venues": "Venues"
};
export function atlasCategoryName(category: { slug?: string | null; name: string }, copy: (message: string) => string): string {
  const known = category.slug ? ATLAS_CATEGORY_LABELS[category.slug] : undefined;
  return known && category.name === known ? copy(known) : category.name;
}
