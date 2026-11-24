import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { activateRegisteredUser } from '@/lib/activation';

/** Destino da ligação do email de confirmação: valida o token, activa a conta (se as regras o permitirem) e entra. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const back = (erro: string) => NextResponse.redirect(new URL(`/login?erro=${erro}`, request.url));
  if (!token_hash || (type !== 'signup' && type !== 'email')) return back('link');

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error || !data.user) return back('link');

  if (await activateRegisteredUser(data.user.id)) return NextResponse.redirect(new URL('/admin', request.url));
  await supabase.auth.signOut();
  return back('pendente');
}
