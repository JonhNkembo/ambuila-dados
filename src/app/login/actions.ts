'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { activateRegisteredUser } from '@/lib/activation';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/lib/types';

/**
 * Cadastro público com CONFIRMAÇÃO POR EMAIL (Supabase envia a mensagem).
 * O perfil escolhido fica só como pedido (profiles.requested_role); quem o aplica é a rota /auth/confirm,
 * no servidor, depois de o email ser confirmado e consoante o modo de cadastro definido pelo administrador.
 * Só funciona com a tela de cadastro activa (ou, no arranque, enquanto não existir nenhum utilizador activo).
 */
export async function registerSelf(fd: FormData): Promise<{ ok: boolean; message: string; redirect?: boolean }> {
  const supabase = createClient();
  const { data: settings, error: sErr } = await supabase.from('site_settings').select('allow_registration').eq('id', 1).maybeSingle();
  if (sErr || !settings)
    return { ok: false, message: 'A configuração do portal não foi encontrada na base de dados. Corra o ficheiro supabase/fix_cadastro.sql no SQL Editor do Supabase.' };
  const { data: noActive } = await supabase.rpc('no_active_users');
  if (!settings.allow_registration && noActive !== true)
    return { ok: false, message: 'O cadastro está desactivado. O administrador pode activá-lo em Utilizadores (ou corra supabase/fix_cadastro.sql).' };

  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const requestedRole = (String(fd.get('requested_role') ?? '') || 'Funcionário Normal') as Role;
  const requestedSector = String(fd.get('requested_sector') ?? '').trim();
  if (name.length < 3) return { ok: false, message: 'Indique o nome completo.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Email inválido.' };
  if (password.length < 8) return { ok: false, message: 'A palavra-passe deve ter pelo menos 8 caracteres.' };
  if (!ROLES.includes(requestedRole)) return { ok: false, message: 'Perfil inválido.' };
  if (requestedRole === 'Funcionário de Sector' && !requestedSector) return { ok: false, message: 'Indique o sector.' };

  const h = headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || h.get('origin') || `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
  const { data: signed, error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        name, institution: String(fd.get('institution') ?? '').trim(), phone: String(fd.get('phone') ?? '').trim(),
        requested_role: noActive ? 'Superadministrador' : requestedRole,
        requested_sector: requestedRole === 'Funcionário de Sector' ? requestedSector : '',
      },
    },
  });
  if (error) {
    if (/rate|limit|seconds/i.test(error.message)) return { ok: false, message: 'Demasiados pedidos. Aguarde um minuto e tente de novo.' };
    return { ok: false, message: 'Não foi possível concluir o cadastro. Verifique os dados e tente de novo.' };
  }
  // Se o Supabase estiver com "Confirm email" DESLIGADO, o registo já traz sessão: aplica as mesmas regras de
  // activação e entra logo (acesso rápido). Com "Confirm email" LIGADO segue o fluxo do email.
  if (signed?.session && signed.user) {
    if (await activateRegisteredUser(signed.user.id)) return { ok: true, message: 'Conta criada. A entrar…', redirect: true };
    await supabase.auth.signOut();
    return { ok: true, message: 'Conta criada. Fica activa depois de aprovada por um administrador.' };
  }
  // Resposta igual quer o email seja novo quer já exista (não revela contas).
  return { ok: true, message: `Enviámos um email de confirmação para ${email}. Abra a ligação da mensagem para activar a conta (veja também o spam).` };
}
