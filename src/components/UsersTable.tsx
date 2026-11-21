'use client';
import { useState, useTransition } from 'react';
import { useToast } from './Toast';
import ActionForm from './ActionForm';
import { createUser, setRegistration, updateUserAccess } from '@/app/admin/actions';
import { assignableRoles } from '@/lib/permissions';
import { ROLE_RANK } from '@/lib/constants';
import type { Profile, Role } from '@/lib/types';

interface Draft { role: Role; sector: string | null; active: boolean }

export default function UsersTable({ users, me, categories, allowRegistration }: { users: Profile[]; me: Profile; categories: string[]; allowRegistration: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [newRole, setNewRole] = useState<Role>('Funcionário Normal');
  const roles = assignableRoles(me);

  const val = (u: Profile): Draft => draft[u.id] ?? { role: u.role, sector: u.sector, active: u.active };
  const dirty = (u: Profile) => { const v = val(u); return v.role !== u.role || v.sector !== u.sector || v.active !== u.active; };
  const editable = (u: Profile) => u.id !== me.id && (me.role === 'Superadministrador' || ROLE_RANK[u.role] < ROLE_RANK[me.role]);
  const pendingUsers = users.filter((u) => !u.active).length;

  return (
    <>
      <div className="inst-card p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <div className="fw-bold text-inst-dark small">Tela de cadastro na página de login</div>
          <div className="small text-muted">
            {allowRegistration ? 'ACTIVA: quem pedir acesso fica pendente até aprovação.' : 'OCULTA: só entra quem já tem conta criada pela administração.'}
          </div>
        </div>
        <div className="form-check form-switch fs-5 mb-0">
          <input className="form-check-input" type="checkbox" role="switch" checked={allowRegistration} disabled={pending} aria-label="Tela de cadastro"
            onChange={(e) => start(async () => { const r = await setRegistration(e.target.checked); toast(r.message, r.ok); })} />
        </div>
      </div>

      {pendingUsers > 0 && <div className="alert alert-warning py-2 small">{pendingUsers} conta(s) por aprovar: active-as e atribua a função na tabela.</div>}

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="inst-card overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light"><tr><th>Utilizador</th><th>Função</th><th>Sector</th><th>Activo</th><th /></tr></thead>
                <tbody>
                  {users.map((u) => {
                    const v = val(u);
                    return (
                      <tr key={u.id}>
                        <td><div className="fw-semibold">{u.name}{u.id === me.id && <span className="badge bg-light text-dark border ms-1">Você</span>}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{u.email}</div></td>
                        <td style={{ minWidth: 190 }}>
                          {editable(u) ? (
                            <select className="form-select form-select-sm" value={v.role} aria-label={`Função de ${u.name}`}
                              onChange={(e) => setDraft((d) => ({ ...d, [u.id]: { ...v, role: e.target.value as Role } }))}>
                              {[...new Set([u.role, ...roles])].map((r) => <option key={r} disabled={!roles.includes(r)}>{r}</option>)}
                            </select>
                          ) : <span className="badge bg-primary bg-opacity-10 text-inst-primary">{u.role}</span>}
                        </td>
                        <td style={{ minWidth: 160 }}>
                          {editable(u) && v.role === 'Funcionário de Sector' ? (
                            <select className="form-select form-select-sm" value={v.sector ?? ''} aria-label={`Sector de ${u.name}`}
                              onChange={(e) => setDraft((d) => ({ ...d, [u.id]: { ...v, sector: e.target.value || null } }))}>
                              <option value="">— escolher —</option>{categories.map((c) => <option key={c}>{c}</option>)}
                            </select>
                          ) : <span className="text-muted">{u.role === 'Director de Turismo e Cultura' ? 'Cultura e património' : u.sector ?? '—'}</span>}
                        </td>
                        <td>
                          {editable(u) ? (
                            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={v.active} aria-label={`Activo: ${u.name}`}
                              onChange={(e) => setDraft((d) => ({ ...d, [u.id]: { ...v, active: e.target.checked } }))} /></div>
                          ) : <span className={`px-2 py-1 rounded ${u.active ? 'badge-status-publicado' : 'badge-status-submetido'}`}>{u.active ? 'Activo' : 'Pendente'}</span>}
                        </td>
                        <td className="text-end">
                          {dirty(u) && (
                            <button className="btn btn-sm btn-inst-primary" disabled={pending}
                              onClick={() => start(async () => {
                                const r = await updateUserAccess(u.id, v.role, v.sector, v.active);
                                toast(r.message, r.ok);
                                if (r.ok) setDraft((d) => { const n = { ...d }; delete n[u.id]; return n; });
                              })}>Guardar</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="inst-card p-4">
            <h4 className="h6 fw-bold text-inst-dark mb-3">Criar utilizador</h4>
            <ActionForm action={createUser} submitLabel="Criar conta activa" buttonClass="btn btn-sm btn-inst-primary w-100">
              <div className="mb-2"><label className="form-label small fw-semibold">Nome completo *</label><input name="name" className="form-control form-control-sm" required /></div>
              <div className="mb-2"><label className="form-label small fw-semibold">Email *</label><input name="email" type="email" className="form-control form-control-sm" required /></div>
              <div className="mb-2"><label className="form-label small fw-semibold">Função *</label>
                <select name="role" className="form-select form-select-sm" value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select></div>
              {newRole === 'Funcionário de Sector' && (
                <div className="mb-2"><label className="form-label small fw-semibold">Sector *</label>
                  <select name="sector" className="form-select form-select-sm" required>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
              )}
              <div className="row g-2 mb-2">
                <div className="col-7"><label className="form-label small fw-semibold">Instituição</label><input name="institution" className="form-control form-control-sm" /></div>
                <div className="col-5"><label className="form-label small fw-semibold">Telefone</label><input name="phone" className="form-control form-control-sm" /></div>
              </div>
              <div className="mb-3"><label className="form-label small fw-semibold">Palavra-passe inicial * (mín. 8)</label>
                <input name="password" type="password" minLength={8} className="form-control form-control-sm" required autoComplete="new-password" /></div>
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
