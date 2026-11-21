-- ATENÇÃO: apaga TODAS as tabelas do AMBÚILA DATA. Usar só se já correste uma versão anterior do esquema
-- e queres recomeçar limpo. Depois corre 0001, 0002 e seed.sql.
drop table if exists public.audit_logs, public.portal_content, public.hero_images, public.site_settings,
  public.publications, public.locations, public.projects, public.datasets, public.institutions,
  public.communes, public.categories, public.profiles cascade;
drop function if exists public.current_role_name() cascade;
drop function if exists public.current_sector() cascade;
drop function if exists public.is_admin_level() cascade;
drop function if exists public.handle_new_user() cascade;
