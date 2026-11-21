'use client';
import dynamic from 'next/dynamic';

// Leaflet depende de `window`: só renderiza no cliente
const Map = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="map-container d-flex align-items-center justify-content-center text-muted small">A carregar mapa…</div>,
});
export default Map;
