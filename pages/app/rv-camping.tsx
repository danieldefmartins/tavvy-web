import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AppLayout from '../../components/AppLayout';
import ToolHeader from '../../components/ToolHeader';
import PlaceCard from '../../components/PlaceCard';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import { useRVCatalog } from '../../hooks/useRVCatalog';
import { RV_CATEGORIES, RVCategory, RVPlace, isRVCategory, rvPlaceCategory, rvPlacePhoto, rvPlacePoint } from '../../lib/rvCategories';
const PlacesMap = dynamic(() => import('../../components/RVMap'), { ssr: false, loading: () => <p>Loading map…</p> });

export default function RVCampingScreen() {
  const router = useRouter(), { theme } = useThemeContext(), copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [category, setCategory] = useState<RVCategory>('all');
  const [view, setView] = useState<'list' | 'map'>('list'), [layer, setLayer] = useState('standard');
  const [location, setLocation] = useState<[number, number] | null>(null), [locating, setLocating] = useState(false), [locationNote, setLocationNote] = useState('');
  useEffect(() => {
    if (!router.isReady) return;
    setQuery(typeof router.query.q === 'string' ? router.query.q.slice(0,120) : '');
    setCategory(isRVCategory(router.query.category) ? router.query.category : 'all');
    setView(router.query.view === 'map' ? 'map' : 'list');
  }, [router.isReady, router.query.q, router.query.category, router.query.view]);
  const catalog = useRVCatalog(category, query);
  const change = (nextQuery: string, nextCategory: RVCategory, nextView: 'list' | 'map' = view) => {
    setQuery(nextQuery); setCategory(nextCategory); setView(nextView);
    void router.replace({ pathname: router.pathname, query: { ...(nextQuery ? {q:nextQuery} : {}), ...(nextCategory !== 'all' ? {category:nextCategory} : {}), ...(nextView === 'map' ? {view:'map'} : {}) } }, undefined, { shallow: true, scroll: false });
  };
  const locate = () => {
    if (locating) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLocationNote(copy('Location is unavailable on this device.')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { setLocation([p.coords.latitude, p.coords.longitude]); setLocationNote(''); setLocating(false); }, () => { setLocationNote(copy('Location could not be accessed. Search a city instead.')); setLocating(false); }, { timeout: 10000 });
  };
  const openPlace = (place: RVPlace) => { void router.push(`/app/place/${encodeURIComponent(place.id)}`, undefined, { locale: router.locale }); };
  const mappable = catalog.places.filter(place => rvPlacePoint(place)).length;
  return <AppLayout><Head><title>RV &amp; Camping | Tavvy</title><meta name="description" content="Explore existing RV parks, campgrounds, national parks and outdoor places on Tavvy." /></Head>
    <main className="rv-screen" style={{background:theme.background,color:theme.text}}>
      <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite.">
        <input type="search" maxLength={120} aria-label={copy('Search places or cities')} placeholder={copy('Search places or cities')} value={query} onChange={e=>change(e.target.value,category)} />
      </ToolHeader>
      <nav className="filters" aria-label={copy('Place category')}>{RV_CATEGORIES.map(item=><button key={item.id} aria-pressed={category===item.id} onClick={()=>change(query,item.id)}><span aria-hidden>{item.icon}</span> {copy(item.label)}</button>)}</nav>
      <section className="results" aria-busy={catalog.loading}>
        <div className="results-heading"><h2>{copy(query.trim() ? 'Search results' : RV_CATEGORIES.find(c=>c.id===category&&c.id!=='all')?.label || 'Places to explore')}</h2>
          <div className="view-switch" role="group" aria-label={copy('Results view')}><button aria-pressed={view==='list'} onClick={()=>change(query,category,'list')}>{copy('List')}</button><button aria-pressed={view==='map'} onClick={()=>change(query,category,'map')}>{copy('Map')}</button></div></div>
        <p className="scope">{copy('Browse all locations. Search a place or city to narrow the list.')}</p>
        {catalog.error&&<div role="alert"><p>{copy(catalog.error)}</p><button onClick={catalog.places.length ? catalog.loadMore : catalog.reload}>{copy('Try again')}</button></div>}
        {view==='map'&&<div className="map-block">
          <p className="scope" role="status">{copy(`${mappable} of ${catalog.places.length} places on the map`)}{locationNote?` · ${locationNote}`:''}</p>
          <div className="map-frame" aria-label={copy('Places map')}>
            {/* Small icon controls over the map: my location + Standard / Dark / Satellite layers */}
            <div className="map-controls" role="group" aria-label={copy('Map controls')}>
              <button type="button" className={location?'on':''} aria-label={copy('My location')} title={copy('My location')} onClick={locate} disabled={locating}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              </button>
              {([['standard','Standard'],['dark','Dark'],['satellite','Satellite']] as const).map(([id,label])=><button key={id} type="button" className={layer===id?'on':''} aria-pressed={layer===id} aria-label={copy(label)} title={copy(label)} onClick={()=>setLayer(id)}>
                {id==='standard'&&<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>}
                {id==='dark'&&<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>}
                {id==='satellite'&&<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>}
              </button>)}
            </div>
            {catalog.loading?<p role="status">{copy('Loading places…')}</p>:<PlacesMap places={catalog.places} location={location} layer={layer} onSelect={openPlace}/>}
          </div>
          {catalog.hasMore&&<button className="more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</button>}
        </div>}
        {view==='list'&&(catalog.loading?<p role="status">{copy('Loading places…')}</p>:<>
          {!catalog.error&&!catalog.places.length&&<div className="empty"><h3>{copy('No places found')}</h3><p>{copy('Try another place, city or category.')}</p></div>}
          {catalog.places.map(place=><PlaceCard key={place.id} showReviewSummary place={{id:place.id,name:place.name,reviewSummary:catalog.reviewSummaries[place.id],evidenceStatus:catalog.reviewSummaries[place.id]?.status||'loading',tavvy_category:place.tavvy_category||undefined,subcategory:place.tavvy_subcategory||undefined,city:place.city||undefined,state_region:place.region||undefined,category:rvPlaceCategory(place),photo_url:rvPlacePhoto(place)||undefined}} />)}
          {catalog.hasMore&&<button className="more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</button>}
        </>)}
      </section>
    </main>
    <style jsx>{`
      .results-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.view-switch{display:flex;gap:6px}.view-switch button{min-height:40px;padding:8px 14px;border-radius:12px}.map-block{display:grid;gap:10px;margin-bottom:16px}.map-frame{position:relative;height:min(65vh,560px);min-height:320px;border:1px solid ${theme.border};border-radius:16px;overflow:hidden;background:${theme.surface}}.map-frame :global(.leaflet-container){height:100%;width:100%}.map-controls{position:absolute;top:10px;right:10px;z-index:1000;display:flex;flex-direction:column;gap:8px}.map-controls button{width:40px;height:40px;min-height:40px;padding:0;border-radius:20px;display:grid;place-items:center;background:#fff;color:#17013A;border:1px solid rgba(23,1,58,.15);box-shadow:0 2px 6px rgba(0,0,0,.18)}.map-controls button.on{background:${theme.primary};color:#fff;border-color:${theme.primary}}.map-controls button:disabled{opacity:.6}
      .rv-screen{min-height:100vh;padding-bottom:100px}input{width:100%;min-width:0;min-height:48px;padding:12px 14px;border:1px solid ${theme.border};border-radius:14px;background:${theme.surface};color:${theme.text};font:inherit;font-size:16px}.filters{display:flex;gap:8px;padding:16px;overflow:auto;scrollbar-width:thin}button{min-height:44px;padding:10px 15px;border:1px solid ${theme.border};border-radius:22px;background:${theme.surface};color:${theme.text};font:inherit;cursor:pointer;flex-shrink:0}button[aria-pressed=true]{background:${theme.primary};color:white;border-color:${theme.primary}}.results{max-width:850px;margin:auto;padding:0 16px}h2{font-size:20px;margin:12px 0 8px}.scope,.empty p{font-size:14px;line-height:1.5;color:${theme.textSecondary}}.scope{margin-bottom:20px}.empty{padding:30px 0}.more{display:block;margin:20px auto}button:disabled{opacity:.6;cursor:default}:focus-visible{outline:3px solid ${theme.primary};outline-offset:3px}[role=alert]{margin:16px 0;padding:14px;border:1px solid ${theme.border};border-radius:12px}
    `}</style>
  </AppLayout>;
}
export async function getServerSideProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
