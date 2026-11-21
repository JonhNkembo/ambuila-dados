import { requireProfile } from '@/lib/session';
import { loadSiteSettings, logoUrlOf } from '@/lib/site';
import AdminShell from '@/components/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireProfile();
  const settings = await loadSiteSettings(supabase);
  return <AdminShell profile={profile} logoUrl={logoUrlOf(settings)}>{children}</AdminShell>;
}
