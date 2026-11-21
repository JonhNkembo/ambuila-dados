import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import ActionForm from '@/components/ActionForm';
import { addInstitution } from '../actions';
import { canManageInstitutions } from '@/lib/permissions';

export default async function InstituicoesPage() {
  const { supabase, profile } = await requireProfile();
  const { institutions, communes, datasets } = await loadCore(supabase);
  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="inst-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead className="table-light"><tr><th>Instituição</th><th>Tipo</th><th>Comuna</th><th>Contacto</th><th className="text-end">Datasets</th></tr></thead>
              <tbody>
                {institutions.map((i) => (
                  <tr key={i.id}><td className="fw-semibold">{i.name}</td><td>{i.type}</td><td>{i.commune}</td><td>{i.contact}</td>
                    <td className="text-end">{datasets.filter((d) => d.institution === i.name).length}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3">Registar Instituição</h4>
          {!canManageInstitutions(profile) ? (
            <div className="alert alert-light border small mb-0">Apenas a administração pode registar instituições.</div>
          ) : (
            <ActionForm action={addInstitution} submitLabel="Guardar Instituição" buttonClass="btn btn-sm btn-inst-primary w-100">
              <div className="mb-2"><label className="form-label small fw-semibold">Nome *</label><input name="name" className="form-control form-control-sm" required /></div>
              <div className="mb-2"><label className="form-label small fw-semibold">Tipo</label>
                <select name="type" className="form-select form-select-sm"><option>Órgão Municipal</option><option>Direcção Sectorial</option><option>Repartição Técnica</option><option>Parceiro Académico</option><option>ONG / Parceiro</option></select></div>
              <div className="mb-2"><label className="form-label small fw-semibold">Comuna</label>
                <select name="commune" className="form-select form-select-sm">{communes.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
              <div className="mb-3"><label className="form-label small fw-semibold">Email de contacto</label><input name="contact" type="email" className="form-control form-control-sm" /></div>
            </ActionForm>
          )}
        </div>
      </div>
    </div>
  );
}
