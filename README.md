# GOVERNO DE ANGOLA – Portal de Dados de Ambuíla (AMBÚILA DATA)

## ARRANQUE RÁPIDO (5 passos)

1. **Supabase**: cria um projecto. Em *Project Settings → API* copia URL, `anon` key e `service_role` key.
2. **SQL** (4 partes curtas, por ordem, cada uma numa *New query*): `supabase/1_esquema.sql` → `2_seguranca.sql` → `3_dados.sql` → `4_admin.sql`. (O `setup_completo.sql` é o mesmo conteúdo seguido.) Abre os ficheiros no Bloco de Notas/VS Code e copia de lá; **desliga a tradução automática do browser** no Supabase.
   Cria tudo e deixa **admin@gmail.com / 123456789** como Superadministrador. (Apaga e recria as tabelas do portal; não toca nas contas do Auth.)
3. **Variáveis**: `cp .env.example .env.local` e preenche `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_EMAIL=admin@gmail.com`.
4. `npm install` → `npm run dev` → abre `http://localhost:3000/diagnostico`: tudo deve estar ✅.
5. Entra em `/login` com `admin@gmail.com` / `123456789` e muda a senha em *Meu perfil*.

**Entrar sem esperar por emails:** em Supabase → Authentication → Providers → Email desliga **"Confirm email"**. Os cadastros passam a entrar logo (com as mesmas regras de perfil). Com "Confirm email" ligado, o fluxo é por email (precisa de SMTP próprio e do template descrito abaixo).

**Acesso garantido:** quem entrar com o email de `ADMIN_EMAIL` fica sempre Superadministrador activo; e se não houver nenhum utilizador activo, a primeira conta que iniciar sessão também fica. Contas criadas à mão no painel do Supabase são recuperadas automaticamente ao entrar.

---

Next.js 14 (App Router, TypeScript) + Supabase (Postgres, Auth, Storage, RLS).

## Arrancar

1. Cria um projecto no Supabase.
2. **Confirmação por email (Supabase → Authentication):**
   - *Providers → Email*: deixa **"Allow new users to sign up" LIGADO** e **"Confirm email" LIGADO**.
   - *URL Configuration*: **Site URL** = o endereço do portal (ex. `http://localhost:3000` ou o domínio final) e acrescenta-o em *Redirect URLs*.
   - *Email Templates → Confirm signup*: troca a ligação por
     `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirmar a minha conta</a>`
   - O envio por defeito do Supabase é muito limitado (poucos emails por hora). Para uso real configura **SMTP próprio** (*Project Settings → Authentication → SMTP*).
3. SQL Editor, por esta ordem: `supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `supabase/seed.sql`.
   (Se já tinhas corrido uma versão anterior: corre primeiro `supabase/reset.sql`. Se já tens o 0001 e só falta esta alteração: corre `0003_requested_role.sql`.)
4. `cp .env.example .env.local` e preenche as 4 variáveis.
5. `npm install` → `npm run create:admin` (cria o Superadministrador definido em `ADMIN_EMAIL`/`ADMIN_PASSWORD`) → `npm run dev`.
6. Abre `/login`: com a base vazia aparece **Primeiro acesso** e o primeiro cadastro cria o **Superadministrador** (activo, sem aprovação). Depois disso, os cadastros novos ficam pendentes.
   (Opcional: `npm run seed:users` cria 6 utilizadores de demonstração, um por função, já confirmados; só depois do primeiro cadastro.)
7. Painel → **23. Conteúdo do portal**: carrega fotos, logótipo e insere destaques.

## Perfis

| Perfil | Pode |
|---|---|
| **Superadministrador** | Tudo. Único que insere destaques, números em grande, notícias e logótipo. |
| **Administrador Municipal** | Cria e gere utilizadores de qualquer perfil menos Superadministrador (incluindo outros Administradores Municipais). Validar/publicar tudo, eliminar dados, criar/gerir utilizadores (abaixo dele), activar/ocultar o cadastro, fotos do painel principal, comunas, instituições, auditoria |
| **Administrador Adjunto** | Validar/publicar tudo, instituições, projectos/mapa, auditoria. Não gere utilizadores nem elimina |
| **Director de Turismo e Cultura** | Submete e publica dados de *Cultura e património*; projectos e mapa |
| **Funcionário de Sector** | Submete dados só do seu sector (ficam "Submetido" para validação) |
| **Funcionário Normal** | Só consulta |

Regras aplicadas na base de dados (RLS) e repetidas nas Server Actions. Ajusta em `src/lib/permissions.ts` + `supabase/migrations/0002_rls.sql`.

## Entrada e cadastro

- Para (re)activar o cadastro por SQL (ficheiro `supabase/migrations/0004_activar_cadastro.sql`): `update public.site_settings set allow_registration = true, registration_mode = 'email';` (ou use o interruptor em *Utilizadores*).
- **1.ª fase:** a tela de cadastro está **visível** por defeito (separador "Cadastrar" no login). Quando o administrador a ocultar, só entra quem já tem conta (criada em *Utilizadores → Criar utilizador*).
- Se já tinhas corrido o SQL antes desta alteração: `update public.site_settings set allow_registration = true;`
- *Utilizadores* tem o interruptor **Tela de cadastro**: quando activo, o login mostra o separador "Cadastrar".
- O cadastro permite escolher **qualquer perfil**. Em *Utilizadores* há dois modos:
  - **1.ª fase (por defeito):** o utilizador cadastra-se, recebe um **email de confirmação** e, ao abrir a ligação, a conta fica activa com o perfil escolhido. Sem aprovação.
  - **Email + aprovação:** depois de confirmar o email, fica pendente com "Pediu: …" e botão **Aprovar** (Superadministrador aprova qualquer perfil; o Administrador Municipal só os abaixo do seu).
  **Atenção:** no modo da 1.ª fase qualquer pessoa com um email pode escolher "Superadministrador". Use-o só durante a instalação e mude depois para aprovação ou oculte a tela.
- Quem se cadastra fica **pendente** (Funcionário Normal, inactivo) até um administrador o activar e lhe dar a função.
- O perfil nunca vem do formulário nem dos metadados do Auth: o trigger cria sempre "Funcionário Normal" inactivo.

## Conteúdo do portal

- Fotos do painel principal (rotação automática): Superadministrador e Administrador Municipal.
- Destaques do município, números em grande, notícias, logótipo: só o Superadministrador.
- O portal público não mostra nada que não tenha sido inserido: sem dados fictícios.
- Logótipo: por defeito `https://governo.gov.ao/public/app-assets/img/gov_angola.svg`. Descarrega-o e carrega a tua cópia no painel para não depender desse site; se a imagem falhar aparece um símbolo neutro.

## Estrutura

`src/app/page.tsx` portal público · `src/app/login` entrada/cadastro · `src/app/admin/*` painel · `src/app/admin/actions.ts` acções protegidas · `src/lib/permissions.ts` regras · `supabase/` esquema, RLS, seed.

## Problemas comuns
- *"O cadastro de novos utilizadores está desactivado"* ou *"configuração não encontrada"*: corre `supabase/fix_cadastro.sql` no SQL Editor.
- Não consigo entrar (email não chegou / conta pendente / conta inexistente): corre `supabase/liberar_entrada.sql`. Confirma os emails em espera e deixa `admin@gmail.com` activo como Superadministrador.

---

## AUTENTICAÇÃO (versão actual) – leia antes de pôr em produção

1. **SQL novo:** corra `supabase/5_autenticacao.sql` no SQL Editor (depois dos ficheiros 1 a 4). Limita os perfis pedidos no cadastro e impede o utilizador de alterar o próprio email.
2. **Cadastro:** só se pode pedir *Director de Turismo e Cultura*, *Funcionário de Sector* ou *Funcionário Normal*. Pede-se a palavra-passe duas vezes. O utilizador recebe um email para confirmar o endereço e **a conta fica pendente até o Superadministrador a aprovar** (Utilizadores → Aprovar). Só então consegue entrar. O Administrador Municipal não aprova contas novas.
3. **Esqueceu a senha:** link no login. No Supabase → Authentication → Email Templates → **Reset password**, use:
   `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha">Redefinir a palavra-passe</a>`
   e em *URL Configuration → Redirect URLs* acrescente `http://localhost:3000/**` (e o domínio final com `/**`).
4. **Continuar com Google:**
   - Google Cloud Console → *APIs e serviços → Credenciais → ID de cliente OAuth (Aplicação Web)*. Em *URIs de redireccionamento autorizados* ponha `https://<SEU-PROJECTO>.supabase.co/auth/v1/callback`.
   - Supabase → Authentication → Providers → **Google**: active e cole o *Client ID* e o *Client Secret*.
   - Supabase → URL Configuration → Redirect URLs: acrescente `http://localhost:3000/auth/callback` (e o do domínio final).
   - Quem entra pela 1.ª vez com Google fica pendente, como no cadastro normal.
5. **Meu perfil:** o email não pode ser editado. Para mudar a palavra-passe pede-se a actual, a nova e a confirmação.
6. **Comunas:** Configurações → *Comunas* (cadastrar e editar nome, área e estado).
7. **Mapa:** o ponto central é a sede (`MUNICIPAL_SEAT` em `src/lib/constants.ts`); ajuste as coordenadas se tiver as oficiais.
