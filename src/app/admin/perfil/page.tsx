import { requireProfile } from '@/lib/session';
import ActionForm from '@/components/ActionForm';
import { updateOwnProfile } from '../actions';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/lib/types';

export default async function PerfilPage() {
  const { supabase, user, profile } = await requireProfile();
  const { data } = await supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8);
  const logs = (data ?? []) as AuditLog[];
  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3">Dados Institucionais do Utilizador</h4>
          <ActionForm action={updateOwnProfile} submitLabel="Guardar Alterações" resetOnSuccess={false}>
            <div className="mb-3"><label className="form-label small fw-semibold">Nome Completo</label>
              <input name="name" className="form-control form-control-sm" defaultValue={profile.name} required /></div>
            <div className="mb-3"><label className="form-label small fw-semibold">Email Institucional</label>
              <input className="form-control form-control-sm bg-light" value={profile.email} readOnly /></div>
            <div className="mb-3"><label className="form-label small fw-semibold">Contacto Telefónico</label>
              <input name="phone" className="form-control form-control-sm" defaultValue={profile.phone ?? ''} /></div>
            <div className="mb-3"><label className="form-label small fw-semibold">Perfil / Cargo (controlado pelo Administrador)</label>
              <input className="form-control form-control-sm bg-light" value={profile.role} readOnly /></div>
            <div className="mb-3"><label className="form-label small fw-semibold">Nova Palavra-passe (opcional, mín. 8 caracteres)</label>
              <input name="password" type="password" minLength={8} autoComplete="new-password" className="form-control form-control-sm" placeholder="Deixe em branco para manter a actual" /></div>
          </ActionForm>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3">Histórico Pessoal de Actividades</h4>
          <ul className="list-group list-group-flush small">
            {logs.length === 0 && <li className="list-group-item px-0 text-muted">Sem actividades registadas.</li>}
            {logs.map((l) => (
              <li key={l.id} className="list-group-item px-0">
                <div className="fw-medium">{l.action}</div><small className="text-muted">{formatDateTime(l.created_at)} &bull; {l.module}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
