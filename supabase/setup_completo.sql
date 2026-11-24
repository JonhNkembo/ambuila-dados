-- AMBÚILA DATA – instalação completa (= partes 1 a 4 seguidas)

-- PARTE 1/4: tabelas (apaga e recria as tabelas do portal; não toca no Auth)
-- Cole no Supabase > SQL Editor > New query > Run. Se o browser traduzir a página, desligue a tradução.

do $$ begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists "datasets_files_read"   on storage.objects;
    drop policy if exists "datasets_files_insert" on storage.objects;
    drop policy if exists "datasets_files_delete" on storage.objects;
    drop policy if exists "site_files_insert"     on storage.objects;
    drop policy if exists "site_files_update"     on storage.objects;
    drop policy if exists "site_files_delete"     on storage.objects;
  end if;
end $$;

drop table if exists public.audit_logs, public.portal_content, public.hero_images, public.site_settings,
  public.publications, public.locations, public.projects, public.datasets, public.institutions,
  public.communes, public.categories, public.profiles cascade;
drop function if exists public.current_role_name() cascade;
drop function if exists public.current_sector() cascade;
drop function if exists public.is_admin_level() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.can_validate(text) cascade;
drop function if exists public.no_active_users() cascade;
drop function if exists public.is_top() cascade;
drop function if exists public.is_super() cascade;

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'Funcionário Normal'
              check (role in ('Superadministrador','Administrador Municipal','Administrador Adjunto',
                              'Director de Turismo e Cultura','Funcionário de Sector','Funcionário Normal')),
  sector      text,
  requested_role   text,
  requested_sector text,
  institution text,
  phone       text,
  active      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.communes (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  code      text not null unique,
  area_km2  numeric,
  status    text not null default 'Activa'
);

create table if not exists public.institutions (
  id       uuid primary key default gen_random_uuid(),
  name     text not null unique,
  type     text not null,
  commune  text references public.communes(name) on update cascade,
  contact  text
);

create table if not exists public.categories (
  id          text primary key,           -- nome da categoria (ex.: 'Educação')
  icon        text not null,
  description text not null,
  sort_order  int  not null default 0
);

create table if not exists public.datasets (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text not null default '',
  category      text not null references public.categories(id) on update cascade,
  institution   text references public.institutions(name) on update cascade,
  commune       text references public.communes(name) on update cascade,
  source        text not null default '',
  year          int  not null,
  collected_at  date not null default current_date,
  updated_at    date not null default current_date,
  author        text not null default '',
  author_id     uuid references auth.users(id) on delete set null,
  file_name     text,
  file_path     text,                      -- caminho no bucket 'datasets'
  license       text not null default 'Dados Abertos Governamentais (CC-BY 4.0)',
  status        text not null default 'Submetido'
                check (status in ('Rascunho','Submetido','Em Validação','Publicado','Rejeitado')),
  is_demo       boolean not null default false,
  metrics       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists datasets_status_idx   on public.datasets(status);
create index if not exists datasets_category_idx on public.datasets(category);
create index if not exists datasets_commune_idx  on public.datasets(commune);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sector      text not null,
  commune     text references public.communes(name) on update cascade,
  year        int  not null,
  budget      text not null default '',
  progress    int  not null default 0 check (progress between 0 and 100),
  status      text not null default 'Planeado'
              check (status in ('Planeado','Em Execução','Concluído','Suspenso')),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  commune     text references public.communes(name) on update cascade,
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  description text not null default '',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.publications (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  type       text not null,
  category   text not null,
  author     text not null,
  year       int  not null,
  file_path  text,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid references auth.users(id) on delete set null,
  user_name  text not null,
  role       text not null,
  module     text not null,
  action     text not null
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare req text := new.raw_user_meta_data->>'requested_role';
begin
  insert into public.profiles (id, name, email, role, active, institution, phone, requested_role, requested_sector)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    'Funcionário Normal',
    false,
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'phone',
    case when req in ('Superadministrador','Administrador Municipal','Administrador Adjunto',
                      'Director de Turismo e Cultura','Funcionário de Sector','Funcionário Normal') then req end,
    nullif(new.raw_user_meta_data->>'requested_sector', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.site_settings (
  id                  int primary key default 1 check (id = 1),
  registration_mode   text    not null default 'email' check (registration_mode in ('email','approval')),
  allow_registration  boolean not null default true,
  logo_path           text,                              -- logótipo carregado (bucket 'site')
  updated_at          timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.hero_images (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,                 -- caminho no bucket 'site'
  caption     text not null default '',
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.portal_content (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('destaque','numero','noticia')),
  title       text not null,
  body        text not null default '',
  big_value   text,                          -- 'numero': valor em grande (ex.: "38.700")
  big_label   text,                          -- 'numero': legenda (ex.: "habitantes")
  image_path  text,
  sort_order  int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_sector_fkey,
  add  constraint profiles_sector_fkey foreign key (sector) references public.categories(id) on update cascade on delete set null;

insert into storage.buckets (id, name, public)
values ('datasets', 'datasets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 8388608, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

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

-- PARTE 3/4: dados iniciais de demonstração
-- Cole no Supabase > SQL Editor > New query > Run. Se o browser traduzir a página, desligue a tradução.

insert into public.categories (id, icon, description, sort_order) values
('Demografia', 'users', 'População, sexo, idade, agregados familiares e densidade por comuna.', 1),
('Educação', 'graduation-cap', 'Rede escolar, alunos, docentes, salas de aula e taxas de escolarização.', 2),
('Saúde', 'heart-pulse', 'Unidades sanitárias, profissionais de saúde, camas e cobertura vacinal.', 3),
('Economia e negócios', 'briefcase', 'Empresas, mercados, comércio, emprego formal e licenciamento.', 4),
('Agricultura', 'sprout', 'Cooperativas, áreas cultivadas, produção e culturas estratégicas.', 5),
('Infraestruturas', 'construction', 'Estradas, pontes, água, energia e edifícios públicos.', 6),
('Ambiente e recursos naturais', 'trees', 'Áreas florestais, recursos hídricos, saneamento e gestão de resíduos.', 7),
('Cultura e património', 'landmark', 'Sítios históricos, tradições, grupos culturais e património imaterial.', 8),
('Administração pública', 'building-2', 'Serviços públicos, funcionários, registo civil e atendimento ao cidadão.', 9),
('Ciência e investigação', 'microscope', 'Estudos, projectos de investigação e parcerias académicas.', 10);

insert into public.communes (name, code, area_km2, status) values
('Sede de Ambuíla (Nova Ambuíla)', 'AMB-01', 2450, 'Activa'),
('Quipedro', 'AMB-02', 1890, 'Activa');

insert into public.institutions (name, type, commune, contact) values
('Administração Municipal de Ambuíla (GEPE)', 'Órgão Municipal', 'Sede de Ambuíla (Nova Ambuíla)', 'gepe@ambuila.uige.gov.ao'),
('Direcção Municipal de Educação de Ambuíla', 'Direcção Sectorial', 'Sede de Ambuíla (Nova Ambuíla)', 'educacao@ambuila.uige.gov.ao'),
('Direcção Municipal de Saúde de Ambuíla', 'Direcção Sectorial', 'Sede de Ambuíla (Nova Ambuíla)', 'saude@ambuila.uige.gov.ao'),
('Repartição Municipal de Agricultura e Desenvolvimento Rural', 'Repartição Técnica', 'Quipedro', 'agricultura@ambuila.uige.gov.ao'),
('Repartição de Comércio, Indústria e Recursos', 'Repartição Técnica', 'Sede de Ambuíla (Nova Ambuíla)', 'economia@ambuila.uige.gov.ao');

insert into public.datasets (name, description, category, institution, commune, source, year, collected_at, updated_at, author, file_name, license, status, is_demo, metrics) values
('Estimativa Demográfica Municipal por Comuna (Série Base)', 'Consolidação demonstrativa da população residente, agregados familiares e distribuição territorial nas comunas de Sede de Ambuíla (Nova Ambuíla) e Quipedro.', 'Demografia', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Gabinete de Estudos, Planeamento e Estatística', 2025, '2025-11-10', '2026-01-15', 'Dr. António Mateus', 'demografia_ambuila_2025.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"populacao":24800,"agregados":4650,"taxaCrescimento":2.6}'::jsonb),
('Censo Demográfico Complementar – Comuna de Quipedro', 'Levantamento demonstrativo de agregados familiares e população residente nas regedorias da Comuna de Quipedro.', 'Demografia', 'Administração Municipal de Ambuíla (GEPE)', 'Quipedro', 'Administração Comunal de Quipedro', 2026, '2026-02-12', '2026-03-01', 'Eng.ª Joana Nzinga', 'demografia_quipedro_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"populacao":14200,"agregados":2710,"taxaCrescimento":2.3}'::jsonb),
('Cadastro da Rede Escolar, Alunos e Docentes – Ambuíla Sede', 'Levantamento das escolas primárias e do I Ciclo do ensino secundário na Sede Municipal (Nova Ambuíla), salas de aula, docentes colocados e alunos matriculados.', 'Educação', 'Direcção Municipal de Educação de Ambuíla', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Educação', 2026, '2026-03-05', '2026-03-20', 'Prof. Manuel Kiaku', 'rede_escolar_sede_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"escolas":18,"alunos":5420,"professores":164,"salas":82}'::jsonb),
('Levantamento Escolar da Comuna de Quipedro', 'Registo das infraestruturas escolares e efectivos discentes na Comuna de Quipedro.', 'Educação', 'Direcção Municipal de Educação de Ambuíla', 'Quipedro', 'Direcção Municipal de Educação', 2026, '2026-04-02', '2026-04-10', 'Prof. Manuel Kiaku', 'escolas_quipedro_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"escolas":11,"alunos":2890,"professores":86,"salas":44}'::jsonb),
('Mapeamento das Unidades Sanitárias e Recursos Humanos de Saúde', 'Inventário do Hospital Municipal, Centros de Saúde e Postos Sanitários activos na Sede de Ambuíla.', 'Saúde', 'Direcção Municipal de Saúde de Ambuíla', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Saúde', 2026, '2026-02-20', '2026-03-14', 'Eng.ª Joana Nzinga', 'unidades_sanitarias_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"unidadesSanitarias":7,"profissionaisSaude":62,"camas":48}'::jsonb),
('Postos de Saúde Rurais – Comuna de Quipedro', 'Submissão técnica sobre postos sanitários periféricos e equipas de enfermagem na Comuna de Quipedro.', 'Saúde', 'Direcção Municipal de Saúde de Ambuíla', 'Quipedro', 'Centro de Saúde de Quipedro', 2026, '2026-05-01', '2026-05-01', 'Prof. Manuel Kiaku', 'postos_quipedro_2026.pdf', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Em Validação', true, '{"unidadesSanitarias":4,"profissionaisSaude":19,"camas":12}'::jsonb),
('Registo Comercial, Mercados e Empresas Licenciadas', 'Levantamento de estabelecimentos comerciais, microempresas e mercados municipais em actividade.', 'Economia e negócios', 'Repartição de Comércio, Indústria e Recursos', 'Sede de Ambuíla (Nova Ambuíla)', 'Repartição Municipal de Comércio', 2025, '2025-10-15', '2025-12-02', 'Lic. Pedro Kiala', 'empresas_mercados_2025.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"empresas":94,"mercados":5,"empregosFormais":410}'::jsonb),
('Produção Agrícola, Cooperativas e Culturas Estratégicas', 'Dados sobre cooperativas camponesas, áreas cultivadas e produção anual de mandioca, café robusta, ginguba e banana.', 'Agricultura', 'Repartição Municipal de Agricultura e Desenvolvimento Rural', 'Quipedro', 'Estação de Desenvolvimento Agrário (EDA)', 2026, '2026-04-18', '2026-05-04', 'Eng.ª Joana Nzinga', 'producao_agricola_2026.xlsx', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"cooperativas":26,"areaCultivadaHa":1840,"producaoToneladas":4620,"principaisCulturas":"Mandioca, Café Robusta, Ginguba, Banana, Feijão"}'::jsonb),
('Inventário de Vias Terciárias, Pontes e Pontos de Água', 'Cadastro das estradas municipais, pontecos reabilitados e furos de água comunitários.', 'Infraestruturas', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Direcção Municipal de Infraestruturas', 2026, '2026-05-10', '2026-05-10', 'Dr. António Mateus', 'infraestruturas_2026.csv', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Submetido', true, '{"estradasKm":78,"pontosAgua":24,"edificiosPublicos":17}'::jsonb),
('Património Histórico da Batalha de Ambuíla (1665) e Sítios Culturais', 'Inventário dos marcos históricos, tradições culturais e património imaterial do Município de Ambuíla.', 'Cultura e património', 'Administração Municipal de Ambuíla (GEPE)', 'Sede de Ambuíla (Nova Ambuíla)', 'Secção Municipal de Cultura e Turismo', 2025, '2025-09-22', '2025-10-05', 'MSc. Beatriz Domingos', 'patrimonio_ambuila.pdf', 'Dados Abertos Governamentais (CC-BY 4.0)', 'Publicado', true, '{"sitiosHistoricos":6,"gruposCulturais":11}'::jsonb);

insert into public.projects (name, sector, commune, year, budget, progress, status, is_demo) values
('Reabilitação do Troço Rodoviário Nova Ambuíla – Quipedro', 'Infraestruturas', 'Quipedro', 2026, '145.000.000 Kz', 65, 'Em Execução', true),
('Ampliação e Apetrechamento da Escola Primária Nº 4', 'Educação', 'Sede de Ambuíla (Nova Ambuíla)', 2026, '58.000.000 Kz', 85, 'Em Execução', true),
('Construção de 8 Furos de Água Potável Comunitários', 'Infraestruturas', 'Quipedro', 2025, '32.000.000 Kz', 100, 'Concluído', true),
('Programa de Fomento ao Café Robusta e Cooperativismo', 'Agricultura', 'Sede de Ambuíla (Nova Ambuíla)', 2026, '44.500.000 Kz', 40, 'Em Execução', true);

insert into public.locations (name, category, commune, lat, lng, description, is_demo) values
('Administração Municipal de Ambuíla', 'Infraestruturas', 'Sede de Ambuíla (Nova Ambuíla)', -7.4333, 14.6667, 'Sede institucional da Administração Municipal em Nova Ambuíla e Gabinete de Estatística.', true),
('Hospital Municipal de Ambuíla', 'Saúde', 'Sede de Ambuíla (Nova Ambuíla)', -7.4365, 14.671, 'Unidade hospitalar de referência municipal com internamento e urgências.', true),
('Escola Secundária do I Ciclo de Ambuíla', 'Educação', 'Sede de Ambuíla (Nova Ambuíla)', -7.4295, 14.6625, 'Estabelecimento público de ensino secundário.', true),
('Centro de Saúde Comunal de Quipedro', 'Saúde', 'Quipedro', -7.512, 14.585, 'Unidade sanitária de referência da Comuna de Quipedro.', true),
('Pólo Agrícola e Cooperativa de Quipedro', 'Agricultura', 'Quipedro', -7.525, 14.602, 'Zona de produção de mandioca, café e apoio técnico agrário.', true),
('Mercado Municipal Central de Ambuíla', 'Infraestruturas', 'Sede de Ambuíla (Nova Ambuíla)', -7.435, 14.664, 'Principal centro de escoamento e comercialização agrícola.', true),
('Obra de Reabilitação Vial Sede – Quipedro', 'Projectos', 'Quipedro', -7.472, 14.624, 'Frente de obra de terraplanagem e drenagem.', true);

-- PARTE 4/4: cria admin@gmail.com / 123456789 como Superadministrador
-- Cole no Supabase > SQL Editor > New query > Run. Se o browser traduzir a página, desligue a tradução.

do $$
declare
  v_email text := 'admin@gmail.com';
  v_pass  text := '123456789';
  uid     uuid;
begin
  select id into uid from auth.users where email = v_email;

  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', v_email,
      crypt(v_pass, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"name":"Administrador"}', now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, uid::text,
            jsonb_build_object('sub', uid::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());
  else
    update auth.users
       set encrypted_password = crypt(v_pass, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = uid;
  end if;

  insert into public.profiles (id, name, email, role, active, sector, requested_role, requested_sector)
  values (uid, 'Administrador', v_email, 'Superadministrador', true, null, null, null)
  on conflict (id) do update
     set role = 'Superadministrador', active = true, sector = null, requested_role = null, requested_sector = null;
end $$;

update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

select u.email, u.email_confirmed_at is not null as email_confirmado, p.role, p.active
from auth.users u left join public.profiles p on p.id = u.id order by u.created_at;
