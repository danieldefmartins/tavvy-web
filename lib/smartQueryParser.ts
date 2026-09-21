/**
 * Smart Query Parser for Natural Language Place Search
 * 
 * Parses queries like:
 * - "Starbucks Newark NJ"
 * - "Starbucks near Newark, NJ"
 * - "coffee shops in Manhattan"
 * - "pizza New York"
 * 
 * Extracts: place name, city, state/region, country
 */

// US State abbreviations and full names
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

const US_STATE_NAMES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY'
};

// Common country codes
const COUNTRY_CODES = new Set([
  'US', 'USA', 'UK', 'GB', 'CA', 'AU', 'NZ', 'DE', 'FR', 'ES', 'IT', 'JP', 'CN', 'IN', 'BR', 'MX'
]);

export interface ParsedQuery {
  placeName: string;
  city?: string;
  region?: string;  // State for US, province for others
  country?: string;
  useCurrentLocation?: boolean;
  isParsed: boolean;  // True if we successfully extracted entities
  originalQuery: string;
}

function parseUsLocation(value: string): { city: string; region?: string; country?: string } {
  const location = value.trim();
  const code = location.match(/^(.+?)(?:,\s*|\s+)([a-zA-Z]{2})$/);
  if (code && US_STATES.has(code[2].toUpperCase())) {
    return { city: code[1].trim(), region: code[2].toUpperCase(), country: 'US' };
  }
  const lower = location.toLowerCase();
  for (const [stateName, region] of Object.entries(US_STATE_NAMES).sort((a, b) => b[0].length - a[0].length)) {
    for (const separator of [', ', ' ']) {
      if (lower.endsWith(separator + stateName)) {
        return { city: location.slice(0, -(separator.length + stateName.length)).trim(), region, country: 'US' };
      }
    }
  }
  return { city: location };
}

/**
 * Parse a natural language search query
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const trimmed = query.trim();
  
  if (!trimmed) {
    return {
      placeName: '',
      isParsed: false,
      originalQuery: query
    };
  }

  // Relative location is an explicit intent, never a city named "me".
  const nearby = trimmed.match(/^(.*?)\s*(?:near\s+me|nearby|around\s+me|near\s+my\s+(?:current\s+)?location)$/i);
  if (nearby) return { placeName: nearby[1].trim() || '*', useCurrentLocation: true, isParsed: true, originalQuery: query };

  // Pattern 1: "Place near City State" or "Place near City, State"
  // Example: "Starbucks near Newark NJ" or "coffee shops in Manhattan, NY"
  // Supports both "near Newark NJ" and "near Newark, NJ"
  const nearPattern = /^(.+?)\s+(?:near|in|at)\s+(.+)$/i;
  const nearMatch = trimmed.match(nearPattern);
  
  if (nearMatch) {
    const [_, placeName, locationPart] = nearMatch;
    const location = parseUsLocation(locationPart);
    const result: ParsedQuery = {
      placeName: placeName.trim(),
      city: location.city,
      region: location.region,
      country: location.country,
      isParsed: true,
      originalQuery: query
    };
    return result;
  }

  // Pattern 2: "Place City State" (no preposition)
  // Example: "Starbucks Newark NJ" or "pizza Manhattan NY" or "starbucks newark nj"
  // Look for 2-letter state code at the end (case-insensitive)
  const cityStatePattern = /^(.+?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]{2})$/;
  const cityStateMatch = trimmed.match(cityStatePattern);
  
  if (cityStateMatch) {
    const [_, placeName, city, state] = cityStateMatch;
    const stateUpper = state.toUpperCase();
    if (US_STATES.has(stateUpper)) {
      return {
        placeName: placeName.trim(),
        city: city.trim(),
        region: stateUpper,
        country: 'US',
        isParsed: true,
        originalQuery: query
      };
    }
  }

  // Capitalization alone cannot distinguish a business name from a city.
  // Preserve names such as Whole Foods and Riva Cucina unless location syntax is explicit.

  // Pattern 4: "Place, City, State" (comma-separated)
  // Example: "Starbucks, Newark, NJ"
  const commaPattern = /^(.+?),\s*(.+?)(?:,\s*(.+))?$/;
  const commaMatch = trimmed.match(commaPattern);
  
  if (commaMatch) {
    const [_, placeName, cityPart, statePart] = commaMatch;
    const location = parseUsLocation(statePart ? `${cityPart}, ${statePart}` : cityPart);
    const result: ParsedQuery = {
      placeName: placeName.trim(),
      city: location.city,
      region: location.region,
      country: location.country,
      isParsed: true,
      originalQuery: query
    };
    return result;
  }

  // No pattern matched - return as plain place name
  return {
    placeName: trimmed,
    isParsed: false,
    originalQuery: query
  };
}

/**
 * Get a user-friendly description of what was parsed
 */
export function getParseDescription(parsed: ParsedQuery): string | null {
  if (!parsed.isParsed) return null;
  if (parsed.useCurrentLocation) return `Searching for ${parsed.placeName} near your location`;
  
  const parts: string[] = [];
  
  if (parsed.placeName) {
    parts.push(`"${parsed.placeName}"`);
  }
  
  if (parsed.city) {
    parts.push(`in ${parsed.city}`);
  }
  
  if (parsed.region) {
    parts.push(parsed.region);
  }
  
  if (parsed.country && parsed.country !== 'US') {
    parts.push(parsed.country);
  }
  
  return parts.length > 0 ? `Searching for ${parts.join(', ')}` : null;
}

/**
 * Example queries for placeholder text
 */
export const EXAMPLE_QUERIES = [
  '"Starbucks Newark NJ"',
  '"coffee shops in Manhattan"',
  '"pizza near Brooklyn, NY"',
  '"Whole Foods"'
];
