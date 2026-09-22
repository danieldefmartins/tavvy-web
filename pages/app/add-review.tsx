import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AppLayout from '../../components/AppLayout';
import AddReviewSheet from '../../components/AddReviewSheet';
import { loadPlaceSignalCategory } from '../../lib/signalCatalog';
import { supabase } from '../../lib/supabaseClient';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
export default function AddReviewPage() {
  const router = useRouter(); const copy = useReleaseCopy();
  const id = typeof router.query.placeId === 'string' ? router.query.placeId : '';
  const name = typeof router.query.placeName === 'string' ? router.query.placeName : '';
  const category = typeof router.query.primaryCategory === 'string' ? router.query.primaryCategory : '';
  const subcategory = typeof router.query.subcategory === 'string' ? router.query.subcategory : undefined;
  const [subject, setSubject] = useState<{ primary: string; subcategory?: string } | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; setSubject(null); setError(false); if (!id) return; (category ? Promise.resolve({ primary: category, subcategory }) : loadPlaceSignalCategory(supabase, id)).then(value => { if (active) setSubject(value); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [id, category, subcategory, retry]);
  return <AppLayout><Head><title>{copy('What stood out?')} · Tavvy</title></Head><main style={{padding:24}}>{!id && router.isReady ? <p>{copy('This place could not be found.')}</p> : error ? <button onClick={() => setRetry(value => value + 1)}>{copy('Try again')}</button> : !subject ? <p role="status">{copy('Loading recent reviews…')}</p> : <AddReviewSheet placeId={id} placeName={name} category={subject.primary} subcategory={subject.subcategory} open onClose={() => router.replace('/app/place/' + encodeURIComponent(id))}/>}</main></AppLayout>;
}
export const getStaticProps = async ({ locale }: { locale: string }) => ({ props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) } });
