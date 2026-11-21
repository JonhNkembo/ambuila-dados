'use client';
import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { downloadCSV, datasetsToRows } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import type { Category, Commune, Dataset } from '@/lib/types';

export default function ReportBuilder({ datasets, categories, communes, issuer }: { datasets: Dataset[]; categories: Category[]; communes: Commune[]; issuer: string }) {
  const [cat, setCat] = useState('ALL');
  const [com, setCom] = useState('ALL');
  const [year, setYear] = useState('ALL');
  const years = useMemo(() => [...new Set(datasets.map((d) => d.year))].sort((a, b) => b - a), [datasets]);
  const rows = datasets.filter((d) => (cat === 'ALL' || d.category === cat) && (com === 'ALL' || d.commune === com) && (year === 'ALL' || String(d.year) === year));

  return (
    <>
      <div className="inst-card p-3 mb-4 no-print">
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><label className="form-label small fw-semibold mb-1">Categoria</label>
            <select className="form-select form-select-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="ALL">Todas as Categorias</option>{categories.map((c) => <option key={c.id}>{c.id}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label small fw-semibold mb-1">Comuna</label>
            <select className="form-select form-select-sm" value={com} onChange={(e) => setCom(e.target.value)}>
              <option value="ALL">Todo o Município</option>{communes.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
          <div className="col-md-2"><label className="form-label small fw-semibold mb-1">Ano</label>
            <select className="form-select form-select-sm" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="ALL">Todos os Anos</option>{years.map((y) => <option key={y}>{y}</option>)}</select></div>
          <div className="col-md-4 text-md-end d-flex gap-2 justify-content-md-end">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadCSV(datasetsToRows(rows), 'ambuila_relatorio.csv')}>Exportar Excel / CSV</button>
            <button className="btn btn-sm btn-inst-primary" onClick={() => window.print()}><Printer size={14} className="me-1" /> Imprimir / Guardar PDF</button>
          </div>
        </div>
      </div>

      <div className="inst-card p-4 p-md-5" id="printable-report-area">
        <div className="border-bottom pb-3 mb-4 d-flex justify-content-between align-items-start">
          <div>
            <div className="text-uppercase small fw-bold text-muted">República de Angola &bull; Província do Uíge</div>
            <h2 className="h4 fw-bold text-inst-dark mb-1">Administração Municipal de Ambuíla</h2>
            <div className="text-inst-primary fw-semibold">AMBÚILA DATA – Relatório Estatístico e Territorial</div>
          </div>
          <div className="text-end small text-muted">
            <div>Data de Emissão: <strong>{formatDate(new Date().toISOString())}</strong></div>
            <div>Emitido por: <strong>{issuer}</strong></div>
          </div>
        </div>
        <p className="small text-muted mb-3">
          Âmbito do Relatório: <strong>{cat === 'ALL' ? 'Todas as Categorias' : cat}</strong> | Território: <strong>{com === 'ALL' ? 'Município de Ambuíla' : com}</strong> | Referência: <strong>{year === 'ALL' ? 'Série Completa' : year}</strong>
        </p>
        <div className="table-responsive mb-4">
          <table className="table table-bordered table-sm small">
            <thead className="table-light"><tr><th>Conjunto de Dados</th><th>Categoria</th><th>Comuna</th><th>Fonte</th><th>Ano</th><th>Estado</th><th>Classificação</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted">Sem registos para os critérios seleccionados.</td></tr>}
              {rows.map((d) => (
                <tr key={d.id}><td>{d.name}</td><td>{d.category}</td><td>{d.commune}</td><td>{d.source}</td><td>{d.year}</td><td>{d.status}</td><td>{d.is_demo ? 'Demonstração' : 'Oficial'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="small text-muted border-top pt-3">
          <strong>Nota Metodológica:</strong> documento gerado automaticamente pelo sistema AMBÚILA DATA. Os registos identificados como &ldquo;Demonstração&rdquo; servem apenas para validação funcional da plataforma e não constituem estatística oficial.
        </div>
      </div>
    </>
  );
}
