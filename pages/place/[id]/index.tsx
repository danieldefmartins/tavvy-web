import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchPlaceById } from '../../../lib/placeService';
import { Place } from '../../../types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PlaceDetailsScreen({ placeId }: { placeId?: string }) {
  const router = useRouter();
  const id = placeId || (router.query.id as string);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlaceById(id).then(data => {
        setPlace(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!place) return <div style={{ padding: 40, textAlign: 'center' }}>Place not found</div>;

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
      <h1>{place.name}</h1>
      <p>{place.category}</p>
      <p>{place.address_line1}, {place.city}</p>
      <button onClick={() => router.push(`/place/${id}/menu-gallery`)}>View Menu</button>
    </div>
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
