/**
 * Cover photos for national chains. Chains are regular places; these images just make sure
 * every Domino's, Starbucks, McDonald's… has a real cover instead of a category illustration.
 * Files live in the web repo under public/chain-covers and are served by tavvy.com.
 */
export const CHAIN_COVER_BASE = 'https://tavvy.com/chain-covers';

const CHAIN_PATTERNS: [string, RegExp][] = [
  ['applebees', /^\W*(?:the )?(?:applebee)\b/i],
  ['buffalo-wild-wings', /^\W*(?:the )?(?:buffalo wild wings)\b/i],
  ['burger-king', /^\W*(?:the )?(?:burger king)\b/i],
  ['carls-jr', /^\W*(?:the )?(?:carl'?s jr)\b/i],
  ['cheesecake-factory', /^\W*(?:the )?(?:cheesecake factory)\b/i],
  ['chick-fil-a', /^\W*(?:the )?(?:chick[- ]?fil[- ]?a)\b/i],
  ['chipotle', /^\W*(?:the )?(?:chipotle)\b/i],
  ['dunkin', /^\W*(?:the )?(?:dunkin)\b/i],
  ['five-guys', /^\W*(?:the )?(?:five guys)\b/i],
  ['ihop', /^\W*(?:the )?(?:ihop)\b/i],
  ['dominos', /^\W*(?:the )?(?:domino'?s)\b/i],
  ['in-n-out', /^\W*(?:the )?(?:in[- ]n[- ]out)\b/i],
  ['jersey-mikes', /^\W*(?:the )?(?:jersey mike'?s?)\b/i],
  ['kfc', /^\W*(?:the )?(?:kfc|kentucky fried chicken)\b/i],
  ['little-caesars', /^\W*(?:the )?(?:little caesars)\b/i],
  ['mcdonalds', /^\W*(?:the )?(?:mcdonald'?s)\b/i],
  ['olive-garden', /^\W*(?:the )?(?:olive garden)\b/i],
  ['panera', /^\W*(?:the )?(?:panera)\b/i],
  ['pizza-hut', /^\W*(?:the )?(?:pizza hut)\b/i],
  ['starbucks', /^\W*(?:the )?(?:starbucks)\b/i],
  ['subway', /^\W*(?:the )?(?:subway(?! ?(?:station|stop|entrance|line|platform)))\b/i],
  ['taco-bell', /^\W*(?:the )?(?:taco bell)\b/i],
  ['texas-roadhouse', /^\W*(?:the )?(?:texas roadhouse)\b/i],
  ['wendys', /^\W*(?:the )?(?:wendy'?s)\b/i]
];

/** Slug of the chain a place name belongs to, or null. Matches the start of the name ("Starbucks Reserve", "Dunkin'"). */
export function chainSlugFor(name: string | null | undefined): string | null {
  if (!name) return null;
  const match = CHAIN_PATTERNS.find(([, pattern]) => pattern.test(name));
  return match ? match[0] : null;
}

/** Cover image URL for a chain place, or null when the name is not a known chain. */
export function chainCoverFor(name: string | null | undefined): string | null {
  const slug = chainSlugFor(name);
  return slug ? `${CHAIN_COVER_BASE}/${slug}.jpg` : null;
}
