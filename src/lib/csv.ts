import type { Dataset } from './types';

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function downloadCSV(rows: (string | number | null | undefined)[][], filename: string) {
  // BOM UTF-8 para o Excel abrir correctamente os acentos
  const csv = '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const datasetsToRows = (ds: Dataset[]) => [
  ['Nome', 'Categoria', 'Comuna', 'Instituição', 'Fonte', 'Ano', 'Estado', 'Licença', 'Classificação', 'Métricas'],
  ...ds.map((d) => [
    d.name, d.category, d.commune, d.institution, d.source, d.year, d.status, d.license,
    d.is_demo ? 'Demonstração' : 'Oficial',
    Object.entries(d.metrics ?? {}).map(([k, v]) => `${k}=${v}`).join(' | '),
  ]),
];

export const exportSingleDatasetCSV = (d: Dataset) =>
  downloadCSV(
    [['Campo', 'Valor'],
      ['Nome', d.name], ['Categoria', d.category], ['Comuna', d.commune], ['Instituição', d.institution],
      ['Fonte', d.source], ['Ano', d.year], ['Licença', d.license],
      ...Object.entries(d.metrics ?? {}).map(([k, v]) => [k, v])],
    `${d.name.slice(0, 40).replace(/[^\w]+/g, '_')}.csv`,
  );
