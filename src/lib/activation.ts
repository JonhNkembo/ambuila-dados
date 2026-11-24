import { createAdminClient } from '@/lib/supabase/admin';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/lib/types';

/**
 * Decide, NO SERVIDOR, se uma conta recém-registada fica activa e com que perfil.
 *  - ainda não há nenhum utilizador activo → Superadministrador (arranque do sistema);
 *  - cadastro activo + modo "email"         → perfil escolhido no cadastro;
 *  - qualquer outro caso                    → fica pendente até aprovação.
 * Devolve true se a conta ficou activa.
 */
export async function activateRegisteredUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }, { count: activeCount }, { data: cats }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('site_settings').select('allow_registration, registration_mode').eq('id', 1).maybeSingle(),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true),
    admin.from('categories').select('id'),
  ]);
  if (!profile) return false;
  if (profile.active) return true;

  const first = (activeCount ?? 0) === 0;
  const auto = first || (settings?.allow_registration && settings.registration_mode === 'email');
  if (!auto) return false;

  let role: Role = first ? 'Superadministrador' : ROLES.includes(profile.requested_role) ? profile.requested_role : 'Funcionário Normal';
  let sector: string | null = null;
  if (role === 'Funcionário de Sector') {
    if ((cats ?? []).some((c: { id: string }) => c.id === profile.requested_sector)) sector = profile.requested_sector;
    else role = 'Funcionário Normal';
  }
  const { error } = await admin.from('profiles')
    .update({ role, sector, active: true, requested_role: null, requested_sector: null }).eq('id', userId);
  if (error) return false;
  await admin.from('audit_logs').insert({
    user_id: userId, user_name: profile.name, role, module: 'Autenticação',
    action: `Conta activada como "${role}".`,
  });
  return true;
}
