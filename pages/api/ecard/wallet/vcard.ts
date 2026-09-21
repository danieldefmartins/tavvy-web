import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildPublicVCard, publicExportCard } from '../../../../lib/ecard/publicExport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { slug, cardId } = req.query;
  if ((slug && typeof slug !== 'string') || (cardId && typeof cardId !== 'string') || (!slug && !cardId)) return res.status(400).json({ error: 'A single slug or cardId is required' });
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    let query = client.from('digital_cards').select('*').eq('is_published', true).eq('is_active', true);
    query = slug ? query.eq('slug', slug) : query.eq('id', cardId);
    const { data, error } = await query.single();
    const card = publicExportCard(data);
    if (error || !card) return res.status(404).json({ error: 'Card not found' });
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${String(card.slug || 'contact').replace(/[^a-zA-Z0-9_-]/g,'_')}.vcf"`);
    return res.status(200).send(buildPublicVCard(card));
  } catch { return res.status(500).json({ error: 'Could not generate contact file. Please retry.' }); }
}
