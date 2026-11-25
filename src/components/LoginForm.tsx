'use client';
import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus, BarChart3, Map as MapIcon, ShieldCheck, Mail } from 'lucide-react';
import Brand from './Brand';
import { PasswordField } from './ui';
import { createClient } from '@/lib/supabase/client';
import { recordAuth } from '@/app/admin/actions';
import { registerSelf, requestPasswordReset } from '@/app/login/actions';
import { REGISTER_ROLES } from '@/lib/constants';
import type { Role } from '@/lib/types';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z" />
    <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
  </svg>
);

type Tab = 'login' | 'register' | 'forgot';

function Inner({ allowRegistration, firstUser, categories, logoUrl }: { allowRegistration: boolean; firstUser: boolean; categories: string[]; logoUrl: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(firstUser || (allowRegistration && params.get('cadastro') === '1') ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const erro = params.get('erro');
  const [error, setError] = useState(
    erro === 'inactivo' ? 'A sua conta ainda não foi aprovada pelo Superadministrador (ou está inactiva). Assim que for aprovada, poderá entrar.'
    : erro === 'pendente' ? 'Conta confirmada. Aguarda a aprovação do Superadministrador; depois de aprovada, volte aqui e inicie sessão.'
    : erro === 'link' ? 'Ligação de confirmação inválida ou expirada. Faça novo cadastro ou peça reenvio.'
    : erro === 'link-senha' ? 'A ligação de recuperação é inválida ou expirou. Peça uma nova em "Esqueceu a senha?".'
    : erro === 'google' ? 'Não foi possível concluir a autenticação com o Google. Tente de novo.' : '');
  const [info, setInfo] = useState(params.get('ok') === 'senha' ? 'Palavra-passe alterada. Inicie sessão com a nova palavra-passe.' : '');
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [wantedRole, setWantedRole] = useState<Role>('Funcionário Normal');
  const [pending, start] = useTransition();

  const go = (t: Tab) => { setTab(t); setError(''); setInfo(''); };

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setInfo(''); setNotConfirmed(false);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      if (/not confirmed/i.test(error.message)) { setNotConfirmed(true); setError('Ainda não confirmou o email. Abra a ligação que lhe enviámos.'); }
      else setError('Credenciais inválidas. Verifique o email e a palavra-passe.');
      return;
    }
    await recordAuth('login').catch(() => {});
    router.push('/admin');
    router.refresh();
  }

  async function onGoogle() {
    setError(''); setInfo(''); setGLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
    });
    if (error) { setGLoading(false); setError('Não foi possível iniciar a autenticação com o Google. Confirme se o Google está activado no Supabase.'); }
  }

  function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(''); setInfo('');
    start(async () => {
      const r = await registerSelf(fd);
      if (r.ok && r.redirect) { router.push('/admin'); router.refresh(); return; }
      if (r.ok) { setInfo(r.message); form.reset(); setTab('login'); } else setError(r.message);
    });
  }

  function onForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(''); setInfo('');
    start(async () => {
      const r = await requestPasswordReset(fd);
      if (r.ok) setInfo(r.message); else setError(r.message);
    });
  }

  const googleBtn = (
    <>
      <div className="d-flex align-items-center gap-2 my-3 text-muted small"><hr className="flex-grow-1 m-0" />ou<hr className="flex-grow-1 m-0" /></div>
      <button type="button" className="btn btn-light border w-100 d-flex align-items-center justify-content-center gap-2" onClick={onGoogle} disabled={gLoading}>
        <GoogleIcon /> {gLoading ? 'A abrir o Google…' : 'Continuar com Google'}
      </button>
      <div className="form-text text-center">Contas novas ficam pendentes até o Superadministrador as aprovar.</div>
    </>
  );

  const alerts = (
    <>
      {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
      {info && <div className="alert alert-success py-2 small" role="status">{info}</div>}
    </>
  );

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white rounded-3 p-2 d-flex"><Brand logoUrl={logoUrl} height={44} /></div>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.16em', color: '#F7DE8B', fontWeight: 800 }}>GOVERNO DE ANGOLA</div>
            <div className="fw-bold text-uppercase" style={{ fontFamily: 'var(--font-head)', letterSpacing: '0.02em' }}>Portal de Dados de Ambuíla</div>
          </div>
        </div>

        <div>
          <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.8rem, 2.6vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1.12 }}>
            Dados fiáveis para <span style={{ color: '#F7DE8B' }}>decisões públicas</span> melhores.
          </h2>
          <p style={{ color: '#CFE3D6', maxWidth: 440 }} className="mb-4">
            Painel de submissão, validação e publicação da informação estatística, geográfica e sectorial do Município de Ambuíla.
          </p>
          <div className="d-flex flex-column gap-2" style={{ maxWidth: 460 }}>
            <div className="auth-feature"><span className="ic"><BarChart3 size={18} /></span><div><div className="fw-semibold">Indicadores em tempo real</div><div className="small" style={{ color: '#CFE3D6' }}>Dashboards e relatórios calculados a partir dos dados validados.</div></div></div>
            <div className="auth-feature"><span className="ic"><MapIcon size={18} /></span><div><div className="fw-semibold">Mapa territorial</div><div className="small" style={{ color: '#CFE3D6' }}>Escolas, unidades sanitárias e projectos georreferenciados.</div></div></div>
            <div className="auth-feature"><span className="ic"><ShieldCheck size={18} /></span><div><div className="fw-semibold">Validação e auditoria</div><div className="small" style={{ color: '#CFE3D6' }}>Cada submissão é revista e fica registada.</div></div></div>
          </div>
        </div>

        <div className="small" style={{ color: '#A9C4B4' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#F6E7B5' }}>&ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;</span>
          <div className="mt-2">&copy; 2026 Administração Municipal de Ambuíla</div>
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-card">
          <div className="d-flex align-items-center gap-3 mb-4 d-lg-none">
            <Brand logoUrl={logoUrl} height={48} />
            <div>
              <div className="gov-kicker">Governo de Angola</div>
              <div className="portal-title" style={{ fontSize: '1rem' }}>Portal de Dados de Ambuíla</div>
            </div>
          </div>
          <div className="mb-4">
            <h1 className="h4 fw-bold text-inst-dark mb-1">{tab === 'register' ? 'Criar conta' : tab === 'forgot' ? 'Recuperar palavra-passe' : 'Bem-vindo de volta'}</h1>
            <small className="text-muted">Painel Administrativo • Acesso restrito</small>
          </div>

          {firstUser && (
            <div className="alert alert-info py-2 small">
              <strong>Primeiro acesso:</strong> ainda não existe nenhum utilizador. O primeiro cadastro (confirmado por email) cria o <strong>Superadministrador</strong> do portal.
            </div>
          )}

          {allowRegistration && tab !== 'forgot' && (
            <ul className="nav nav-pills nav-fill mb-3 small">
              <li className="nav-item"><button type="button" className={`nav-link ${tab === 'login' ? 'active' : ''}`} onClick={() => go('login')}>Entrar</button></li>
              <li className="nav-item"><button type="button" className={`nav-link ${tab === 'register' ? 'active' : ''}`} onClick={() => go('register')}>Cadastrar</button></li>
            </ul>
          )}

          {tab === 'forgot' ? (
            <form onSubmit={onForgot}>
              <p className="small text-muted">Indique o email da sua conta. Enviaremos uma ligação para definir uma nova palavra-passe.</p>
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="femail">Email</label>
                <input id="femail" name="email" type="email" className="form-control" required autoComplete="email" />
              </div>
              {alerts}
              <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={pending}>
                <Mail size={16} /> {pending ? 'A enviar…' : 'Enviar ligação de recuperação'}
              </button>
              <div className="text-center mt-3"><button type="button" className="btn btn-link btn-sm" onClick={() => go('login')}>← Voltar ao login</button></div>
            </form>
          ) : tab === 'login' || !allowRegistration ? (
            <form onSubmit={onLogin}>
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="email">Email institucional</label>
                <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@ambuila.uige.gov.ao" autoComplete="username" required />
              </div>
              <PasswordField name="password" id="password" label="Palavra-passe" value={password} onChange={setPassword} autoComplete="current-password" className="mb-2" />
              <div className="text-end mb-3"><button type="button" className="btn btn-link btn-sm p-0" onClick={() => go('forgot')}>Esqueceu a senha?</button></div>
              {alerts}
              {notConfirmed && (
                <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={async () => { await createClient().auth.resend({ type: 'signup', email: email.trim() }); setInfo('Email de confirmação reenviado.'); setError(''); }}>Reenviar email de confirmação</button>
              )}
              <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                <LogIn size={16} /> {loading ? 'A autenticar…' : 'Entrar no Painel'}
              </button>
              {googleBtn}
              {!allowRegistration && <p className="small text-muted text-center mt-3 mb-0">O acesso é concedido pela administração municipal.</p>}
            </form>
          ) : (
            <form onSubmit={onRegister}>
              <div className="mb-2"><label className="form-label small fw-semibold">Nome completo *</label><input name="name" className="form-control" required minLength={3} /></div>
              <div className="mb-2"><label className="form-label small fw-semibold">Email *</label><input name="email" type="email" className="form-control" required autoComplete="email" /></div>
              <div className="row g-2 mb-2">
                <div className="col-12 col-sm-7"><label className="form-label small fw-semibold">Instituição / Sector</label><input name="institution" className="form-control" /></div>
                <div className="col-12 col-sm-5"><label className="form-label small fw-semibold">Telefone</label><input name="phone" className="form-control" /></div>
              </div>
              {!firstUser && (
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Perfil pretendido *</label>
                  <select name="requested_role" className="form-select" value={wantedRole} onChange={(e) => setWantedRole(e.target.value as Role)}>
                    {REGISTER_ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  {wantedRole === 'Funcionário de Sector' && (
                    <select name="requested_sector" className="form-select mt-2" required defaultValue="">
                      <option value="" disabled>Sector…</option>{categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  )}
                  <div className="form-text">O perfil é só um pedido: o Superadministrador decide quando aprovar a conta.</div>
                </div>
              )}
              <PasswordField name="password" label="Palavra-passe * (mín. 8)" minLength={8} meter className="mb-2" />
              <PasswordField name="confirm_password" label="Confirmar palavra-passe *" minLength={8} />
              {alerts}
              <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={pending}>
                <UserPlus size={16} /> {pending ? 'A enviar…' : firstUser ? 'Criar Superadministrador' : 'Cadastrar'}
              </button>
              <p className="small text-muted text-center mt-3 mb-0">{firstUser ? 'Enviaremos um email para confirmar a conta.' : 'Vai receber um email para confirmar o endereço. Depois, o Superadministrador aprova a conta e poderá iniciar sessão.'}</p>
              {googleBtn}
            </form>
          )}
          <div className="text-center mt-3"><Link href="/" className="small text-muted">← Voltar ao portal público</Link></div>
        </div>
      </main>
    </div>
  );
}

export default function LoginForm(props: { allowRegistration: boolean; firstUser: boolean; mode?: 'email' | 'approval'; categories: string[]; logoUrl: string }) {
  return <Suspense><Inner allowRegistration={props.allowRegistration} firstUser={props.firstUser} categories={props.categories} logoUrl={props.logoUrl} /></Suspense>;
}
