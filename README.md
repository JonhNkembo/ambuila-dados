# GOVERNO DE ANGOLA – Portal de Dados de Ambuíla (AMBÚILA DATA)

Next.js 14 (App Router, TypeScript) + Supabase (Postgres, Auth, Storage, RLS).

## Arrancar

1. Cria um projecto no Supabase.
2. **Authentication → Providers → Email → desliga "Allow new users to sign up"** (o cadastro passa só pelo servidor, ver abaixo).
3. SQL Editor, por esta ordem: `supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `supabase/seed.sql`.
   (Se já tinhas corrido uma versão anterior: corre primeiro `supabase/reset.sql`.)
4. `cp .env.example .env.local` e preenche as 4 variáveis.
5. `npm install` → `npm run seed:users` → `npm run dev`.
6. Entra em `/login` com `super@ambuila.uige.gov.ao` (palavra-passe = `SEED_USERS_PASSWORD`).
7. Painel → **23. Conteúdo do portal**: carrega fotos, logótipo e insere destaques.

## Perfis

| Perfil | Pode |
|---|---|
| **Superadministrador** | Tudo. Único que insere destaques, números em grande, notícias e logótipo. |
| **Administrador Municipal** | Validar/publicar tudo, eliminar dados, criar/gerir utilizadores (abaixo dele), activar/ocultar o cadastro, fotos do painel principal, comunas, instituições, auditoria |
| **Administrador Adjunto** | Validar/publicar tudo, instituições, projectos/mapa, auditoria. Não gere utilizadores nem elimina |
| **Director de Turismo e Cultura** | Submete e publica dados de *Cultura e património*; projectos e mapa |
| **Funcionário de Sector** | Submete dados só do seu sector (ficam "Submetido" para validação) |
| **Funcionário Normal** | Só consulta |

Regras aplicadas na base de dados (RLS) e repetidas nas Server Actions. Ajusta em `src/lib/permissions.ts` + `supabase/migrations/0002_rls.sql`.

## Entrada e cadastro

- **1.ª fase:** a tela de cadastro está **visível** por defeito (separador "Cadastrar" no login). Quando o administrador a ocultar, só entra quem já tem conta (criada em *Utilizadores → Criar utilizador*).
- Se já tinhas corrido o SQL antes desta alteração: `update public.site_settings set allow_registration = true;`
- *Utilizadores* tem o interruptor **Tela de cadastro**: quando activo, o login mostra o separador "Cadastrar".
- Quem se cadastra fica **pendente** (Funcionário Normal, inactivo) até um administrador o activar e lhe dar a função.
- O perfil nunca vem do formulário nem dos metadados do Auth: o trigger cria sempre "Funcionário Normal" inactivo.

## Conteúdo do portal

- Fotos do painel principal (rotação automática): Superadministrador e Administrador Municipal.
- Destaques do município, números em grande, notícias, logótipo: só o Superadministrador.
- O portal público não mostra nada que não tenha sido inserido: sem dados fictícios.
- Logótipo: por defeito `https://governo.gov.ao/public/app-assets/img/gov_angola.svg`. Descarrega-o e carrega a tua cópia no painel para não depender desse site; se a imagem falhar aparece um símbolo neutro.

## Estrutura

`src/app/page.tsx` portal público · `src/app/login` entrada/cadastro · `src/app/admin/*` painel · `src/app/admin/actions.ts` acções protegidas · `src/lib/permissions.ts` regras · `supabase/` esquema, RLS, seed.
