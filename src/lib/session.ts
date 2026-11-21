import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Profile } from './types';

/** Devolve o perfil do utilizador autenticado ou redirecciona para /login. */
export async function requireProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>();
  if (!profile || !profile.active) redirect('/auth/inactive');
  return { supabase, user, profile: profile! };
}
