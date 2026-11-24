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
