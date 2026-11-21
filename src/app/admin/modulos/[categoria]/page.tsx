import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import ThematicModule from '@/components/ThematicModule';

export default async function ModuloPage({ params }: { params: { categoria: string } }) {
  const categoryName = decodeURIComponent(params.categoria);
  const { supabase, profile } = await requireProfile();
  const core = await loadCore(supabase);
  if (!core.categories.some((c) => c.id === categoryName)) notFound();
  return <ThematicModule categoryName={categoryName} {...core} profile={profile} />;
}
