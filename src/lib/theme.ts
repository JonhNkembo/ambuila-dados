/** Paleta única do portal (espelha as variáveis CSS em globals.css) — usada por gráficos, mapa e barras de progresso. */
export const PALETTE = {
  forest: '#1B5E3B',
  forestDark: '#0F3D26',
  forestLight: '#3F8F5F',
  leaf: '#6DAF7C',
  sand: '#E9DFC8',
  clay: '#B4412E',
  ochre: '#C28B1E',
  river: '#2F6F8F',
  plum: '#7A4E8C',
  slate: '#5E6B63',
} as const;

/** Sequência de cores para gráficos com várias séries. */
export const CHART_COLORS = [PALETTE.forest, PALETTE.ochre, PALETTE.clay, PALETTE.river, PALETTE.leaf, PALETTE.plum];
