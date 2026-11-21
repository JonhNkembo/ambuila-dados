import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import DatasetsManager from '@/components/DatasetsManager';

export default async function ConjuntosPage({ searchParams }: { searchParams: { novo?: string } }) {
  const { supabase, profile } = await requireProfile();
  const core = await loadCore(supabase);
  return <DatasetsManager {...core} profile={profile} openNew={searchParams.novo === '1'} />;
}
