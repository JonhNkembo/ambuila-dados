-- =====================================================================
-- 5_autenticacao.sql  (corra DEPOIS dos ficheiros 1 a 4; pode correr mais de uma vez)
-- - O cadastro só aceita como "pedido" os perfis não administrativos.
-- - Contas criadas com Google passam a ter perfil (pendente, até o Superadministrador aprovar).
-- - O utilizador deixa de poder alterar o próprio email/pedido de perfil por fora da aplicação.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare req text := new.raw_user_meta_data->>'requested_role';
begin
  insert into public.profiles (id, name, email, role, active, institution, phone, requested_role, requested_sector)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    'Funcionário Normal',
    false,
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'phone',
    case when req in ('Director de Turismo e Cultura','Funcionário de Sector','Funcionário Normal') then req end,
    nullif(new.raw_user_meta_data->>'requested_sector', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and active = (select p.active from public.profiles p where p.id = auth.uid())
    and sector is not distinct from (select p.sector from public.profiles p where p.id = auth.uid())
    and email  is not distinct from (select p.email  from public.profiles p where p.id = auth.uid())
    and requested_role   is not distinct from (select p.requested_role   from public.profiles p where p.id = auth.uid())
    and requested_sector is not distinct from (select p.requested_sector from public.profiles p where p.id = auth.uid())
  );
