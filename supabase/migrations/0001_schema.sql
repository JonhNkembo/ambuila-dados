-- =====================================================================
-- AMBÚILA DATA – Esquema relacional (PostgreSQL / Supabase)
-- Executar no SQL Editor do Supabase, por esta ordem: 0001 → 0002 → seed
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Perfis (1-1 com auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'Funcionário Normal'
              check (role in ('Superadministrador','Administrador Municipal','Administrador Adjunto',
                              'Director de Turismo e Cultura','Funcionário de Sector','Funcionário Normal')),
  sector      text,                       -- categoria em que o funcionário de sector trabalha (FK adicionada abaixo)
  requested_role   text,                  -- perfil pedido no cadastro (só é atribuído quando um administrador aprova)
  requested_sector text,
  institution text,
  phone       text,
  active      boolean not null default false,   -- contas novas ficam pendentes até serem aprovadas
  created_at  timestamptz not null default now()
);

-- ---------- Divisão administrativa ----------
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

-- ---------- Taxonomia (10 áreas temáticas) ----------
create table if not exists public.categories (
  id          text primary key,           -- nome da categoria (ex.: 'Educação')
  icon        text not null,
  description text not null,
  sort_order  int  not null default 0
);

-- ---------- Conjuntos de dados ----------
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

-- ---------- Projectos municipais ----------
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

-- ---------- Georreferenciação ----------
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

-- ---------- Biblioteca digital / publicações ----------
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

-- ---------- Auditoria ----------
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

-- ---------- Trigger: criar perfil quando nasce um utilizador no Auth ----------
-- O perfil nasce SEMPRE como 'Funcionário Normal' e inactivo; o perfil escolhido no cadastro fica só em requested_role
-- e é aplicado pelo servidor (rota /auth/confirm) depois de o email ser confirmado.
-- SEGURANÇA: o perfil nasce SEMPRE como 'Funcionário Normal' e inactivo. A função e a activação
-- só são atribuídas por quem tem poder para isso (service role no servidor ou administradores).
-- Nunca se confia em raw_user_meta_data para o perfil de acesso.
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

-- ---------- Definições do portal (linha única) ----------
create table if not exists public.site_settings (
  id                  int primary key default 1 check (id = 1),
  registration_mode   text    not null default 'email' check (registration_mode in ('email','approval')),
                      -- 'email'    = 1.ª fase: confirmar o email activa a conta com o perfil escolhido
                      -- 'approval' = depois de confirmar o email, um administrador aprova
  allow_registration  boolean not null default true,    -- 1.ª fase: tela de cadastro VISÍVEL; o administrador oculta-a depois
  logo_path           text,                              -- logótipo carregado (bucket 'site')
  updated_at          timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------- Fotos do painel principal (hero) ----------
create table if not exists public.hero_images (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,                 -- caminho no bucket 'site'
  caption     text not null default '',
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Conteúdo do portal: destaques, números em grande, notícias ----------
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

-- ---------- Storage: bucket para ficheiros dos datasets ----------
insert into storage.buckets (id, name, public)
values ('datasets', 'datasets', false)
on conflict (id) do nothing;

-- Bucket PÚBLICO para imagens do portal (logótipo, fotos do hero, destaques)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 8388608, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;
