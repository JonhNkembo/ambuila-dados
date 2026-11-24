import { createClient } from '@/lib/supabase/server';
import { loadSiteSettings, logoUrlOf } from '@/lib/site';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = createClient();
  const settings = await loadSiteSettings(supabase);
  const { data: cats } = await supabase.from('categories').select('id').order('sort_order');
  const { data: noActive } = await supabase.rpc('no_active_users');
  const firstUser = noActive === true;
  return (
    <LoginForm allowRegistration={settings.allow_registration || firstUser} firstUser={firstUser} mode={settings.registration_mode}
      categories={(cats ?? []).map((c: { id: string }) => c.id)} logoUrl={logoUrlOf(settings)} />
  );
}
