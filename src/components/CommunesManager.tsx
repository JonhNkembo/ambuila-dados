'use client';
import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import ActionForm from './ActionForm';
import Modal from './Modal';
import { addCommune, updateCommune } from '@/app/admin/actions';
import type { Commune } from '@/lib/types';

function Fields({ c }: { c?: Commune }) {
  return (
    <>
      <div className="mb-2"><label className="form-label small fw-semibold">Nome da comuna *</label>
        <input name="name" className="form-control form-control-sm" defaultValue={c?.name} required minLength={2} placeholder="Ex.: Nova Ambuíla" /></div>
      <div className="row g-2 mb-3">
        <div className="col-6"><label className="form-label small fw-semibold">Área (km²)</label>
          <input name="area_km2" type="number" step="any" min={0} className="form-control form-control-sm" defaultValue={c?.area_km2 ?? ''} /></div>
        <div className="col-6"><label className="form-label small fw-semibold">Estado</label>
          <select name="status" className="form-select form-select-sm" defaultValue={c?.status ?? 'Activa'}><option>Activa</option><option>Inactiva</option></select></div>
      </div>
    </>
  );
}

export default function CommunesManager({ communes, canEdit }: { communes: Commune[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<Commune | null>(null);
  return (
    <div className="inst-card p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h4 className="h6 fw-bold text-inst-dark mb-0">Comunas do Município de Ambuíla <span className="text-muted fw-normal">({communes.length})</span></h4>
      </div>

      {canEdit ? (
        <div className="p-3 mb-3 rounded border bg-light">
          <div className="small fw-bold text-inst-dark mb-2 d-flex align-items-center gap-1"><Plus size={14} /> Cadastrar nova comuna</div>
          <ActionForm action={addCommune} submitLabel="Cadastrar comuna" buttonClass="btn btn-sm btn-inst-primary w-100"><Fields /></ActionForm>
        </div>
      ) : <div className="alert alert-light border small">Apenas o Superadministrador e o Administrador Municipal podem alterar a divisão administrativa.</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle small mb-0">
          <thead className="table-light"><tr><th>Código</th><th>Comuna</th><th className="text-end">Área (km²)</th><th>Estado</th>{canEdit && <th />}</tr></thead>
          <tbody>
            {communes.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">Ainda não há comunas registadas.</td></tr>}
            {communes.map((c) => (
              <tr key={c.id}>
                <td className="text-muted">{c.code}</td>
                <td className="fw-semibold">{c.name}</td>
                <td className="text-end">{c.area_km2 ?? '—'}</td>
                <td><span className={`px-2 py-1 rounded ${c.status === 'Activa' ? 'badge-status-publicado' : 'badge-status-submetido'}`}>{c.status}</span></td>
                {canEdit && <td className="text-end"><button className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1" onClick={() => setEditing(c)}><Pencil size={14} /> Editar</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title={`Editar comuna${editing ? `: ${editing.name}` : ''}`} size="md" onClose={() => setEditing(null)}>
        {editing && (
          <ActionForm key={editing.id} action={updateCommune} submitLabel="Guardar alterações" resetOnSuccess={false}
            buttonClass="btn btn-sm btn-inst-primary w-100" onSuccess={() => setEditing(null)}>
            <input type="hidden" name="id" value={editing.id} />
            <Fields c={editing} />
            <div className="form-text mb-3">Ao mudar o nome, os conjuntos de dados, projectos e pontos do mapa dessa comuna acompanham a alteração.</div>
          </ActionForm>
        )}
      </Modal>
    </div>
  );
}
