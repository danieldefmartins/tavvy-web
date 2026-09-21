import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { hasUniverseCoordinates } from '../lib/universePlaces';
type Point = { id: string; name: string; latitude?: number; longitude?: number };
function Frame({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => { if (points.length) map.fitBounds(points.map(p => [p.latitude!, p.longitude!] as [number, number]), { padding: [30, 30], maxZoom: 16 }); }, [map, points]);
  return null;
}
export default function UniverseMap({ places, universe, onSelect }: { places: Point[]; universe: Point; onSelect: (place: Point) => void }) {
  const markers = places.filter(hasUniverseCoordinates);
  const points = markers.length ? markers : hasUniverseCoordinates(universe) ? [universe] : [];
  if (!points.length) return <p>No location data is available for these places.</p>;
  return <MapContainer center={[points[0].latitude!, points[0].longitude!]} zoom={14} style={{ height: 400, width: '100%' }}>
    <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
    <Frame points={points} />
    {points.map(p => <CircleMarker key={p.id} center={[p.latitude!, p.longitude!]} radius={9}><Popup><strong>{p.name}</strong>{p.id !== universe.id && <p><button onClick={() => onSelect(p)}>View place</button></p>}</Popup></CircleMarker>)}
  </MapContainer>;
}
