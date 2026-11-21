import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import ReportBuilder from '@/components/ReportBuilder';

export default async function RelatoriosPage() {
  const { supabase, profile } = await requireProfile();
  const { datasets, categories, communes } = await loadCore(supabase);
  return <ReportBuilder datasets={datasets} categories={categories} communes={communes} issuer={profile.name} />;
}
