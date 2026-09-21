const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  const toMin = (s: unknown): number | null => {
    if (typeof s === 'number') {
      // "0800" / 800 style HHMM
      const str = String(s).padStart(4, '0');
      const h = parseInt(str.slice(0, 2), 10), m = parseInt(str.slice(2), 10);
      return h <= 23 && m <= 59 ? h * 60 + m : null;
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
      if (h > 23 || mm > 59 || (ap && (parseInt(m[1], 10) < 1 || parseInt(m[1], 10) > 12))) return null;
      return h * 60 + mm;
    }
    const hhmm = t.match(/^(\d{2})(\d{2})$/);
    if (hhmm) { const h = Number(hhmm[1]), m = Number(hhmm[2]); return h <= 23 && m <= 59 ? h * 60 + m : null; }
    return null;
  };
  const pushSeg = (o: any, c: any) => {
    const a = toMin(o), b = toMin(c);
    if (a != null && b != null) out.push({ open: a, close: b });
  };
  if (cell == null) return out;
  if (typeof cell === 'string') {
    const s = cell.trim();
    if (/^open 24 hours$/i.test(s)) return [{ open: 0, close: 0 }];
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
export function parseHours(raw: any): { hoursList: Array<{ day: string; range: string }>; byDow: Record<number, Array<{ open: number; close: number }>> } {
  let h = raw;
  if (typeof h === 'string') {
    const t = h.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try { h = JSON.parse(t); } catch { /* keep as text */ }
    }
  }
  const byDow: Record<number, Array<{ open: number; close: number }>> = {};
  const hoursList: Array<{ day: string; range: string }> = [];
  const assign = (dow: number, value: unknown) => {
    const segments = parseRange(value);
    if (segments.length || (typeof value === 'string' && /^closed$/i.test(value.trim())) || (Array.isArray(value) && !value.length)) byDow[dow] = segments;
  };
  const dayKeys: Record<string, number> = {
    sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5, sat: 6, saturday: 6,
  };

  if (h && typeof h === 'object' && !Array.isArray(h)) {
    for (const k of Object.keys(h)) {
      const dow = dayKeys[k.toLowerCase()];
      if (dow == null) continue;
      assign(dow, h[k]);
    }
  } else if (Array.isArray(h)) {
    h.forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return;
      const dk = entry.day ?? entry.weekday ?? entry.name;
      const dow = typeof dk === 'number' ? dk % 7 : dayKeys[String(dk || '').toLowerCase()];
      if (dow == null) return;
      assign(dow, entry.range ?? entry.hours ?? entry);
    });
  } else if (typeof h === 'string') {
    // line-per-day text: "Monday: 9 AM - 8 PM"
    h.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z]+)\s*[:\-]\s*(.+)$/);
      if (!m) return;
      const dow = dayKeys[m[1].toLowerCase()];
      if (dow == null) return;
      assign(dow, m[2]);
    });
  }

  for (let d = 0; d < 7; d++) {
    const segs = byDow[d];
    let range = segs === undefined ? 'Hours unavailable' : 'Closed';
    if (segs && segs.length) range = segs.length === 1 && segs[0].open === 0 && segs[0].close === 0 ? 'Open 24 hours' : segs.map((s) => `${fmtTime(s.open)} – ${fmtTime(s.close)}`).join(', ');
    hoursList.push({ day: DAYS[d], range });
  }
  return { hoursList, byDow };
}

// An open/closed claim needs a complete schedule and the restaurant's timezone.
// A partial schedule remains useful to display, but must not imply it is closed.
export function openLineFrom(byDow: Record<number, Array<{ open: number; close: number }>>, timeZone?: string, now = new Date()): string {
  if (!timeZone || Object.keys(byDow).length !== 7) return '';
  const hasAny = Object.values(byDow).some((v) => v && v.length);
  if (!hasAny) return '';
  let dow: number, cur: number;
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const part = (type: string) => parts.find(value => value.type === type)?.value || '';
    dow = DAYS.indexOf(part('weekday'));
    cur = Number(part('hour')) * 60 + Number(part('minute'));
    if (dow < 0 || !Number.isFinite(cur)) return '';
  } catch { return ''; }
  for (const segment of byDow[(dow + 6) % 7] || []) {
    if (segment.close <= segment.open && cur < segment.close) return `Open till ${fmtTime(segment.close)}`;
  }
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

