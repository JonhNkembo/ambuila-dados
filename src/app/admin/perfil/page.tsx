import { requireProfile } from '@/lib/session';
import ActionForm from '@/components/ActionForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import { updateOwnProfile } from '../actions';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/lib/types';

export default async function PerfilPage() {
  const { supabase, user, profile } = await requireProfile();
  const { data } = await supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8);
  const logs = (data ?? []) as AuditLog[];
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const hasPassword = providers.length === 0 || providers.includes('email');
  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="d-flex flex-column gap-4">
          <div className="inst-card p-4">
            <h4 className="h6 fw-bold text-inst-dark mb-3">Dados Institucionais do Utilizador</h4>
            <ActionForm action={updateOwnProfile} submitLabel="Guardar Alterações" resetOnSuccess={false}>
              <div className="mb-3"><label className="form-label small fw-semibold">Nome Completo</label>
                <input name="name" className="form-control form-control-sm" defaultValue={profile.name} required minLength={3} /></div>
              <div className="mb-3"><label className="form-label small fw-semibold">Email (não pode ser alterado)</label>
                <input className="form-control form-control-sm bg-light" value={profile.email} disabled readOnly aria-readonly="true" />
                <div className="form-text">O email identifica a sua conta. Para o mudar, contacte o Superadministrador.</div></div>
              <div className="mb-3"><label className="form-label small fw-semibold">Contacto Telefónico</label>
                <input name="phone" className="form-control form-control-sm" defaultValue={profile.phone ?? ''} /></div>
              <div className="mb-3"><label className="form-label small fw-semibold">Perfil / Cargo (atribuído pela administração)</label>
                <input className="form-control form-control-sm bg-light" value={profile.role} disabled readOnly /></div>
            </ActionForm>
          </div>
          <div className="inst-card p-4">
            <h4 className="h6 fw-bold text-inst-dark mb-1">Alterar palavra-passe</h4>
            <p className="small text-muted">Por segurança, confirme primeiro a palavra-passe actual.</p>
            <PasswordChangeForm hasPassword={hasPassword} />
          </div>
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
