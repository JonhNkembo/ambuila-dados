import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Commune, Dataset, Institution, LocationPoint, Project, Publication } from './types';

/** Carrega o conjunto de dados que a maioria dos módulos administrativos precisa. */
export async function loadCore(supabase: SupabaseClient) {
  const [d, c, i, p, cat] = await Promise.all([
    supabase.from('datasets').select('*').order('updated_at', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('communes').select('*').order('code'),
    supabase.from('institutions').select('*').order('name'),
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
  ]);
  const err = d.error ?? c.error ?? i.error ?? p.error ?? cat.error;
  if (err) throw new Error(err.message);
  return {
    datasets: (d.data ?? []) as Dataset[],
    communes: (c.data ?? []) as Commune[],
    institutions: (i.data ?? []) as Institution[],
    projects: (p.data ?? []) as Project[],
    categories: (cat.data ?? []) as Category[],
  };
}

export async function loadLocations(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('locations').select('*').order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationPoint[];
}

export async function loadPublications(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('publications').select('*').order('year', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Publication[];
}
