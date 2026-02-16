import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { card_id } = req.query;

  if (!card_id || typeof card_id !== 'string') {
    return res.status(400).json({ error: 'card_id is required' });
  }

  try {
    // 1. Endorsement geo breakdown by ZIP (self-reported)
    const { data: endorsementsByZip } = await supabase
      .from('ecard_endorsements')
      .select('endorser_zip, ip_zip, ip_city, ip_state, ip_country')
      .eq('card_id', card_id);

    // 2. Vote geo breakdown
    const { data: voteGeo } = await supabase.rpc('get_vote_geo_analytics', {
      p_card_id: card_id,
    }).catch(() => ({ data: null }));

    // Fallback: query directly if RPC doesn't exist
    let votesByZip: any[] = [];
    if (!voteGeo) {
      const { data: proposals } = await supabase
        .from('civic_proposals')
        .select('id')
        .eq('card_id', card_id);

      if (proposals && proposals.length > 0) {
        const proposalIds = proposals.map((p: any) => p.id);
        const { data: votes } = await supabase
          .from('civic_reactions')
          .select('voter_zip, ip_zip, ip_city, ip_state, ip_country, reaction_type')
          .in('proposal_id', proposalIds);
        votesByZip = votes || [];
      }
    } else {
      votesByZip = voteGeo;
    }

    // 3. Aggregate endorsement data by ZIP
    const endorsementZipMap: Record<string, {
      count: number;
      city: string;
      state: string;
      country: string;
    }> = {};

    const endorsementIpZipMap: Record<string, {
      count: number;
      city: string;
      state: string;
      country: string;
    }> = {};

    let endorsementMismatchCount = 0;
    let totalEndorsements = 0;

    (endorsementsByZip || []).forEach((e: any) => {
      totalEndorsements++;

      // Self-reported ZIP
      if (e.endorser_zip) {
        if (!endorsementZipMap[e.endorser_zip]) {
          endorsementZipMap[e.endorser_zip] = { count: 0, city: '', state: '', country: '' };
        }
        endorsementZipMap[e.endorser_zip].count++;
      }

      // IP-based ZIP
      if (e.ip_zip) {
        if (!endorsementIpZipMap[e.ip_zip]) {
          endorsementIpZipMap[e.ip_zip] = {
            count: 0,
            city: e.ip_city || '',
            state: e.ip_state || '',
            country: e.ip_country || '',
          };
        }
        endorsementIpZipMap[e.ip_zip].count++;
      }

      // Mismatch detection
      if (e.endorser_zip && e.ip_zip && e.endorser_zip !== e.ip_zip) {
        endorsementMismatchCount++;
      }
    });

    // 4. Aggregate vote data by ZIP
    const voteZipMap: Record<string, {
      count: number;
      support: number;
      needs_improvement: number;
      disagree: number;
      city: string;
      state: string;
      country: string;
    }> = {};

    const voteIpZipMap: Record<string, {
      count: number;
      city: string;
      state: string;
      country: string;
    }> = {};

    let voteMismatchCount = 0;
    let totalVotes = 0;

    (votesByZip || []).forEach((v: any) => {
      totalVotes++;

      if (v.voter_zip) {
        if (!voteZipMap[v.voter_zip]) {
          voteZipMap[v.voter_zip] = {
            count: 0, support: 0, needs_improvement: 0, disagree: 0,
            city: '', state: '', country: '',
          };
        }
        voteZipMap[v.voter_zip].count++;
        if (v.reaction_type === 'support') voteZipMap[v.voter_zip].support++;
        if (v.reaction_type === 'needs_improvement') voteZipMap[v.voter_zip].needs_improvement++;
        if (v.reaction_type === 'disagree') voteZipMap[v.voter_zip].disagree++;
      }

      if (v.ip_zip) {
        if (!voteIpZipMap[v.ip_zip]) {
          voteIpZipMap[v.ip_zip] = {
            count: 0,
            city: v.ip_city || '',
            state: v.ip_state || '',
            country: v.ip_country || '',
          };
        }
        voteIpZipMap[v.ip_zip].count++;
      }

      if (v.voter_zip && v.ip_zip && v.voter_zip !== v.ip_zip) {
        voteMismatchCount++;
      }
    });

    // 5. Aggregate by city/state for higher-level view
    const endorsementByCityState: Record<string, { count: number; city: string; state: string; country: string }> = {};
    (endorsementsByZip || []).forEach((e: any) => {
      const key = `${e.ip_city || 'Unknown'}|${e.ip_state || 'Unknown'}`;
      if (!endorsementByCityState[key]) {
        endorsementByCityState[key] = {
          count: 0,
          city: e.ip_city || 'Unknown',
          state: e.ip_state || 'Unknown',
          country: e.ip_country || 'Unknown',
        };
      }
      endorsementByCityState[key].count++;
    });

    const voteByCityState: Record<string, { count: number; city: string; state: string; country: string }> = {};
    (votesByZip || []).forEach((v: any) => {
      const key = `${v.ip_city || 'Unknown'}|${v.ip_state || 'Unknown'}`;
      if (!voteByCityState[key]) {
        voteByCityState[key] = {
          count: 0,
          city: v.ip_city || 'Unknown',
          state: v.ip_state || 'Unknown',
          country: v.ip_country || 'Unknown',
        };
      }
      voteByCityState[key].count++;
    });

    // 6. Format response
    const formatMap = (map: Record<string, any>) =>
      Object.entries(map)
        .map(([zip, data]) => ({ zip, ...data }))
        .sort((a, b) => b.count - a.count);

    const formatCityState = (map: Record<string, any>) =>
      Object.values(map).sort((a: any, b: any) => b.count - a.count);

    return res.status(200).json({
      endorsements: {
        total: totalEndorsements,
        byZip: formatMap(endorsementZipMap),
        byIpZip: formatMap(endorsementIpZipMap),
        byCityState: formatCityState(endorsementByCityState),
        mismatchCount: endorsementMismatchCount,
        mismatchRate: totalEndorsements > 0
          ? Math.round((endorsementMismatchCount / totalEndorsements) * 100)
          : 0,
      },
      votes: {
        total: totalVotes,
        byZip: formatMap(voteZipMap),
        byIpZip: formatMap(voteIpZipMap),
        byCityState: formatCityState(voteByCityState),
        mismatchCount: voteMismatchCount,
        mismatchRate: totalVotes > 0
          ? Math.round((voteMismatchCount / totalVotes) * 100)
          : 0,
      },
      summary: {
        totalEndorsements,
        totalVotes,
        totalMismatches: endorsementMismatchCount + voteMismatchCount,
        overallMismatchRate:
          totalEndorsements + totalVotes > 0
            ? Math.round(
                ((endorsementMismatchCount + voteMismatchCount) /
                  (totalEndorsements + totalVotes)) *
                  100
              )
            : 0,
      },
    });
  } catch (error: any) {
    console.error('Geo analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
