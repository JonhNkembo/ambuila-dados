'use client';
import { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';
import type { Dataset } from '@/lib/types';
import { formatDate, formatNumber, metricLabel, statusBadgeClass } from '@/lib/format';
import { exportSingleDatasetCSV } from '@/lib/csv';
import { getDatasetFileUrl } from '@/app/admin/actions';

export default function DatasetDetailModal({
  dataset, onClose, allowFile = false,
}: { dataset: Dataset | null; onClose: () => void; allowFile?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function downloadOriginal() {
    if (!dataset) return;
    setBusy(true);
    const r = await getDatasetFileUrl(dataset.id);
    setBusy(false);
    if (r.url) window.open(r.url, '_blank', 'noopener');
    else toast(r.message ?? 'Não foi possível obter o ficheiro.', false);
  }

  const d = dataset;
  return (
    <Modal open={!!d} title="Detalhes do Conjunto de Dados" onClose={onClose} size="lg"
      footer={d && (
        <>
          {allowFile && d.file_path && (
            <button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={downloadOriginal}>
              <FileDown size={14} className="me-1" /> Ficheiro original
            </button>
          )}
          <button className="btn btn-sm btn-inst-primary" onClick={() => exportSingleDatasetCSV(d)}>
            <Download size={14} className="me-1" /> Exportar CSV
          </button>
        </>
      )}>
      {d && (
        <>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <span className="badge bg-light text-inst-primary border">{d.category}</span>
            <span className={`badge ${statusBadgeClass(d.status)}`}>{d.status}</span>
            {d.is_demo && <span className="badge-demo">Dados de demonstração</span>}
          </div>
          <h4 className="h5 fw-bold text-inst-dark">{d.name}</h4>
          <p className="text-muted">{d.description}</p>
          <dl className="row small mb-3">
            {[
              ['Instituição', d.institution], ['Comuna', d.commune], ['Fonte', d.source], ['Ano de referência', d.year],
              ['Recolhido em', formatDate(d.collected_at)], ['Actualizado em', formatDate(d.updated_at)],
              ['Responsável', d.author], ['Ficheiro', d.file_name ?? '—'], ['Licença', d.license],
            ].map(([k, v]) => (
              <div className="col-sm-6 mb-2" key={String(k)}>
                <dt className="text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>{k}</dt>
                <dd className="mb-0">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>
          <h5 className="h6 fw-bold text-inst-dark">Indicadores registados</h5>
          {Object.keys(d.metrics ?? {}).length === 0 ? (
            <p className="small text-muted">Sem métricas numéricas associadas.</p>
          ) : (
            <div className="row g-2">
              {Object.entries(d.metrics).map(([k, v]) => (
                <div className="col-6 col-md-4" key={k}>
                  <div className="kpi-card">
                    <div className="kpi-label">{metricLabel(k)}</div>
                    <div className="kpi-value" style={{ fontSize: '1.15rem' }}>{typeof v === 'number' ? formatNumber(v) : v}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
