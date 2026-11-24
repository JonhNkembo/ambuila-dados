import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Diagnóstico – Portal de Dados de Ambuíla' };

type Row = [string, boolean | null, string];

/** Página de diagnóstico: só mostra "ok/falha" e contagens, nunca chaves nem emails. Apague-a em produção se quiser. */
export default async function DiagnosticoPage() {
  const rows: Row[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  rows.push(['NEXT_PUBLIC_SUPABASE_URL definida', !!url && !url.includes('SEU-PROJECTO'), url ? new URL(url).hostname : 'em falta']);
  rows.push(['NEXT_PUBLIC_SUPABASE_ANON_KEY definida', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('sua-anon'), '']);
  rows.push(['SUPABASE_SERVICE_ROLE_KEY definida (servidor)', !!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('sua-service'), 'necessária para cadastro, criar utilizadores e recuperar contas']);
  rows.push(['ADMIN_EMAIL definido (acesso directo do admin)', !!process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL ? 'ok' : 'opcional']);

  try {
    const sb = createClient();
    const { data, error } = await sb.from('site_settings').select('allow_registration, registration_mode').eq('id', 1).maybeSingle();
    rows.push(['Ligação ao Supabase + tabela site_settings', !error && !!data, error?.message ?? (data ? `cadastro ${data.allow_registration ? 'ACTIVO' : 'desligado'} (modo ${data.registration_mode})` : 'linha id=1 em falta → corra supabase/setup_completo.sql')]);
    const { data: cats, error: cErr } = await sb.from('categories').select('id');
    rows.push(['Tabela categories', !cErr && (cats?.length ?? 0) > 0, cErr?.message ?? `${cats?.length ?? 0} categorias`]);
    const { data: noActive, error: rErr } = await sb.rpc('no_active_users');
    rows.push(['Função no_active_users()', !rErr, rErr?.message ?? (noActive ? 'não há utilizadores activos (o primeiro a entrar fica Superadministrador)' : 'há utilizadores activos')]);
  } catch (e) {
    rows.push(['Ligação ao Supabase', false, (e as Error).message]);
  }

  try {
    const admin = createAdminClient();
    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = list.users;
    const { data: profiles } = await admin.from('profiles').select('id, active, role');
    const active = (profiles ?? []).filter((p: { active: boolean }) => p.active).length;
    const noProfile = users.filter((u) => !(profiles ?? []).some((p: { id: string }) => p.id === u.id)).length;
    rows.push(['Contas no Auth', true, `${users.length} (${users.filter((u) => !u.email_confirmed_at).length} com email por confirmar)`]);
    rows.push(['Perfis activos', active > 0, `${active} activos; ${noProfile} contas sem perfil (são recuperadas ao entrar)`]);
  } catch (e) {
    rows.push(['Leitura de contas (service role)', false, (e as Error).message]);
  }

  return (
    <div className="container py-5" style={{ maxWidth: 820 }}>
      <h1 className="h4 fw-bold text-inst-dark mb-1">Diagnóstico do sistema</h1>
      <p className="text-muted small">Se algo estiver a vermelho, é isso que impede o acesso. <a href="/login">Ir para o login</a></p>
      <div className="inst-card overflow-hidden">
        <table className="table mb-0 align-middle small">
          <tbody>
            {rows.map(([k, ok, detail]) => (
              <tr key={k}>
                <td style={{ width: 28 }}>{ok === null ? '•' : ok ? '✅' : '❌'}</td>
                <td className="fw-semibold">{k}</td>
                <td className="text-muted">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
