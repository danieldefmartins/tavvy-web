import type { NextApiRequest, NextApiResponse } from 'next';
import { contentViewer } from '../../../../lib/contentSafetyServer';

const categories: Record<string, 'good' | 'vibe' | 'headsup'> = { best_for: 'good', vibe: 'vibe', heads_up: 'headsup' };
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary','Authorization');
  const {client:supabase,error:authError}=await contentViewer(req);
  if(authError)return res.status(401).json({error:'Please sign in again to load your review feed.'});
  const identifier = String(req.query.id || '').replace(/^(tavvy:|places-)/, '');
  const page = Math.max(0, Math.min(1000000, Math.floor(Number(req.query.page) || 0)));
  const { data: place, error: placeError } = await supabase.from('places').select('id,name')
    .eq(isUuid(identifier) ? 'id' : 'slug', identifier).maybeSingle();
  if (placeError) return res.status(500).json({ error: 'Could not load place' });
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const { data: history, error: historyError } = await supabase.rpc('get_place_review_history', {
    p_place_id: place.id, p_offset: page * 20, p_limit: 20,
  });
  if (!historyError) {
    if (!history || !Array.isArray(history.reviews) || !Number.isFinite(history.total)) return res.status(503).json({ error: 'Review history is temporarily unavailable' });
    const users = [...new Set<string>(history.reviews.map((review: any) => review.user_id).filter(Boolean))];
    const { data: profiles } = users.length ? await supabase.from('profiles')
      .select('user_id,display_name,username').in('user_id', users) : { data: [] as any[] };
    const names = new Map((profiles || []).map(profile => [profile.user_id, profile.display_name || profile.username || 'Tavvy member']));
    return res.status(200).json({ place, total: history.total, page, includesRevisions: true,
      reviews: history.reviews.map((review: any) => ({
        id: review.id, reviewId: review.review_id, date: review.visited_at,
        dateSource: review.date_source, recordedAt: review.recorded_at, isEdit: review.is_edit,
        name: names.get(review.user_id) || 'Tavvy member', note: review.public_note || null,
        signals: (Array.isArray(review.signals) ? review.signals : []).filter((signal: any) => ['good','vibe','headsup'].includes(signal.category)).map((signal: any) => ({ label: signal.label, category: signal.category })),
      })),
    });
  }
  // Read-only compatibility while an older backend awaits the additive migration.
  if (!['PGRST202', '42883'].includes(historyError.code)) return res.status(503).json({ error: 'Review history is temporarily unavailable' });
  const { data: reviews, error, count } = await supabase.from('place_reviews')
    .select('id,user_id,created_at,public_note', { count: 'exact' })
    .eq('place_id', place.id).eq('status', 'live').order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(page * 20, page * 20 + 19);
  if (error) return res.status(500).json({ error: 'Could not load reviews' });
  const ids = (reviews || []).map(r => r.id);
  const { data: taps, error: tapsError } = ids.length ? await supabase.from('place_review_signal_taps')
    .select('review_id,signal_id').in('review_id', ids) : { data: [], error: null };
  if (tapsError) return res.status(500).json({ error: 'Could not load review signals' });
  const signalIds = [...new Set((taps || []).map(t => t.signal_id))];
  const { data: definitions, error: definitionsError } = signalIds.length ? await supabase.from('review_items')
    .select('id,label,signal_type').in('id', signalIds) : { data: [], error: null };
  if (definitionsError) return res.status(500).json({ error: 'Could not load signal labels' });
  const bySignal = new Map((definitions || []).map(d => [d.id, d]));
  const users = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
  const { data: profiles } = users.length ? await supabase.from('profiles')
    .select('user_id,display_name,username').in('user_id', users) : { data: [] as any[] };
  const byUser = new Map((profiles || []).map(p => [p.user_id, p.display_name || p.username || 'Tavvy member']));
  return res.status(200).json({ place: { id: place.id, name: place.name }, total: count || 0, page,
    reviews: (reviews || []).map(review => ({
      id: review.id, reviewId: review.id, date: review.created_at, name: byUser.get(review.user_id) || 'Tavvy member',
      note: review.public_note || null,
      signals: (taps || []).filter(t => t.review_id === review.id).map(t => {
        const def = bySignal.get(t.signal_id);
        return def && categories[def.signal_type] ? { label: def.label, category: categories[def.signal_type] } : null;
      }).filter(Boolean),
    })),
  });
}
