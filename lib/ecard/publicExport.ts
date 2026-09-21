/** Public exports never expose draft cards or privately hidden contact fields. */
export function publicExportCard(card: any): any | null {
  if (!card || card.is_published !== true || card.is_active !== true) return null;
  if (card.show_contact_info !== false) return card;
  return { ...card, phone: null, email: null, website: null, address_1: null, address_2: null, city: null, state: null, zip_code: null, country: null };
}
export function escapeVCard(value: unknown): string {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
export function buildPublicVCard(card: any): string {
  const c = publicExportCard(card);
  if (!c) throw new Error('Card is not public');
  const parts = String(c.full_name || '').trim().split(/\s+/);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(c.full_name)}`, `N:${escapeVCard(parts.slice(1).join(' '))};${escapeVCard(parts[0])};;;`];
  for (const [key, value] of [['TITLE',c.title],['ORG',c.company],['TEL;TYPE=CELL',c.phone],['EMAIL;TYPE=INTERNET',c.email],['NOTE',c.bio]]) {
    if (value) lines.push(`${key}:${escapeVCard(value)}`);
  }
  if (c.website) {
    const url = /^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`;
    lines.push(`URL:${escapeVCard(url)}`);
  }
  if (c.address_1 || c.city || c.state) lines.push(`ADR;TYPE=WORK:;;${escapeVCard([c.address_1,c.address_2].filter(Boolean).join(' '))};${escapeVCard(c.city)};${escapeVCard(c.state)};${escapeVCard(c.zip_code)};${escapeVCard(c.country)}`);
  lines.push(`URL:https://tavvy.com/${encodeURIComponent(c.slug)}`);
  if (c.show_social_icons !== false && Array.isArray(c.featured_socials)) {
    for (const social of c.featured_socials) {
      if (!social || typeof social !== 'object' || typeof social.url !== 'string') continue;
      const platform = String(social.platformId || social.platform || 'social').replace(/[^a-zA-Z0-9_-]/g,'');
      if (/^https?:\/\//i.test(social.url)) lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${escapeVCard(social.url)}`);
    }
  }
  // No arbitrary server-side image fetch; a photo is optional for contact import.
  return [...lines,'END:VCARD',''].join('\r\n');
}
