import { chainCoverFor } from './chainCovers';

export interface PreviewPlace {
  id: string; name?: string | null; category?: string; subcategory?: string; tavvy_category?: string; tavvy_subcategory?: string;
  photos?: unknown; cover_image_url?: string | null; photo_url?: string | null; photo?: string | null;
}
const GROUPS: [string, RegExp][] = [
  ['fuel', /gas station|fuel|petrol|service station/],
  ['cruise_ship', /cruise|ocean liner/], ['rv_camping', /campground|camping|rv park|rv_camping|boondock|overnight parking|dump station/],
  ['cafe', /cafe|café|coffee|tea house|bakery/], ['bar', /bar\b|pub\b|brewery|cocktail|nightlife|nightclub/],
  ['restaurant', /restaurant|food|dining|pizza|pasta|sushi|burger|taco|bistro|steak|seafood|diner|catering/],
  ['hotel', /hotel|motel|lodging|resort|hostel|bed and breakfast|inn\b/],
  ['pets', /pet|veterinar|dog|animal/], ['health', /health|medical|clinic|dental|dentist|hospital|pharmacy|optician|therapy/],
  ['beauty', /beauty|salon|spa\b|barber|hair|nail/], ['fitness', /fitness|gym|yoga|sports|swim|workout/],
  ['automotive', /automotive|auto repair|car wash|mechanic|tire|gas station|fuel/],
  ['home_services', /home.service|plumb|electrician|contractor|carpenter|landscap|cleaning|roof|painting/],
  ['financial', /financial|bank|credit union|insurance|accountant|tax/],
  ['religious', /religio|church|mosque|synagogue|temple|worship/], ['education', /educat|school|university|college|library|lesson/],
  ['government', /government|municipal|civic|public service|post office|courthouse/],
  ['transportation', /transport|airport|train|bus station|ferry|railway|parking/],
  ['arts', /arts|gallery|museum|theater|theatre|pottery/],
  ['entertainment', /entertainment|amusement|theme park|ride|cinema|bowling|arcade|music venue/],
  ['outdoors', /outdoor|park|beach|trail|garden|nature|lake|forest/],
  ['events', /event|conference|wedding|convention/], ['city', /city|cities|town|neighborhood/],
  ['shopping', /shopping|store|shop|retail|market|mall/],
  ['professional', /professional|realtor|real estate|office|service|pros|lawyer/],
];
export function categoryImageGroup(place: PreviewPlace): string {
  for (const value of [place.subcategory, place.tavvy_subcategory, place.category, place.tavvy_category]) {
    if (!value) continue;
    const text = value.toLowerCase().replace(/_/g, ' ');
    const group = GROUPS.find(([, pattern]) => pattern.test(text))?.[0];
    if (group) return group;
  }
  return 'general';
}
export function categoryImageForPlace(place: PreviewPlace): string {
  const group = categoryImageGroup(place);
  let hash = 2166136261;
  for (const char of place.id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  let index = (hash >>> 0) % 5 + 1;
  const category = [place.subcategory, place.tavvy_subcategory, place.category].filter(Boolean).join(' ').toLowerCase();
  if (group === 'restaurant') {
    if (/italian|pasta/.test(category)) index = 1;
    else if (/pizza/.test(category)) index = 2;
    else if (/japanese|sushi/.test(category)) index = 3;
    else if (/burger/.test(category)) index = 4;
    else if (/mexican|taco/.test(category)) index = 5;
  }
  if (group === 'religious') index = /church|christian/.test(category) ? 1 : /mosque|islam/.test(category) ? 2 : /synagogue|jewish/.test(category) ? 3 : /buddhist/.test(category) ? 4 : 5;
  return `/images/place-categories/${group}-${index}.webp`;
}
export function realPlacePhotos(place: PreviewPlace): string[] {
  const photos = Array.isArray(place.photos) ? place.photos.map(photo => typeof photo === 'string' ? photo : photo?.url) : [];
  const real = [...new Set([place.cover_image_url, ...photos, place.photo_url, place.photo].filter((url): url is string =>
    typeof url === 'string' && !!url.trim() && !url.includes('/images/place-categories/') && (/^https?:\/\//.test(url) || url.startsWith('/'))
  ))];
  // National chains without their own photos get the chain's cover (a real storefront, not an illustration).
  if (real.length === 0) { const chain = chainCoverFor(place.name); if (chain) return [chain]; }
  return real;
}
export function placePreviewImage(place: PreviewPlace): { src: string; isCategory: boolean } {
  const photo = realPlacePhotos(place)[0];
  return { src: photo || categoryImageForPlace(place), isCategory: !photo };
}
