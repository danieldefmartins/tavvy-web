import ExperiencePathEditor from '../../../components/ExperiencePathEditor';
import { useAuth } from '../../../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AppLayout from '../../../components/AppLayout';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabaseClient';
import { ExperiencePath, ExperienceStop, loadExperiencePath, loadExperienceStops, loadEditableExperiencePath } from '../../../lib/experiencePaths';

export default function ExperienceDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [path, setPath] = useState<ExperiencePath | null>(null);
  const [stops, setStops] = useState<ExperienceStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!router.isReady) return;
    let active = true;
    setLoading(true); setError(false); setPath(null); setStops([]);
    (async () => {
      try {
        const owned = user ? await loadEditableExperiencePath(supabase, id, user.id) : null;
        const result = owned || await loadExperiencePath(supabase, id);
        const items = result ? await loadExperienceStops(supabase, id) : [];
        if (active) { setPath(result); setStops(items); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, router.isReady, retry, user?.id]);
  return <AppLayout><Head><title>{path?.title || 'Experience'} | Tavvy</title></Head>
    <main style={{ color: theme.text, background: theme.background, minHeight: '100vh', padding: 24, paddingBottom: 100 }}>
      <Link href="/app/experiences">← Experiences</Link>
      {id === 'new' || router.query.edit === '1' ? <ExperiencePathEditor pathId={id} onCancel={() => { if (id === 'new') router.push('/app/experiences'); else router.replace(`/app/experience/${id}`); }} onSaved={savedId => { setRetry(x => x + 1); router.replace(`/app/experience/${savedId}?saved=1`); }} /> : loading ? <p role="status">Loading experience…</p> : error ? <div role="alert"><p>Experience could not be loaded.</p><button onClick={() => setRetry(x => x + 1)}>Retry</button></div> : !path ? <h1>Experience not found</h1> : <>
        {path.cover_image_url && <img src={path.cover_image_url} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 16, marginTop: 20 }} />}
        {router.query.saved === '1' && <p role="status">{path.is_published ? 'Your path is published.' : 'Your private draft is saved.'}</p>}
        {user?.id === path.owner_id && <p><Link href={`/app/experience/${id}?edit=1`}>Edit path</Link> · {path.is_published ? 'Published' : 'Private draft'}</p>}
        <h1>{path.title}</h1><p>{path.description}</p>
        <p>{[path.category, path.duration_minutes != null ? `${path.duration_minutes} minutes` : null].filter(Boolean).join(' · ')}</p>
        <h2>{stops.length} stops</h2>
        {!stops.length ? <p>No stops have been added to this experience yet.</p> : <ol>{stops.map(stop => <li key={stop.id} style={{ padding: 16, marginBottom: 12, background: theme.surface, borderRadius: 12 }}>
          {stop.place ? <Link href={`/app/place/${stop.place_id}`}>{stop.place.name}</Link> : <span>Place unavailable</span>}
          {stop.note && <p>{stop.note}</p>}
        </li>)}</ol>}
      </>}
    </main>
  </AppLayout>;
}
export async function getServerSideProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
