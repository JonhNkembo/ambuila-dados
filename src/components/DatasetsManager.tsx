'use client';
import { useMemo, useState, useTransition } from 'react';
import { Search, Download, Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import DatasetForm from './DatasetForm';
import DatasetDetailModal from './DatasetDetailModal';
import Modal from './Modal';
import { useToast } from './Toast';
import { changeDatasetStatus, deleteDataset } from '@/app/admin/actions';
import { canDelete, canSubmit, canValidate } from '@/lib/permissions';
import { downloadCSV, datasetsToRows } from '@/lib/csv';
import { statusBadgeClass, STATUS_FLOW } from '@/lib/format';
import { STATUSES } from '@/lib/constants';
import type { Category, Commune, Dataset, DatasetStatus, Institution, Profile } from '@/lib/types';

interface Props {
  datasets: Dataset[]; categories: Category[]; communes: Commune[]; institutions: Institution[];
  profile: Profile; openNew?: boolean;
}

export default function DatasetsManager({ datasets, categories, communes, institutions, profile, openNew }: Props) {
  const toast = useToast();
  const [, start] = useTransition();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [formOpen, setFormOpen] = useState(!!openNew && canSubmit(profile));
  const [editing, setEditing] = useState<Dataset | null>(null);
  const [detail, setDetail] = useState<Dataset | null>(null);
  const [toDelete, setToDelete] = useState<Dataset | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return datasets.filter(
      (d) =>
        (cat === 'ALL' || d.category === cat) &&
        (status === 'ALL' || d.status === status) &&
        (!s || [d.name, d.source, d.author, d.commune].some((t) => (t ?? '').toLowerCase().includes(s))),
    );
  }, [datasets, q, cat, status]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); toast(r.message, r.ok); });
  const setSt = (d: Dataset, s: DatasetStatus) => run(() => changeDatasetStatus(d.id, s));
  const canEdit = (d: Dataset) => canValidate(profile, d.category) || (profile.role === 'Funcionário de Sector' && d.author_id === profile.id && ['Rascunho', 'Submetido', 'Rejeitado'].includes(d.status));

  return (
    <>
      <div className="inst-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white"><Search size={14} /></span>
              <input className="form-control" placeholder="Pesquisar por nome, fonte ou responsável..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
              <option value="ALL">Todas Categorias</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Estado">
              <option value="ALL">Todos Estados</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-4 text-md-end d-flex flex-wrap justify-content-md-end gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => downloadCSV(datasetsToRows(rows), 'ambuila_conjuntos_de_dados.csv')}>
              <Download size={14} className="me-1" /> Exportar CSV
            </button>
            {canSubmit(profile) && (
              <button className="btn btn-sm btn-inst-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus size={14} className="me-1" /> Novo Conjunto
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="alert alert-light border small d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <span><strong>Fluxo Institucional:</strong> {STATUS_FLOW}</span>
        <span className="text-muted">Perfil actual: <strong>{profile.role}</strong></span>
      </div>

      <div className="inst-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr><th>Conjunto de Dados</th><th>Categoria</th><th>Comuna</th><th>Ano</th><th>Instituição / Fonte</th><th>Estado</th><th className="text-end">Acções</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Nenhum registo encontrado.</td></tr>}
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="fw-medium" style={{ maxWidth: 300 }}>
                    {d.name} {d.is_demo && <span className="badge-demo ms-1">Demo</span>}
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{d.author}</div>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.commune}</td>
                  <td>{d.year}</td>
                  <td><div>{d.institution}</div><div className="text-muted" style={{ fontSize: '0.72rem' }}>{d.source}</div></td>
                  <td><span className={`badge ${statusBadgeClass(d.status)}`}>{d.status}</span></td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-light border me-1" title="Ver detalhes" onClick={() => setDetail(d)}><Eye size={14} /></button>
                    {canValidate(profile, d.category) && d.status === 'Submetido' && (
                      <button className="btn btn-sm btn-light border me-1" title="Iniciar validação" onClick={() => setSt(d, 'Em Validação')}><ShieldCheck size={14} /></button>
                    )}
                    {canValidate(profile, d.category) && d.status !== 'Publicado' && (
                      <button className="btn btn-sm btn-light border me-1 text-success" title="Aprovar e publicar" onClick={() => setSt(d, 'Publicado')}><CheckCircle2 size={14} /></button>
                    )}
                    {canValidate(profile, d.category) && d.status !== 'Rejeitado' && d.status !== 'Publicado' && (
                      <button className="btn btn-sm btn-light border me-1 text-danger" title="Rejeitar" onClick={() => setSt(d, 'Rejeitado')}><XCircle size={14} /></button>
                    )}
                    {canValidate(profile, d.category) && d.status === 'Publicado' && (
                      <button className="btn btn-sm btn-light border me-1" title="Retirar de publicação" onClick={() => setSt(d, 'Em Validação')}><XCircle size={14} /></button>
                    )}
                    {canEdit(d) && (
                      <button className="btn btn-sm btn-light border me-1" title="Editar" onClick={() => { setEditing(d); setFormOpen(true); }}><Pencil size={14} /></button>
                    )}
                    {canDelete(profile) && (
                      <button className="btn btn-sm btn-light border text-danger" title="Eliminar" onClick={() => setToDelete(d)}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <DatasetForm key={editing?.id ?? 'new'} open dataset={editing} profile={profile} categories={categories}
          communes={communes} institutions={institutions} onClose={() => { setFormOpen(false); setEditing(null); }} />
      )}
      <DatasetDetailModal dataset={detail} onClose={() => setDetail(null)} allowFile />
      <Modal open={!!toDelete} title="Confirmar eliminação" size="md" onClose={() => setToDelete(null)}
        footer={<>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setToDelete(null)}>Cancelar</button>
          <button className="btn btn-sm btn-danger" onClick={() => { const d = toDelete!; setToDelete(null); run(() => deleteDataset(d.id)); }}>Eliminar definitivamente</button>
        </>}>
        <p className="mb-1">Vai eliminar o conjunto de dados:</p>
        <p className="fw-bold text-inst-dark mb-2">{toDelete?.name}</p>
        <p className="small text-muted mb-0">Esta operação é irreversível e fica registada na auditoria.</p>
      </Modal>
    </>
  );
}
