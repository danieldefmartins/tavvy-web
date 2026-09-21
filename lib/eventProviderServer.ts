/** Server-only allowlisted provider lookup. Never trusts a client event title. */
import type { TavvyEvent } from './eventsService';
export async function fetchVerifiedProviderEvent(identifier: string, fetcher: typeof fetch = fetch): Promise<TavvyEvent> {
  const match = /^(tm|phq)_([A-Za-z0-9_-]{1,200})$/.exec(identifier);
  if (!match) throw new Error('Unsupported event identifier.');
  const [, provider, id] = match;
  const key = provider === 'tm' ? process.env.TICKETMASTER_API_KEY || process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY : process.env.PREDICTHQ_API_KEY || process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY;
  if (!key) throw new Error('This event provider is not configured.');
  const url = provider === 'tm' ? `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(id)}.json?apikey=${encodeURIComponent(key)}` : `https://api.predicthq.com/v1/events/?id=${encodeURIComponent(id)}&limit=1`;
  const response = await fetcher(url, { headers: provider === 'phq' ? { Authorization: `Bearer ${key}`, Accept: 'application/json' } : { Accept: 'application/json' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new Error('The event provider could not verify this event.');
  const payload = await response.json();
  const event = provider === 'tm' ? payload : payload.results?.find((row: any) => row.id === id);
  if (event?.id !== id || typeof (event.name || event.title) !== 'string') throw new Error('The event provider did not return this event.');
  if (provider === 'tm') {
    const venue = event._embedded?.venues?.[0], price = event.priceRanges?.[0];
    return { id: identifier, source: 'ticketmaster', source_id: id, title: event.name, description: event.description || event.info,
      start_time: event.dates?.start?.dateTime || '', end_time: event.dates?.end?.dateTime, venue_name: venue?.name,
      address: venue?.address?.line1, city: venue?.city?.name, state: venue?.state?.stateCode, country: venue?.country?.countryCode,
      lat: venue?.location?.latitude ? Number(venue.location.latitude) : undefined, lng: venue?.location?.longitude ? Number(venue.location.longitude) : undefined,
      image_url: event.images?.find((image: any) => image.width >= 500)?.url || event.images?.[0]?.url, url: event.url,
      price_min: price?.min, price_max: price?.max, currency: price?.currency };
  }
  const coords = event.location || event.geo?.geometry?.coordinates, address = event.geo?.address;
  return { id: identifier, source: 'predicthq', source_id: id, title: event.title, description: event.description, start_time: event.start, end_time: event.end,
    venue_name: event.entities?.find((entity: any) => entity.type === 'venue')?.name, address: address?.formatted_address,
    city: address?.locality, state: address?.region, country: address?.country_code, lat: coords?.[1], lng: coords?.[0], category: event.category };
}
