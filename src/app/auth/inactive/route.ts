import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Route Handler (pode escrever cookies): termina a sessão de uma conta inactiva/pendente
// e volta ao login. Evita o ciclo de redireccionamentos login ⇄ admin.
export async function GET(request: NextRequest) {
  await createClient().auth.signOut();
  return NextResponse.redirect(new URL('/login?erro=inactivo', request.url));
}
