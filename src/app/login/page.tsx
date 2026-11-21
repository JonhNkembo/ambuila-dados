import { createClient } from '@/lib/supabase/server';
import { loadSiteSettings, logoUrlOf } from '@/lib/site';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const settings = await loadSiteSettings(createClient());
  return <LoginForm allowRegistration={settings.allow_registration} logoUrl={logoUrlOf(settings)} />;
}
