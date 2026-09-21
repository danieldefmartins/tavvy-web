/** Shapes checked against the deployed edge source, not the older API document. */
export interface OwnerPlace { id: string; name: string; tavvy_category?: string; }
export interface OwnerSession { id: string; tavvy_place_id: string; session_lat: number; session_lng: number; session_address?: string | null; address_confirmed?: boolean; today_note?: string; scheduled_end_at: string; status: string; }
export function ownerCategory(category: string) {
  const primary = ['Food Trucks', 'Mobile Services', 'Pop-ups', 'Mobile Retail', 'Event Services', 'Mobile Health & Wellness', 'Mobile Pet Services', 'Mobile Entertainment'];
  if (primary.includes(category)) return { tavvy_category: category };
  return { tavvy_category: /Coffee|Ice Cream/.test(category) ? 'Food Trucks' : /Pet|Dog|Vet/.test(category) ? 'Mobile Pet Services' : /Massage/.test(category) ? 'Mobile Health & Wellness' : /DJ|Photo/.test(category) ? 'Mobile Entertainment' : 'Mobile Services', tavvy_subcategory: category };
}
export function parseOwnerData(data: any, now = Date.now()): { places: OwnerPlace[]; sessions: OwnerSession[] } {
  if (!data?.success || !Array.isArray(data.places)) throw new Error('Invalid owner response');
  const places = data.places.filter((p: any) => typeof p?.id === 'string' && typeof p.name === 'string');
  const ids = new Set(places.map((p: OwnerPlace) => p.id));
  const source = data.sessions || data.active_sessions;
  if (!Array.isArray(source)) throw new Error('Invalid owner sessions');
  const sessions = source.filter((s: any) => typeof s?.id === 'string' && ids.has(s.tavvy_place_id) && s.status === 'active' && Date.parse(s.scheduled_end_at) > now);
  return { places, sessions };
}
export function parseStartedSession(data: any): OwnerSession {
  const s = data?.session;
  if (!data?.success || typeof s?.id !== 'string' || typeof s.tavvy_place_id !== 'string' || !Number.isFinite(Date.parse(s.scheduled_end_at))) throw new Error('Session started but its response could not be read. Refresh your businesses to recover it.');
  return s;
}
