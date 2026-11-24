-- Liga o cadastro de novos utilizadores (1.ª fase: confirmar o email activa a conta). Seguro de correr várias vezes.
update public.site_settings set allow_registration = true, registration_mode = 'email' where id = 1;
