import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { RVPlace, rvPlaceCategory, rvPlacePoint } from '../lib/rvCategories';

/**
 * Map view for RV & Camping (mirrors OnTheGoMap). Loaded client-side only
 * (next/dynamic, ssr:false) because Leaflet touches `window`. Every place that
 * has coordinates becomes a marker; places without coordinates stay list-only.
 */
const layers: Record<string, { url: string; attribution: string }> = {
  standard: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  dark: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
};

function Frame({ places, location }: { places: RVPlace[]; location: [number, number] | null }) {
  const map = useMap();
  const geometryKey = JSON.stringify([places.map(p => [p.id, ...(rvPlacePoint(p) || [])]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))), location]);
  useEffect(() => {
    const points: [number, number][] = places.flatMap(p => { const point = rvPlacePoint(p); return point ? [point] : []; });
    if (location) points.push(location);
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
    // Only a changed geographic result set reframes the map; loading more or re-rendering preserves pan/zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geometryKey]);
  return null;
}

export default function RVMap({ places, location, layer, onSelect }: { places: RVPlace[]; location: [number, number] | null; layer: string; onSelect: (place: RVPlace) => void }) {
  const tiles = layers[layer] || layers.standard;
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setTileState('loading'); const timer = setTimeout(() => setTileState(state => state === 'loading' ? 'error' : state), 15000); return () => clearTimeout(timer); }, [layer, attempt]);
  const mappable = places.filter(p => rvPlacePoint(p));
  return <div style={{ height: '100%', width: '100%', position: 'relative' }}><MapContainer center={[39, -98]} zoom={3} style={{ height: '100%', width: '100%' }}>
    <TileLayer className={layer === 'dark' ? 'onthego-dark-tile' : undefined} key={`${layer}-${attempt}`} url={tiles.url} attribution={tiles.attribution} eventHandlers={{ tileload: () => setTileState('ready') }} />
    <Frame places={places} location={location} />
    {location && <CircleMarker center={location} radius={8} pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }}><Popup>Your location</Popup></CircleMarker>}
    {mappable.map(place => {
      const point = rvPlacePoint(place)!;
      return <CircleMarker key={place.id} center={point} radius={10} pathOptions={{ color: '#8A05BE', fillColor: '#00C2CB', fillOpacity: 0.9, weight: 2 }}>
        <Popup><strong>{place.name}</strong><p>{[rvPlaceCategory(place), [place.city, place.region].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p><button onClick={() => onSelect(place)}>View place</button></Popup>
      </CircleMarker>;
    })}
  </MapContainer>
  {tileState === 'error' && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.55)', color: '#fff', textAlign: 'center', padding: 16 }}><div><p>Map tiles could not be loaded.</p><button onClick={() => setAttempt(a => a + 1)}>Retry</button></div></div>}
  {!mappable.length && tileState !== 'error' && <div role="status" style={{ position: 'absolute', left: 12, right: 12, bottom: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(23,1,58,.85)', color: '#fff', fontSize: 13 }}>No places with map coordinates in this list yet. Load more places or search a city.</div>}
  </div>;
}
