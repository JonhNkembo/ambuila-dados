'use client';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationPoint } from '@/lib/types';
import { AMBUILA_CENTER, MAP_COLORS, MUNICIPAL_SEAT } from '@/lib/constants';

// Ícones SVG inline: evita o problema clássico dos ícones PNG do Leaflet em bundlers
const pin = (color: string) =>
  L.divIcon({
    className: '',
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
    tooltipAnchor: [0, 2],
    html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
  });

// Ponto central (sede municipal): estrela dourada com ondas animadas
const seatIcon = L.divIcon({
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
  tooltipAnchor: [0, 22],
  html: `<div class="seat-marker"><span class="seat-pulse"></span><span class="seat-pulse seat-pulse-2"></span><svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="15" fill="#0F3D26" stroke="#EAB308" stroke-width="3"/><path d="M22 11.5l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2-6.5-3.5-6.5 3.5 1.3-7.2-5.3-5.1 7.3-1z" fill="#EAB308"/></svg></div>`,
});

/** Esconde os nomes quando o mapa está muito afastado (evita a sobreposição de etiquetas). */
function LabelZoom() {
  const map = useMap();
  useEffect(() => {
    const apply = () => map.getContainer().classList.toggle('labels-hidden', map.getZoom() < 10);
    apply();
    map.on('zoomend', apply);
    return () => { map.off('zoomend', apply); };
  }, [map]);
  return null;
}

export default function MapView({ locations, height = 440 }: { locations: LocationPoint[]; height?: number }) {
  return (
    <MapContainer center={AMBUILA_CENTER} zoom={11} className="map-container" style={{ height: `min(${height}px, 72vh)`, minHeight: 300 }} scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors | AMBÚILA DATA"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LabelZoom />

      <Marker position={MUNICIPAL_SEAT.position} icon={seatIcon} zIndexOffset={1000}>
        <Tooltip permanent direction="bottom" className="map-label map-label-seat">{MUNICIPAL_SEAT.name}</Tooltip>
        <Popup>
          <div style={{ minWidth: 190 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C28B1E', textTransform: 'uppercase' }}>Ponto central</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', margin: '3px 0', color: '#0F3D26' }}>{MUNICIPAL_SEAT.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#5E6B63' }}>{MUNICIPAL_SEAT.subtitle}</div>
          </div>
        </Popup>
      </Marker>

      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={pin(MAP_COLORS[loc.category] ?? '#1B5E3B')}>
          <Tooltip permanent direction="bottom" className="map-label">{loc.name}</Tooltip>
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
