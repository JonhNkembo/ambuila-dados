import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { isAdminLevel } from '@/lib/permissions';
import { loadCore } from '@/lib/data';
import ActionForm from '@/components/ActionForm';
import { addCommune } from '../actions';
import { canManageCommunes } from '@/lib/permissions';

const TABLES = ['profiles', 'communes', 'institutions', 'categories', 'datasets', 'projects', 'locations', 'publications', 'audit_logs', 'storage: datasets'];

export default async function ConfiguracoesPage() {
  const { supabase, profile } = await requireProfile();
  if (!isAdminLevel(profile)) redirect('/admin');
  const { communes } = await loadCore(supabase);
  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3">Comunas do Município de Ambuíla</h4>
          {canManageCommunes(profile) ? (
            <ActionForm action={addCommune} submitLabel="Adicionar" className="d-flex gap-2 mb-3" buttonClass="btn btn-sm btn-inst-primary text-nowrap">
              <input name="name" className="form-control form-control-sm" placeholder="Nome da nova comuna ou divisão..." required />
            </ActionForm>
          ) : <div className="alert alert-light border small">Apenas o Superadministrador e o Administrador Municipal podem alterar a divisão administrativa.</div>}
          <ul className="list-group list-group-flush small">
            {communes.map((c) => (
              <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span><strong>{c.name}</strong> <small className="text-muted">({c.code})</small></span>
                <span className="badge-status-publicado px-2 py-1 rounded">{c.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-2">Arquitectura Relacional (PostgreSQL / Supabase)</h4>
          <p className="small text-muted mb-2">Tabelas activas no modelo de dados, protegidas por Row Level Security:</p>
          <div className="p-3 bg-light border rounded font-monospace" style={{ fontSize: '0.75rem' }}>{TABLES.join(', ')}</div>
        </div>
      </div>
    </div>
  );
}
