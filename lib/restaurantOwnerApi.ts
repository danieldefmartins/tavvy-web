import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getRestaurantWorkspace, isPlaceId, linkRestaurantCard, OWNER_CLAIM_COLUMNS, saveRestaurantDetails, submitRestaurantClaim, validateRestaurantClaim, validateRestaurantDetails } from './restaurantOwner';

/** User-scoped client only: these endpoints never receive a service-role key. */
export function restaurantOwnerApi(kind: 'claims' | 'workspace', clientFactory = createClient) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    const allowed = kind === 'claims' ? ['GET', 'POST'] : ['GET', 'PATCH'];
    if (!allowed.includes(req.method || '')) { res.setHeader('Allow', allowed.join(', ')); return res.status(405).json({ error: 'Method not allowed' }); }
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    try {
      const db = clientFactory(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
      const { data: { user }, error: authError } = await db.auth.getUser(token);
      if (authError || !user) return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
      if (kind === 'claims') {
        if (req.method === 'GET') {
          const { data, error } = await db.from('pro_business_claims').select(OWNER_CLAIM_COLUMNS).eq('user_id', user.id).eq('claim_kind', 'restaurant').order('created_at', { ascending: false }).limit(50);
          if (error) throw error;
          return res.status(200).json({ claims: data });
        }
        let input;
        try { input = validateRestaurantClaim(req.body); } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
        const claim = await submitRestaurantClaim(db, input);
        return res.status(200).json({ claim });
      }
      const placeId = req.query.placeId;
      if (!isPlaceId(placeId)) return res.status(400).json({ error: 'Choose an existing restaurant.' });
      const workspace = await getRestaurantWorkspace(db, placeId);
      if (req.method === 'GET') return res.status(200).json(workspace);
      if (!workspace.canManage) return res.status(403).json({ error: 'Verified ownership is required.' });
      if (req.body?.cardId) {
        if (!isPlaceId(req.body.cardId)) return res.status(400).json({ error: 'Choose a valid eCard.' });
        await linkRestaurantCard(db, placeId, req.body.cardId);
      } else {
        let details;
        try { details = validateRestaurantDetails(req.body); } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
        await saveRestaurantDetails(db, placeId, details);
      }
      return res.status(200).json({ saved: true });
    } catch { return res.status(503).json({ error: 'The restaurant service is unavailable. Please try again. No change has been confirmed.' }); }
  };
}
