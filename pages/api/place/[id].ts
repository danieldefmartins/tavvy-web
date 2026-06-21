import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// bucket (stored on aggregates) -> Tavvy category
const BUCKET: Record<string, 'good' | 'vibe' | 'headsup'> = {
  positive: 'good', neutral: 'vibe', negative: 'headsup',
};

// review_items.signal_type -> Tavvy category (taps carry no bucket of their own)
const SIGNAL_TYPE_CAT: Record<string, 'good' | 'vibe' | 'headsup'> = {
  best_for: 'good', vibe: 'vibe', heads_up: 'headsup',
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "2026-05-29T..." or Date -> "2 days ago" style relative string
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  const w = Math.floor(d / 7);
  if (d < 30) return `${w} week${w === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (d < 365) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function fmtTime(min: number): string {
  let h = Math.floor(min / 60), m = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return m === 0 ? `${h} ${ap}` : `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

// Accepts a single "range" cell which may be a string ("9:00 AM - 8:00 PM"),
// an array of {open,close} segments, or an object {open,close}. Returns minutes-from-midnight pairs.
function parseRange(cell: any): Array<{ open: number; close: number }> {
  const out: Array<{ open: number; close: number }> = [];
  const toMin = (s: string): number | null => {
    if (typeof s === 'number') {
      // "0800" / 800 style HHMM
      const str = String(s).padStart(4, '0');
      return parseInt(str.slice(0, 2), 10) * 60 + parseInt(str.slice(2), 10);
    }
    if (typeof s !== 'string') return null;
    const t = s.trim();
    const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const mm = m[2] ? parseInt(m[2], 10) : 0;
      const ap = (m[3] || '').toLowerCase();
      if (ap.startsWith('p') && h < 12) h += 12;
      if (ap.startsWith('a') && h === 12) h = 0;
      return h * 60 + mm;
    }
    const hhmm = t.match(/^(\d{2})(\d{2})$/);
    if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
    return null;
  };
  const pushSeg = (o: any, c: any) => {
    const a = toMin(o), b = toMin(c);
    if (a != null && b != null) out.push({ open: a, close: b });
  };
  if (cell == null) return out;
  if (typeof cell === 'string') {
    const s = cell.trim();
    if (/closed/i.test(s)) return out;
    // split multiple segments on comma/semicolon/&
    s.split(/[,;&]| and /i).forEach((part) => {
      const m = part.match(/(\d{1,2}(?::\d{2})?\s*[ap]?\.?m?\.?)\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?\s*[ap]?\.?m?\.?)/i);
      if (m) pushSeg(m[1], m[2]);
    });
    return out;
  }
  if (Array.isArray(cell)) {
    cell.forEach((seg) => {
      if (seg && typeof seg === 'object') pushSeg(seg.open ?? seg.start ?? seg.from, seg.close ?? seg.end ?? seg.to);
      else parseRange(seg).forEach((r) => out.push(r));
    });
    return out;
  }
  if (typeof cell === 'object') pushSeg(cell.open ?? cell.start ?? cell.from, cell.close ?? cell.end ?? cell.to);
  return out;
}

// Normalize the raw `hours` column into { hoursList:[{day,range}], byDow:{0..6:[{open,close}]} }
function parseHours(raw: any): { hoursList: Array<{ day: string; range: string }>; byDow: Record<number, Array<{ open: number; close: number }>> } {
  let h = raw;
  if (typeof h === 'string') {
    const t = h.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try { h = JSON.parse(t); } catch { /* keep as text */ }
    }
  }
  const byDow: Record<number, Array<{ open: number; close: number }>> = {};
  const hoursList: Array<{ day: string; range: string }> = [];
  const dayKeys: Record<string, number> = {
    sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5, sat: 6, saturday: 6,
  };

  if (h && typeof h === 'object' && !Array.isArray(h)) {
    for (const k of Object.keys(h)) {
      const dow = dayKeys[k.toLowerCase()];
      if (dow == null) continue;
      byDow[dow] = parseRange(h[k]);
    }
  } else if (Array.isArray(h)) {
    h.forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return;
      const dk = entry.day ?? entry.weekday ?? entry.name;
      const dow = typeof dk === 'number' ? dk % 7 : dayKeys[String(dk || '').toLowerCase()];
      if (dow == null) return;
      byDow[dow] = parseRange(entry.range ?? entry.hours ?? entry);
    });
  } else if (typeof h === 'string') {
    // line-per-day text: "Monday: 9 AM - 8 PM"
    h.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z]+)\s*[:\-]\s*(.+)$/);
      if (!m) return;
      const dow = dayKeys[m[1].toLowerCase()];
      if (dow == null) return;
      byDow[dow] = parseRange(m[2]);
    });
  }

  for (let d = 0; d < 7; d++) {
    const segs = byDow[d];
    let range = 'Closed';
    if (segs && segs.length) range = segs.map((s) => `${fmtTime(s.open)} – ${fmtTime(s.close)}`).join(', ');
    hoursList.push({ day: DAYS[d], range });
  }
  return { hoursList, byDow };
}

// Compute "Open till 8:00 PM" / "Closed · opens 7 AM" from parsed hours, in the place's local-ish frame (server time).
function openLineFrom(byDow: Record<number, Array<{ open: number; close: number }>>): string {
  const hasAny = Object.values(byDow).some((v) => v && v.length);
  if (!hasAny) return '';
  const now = new Date();
  const dow = now.getDay();
  const cur = now.getHours() * 60 + now.getMinutes();
  const today = byDow[dow] || [];
  for (const s of today) {
    // handle overnight (close <= open means spills to next day)
    const close = s.close <= s.open ? s.close + 1440 : s.close;
    if (cur >= s.open && cur < close) return `Open till ${fmtTime(s.close)}`;
  }
  // not open now -> find next opening today, then upcoming days
  const todayNext = today.filter((s) => s.open > cur).sort((a, b) => a.open - b.open)[0];
  if (todayNext) return `Closed · opens ${fmtTime(todayNext.open)}`;
  for (let i = 1; i <= 7; i++) {
    const d = (dow + i) % 7;
    const segs = (byDow[d] || []).slice().sort((a, b) => a.open - b.open);
    if (segs.length) {
      const label = i === 1 ? 'tomorrow' : DAYS[d];
      return `Closed · opens ${label} ${fmtTime(segs[0].open)}`;
    }
  }
  return '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  // Links across the app use several id forms: raw uuid, slug, tavvy:<uuid>, places-<uuid>, fsq-<id>, fsq:<id>
  const rawId = String(req.query.id || '');
  const isFsq = /^fsq[-:]/.test(rawId);
  const raw = rawId.replace(/^(tavvy:|places-|fsq[-:])/, '');
  if (!raw) return res.status(400).json({ error: 'missing id' });

  try {
    // FSQ (Foursquare) places aren't in the Tavvy `places` table — resolve them
    // from fsq_places_raw and render with no signals ("Be the first").
    if (isFsq || (!isUuid(raw) && /^[0-9a-f]{24}$/i.test(raw))) {
      const { data: f } = await supabase.from('fsq_places_raw').select('*').eq('fsq_place_id', raw).maybeSingle();
      if (f) {
        const rawCat = Array.isArray(f.fsq_category_labels) ? f.fsq_category_labels[0] : f.fsq_category_labels;
        const cat = rawCat ? String(rawCat).replace(/[\[\]']/g, '').split('>')[0].trim() : 'Place';
        return res.status(200).json({
          place: {
            id: rawId, name: f.name, category: cat, subcategory: undefined,
            street: f.address, city: f.locality, region: f.region, country: f.country,
            phone: f.tel, website: f.website, email: f.email,
            cover_image_url: null, photos: null, description: null,
            latitude: f.latitude, longitude: f.longitude,
          },
          groups: { good: [], vibe: [], headsup: [] }, totalTaps: 0, reviewCount: 0,
        });
      }
      return res.status(404).json({ error: 'not found' });
    }

    // Resolve by UUID id, else by slug (never .or(id.eq.slug) — that crashes on uuid columns)
    let q = supabase.from('places').select('*').limit(1);
    q = isUuid(raw) ? q.eq('id', raw) : q.eq('slug', raw);
    const { data: place, error } = await q.maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!place) return res.status(404).json({ error: 'not found' });

    // Aggregated signals for this place, joined to the signal catalog (review_items)
    const { data: aggs } = await supabase
      .from('place_signal_aggregates')
      .select('signal_id, bucket, tap_total, review_count')
      .eq('place_id', place.id)
      .order('tap_total', { ascending: false });

    const ids = [...new Set((aggs || []).map(a => a.signal_id))];
    let items: Record<string, any> = {};
    if (ids.length) {
      const { data: ri } = await supabase
        .from('review_items')
        .select('id, slug, label, icon_emoji, signal_type, category')
        .in('id', ids);
      (ri || []).forEach(r => { items[r.id] = r; });
    }

    const groups: Record<'good' | 'vibe' | 'headsup', any[]> = { good: [], vibe: [], headsup: [] };
    let totalTaps = 0;
    for (const a of aggs || []) {
      const cat = BUCKET[a.bucket];
      const def = items[a.signal_id];
      if (!cat || !def) continue;
      totalTaps += a.tap_total || 0;
      groups[cat].push({ label: def.label, emoji: def.icon_emoji || '', tapCount: a.tap_total, category: cat });
    }

    // ---- hours / open status (resilient) ----
    let hoursList: Array<{ day: string; range: string }> = [];
    let openLine = '';
    try {
      if (place.hours != null && place.hours !== '') {
        const parsed = parseHours(place.hours);
        hoursList = parsed.hoursList;
        openLine = openLineFrom(parsed.byDow);
      }
    } catch { hoursList = []; openLine = ''; }

    // ---- photos (place_photos: place_id, url, caption) ----
    let gallery: string[] = [];
    try {
      const { data: ph } = await supabase
        .from('place_photos')
        .select('url, caption, created_at')
        .eq('place_id', place.id)
        .order('created_at', { ascending: false })
        .limit(10);
      gallery = (ph || []).map((p: any) => p.url).filter(Boolean);
    } catch { gallery = []; }

    // ---- recent reviews (reconstruct each person's review from their signal taps) ----
    let recentReviews: Array<{
      initial: string; name: string; when: string;
      signals: Array<{ label: string; category: 'good' | 'vibe' | 'headsup' }>;
    }> = [];
    try {
      const { data: taps } = await supabase
        .from('place_review_signal_taps')
        .select('review_id, signal_id, created_at')
        .eq('place_id', place.id)
        .order('created_at', { ascending: false })
        .limit(60);

      if (taps && taps.length) {
        // signal catalog for these taps (label + signal_type -> category)
        const sigIds = [...new Set(taps.map((t: any) => t.signal_id))];
        const sigMap: Record<string, { label: string; category: 'good' | 'vibe' | 'headsup' }> = {};
        if (sigIds.length) {
          const { data: sigs } = await supabase
            .from('review_items')
            .select('id, label, signal_type')
            .in('id', sigIds);
          (sigs || []).forEach((s: any) => {
            const cat = SIGNAL_TYPE_CAT[s.signal_type];
            if (cat) sigMap[s.id] = { label: s.label, category: cat };
          });
        }

        // group taps by review_id, newest review first
        const order: string[] = [];
        const byReview: Record<string, { created_at: string; signals: Array<{ label: string; category: 'good' | 'vibe' | 'headsup' }>; seen: Set<string> }> = {};
        for (const t of taps as any[]) {
          if (!byReview[t.review_id]) {
            byReview[t.review_id] = { created_at: t.created_at, signals: [], seen: new Set() };
            order.push(t.review_id);
          }
          const sig = sigMap[t.signal_id];
          const bucket = byReview[t.review_id];
          if (sig && !bucket.seen.has(t.signal_id)) {
            bucket.seen.add(t.signal_id);
            bucket.signals.push(sig);
          }
        }

        const topReviewIds = order.slice(0, 6);

        // resolve reviewer names: place_reviews.user_id -> profiles.display_name/username
        const nameByReview: Record<string, string> = {};
        try {
          const { data: revs } = await supabase
            .from('place_reviews')
            .select('id, user_id')
            .in('id', topReviewIds);
          const userByReview: Record<string, string> = {};
          const userIds = new Set<string>();
          (revs || []).forEach((r: any) => { if (r.user_id) { userByReview[r.id] = r.user_id; userIds.add(r.user_id); } });
          if (userIds.size) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('user_id, display_name, username')
              .in('user_id', [...userIds]);
            const dnByUser: Record<string, string> = {};
            (profs || []).forEach((p: any) => { dnByUser[p.user_id] = p.display_name || p.username || ''; });
            Object.entries(userByReview).forEach(([rid, uid]) => {
              const dn = (dnByUser[uid] || '').trim();
              if (dn && !/agent|system/i.test(dn)) nameByReview[rid] = dn;
            });
          }
        } catch { /* names optional */ }

        recentReviews = topReviewIds
          .map((rid) => {
            const r = byReview[rid];
            if (!r || !r.signals.length) return null;
            const name = nameByReview[rid] || 'Tavvy member';
            const initial = (name.replace(/[^A-Za-z]/g, '')[0] || 'T').toUpperCase();
            return { initial, name, when: relativeTime(r.created_at), signals: r.signals };
          })
          .filter(Boolean) as typeof recentReviews;
      }
    } catch { recentReviews = []; }

    return res.status(200).json({
      place: {
        id: place.id, slug: place.slug, name: place.name,
        category: place.tavvy_category, subcategory: place.tavvy_subcategory,
        street: place.street, city: place.city, region: place.region, country: place.country,
        phone: place.phone, whatsapp: place.whatsapp_number, website: place.website, email: place.email,
        instagram: place.instagram, tiktok: place.tiktok, youtube: place.youtube, facebook: place.facebook,
        cover_image_url: place.cover_image_url || (gallery.length ? gallery[0] : null), photos: place.photos,
        description: place.description || place.short_description, hours: place.hours,
        ordering_enabled: place.ordering_enabled,
        latitude: place.latitude, longitude: place.longitude,
        // new fields
        hoursList, openLine, gallery,
      },
      groups,
      totalTaps,
      reviewCount: (aggs || []).reduce((m, a) => Math.max(m, a.review_count || 0), 0),
      recentReviews,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
