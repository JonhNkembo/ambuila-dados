import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import ActionForm from '@/components/ActionForm';
import { addProject } from '../actions';
import { canManageTerritory } from '@/lib/permissions';

export default async function ProjectosPage() {
  const { supabase, profile } = await requireProfile();
  const { projects, communes } = await loadCore(supabase);
  const badge = (s: string) => (s === 'Concluído' ? 'badge-status-publicado' : s === 'Em Execução' ? 'badge-status-validacao' : 'badge-status-submetido');

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="inst-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead className="table-light"><tr><th>Projecto</th><th>Sector</th><th>Comuna</th><th>Ano</th><th>Orçamento</th><th style={{ minWidth: 150 }}>Execução</th><th>Estado</th></tr></thead>
              <tbody>
                {projects.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">Sem projectos registados.</td></tr>}
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-medium">{p.name}{p.is_demo && <span className="badge-demo ms-1">Demo</span>}</td>
                    <td>{p.sector}</td><td>{p.commune}</td><td>{p.year}</td><td className="text-nowrap">{p.budget}</td>
                    <td>
                      <div className="progress" style={{ height: 8 }} role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="progress-bar" style={{ width: `${p.progress}%`, backgroundColor: p.progress === 100 ? '#15803D' : '#13315C' }} />
                      </div>
                      <small className="text-muted">{p.progress}%</small>
                    </td>
                    <td><span className={`badge ${badge(p.status)}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3">Registar Novo Projecto</h4>
          {!canManageTerritory(profile) ? (
            <div className="alert alert-light border small mb-0">O seu perfil tem acesso de leitura.</div>
          ) : (
            <ActionForm action={addProject} submitLabel="Guardar Projecto" buttonClass="btn btn-sm btn-inst-primary w-100">
              <div className="mb-2"><label className="form-label small fw-semibold">Designação *</label><input name="name" className="form-control form-control-sm" required /></div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label small fw-semibold">Sector</label>
                  <input name="sector" className="form-control form-control-sm" placeholder="Educação" /></div>
                <div className="col-6"><label className="form-label small fw-semibold">Comuna</label>
                  <select name="commune" className="form-select form-select-sm">{communes.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label small fw-semibold">Ano</label>
                  <input name="year" type="number" className="form-control form-control-sm" defaultValue={new Date().getFullYear()} /></div>
                <div className="col-6"><label className="form-label small fw-semibold">Orçamento</label>
                  <input name="budget" className="form-control form-control-sm" placeholder="50.000.000 Kz" /></div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6"><label className="form-label small fw-semibold">Execução (%)</label>
                  <input name="progress" type="number" min={0} max={100} className="form-control form-control-sm" defaultValue={0} /></div>
                <div className="col-6"><label className="form-label small fw-semibold">Estado</label>
                  <select name="status" className="form-select form-select-sm"><option>Planeado</option><option>Em Execução</option><option>Concluído</option><option>Suspenso</option></select></div>
              </div>
            </ActionForm>
          )}
        </div>
      </div>
    </div>
  );
}
