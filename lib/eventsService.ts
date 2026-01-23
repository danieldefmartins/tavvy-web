/**
 * Events Service
 * Multi-provider event aggregation for Happening Now feature
 * Fetches from Ticketmaster, PredictHQ, and Tavvy community events
 */

import { supabase } from './supabaseClient';

// API Keys (should be stored securely - in production use environment variables)
const TICKETMASTER_API_KEY = 'Jy4lTOUADcz6MbrnIDCuSkBmIA96wBqf';
const PREDICTHQ_API_KEY = 'E7n5kSWF5N7CmyruBAfuJKsX4RIgXrJ8tHMUVbYD';

// Canonical Event Type
export interface TavvyEvent {
  id: string;
  source: 'ticketmaster' | 'predicthq' | 'tavvy';
  source_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  category?: string;
  image_url?: string;
  url?: string;
  price_min?: number;
  price_max?: number;
  currency?: string;
  popularity?: number;
  verified?: boolean;
  distance?: number;
}

// Event categories mapping
const CATEGORY_MAP: Record<string, string> = {
  // Ticketmaster segments
  'Music': 'concerts',
  'Sports': 'sports',
  'Arts & Theatre': 'arts',
  'Film': 'arts',
  'Miscellaneous': 'other',
  // PredictHQ categories
  'concerts': 'concerts',
  'sports': 'sports',
  'festivals': 'festivals',
  'performing-arts': 'arts',
  'community': 'other',
  'expos': 'other',
  'conferences': 'other',
};

// ============================================================================
// TICKETMASTER API
// ============================================================================

interface TicketmasterEvent {
  id: string;
  name: string;
  description?: string;
  url?: string;
  images?: Array<{ url: string; width: number; height: number }>;
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string };
    end?: { localDate?: string; localTime?: string; dateTime?: string };
  };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
      country?: { countryCode?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
  }>;
}

export async function fetchTicketmasterEvents(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  startDate?: string,
  endDate?: string
): Promise<TavvyEvent[]> {
  try {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      latlong: `${lat},${lng}`,
      radius: radiusMiles.toString(),
      unit: 'miles',
      size: '50',
      sort: 'date,asc',
    });

    if (startDate) {
      params.append('startDateTime', `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      params.append('endDateTime', `${endDate}T23:59:59Z`);
    }

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[Events] Ticketmaster API error:', response.status);
      return [];
    }

    const data = await response.json();
    const events: TicketmasterEvent[] = data._embedded?.events || [];

    return events.map((event): TavvyEvent => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];
      const classification = event.classifications?.[0];
      const image = event.images?.find(img => img.width >= 500) || event.images?.[0];

      return {
        id: `tm_${event.id}`,
        source: 'ticketmaster',
        source_id: event.id,
        title: event.name,
        description: event.description,
        start_time: event.dates?.start?.dateTime || 
          `${event.dates?.start?.localDate}T${event.dates?.start?.localTime || '00:00:00'}`,
        end_time: event.dates?.end?.dateTime,
        venue_name: venue?.name,
        address: venue?.address?.line1,
        city: venue?.city?.name,
        state: venue?.state?.stateCode,
        country: venue?.country?.countryCode,
        lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
        lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
        category: CATEGORY_MAP[classification?.segment?.name || ''] || 'other',
        image_url: image?.url,
        url: event.url,
        price_min: priceRange?.min,
        price_max: priceRange?.max,
        currency: priceRange?.currency || 'USD',
        popularity: 100, // Ticketmaster gets highest priority
        verified: true,
      };
    });
  } catch (error) {
    console.error('[Events] Error fetching Ticketmaster events:', error);
    return [];
  }
}

// ============================================================================
// PREDICTHQ API
// ============================================================================

interface PredictHQEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  labels?: string[];
  start: string;
  end?: string;
  location?: [number, number]; // [lng, lat]
  geo?: {
    geometry?: {
      coordinates?: [number, number];
    };
    address?: {
      formatted_address?: string;
      locality?: string;
      region?: string;
      country_code?: string;
    };
  };
  entities?: Array<{
    entity_id?: string;
    name?: string;
    type?: string;
  }>;
  rank?: number;
  local_rank?: number;
}

export async function fetchPredictHQEvents(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  startDate?: string,
  endDate?: string
): Promise<TavvyEvent[]> {
  try {
    const radiusKm = Math.round(radiusMiles * 1.60934);
    
    const params = new URLSearchParams({
      'within': `${radiusKm}km@${lat},${lng}`,
      'limit': '50',
      'sort': 'start',
      'category': 'concerts,sports,festivals,performing-arts,community,expos',
    });

    if (startDate) {
      params.append('start.gte', startDate);
    }
    if (endDate) {
      params.append('start.lte', endDate);
    }

    const response = await fetch(
      `https://api.predicthq.com/v1/events/?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${PREDICTHQ_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Events] PredictHQ API error:', response.status);
      return [];
    }

    const data = await response.json();
    const events: PredictHQEvent[] = data.results || [];

    return events.map((event): TavvyEvent => {
      const coords = event.location || event.geo?.geometry?.coordinates;
      const venue = event.entities?.find(e => e.type === 'venue');

      return {
        id: `phq_${event.id}`,
        source: 'predicthq',
        source_id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start,
        end_time: event.end,
        venue_name: venue?.name,
        address: event.geo?.address?.formatted_address,
        city: event.geo?.address?.locality,
        state: event.geo?.address?.region,
        country: event.geo?.address?.country_code,
        lat: coords ? coords[1] : undefined, // PredictHQ uses [lng, lat]
        lng: coords ? coords[0] : undefined,
        category: CATEGORY_MAP[event.category] || 'other',
        image_url: undefined, // PredictHQ doesn't provide images
        url: undefined,
        price_min: undefined,
        price_max: undefined,
        currency: 'USD',
        popularity: event.local_rank || event.rank || 70,
        verified: true,
      };
    });
  } catch (error) {
    console.error('[Events] Error fetching PredictHQ events:', error);
    return [];
  }
}

// ============================================================================
// TAVVY COMMUNITY EVENTS
// ============================================================================

export async function fetchTavvyEvents(
  lat: number,
  lng: number,
  radiusMiles: number = 50,
  startDate?: string,
  endDate?: string
): Promise<TavvyEvent[]> {
  try {
    // Calculate bounding box
    const DEGREES_PER_MILE = 0.0145;
    const boxSize = radiusMiles * DEGREES_PER_MILE;

    let query = supabase
      .from('tavvy_events')
      .select('*')
      .eq('source', 'tavvy')
      .gte('lat', lat - boxSize)
      .lte('lat', lat + boxSize)
      .gte('lng', lng - boxSize)
      .lte('lng', lng + boxSize)
      .gte('start_time', startDate || new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(50);

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      // Silently handle missing table - this is expected if tavvy_events hasn't been created yet
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.log('[Events] tavvy_events table not found, skipping community events');
      } else {
        console.error('[Events] Error fetching Tavvy events:', error);
      }
      return [];
    }

    return (data || []).map((event): TavvyEvent => ({
      id: event.id,
      source: 'tavvy',
      source_id: event.source_id,
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      end_time: event.end_time,
      venue_name: event.venue_name,
      address: event.address,
      city: event.city,
      state: event.state,
      country: event.country,
      lat: event.lat,
      lng: event.lng,
      category: event.category,
      image_url: event.image_url,
      url: event.url,
      price_min: event.price_min,
      price_max: event.price_max,
      currency: event.currency || 'USD',
      popularity: event.verified ? 80 : 40,
      verified: event.verified,
    }));
  } catch (error) {
    console.error('[Events] Error fetching Tavvy events:', error);
    return [];
  }
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTimeBucket(dateStr: string): string {
  const date = new Date(dateStr);
  // Round to nearest 30 minutes
  const minutes = Math.floor(date.getMinutes() / 30) * 30;
  date.setMinutes(minutes, 0, 0);
  return date.toISOString();
}

function getGeoBucket(lat?: number, lng?: number): string {
  if (!lat || !lng) return 'unknown';
  // Round to 3 decimal places (~100m precision)
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  if (s1 === s2) return 1;
  
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

export function deduplicateEvents(events: TavvyEvent[]): TavvyEvent[] {
  const seen = new Map<string, TavvyEvent>();
  const result: TavvyEvent[] = [];

  for (const event of events) {
    // Generate canonical key for hard match
    const canonicalKey = `${normalizeTitle(event.title)}_${getTimeBucket(event.start_time)}_${getGeoBucket(event.lat, event.lng)}`;
    
    // Check for hard match
    if (seen.has(canonicalKey)) {
      const existing = seen.get(canonicalKey)!;
      // Keep the one with higher priority (Ticketmaster > PredictHQ > Tavvy)
      if ((event.popularity || 0) > (existing.popularity || 0)) {
        // Merge: keep best image/url/price
        const merged: TavvyEvent = {
          ...event,
          image_url: event.image_url || existing.image_url,
          url: event.url || existing.url,
          price_min: event.price_min ?? existing.price_min,
          price_max: event.price_max ?? existing.price_max,
          description: event.description || existing.description,
        };
        seen.set(canonicalKey, merged);
      }
      continue;
    }

    // Check for fuzzy match
    let isDuplicate = false;
    for (const [key, existing] of seen.entries()) {
      // Time within 30 minutes
      const timeDiff = Math.abs(
        new Date(event.start_time).getTime() - new Date(existing.start_time).getTime()
      );
      if (timeDiff > 30 * 60 * 1000) continue;

      // Location within 150 meters (~0.001 degrees)
      if (event.lat && event.lng && existing.lat && existing.lng) {
        const distance = calculateDistance(event.lat, event.lng, existing.lat, existing.lng);
        if (distance > 0.1) continue; // More than 0.1 miles apart
      }

      // Title similarity > 0.7
      if (stringSimilarity(event.title, existing.title) > 0.7) {
        isDuplicate = true;
        // Keep higher priority
        if ((event.popularity || 0) > (existing.popularity || 0)) {
          seen.set(key, {
            ...event,
            image_url: event.image_url || existing.image_url,
            url: event.url || existing.url,
          });
        }
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(canonicalKey, event);
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// RANKING
// ============================================================================

export function rankEvents(events: TavvyEvent[], userLat?: number, userLng?: number): TavvyEvent[] {
  const now = new Date();
  
  return events
    .map(event => {
      let score = event.popularity || 0;
      
      // Source priority
      if (event.source === 'ticketmaster') score += 100;
      else if (event.source === 'predicthq') score += 70;
      else if (event.verified) score += 80;
      else score += 40;
      
      // Time relevance (happening sooner = higher score)
      const eventDate = new Date(event.start_time);
      const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntil < 0) {
        // Already started but not ended
        score += 50;
      } else if (hoursUntil < 6) {
        score += 40; // Tonight
      } else if (hoursUntil < 24) {
        score += 30; // Tomorrow
      } else if (hoursUntil < 72) {
        score += 20; // This weekend
      }
      
      // Distance (closer = higher score)
      if (userLat && userLng && event.lat && event.lng) {
        const distance = calculateDistance(userLat, userLng, event.lat, event.lng);
        event.distance = distance;
        if (distance < 5) score += 30;
        else if (distance < 10) score += 20;
        else if (distance < 25) score += 10;
      }
      
      return { ...event, _score: score };
    })
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .map(({ _score, ...event }) => event as TavvyEvent);
}

// ============================================================================
// MAIN AGGREGATOR
// ============================================================================

export interface GetHappeningNowOptions {
  lat: number;
  lng: number;
  radiusMiles?: number;
  timeFilter?: 'tonight' | 'weekend' | 'week' | 'all';
  category?: string;
  limit?: number;
}

export async function getHappeningNowEvents(options: GetHappeningNowOptions): Promise<TavvyEvent[]> {
  const {
    lat,
    lng,
    radiusMiles = 50,
    timeFilter = 'all',
    category,
    limit = 50,
  } = options;

  // Calculate date range based on time filter
  const now = new Date();
  let startDate = now.toISOString().split('T')[0];
  let endDate: string | undefined;

  switch (timeFilter) {
    case 'tonight':
      endDate = startDate;
      break;
    case 'weekend':
      const daysUntilSunday = 7 - now.getDay();
      const sunday = new Date(now);
      sunday.setDate(sunday.getDate() + daysUntilSunday);
      endDate = sunday.toISOString().split('T')[0];
      break;
    case 'week':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      endDate = nextWeek.toISOString().split('T')[0];
      break;
    default:
      // 'all' - next 30 days
      const nextMonth = new Date(now);
      nextMonth.setDate(nextMonth.getDate() + 30);
      endDate = nextMonth.toISOString().split('T')[0];
  }

  console.log(`[Events] Fetching events: lat=${lat}, lng=${lng}, radius=${radiusMiles}mi, filter=${timeFilter}`);

  // Fetch from all providers in parallel
  const [ticketmasterEvents, predictHQEvents, tavvyEvents] = await Promise.all([
    fetchTicketmasterEvents(lat, lng, radiusMiles, startDate, endDate),
    fetchPredictHQEvents(lat, lng, radiusMiles, startDate, endDate),
    fetchTavvyEvents(lat, lng, radiusMiles, startDate, endDate),
  ]);

  console.log(`[Events] Fetched: TM=${ticketmasterEvents.length}, PHQ=${predictHQEvents.length}, Tavvy=${tavvyEvents.length}`);

  // Combine all events
  let allEvents = [...ticketmasterEvents, ...predictHQEvents, ...tavvyEvents];

  // Filter by category if specified
  if (category && category !== 'all') {
    allEvents = allEvents.filter(e => e.category === category);
  }

  // Deduplicate
  const dedupedEvents = deduplicateEvents(allEvents);
  console.log(`[Events] After dedup: ${dedupedEvents.length}`);

  // Rank and sort
  const rankedEvents = rankEvents(dedupedEvents, lat, lng);

  // Apply coverage fill logic
  // If Ticketmaster returns < 10 events, ensure we have at least 10 total
  const ticketmasterCount = rankedEvents.filter(e => e.source === 'ticketmaster').length;
  if (ticketmasterCount < 10 && rankedEvents.length < 10) {
    console.log(`[Events] Coverage fill: TM has ${ticketmasterCount}, total ${rankedEvents.length}`);
  }

  return rankedEvents.slice(0, limit);
}

// ============================================================================
// CACHING (Optional - for production)
// ============================================================================

export async function getCachedOrFetchEvents(options: GetHappeningNowOptions): Promise<TavvyEvent[]> {
  const cacheKey = `${Math.round(options.lat * 100)}_${Math.round(options.lng * 100)}_${options.radiusMiles}_${options.timeFilter}_${options.category || 'all'}`;
  
  // Check cache first
  const { data: cached } = await supabase
    .from('happening_now_cache')
    .select('events, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log('[Events] Returning cached events');
    return cached.events as TavvyEvent[];
  }

  // Fetch fresh data
  const events = await getHappeningNowEvents(options);

  // Cache the results
  const cacheTTL = options.timeFilter === 'tonight' ? 5 : 30; // minutes
  const expiresAt = new Date(Date.now() + cacheTTL * 60 * 1000);

  await supabase
    .from('happening_now_cache')
    .upsert({
      cache_key: cacheKey,
      geo_lat: options.lat,
      geo_lng: options.lng,
      radius_miles: options.radiusMiles || 50,
      time_filter: options.timeFilter || 'all',
      category_filter: options.category,
      events: events,
      ticketmaster_count: events.filter(e => e.source === 'ticketmaster').length,
      predicthq_count: events.filter(e => e.source === 'predicthq').length,
      tavvy_count: events.filter(e => e.source === 'tavvy').length,
      total_count: events.length,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'cache_key',
    });

  return events;
}
