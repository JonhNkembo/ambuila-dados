'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cadastro público. Só funciona se o administrador tiver ACTIVADO a tela de cadastro.
 * A conta nasce INACTIVA, como "Funcionário Normal", e só entra depois de aprovada por um administrador.
 * (A função nunca vem do formulário.)
 */
export async function registerSelf(fd: FormData): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const { data: settings } = await supabase.from('site_settings').select('allow_registration').eq('id', 1).maybeSingle();
  if (!settings?.allow_registration) return { ok: false, message: 'O cadastro de novos utilizadores está desactivado.' };

  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (name.length < 3) return { ok: false, message: 'Indique o nome completo.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Email inválido.' };
  if (password.length < 8) return { ok: false, message: 'A palavra-passe deve ter pelo menos 8 caracteres.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, institution: String(fd.get('institution') ?? '').trim(), phone: String(fd.get('phone') ?? '').trim() },
  });
  if (error) {
    const dup = /already|registered|exists/i.test(error.message);
    return { ok: false, message: dup ? 'Já existe uma conta com este email.' : 'Não foi possível concluir o cadastro.' };
  }
  return { ok: true, message: 'Cadastro enviado. A conta ficará activa depois de aprovada por um administrador.' };
}
