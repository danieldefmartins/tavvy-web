import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { FoodMenuPlace, FoodMenuResult, FoodMenuSearch, searchFoodMenuPlaces, searchFoodMenus } from '../../lib/foodMenu';

type MenuMode = 'dishes' | 'restaurants';

export default function FoodMenuPage() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const accent = isDark ? '#43D8CA' : '#006B72';
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>();
  const [radius, setRadius] = useState(25);
  const [items, setItems] = useState<FoodMenuResult[]>([]);
  const [places, setPlaces] = useState<FoodMenuPlace[]>([]);
  const [mode, setMode] = useState<MenuMode>('dishes');
  const modeRef = useRef<MenuMode>('dishes');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const request = useRef(0);
  const activeSearch = useRef<FoodMenuSearch>({});
  async function search(append = false, coordinates = center, nextMode = modeRef.current) {
    const current = ++request.current;
    const options = append ? activeSearch.current : { query, city: coordinates ? '' : city, ...coordinates, radiusKm: radius };
    if (!append) { activeSearch.current = options; setItems([]); setPlaces([]); setMore(false); }
    setLoading(true); setError('');
    try {
      if (nextMode === 'restaurants') {
        const rows = await searchFoodMenuPlaces({ ...options, offset: append ? places.length : 0 });
        if (current !== request.current) return;
        setPlaces(old => append ? [...old, ...rows] : rows); setMore(rows.length === 30);
      } else {
        const rows = await searchFoodMenus({ ...options, offset: append ? items.length : 0 });
        if (current !== request.current) return;
        setItems(old => append ? [...old, ...rows] : rows); setMore(rows.length === 30);
      }
    } catch (e) { if (current === request.current) setError((e as Error).message); }
    finally { if (current === request.current) setLoading(false); }
  }
  // ?mode=restaurants opens the Restaurants tab directly (links from other pages).
  useEffect(() => {
    if (!router.isReady) return;
    const wanted: MenuMode = router.query.mode === 'restaurants' ? 'restaurants' : 'dishes';
    modeRef.current = wanted; setMode(wanted); search(false, center, wanted);
    return () => { request.current++; };
  }, [router.isReady]);
  function switchMode(next: MenuMode) {
    if (next === mode) return;
    modeRef.current = next; setMode(next); search(false, center, next);
  }
  const resultCount = mode === 'restaurants' ? places.length : items.length;
  function nearby() {
    if (!navigator.geolocation) { setError('Location is unavailable. Enter a city or ZIP code.'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      const next = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setCenter(next); setCity(''); search(false, next);
    }, () => setError('Could not access your location. Enter a city or ZIP code.'));
  }
  return <AppLayout><Head><title>Food Menu | Tavvy</title></Head>
    <main className="food-discovery">
      <Link href="/app">← Explore</Link><h1>Food Menu</h1>
      <div className="segment" role="tablist" aria-label="Browse by">
        {([['dishes', 'Dishes'], ['restaurants', 'Restaurants']] as [MenuMode, string][]).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={mode === key} className={mode === key ? 'on' : ''} onClick={() => switchMode(key)}>{label}</button>)}
      </div>
      <p>{mode === 'restaurants' ? 'Browse restaurants that share their full menu on Tavvy.' : 'Find dishes on restaurant menus, including dishes with creative names.'}</p>
      <form onSubmit={e => { e.preventDefault(); search(); }}>
        <label>{mode === 'restaurants' ? 'Restaurant or dish (optional)' : 'What would you like to eat?'}<input value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === 'restaurants' ? 'Try feijoada or a restaurant name' : 'Try chicken parmesan or fish tacos'} maxLength={120} /></label>
        <label>City, state, or ZIP code<input value={city} onChange={e => { setCity(e.target.value); setCenter(undefined); }} placeholder={center ? 'Using your current location' : 'All locations'} maxLength={120} /></label>
        <div className="actions"><button type="button" onClick={nearby}>Use my location</button>
        {center && <label>Within<select value={radius} onChange={e => setRadius(Number(e.target.value))}>{[5, 10, 25, 50, 100].map(km => <option key={km} value={km}>{km} km</option>)}</select></label>}
        <button type="submit" disabled={loading}>Search menus</button></div>
      </form>
      {error && <p role="alert">{error}</p>}
      <div aria-live="polite">{loading ? 'Searching menus…' : !error && `${resultCount}${more ? '+' : ''} ${mode === 'restaurants' ? 'restaurants with menus' : 'dishes'} found`}</div>
      {!loading && !error && !resultCount && <p>{mode === 'restaurants' ? 'No restaurant menus found here yet. Try another location.' : 'No dishes found. Try another dish or location. Restaurants may not have added their menus yet.'}</p>}
      {mode === 'restaurants' && <div className="results">{places.map(place => <Link key={place.place_id} href={`/place/${place.place_id}/menu`} className="dish">
        {place.cover_image_url && <img src={place.cover_image_url} alt="" loading="lazy" />}
        <div><h2>{place.place_name}</h2>
        <p>{[place.city, place.state].filter(Boolean).join(', ')}{place.distance_km != null && ` · ${place.distance_km.toFixed(1)} km`}</p>
        <strong>{place.dish_count} {place.dish_count === 1 ? 'dish' : 'dishes'} on the menu</strong>
        {place.sample_dishes.length > 0 && <p>{place.sample_dishes.join(' · ')}</p>}
        <small>See full menu →</small></div>
      </Link>)}</div>}
      {mode === 'dishes' && <div className="results">{items.map(item => <Link key={item.id} href={`/place/${item.place_id}/menu?dish=${item.id}`} className="dish">
        {item.image_url && <img src={item.image_url} alt="" loading="lazy" />}
        <div><h2>{item.item_name}</h2><strong>{item.place_name}</strong>
        <p>{[item.city, item.state].filter(Boolean).join(', ')}{item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km`}</p>
        {item.dish_type && item.dish_type !== item.item_name && <p>{item.dish_type}</p>}
        {item.description && <p>{item.description}</p>}
        {(item.price_label || item.price != null) && <span>{item.price_label || `Listed price: ${Number(item.price).toFixed(2)}`}</span>}<small>View menu →</small></div>
      </Link>)}</div>}
      {more && <button onClick={() => search(true)} disabled={loading}>Load more</button>}
      <p className="note">Menu details come from restaurants. Confirm ingredients, allergens, prices, and availability with the restaurant.</p>
    </main>
    <style jsx>{`
      .food-discovery { max-width: 900px; margin: auto; padding: 28px 20px 100px; color: ${theme.text}; background: ${theme.background}; min-height: 100vh; }
      .food-discovery :global(a) { color: ${accent}; } input::placeholder { color: ${theme.textSecondary}; opacity: 1; } input:focus-visible,select:focus-visible,button:focus-visible { outline: 3px solid ${accent}; outline-offset: 3px; }
      h1 { font-size: 34px; margin-bottom: 8px; } .segment { display: inline-flex; gap: 4px; padding: 4px; border-radius: 12px; background: ${theme.surface}; border: 1px solid ${theme.border}; margin: 4px 0 10px; } .segment button { background: transparent; color: ${theme.text}; padding: 9px 18px; border-radius: 9px; } .segment button.on { background: #8A05BE; color: #fff; } form { margin: 24px 0; display: grid; gap: 14px; }
      label { display: grid; gap: 6px; font-weight: 600; } input, select { padding: 13px; border: 1px solid ${isDark ? '#897C9A' : '#83718F'}; border-radius: 10px; color: ${theme.text}; background: ${theme.surface}; font-size: 16px; }
      .actions { display: flex; gap: 10px; align-items: end; flex-wrap: wrap; } button { padding: 13px 18px; border: 0; border-radius: 10px; background: #8A05BE; color: white; cursor: pointer; font-weight: 600; } button:disabled { opacity: .6; }
      .results { display: grid; gap: 14px; margin: 20px 0; } .results :global(.dish) { display: flex; gap: 16px; color: inherit; text-decoration: none; background: ${theme.surface}; padding: 18px; border: 1px solid ${theme.border}; border-radius: 16px; }
      img { width: 90px; height: 90px; object-fit: cover; border-radius: 10px; } h2 { font-size: 20px; margin: 0 0 6px; } p { line-height: 1.5; } small { display: block; margin-top: 12px; color: ${accent}; } .note { color: ${theme.textSecondary}; font-size: 13px; }
    `}</style>
  </AppLayout>;
}

export async function getStaticProps({ locale }: { locale: string }) {
  return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } };
}
