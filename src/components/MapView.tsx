'use client';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationPoint } from '@/lib/types';
import { AMBUILA_CENTER, MAP_COLORS } from '@/lib/constants';

// Ícones SVG inline: evita o problema clássico dos ícones PNG do Leaflet em bundlers
const pin = (color: string) =>
  L.divIcon({
    className: '',
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
  });

export default function MapView({ locations, height = 440 }: { locations: LocationPoint[]; height?: number }) {
  return (
    <MapContainer center={AMBUILA_CENTER} zoom={11} className="map-container" style={{ height }} scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors | AMBÚILA DATA"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={pin(MAP_COLORS[loc.category] ?? '#1B5E3B')}>
          <Popup>
            <div style={{ minWidth: 200 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B5E3B', textTransform: 'uppercase' }}>
                {loc.category} • {loc.commune}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', margin: '3px 0', color: '#0F3D26' }}>{loc.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#5E6B63', marginBottom: 6 }}>{loc.description}</div>
              <div style={{ fontSize: '0.72rem', color: '#5E6B63', borderTop: '1px solid #E4DECF', paddingTop: 4 }}>
                Coord: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} {loc.is_demo ? '(Ref. Demo)' : '(Real)'}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
