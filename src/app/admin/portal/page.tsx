import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { canManageHeroAndRegistration, isSuper } from '@/lib/permissions';
import { loadContent, loadHero, loadSiteSettings, logoUrlOf } from '@/lib/site';
import PortalManager from '@/components/PortalManager';

export default async function PortalPage() {
  const { supabase, profile } = await requireProfile();
  if (!canManageHeroAndRegistration(profile)) redirect('/admin');
  const [hero, content, settings] = await Promise.all([loadHero(supabase, true), loadContent(supabase, true), loadSiteSettings(supabase)]);
  return (
    <PortalManager hero={hero} content={content} isSuper={isSuper(profile)} logoUrl={logoUrlOf(settings)}
      hasCustomLogo={!!settings.logo_path} baseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!} />
  );
}
