-- PARTE 2/4: funções e regras de segurança (RLS)
-- Cole no Supabase > SQL Editor > New query > Run. Se o browser traduzir a página, desligue a tradução.

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.current_sector()
returns text language sql stable security definer set search_path = public as $$
  select case when role = 'Director de Turismo e Cultura' then 'Cultura e património' else sector end
  from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.is_super()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'Superadministrador', false)
$$;

create or replace function public.is_top()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('Superadministrador','Administrador Municipal'), false)
$$;

create or replace function public.is_admin_level()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('Superadministrador','Administrador Municipal','Administrador Adjunto'), false)
$$;

create or replace function public.can_validate(cat text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin_level()
      or (public.current_role_name() = 'Director de Turismo e Cultura' and cat = 'Cultura e património')
$$;

alter table public.profiles       enable row level security;
alter table public.communes       enable row level security;
alter table public.institutions   enable row level security;
alter table public.categories     enable row level security;
alter table public.datasets       enable row level security;
alter table public.projects       enable row level security;
alter table public.locations      enable row level security;
alter table public.publications   enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.site_settings  enable row level security;
alter table public.hero_images    enable row level security;
alter table public.portal_content enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_top());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and active = (select p.active from public.profiles p where p.id = auth.uid())
    and sector is not distinct from (select p.sector from public.profiles p where p.id = auth.uid())
  );

create policy "communes_read"       on public.communes       for select using (true);
create policy "institutions_read"   on public.institutions   for select using (true);
create policy "categories_read"     on public.categories     for select using (true);
create policy "projects_read"       on public.projects       for select using (true);
create policy "locations_read"      on public.locations      for select using (true);
create policy "publications_read"   on public.publications   for select using (is_public or auth.role() = 'authenticated');
create policy "site_settings_read"  on public.site_settings  for select using (true);
create policy "hero_images_read"    on public.hero_images    for select using (active or public.is_admin_level());
create policy "portal_content_read" on public.portal_content for select using (published or public.is_super());

create policy "communes_write" on public.communes for all to authenticated
  using (public.is_top())
  with check (public.is_top());

create policy "institutions_write" on public.institutions for all to authenticated
  using (public.is_admin_level()) with check (public.is_admin_level());

create policy "projects_write" on public.projects for all to authenticated
  using (public.is_admin_level() or public.current_role_name() = 'Director de Turismo e Cultura')
  with check (public.is_admin_level() or public.current_role_name() = 'Director de Turismo e Cultura');

create policy "locations_write" on public.locations for all to authenticated
  using (public.is_admin_level() or public.current_role_name() = 'Director de Turismo e Cultura')
  with check (public.is_admin_level() or public.current_role_name() = 'Director de Turismo e Cultura');

create policy "publications_write" on public.publications for all to authenticated
  using (public.is_admin_level()) with check (public.is_admin_level());

create policy "site_settings_update" on public.site_settings for update to authenticated
  using (public.is_top())
  with check (public.is_top());

create policy "hero_images_write" on public.hero_images for all to authenticated
  using (public.is_top())
  with check (public.is_top());

create policy "portal_content_write" on public.portal_content for all to authenticated
  using (public.is_super())
  with check (public.is_super());

create policy "datasets_public_published" on public.datasets for select to anon
  using (status = 'Publicado');
create policy "datasets_staff_read_all" on public.datasets for select to authenticated
  using (public.current_role_name() is not null);

create policy "datasets_insert" on public.datasets for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.is_admin_level()
      or (public.current_role_name() = 'Director de Turismo e Cultura' and category = 'Cultura e património')
      or (public.current_role_name() = 'Funcionário de Sector' and category = public.current_sector()
          and status in ('Rascunho','Submetido'))
    )
  );

create policy "datasets_update" on public.datasets for update to authenticated
  using (
    public.can_validate(category)
    or (author_id = auth.uid() and public.current_role_name() = 'Funcionário de Sector'
        and status in ('Rascunho','Submetido','Rejeitado'))
  )
  with check (
    public.can_validate(category)
    or (author_id = auth.uid() and public.current_role_name() = 'Funcionário de Sector'
        and category = public.current_sector() and status in ('Rascunho','Submetido'))
  );

create policy "datasets_delete" on public.datasets for delete to authenticated
  using (public.is_top());

create policy "audit_insert_own" on public.audit_logs for insert to authenticated
  with check (user_id = auth.uid());
create policy "audit_select_staff" on public.audit_logs for select to authenticated
  using (public.is_admin_level());
create policy "audit_select_own" on public.audit_logs for select to authenticated
  using (user_id = auth.uid());

create policy "datasets_files_read" on storage.objects for select to authenticated
  using (bucket_id = 'datasets' and public.current_role_name() is not null);
create policy "datasets_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'datasets' and public.current_role_name() is not null
              and public.current_role_name() <> 'Funcionário Normal');
create policy "datasets_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'datasets' and public.is_top());

create policy "site_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'site' and public.is_top());
create policy "site_files_update" on storage.objects for update to authenticated
  using (bucket_id = 'site' and public.is_top());
create policy "site_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site' and public.is_top());

create or replace function public.no_active_users()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where active = true)
$$;
grant execute on function public.no_active_users() to anon, authenticated;
