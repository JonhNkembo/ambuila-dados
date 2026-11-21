import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import Dashboard from '@/components/Dashboard';

export default async function VisaoGeralPage() {
  const { supabase } = await requireProfile();
  const core = await loadCore(supabase);
  return <Dashboard {...core} />;
}
