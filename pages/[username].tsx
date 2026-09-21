import { readECardLinks } from '../lib/ecard/linkPersistence';
/** Public eCard SSR: data access stays here; the same view renders studio previews. */
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { resolveTemplateId } from '../config/eCardTemplates';
import { mapPublicCard } from '../lib/ecard/publicCardMapping';
import type { CardData, PageProps } from '../lib/ecard/publicCardTypes';
import PublicCardView from '../components/ecard/PublicCardView';
import PublicCardUnavailable from '../components/ecard/PublicCardUnavailable';
import { lookupPublicCard, PUBLIC_CARD_UNAVAILABLE, setPublicCardErrorStatus } from '../lib/ecard/publicLookup';

export default function PublicCardPage(props: PageProps) {
  return props.error === PUBLIC_CARD_UNAVAILABLE ? <PublicCardUnavailable /> : <PublicCardView {...props} />;
}

// Server-side data fetching
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { username } = context.params as { username: string };
  const slug = username; // For compatibility with existing code
  
  // Reserved usernames that should not be treated as card slugs
  const RESERVED_ROUTES = [
    'home', 'login', 'signup', 'register', 'logout', 'auth', 'api', 'admin', 'dashboard',
    'pros', 'atlas', 'universe', 'universes', 'explore', 'discover', 'search', 'places',
    'cities', 'rides', 'realtors', 'wallet', 'apps', 'menu', 'settings', 'profile', 'account',
    'card', 'cards', 'ecard', 'ecards', 'c', 'create', 'edit', 'preview', 'templates', 'themes',
    'shop', 'store', 'marketplace', 'events', 'tickets', 'booking', 'bookings', 'jobs', 'careers',
    'blog', 'news', 'help', 'support', 'contact', 'about', 'about-us', 'terms', 'privacy', 'legal',
    'faq', 'pricing', 'plans', 'premium', 'pro', 'business', 'enterprise',
    'tavvy', 'tavvyapp', 'official', 'verified', 'team', 'staff', 'moderator', 'mod',
    'www', 'mail', 'email', 'ftp', 'cdn', 'static', 'assets', 'images', 'img', 'files',
    'uploads', 'download', 'downloads', 'place', 'app', '_next', 'favicon.ico'
  ];
  
  // Check if this is a reserved route
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return {
      notFound: true,
    };
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  console.log('[Card SSR] Fetching card:', slug);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Card SSR] Missing Supabase credentials');
    setPublicCardErrorStatus(context.res, true);
    return {
      props: {
        cardData: null,
        error: PUBLIC_CARD_UNAVAILABLE,
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  }
  
  try {
    const serverSupabase = createClient(supabaseUrl, supabaseKey);
    
    const lookup = await lookupPublicCard(serverSupabase, slug, context.req.headers.host || '');
    if (lookup.kind === 'place') {
      return { redirect: { destination: `/place/${lookup.placeId}`, permanent: false } };
    }
    if (lookup.kind === 'unavailable' || lookup.kind === 'missing') {
      const unavailable = lookup.kind === 'unavailable';
      setPublicCardErrorStatus(context.res, unavailable);
      if (unavailable) console.error('[Card SSR] Public lookup unavailable:', lookup.stage, lookup.code);
      return {
        props: {
          cardData: null,
          error: unavailable ? PUBLIC_CARD_UNAVAILABLE : 'Card not found',
          ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
        },
      };
    }
    const data = lookup.card;
    
    console.log('[Card SSR] Card found:', data.full_name);
    
    // Fetch links from digital_card_links (primary) and card_links (legacy fallback)
    let linksData: any[] = [];
    const digitalLinksData = await readECardLinks(serverSupabase, data.id);
    
    if (digitalLinksData && digitalLinksData.length > 0) {
      linksData = digitalLinksData;
    } else {
      // Fallback to legacy card_links table
      const { data: legacyLinksData } = await serverSupabase
        .from('card_links')
        .select('*')
        .eq('card_id', data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      linksData = legacyLinksData || [];
    }
    
    // Increment view count atomically (skip for preview mode)
    if (context.query.preview !== '1') {
      serverSupabase
        .rpc('increment_card_view', { card_id: data.id })
        .then(() => {});
    }

    // Fetch endorsement data
    let endorsementCount = 0;
    let topEndorsementTags: { label: string; emoji: string; count: number }[] = [];
    let recentEndorsements: { endorserName: string; note: string; createdAt: string }[] = [];
    let endorsementSignals: { id: string; label: string; emoji: string; category: string }[] = [];

    try {
      // Get endorsement count and top signal tags
      // For business cards with a linked place, combine ecard endorsements + place review "The Good" signals
      const tagCounts: Record<string, { label: string; emoji: string; count: number }> = {};

      // Source 1: ecard endorsement signals (always)
      const { count: ecardSignalCount } = await serverSupabase
        .from('ecard_endorsement_signals')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', data.id);

      const { data: ecardSignalTaps } = await serverSupabase
        .from('ecard_endorsement_signals')
        .select('signal_id, review_items(label, icon_emoji)')
        .eq('card_id', data.id);

      (ecardSignalTaps || []).forEach((tap: any) => {
        const ri = tap.review_items;
        if (ri) {
          if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '⭐', count: 0 };
          tagCounts[tap.signal_id].count++;
        }
      });

      // Source 2: place review signal taps (only for business cards with linked place)
      let placeSignalCount = 0;
      if (data.place_id) {
        // Get place review signal taps that were NOT sourced from ecard endorsements (to avoid double count)
        const { count: pCount } = await serverSupabase
          .from('place_review_signal_taps')
          .select('*, place_reviews!inner(source)', { count: 'exact', head: true })
          .eq('place_id', data.place_id)
          .neq('place_reviews.source', 'ecard_endorsement');
        placeSignalCount = pCount || 0;

        const { data: placeSignalTaps } = await serverSupabase
          .from('place_review_signal_taps')
          .select('signal_id, review_items(label, icon_emoji), place_reviews!inner(source)')
          .eq('place_id', data.place_id)
          .neq('place_reviews.source', 'ecard_endorsement');

        (placeSignalTaps || []).forEach((tap: any) => {
          const ri = tap.review_items;
          if (ri) {
            if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '⭐', count: 0 };
            tagCounts[tap.signal_id].count++;
          }
        });
      }

      endorsementCount = (ecardSignalCount || 0) + placeSignalCount;
      topEndorsementTags = Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 8);

      // Anonymous SSR contains only currently public notes; authenticated hydration
      // refreshes through the same server-resolved safety RPC.
      const {data: safety,error:safetyError} = await serverSupabase.rpc('get_public_ecard_safety_v1',{p_card_id:data.id});
      if (!safetyError && safety?.visible === true && Array.isArray(safety.endorsements)) recentEndorsements = safety.endorsements;

      // Get available endorsement signals for this card's category
      // Always show universal + the card's specific category
      const cardCategory = data.professional_category || 'universal';
      const categoriesToShow = cardCategory === 'universal' ? ['universal'] : ['universal', cardCategory];
      const { data: signals } = await serverSupabase
        .from('review_items')
        .select('id, label, icon_emoji, sort_order, category')
        .eq('signal_type', 'pro_endorsement')
        .eq('is_active', true)
        .in('category', categoriesToShow)
        .order('sort_order', { ascending: true });
      endorsementSignals = (signals || []).map((s: any) => ({
        id: s.id,
        label: s.label,
        emoji: s.icon_emoji || '⭐',
        category: s.category || 'universal',
      }));
    } catch (endorseErr) {
      console.error('[Card SSR] Endorsement fetch error:', endorseErr);
    }

    // Fetch civic card data if this is a civic-card template
    let civicProposals: any[] = [];
    let civicQuestions: any[] = [];
    let civicCommitments: any[] = [];
    let civicRecommendations: any[] = [];
    const resolvedTemplate = resolveTemplateId(data.template_id || 'classic-blue');
    if (resolvedTemplate.startsWith('civic-card') || resolvedTemplate === 'politician-generic') {
      try {
        // Fetch proposals
        const { data: proposalsData } = await serverSupabase
          .from('civic_proposals')
          .select('*')
          .eq('card_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (proposalsData) {
          // Fetch reaction counts for each proposal
          for (const p of proposalsData) {
            const { data: reactions } = await serverSupabase
              .from('civic_reactions')
              .select('reaction_type')
              .eq('proposal_id', p.id);
            const counts = { support: 0, needs_improvement: 0, disagree: 0 };
            (reactions || []).forEach((r: any) => {
              if (r.reaction_type in counts) counts[r.reaction_type as keyof typeof counts]++;
            });
            civicProposals.push({
              id: p.id,
              title: p.title,
              description: p.description || '',
              sortOrder: p.sort_order || 0,
              reactions: counts,
            });
          }
        }

        // Fetch questions
        const { data: questionsData } = await serverSupabase
          .from('civic_questions')
          .select('*')
          .eq('card_id', data.id)
          .eq('status', 'approved')
          .eq('is_visible', true)
          .order('upvote_count', { ascending: false })
          .limit(50);

        civicQuestions = (questionsData || []).map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          upvoteCount: q.upvote_count || 0,
          answerText: q.answer_text || null,
          answeredAt: q.answered_at || null,
          createdAt: q.created_at,
        }));

        // Fetch commitments
        const { data: commitmentsData } = await serverSupabase
          .from('civic_commitments')
          .select('*')
          .eq('card_id', data.id)
          .order('sort_order', { ascending: true });

        civicCommitments = (commitmentsData || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          status: c.status || 'planned',
          sortOrder: c.sort_order || 0,
        }));

        // Fetch recommendations ("Who I Recommend")
        const { data: recsData } = await serverSupabase
          .from('civic_recommendations')
          .select(`
            id,
            endorsement_note,
            sort_order,
            recommended_card:digital_cards!recommended_card_id (
              id, slug, full_name, title, profile_photo_url,
              party_name, office_running_for, region
            )
          `)
          .eq('card_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        civicRecommendations = (recsData || []).map((r: any) => ({
          id: r.id,
          endorsementNote: r.endorsement_note,
          card: r.recommended_card ? {
            id: r.recommended_card.id,
            slug: r.recommended_card.slug,
            fullName: r.recommended_card.full_name,
            title: r.recommended_card.title,
            profilePhotoUrl: r.recommended_card.profile_photo_url,
            partyName: r.recommended_card.party_name,
            officeRunningFor: r.recommended_card.office_running_for,
            region: r.recommended_card.region,
          } : null,
        })).filter((r: any) => r.card !== null);

        // For civic cards, also load political endorsement signals
        const { data: politicalSignals } = await serverSupabase
          .from('review_items')
          .select('id, label, icon_emoji, sort_order, category')
          .eq('signal_type', 'pro_endorsement')
          .eq('is_active', true)
          .eq('category', 'politics')
          .order('sort_order', { ascending: true });
        if (politicalSignals && politicalSignals.length > 0) {
          endorsementSignals = politicalSignals.map((s: any) => ({
            id: s.id,
            label: s.label,
            emoji: s.icon_emoji || '\u2B50',
            category: s.category || 'politics',
          }));
        }
      } catch (civicErr) {
        console.error('[Card SSR] Civic data fetch error:', civicErr);
      }
    }

    // Fetch live session for mobile-business cards (or any card with a place_id)
    let liveSession: CardData['liveSession'] = null;
    if (data.place_id) {
      try {
        const { data: sessionData } = await serverSupabase
          .from('live_sessions')
          .select('id, session_lat, session_lng, location_label, session_address, started_at, scheduled_end_at, status, today_note')
          .eq('place_id', data.place_id)
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1)
          .single();
        if (sessionData) {
          // Fetch specials for this session
          const { data: specialsData } = await serverSupabase
            .from('live_session_specials')
            .select('title, description, urgency_label')
            .eq('session_id', sessionData.id)
            .order('created_at', { ascending: false });
          liveSession = {
            isLive: true,
            locationLabel: sessionData.location_label || '',
            sessionAddress: sessionData.session_address || '',
            sessionLat: sessionData.session_lat,
            sessionLng: sessionData.session_lng,
            todayNote: sessionData.today_note || '',
            startedAt: sessionData.started_at,
            scheduledEndAt: sessionData.scheduled_end_at,
            specials: (specialsData || []).map((s: any) => ({
              title: s.title,
              description: s.description || '',
              urgencyLabel: s.urgency_label || '',
            })),
          };
        }
      } catch (liveErr) {
        console.error('[Card SSR] Live session fetch error:', liveErr);
      }
    }

    const cardData = mapPublicCard(data, linksData, { endorsementCount, topEndorsementTags, recentEndorsements, endorsementSignals, civicProposals, civicQuestions, civicCommitments, civicRecommendations, liveSession });
    
    return {
      props: {
        cardData,
        error: null,
        isPreview: context.query.preview === '1',
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  } catch (err) {
    console.error('[Card SSR] Error:', err);
    setPublicCardErrorStatus(context.res, true);
    return {
      props: {
        cardData: null,
        error: PUBLIC_CARD_UNAVAILABLE,
        isPreview: context.query.preview === '1',
        ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
      },
    };
  }
};
