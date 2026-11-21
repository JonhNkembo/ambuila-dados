import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a SERVICE ROLE: ignora o RLS. Usar APENAS em Server Actions / Route Handlers,
 * depois de validar quem está a pedir. NUNCA importar em componentes cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida no servidor (.env.local).');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
