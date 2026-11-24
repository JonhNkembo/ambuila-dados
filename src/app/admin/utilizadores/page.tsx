import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { canManageUsers } from '@/lib/permissions';
import { loadCore } from '@/lib/data';
import { loadSiteSettings } from '@/lib/site';
import UsersTable from '@/components/UsersTable';
import type { Profile } from '@/lib/types';

export default async function UtilizadoresPage() {
  const { supabase, profile } = await requireProfile();
  if (!canManageUsers(profile)) redirect('/admin');
  const [{ data }, { categories }, settings] = await Promise.all([
    supabase.from('profiles').select('*').order('active').order('name'),
    loadCore(supabase),
    loadSiteSettings(supabase),
  ]);
  return <UsersTable users={(data ?? []) as Profile[]} me={profile} categories={categories.map((c) => c.id)} allowRegistration={settings.allow_registration} mode={settings.registration_mode} />;
}
