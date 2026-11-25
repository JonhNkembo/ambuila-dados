'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { activateRegisteredUser } from '@/lib/activation';
import { REGISTER_ROLES } from '@/lib/constants';
import type { Role } from '@/lib/types';

type Result = { ok: boolean; message: string; redirect?: boolean };
const fail = (message: string): Result => ({ ok: false, message });

function siteOrigin() {
  const h = headers();
  return process.env.NEXT_PUBLIC_SITE_URL || h.get('origin') || `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
}

/**
 * Cadastro público: palavra-passe + confirmação, email de confirmação (enviado pelo Supabase) e, depois,
 * APROVAÇÃO pelo Superadministrador. Só se pode pedir um perfil não administrativo.
 * Só funciona com a tela de cadastro activa (ou, no arranque, enquanto não existir nenhum utilizador activo).
 */
export async function registerSelf(fd: FormData): Promise<Result> {
  const supabase = createClient();
  const { data: settings, error: sErr } = await supabase.from('site_settings').select('allow_registration').eq('id', 1).maybeSingle();
  if (sErr || !settings)
    return fail('A configuração do portal não foi encontrada na base de dados. Corra o ficheiro supabase/fix_cadastro.sql no SQL Editor do Supabase.');
  const { data: noActive } = await supabase.rpc('no_active_users');
  if (!settings.allow_registration && noActive !== true)
    return fail('O cadastro está desactivado. O administrador pode activá-lo em Utilizadores.');

  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm_password') ?? '');
  const requestedRole = (noActive ? 'Funcionário Normal' : String(fd.get('requested_role') ?? '') || 'Funcionário Normal') as Role;
  const requestedSector = String(fd.get('requested_sector') ?? '').trim();
  if (name.length < 3) return fail('Indique o nome completo.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Email inválido.');
  if (password.length < 8) return fail('A palavra-passe deve ter pelo menos 8 caracteres.');
  if (password !== confirm) return fail('A confirmação da palavra-passe não coincide.');
  if (!REGISTER_ROLES.includes(requestedRole)) return fail('Perfil inválido. Os perfis de administração são atribuídos pelo Superadministrador.');
  if (requestedRole === 'Funcionário de Sector' && !requestedSector) return fail('Indique o sector.');

  const { data: signed, error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/confirm`,
      data: {
        name, institution: String(fd.get('institution') ?? '').trim(), phone: String(fd.get('phone') ?? '').trim(),
        requested_role: requestedRole,
        requested_sector: requestedRole === 'Funcionário de Sector' ? requestedSector : '',
      },
    },
  });
  if (error) {
    if (/rate|limit|seconds/i.test(error.message)) return fail('Demasiados pedidos. Aguarde um minuto e tente de novo.');
    return fail('Não foi possível concluir o cadastro. Verifique os dados e tente de novo.');
  }
  // "Confirm email" DESLIGADO no Supabase: o registo já traz sessão. Só entra se for o arranque / ADMIN_EMAIL.
  if (signed?.session && signed.user) {
    if (await activateRegisteredUser(signed.user.id)) return { ok: true, message: 'Conta criada. A entrar…', redirect: true };
    await supabase.auth.signOut();
    return { ok: true, message: 'Conta criada. Só poderá entrar depois de o Superadministrador a aprovar.' };
  }
  // Resposta igual quer o email seja novo quer já exista (não revela contas).
  return {
    ok: true,
    message: `Enviámos um email para ${email}. Abra a ligação para confirmar o endereço (veja também o spam). Depois, o Superadministrador tem de aprovar a conta; só então poderá iniciar sessão.`,
  };
}

/** "Esqueceu a senha": envia a ligação de recuperação. A resposta é sempre a mesma (não revela se a conta existe). */
export async function requestPasswordReset(fd: FormData): Promise<Result> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Indique um email válido.');
  const { error } = await createClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin()}/auth/confirm?next=/redefinir-senha`,
  });
  if (error && /rate|limit|seconds/i.test(error.message)) return fail('Demasiados pedidos. Aguarde um minuto e tente de novo.');
  return { ok: true, message: 'Se existir uma conta com este email, enviámos uma ligação para redefinir a palavra-passe. Veja também o spam.' };
}

/** Define a nova palavra-passe a partir da ligação do email (sessão de recuperação) e termina a sessão. */
export async function completePasswordReset(fd: FormData): Promise<Result> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('A ligação expirou ou já foi usada. Peça uma nova em "Esqueceu a senha?".');
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm_password') ?? '');
  if (password.length < 8) return fail('A palavra-passe deve ter pelo menos 8 caracteres.');
  if (password !== confirm) return fail('A confirmação da palavra-passe não coincide.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same|different/i.test(error.message)) return fail('A nova palavra-passe tem de ser diferente da actual.');
    return fail('Não foi possível redefinir a palavra-passe. Peça uma nova ligação.');
  }
  await supabase.auth.signOut();
  return { ok: true, message: 'Palavra-passe redefinida.' };
}
