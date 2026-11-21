export const formatNumber = (n: number | string | null | undefined): string =>
  new Intl.NumberFormat('pt-AO').format(Number(n) || 0);

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('pt-AO') : '—';

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'short' });

export const statusBadgeClass = (s: string): string =>
  ({
    Publicado: 'badge-status-publicado',
    'Em Validação': 'badge-status-validacao',
    Submetido: 'badge-status-submetido',
    Rejeitado: 'badge-status-rejeitado',
  } as Record<string, string>)[s] ?? 'bg-light text-dark border';

/** Escapa texto de utilizador antes de o injectar em HTML. */
export const esc = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const metricLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export const STATUS_FLOW = '1. Submissão → 2. Recepção → 3. Validação Técnica → 4. Aprovação / Rejeição → 5. Publicação no Portal';
