import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MobileBusiness, validCoordinates } from '../lib/onthego';
const layers: Record<string, { url: string; attribution: string }> = {
  standard: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  dark: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
};
function Frame({ businesses, location }: { businesses: MobileBusiness[]; location: [number, number] | null }) {
  const map = useMap();
  const geometryKey = JSON.stringify([businesses.map(b => [b.tavvy_place_id,b.is_live?b.session_lat:b.next_event?.latitude,b.is_live?b.session_lng:b.next_event?.longitude]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),location]);
  useEffect(() => {
    const points: [number, number][] = businesses.flatMap(b => {
      const lat = b.is_live ? b.session_lat : b.next_event?.latitude;
      const lng = b.is_live ? b.session_lng : b.next_event?.longitude;
      return validCoordinates(lat, lng) ? [[lat!, lng!]] : [];
    });
    if (location) points.push(location);
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    // Only a changed geographic result set reframes the map; polling preserves pan/zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geometryKey]);
  return null;
}
export default function OnTheGoMap({ businesses, location, layer, onSelect }: { businesses: MobileBusiness[]; location: [number, number] | null; layer: string; onSelect: (b: MobileBusiness) => void }) {
  const tiles = layers[layer] || layers.standard;
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setTileState('loading'); const timer = setTimeout(() => setTileState(state => state === 'loading' ? 'error' : state), 15000); return () => clearTimeout(timer); }, [layer, attempt]);
  return <div style={{ height: '100%', width: '100%', position: 'relative' }}><MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
    <TileLayer className={layer === 'dark' ? 'onthego-dark-tile' : undefined} key={`${layer}-${attempt}`} url={tiles.url} attribution={tiles.attribution} eventHandlers={{ tileload: () => setTileState('ready') }} />
    <Frame businesses={businesses} location={location} />
    {location && <CircleMarker center={location} radius={8} pathOptions={{ color: '#fff', fillColor: '#2563eb', fillOpacity: 1 }}><Popup>Your location</Popup></CircleMarker>}
    {businesses.map(b => {
      const lat = b.is_live ? b.session_lat : b.next_event?.latitude;
      const lng = b.is_live ? b.session_lng : b.next_event?.longitude;
      if (!validCoordinates(lat, lng)) return null;
      return <CircleMarker key={b.session_id || b.tavvy_place_id} center={[lat!, lng!]} radius={10} pathOptions={{ color: b.is_live ? '#dc2626' : '#6366f1', fillOpacity: 0.85 }}>
        <Popup><strong>{b.place_name}</strong><p>{b.is_live ? 'Live location' : 'Upcoming scheduled location'}</p><p>{b.category}</p><button onClick={() => onSelect(b)}>View business</button></Popup>
      </CircleMarker>;
    })}
  </MapContainer>{tileState !== 'ready' && <div role={tileState === 'error' ? 'alert' : 'status'} style={{ position: 'absolute', zIndex: 500, top: 12, left: 55, right: 12, background: '#fff', color: '#172033', padding: 10, borderRadius: 8 }}>
    {tileState === 'loading' ? 'Loading map tiles…' : <>Map tiles could not load. <button onClick={() => setAttempt(n => n + 1)}>Retry map</button> or choose another map layer.</>}
  </div>}<style jsx global>{`.onthego-dark-tile { filter: invert(1) hue-rotate(180deg) brightness(.8) contrast(.85); }`}</style></div>;
}
