import { requireProfile } from '@/lib/session';
import { loadCore, loadLocations } from '@/lib/data';
import AdminMap from '@/components/AdminMap';

export default async function MapaPage() {
  const { supabase, profile } = await requireProfile();
  const [{ communes }, locations] = await Promise.all([loadCore(supabase), loadLocations(supabase)]);
  return <AdminMap locations={locations} communes={communes} profile={profile} />;
}
