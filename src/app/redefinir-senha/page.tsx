import { createClient } from '@/lib/supabase/server';
import { loadSiteSettings, logoUrlOf } from '@/lib/site';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function RedefinirSenhaPage() {
  const supabase = createClient();
  const [{ data: { user } }, settings] = await Promise.all([supabase.auth.getUser(), loadSiteSettings(supabase)]);
  return <ResetPasswordForm logoUrl={logoUrlOf(settings)} valid={!!user} />;
}
