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

const Icon = {
  search: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  filters: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>,
  locate: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>,
  standard: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>,
  dark: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  satellite: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
  list: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  plus: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>,
};

export default function RVCampingScreen() {
  const router = useRouter(), { theme } = useThemeContext(), copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [category, setCategory] = useState<RVCategory>('all');
  const [view, setView] = useState<'list' | 'map'>('list'), [layer, setLayer] = useState('standard'), [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState<[number, number] | null>(null), [locating, setLocating] = useState(false), [locationNote, setLocationNote] = useState('');
  useEffect(() => {
    if (!router.isReady) return;
    setQuery(typeof router.query.q === 'string' ? router.query.q.slice(0,120) : '');
    setCategory(isRVCategory(router.query.category) ? router.query.category : 'all');
    setView(router.query.view === 'map' ? 'map' : 'list');
  }, [router.isReady, router.query.q, router.query.category, router.query.view]);
  const catalog = useRVCatalog(category, query);
  const change = (nextQuery: string, nextCategory: RVCategory, nextView: 'list' | 'map' = view) => {
    setQuery(nextQuery); setCategory(nextCategory); setView(nextView); setFiltersOpen(false);
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
  const searchInput = <input type="search" maxLength={120} aria-label={copy('Search places or cities')} placeholder={copy('Search places or cities')} value={query} onChange={e=>change(e.target.value,category)} style={view==='map'?{flex:1,minWidth:0,border:0,background:'transparent',boxShadow:'none',minHeight:42,padding:'8px 6px',color:theme.text,font:'inherit',fontSize:16,outline:'none'}:undefined} />;
  const categoryChips = RV_CATEGORIES.map(item=><button key={item.id} aria-pressed={category===item.id} onClick={()=>change(query,item.id)}><span aria-hidden>{item.icon}</span> {copy(item.label)}</button>);
  const loadMore = catalog.hasMore&&<button className="more" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{copy(catalog.loadingMore?'Loading places…':'Load more places')}</button>;
  return <AppLayout><Head><title>RV &amp; Camping | Tavvy</title><meta name="description" content="Explore existing RV parks, campgrounds, national parks and outdoor places on Tavvy." /></Head>
    <main className={`rv-screen${view==='map'?' is-map':''}`} style={{background:theme.background,color:theme.text}}>
      <ToolHeader title="RV & Camping" subtitle="Find your perfect campsite.">{view==='list'&&searchInput}</ToolHeader>
      {view==='map'?<section className="map-screen" aria-busy={catalog.loading} aria-label={copy('Places map')}>
        {/* Floating search + filter button; the category chips open from the filter icon so the map keeps the space. */}
        <div className="map-top">
          <div className="map-search-row"><div className="map-search" style={{flex:1,display:'flex',alignItems:'center',gap:8,minHeight:44,padding:'0 6px 0 14px',border:`1px solid ${theme.border}`,borderRadius:22,background:theme.surface,color:theme.textSecondary,boxShadow:'0 2px 6px rgba(0,0,0,.18)'}}>{Icon.search}{searchInput}</div><button type="button" className={`icon-btn${filtersOpen||category!=='all'?' on':''}`} aria-label={copy('Filters')} title={copy('Filters')} aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(open=>!open)}>{Icon.filters}</button></div>
          {filtersOpen&&<nav className="map-filters" aria-label={copy('Place category')}>{categoryChips}</nav>}
          {catalog.error&&<div role="alert" className="map-alert"><p>{copy(catalog.error)}</p><button onClick={catalog.places.length ? catalog.loadMore : catalog.reload}>{copy('Try again')}</button></div>}
        </div>
        {/* Small icon controls over the map: my location + Standard / Dark / Satellite layers */}
        <div className="map-controls" role="group" aria-label={copy('Map controls')} style={{top:filtersOpen?122:64}}>
          <button type="button" className={`icon-btn${location?' on':''}`} aria-label={copy('My location')} title={copy('My location')} onClick={locate} disabled={locating}>{Icon.locate}</button>
          {([['standard','Standard'],['dark','Dark'],['satellite','Satellite']] as const).map(([id,label])=><button key={id} type="button" className={`icon-btn${layer===id?' on':''}`} aria-pressed={layer===id} aria-label={copy(label)} title={copy(label)} onClick={()=>setLayer(id)}>{Icon[id]}</button>)}
        </div>
        <div className="map-frame full">{catalog.loading&&!catalog.places.length?<p role="status" className="map-status">{copy('Loading places…')}</p>:<PlacesMap places={catalog.places} location={location} layer={layer} onSelect={openPlace}/>}</div>
        <div className="map-bottom">
          {!!locationNote&&<p className="map-note" role="status">{locationNote}</p>}
          {!catalog.loading&&!catalog.error&&!mappable&&<p className="map-note" role="status">{copy(catalog.places.length?'No places with map coordinates in this list yet. Load more places or search a city.':'No places found')}</p>}
          <div className="map-bottom-row">
            <button type="button" className="pill" onClick={()=>change(query,category,'list')}>{Icon.list}<span>{copy('List')} · {catalog.loading?'…':`${mappable}/${catalog.places.length}`}</span></button>
            {catalog.hasMore&&<button type="button" className="pill" disabled={catalog.loadingMore} onClick={catalog.loadMore}>{Icon.plus}<span>{copy(catalog.loadingMore?'Loading places…':'Load more')}</span></button>}
          </div>
        </div>
      </section>:<>
      <nav className="filters" aria-label={copy('Place category')}>{categoryChips}</nav>
      <section className="results" aria-busy={catalog.loading}>
        <div className="results-heading"><h2>{copy(query.trim() ? 'Search results' : RV_CATEGORIES.find(c=>c.id===category&&c.id!=='all')?.label || 'Places to explore')}</h2>
          <div className="view-switch" role="group" aria-label={copy('Results view')}><button aria-pressed={view==='list'} onClick={()=>change(query,category,'list')}>{copy('List')}</button><button aria-pressed={false} onClick={()=>change(query,category,'map')}>{copy('Map')}</button></div></div>
        <p className="scope">{copy('Browse all locations. Search a place or city to narrow the list.')}</p>
        {catalog.error&&<div role="alert"><p>{copy(catalog.error)}</p><button onClick={catalog.places.length ? catalog.loadMore : catalog.reload}>{copy('Try again')}</button></div>}
        {catalog.loading?<p role="status">{copy('Loading places…')}</p>:<>
          {!catalog.error&&!catalog.places.length&&<div className="empty"><h3>{copy('No places found')}</h3><p>{copy('Try another place, city or category.')}</p></div>}
          {catalog.places.map(place=><PlaceCard key={place.id} showReviewSummary place={{id:place.id,name:place.name,reviewSummary:catalog.reviewSummaries[place.id],evidenceStatus:catalog.reviewSummaries[place.id]?.status||'loading',tavvy_category:place.tavvy_category||undefined,subcategory:place.tavvy_subcategory||undefined,city:place.city||undefined,state_region:place.region||undefined,category:rvPlaceCategory(place),photo_url:rvPlacePhoto(place)||undefined}} />)}
          {loadMore}
        </>}
      </section></>}
    </main>
    <style jsx>{`
      .results-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.view-switch{display:flex;gap:6px}.view-switch button{min-height:40px;padding:8px 14px;border-radius:12px}
      .map-screen{position:relative;height:calc(100vh - 118px);min-height:420px;overflow:hidden}.is-map{padding-bottom:0}.map-frame.full{position:absolute;inset:0;height:100%;border:0;border-radius:0;background:${theme.surface}}.map-frame :global(.leaflet-container){height:100%;width:100%}.map-status{margin:0;padding:30px;text-align:center}
      .map-top{position:absolute;top:10px;left:12px;right:12px;z-index:1000;display:grid;gap:8px}.map-search-row{display:flex;align-items:center;gap:8px}.map-search{flex:1;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 6px 0 14px;border:1px solid ${theme.border};border-radius:22px;background:${theme.surface};color:${theme.textSecondary};box-shadow:0 2px 6px rgba(0,0,0,.18)}.map-search input{border:0;background:transparent;box-shadow:none;min-height:42px;padding:8px 6px}.map-search input:focus-visible{outline:none}.map-filters{display:flex;gap:8px;padding:8px;margin-right:48px;overflow:auto;scrollbar-width:thin;border:1px solid ${theme.border};border-radius:16px;background:${theme.surface};box-shadow:0 2px 6px rgba(0,0,0,.18)}.map-alert{margin:0;padding:10px 12px;border:1px solid ${theme.border};border-radius:12px;background:${theme.surface};display:flex;gap:10px;align-items:center;flex-wrap:wrap}.map-alert p{margin:0}
      .map-controls{position:absolute;right:12px;z-index:1000;display:flex;flex-direction:column;gap:8px;transition:top .15s}.icon-btn{width:40px;height:40px;min-height:40px;padding:0;border-radius:20px;display:grid;place-items:center;background:#fff;color:#17013A;border:1px solid rgba(23,1,58,.15);box-shadow:0 2px 6px rgba(0,0,0,.18)}.icon-btn.on{background:${theme.primary};color:#fff;border-color:${theme.primary}}
      .map-bottom{position:absolute;left:12px;right:12px;bottom:14px;z-index:1000;display:grid;gap:8px;justify-items:center}.map-bottom-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.pill{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:10px 16px;border-radius:22px;background:#fff;color:#17013A;font-weight:700;border:1px solid rgba(23,1,58,.15);box-shadow:0 2px 6px rgba(0,0,0,.18)}.map-note{margin:0;padding:6px 12px;border-radius:12px;background:${theme.surface};color:${theme.textSecondary};font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.18)}
      .rv-screen{min-height:100vh;padding-bottom:100px}input{width:100%;min-width:0;min-height:48px;padding:12px 14px;border:1px solid ${theme.border};border-radius:14px;background:${theme.surface};color:${theme.text};font:inherit;font-size:16px}.filters{display:flex;gap:8px;padding:16px;overflow:auto;scrollbar-width:thin}button{min-height:44px;padding:10px 15px;border:1px solid ${theme.border};border-radius:22px;background:${theme.surface};color:${theme.text};font:inherit;cursor:pointer;flex-shrink:0}button[aria-pressed=true]{background:${theme.primary};color:white;border-color:${theme.primary}}.results{max-width:850px;margin:auto;padding:0 16px}h2{font-size:20px;margin:12px 0 8px}.scope,.empty p{font-size:14px;line-height:1.5;color:${theme.textSecondary}}.scope{margin-bottom:20px}.empty{padding:30px 0}.more{display:block;margin:20px auto}button:disabled{opacity:.6;cursor:default}:focus-visible{outline:3px solid ${theme.primary};outline-offset:3px}[role=alert]{margin:16px 0;padding:14px;border:1px solid ${theme.border};border-radius:12px}
    `}</style>
  </AppLayout>;
}
export async function getServerSideProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
