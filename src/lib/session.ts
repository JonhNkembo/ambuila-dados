import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import type { Profile } from './types';

/**
 * Recupera automaticamente contas que entram mas não têm perfil activo (ex.: criadas no painel do Supabase):
 *  - o email definido em ADMIN_EMAIL (variável de servidor) fica Superadministrador activo;
 *  - se não existir nenhum utilizador activo, a primeira conta com sessão válida (email já confirmado) fica Superadministrador;
 *  - nos outros casos garante só que o perfil existe (inactivo, a aguardar aprovação).
 */
async function healProfile(user: User, current: Profile | null): Promise<Profile | null> {
  try {
    const admin = createAdminClient();
    const email = (user.email ?? '').toLowerCase();
    const owner = !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.trim().toLowerCase();
    const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true);
    const promote = owner || (count ?? 0) === 0;

    const base = {
      id: user.id,
      name: current?.name ?? (user.user_metadata?.name as string | undefined) ?? email.split('@')[0],
      email,
    };
    const row = promote
      ? { ...base, role: 'Superadministrador', active: true, sector: null, requested_role: null, requested_sector: null }
      : current ? null : { ...base, role: 'Funcionário Normal', active: false };
    if (!row) return current;

    const { data } = await admin.from('profiles').upsert(row).select('*').single<Profile>();
    return data ?? current;
  } catch {
    return current; // sem service role / sem tabelas: segue o fluxo normal
  }
}

/** Devolve o perfil do utilizador autenticado ou redirecciona para /login. */
export async function requireProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>();
  let profile: Profile | null = data;
  if (!profile || !profile.active) profile = await healProfile(user, profile);

  if (!profile || !profile.active) redirect('/auth/inactive');
  return { supabase, user, profile: profile! };
}
