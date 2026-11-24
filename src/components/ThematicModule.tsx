'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ChartCanvas from './ChartCanvas';
import DatasetForm from './DatasetForm';
import DatasetDetailModal from './DatasetDetailModal';
import { formatNumber, metricLabel, statusBadgeClass } from '@/lib/format';
import { submitCategories } from '@/lib/permissions';
import type { Category, Commune, Dataset, Institution, Profile } from '@/lib/types';

interface Props {
  categoryName: string; datasets: Dataset[]; categories: Category[]; communes: Commune[]; institutions: Institution[]; profile: Profile;
}

export default function ThematicModule({ categoryName, datasets, categories, communes, institutions, profile }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Dataset | null>(null);
  const meta = categories.find((c) => c.id === categoryName);
  const catDs = useMemo(() => datasets.filter((d) => d.category === categoryName), [datasets, categoryName]);

  const agg = useMemo(() => {
    const a: Record<string, number | string> = {};
    catDs.forEach((d) => Object.entries(d.metrics ?? {}).forEach(([k, v]) => {
      if (typeof v === 'number') a[k] = (Number(a[k]) || 0) + v;
      else if (!a[k]) a[k] = v;
    }));
    return a;
  }, [catDs]);

  return (
    <>
      <div className="inst-card p-4 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h3 className="h5 fw-bold text-inst-dark mb-0">{categoryName}</h3><span className="badge-demo">Módulo Sectorial</span>
          </div>
          <p className="small text-muted mb-0">{meta?.description}</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/relatorios" className="btn btn-sm btn-outline-secondary">Gerar Relatório</Link>
          {submitCategories(profile, categories.map((c) => c.id)).includes(categoryName) && (
            <button className="btn btn-sm btn-inst-primary" onClick={() => setFormOpen(true)}>
              <Plus size={15} className="me-1" /> Registar Dados em {categoryName}
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {Object.keys(agg).length === 0 && <div className="col-12"><div className="alert alert-light border small mb-0">Ainda não existem métricas numéricas consolidadas para esta categoria.</div></div>}
        {Object.entries(agg).map(([k, v]) => (
          <div className="col-sm-6 col-lg-3" key={k}>
            <div className="kpi-card h-100">
              <div className="kpi-label">{metricLabel(k)}</div>
              <div className="kpi-value mt-1" style={{ fontSize: '1.3rem' }}>{typeof v === 'number' ? formatNumber(v) : v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="inst-card p-4 h-100">
            <h4 className="h6 fw-bold text-inst-dark mb-3">Registos por Comuna ({categoryName})</h4>
            <ChartCanvas legend={false} integer labels={communes.map((c) => c.name)}
              series={[{ label: 'Registos Sectoriais', color: '#1B5E3B', data: communes.map((c) => catDs.filter((d) => d.commune === c.name).length) }]} />
          </div>
        </div>
        <div className="col-lg-7">
          <div className="inst-card p-4 h-100">
            <h4 className="h6 fw-bold text-inst-dark mb-3">Conjuntos de Dados da Área ({catDs.length})</h4>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle small mb-0">
                <thead className="table-light"><tr><th>Nome</th><th>Comuna</th><th>Ano</th><th>Estado</th><th className="text-end">Acção</th></tr></thead>
                <tbody>
                  {catDs.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-3">Sem conjuntos registados nesta área.</td></tr>}
                  {catDs.map((d) => (
                    <tr key={d.id}>
                      <td className="fw-medium">{d.name}</td><td>{d.commune}</td><td>{d.year}</td>
                      <td><span className={`badge ${statusBadgeClass(d.status)}`}>{d.status}</span></td>
                      <td className="text-end"><button className="btn btn-sm btn-light border" onClick={() => setDetail(d)}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {formOpen && <DatasetForm open dataset={null} presetCategory={categoryName} profile={profile} categories={categories}
        communes={communes} institutions={institutions} onClose={() => setFormOpen(false)} />}
      <DatasetDetailModal dataset={detail} onClose={() => setDetail(null)} allowFile />
    </>
  );
}
