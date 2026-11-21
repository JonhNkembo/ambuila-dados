// Cria os utilizadores de demonstração (um por função) no Supabase Auth e define função/sector.
// O trigger da BD cria o perfil sempre como "Funcionário Normal" inactivo; aqui promovemos com a service role.
// Uso: npm run seed:users   (precisa de SUPABASE_SERVICE_ROLE_KEY e SEED_USERS_PASSWORD em .env.local)
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_USERS_PASSWORD;
if (!url || !key || !password) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou SEED_USERS_PASSWORD em .env.local');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const GEPE = 'Administração Municipal de Ambuíla (GEPE)';

const users = [
  { name: 'Superadministrador do Sistema', email: 'super@ambuila.uige.gov.ao', role: 'Superadministrador', institution: GEPE },
  { name: 'Dr. António Mateus', email: 'administrador@ambuila.uige.gov.ao', role: 'Administrador Municipal', institution: GEPE },
  { name: 'Eng.ª Joana Nzinga', email: 'adjunto@ambuila.uige.gov.ao', role: 'Administrador Adjunto', institution: GEPE },
  { name: 'MSc. Beatriz Domingos', email: 'turismo.cultura@ambuila.uige.gov.ao', role: 'Director de Turismo e Cultura', institution: 'Direcção Municipal de Turismo e Cultura' },
  { name: 'Prof. Manuel Kiaku', email: 'educacao@ambuila.uige.gov.ao', role: 'Funcionário de Sector', sector: 'Educação', institution: 'Direcção Municipal de Educação de Ambuíla' },
  { name: 'Lic. Pedro Kiala', email: 'funcionario@ambuila.uige.gov.ao', role: 'Funcionário Normal', institution: GEPE },
];

for (const u of users) {
  let id;
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email, password, email_confirm: true,
    user_metadata: { name: u.name, institution: u.institution },
  });
  if (error) {
    // já existe? procurar para actualizar função
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    id = list.data?.users.find((x) => x.email === u.email)?.id;
    if (!id) { console.log(`✗ ${u.email}: ${error.message}`); continue; }
  } else id = data.user.id;

  const { error: pErr } = await admin.from('profiles').upsert({
    id, name: u.name, email: u.email, role: u.role, sector: u.sector ?? null, institution: u.institution, active: true,
  });
  console.log(pErr ? `✗ ${u.email}: ${pErr.message}` : `✓ ${u.email} → ${u.role}${u.sector ? ' (' + u.sector + ')' : ''}`);
}
