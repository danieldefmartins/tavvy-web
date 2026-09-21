import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AppLayout from '../../components/AppLayout';
import ToolHeader from '../../components/ToolHeader';
import PlaceCard from '../../components/PlaceCard';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import { useRVCatalog } from '../../hooks/useRVCatalog';
import { RV_CATEGORIES, RVCategory, isRVCategory, rvPlaceCategory, rvPlacePhoto } from '../../lib/rvCategories';

export default function RVCampingScreen() {
  const router = useRouter(), { theme } = useThemeContext(), copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [category, setCategory] = useState<RVCategory>('all');
  useEffect(() => {
    if (!router.isReady) return;
    setQuery(typeof router.query.q === 'string' ? router.query.q.slice(0,120) : '');
    setCategory(isRVCategory(router.query.category) ? router.query.category : 'all');
  }, [router.isReady, router.query.q, router.query.category]);
  const catalog = useRVCatalog(category, query);
  const change = (nextQuery: string, nextCategory: RVCategory) => {
    setQuery(nextQuery); setCategory(nextCategory);
    void router.replace({ pathname: router.pathname, query: { ...(nextQuery ? {q:nextQuery} : {}), ...(nextCategory !== 'all' ? {category:nextCategory} : {}) } }, undefined, { shallow: true, scroll: false });
  };
  return <AppLayout><Head><title>RV &amp; Camping | Tavvy</title><meta name="description" content="Explore existing RV parks, campgrounds, national parks and outdoor places on Tavvy." /></Head>
    <main className="rv-screen" style={{background:theme.background,color:theme.text}}>
      <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite.">
        <input type="search" maxLength={120} aria-label={copy('Search places or cities')} placeholder={copy('Search places or cities')} value={query} onChange={e=>change(e.target.value,category)} />
      </ToolHeader>
      <nav className="filters" aria-label={copy('Place category')}>{RV_CATEGORIES.map(item=><button key={item.id} aria-pressed={category===item.id} onClick={()=>change(query,item.id)}><span aria-hidden>{item.icon}</span> {copy(item.label)}</button>)}</nav>
      <section className="results" aria-busy={catalog.loading}>
        <h2>{copy(query.trim() ? 'Search results' : RV_CATEGORIES.find(c=>c.id===category&&c.id!=='all')?.label || 'Places to explore')}</h2>
        <p className="scope">{copy('Browse all locations. Search a place or city to narrow the list.')}</p>
        {catalog.error&&<div role="alert"><p>{copy(catalog.error)}</p><button onClick={catalog.places.length ? catalog.loadMore : catalog.reload}>{copy('Try again')}</button></div>}
        {catalog.loading?<p role="status">{copy('Loading places…')}</p>:<>
          {!catalog.error&&!catalog.places.length&&<div className="empty"><h3>{copy('No places found')}</h3><p>{copy('Try another place, city or category.')}</p></div>}
          {catalog.places.map(place=><PlaceCard key={place.id} showReviewSummary place={{id:place.id,name:place.name,reviewSummary:catalog.reviewSummaries[place.id],evidenceStatus:catalog.reviewSummaries[place.id]?.status||'loading',tavvy_category:place.tavvy_category||undefined,subcategory:place.tavvy_subcategory||undefined,city:place.city||undefined,state_region:place.region||undefined,category:rvPlaceCategory(place),photo_url:rvPlacePhoto(place)||undefined}} />)}
          {catalog.hasMore&&<button className="more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</button>}
        </>}
      </section>
    </main>
    <style jsx>{`
      .rv-screen{min-height:100vh;padding-bottom:100px}input{width:100%;min-width:0;min-height:48px;padding:12px 14px;border:1px solid ${theme.border};border-radius:14px;background:${theme.surface};color:${theme.text};font:inherit;font-size:16px}.filters{display:flex;gap:8px;padding:16px;overflow:auto;scrollbar-width:thin}button{min-height:44px;padding:10px 15px;border:1px solid ${theme.border};border-radius:22px;background:${theme.surface};color:${theme.text};font:inherit;cursor:pointer;flex-shrink:0}button[aria-pressed=true]{background:${theme.primary};color:white;border-color:${theme.primary}}.results{max-width:850px;margin:auto;padding:0 16px}h2{font-size:20px;margin:12px 0 8px}.scope,.empty p{font-size:14px;line-height:1.5;color:${theme.textSecondary}}.scope{margin-bottom:20px}.empty{padding:30px 0}.more{display:block;margin:20px auto}button:disabled{opacity:.6;cursor:default}:focus-visible{outline:3px solid ${theme.primary};outline-offset:3px}[role=alert]{margin:16px 0;padding:14px;border:1px solid ${theme.border};border-radius:12px}
    `}</style>
  </AppLayout>;
}
export async function getServerSideProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
