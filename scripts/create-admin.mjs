// Cria (ou repõe) a conta de Superadministrador definida em .env.local (ADMIN_EMAIL / ADMIN_PASSWORD).
// Uso: npm run create:admin
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';
if (!url || !key || !email || !password) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL ou ADMIN_PASSWORD em .env.local');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let id;
const { data, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true, user_metadata: { name: 'Administrador' },
});
if (error) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  id = list.data?.users.find((u) => u.email === email)?.id;
  if (!id) { console.error('✗', error.message); process.exit(1); }
  await admin.auth.admin.updateUserById(id, { password, email_confirm: true });
} else id = data.user.id;

const { error: pErr } = await admin.from('profiles').upsert({
  id, name: 'Administrador', email, role: 'Superadministrador', sector: null, active: true,
  requested_role: null, requested_sector: null,
});
if (pErr) { console.error('✗', pErr.message); process.exit(1); }
console.log(`✓ ${email} é Superadministrador (activo, email confirmado).`);
