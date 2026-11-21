import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import AIAgent from '@/components/AIAgent';

export default async function AgentePage() {
  const { supabase } = await requireProfile();
  const core = await loadCore(supabase);
  return <AIAgent ctx={core} />;
}
