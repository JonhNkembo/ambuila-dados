import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Decide, NO SERVIDOR, se uma conta recém-registada fica activa.
 * Só há activação automática em dois casos:
 *  - ainda não existe nenhum utilizador activo (arranque do sistema) → Superadministrador;
 *  - o email é o ADMIN_EMAIL definido no servidor → Superadministrador.
 * Em todos os outros casos a conta fica PENDENTE até o Superadministrador a aprovar.
 * Devolve true se a conta ficou (ou já estava) activa.
 */
export async function activateRegisteredUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const [{ data: profile }, { count: activeCount }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true),
  ]);
  if (!profile) return false;
  if (profile.active) return true;

  const first = (activeCount ?? 0) === 0;
  const owner = !!process.env.ADMIN_EMAIL && String(profile.email ?? '').toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase();
  if (!first && !owner) return false;

  const role = 'Superadministrador';
  const { error } = await admin.from('profiles')
    .update({ role, sector: null, active: true, requested_role: null, requested_sector: null }).eq('id', userId);
  if (error) return false;
  await admin.from('audit_logs').insert({
    user_id: userId, user_name: profile.name, role, module: 'Autenticação',
    action: `Conta activada como "${role}".`,
  });
  return true;
}
