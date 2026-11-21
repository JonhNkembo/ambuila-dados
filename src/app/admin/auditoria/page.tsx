import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { canViewAudit } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/lib/types';

export default async function AuditoriaPage() {
  const { supabase, profile } = await requireProfile();
  if (!canViewAudit(profile)) redirect('/admin');
  const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(300);
  const logs = (data ?? []) as AuditLog[];
  return (
    <div className="inst-card overflow-hidden">
      <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
        <span className="fw-bold small text-inst-dark">Registo Cronológico de Auditoria (Audit Logs)</span>
        <span className="badge bg-secondary">{logs.length} eventos</span>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle small mb-0">
          <thead className="table-light"><tr><th>Data / Hora</th><th>Utilizador</th><th>Perfil</th><th>Módulo</th><th>Acção Registada</th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">Sem eventos registados (ou sem permissão para os consultar).</td></tr>}
            {logs.map((a) => (
              <tr key={a.id}>
                <td className="text-nowrap text-muted">{formatDateTime(a.created_at)}</td>
                <td className="fw-semibold">{a.user_name}</td>
                <td><span className="badge bg-light text-dark border">{a.role}</span></td>
                <td>{a.module}</td><td>{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
