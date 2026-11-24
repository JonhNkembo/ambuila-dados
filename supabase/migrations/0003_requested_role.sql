-- Só necessário se já tinhas corrido o 0001 ANTES destas alterações (é seguro correr em qualquer caso).
alter table public.profiles add column if not exists requested_role text;
alter table public.profiles add column if not exists requested_sector text;
alter table public.site_settings add column if not exists registration_mode text not null default 'email';
alter table public.site_settings drop constraint if exists site_settings_registration_mode_check;
alter table public.site_settings add constraint site_settings_registration_mode_check check (registration_mode in ('email','approval'));

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

create or replace function public.no_active_users()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where active = true)
$$;
grant execute on function public.no_active_users() to anon, authenticated;
