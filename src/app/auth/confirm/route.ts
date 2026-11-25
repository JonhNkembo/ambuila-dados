import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { activateRegisteredUser } from '@/lib/activation';

/**
 * Destino das ligações dos emails (confirmar cadastro, recuperar senha) e do regresso do Google (/auth/callback).
 *  - recuperação  → /redefinir-senha
 *  - cadastro / Google → activa só se for o arranque ou o ADMIN_EMAIL; senão volta ao login como "pendente".
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const recovery = type === 'recovery' || url.searchParams.get('next') === '/redefinir-senha';
  const back = (erro: string) => NextResponse.redirect(new URL(`/login?erro=${erro}`, request.url));
  const bad = recovery ? 'link-senha' : 'link';

  if (url.searchParams.get('error')) return back('google');

  const supabase = createClient();
  const token_hash = url.searchParams.get('token_hash');
  const code = url.searchParams.get('code');
  let userId: string | undefined;

  if (token_hash && (type === 'signup' || type === 'email' || type === 'recovery')) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error || !data.user) return back(bad);
    userId = data.user.id;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) return back(bad);
    userId = data.user.id;
  } else {
    return back(bad);
  }

  if (!userId) return back(bad);
  if (recovery) return NextResponse.redirect(new URL('/redefinir-senha', request.url));
  if (await activateRegisteredUser(userId)) return NextResponse.redirect(new URL('/admin', request.url));
  await supabase.auth.signOut();
  return back('pendente');
}
