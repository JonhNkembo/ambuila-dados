import type { SupabaseClient } from '@supabase/supabase-js';
import type { HeroImage, PortalContent, SiteSettings } from './types';

export const DEFAULT_LOGO = 'https://governo.gov.ao/public/app-assets/img/gov_angola.svg';
export const PORTAL_NAME = 'Portal de Dados de Ambuíla';

/** URL público de um ficheiro do bucket 'site'. */
export const siteUrl = (path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site/${path}` : null;

export async function loadSiteSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  return (data as SiteSettings) ?? { id: 1, allow_registration: true, logo_path: null };
}

export const logoUrlOf = (s: SiteSettings) => siteUrl(s.logo_path) ?? DEFAULT_LOGO;

export async function loadHero(supabase: SupabaseClient, all = false): Promise<HeroImage[]> {
  let q = supabase.from('hero_images').select('*').order('sort_order').order('created_at');
  if (!all) q = q.eq('active', true);
  const { data } = await q;
  return (data ?? []) as HeroImage[];
}

export async function loadContent(supabase: SupabaseClient, all = false): Promise<PortalContent[]> {
  let q = supabase.from('portal_content').select('*').order('sort_order').order('created_at', { ascending: false });
  if (!all) q = q.eq('published', true);
  const { data } = await q;
  return (data ?? []) as PortalContent[];
}
