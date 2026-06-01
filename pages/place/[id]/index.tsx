import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fetchPlaceById } from '../../../lib/placeService';
import { supabase } from '../../../lib/supabaseClient';
import { Place } from '../../../types';
import { fetchPlaceSignals, SignalAggregate } from '../../../lib/signalService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PlaceDetailsScreen({ placeId }: { placeId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const id = placeId || (router.query.id as string);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [livingSignals, setLivingSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
    medals: string[];
  }>({ best_for: [], vibe: [], heads_up: [], medals: [] });

  useEffect(() => {
    if (id) {
      fetchPlaceById(id).then(data => {
        setPlace(data);
        setLoading(false);
        if (data?.id) {
          fetchPlaceSignals(data.id).then(setLivingSignals).catch(() => {});
        }
      }).catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!place) return <div style={{ padding: 40, textAlign: 'center' }}>Place not found</div>;

  return (
    <>
      <Head>
        <title>{place.name} | Tavvy</title>
      </Head>
      <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
        <h1>{place.name}</h1>
        <p>{place.category}</p>
        <p>{place.address_line1}, {place.city}</p>

        {livingSignals.best_for.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>The Good</h3>
            {livingSignals.best_for.slice(0, 5).map(s => (
              <span key={s.signal_id} style={{
                display: 'inline-block', margin: 4, padding: '6px 12px',
                background: 'rgba(0,194,203,0.1)', borderRadius: 20, fontSize: 14
              }}>
                {s.icon} {s.label} ×{s.review_count}
              </span>
            ))}
          </div>
        )}

        {livingSignals.vibe.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h3>The Vibe</h3>
            {livingSignals.vibe.slice(0, 3).map(s => (
              <span key={s.signal_id} style={{
                display: 'inline-block', margin: 4, padding: '6px 12px',
                background: 'rgba(138,5,190,0.1)', borderRadius: 20, fontSize: 14
              }}>
                {s.icon} {s.label} ×{s.review_count}
              </span>
            ))}
          </div>
        )}

        {livingSignals.heads_up.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h3>Heads Up</h3>
            {livingSignals.heads_up.slice(0, 2).map(s => (
              <span key={s.signal_id} style={{
                display: 'inline-block', margin: 4, padding: '6px 12px',
                background: 'rgba(245,166,35,0.1)', borderRadius: 20, fontSize: 14
              }}>
                {s.icon} {s.label} ×{s.review_count}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push(`/place/${id}/menu-gallery`)}
          style={{ marginTop: 20, padding: '12px 24px', background: '#8A05BE', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, cursor: 'pointer' }}
        >
          View Menu
        </button>
      </div>
    </>
  );
}

export const getServerSideProps = async ({ params, locale }: { params: { id: string }; locale: string }) => {
  try {
    return {
      props: {
        placeId: params?.id || '',
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      },
    };
  } catch {
    return { props: { placeId: params?.id || '' } };
  }
};
