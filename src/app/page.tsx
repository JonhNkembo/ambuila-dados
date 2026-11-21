import { createClient } from '@/lib/supabase/server';
import PublicPortal from '@/components/PublicPortal';
import { loadContent, loadHero, loadSiteSettings, logoUrlOf } from '@/lib/site';
import type { Category, Commune, Dataset, LocationPoint, Project, Publication } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: datasets }, { data: communes }, { data: categories }, { data: projects }, { data: locations }, { data: publications }, { data: { user } }, settings, hero, content] =
    await Promise.all([
      // RLS já limita o público (anon) a status = 'Publicado'; o filtro explícito cobre o caso de sessão iniciada
      supabase.from('datasets').select('*').eq('status', 'Publicado').order('updated_at', { ascending: false }),
      supabase.from('communes').select('*').order('code'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('projects').select('*'),
      supabase.from('locations').select('*'),
      supabase.from('publications').select('*').eq('is_public', true).order('year', { ascending: false }),
      supabase.auth.getUser(),
      loadSiteSettings(supabase),
      loadHero(supabase),
      loadContent(supabase),
    ]);

  return (
    <PublicPortal
      datasets={(datasets ?? []) as Dataset[]}
      communes={(communes ?? []) as Commune[]}
      categories={(categories ?? []) as Category[]}
      projects={(projects ?? []) as Project[]}
      locations={(locations ?? []) as LocationPoint[]}
      publications={(publications ?? []) as Publication[]}
      loggedIn={!!user}
      logoUrl={logoUrlOf(settings)}
      hero={hero}
      content={content}
    />
  );
}
