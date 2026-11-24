-- =====================================================================
-- Repara e ACTIVA o cadastro de novos utilizadores. Seguro de correr várias vezes.
-- Resolve: "O cadastro de novos utilizadores está desactivado" / "configuração não encontrada".
-- =====================================================================

-- 1) tabela de definições (caso falte) + linha única
create table if not exists public.site_settings (
  id                  int primary key default 1 check (id = 1),
  registration_mode   text not null default 'email' check (registration_mode in ('email','approval')),
  allow_registration  boolean not null default true,
  logo_path           text,
  updated_at          timestamptz not null default now()
);
alter table public.site_settings add column if not exists registration_mode text not null default 'email';
alter table public.site_settings add column if not exists allow_registration boolean not null default true;
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- 2) colunas do perfil pedido
alter table public.profiles add column if not exists requested_role text;
alter table public.profiles add column if not exists requested_sector text;

-- 3) leitura pública das definições (RLS)
alter table public.site_settings enable row level security;
drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read" on public.site_settings for select using (true);

-- 4) função usada no arranque
create or replace function public.no_active_users()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where active = true)
$$;
grant execute on function public.no_active_users() to anon, authenticated;

-- 5) activar o cadastro (1.ª fase: confirmar o email activa a conta)
update public.site_settings set allow_registration = true, registration_mode = 'email' where id = 1;

select * from public.site_settings;   -- deve mostrar allow_registration = true
